import React from 'react';
import { Check, X, Trash2, Clock } from 'lucide-react';
import { StatusPill, TxidCell } from './ui';
import { fmtWaiting, fmtDateTime } from '../lib/format';
import { useAdmin } from '../AdminContext';

export default function PaymentCard({ payment: p, priorConfirmed = 0, compact = false, onReject }) {
  const { approvePayment, deletePayment } = useAdmin();
  const isBot = String(p.plan || '').startsWith('BOT:');
  const planLabel = isBot
    ? `EA · ${p.plan.replace('BOT:', '').trim().split('(')[0].trim()}`
    : p.plan === 'PERFECT_SIGNAL_BOX' ? 'Perfect Signal Box' : p.plan === 'SR_SIGNAL_BOX' ? 'SR Signal Box' : p.plan;

  return (
    <article className="rounded-xl border border-akg-hairline bg-akg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="truncate text-sm font-bold text-akg-text">{p.user_email}</span>
            {priorConfirmed > 0 && (
              <span className="rounded-md bg-emerald-500/15 px-2 py-0.5 font-mono text-[10px] font-bold text-akg-green">
                {priorConfirmed}x prior
              </span>
            )}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-akg-muted">
            <span className="font-semibold text-akg-text">{planLabel}</span>
            <span className="font-mono">{p.network}</span>
            {p.status === 'pending' ? (
              <span className="flex items-center gap-1 font-mono text-amber-700 dark:text-amber-400">
                <Clock className="h-3 w-3" /> {fmtWaiting(p.created)}
              </span>
            ) : (
              <span className="font-mono">{fmtDateTime(p.created)}</span>
            )}
          </div>
        </div>
        <div className="shrink-0 text-right">
          <div className="font-mono text-lg font-bold text-akg-text tabular-nums">
            ${p.amount}
            <span className="ml-1 text-[10px] font-bold text-akg-accent">USDT</span>
          </div>
          <StatusPill status={p.status} className="mt-1" />
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between gap-3 rounded-lg border border-akg-hairline bg-akg-raised px-3 py-2">
        <TxidCell network={p.network} txid={p.txid} />
        {p.admin_notes && p.status === 'rejected' && (
          <span className="truncate text-[10px] text-rose-600/90 dark:text-rose-600 dark:text-rose-400/80" title={p.admin_notes}>reason saved</span>
        )}
      </div>

      {!compact && (
        <div className="mt-3 flex items-center gap-2">
          {p.status === 'pending' ? (
            <>
              <button
                onClick={() => approvePayment(p)}
                className="h-10 flex-1 rounded-lg bg-akg-cta text-sm font-bold text-akg-cta-text transition-all active:scale-[0.98] hover:opacity-90 shadow-sm cursor-pointer"
              >
                <span className="inline-flex items-center gap-1.5">
                  <Check className="h-4 w-4" /> Approve {isBot ? '+ License' : '+ 30d'}
                </span>
              </button>
              <button
                onClick={() => onReject?.(p)}
                className="h-10 rounded-lg border border-rose-500/30 px-4 text-sm font-semibold text-rose-600 dark:text-rose-400 transition-colors hover:bg-rose-500/10 active:scale-[0.98] cursor-pointer"
              >
                <span className="inline-flex items-center gap-1.5">
                  <X className="h-4 w-4" /> Reject
                </span>
              </button>
            </>
          ) : (
            <button
              onClick={(e) => { e.stopPropagation(); deletePayment(p); }}
              className="ml-auto flex h-9 items-center gap-1.5 rounded-lg border border-akg-hairline bg-akg-raised px-3.5 text-xs font-semibold text-akg-muted transition-colors hover:border-rose-500/40 hover:text-rose-600 dark:hover:text-rose-400 cursor-pointer"
            >
              <Trash2 className="h-3.5 w-3.5" /> Delete
            </button>
          )}
        </div>
      )}

      {compact && p.status === 'pending' && (
        <button
          onClick={() => approvePayment(p)}
          className="mt-3 h-10 w-full rounded-lg bg-akg-cta text-sm font-bold text-akg-cta-text active:scale-[0.98] hover:opacity-90 shadow-sm cursor-pointer"
        >
          Approve {isBot ? '+ License' : '+ 30d'}
        </button>
      )}
    </article>
  );
}
