import React, { useEffect, useState } from 'react';
import { pb } from '../../../lib/pocketbase';
import { ActionSheet, ConfirmSheet } from './ActionSheet';
import { TxidCell, StatusPill } from './ui';
import { planShort } from './PaymentRow';
import { useAdmin } from '../AdminContext';
import { fmtDateTime } from '../lib/format';
import { cn } from '../../../lib/utils';

/**
 * Full payment dossier: every field, no truncation, plus the trader's
 * history and current cycle so approvals are informed decisions.
 */
export default function PaymentDetailSheet({ payment, onClose, onReject }) {
  const { approvePayment, deletePayment, undoPayment } = useAdmin();
  const [history, setHistory] = useState(null);
  const [user, setUser] = useState(null);
  const [confirming, setConfirming] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [confirmingUndo, setConfirmingUndo] = useState(false);

  useEffect(() => {
    if (!payment) return;
    setHistory(null);
    setUser(null);
    pb.collection('payments').getFullList({ filter: `user_email = "${payment.user_email}"`, sort: '-created' })
      .then((recs) => setHistory(recs.slice(0, 8)))
      .catch(() => setHistory([]));
    pb.collection('users').getFullList({ filter: `email = "${payment.user_email}"` })
      .then((us) => setUser(us[0] || null))
      .catch(() => setUser(null));
  }, [payment?.id]);

  if (!payment) return null;
  const p = payment;
  const isPending = p.status === 'pending';
  const isBot = String(p.plan || '').startsWith('BOT:');
  const cycleDays = user?.cycle_expires_at
    ? Math.ceil((new Date(String(user.cycle_expires_at).replace(' ', 'T')).getTime() - Date.now()) / 86400000)
    : null;

  const row = (k, v) => (
    <div className="flex items-start justify-between gap-4 border-b border-white/[0.05] px-4 py-2.5 last:border-0">
      <span className="shrink-0 font-data text-[10px] uppercase tracking-wider text-akg-muted">{k}</span>
      <span className="min-w-0 break-all text-right text-xs font-semibold text-white">{v}</span>
    </div>
  );

  return (
    <>
      <ActionSheet
        open={!!payment}
        onClose={onClose}
        size="lg"
        title={p.user_email}
        subtitle={`${planShort(p.plan)} · $${p.amount} USDT`}
        footer={
          <div className="flex flex-wrap gap-2">
            {isPending ? (
              <>
                <button
                  onClick={() => setConfirming(true)}
                  className="h-11 flex-1 rounded-full bg-[linear-gradient(120deg,#E8BC4F,#F3C653,#DFAE3E)] text-sm font-bold text-[#1C1403] active:scale-[0.98]"
                >
                  {isBot ? 'Approve + Issue License' : 'Approve + Grant 30d'}
                </button>
                <button
                  onClick={() => { onClose(); onReject?.(p); }}
                  className="h-11 rounded-full border border-rose-500/30 px-5 text-sm font-bold text-rose-300 hover:bg-rose-500/10"
                >
                  Reject…
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setConfirmingUndo(true)}
                  className="h-11 flex-1 rounded-full border border-[#F3C653]/40 text-sm font-bold text-akg-gold hover:bg-[#F3C653]/10"
                >
                  Undo → back to pending
                </button>
                <button
                  onClick={() => setConfirmingDelete(true)}
                  className="h-11 rounded-full border border-white/15 px-5 text-sm font-semibold text-akg-muted hover:border-rose-500/40 hover:text-rose-300"
                >
                  Delete
                </button>
              </>
            )}
          </div>
        }
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <StatusPill status={p.status} />
            {p.method === 'upi' && p.inr_amount ? (
              <span className="rounded-full bg-akg-green/15 px-2.5 py-1 font-data text-[11px] font-bold text-akg-green">₹{Number(p.inr_amount).toLocaleString('en-IN')} via UPI</span>
            ) : (
              <span className="rounded-full bg-[#F3C653]/15 px-2.5 py-1 font-data text-[11px] font-bold text-akg-gold">{p.network}</span>
            )}
          </div>

          <div className="overflow-hidden rounded-xl border border-white/[0.07] bg-[#0A0D13]">
            {row('Trader', p.user_email)}
            {row('Plan', planShort(p.plan))}
            {row('Amount', `$${p.amount} USDT${p.inr_amount ? ` · ₹${Number(p.inr_amount).toLocaleString('en-IN')}` : ''}`)}
            {row('Method', p.method === 'upi' ? 'GPay / UPI' : `Crypto · ${p.network}`)}
            {row('Reference', <TxidCell network={p.network} txid={p.txid} full />)}
            {row('Submitted', fmtDateTime(p.created))}
            {p.license_key && row('License key', p.license_key)}
            {p.admin_notes && row('Desk note', p.admin_notes)}
          </div>

          {/* trader context */}
          <div>
            <h3 className="mb-2 font-data text-[10px] uppercase tracking-[0.14em] text-akg-muted">Trader context</h3>
            <div className="grid grid-cols-3 gap-2">
              {[
                ['Prior confirmed', history ? String(history.filter((h) => h.status === 'confirmed').length) : '…'],
                ['Current plan', user ? (user.plan === 'PERFECT_SIGNAL_BOX' ? 'Perfect' : user.plan === 'SR_SIGNAL_BOX' ? 'SR' : 'None') : '…'],
                ['Cycle', cycleDays === null ? '—' : cycleDays < 0 ? 'expired' : `${cycleDays}d left`],
              ].map(([k, v]) => (
                <div key={k} className="rounded-xl border border-white/[0.07] bg-[#0A0D13] px-3 py-2.5">
                  <div className="font-data text-[9px] uppercase tracking-wide text-akg-muted">{k}</div>
                  <div className="mt-0.5 font-data text-sm font-bold text-white">{v}</div>
                </div>
              ))}
            </div>
          </div>

          {/* history */}
          <div>
            <h3 className="mb-2 font-data text-[10px] uppercase tracking-[0.14em] text-akg-muted">
              Recent payments {history ? `(${history.length})` : ''}
            </h3>
            {history === null ? (
              <div className="h-16 animate-pulse rounded-xl bg-white/[0.03]" />
            ) : history.length === 0 ? (
              <p className="rounded-xl border border-white/[0.06] bg-[#0A0D13] px-4 py-3 text-[11px] text-akg-muted">First payment from this trader.</p>
            ) : (
              <div className="divide-y divide-white/[0.05] overflow-hidden rounded-xl border border-white/[0.07] bg-[#0A0D13]">
                {history.map((h) => (
                  <div key={h.id} className={cn('flex items-center justify-between gap-3 px-3.5 py-2', h.id === p.id && 'bg-[#F3C653]/[0.05]')}>
                    <span className="flex min-w-0 items-center gap-2">
                      <span className="font-data text-[10px] text-akg-muted">{fmtDateTime(h.created)}</span>
                      <span className="truncate text-[11px] text-akg-silver">{planShort(h.plan)}</span>
                    </span>
                    <span className="flex shrink-0 items-center gap-2">
                      <span className="font-data text-[11px] font-bold text-white">${h.amount}</span>
                      <StatusPill status={h.status} />
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </ActionSheet>

      <ConfirmSheet
        open={confirming}
        onClose={() => setConfirming(false)}
        onConfirm={async () => { onClose(); await approvePayment(p); }}
        title="Approve this payment?"
        message={`${p.user_email} · ${planShort(p.plan)} · $${p.amount} USDT. ${isBot ? 'A license key will be issued automatically.' : 'A 30-day cycle activates automatically.'} Undo is available from the toast.`}
        confirmLabel={isBot ? 'Approve + License' : 'Approve + 30d'}
      />
      <ConfirmSheet
        open={confirmingUndo}
        onClose={() => setConfirmingUndo(false)}
        onConfirm={async () => { onClose(); await undoPayment(p); }}
        title="Undo this decision?"
        message="The payment returns to pending. The granted cycle is pulled back 30 days (or the license key is cleared)."
        confirmLabel="Undo"
      />
      <ConfirmSheet
        open={confirmingDelete}
        onClose={() => setConfirmingDelete(false)}
        onConfirm={async () => { onClose(); await deletePayment(p); }}
        title="Delete this payment record?"
        message="This removes it from the ledger permanently. Undo is not possible for deletes."
        confirmLabel="Delete"
        danger
      />
    </>
  );
}
