import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Radio, Eye, EyeOff, Lock, Plus } from 'lucide-react';
import { pb } from '../../../lib/pocketbase';
import { useAdmin } from '../AdminContext';
import { EmptyState, labelCls } from '../components/ui';
import { StatusDot } from '../components/StatusDot';
import DataTable from '../components/DataTable';
import Drawer from '../components/Drawer';
import { useUrlQuery, replaceParams } from '../lib/urlState';
import { fmtRelative } from '../lib/format';
import { cn } from '../../../lib/utils';

/**
 * Managed Accounts tab of Traders: traders hand over their MT4/MT5 credentials
 * so the desk can run bots on their balance with a 70/30 profit split.
 * Credentials are AES-encrypted at rest and only decrypted here, on demand.
 */
export const MANAGED_TAB = { id: 'managed', label: 'Managed', icon: Radio };

const STAGES = [
  { status: 'in_progress', label: 'Reviewing', tone: 'sky', note: 'Desk is reviewing the account and credentials.' },
  { status: 'trading', label: 'Bots Live', tone: 'green', note: 'AKG systems are now trading this account. Profit split active: 70% trader / 30% desk.' },
  { status: 'settlement', label: 'Settlement Due', tone: 'amber', note: 'Profit split settlement is due. The desk will share the statement.' },
  { status: 'paused', label: 'Paused', tone: 'amber', note: 'Trading paused on this account by the desk.' },
  { status: 'pending_review', label: 'Reset to Review', tone: 'plain', note: 'Account queued for desk review.' },
  { status: 'rejected', label: 'Reject', tone: 'rose', note: 'Application rejected. Verify account details and reapply.' },
];

const PAGE_SIZE = 15;

export default function ManagedAccounts({ sub, search }) {
  const { connectors, updateConnector } = useAdmin();
  const query = useUrlQuery();

  const urlPage = Math.max(1, Number(query.page) || 1);
  const sortCol = query.sort || 'applied';
  const sortDir = query.dir === 'asc' ? 'asc' : 'desc';

  const [cursor, setCursor] = useState(0);

  const rows = useMemo(() => {
    const q = (search || '').trim().toLowerCase();
    return connectors
      .filter((c) => sub === 'all'
        || (sub === 'pending'
          ? c.status === 'pending_review' || c.status === 'pending'
          : c.status === sub))
      .filter((c) => !q || (c.user_email || '').toLowerCase().includes(q));
  }, [connectors, sub, search]);

  const sorted = useMemo(() => {
    const val = {
      name: (c) => (c.user_email || '').toLowerCase(),
      applied: (c) => new Date(String(c.created).replace(' ', 'T')).getTime() || 0,
    }[sortCol] || ((c) => 0);
    const arr = [...rows].sort((a, b) => {
      const x = val(a); const y = val(b);
      return x < y ? -1 : x > y ? 1 : 0;
    });
    return sortDir === 'desc' ? arr.reverse() : arr;
  }, [rows, sortCol, sortDir]);

  const pageCount = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const safePage = Math.min(urlPage, pageCount);
  const visible = useMemo(() => sorted.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE), [sorted, safePage]);
  useEffect(() => { setCursor((c) => Math.min(c, Math.max(0, visible.length - 1))); }, [visible.length]);

  /* ------------------------- keyboard: J/K + Enter ------------------------ */
  const onKeyDown = useCallback((e) => {
    const t = e.target;
    if (t?.closest?.('input,textarea,select') || t?.isContentEditable) return;
    if (document.querySelector('[role="dialog"],[role="alertdialog"]')) return;
    const k = e.key.toLowerCase();
    if (k !== 'j' && k !== 'k' && e.key !== 'Enter') return;
    const row = visible[cursor];
    if (!row) return;
    if (k === 'j') { e.preventDefault(); setCursor((c) => Math.min(visible.length - 1, c + 1)); }
    else if (k === 'k') { e.preventDefault(); setCursor((c) => Math.max(0, c - 1)); }
    else if (e.key === 'Enter') {
      e.preventDefault();
      replaceParams({ id: query.id === row.id ? '' : row.id });
    }
  }, [visible, cursor, query.id]);

  useEffect(() => {
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onKeyDown]);

  const dossier = query.id ? connectors.find((c) => c.id === query.id) || null : null;

  const columns = useMemo(() => [
    {
      key: 'trader',
      label: 'Trader',
      sortKey: 'name',
      head: 'w-[230px]',
      cell: (c) => <div className="truncate text-xs font-semibold text-white">{c.user_email}</div>,
    },
    {
      key: 'account',
      label: 'Account',
      cell: (c) => (
        <span className="block max-w-[260px] truncate font-data text-[11px] text-akg-silver">
          {c.platform} · #{c.account_number} · {c.broker || c.server || '-'}
        </span>
      ),
    },
    {
      key: 'split',
      label: 'Split',
      head: 'w-[70px]',
      cell: (c) => (
        <span className="font-data text-[11px] font-bold text-akg-green">
          {c.user_profit_share ?? 70}/{100 - (c.user_profit_share ?? 70)}
        </span>
      ),
    },
    {
      key: 'applied',
      label: 'Applied',
      sortKey: 'applied',
      head: 'w-[110px]',
      cell: (c) => <span className="whitespace-nowrap font-data text-[10px] text-akg-muted">{fmtRelative(c.created)}</span>,
    },
    {
      key: 'status',
      label: '',
      align: 'right',
      cell: (c) => <StatusDot status={c.status} pulse={c.status === 'pending_review' || c.status === 'pending'} />,
    },
  ], []);

  const sortToggle = (col) => {
    if (sortCol === col) replaceParams({ dir: sortDir === 'desc' ? 'asc' : 'desc' });
    else replaceParams({ sort: col, dir: 'desc', page: '' });
  };

  return (
    <>
      <DataTable
        name="managed"
        columns={columns}
        rows={visible}
        sort={[sortCol, sortDir]}
        onSort={sortToggle}
        cursor={cursor}
        onCursor={setCursor}
        onRowClick={(c) => replaceParams({ id: query.id === c.id ? '' : c.id })}
        page={safePage}
        onPage={(np) => { replaceParams({ page: np > 1 ? np : '' }); setCursor(0); }}
        pageSize={PAGE_SIZE}
        total={sorted.length}
        empty={(
          <EmptyState
            icon={Radio}
            title="No applications in this view"
            hint="Trader account-management submissions appear here."
          />
        )}
        mobileCard={(c) => (
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="truncate text-xs font-semibold text-white">{c.user_email}</div>
              <div className="mt-0.5 truncate font-data text-[10px] text-akg-muted">
                {c.platform} · #{c.account_number} · {c.broker || c.server || '-'}
              </div>
              <div className="font-data text-[10px] text-akg-green">
                {c.user_profit_share ?? 70}/{100 - (c.user_profit_share ?? 70)} split · {fmtRelative(c.created)}
              </div>
            </div>
            <StatusDot status={c.status} pulse={false} className="shrink-0" />
          </div>
        )}
      />

      {dossier && (
        <ManagedDossier
          account={dossier}
          onClose={() => replaceParams({ id: '' })}
        />
      )}
    </>
  );
}

/* ------------------------------- dossier --------------------------------- */
function ManagedDossier({ account, onClose }) {
  const { updateConnector } = useAdmin();
  const [creds, setCreds] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const [note, setNote] = useState(account.admin_notes || '');
  const [settlements, setSettlements] = useState(null);
  const [showSettleForm, setShowSettleForm] = useState(false);

  const loadSettlements = useCallback((accountId) => {
    if (!accountId) return;
    pb.collection('managed_settlements').getFullList({ filter: `account = "${accountId}"`, sort: '-period_end' })
      .then(setSettlements)
      .catch(() => setSettlements([]));
  }, []);

  useEffect(() => {
    setNote(account.admin_notes || '');
    setCreds(null);
    setRevealed(false);
    setShowSettleForm(false);
    loadSettlements(account.id);
  }, [account.id, account.admin_notes, loadSettlements]);

  const reveal = async () => {
    try {
      const res = await pb.send(`/api/akg/creds/${account.id}`, { method: 'GET' });
      setCreds(res);
      setRevealed(true);
    } catch {
      setRevealed(false);
    }
  };

  return (
    <Drawer
      open
      onClose={onClose}
      title={account.user_email}
      subtitle={`${account.platform} · #${account.account_number}`}
      footer={
        <div>
          <h3 className={labelCls}>Desk note (shown to the trader)</h3>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="min-h-[70px] w-full rounded-xl border border-white/10 bg-[#0A0D13] px-3.5 py-2.5 text-sm leading-relaxed text-white placeholder:text-akg-muted/60 focus:border-[#F3C653]/50 focus:outline-none"
            placeholder="Statement, settlement details, next steps…"
          />
          <button
            onClick={() => updateConnector(account, { admin_notes: note })}
            className="mt-2 h-10 w-full rounded-full bg-[linear-gradient(120deg,#E8BC4F_0%,#F3C653_38%,#FFE9A8_58%,#DFAE3E_100%)] text-sm font-bold text-[#1C1403] active:scale-[0.98]"
          >
            Save & Transmit Note
          </button>
        </div>
      }
    >
      <div className="space-y-5">
        <div className="flex items-center justify-between rounded-xl border border-white/[0.07] bg-[#0A0D13] px-4 py-3">
          <span className="text-xs text-akg-muted">Stage</span>
          <StatusDot status={account.status} />
        </div>

        <div className="rounded-2xl border border-[#F3C653]/25 bg-[#0A0D13] p-4">
          <div className="flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-xs font-bold text-akg-silver">
              <Lock className="h-3.5 w-3.5 text-akg-gold" /> Broker credentials
            </h3>
            <button
              onClick={() => (revealed ? setRevealed(false) : reveal())}
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
                    await updateConnector(account, { status: a.status, admin_notes: a.note });
                    setNote(a.note);
                  }}
                  className={cn('h-11 rounded-xl border text-xs font-bold transition-all active:scale-[0.98]', tone,
                    account.status === a.status && 'ring-1 ring-white/25')}
                >
                  {a.label}
                </button>
              );
            })}
          </div>
          <p className="mt-2 font-data text-[10px] text-akg-muted">
            Trader share: {account.user_profit_share ?? 70}% · Desk: {100 - (account.user_profit_share ?? 70)}%
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
              account={account}
              onSaved={() => { setShowSettleForm(false); loadSettlements(account.id); }}
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
                        loadSettlements(account.id);
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
      </div>
    </Drawer>
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
