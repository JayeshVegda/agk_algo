"use server";

import { getDb, signals, signalOutcomes } from "@akg/db";
import { eq, desc } from "drizzle-orm";
import { requireAdmin, requireSignalAccess } from "@/lib/guards";
import { writeAudit } from "@/lib/audit";
import type { PlanTier } from "@akg/core";

export async function publishSignalAction(params: {
  symbol: string;
  direction: "BUY" | "SELL";
  entry: string;
  stopLoss: string;
  takeProfits: string[];
  planTier: "SR_SIGNAL_BOX" | "PERFECT_SIGNAL_BOX";
  note?: string;
  imageFileId?: string;
}) {
  const adminCtx = await requireAdmin();
  const db = getDb();

  const [signal] = await db
    .insert(signals)
    .values({
      symbol: params.symbol.toUpperCase(),
      direction: params.direction,
      entry: params.entry,
      stopLoss: params.stopLoss,
      takeProfits: params.takeProfits,
      planTier: params.planTier,
      note: params.note || null,
      imageFileId: params.imageFileId || null,
      status: "published",
      publishedAt: new Date(),
      createdBy: adminCtx.user.id,
    })
    .returning();

  await writeAudit({
    actorId: adminCtx.user.id,
    action: "signal.publish",
    entityType: "signal",
    entityId: signal.id,
    diff: { symbol: signal.symbol, direction: signal.direction, tier: signal.planTier },
  });

  return signal;
}

export async function cancelSignalAction(signalId: string) {
  const adminCtx = await requireAdmin();
  const db = getDb();

  const [cancelled] = await db
    .update(signals)
    .set({ status: "cancelled", updatedAt: new Date() })
    .where(eq(signals.id, signalId))
    .returning();

  await writeAudit({
    actorId: adminCtx.user.id,
    action: "signal.cancel",
    entityType: "signal",
    entityId: signalId,
  });

  return cancelled;
}

export async function recordOutcomeAction(params: {
  signalId: string;
  outcome: "win" | "loss" | "breakeven" | "cancelled";
  resultPips?: number;
  resultR?: number;
  note?: string;
}) {
  const adminCtx = await requireAdmin();
  const db = getDb();

  const [outcomeRow] = await db
    .insert(signalOutcomes)
    .values({
      signalId: params.signalId,
      outcome: params.outcome,
      resultPips: params.resultPips || null,
      resultR: params.resultR || null,
      note: params.note || null,
      closedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: signalOutcomes.signalId,
      set: {
        outcome: params.outcome,
        resultPips: params.resultPips || null,
        resultR: params.resultR || null,
        note: params.note || null,
        closedAt: new Date(),
      },
    })
    .returning();

  await writeAudit({
    actorId: adminCtx.user.id,
    action: "signal.outcome",
    entityType: "signal",
    entityId: params.signalId,
    diff: { outcome: params.outcome, pips: params.resultPips, r: params.resultR },
  });

  return outcomeRow;
}

export async function getTodaySignalsAction(planTier: PlanTier) {
  // Enforces authorization: strictly required signal access
  await requireSignalAccess(planTier);
  const db = getDb();

  // Return published signals ordered by newest first
  return await db
    .select()
    .from(signals)
    .where(eq(signals.planTier, planTier))
    .orderBy(desc(signals.publishedAt))
    .limit(20);
}
