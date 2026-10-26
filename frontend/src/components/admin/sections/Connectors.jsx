import React, { useState } from 'react';
import { Radio, Eye, EyeOff, Lock, Handshake, Plus, IndianRupee } from 'lucide-react';
import { pb } from '../../../lib/pocketbase';
import { useAdmin } from '../AdminContext';
import { SectionHeader, EmptyState, StatusPill, labelCls, FilterChips } from '../components/ui';
import { ActionSheet } from '../components/ActionSheet';
import { fmtRelative } from '../lib/format';
import { cn } from '../../../lib/utils';

/**
 * Managed Accounts: traders hand over their MT4/MT5 credentials so the desk
 * can run bots on their balance with a 70/30 profit split. Credentials are
 * AES-encrypted at rest and only decrypted here, on demand, for admins.
 */
const STAGES = [
  { status: 'in_progress', label: 'Reviewing', tone: 'sky', note: 'Desk is reviewing the account and credentials.' },
  { status: 'trading', label: 'Bots Live', tone: 'green', note: 'AKG systems are now trading this account. Profit split active: 70% trader / 30% desk.' },
  { status: 'settlement', label: 'Settlement Due', tone: 'amber', note: 'Profit split settlement is due. The desk will share the statement.' },
  { status: 'paused', label: 'Paused', tone: 'amber', note: 'Trading paused on this account by the desk.' },
  { status: 'pending_review', label: 'Reset to Review', tone: 'plain', note: 'Account queued for desk review.' },
  { status: 'rejected', label: 'Reject', tone: 'rose', note: 'Application rejected. Verify account details and reapply.' },
];

export default function Connectors() {
  const { connectors, updateConnector } = useAdmin();
  const [statusFilter, setStatusFilter] = useState('all');
  const [dossier, setDossier] = useState(null);
  const [note, setNote] = useState('');
  const [creds, setCreds] = useState(null);
  const [revealed, setRevealed] = useState(false);

  const count = (st) => connectors.filter((c) => c.status === st).length;
  const pending = connectors.filter((c) => c.status === 'pending_review' || c.status === 'pending');

  const visible = statusFilter === 'all'
    ? connectors
    : connectors.filter((c) =>
        statusFilter === 'pending' ? (c.status === 'pending_review' || c.status === 'pending') : c.status === statusFilter
      );
  const sorted = [...visible].sort((a, b) => {
    // within a filter: newest applications first, except pending = oldest first (fair queue)
    return statusFilter === 'pending' || statusFilter === 'all'
      ? 0
      : b.created.localeCompare(a.created);
  });

  const open = (c) => {
    setDossier(c);
    setNote(c.admin_notes || '');
    setCreds(null);
    setRevealed(false);
    setSettlements(null);
    setShowSettleForm(false);
    loadSettlements(c.id);
  };

  // Settlements for this account
  const [settlements, setSettlements] = useState(null);
  const [showSettleForm, setShowSettleForm] = useState(false);
  const loadSettlements = React.useCallback((accountId) => {
    if (!accountId) return;
    pb.collection('managed_settlements').getFullList({ filter: `account = "${accountId}"`, sort: '-period_end' })
      .then(setSettlements)
      .catch(() => setSettlements([]));
  }, []);

  const reveal = async (c) => {
    try {
      const res = await pb.send(`/api/akg/creds/${c.id}`, { method: 'GET' });
      setCreds(res);
      setRevealed(true);
    } catch {
      setRevealed(false);
    }
  };

  return (
    <div className="space-y-5">
      <SectionHeader
        title="Managed Accounts"
        sub={`${pending.length} awaiting review · ${connectors.filter((c) => c.status === 'trading').length} trading live. 70/30 profit split.`}
      />

      <FilterChips
        value={statusFilter}
        onChange={setStatusFilter}
        options={[
          { id: 'all', label: 'All', count: connectors.length },
          { id: 'trading', label: 'Bots Live', count: count('trading') },
          { id: 'pending', label: 'New', count: pending.length },
          { id: 'in_progress', label: 'Reviewing', count: count('in_progress') },
          { id: 'settlement', label: 'Settlement', count: count('settlement') },
          { id: 'paused', label: 'Paused', count: count('paused') },
          { id: 'rejected', label: 'Rejected', count: count('rejected') },
        ].filter((o) => o.id === 'all' || o.count > 0 || ['trading', 'pending'].includes(o.id))}
      />

      {sorted.length === 0 ? (
        <EmptyState icon={Radio} title="No applications in this view" hint="Trader account-management submissions appear here." />
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {sorted.map((c) => (
            <button
              key={c.id}
              onClick={() => open(c)}
              className="group rounded-2xl border border-white/10 bg-akg-surface p-4 text-left transition-all hover:border-[#F3C653]/40"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="truncate text-sm font-bold text-white">{c.user_email}</div>
                  <div className="mt-0.5 font-data text-[10px] text-akg-muted">
                    {c.platform} · #{c.account_number} · {c.broker || c.server || '-'}
                  </div>
                </div>
                <StatusPill status={c.status} />
              </div>
              <div className="mt-2.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5 font-data text-[10px] text-akg-green">
                  <Handshake className="h-3 w-3" /> {c.user_profit_share ?? 70}/{100 - (c.user_profit_share ?? 70)} split
                </span>
                <span className="font-data text-[10px] text-akg-muted">{fmtRelative(c.created)}</span>
              </div>
            </button>
          ))}
        </div>
      )}

      <ActionSheet
        open={!!dossier}
        onClose={() => setDossier(null)}
        size="lg"
        title="Managed account"
        subtitle={dossier ? `${dossier.user_email} · ${dossier.platform}` : ''}
      >
        {dossier && (
          <div className="space-y-5">
            <div className="rounded-2xl border border-[#F3C653]/25 bg-[#0A0D13] p-4">
              <div className="flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-xs font-bold text-akg-silver">
                  <Lock className="h-3.5 w-3.5 text-akg-gold" /> Broker credentials
                </h3>
                <button
                  onClick={() => (revealed ? setRevealed(false) : reveal(dossier))}
                  className="flex items-center gap-1.5 rounded-full border border-[#F3C653]/30 px-3 py-1.5 text-[11px] font-bold text-akg-gold hover:bg-[#F3C653]/10"
                >
                  {revealed ? <><EyeOff className="h-3.5 w-3.5" /> Hide</> : <><Eye className="h-3.5 w-3.5" /> Reveal</>}
                </button>
              </div>
              {revealed && creds ? (
                <div className="mt-3 space-y-1.5 font-data text-xs">
                  {[
                    ['Login', `#${creds.account_number}`],
                    ['Password', creds.password],
                    ['Server', creds.server],
                    ['Broker', creds.broker || '-'],
                    ['Platform', creds.platform],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between gap-3 rounded-lg bg-white/[0.04] px-3 py-1.5">
                      <span className="text-akg-muted">{k}</span>
                      <span className="text-white">{v}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-2.5 text-[11px] leading-relaxed text-akg-muted">
                  Password is encrypted at rest and never appears in lists or exports. Reveal only when connecting the account.
                </p>
              )}
            </div>

            <div>
              <h3 className={labelCls}>Stage</h3>
              <div className="grid grid-cols-2 gap-2">
                {STAGES.map((a) => {
                  const tone = {
                    sky: 'border-sky-400/30 text-sky-300 hover:bg-sky-400/10',
                    green: 'border-akg-green/30 text-akg-green hover:bg-akg-green/10',
                    amber: 'border-amber-400/30 text-amber-300 hover:bg-amber-400/10',
                    rose: 'border-rose-500/30 text-rose-300 hover:bg-rose-500/10',
                    plain: 'border-white/15 text-akg-muted hover:bg-white/5',
                  }[a.tone];
                  return (
                    <button
                      key={a.status}
                      onClick={async () => {
                        await updateConnector(dossier, { status: a.status, admin_notes: a.note });
                        setNote(a.note);
                      }}
                      className={cn('h-11 rounded-xl border text-xs font-bold transition-all active:scale-[0.98]', tone,
                        dossier.status === a.status && 'ring-1 ring-white/25')}
                    >
                      {a.label}
                    </button>
                  );
                })}
              </div>
              <p className="mt-2 flex items-center justify-between font-data text-[10px] text-akg-muted">
                <span>Trader share: {dossier.user_profit_share ?? 70}% · Desk: {100 - (dossier.user_profit_share ?? 70)}%</span>
                <StatusPill status={dossier.status} />
              </p>
            </div>

            {/* profit-split settlements */}
            <div>
              <div className="flex items-center justify-between">
                <h3 className={labelCls}>Profit-split settlements</h3>
                <button
                  onClick={() => setShowSettleForm((v) => !v)}
                  className="flex h-8 items-center gap-1 rounded-full border border-[#F3C653]/40 px-3 text-[11px] font-bold text-akg-gold hover:bg-[#F3C653]/10"
                >
                  <Plus className="h-3 w-3" /> Record settlement
                </button>
              </div>

              {showSettleForm && (
                <SettlementForm
                  account={dossier}
                  onSaved={() => { setShowSettleForm(false); loadSettlements(dossier.id); }}
                />
              )}

              {settlements === null ? (
                <div className="h-12 animate-pulse rounded-xl bg-white/[0.03]" />
              ) : settlements.length === 0 ? (
                <p className="rounded-xl border border-white/[0.06] bg-[#0A0D13] px-4 py-3 text-[11px] text-akg-muted">
                  No settlements recorded yet.
                </p>
              ) : (
                <div className="space-y-2">
                  {settlements.map((st) => (
                    <div key={st.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/[0.07] bg-[#0A0D13] px-3.5 py-2.5">
                      <span className="font-data text-[11px] text-akg-muted">
                        {st.period_start} → {st.period_end}
                      </span>
                      <span className="flex items-center gap-3 font-data text-[11px]">
                        <span className="text-akg-silver">gross ${Number(st.gross_profit).toLocaleString()}</span>
                        <span className="text-akg-green">trader ${Number(st.user_amount).toLocaleString()}</span>
                        <span className="text-akg-gold">desk ${Number(st.desk_amount).toLocaleString()}</span>
                        <button
                          onClick={async () => {
                            await pb.collection('managed_settlements').update(st.id, { status: st.status === 'paid' ? 'due' : 'paid' });
                            loadSettlements(dossier.id);
                          }}
                          className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase ${st.status === 'paid' ? 'bg-akg-green/15 text-akg-green' : 'bg-amber-400/15 text-amber-300'}`}
                        >
                          {st.status}
                        </button>
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h3 className={labelCls}>Desk note (shown to the trader)</h3>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="min-h-[90px] w-full rounded-xl border border-white/10 bg-[#0A0D13] px-3.5 py-2.5 text-sm leading-relaxed text-white placeholder:text-akg-muted/60 focus:border-[#F3C653]/50 focus:outline-none"
                placeholder="Statement, settlement details, next steps…"
              />
              <button
                onClick={() => updateConnector(dossier, { admin_notes: note })}
                className="mt-2 h-10 w-full rounded-full bg-[linear-gradient(120deg,#E8BC4F_0%,#F3C653_38%,#FFE9A8_58%,#DFAE3E_100%)] text-sm font-bold text-[#1C1403] active:scale-[0.98]"
              >
                Save & Transmit Note
              </button>
            </div>
          </div>
        )}
      </ActionSheet>
    </div>
  );
}


function SettlementForm({ account, onSaved }) {
  const share = account.user_profit_share ?? 70;
  const [form, setForm] = useState({ period_start: '', period_end: '', start_balance: '', end_balance: '' });
  const [busy, setBusy] = useState(false);
  const gross = Number(form.end_balance) - Number(form.start_balance);
  const valid = form.period_start && form.period_end && !isNaN(gross) && form.end_balance !== '';

  const save = async () => {
    setBusy(true);
    try {
      await pb.collection('managed_settlements').create({
        account: account.id,
        period_start: form.period_start,
        period_end: form.period_end,
        start_balance: Number(form.start_balance) || 0,
        end_balance: Number(form.end_balance) || 0,
        gross_profit: Number(gross.toFixed(2)),
        user_share_pct: share,
        user_amount: Number((gross * share / 100).toFixed(2)),
        desk_amount: Number((gross * (100 - share) / 100).toFixed(2)),
        status: gross >= 0 ? 'due' : 'due',
      });
      onSaved();
    } finally {
      setBusy(false);
    }
  };

  const input = 'h-10 w-full rounded-xl border border-white/10 bg-[#0A0D13] px-3 font-data text-xs text-white focus:border-[#F3C653]/50 focus:outline-none';

  return (
    <div className="mb-3 space-y-2.5 rounded-xl border border-[#F3C653]/20 bg-[#F3C653]/[0.03] p-3.5">
      <div className="grid grid-cols-2 gap-2.5">
        <input type="date" value={form.period_start} onChange={(e) => setForm({ ...form, period_start: e.target.value })} className={input} />
        <input type="date" value={form.period_end} onChange={(e) => setForm({ ...form, period_end: e.target.value })} className={input} />
        <input type="number" value={form.start_balance} onChange={(e) => setForm({ ...form, start_balance: e.target.value })} placeholder="start balance $" className={input} />
        <input type="number" value={form.end_balance} onChange={(e) => setForm({ ...form, end_balance: e.target.value })} placeholder="end balance $" className={input} />
      </div>
      {form.end_balance !== '' && (
        <div className="flex items-center justify-between rounded-lg bg-white/[0.04] px-3 py-2 font-data text-[11px]">
          <span className="text-akg-muted">gross ${isNaN(gross) ? '—' : gross.toFixed(2)}</span>
          <span className="text-akg-green">trader ${isNaN(gross) ? '—' : (gross * share / 100).toFixed(2)} ({share}%)</span>
          <span className="text-akg-gold">desk ${isNaN(gross) ? '—' : (gross * (100 - share) / 100).toFixed(2)}</span>
        </div>
      )}
      <button
        onClick={save}
        disabled={!valid || busy}
        className="h-10 w-full rounded-full bg-[linear-gradient(120deg,#E8BC4F,#F3C653,#DFAE3E)] text-xs font-bold text-[#1C1403] disabled:opacity-40"
      >
        {busy ? 'Saving…' : 'Save settlement'}
      </button>
    </div>
  );
}
