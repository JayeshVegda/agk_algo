"use server";

import { getDb, payments, paymentNetworks, enrolments, botLicenses } from "@akg/db";
import { eq, and } from "drizzle-orm";
import { requireUser, requireAdmin } from "@/lib/guards";
import { writeAudit } from "@/lib/audit";
import { validatePaymentTransition } from "@akg/core";
import crypto from "node:crypto";

export async function createInvoiceAction(params: {
  orderType: "enrolment" | "bot_purchase";
  orderId: string;
  networkId: string;
  amountMinor: number;
}) {
  const ctx = await requireUser();
  const db = getDb();

  const networkRows = await db
    .select()
    .from(paymentNetworks)
    .where(and(eq(paymentNetworks.id, params.networkId), eq(paymentNetworks.enabled, true)))
    .limit(1);

  if (networkRows.length === 0) {
    throw new Error("Selected payment network is unavailable");
  }

  const network = networkRows[0];
  const expiresAt = new Date(Date.now() + network.invoiceTtlMinutes * 60 * 1000);

  const [payment] = await db
    .insert(payments)
    .values({
      userId: ctx.user.id,
      orderType: params.orderType,
      orderId: params.orderId,
      amountMinor: params.amountMinor,
      networkId: network.id,
      asset: network.asset,
      provider: "manual_txid",
      status: "pending",
      expiresAt,
    })
    .returning();

  return { payment, network };
}

export async function submitTxidAction(paymentId: string, txid: string) {
  const ctx = await requireUser();
  const db = getDb();

  const cleanTxid = txid.trim();
  if (!cleanTxid) {
    throw new Error("Transaction hash (TXID) is required");
  }

  const rows = await db
    .select()
    .from(payments)
    .where(and(eq(payments.id, paymentId), eq(payments.userId, ctx.user.id)))
    .limit(1);

  if (rows.length === 0) {
    throw new Error("Payment record not found");
  }

  const payment = rows[0];
  if (payment.status !== "pending") {
    throw new Error(`Cannot submit TXID for payment in '${payment.status}' state`);
  }

  if (new Date() > payment.expiresAt) {
    await db
      .update(payments)
      .set({ status: "expired" })
      .where(eq(payments.id, payment.id));
    throw new Error("This payment invoice has expired. Please create a new order.");
  }

  validatePaymentTransition(payment.status, "awaiting_confirmations");

  const [updated] = await db
    .update(payments)
    .set({
      txid: cleanTxid,
      status: "awaiting_confirmations",
      updatedAt: new Date(),
    })
    .where(eq(payments.id, payment.id))
    .returning();

  return updated;
}

export async function approvePaymentAction(paymentId: string) {
  const adminCtx = await requireAdmin();
  const db = getDb();

  // Execute confirmation atomically
  return await db.transaction(async (tx) => {
    const rows = await tx
      .select()
      .from(payments)
      .where(eq(payments.id, paymentId))
      .for("update");

    if (rows.length === 0) {
      throw new Error("Payment not found");
    }

    const payment = rows[0];

    // Idempotency check: If already confirmed, return successfully
    if (payment.status === "confirmed") {
      return payment;
    }

    validatePaymentTransition(payment.status, "confirmed");

    const [confirmedPayment] = await tx
      .update(payments)
      .set({
        status: "confirmed",
        confirmedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(payments.id, payment.id))
      .returning();

    // Fulfill order
    if (payment.orderType === "enrolment" && payment.orderId) {
      // Find enrolment or create paid enrolment
      await tx
        .update(enrolments)
        .set({
          status: "paid",
          paymentId: payment.id,
          updatedAt: new Date(),
        })
        .where(eq(enrolments.id, payment.orderId));
    } else if (payment.orderType === "bot_purchase" && payment.orderId) {
      // Generate unique license key: AKG-XXXX-XXXX-XXXX
      const randomSegment = () => crypto.randomBytes(3).toString("hex").toUpperCase();
      const licenseKey = `AKG-${randomSegment()}-${randomSegment()}-${randomSegment()}`;

      await tx.insert(botLicenses).values({
        userId: payment.userId,
        botId: payment.orderId,
        licenseKey,
        status: "active",
      });
    }

    await writeAudit({
      actorId: adminCtx.user.id,
      action: "payment.approve",
      entityType: "payment",
      entityId: payment.id,
      diff: {
        orderType: payment.orderType,
        amountMinor: payment.amountMinor,
        txid: payment.txid,
      },
    });

    return confirmedPayment;
  });
}

export async function rejectPaymentAction(paymentId: string, reason?: string) {
  const adminCtx = await requireAdmin();
  const db = getDb();

  const [rejected] = await db
    .update(payments)
    .set({
      status: "rejected",
      updatedAt: new Date(),
    })
    .where(eq(payments.id, paymentId))
    .returning();

  await writeAudit({
    actorId: adminCtx.user.id,
    action: "payment.reject",
    entityType: "payment",
    entityId: paymentId,
    diff: { reason: reason || "Administrative rejection" },
  });

  return rejected;
}
