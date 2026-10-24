"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createCycleAction, updateCycleStatusAction } from "@/actions/cycles";
import type { CycleStatus } from "@akg/core";

interface Cycle {
  id: string;
  name: string;
  startsOn: string;
  endsOn: string;
  status: string;
  renewalAudience: string;
  createdAt: Date | string;
}

export default function CyclesManagementClient({
  existingCycles,
}: {
  existingCycles: Cycle[];
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [startsOn, setStartsOn] = useState("");
  const [endsOn, setEndsOn] = useState("");
  const [srPrice, setSrPrice] = useState("10");
  const [perfectPrice, setPerfectPrice] = useState("20");
  const [allowOverlap, setAllowOverlap] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await createCycleAction({
        name,
        startsOn,
        endsOn,
        allowOverlapOverride: allowOverlap,
        prices: [
          { planCode: "SR_SIGNAL_BOX", priceMinor: Math.round(Number(srPrice) * 100) },
          { planCode: "PERFECT_SIGNAL_BOX", priceMinor: Math.round(Number(perfectPrice) * 100) },
        ],
      });

      setName("");
      setStartsOn("");
      setEndsOn("");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create cycle");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (cycleId: string, toStatus: CycleStatus) => {
    try {
      await updateCycleStatusAction(cycleId, toStatus);
      router.refresh();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to update cycle status");
    }
  };

  return (
    <div className="space-y-8">
      {/* Creation Form */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <h3 className="font-bold text-sm">Create New Trading Cycle</h3>

        {error && (
          <div className="rounded border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">
            {error}
          </div>
        )}

        <form onSubmit={handleCreate} className="space-y-4 text-xs">
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="text-muted-foreground block mb-1">Cycle Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. October 2026 Alpha"
                className="w-full rounded border border-border bg-background px-3 py-2 text-foreground"
              />
            </div>

            <div>
              <label className="text-muted-foreground block mb-1">Starts On (YYYY-MM-DD)</label>
              <input
                type="date"
                required
                value={startsOn}
                onChange={(e) => setStartsOn(e.target.value)}
                className="w-full rounded border border-border bg-background px-3 py-2 text-foreground"
              />
            </div>

            <div>
              <label className="text-muted-foreground block mb-1">Ends On (YYYY-MM-DD, Inc.)</label>
              <input
                type="date"
                required
                value={endsOn}
                onChange={(e) => setEndsOn(e.target.value)}
                className="w-full rounded border border-border bg-background px-3 py-2 text-foreground"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-muted-foreground block mb-1">SR Box Price ($ USD)</label>
              <input
                type="number"
                required
                value={srPrice}
                onChange={(e) => setSrPrice(e.target.value)}
                className="w-full rounded border border-border bg-background px-3 py-2 text-foreground"
              />
            </div>

            <div>
              <label className="text-muted-foreground block mb-1">Perfect Box Price ($ USD)</label>
              <input
                type="number"
                required
                value={perfectPrice}
                onChange={(e) => setPerfectPrice(e.target.value)}
                className="w-full rounded border border-border bg-background px-3 py-2 text-foreground"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="overlap"
              checked={allowOverlap}
              onChange={(e) => setAllowOverlap(e.target.checked)}
              className="rounded border-border"
            />
            <label htmlFor="overlap" className="text-muted-foreground text-[11px]">
              Explicit Admin Override: Permit date overlap with existing cycles (Audit-logged)
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded bg-primary py-2.5 font-semibold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {loading ? "Creating Cycle..." : "Create Cycle & Set Prices"}
          </button>
        </form>
      </div>

      {/* Existing Cycles Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="p-4 border-b border-border/40 font-bold text-sm">Cycles Directory</div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-accent/40 text-muted-foreground uppercase text-[10px]">
              <tr>
                <th className="p-3">Name</th>
                <th className="p-3">Starts On</th>
                <th className="p-3">Ends On</th>
                <th className="p-3">Status</th>
                <th className="p-3">Renewal Audience</th>
                <th className="p-3 text-right">Transition Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/20">
              {existingCycles.map((c) => (
                <tr key={c.id} className="hover:bg-accent/20">
                  <td className="p-3 font-semibold text-foreground">{c.name}</td>
                  <td className="p-3">{c.startsOn}</td>
                  <td className="p-3">{c.endsOn}</td>
                  <td className="p-3 font-bold uppercase">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] ${
                        c.status === "running"
                          ? "bg-green-500/20 text-green-400"
                          : c.status === "renewal_open"
                            ? "bg-yellow-500/20 text-yellow-400"
                            : "bg-accent text-muted-foreground"
                      }`}
                    >
                      {c.status}
                    </span>
                  </td>
                  <td className="p-3 text-muted-foreground text-[11px]">{c.renewalAudience}</td>
                  <td className="p-3 text-right space-x-2">
                    {c.status === "draft" && (
                      <button
                        onClick={() => handleStatusChange(c.id, "renewal_open")}
                        className="rounded bg-yellow-600/30 text-yellow-400 px-2 py-1 text-[10px] hover:bg-yellow-600/50"
                      >
                        Open Renewal
                      </button>
                    )}
                    {c.status === "renewal_open" && (
                      <button
                        onClick={() => handleStatusChange(c.id, "running")}
                        className="rounded bg-green-600/30 text-green-400 px-2 py-1 text-[10px] hover:bg-green-600/50"
                      >
                        Launch (Running)
                      </button>
                    )}
                    {c.status === "running" && (
                      <button
                        onClick={() => handleStatusChange(c.id, "closed")}
                        className="rounded bg-destructive/30 text-destructive px-2 py-1 text-[10px] hover:bg-destructive/50"
                      >
                        Close Cycle
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
