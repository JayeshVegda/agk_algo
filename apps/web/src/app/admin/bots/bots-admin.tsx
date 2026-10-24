"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBotAction } from "@/actions/bots";

interface BotRow {
  id: string;
  name: string;
  description: string;
  platform: string;
  priceMinor: number;
  currency: string;
  active: boolean;
}

interface LicenseRow {
  id: string;
  licenseKey: string;
  boundAccountNumber: string | null;
  rebindCount: number;
  status: string;
  botName: string;
  userEmail: string;
  createdAt: Date | string;
}

export default function AdminBotsClient({
  bots: _bots,
  licenses,
}: {
  bots: BotRow[];
  licenses: LicenseRow[];
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [platform, setPlatform] = useState<"MT4" | "MT5" | "both">("both");
  const [priceUsd, setPriceUsd] = useState("99");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await createBotAction({
        name,
        description,
        platform,
        priceMinor: Math.round(Number(priceUsd) * 100),
      });

      setName("");
      setDescription("");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create bot");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Create Bot Form */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <h3 className="font-bold text-sm">Create New Algorithmic Bot</h3>

        {error && (
          <div className="rounded border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">
            {error}
          </div>
        )}

        <form onSubmit={handleCreate} className="space-y-4 text-xs">
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="text-muted-foreground block mb-1">Bot Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. AKG Gold Trap EA v2.4"
                className="w-full rounded border border-border bg-background px-3 py-2 text-foreground"
              />
            </div>

            <div>
              <label className="text-muted-foreground block mb-1">Target Platform</label>
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value as "MT4" | "MT5" | "both")}
                className="w-full rounded border border-border bg-background px-3 py-2 text-foreground"
              >
                <option value="both">Both MT4 & MT5</option>
                <option value="MT5">MetaTrader 5 (MT5)</option>
                <option value="MT4">MetaTrader 4 (MT4)</option>
              </select>
            </div>

            <div>
              <label className="text-muted-foreground block mb-1">Price ($ USD)</label>
              <input
                type="number"
                required
                value={priceUsd}
                onChange={(e) => setPriceUsd(e.target.value)}
                className="w-full rounded border border-border bg-background px-3 py-2 text-foreground"
              />
            </div>
          </div>

          <div>
            <label className="text-muted-foreground block mb-1">Product Description</label>
            <textarea
              required
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Algorithmic features, risk management controls, currency pairs, and recommended VPS specs."
              className="w-full rounded border border-border bg-background px-3 py-2 text-foreground focus:border-primary focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded bg-primary py-2.5 font-semibold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {loading ? "Registering Bot..." : "Create Bot in Catalogue"}
          </button>
        </form>
      </div>

      {/* Licenses Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="p-4 border-b border-border/40 font-bold text-sm">Issued Bot Licenses</div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-accent/40 text-muted-foreground uppercase text-[10px]">
              <tr>
                <th className="p-3">User</th>
                <th className="p-3">Bot Name</th>
                <th className="p-3">License Key</th>
                <th className="p-3">Bound Account</th>
                <th className="p-3">Rebinds</th>
                <th className="p-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/20">
              {licenses.map((lic) => (
                <tr key={lic.id} className="hover:bg-accent/20">
                  <td className="p-3 font-semibold">{lic.userEmail}</td>
                  <td className="p-3">{lic.botName}</td>
                  <td className="p-3 font-mono font-bold text-primary">{lic.licenseKey}</td>
                  <td className="p-3 font-mono text-[11px]">
                    {lic.boundAccountNumber || "Unbound"}
                  </td>
                  <td className="p-3 text-muted-foreground">{lic.rebindCount} / 3</td>
                  <td className="p-3 text-right">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                        lic.status === "active"
                          ? "bg-green-500/20 text-green-400"
                          : "bg-red-500/20 text-red-400"
                      }`}
                    >
                      {lic.status}
                    </span>
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
