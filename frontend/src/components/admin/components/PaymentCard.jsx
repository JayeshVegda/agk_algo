import React from 'react';
import { Check, X, Trash2, Clock } from 'lucide-react';
import { StatusPill, TxidCell } from './ui';
import { fmtWaiting, fmtDateTime } from '../lib/format';
import { useAdmin } from '../AdminContext';

/**
 * One payment in the money queue. Pending payments expose the primary
 * two-tap workflow (Approve / Reject); history exposes delete.
 * `priorConfirmed` shows repeat-buyer context for trust decisions.
 */
export default function PaymentCard({ payment: p, priorConfirmed = 0, compact = false, onReject }) {
  const { approvePayment, deletePayment } = useAdmin();
  const isBot = String(p.plan || '').startsWith('BOT:');
  const planLabel = isBot
    ? `EA · ${p.plan.replace('BOT:', '').trim().split('(')[0].trim()}`
    : p.plan === 'PERFECT_SIGNAL_BOX' ? 'Perfect Signal Box' : p.plan === 'SR_SIGNAL_BOX' ? 'SR Signal Box' : p.plan;

  return (
    <article className="rounded-2xl border border-white/10 bg-akg-surface p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="truncate text-sm font-bold text-white">{p.user_email}</span>
            {priorConfirmed > 0 && (
              <span className="rounded-full bg-akg-green/15 px-2 py-0.5 font-data text-[10px] font-bold text-akg-green">
                {priorConfirmed}x prior
              </span>
            )}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-akg-muted">
            <span className="font-semibold text-akg-silver">{planLabel}</span>
            <span className="font-data">{p.network}</span>
            {p.status === 'pending' ? (
              <span className="flex items-center gap-1 font-data text-amber-300">
                <Clock className="h-3 w-3" /> {fmtWaiting(p.created)}
              </span>
            ) : (
              <span className="font-data">{fmtDateTime(p.created)}</span>
            )}
          </div>
        </div>
        <div className="shrink-0 text-right">
          <div className="font-data text-lg font-bold text-white tabular-nums">
            ${p.amount}
            <span className="ml-1 text-[10px] font-bold text-akg-gold">USDT</span>
          </div>
          <StatusPill status={p.status} className="mt-1" />
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-white/[0.07] bg-[#0A0D13] px-3 py-2">
        <TxidCell network={p.network} txid={p.txid} />
        {p.admin_notes && p.status === 'rejected' && (
          <span className="truncate text-[10px] text-rose-300/80" title={p.admin_notes}>reason saved</span>
        )}
      </div>

      {!compact && (
        <div className="mt-3 flex items-center gap-2">
          {p.status === 'pending' ? (
            <>
              <button
                onClick={() => approvePayment(p)}
                className="h-10 flex-1 rounded-full bg-[linear-gradient(120deg,#E8BC4F_0%,#F3C653_38%,#FFE9A8_58%,#DFAE3E_100%)] text-sm font-bold text-[#1C1403] transition-all active:scale-[0.98]"
              >
                <span className="inline-flex items-center gap-1.5">
                  <Check className="h-4 w-4" /> Approve {isBot ? '+ License' : '+ 30d'}
                </span>
              </button>
              <button
                onClick={() => onReject?.(p)}
                className="h-10 rounded-full border border-rose-500/30 px-4 text-sm font-bold text-rose-300 transition-colors hover:bg-rose-500/10 active:scale-[0.98]"
              >
                <span className="inline-flex items-center gap-1.5">
                  <X className="h-4 w-4" /> Reject
                </span>
              </button>
            </>
          ) : (
            <button
              onClick={(e) => { e.stopPropagation(); deletePayment(p); }}
              className="ml-auto flex h-9 items-center gap-1.5 rounded-full border border-white/10 px-3.5 text-xs font-semibold text-akg-muted transition-colors hover:border-rose-500/40 hover:text-rose-300"
            >
              <Trash2 className="h-3.5 w-3.5" /> Delete
            </button>
          )}
        </div>
      )}

      {compact && p.status === 'pending' && (
        <button
          onClick={() => approvePayment(p)}
          className="mt-3 h-10 w-full rounded-full bg-[linear-gradient(120deg,#E8BC4F_0%,#F3C653_38%,#FFE9A8_58%,#DFAE3E_100%)] text-sm font-bold text-[#1C1403] active:scale-[0.98]"
        >
          Approve {isBot ? '+ License' : '+ 30d'}
        </button>
      )}
    </article>
  );
}
