"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { enrolInCycleAction } from "@/actions/cycles";

interface Props {
  cycles: { id: string; name: string; status: string; startsOn: string; endsOn: string }[];
  networks: { id: string; label: string; network: string; asset: string }[];
}

export default function SubscribeClientForm({ cycles, networks }: Props) {
  const router = useRouter();
  const [selectedCycleId, setSelectedCycleId] = useState(cycles[0]?.id || "");
  const [planCode, setPlanCode] = useState<"SR_SIGNAL_BOX" | "PERFECT_SIGNAL_BOX">("PERFECT_SIGNAL_BOX");
  const [networkId, setNetworkId] = useState(networks[0]?.id || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCycleId || !networkId) {
      setError("Please select both an active cycle and a payment network");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await enrolInCycleAction({
        cycleId: selectedCycleId,
        planCode,
        networkId,
      });

      router.push(`/dashboard/invoice/${res.paymentId}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to generate subscription invoice");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-border bg-card p-6 space-y-6">
      {error && (
        <div className="rounded border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">
          {error}
        </div>
      )}

      {/* Plan Selection */}
      <div className="space-y-2">
        <label className="text-xs text-muted-foreground uppercase">1. Select Signal Tier</label>
        <div className="grid grid-cols-2 gap-4">
          <div
            onClick={() => setPlanCode("SR_SIGNAL_BOX")}
            className={`cursor-pointer rounded-lg border p-4 text-xs transition-colors ${
              planCode === "SR_SIGNAL_BOX"
                ? "border-primary bg-primary/10 text-foreground"
                : "border-border bg-background text-muted-foreground hover:bg-accent/40"
            }`}
          >
            <div className="font-bold text-sm">SR Signal Box</div>
            <div className="text-[11px] mt-1 text-muted-foreground">Support & Resistance setups</div>
            <div className="text-base font-bold text-primary mt-3">$10 / cycle</div>
          </div>

          <div
            onClick={() => setPlanCode("PERFECT_SIGNAL_BOX")}
            className={`cursor-pointer rounded-lg border p-4 text-xs transition-colors ${
              planCode === "PERFECT_SIGNAL_BOX"
                ? "border-primary bg-primary/10 text-foreground"
                : "border-border bg-background text-muted-foreground hover:bg-accent/40"
            }`}
          >
            <div className="font-bold text-sm">Perfect Signal Box</div>
            <div className="text-[11px] mt-1 text-muted-foreground">Institutional Momentum tier</div>
            <div className="text-base font-bold text-primary mt-3">$20 / cycle</div>
          </div>
        </div>
      </div>

      {/* Cycle Selection */}
      <div className="space-y-2">
        <label className="text-xs text-muted-foreground uppercase">2. Select Trading Cycle</label>
        {cycles.length === 0 ? (
          <div className="text-xs text-muted-foreground p-3 border border-border rounded bg-background">
            No cycles configured yet. Check back shortly.
          </div>
        ) : (
          <select
            value={selectedCycleId}
            onChange={(e) => setSelectedCycleId(e.target.value)}
            className="w-full rounded border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
          >
            {cycles.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} — {c.startsOn} to {c.endsOn} ({c.status})
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Payment Network Selection */}
      <div className="space-y-2">
        <label className="text-xs text-muted-foreground uppercase">3. Blockchain Payment Network</label>
        {networks.length === 0 ? (
          <div className="text-xs text-muted-foreground p-3 border border-border rounded bg-background">
            Payment networks are being configured by admin.
          </div>
        ) : (
          <select
            value={networkId}
            onChange={(e) => setNetworkId(e.target.value)}
            className="w-full rounded border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
          >
            {networks.map((n) => (
              <option key={n.id} value={n.id}>
                {n.label} ({n.asset} on {n.network})
              </option>
            ))}
          </select>
        )}
      </div>

      <button
        type="submit"
        disabled={loading || cycles.length === 0 || networks.length === 0}
        className="w-full rounded bg-primary py-3 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
      >
        {loading ? "Generating Blockchain Invoice..." : "Proceed to Payment Invoice"}
      </button>
    </form>
  );
}
