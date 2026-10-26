import React, { useState } from 'react';
import { Check, X } from 'lucide-react';
import { ConfirmSheet } from './ActionSheet';
import { fmtWaiting, fmtRelative } from '../lib/format';
import { useAdmin } from '../AdminContext';
import { cn } from '../../../lib/utils';

function inrOf(p) {
  return p.method === 'upi' && p.inr_amount ? `₹${Number(p.inr_amount).toLocaleString('en-IN')}` : '';
}

export function planShort(plan) {
  const s = String(plan || '');
  if (s.startsWith('BOT:')) return 'EA · ' + s.replace('BOT:', '').trim().split('(')[0].trim();
  if (s === 'PERFECT_SIGNAL_BOX') return 'Perfect Box';
  if (s === 'SR_SIGNAL_BOX') return 'SR Box';
  return s || '-';
}

/**
 * Compact single-line payment row. Nothing truncates: columns size to their
 * content. Click opens the full detail sheet; approve asks for confirmation.
 */
export default function PaymentRow({ payment: p, prior = 0, onOpen, onReject }) {
  const { approvePayment } = useAdmin();
  const [confirming, setConfirming] = useState(false);
  const isPending = p.status === 'pending';
  const isBot = String(p.plan || '').startsWith('BOT:');

  return (
    <>
      <div
        onClick={() => onOpen?.(p)}
        className={cn(
          'flex cursor-pointer flex-wrap items-center gap-x-3 gap-y-1 border-b border-white/[0.05] px-3 py-2 transition-colors last:border-0 hover:bg-white/[0.03]',
          isPending && 'bg-amber-400/[0.02]'
        )}
      >
        <span className={cn('w-[64px] shrink-0 font-data text-[10px]', isPending ? 'text-amber-300' : 'text-akg-muted')}>
          {isPending ? fmtWaiting(p.created) : fmtRelative(p.created)}
        </span>

        <span className="flex shrink-0 items-center gap-1.5">
          <span className="text-xs font-semibold text-white">{p.user_email}</span>
          {prior > 0 && (
            <span className="rounded bg-akg-green/15 px-1 py-px font-data text-[9px] font-bold text-akg-green">{prior}x</span>
          )}
        </span>

        <span className="shrink-0 text-[11px] text-akg-silver">{planShort(p.plan)}</span>

        <span className={cn('shrink-0 rounded px-1.5 py-px font-data text-[9px] font-bold',
          p.method === 'upi' ? 'bg-akg-green/15 text-akg-green' : 'bg-[#F3C653]/15 text-akg-gold')}>
          {p.method === 'upi' ? 'UPI' : p.network?.replace('USDT-', '') || 'USDT'}
        </span>

        <span className="ml-auto shrink-0 font-data text-xs font-bold text-white tabular-nums">
          ${p.amount}
          {inrOf(p) && <span className="ml-1 text-[10px] font-semibold text-akg-muted">{inrOf(p)}</span>}
        </span>

        <span className="flex shrink-0 items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          {isPending ? (
            <>
              <button
                onClick={() => setConfirming(true)}
                title="Approve"
                className="flex h-7 items-center gap-1 rounded-full bg-[linear-gradient(120deg,#E8BC4F,#F3C653,#DFAE3E)] px-3 font-data text-[10px] font-bold text-[#1C1403] transition-transform active:scale-95"
              >
                <Check className="h-3 w-3" /> Approve
              </button>
              <button
                onClick={() => onReject?.(p)}
                title="Reject with reason"
                className="flex h-7 w-7 items-center justify-center rounded-full border border-rose-500/30 text-rose-300 transition-colors hover:bg-rose-500/10 active:scale-95"
              >
                <X className="h-3 w-3" />
              </button>
            </>
          ) : (
            <span className={cn('rounded px-1.5 py-px font-data text-[9px] font-bold uppercase',
              p.status === 'confirmed' ? 'bg-akg-green/15 text-akg-green'
              : p.status === 'rejected' ? 'bg-rose-500/15 text-rose-300' : 'bg-white/[0.06] text-akg-muted')}>
              {p.status}
            </span>
          )}
        </span>
      </div>

      <ConfirmSheet
        open={confirming}
        onClose={() => setConfirming(false)}
        onConfirm={async () => { await approvePayment(p); }}
        title="Approve this payment?"
        message={`${p.user_email} · ${planShort(p.plan)} · $${p.amount} USDT${inrOf(p) ? ` (${inrOf(p)})` : ''}. ${isBot ? 'A perpetual license key will be issued automatically.' : 'A 30-day cycle will be activated automatically.'} You can undo this from the toast.`}
        confirmLabel={isBot ? 'Approve + Issue License' : 'Approve + Grant 30d'}
      />
    </>
  );
}
