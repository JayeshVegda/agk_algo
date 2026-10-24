"use client";

import { useState } from "react";
import { submitTxidAction } from "@/actions/payments";
import { formatMoney, createMoney } from "@akg/core";

interface Props {
  payment: {
    id: string;
    amountMinor: number;
    currency: string;
    asset: string;
    status: string;
    txid: string | null;
    expiresAt: Date | string;
  };
  network: {
    label: string;
    network: string;
    address: string;
    asset: string;
  };
}

export default function InvoiceClient({ payment, network }: Props) {
  const [status, setStatus] = useState(payment.status);
  const [txid, setTxid] = useState(payment.txid || "");
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cryptoAmount = `${(payment.amountMinor / 100).toFixed(2)} ${payment.asset} (${formatMoney(createMoney(payment.amountMinor, payment.currency))})`;

  const handleCopy = () => {
    navigator.clipboard.writeText(network.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTxidSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!txid.trim()) {
      setError("Please paste the transaction hash (TXID)");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await submitTxidAction(payment.id, txid);
      setStatus(res.status);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to record TXID");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card p-6 space-y-6">
      {/* Status Header */}
      <div className="flex items-center justify-between pb-4 border-b border-border/40">
        <div>
          <span className="text-[10px] text-muted-foreground uppercase block">Order Status</span>
          <span
            className={`font-bold text-sm uppercase ${
              status === "confirmed"
                ? "text-green-400"
                : status === "awaiting_confirmations"
                  ? "text-yellow-400"
                  : status === "expired"
                    ? "text-destructive"
                    : "text-primary"
            }`}
          >
            {status.replace("_", " ")}
          </span>
        </div>
        <div className="text-right">
          <span className="text-[10px] text-muted-foreground uppercase block">Total Due</span>
          <span className="text-lg font-bold text-foreground">{cryptoAmount}</span>
        </div>
      </div>

      {error && (
        <div className="rounded border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">
          {error}
        </div>
      )}

      {/* Payment Instructions */}
      <div className="space-y-4 text-xs">
        <div>
          <label className="text-muted-foreground block mb-1">Network</label>
          <div className="p-2.5 rounded border border-border bg-background font-semibold">
            {network.label} ({network.network})
          </div>
        </div>

        <div>
          <label className="text-muted-foreground block mb-1">Deposit Address</label>
          <div className="flex gap-2">
            <input
              type="text"
              readOnly
              value={network.address}
              className="flex-1 rounded border border-border bg-background px-3 py-2 text-foreground font-mono text-[11px]"
            />
            <button
              onClick={handleCopy}
              className="rounded bg-accent px-3 py-2 font-semibold hover:bg-accent/80 transition-colors"
            >
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
        </div>

        {/* QR Code Placeholder Representation */}
        <div className="p-6 rounded border border-border bg-background flex flex-col items-center justify-center text-center space-y-2">
          <div className="w-32 h-32 border border-dashed border-primary/40 rounded flex items-center justify-center font-bold text-xs text-primary">
            QR SCAN
          </div>
          <p className="text-[10px] text-muted-foreground">Scan with your crypto wallet application</p>
        </div>
      </div>

      {/* TXID Submission */}
      {status === "pending" ? (
        <form onSubmit={handleTxidSubmit} className="space-y-3 pt-4 border-t border-border/40 text-xs">
          <div>
            <label className="text-muted-foreground block mb-1">
              Submit Blockchain Transaction Hash (TXID)
            </label>
            <input
              type="text"
              required
              value={txid}
              onChange={(e) => setTxid(e.target.value)}
              className="w-full rounded border border-border bg-background px-3 py-2 text-foreground focus:border-primary focus:outline-none"
              placeholder="e.g. 0x8a91f... or 5b7d9e..."
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded bg-primary py-2.5 font-semibold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {submitting ? "Submitting TXID..." : "I Have Paid — Submit TXID"}
          </button>
        </form>
      ) : status === "awaiting_confirmations" ? (
        <div className="rounded border border-yellow-500/30 bg-yellow-500/10 p-4 text-xs space-y-2">
          <div className="font-bold text-yellow-500">Awaiting Network / Admin Approval</div>
          <p className="text-muted-foreground text-[11px] leading-relaxed">
            Your transaction hash ({payment.txid?.slice(0, 16)}...) was recorded. Your access will
            automatically unlock once confirmed by administration.
          </p>
        </div>
      ) : status === "confirmed" ? (
        <div className="rounded border border-green-500/30 bg-green-500/10 p-4 text-xs space-y-2">
          <div className="font-bold text-green-400">Payment Confirmed!</div>
          <p className="text-muted-foreground text-[11px]">
            Your subscription is now active. Return to the dashboard to access today's signals.
          </p>
          <a
            href="/dashboard"
            className="inline-block mt-2 rounded bg-green-600 px-4 py-2 font-semibold text-white hover:bg-green-500"
          >
            Go to Dashboard
          </a>
        </div>
      ) : null}
    </div>
  );
}
