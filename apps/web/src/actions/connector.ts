"use server";

import { getDb, connectorRequests } from "@akg/db";
import { eq, and } from "drizzle-orm";
import { requireUser, requireAdmin } from "@/lib/guards";
import { writeAudit } from "@/lib/audit";
import { encryptConnectorSecret, decryptConnectorSecret } from "@/lib/connector-crypto";

export async function submitConnectorDemoAction(params: {
  platform: "MT4" | "MT5";
  accountNumber: string;
  server: string;
  masterPassword: string;
}) {
  const ctx = await requireUser();
  const db = getDb();

  // Strict constraint from docs/00-PRODUCT.md and docs/02-BUSINESS-RULES.md:
  // The platform never connects to real brokers. CONNECTOR_REAL_MODE is false.
  const encrypted = encryptConnectorSecret(params.masterPassword);

  const [request] = await db
    .insert(connectorRequests)
    .values({
      userId: ctx.user.id,
      platform: params.platform,
      accountNumber: params.accountNumber.trim(),
      server: params.server.trim(),
      secretCiphertext: encrypted.ciphertext,
      secretNonce: encrypted.nonce,
      keyVersion: encrypted.keyVersion,
      status: "pending",
    })
    .returning();

  return {
    id: request.id,
    platform: request.platform,
    accountNumber: request.accountNumber,
    server: request.server,
    status: request.status,
    maskedPassword: "••••••••••••",
    createdAt: request.createdAt,
  };
}

export async function deleteConnectorDemoAction(requestId: string) {
  const ctx = await requireUser();
  const db = getDb();

  // Hard delete of ciphertext per docs/02-BUSINESS-RULES.md
  await db
    .delete(connectorRequests)
    .where(and(eq(connectorRequests.id, requestId), eq(connectorRequests.userId, ctx.user.id)));

  return { success: true };
}

export async function adminDecryptConnectorAction(requestId: string) {
  const adminCtx = await requireAdmin();
  const db = getDb();

  const rows = await db
    .select()
    .from(connectorRequests)
    .where(eq(connectorRequests.id, requestId))
    .limit(1);

  if (rows.length === 0) {
    throw new Error("Connector demo request not found");
  }

  const req = rows[0];
  const decrypted = decryptConnectorSecret({
    ciphertext: req.secretCiphertext,
    nonce: req.secretNonce,
    keyVersion: req.keyVersion,
  });

  // Strictly audit-log credential access
  await writeAudit({
    actorId: adminCtx.user.id,
    action: "connector.decrypt_credentials",
    entityType: "connector_request",
    entityId: req.id,
  });

  return {
    accountNumber: req.accountNumber,
    server: req.server,
    decryptedSecret: decrypted,
  };
}
