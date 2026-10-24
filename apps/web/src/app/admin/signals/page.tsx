import { requireAdmin } from "@/lib/guards";
import { getDb, signals, signalOutcomes } from "@akg/db";
import { eq, desc } from "drizzle-orm";
import AdminSignalsClient from "./signals-admin";

export default async function AdminSignalsPage() {
  await requireAdmin();
  const db = getDb();

  const allSignals = await db
    .select({
      id: signals.id,
      symbol: signals.symbol,
      direction: signals.direction,
      entry: signals.entry,
      stopLoss: signals.stopLoss,
      takeProfits: signals.takeProfits,
      planTier: signals.planTier,
      status: signals.status,
      note: signals.note,
      publishedAt: signals.publishedAt,
      outcome: signalOutcomes.outcome,
      resultPips: signalOutcomes.resultPips,
      resultR: signalOutcomes.resultR,
    })
    .from(signals)
    .leftJoin(signalOutcomes, eq(signals.id, signalOutcomes.signalId))
    .orderBy(desc(signals.createdAt));

  return (
    <div className="space-y-8 font-mono">
      <div>
        <div className="text-xs uppercase text-primary tracking-widest">Signal Feed Dispatch</div>
        <h1 className="text-2xl font-bold mt-1">Signals Publisher & Outcomes</h1>
        <p className="text-xs text-muted-foreground mt-1">
          Publish algorithmic trade signals directly to subscribers and record verifiable trade outcomes.
        </p>
      </div>

      <AdminSignalsClient signals={allSignals} />
    </div>
  );
}
