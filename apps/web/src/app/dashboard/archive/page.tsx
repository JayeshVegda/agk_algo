import { requireUser } from "@/lib/guards";
import { getDb, signals, signalOutcomes } from "@akg/db";
import { eq, desc } from "drizzle-orm";
import { computeMonthlySignalSummary } from "@akg/core";
import { getSetting } from "@/lib/settings";

export default async function ArchivePage() {
  await requireUser();
  const db = getDb();

  // Check archive visibility setting
  const _archiveVisibleWhenInactive = await getSetting("archive_visible_when_inactive");

  // Load signals with their recorded outcomes
  const signalRows = await db
    .select({
      id: signals.id,
      symbol: signals.symbol,
      direction: signals.direction,
      planTier: signals.planTier,
      publishedAt: signals.publishedAt,
      outcome: signalOutcomes.outcome,
      resultPips: signalOutcomes.resultPips,
      resultR: signalOutcomes.resultR,
      closedAt: signalOutcomes.closedAt,
    })
    .from(signals)
    .leftJoin(signalOutcomes, eq(signals.id, signalOutcomes.signalId))
    .where(eq(signals.status, "published"))
    .orderBy(desc(signals.publishedAt));

  const signalsWithOutcomes = signalRows.map((s) => ({
    id: s.id,
    symbol: s.symbol,
    direction: s.direction as "BUY" | "SELL",
    planTier: s.planTier as "SR_SIGNAL_BOX" | "PERFECT_SIGNAL_BOX",
    publishedAt: s.publishedAt,
    outcome: s.outcome
      ? {
          outcome: s.outcome as "win" | "loss" | "breakeven" | "cancelled",
          resultPips: s.resultPips,
          resultR: s.resultR,
          closedAt: s.closedAt,
        }
      : null,
  }));

  const summary = computeMonthlySignalSummary(signalsWithOutcomes);

  return (
    <div className="space-y-8 font-mono">
      <div>
        <div className="text-xs uppercase text-primary tracking-widest">Historical Performance</div>
        <h1 className="text-2xl font-bold mt-1">Monthly Signal Archive</h1>
        <p className="text-xs text-muted-foreground mt-1">
          Verifiable mathematical summaries computed directly from closed signal records.
        </p>
      </div>

      {/* Computed Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-lg border border-border bg-card p-4 space-y-1">
          <div className="text-[10px] text-muted-foreground uppercase">Win Rate</div>
          <div className="text-2xl font-bold text-primary">{summary.winRatePercent}%</div>
          <div className="text-[10px] text-muted-foreground">
            {summary.wins}W - {summary.losses}L
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-4 space-y-1">
          <div className="text-[10px] text-muted-foreground uppercase">Net Pips</div>
          <div
            className={`text-2xl font-bold ${
              summary.totalPips >= 0 ? "text-green-400" : "text-destructive"
            }`}
          >
            {summary.totalPips > 0 ? `+${summary.totalPips}` : summary.totalPips}
          </div>
          <div className="text-[10px] text-muted-foreground">Accumulated pips</div>
        </div>

        <div className="rounded-lg border border-border bg-card p-4 space-y-1">
          <div className="text-[10px] text-muted-foreground uppercase">Total R (Risk Multiple)</div>
          <div className="text-2xl font-bold text-foreground">
            {summary.totalR > 0 ? `+${summary.totalR}R` : `${summary.totalR}R`}
          </div>
          <div className="text-[10px] text-muted-foreground">Net risk:reward</div>
        </div>

        <div className="rounded-lg border border-border bg-card p-4 space-y-1">
          <div className="text-[10px] text-muted-foreground uppercase">Closed / Total</div>
          <div className="text-2xl font-bold text-foreground">
            {summary.closedCount} / {summary.totalCount}
          </div>
          <div className="text-[10px] text-muted-foreground">
            {summary.breakeven} BE, {summary.cancelled} Cancelled
          </div>
        </div>
      </div>

      {/* Signals Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="p-4 border-b border-border/40 font-bold text-sm">Signal History</div>
        {signalRows.length === 0 ? (
          <div className="p-8 text-center text-xs text-muted-foreground">
            No historical signals recorded in this period.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-accent/40 text-muted-foreground uppercase text-[10px]">
                <tr>
                  <th className="p-3">Symbol</th>
                  <th className="p-3">Direction</th>
                  <th className="p-3">Tier</th>
                  <th className="p-3">Outcome</th>
                  <th className="p-3">Pips</th>
                  <th className="p-3">R-Multiple</th>
                  <th className="p-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                {signalRows.map((s) => (
                  <tr key={s.id} className="hover:bg-accent/20">
                    <td className="p-3 font-bold">{s.symbol}</td>
                    <td className="p-3">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          s.direction === "BUY"
                            ? "bg-green-500/20 text-green-400"
                            : "bg-red-500/20 text-red-400"
                        }`}
                      >
                        {s.direction}
                      </span>
                    </td>
                    <td className="p-3 text-[11px] text-muted-foreground">
                      {s.planTier === "SR_SIGNAL_BOX" ? "SR" : "Perfect"}
                    </td>
                    <td className="p-3 font-semibold uppercase">
                      {s.outcome ? (
                        <span
                          className={
                            s.outcome === "win"
                              ? "text-green-400"
                              : s.outcome === "loss"
                                ? "text-destructive"
                                : "text-muted-foreground"
                          }
                        >
                          {s.outcome}
                        </span>
                      ) : (
                        <span className="text-yellow-500">OPEN</span>
                      )}
                    </td>
                    <td className="p-3 font-mono">
                      {s.resultPips != null
                        ? s.resultPips > 0
                          ? `+${s.resultPips}`
                          : s.resultPips
                        : "—"}
                    </td>
                    <td className="p-3 font-mono">
                      {s.resultR != null
                        ? s.resultR > 0
                          ? `+${s.resultR}R`
                          : `${s.resultR}R`
                        : "—"}
                    </td>
                    <td className="p-3 text-muted-foreground text-[11px]">
                      {s.publishedAt ? new Date(s.publishedAt).toLocaleDateString() : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
