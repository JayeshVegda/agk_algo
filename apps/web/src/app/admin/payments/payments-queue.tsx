"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { approvePaymentAction, rejectPaymentAction } from "@/actions/payments";
import { formatMoney, createMoney } from "@akg/core";

interface PaymentRow {
  id: string;
  orderType: string;
  amountMinor: number;
  currency: string;
  asset: string;
  status: string;
  txid: string | null;
  createdAt: Date | string;
  userEmail: string;
  networkLabel: string | null;
}

interface NetworkRow {
  id: string;
  asset: string;
  network: string;
  label: string;
  address: string;
  enabled: boolean;
}

export default function AdminPaymentsQueueClient({
  payments,
  networks,
}: {
  payments: PaymentRow[];
  networks: NetworkRow[];
}) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleApprove = async (id: string) => {
    setLoadingId(id);
    try {
      await approvePaymentAction(id);
      router.refresh();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to approve payment");
    } finally {
      setLoadingId(null);
    }
  };

  const handleReject = async (id: string) => {
    const reason = prompt("Enter rejection reason:");
    if (!reason) return;

    setLoadingId(id);
    try {
      await rejectPaymentAction(id, reason);
      router.refresh();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to reject payment");
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* Pending Approval Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="p-4 border-b border-border/40 font-bold text-sm">
          Pending & Verification Queue
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-accent/40 text-muted-foreground uppercase text-[10px]">
              <tr>
                <th className="p-3">User</th>
                <th className="p-3">Type</th>
                <th className="p-3">Amount</th>
                <th className="p-3">Network</th>
                <th className="p-3">TXID</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/20">
              {payments.map((p) => (
                <tr key={p.id} className="hover:bg-accent/20">
                  <td className="p-3 font-semibold text-foreground">{p.userEmail}</td>
                  <td className="p-3 uppercase text-[11px] text-muted-foreground">{p.orderType}</td>
                  <td className="p-3 font-bold">
                    {formatMoney(createMoney(p.amountMinor, p.currency))} ({p.asset})
                  </td>
                  <td className="p-3 text-muted-foreground">{p.networkLabel || "—"}</td>
                  <td className="p-3 font-mono text-[11px]">
                    {p.txid ? (
                      <span className="text-primary font-bold">{p.txid.slice(0, 18)}...</span>
                    ) : (
                      <span className="text-muted-foreground">Awaiting submission</span>
                    )}
                  </td>
                  <td className="p-3 font-bold uppercase">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] ${
                        p.status === "confirmed"
                          ? "bg-green-500/20 text-green-400"
                          : p.status === "awaiting_confirmations"
                            ? "bg-yellow-500/20 text-yellow-400"
                            : p.status === "rejected" || p.status === "expired"
                              ? "bg-red-500/20 text-red-400"
                              : "bg-primary/20 text-primary"
                      }`}
                    >
                      {p.status}
                    </span>
                  </td>
                  <td className="p-3 text-right space-x-2">
                    {p.status !== "confirmed" && p.status !== "rejected" && (
                      <>
                        <button
                          onClick={() => handleApprove(p.id)}
                          disabled={loadingId === p.id}
                          className="rounded bg-green-600/30 text-green-400 px-2.5 py-1 text-[11px] font-bold hover:bg-green-600/50 transition-colors disabled:opacity-50"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleReject(p.id)}
                          disabled={loadingId === p.id}
                          className="rounded bg-destructive/30 text-destructive px-2.5 py-1 text-[11px] font-bold hover:bg-destructive/50 transition-colors disabled:opacity-50"
                        >
                          Reject
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Networks Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="p-4 border-b border-border/40 font-bold text-sm">
          Active Payment Networks & Wallets
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-accent/40 text-muted-foreground uppercase text-[10px]">
              <tr>
                <th className="p-3">Network Label</th>
                <th className="p-3">Asset</th>
                <th className="p-3">Protocol</th>
                <th className="p-3">Receiving Address</th>
                <th className="p-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/20">
              {networks.map((n) => (
                <tr key={n.id} className="hover:bg-accent/20">
                  <td className="p-3 font-semibold text-foreground">{n.label}</td>
                  <td className="p-3 font-bold text-primary">{n.asset}</td>
                  <td className="p-3 text-muted-foreground">{n.network}</td>
                  <td className="p-3 font-mono text-[11px]">{n.address}</td>
                  <td className="p-3 text-right">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        n.enabled ? "bg-green-500/20 text-green-400" : "bg-accent text-muted-foreground"
                      }`}
                    >
                      {n.enabled ? "ACTIVE" : "DISABLED"}
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
