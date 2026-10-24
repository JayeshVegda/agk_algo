"use server";

import { getDb, cycles, cyclePlanPrices, enrolments, plans, payments, paymentNetworks } from "@akg/db";
import { eq, and } from "drizzle-orm";
import { requireAdmin, requireUser } from "@/lib/guards";
import { writeAudit } from "@/lib/audit";
import {
  validateCycleDates,
  validateCycleOverlap,
  validateCycleStatusTransition,
  isUserEligibleForRenewal,
  type CycleStatus,
} from "@akg/core";
import { getSetting } from "@/lib/settings";

export async function createCycleAction(params: {
  name: string;
  startsOn: string;
  endsOn: string;
  allowOverlapOverride?: boolean;
  prices: { planCode: "SR_SIGNAL_BOX" | "PERFECT_SIGNAL_BOX"; priceMinor: number }[];
}) {
  const adminCtx = await requireAdmin();
  const db = getDb();

  validateCycleDates({ startsOn: params.startsOn, endsOn: params.endsOn });

  const existingCycles = await db.select().from(cycles);
  validateCycleOverlap(
    { startsOn: params.startsOn, endsOn: params.endsOn },
    existingCycles.map((c) => ({
      id: c.id,
      name: c.name,
      startsOn: c.startsOn,
      endsOn: c.endsOn,
      status: c.status as CycleStatus,
    })),
    !!params.allowOverlapOverride,
  );

  const [cycle] = await db
    .insert(cycles)
    .values({
      name: params.name,
      startsOn: params.startsOn,
      endsOn: params.endsOn,
      status: "draft",
      allowMidCycleJoinOverride: !!params.allowOverlapOverride,
    })
    .returning();

  for (const p of params.prices) {
    const planRows = await db.select().from(plans).where(eq(plans.code, p.planCode)).limit(1);
    if (planRows.length > 0) {
      await db.insert(cyclePlanPrices).values({
        cycleId: cycle.id,
        planId: planRows[0].id,
        priceMinor: p.priceMinor,
        currency: "USD",
      });
    }
  }

  await writeAudit({
    actorId: adminCtx.user.id,
    action: "cycle.create",
    entityType: "cycle",
    entityId: cycle.id,
    diff: { name: cycle.name, startsOn: cycle.startsOn, endsOn: cycle.endsOn },
  });

  return cycle;
}

export async function updateCycleStatusAction(cycleId: string, toStatus: CycleStatus) {
  const adminCtx = await requireAdmin();
  const db = getDb();

  const rows = await db.select().from(cycles).where(eq(cycles.id, cycleId)).limit(1);
  if (rows.length === 0) {
    throw new Error("Cycle not found");
  }

  const currentStatus = rows[0].status as CycleStatus;
  validateCycleStatusTransition(currentStatus, toStatus);

  const [updated] = await db
    .update(cycles)
    .set({ status: toStatus, updatedAt: new Date() })
    .where(eq(cycles.id, cycleId))
    .returning();

  await writeAudit({
    actorId: adminCtx.user.id,
    action: "cycle.updateStatus",
    entityType: "cycle",
    entityId: cycleId,
    diff: { from: currentStatus, to: toStatus },
  });

  return updated;
}

export async function enrolInCycleAction(params: {
  cycleId: string;
  planCode: "SR_SIGNAL_BOX" | "PERFECT_SIGNAL_BOX";
  networkId: string;
}) {
  const ctx = await requireUser();
  const db = getDb();

  const cycleRows = await db.select().from(cycles).where(eq(cycles.id, params.cycleId)).limit(1);
  if (cycleRows.length === 0) {
    throw new Error("Cycle not found");
  }
  const cycle = cycleRows[0];

  // 1. Check mid-cycle join rules
  if (cycle.status === "running") {
    const globalAllowMidJoin = await getSetting("allow_mid_cycle_join");
    if (!globalAllowMidJoin && !cycle.allowMidCycleJoinOverride) {
      throw new Error(
        "Mid-cycle joining is disabled for this cycle. Please wait for the next renewal window.",
      );
    }
  } else if (cycle.status === "renewal_open") {
    // Check previous member priority
    const userPastPaid = await db
      .select()
      .from(enrolments)
      .where(and(eq(enrolments.userId, ctx.user.id), eq(enrolments.status, "paid")))
      .limit(1);

    const eligible = isUserEligibleForRenewal(
      userPastPaid.length > 0,
      cycle.renewalAudience as "previous_members" | "everyone",
    );
    if (!eligible) {
      throw new Error(
        "Renewal priority is currently reserved for previous members. General registration opens soon.",
      );
    }
  } else {
    throw new Error(`Enrolment is unavailable when cycle status is '${cycle.status}'`);
  }

  // 2. Fetch Plan & Pricing
  const planRows = await db.select().from(plans).where(eq(plans.code, params.planCode)).limit(1);
  if (planRows.length === 0) {
    throw new Error("Requested plan not found");
  }
  const plan = planRows[0];

  const priceRows = await db
    .select()
    .from(cyclePlanPrices)
    .where(and(eq(cyclePlanPrices.cycleId, cycle.id), eq(cyclePlanPrices.planId, plan.id)))
    .limit(1);

  const priceMinor = priceRows.length > 0 ? priceRows[0].priceMinor : 1000; // $10 fallback

  // 3. Create or reuse pending enrolment
  let enrolmentId: string;
  const existingEnrolment = await db
    .select()
    .from(enrolments)
    .where(
      and(
        eq(enrolments.userId, ctx.user.id),
        eq(enrolments.cycleId, cycle.id),
        eq(enrolments.planId, plan.id),
      ),
    )
    .limit(1);

  if (existingEnrolment.length > 0) {
    if (existingEnrolment[0].status === "paid") {
      throw new Error("You already hold an active paid enrolment in this cycle.");
    }
    enrolmentId = existingEnrolment[0].id;
  } else {
    const [newEnrolment] = await db
      .insert(enrolments)
      .values({
        userId: ctx.user.id,
        cycleId: cycle.id,
        planId: plan.id,
        status: "pending",
      })
      .returning();
    enrolmentId = newEnrolment.id;
  }

  // 4. Create Payment Invoice
  const networkRows = await db
    .select()
    .from(paymentNetworks)
    .where(and(eq(paymentNetworks.id, params.networkId), eq(paymentNetworks.enabled, true)))
    .limit(1);

  if (networkRows.length === 0) {
    throw new Error("Payment network unavailable");
  }
  const network = networkRows[0];
  const expiresAt = new Date(Date.now() + network.invoiceTtlMinutes * 60 * 1000);

  const [payment] = await db
    .insert(payments)
    .values({
      userId: ctx.user.id,
      orderType: "enrolment",
      orderId: enrolmentId,
      amountMinor: priceMinor,
      networkId: network.id,
      asset: network.asset,
      provider: "manual_txid",
      status: "pending",
      expiresAt,
    })
    .returning();

  await db
    .update(enrolments)
    .set({ paymentId: payment.id })
    .where(eq(enrolments.id, enrolmentId));

  return { enrolmentId, paymentId: payment.id };
}
