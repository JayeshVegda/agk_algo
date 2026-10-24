"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { publishSignalAction, cancelSignalAction, recordOutcomeAction } from "@/actions/signals";

interface SignalItem {
  id: string;
  symbol: string;
  direction: string;
  entry: string;
  stopLoss: string;
  takeProfits: unknown;
  planTier: string;
  status: string;
  note: string | null;
  publishedAt: Date | string | null;
  outcome: string | null;
  resultPips: number | null;
  resultR: number | null;
}

export default function AdminSignalsClient({ signals }: { signals: SignalItem[] }) {
  const router = useRouter();
  const [symbol, setSymbol] = useState("EURUSD");
  const [direction, setDirection] = useState<"BUY" | "SELL">("BUY");
  const [entry, setEntry] = useState("");
  const [stopLoss, setStopLoss] = useState("");
  const [tpInput, setTpInput] = useState("");
  const [planTier, setPlanTier] = useState<"SR_SIGNAL_BOX" | "PERFECT_SIGNAL_BOX">("PERFECT_SIGNAL_BOX");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const takeProfits = tpInput
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    try {
      await publishSignalAction({
        symbol,
        direction,
        entry,
        stopLoss,
        takeProfits,
        planTier,
        note: note || undefined,
      });

      setEntry("");
      setStopLoss("");
      setTpInput("");
      setNote("");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to publish signal");
    } finally {
      setLoading(false);
    }
  };

  const handleOutcome = async (signalId: string) => {
    const outcome = prompt("Outcome (win / loss / breakeven / cancelled):");
    if (!outcome) return;

    const pipsStr = prompt("Net Pips (e.g. 50 or -25):", "0");
    const rStr = prompt("Risk-to-Reward Multiple R (e.g. 2 or -1):", "1");

    try {
      await recordOutcomeAction({
        signalId,
        outcome: outcome.toLowerCase() as "win" | "loss" | "breakeven" | "cancelled",
        resultPips: pipsStr ? Number(pipsStr) : 0,
        resultR: rStr ? Number(rStr) : 0,
      });
      router.refresh();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to record outcome");
    }
  };

  const handleCancel = async (signalId: string) => {
    if (!confirm("Are you sure you want to cancel this published signal?")) return;
    try {
      await cancelSignalAction(signalId);
      router.refresh();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to cancel signal");
    }
  };

  return (
    <div className="space-y-8">
      {/* Create Signal Form */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <h3 className="font-bold text-sm">Publish New Algorithmic Signal</h3>

        {error && (
          <div className="rounded border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">
            {error}
          </div>
        )}

        <form onSubmit={handlePublish} className="space-y-4 text-xs">
          <div className="grid md:grid-cols-4 gap-4">
            <div>
              <label className="text-muted-foreground block mb-1">Symbol</label>
              <input
                type="text"
                required
                value={symbol}
                onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                placeholder="EURUSD"
                className="w-full rounded border border-border bg-background px-3 py-2 text-foreground uppercase"
              />
            </div>

            <div>
              <label className="text-muted-foreground block mb-1">Direction</label>
              <select
                value={direction}
                onChange={(e) => setDirection(e.target.value as "BUY" | "SELL")}
                className="w-full rounded border border-border bg-background px-3 py-2 text-foreground font-bold"
              >
                <option value="BUY">BUY</option>
                <option value="SELL">SELL</option>
              </select>
            </div>

            <div>
              <label className="text-muted-foreground block mb-1">Entry Price</label>
              <input
                type="text"
                required
                value={entry}
                onChange={(e) => setEntry(e.target.value)}
                placeholder="1.08500"
                className="w-full rounded border border-border bg-background px-3 py-2 text-foreground"
              />
            </div>

            <div>
              <label className="text-muted-foreground block mb-1">Stop Loss</label>
              <input
                type="text"
                required
                value={stopLoss}
                onChange={(e) => setStopLoss(e.target.value)}
                placeholder="1.08200"
                className="w-full rounded border border-border bg-background px-3 py-2 text-foreground"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-muted-foreground block mb-1">
                Take Profits (Comma-separated)
              </label>
              <input
                type="text"
                required
                value={tpInput}
                onChange={(e) => setTpInput(e.target.value)}
                placeholder="1.08800, 1.09200, 1.09600"
                className="w-full rounded border border-border bg-background px-3 py-2 text-foreground"
              />
            </div>

            <div>
              <label className="text-muted-foreground block mb-1">Plan Tier</label>
              <select
                value={planTier}
                onChange={(e) =>
                  setPlanTier(e.target.value as "SR_SIGNAL_BOX" | "PERFECT_SIGNAL_BOX")
                }
                className="w-full rounded border border-border bg-background px-3 py-2 text-foreground"
              >
                <option value="PERFECT_SIGNAL_BOX">Perfect Signal Box (Tier 2)</option>
                <option value="SR_SIGNAL_BOX">SR Signal Box (Tier 1)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-muted-foreground block mb-1">Analysis / Execution Note</label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Breakout retest on 15m timeframe during London session open"
              className="w-full rounded border border-border bg-background px-3 py-2 text-foreground"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded bg-primary py-2.5 font-semibold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {loading ? "Publishing..." : "Broadcast Signal to Subscribers"}
          </button>
        </form>
      </div>

      {/* Signals List */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="p-4 border-b border-border/40 font-bold text-sm">Published Signals</div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-accent/40 text-muted-foreground uppercase text-[10px]">
              <tr>
                <th className="p-3">Symbol</th>
                <th className="p-3">Dir</th>
                <th className="p-3">Entry</th>
                <th className="p-3">SL</th>
                <th className="p-3">Tier</th>
                <th className="p-3">Status</th>
                <th className="p-3">Outcome</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/20">
              {signals.map((s) => (
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
                  <td className="p-3 font-mono">{s.entry}</td>
                  <td className="p-3 font-mono text-destructive">{s.stopLoss}</td>
                  <td className="p-3 text-[11px] text-muted-foreground">
                    {s.planTier === "SR_SIGNAL_BOX" ? "SR" : "Perfect"}
                  </td>
                  <td className="p-3 uppercase text-[10px] font-semibold">{s.status}</td>
                  <td className="p-3 font-bold uppercase">
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
                        {s.outcome} ({s.resultPips != null ? `${s.resultPips}p` : ""})
                      </span>
                    ) : (
                      <span className="text-yellow-400">OPEN</span>
                    )}
                  </td>
                  <td className="p-3 text-right space-x-2">
                    <button
                      onClick={() => handleOutcome(s.id)}
                      className="rounded bg-accent px-2 py-1 text-[10px] font-bold hover:bg-accent/80"
                    >
                      Set Outcome
                    </button>
                    {s.status === "published" && (
                      <button
                        onClick={() => handleCancel(s.id)}
                        className="rounded bg-destructive/20 text-destructive px-2 py-1 text-[10px] hover:bg-destructive/40"
                      >
                        Cancel
                      </button>
                    )}
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
