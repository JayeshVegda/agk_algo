import React, { useEffect, useState } from 'react';
import { ActionSheet, ConfirmSheet } from './ActionSheet';
import { StatusPill, TxidCell } from './ui';
import { fmtDateTime } from '../lib/format';
import { planShort } from './PaymentRow';
import { useAdmin } from '../AdminContext';
import { pb } from '../../../lib/pocketbase';
import { cn } from '../../../lib/utils';

export default function PaymentDetailSheet({ payment: p, open, onClose, onReject }) {
  const { approvePayment, undoPayment, deletePayment, resetLicenseBinding } = useAdmin();
  const [user, setUser] = useState(null);
  const [history, setHistory] = useState(null);
  const [confirming, setConfirming] = useState(false);
  const [confirmingUndo, setConfirmingUndo] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  useEffect(() => {
    if (!open || !p?.user_email) return;
    setUser(null);
    setHistory(null);

    pb.collection('users').getFirstListItem(`email = "${p.user_email}"`)
      .then(setUser)
      .catch(() => setUser(null));

    pb.collection('payments').getFullList({
      filter: `user_email = "${p.user_email}"`,
      sort: '-created',
    })
      .then(setHistory)
      .catch(() => setHistory([]));
  }, [open, p?.user_email, p?.id]);

  if (!p) return null;

  const isPending = p.status === 'pending';
  const isBot = String(p.plan || '').startsWith('BOT:');

  const expiry = user?.cycle_expires_at ? new Date(String(user.cycle_expires_at).replace(' ', 'T')).getTime() : null;
  const cycleDays = expiry ? Math.ceil((expiry - Date.now()) / 86400000) : null;

  const row = (label, value) => (
    <div key={label} className="flex items-center justify-between gap-3 border-b border-akg-hairline px-3.5 py-2.5 text-xs last:border-b-0">
      <span className="font-mono text-akg-muted">{label}</span>
      <span className="font-semibold text-akg-text text-right">{value}</span>
    </div>
  );

  return (
    <>
      <ActionSheet
        open={open}
        onClose={onClose}
        title={p.user_email}
        subtitle={`${planShort(p.plan)} · $${p.amount} USDT`}
        footer={
          <div className="flex flex-wrap gap-2">
            {isPending ? (
              <>
                <button
                  onClick={() => setConfirming(true)}
                  className="h-10 flex-1 rounded-lg bg-akg-cta text-sm font-bold text-akg-cta-text active:scale-[0.98] hover:opacity-90 shadow-sm cursor-pointer"
                >
                  {isBot ? 'Approve + Issue License' : 'Approve + Grant 30d'}
                </button>
                <button
                  onClick={() => { onClose(); onReject?.(p); }}
                  className="h-10 rounded-lg border border-rose-500/30 px-5 text-sm font-semibold text-rose-400 hover:bg-rose-500/10 cursor-pointer"
                >
                  Reject...
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setConfirmingUndo(true)}
                  className="h-10 flex-1 rounded-lg border border-akg-accent/40 text-sm font-semibold text-akg-accent hover:bg-akg-accent/10 cursor-pointer"
                >
                  Undo → back to pending
                </button>
                <button
                  onClick={() => setConfirmingDelete(true)}
                  className="h-10 rounded-lg border border-akg-hairline px-5 text-sm font-semibold text-akg-muted hover:border-rose-500/40 hover:text-rose-400 cursor-pointer"
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
              <span className="rounded-md bg-emerald-500/15 px-2.5 py-1 font-mono text-[11px] font-bold text-akg-green">₹{Number(p.inr_amount).toLocaleString('en-IN')} via UPI</span>
            ) : (
              <span className="rounded-md bg-emerald-500/15 px-2.5 py-1 font-mono text-[11px] font-bold text-akg-accent">{p.network}</span>
            )}
          </div>

          <div className="overflow-hidden rounded-lg border border-akg-hairline bg-akg-raised">
            {row('Trader', p.user_email)}
            {row('Plan', planShort(p.plan))}
            {row('Amount', `$${p.amount} USDT${p.inr_amount ? ` · ₹${Number(p.inr_amount).toLocaleString('en-IN')}` : ''}`)}
            {row('Method', p.method === 'upi' ? 'GPay / UPI' : `Crypto · ${p.network}`)}
            {row('Reference', <TxidCell network={p.network} txid={p.txid} full />)}
            {row('Submitted', fmtDateTime(p.created))}
            {p.license_key && row('License key', p.license_key)}
            {isBot && p.license_key && row('Bound account', (
              <div className="flex flex-wrap items-center justify-end gap-2">
                <span className={p.bound_account ? 'text-akg-green font-mono' : 'text-akg-muted'}>
                  {p.bound_account ? `#${p.bound_account}` : 'Unbound (binds on first launch)'}
                </span>
                {p.bound_account && (
                  <button
                    onClick={async () => {
                      if (window.confirm(`Reset account binding for key ${p.license_key}? It will bind to the next account that launches it.`)) {
                        await resetLicenseBinding(p);
                      }
                    }}
                    className="rounded-md border border-amber-500/40 bg-amber-500/10 px-2.5 py-1 font-mono text-[10px] font-bold text-amber-500 hover:bg-amber-500/20 active:scale-95 transition-all cursor-pointer"
                  >
                    Reset Binding
                  </button>
                )}
              </div>
            ))}
            {p.admin_notes && row('Desk note', p.admin_notes)}
          </div>

          {/* trader context */}
          <div>
            <h3 className="mb-2 font-mono text-[10px] uppercase tracking-wider text-akg-muted">Trader context</h3>
            <div className="grid grid-cols-3 gap-2">
              {[
                ['Prior confirmed', history ? String(history.filter((h) => h.status === 'confirmed').length) : '...'],
                ['Current plan', user ? (user.plan === 'PERFECT_SIGNAL_BOX' ? 'Perfect' : user.plan === 'SR_SIGNAL_BOX' ? 'SR' : 'None') : '...'],
                ['Cycle', cycleDays === null ? '-' : cycleDays < 0 ? 'expired' : `${cycleDays}d left`],
              ].map(([k, v]) => (
                <div key={k} className="rounded-lg border border-akg-hairline bg-akg-raised px-3 py-2.5">
                  <div className="font-mono text-[9px] uppercase tracking-wide text-akg-muted">{k}</div>
                  <div className="mt-0.5 font-mono text-sm font-bold text-akg-text">{v}</div>
                </div>
              ))}
            </div>
          </div>

          {/* history */}
          <div>
            <h3 className="mb-2 font-mono text-[10px] uppercase tracking-wider text-akg-muted">
              Recent payments {history ? `(${history.length})` : ''}
            </h3>
            {history === null ? (
              <div className="h-16 animate-pulse rounded-lg bg-akg-raised" />
            ) : history.length === 0 ? (
              <p className="rounded-lg border border-akg-hairline bg-akg-raised px-4 py-3 text-[11px] text-akg-muted">First payment from this trader.</p>
            ) : (
              <div className="divide-y divide-akg-hairline overflow-hidden rounded-lg border border-akg-hairline bg-akg-raised">
                {history.map((h) => (
                  <div key={h.id} className={cn('flex items-center justify-between gap-3 px-3.5 py-2', h.id === p.id && 'bg-emerald-500/[0.05]')}>
                    <span className="flex min-w-0 items-center gap-2">
                      <span className="font-mono text-[10px] text-akg-muted">{fmtDateTime(h.created)}</span>
                      <span className="truncate text-[11px] text-akg-text">{planShort(h.plan)}</span>
                    </span>
                    <span className="flex shrink-0 items-center gap-2">
                      <span className="font-mono text-[11px] font-bold text-akg-text">${h.amount}</span>
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
