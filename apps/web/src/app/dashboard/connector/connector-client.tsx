"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { submitConnectorDemoAction, deleteConnectorDemoAction } from "@/actions/connector";

interface DemoRequest {
  id: string;
  platform: string;
  accountNumber: string;
  server: string;
  status: string;
  createdAt: Date | string;
}

export default function ConnectorDemoClient({
  existingRequests,
}: {
  existingRequests: DemoRequest[];
}) {
  const router = useRouter();
  const [platform, setPlatform] = useState<"MT4" | "MT5">("MT5");
  const [accountNumber, setAccountNumber] = useState("");
  const [server, setServer] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountNumber || !server || !password) {
      setError("All credentials are required to configure connector simulation");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await submitConnectorDemoAction({
        platform,
        accountNumber,
        server,
        masterPassword: password,
      });

      setAccountNumber("");
      setServer("");
      setPassword("");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to record connector demo parameters");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteConnectorDemoAction(id);
      router.refresh();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-8">
      {/* Configuration Form */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <h3 className="font-bold text-sm">Connect Demo Trading Account</h3>

        {error && (
          <div className="rounded border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-muted-foreground block mb-1">Platform</label>
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value as "MT4" | "MT5")}
                className="w-full rounded border border-border bg-background px-3 py-2 text-foreground"
              >
                <option value="MT5">MetaTrader 5 (MT5)</option>
                <option value="MT4">MetaTrader 4 (MT4)</option>
              </select>
            </div>

            <div>
              <label className="text-muted-foreground block mb-1">Demo Account #</label>
              <input
                type="text"
                required
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                placeholder="e.g. 5092144"
                className="w-full rounded border border-border bg-background px-3 py-2 text-foreground"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-muted-foreground block mb-1">Broker Server</label>
              <input
                type="text"
                required
                value={server}
                onChange={(e) => setServer(e.target.value)}
                placeholder="e.g. MetaQuotes-Demo"
                className="w-full rounded border border-border bg-background px-3 py-2 text-foreground"
              />
            </div>

            <div>
              <label className="text-muted-foreground block mb-1">Master Password (Encrypted)</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Demo master password"
                className="w-full rounded border border-border bg-background px-3 py-2 text-foreground"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded bg-primary py-2.5 font-semibold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {loading ? "Registering Parameters..." : "Initialize Simulated Bridge"}
          </button>
        </form>
      </div>

      {/* Existing Configured Demo Accounts */}
      <div className="space-y-4">
        <h3 className="font-bold text-sm">Active Simulated Accounts ({existingRequests.length})</h3>

        {existingRequests.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-8 text-center text-xs text-muted-foreground">
            No demo accounts registered. Add a demo MetaTrader account above to start simulated routing.
          </div>
        ) : (
          existingRequests.map((req) => (
            <div
              key={req.id}
              className="rounded-xl border border-border bg-card p-6 space-y-4 font-mono text-xs"
            >
              <div className="flex justify-between items-center pb-3 border-b border-border/20">
                <div className="flex items-center gap-2">
                  <span className="inline-block h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="font-bold">{req.platform} Demo Account #{req.accountNumber}</span>
                </div>
                <span className="rounded bg-accent px-2 py-0.5 text-[10px] text-muted-foreground uppercase">
                  Mock Sandbox
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-muted-foreground text-[11px]">
                <div>Server: <span className="text-foreground font-semibold">{req.server}</span></div>
                <div>Status: <span className="text-green-400 font-semibold">Simulated Active</span></div>
                <div>Password: <span className="text-foreground">•••••••••••• (Encrypted)</span></div>
              </div>

              {/* Simulated Paper Trading Telemetry */}
              <div className="p-4 rounded border border-border/40 bg-background/50 space-y-2">
                <div className="flex justify-between text-[11px] text-muted-foreground">
                  <span>Simulated Latency: 14ms</span>
                  <span>Virtual Balance: $10,480.00 (+4.8%)</span>
                </div>
                <div className="text-[10px] text-muted-foreground italic">
                  Bridge heartbeat: Signal receiver active. Paper-trading automated executions synchronized.
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => handleDelete(req.id)}
                  className="rounded border border-destructive/40 text-destructive hover:bg-destructive/10 px-3 py-1.5 text-xs transition-colors"
                >
                  Hard Delete Demo Credentials
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
