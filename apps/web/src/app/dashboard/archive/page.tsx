import { requireUser } from "@/lib/guards";
import { getDb, signals, signalOutcomes } from "@akg/db";
import { eq, desc } from "drizzle-orm";
import { computeMonthlySignalSummary } from "@akg/core";
import { getSetting } from "@/lib/settings";

export const dynamic = "force-dynamic";

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
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b border-border/40 pb-5">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-blue-400 border border-blue-500/20">
          <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-pulse" />
          Mathematical Transparency
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground mt-1">
          Monthly Signal Performance Archive
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Verifiable mathematical summaries computed deterministically from closed trade records
        </p>
      </div>

      {/* Computed Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-border/80 bg-card/80 p-5 space-y-1">
          <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
            Total Setups
          </div>
          <div className="text-3xl font-extrabold font-mono text-foreground tabular-nums">
            {summary.totalCount}
          </div>
          <div className="text-[11px] text-muted-foreground">Published algorithmic setups</div>
        </div>

        <div className="rounded-2xl border border-border/80 bg-card/80 p-5 space-y-1">
          <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
            Win Rate
          </div>
          <div className="text-3xl font-extrabold font-mono text-emerald-400 tabular-nums">
            {summary.winRatePercent.toFixed(1)}%
          </div>
          <div className="text-[11px] text-muted-foreground">
            {summary.wins} Wins · {summary.losses} Losses
          </div>
        </div>

        <div className="rounded-2xl border border-border/80 bg-card/80 p-5 space-y-1">
          <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
            Net Pips
          </div>
          <div
            className={`text-3xl font-extrabold font-mono tabular-nums ${
              summary.totalPips >= 0 ? "text-emerald-400" : "text-rose-400"
            }`}
          >
            {summary.totalPips >= 0 ? `+${summary.totalPips}` : summary.totalPips}
          </div>
          <div className="text-[11px] text-muted-foreground">Total accumulated pips</div>
        </div>

        <div className="rounded-2xl border border-border/80 bg-card/80 p-5 space-y-1">
          <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
            Net Risk:Reward
          </div>
          <div
            className={`text-3xl font-extrabold font-mono tabular-nums ${
              summary.totalR >= 0 ? "text-emerald-400" : "text-rose-400"
            }`}
          >
            {summary.totalR >= 0 ? `+${summary.totalR.toFixed(2)}R` : `${summary.totalR.toFixed(2)}R`}
          </div>
          <div className="text-[11px] text-muted-foreground">Cumulative realized return</div>
        </div>
      </div>

      {/* Signal Archive Table */}
      <div className="rounded-2xl border border-border/80 bg-card/90 backdrop-blur overflow-hidden shadow-lg">
        <div className="p-5 border-b border-border/40">
          <h2 className="font-bold text-sm text-foreground">Executed Trade Records</h2>
          <p className="text-[11px] text-muted-foreground">
            Audit-ready log of all closed and active signals
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-secondary/40 text-muted-foreground uppercase text-[10px] font-mono">
              <tr>
                <th className="p-3.5">Asset</th>
                <th className="p-3.5">Direction</th>
                <th className="p-3.5">Plan Tier</th>
                <th className="p-3.5">Outcome</th>
                <th className="p-3.5">Result (Pips)</th>
                <th className="p-3.5">Result (R)</th>
                <th className="p-3.5">Published Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {signalRows.map((s) => (
                <tr key={s.id} className="hover:bg-secondary/30 transition-colors">
                  <td className="p-3.5 font-bold font-mono text-foreground">{s.symbol}</td>
                  <td className="p-3.5">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono ${
                        s.direction === "BUY"
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                          : "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                      }`}
                    >
                      {s.direction}
                    </span>
                  </td>
                  <td className="p-3.5 text-muted-foreground">
                    {s.planTier === "SR_SIGNAL_BOX" ? "SR Tier" : "Perfect Tier"}
                  </td>
                  <td className="p-3.5">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono ${
                        s.outcome === "win"
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                          : s.outcome === "loss"
                            ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                            : "bg-secondary text-muted-foreground"
                      }`}
                    >
                      {s.outcome || "Pending"}
                    </span>
                  </td>
                  <td className="p-3.5 font-mono tabular-nums">
                    {s.resultPips !== null
                      ? s.resultPips > 0
                        ? `+${s.resultPips}`
                        : s.resultPips
                      : "—"}
                  </td>
                  <td className="p-3.5 font-mono tabular-nums">
                    {s.resultR !== null
                      ? s.resultR > 0
                        ? `+${Number(s.resultR).toFixed(2)}R`
                        : `${Number(s.resultR).toFixed(2)}R`
                      : "—"}
                  </td>
                  <td className="p-3.5 text-muted-foreground text-[11px] font-mono">
                    {s.publishedAt ? new Date(s.publishedAt).toLocaleDateString() : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
