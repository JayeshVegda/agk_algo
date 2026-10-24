"use server";

import { getDb, bots, botLicenses } from "@akg/db";
import { eq, and } from "drizzle-orm";
import { requireAdmin, requireUser } from "@/lib/guards";
import { writeAudit } from "@/lib/audit";
import crypto from "node:crypto";

const MAX_REBINDS = 3;

export async function createBotAction(params: {
  name: string;
  description: string;
  platform: "MT4" | "MT5" | "both";
  priceMinor: number;
}) {
  const adminCtx = await requireAdmin();
  const db = getDb();

  const [bot] = await db
    .insert(bots)
    .values({
      name: params.name,
      description: params.description,
      platform: params.platform,
      priceMinor: params.priceMinor,
      currency: "USD",
      active: true,
    })
    .returning();

  await writeAudit({
    actorId: adminCtx.user.id,
    action: "bot.create",
    entityType: "bot",
    entityId: bot.id,
    diff: { name: bot.name, platform: bot.platform, priceMinor: bot.priceMinor },
  });

  return bot;
}

export async function bindBotAccountAction(licenseId: string, accountNumber: string) {
  const ctx = await requireUser();
  const db = getDb();

  const rows = await db
    .select()
    .from(botLicenses)
    .where(and(eq(botLicenses.id, licenseId), eq(botLicenses.userId, ctx.user.id)))
    .limit(1);

  if (rows.length === 0) {
    throw new Error("License not found");
  }

  const license = rows[0];
  if (license.status !== "active") {
    throw new Error("Cannot bind account to a revoked license");
  }

  if (license.rebindCount >= MAX_REBINDS) {
    throw new Error(
      `Rebind limit exceeded (${MAX_REBINDS} rebinds maximum). Please contact administration to reset.`,
    );
  }

  const [updated] = await db
    .update(botLicenses)
    .set({
      boundAccountNumber: accountNumber.trim(),
      rebindCount: license.rebindCount + 1,
      updatedAt: new Date(),
    })
    .where(eq(botLicenses.id, licenseId))
    .returning();

  return updated;
}

export async function getSignedBotDownloadUrlAction(licenseId: string) {
  const ctx = await requireUser();
  const db = getDb();

  const rows = await db
    .select()
    .from(botLicenses)
    .where(and(eq(botLicenses.id, licenseId), eq(botLicenses.userId, ctx.user.id)))
    .limit(1);

  if (rows.length === 0) {
    throw new Error("License not found");
  }

  const license = rows[0];
  if (license.status !== "active") {
    throw new Error("License has been revoked");
  }

  const expires = Date.now() + 5 * 60 * 1000; // 5 minutes
  const secret = process.env.DOWNLOAD_URL_SIGNING_SECRET || "default-download-secret";
  const signature = crypto
    .createHmac("sha256", secret)
    .update(`${license.id}:${expires}`)
    .digest("hex");

  return {
    downloadUrl: `/api/downloads/bot?licenseId=${license.id}&expires=${expires}&sig=${signature}`,
    expiresAt: new Date(expires).toISOString(),
  };
}
