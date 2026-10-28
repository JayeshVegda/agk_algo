import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { CreditCard, Download, Inbox } from 'lucide-react';
import { pb } from '../../../lib/pocketbase';
import { planShort } from '../components/PaymentRow';
import { useAdmin } from '../AdminContext';
import { usePagedList, useStats } from '../lib/pagedList';
import { useUrlQuery, replaceParams } from '../lib/urlState';
import { SectionHeader, EmptyState, TxidCell } from '../components/ui';
import { StatusDot } from '../components/StatusDot';
import { Toolbar } from '../components/Toolbar';
import DataTable from '../components/DataTable';
import PaymentDrawer from '../components/PaymentDrawer';
import { ConfirmSheet, ActionSheet } from '../components/ActionSheet';
import { fmtRelative, fmtDateTime } from '../lib/format';
import { cn } from '../../../lib/utils';

/**
 * Money Queue — server-paginated table. Pending is oldest-first (fair);
 * history sorts newest-first by default. Row = one line; click expands the
 * payment proof; J/K moves, A approves, R rejects. State lives in the URL:
 * ?f= | ?q= | ?page= | ?sort=&dir= | ?id= (dossier) | ?exp= (expanded row).
 */
export default function Payments() {
  const { approvePayment, rejectPayment } = useAdmin();
  const { stats } = useStats();
  const query = useUrlQuery();

  const validFilters = ['pending', 'confirmed', 'rejected', 'all'];
  const filter = validFilters.includes(query.f) ? query.f : 'pending';
  const search = query.q || '';
  const urlPage = Math.max(1, Number(query.page) || 1);
  const sortCol = query.sort || 'waiting';
  const sortDir = (query.dir === 'desc' || query.dir === 'asc') ? query.dir : (filter === 'pending' ? 'asc' : 'desc');

  const [cursor, setCursor] = useState(0);
  const [selected, setSelected] = useState(new Set());
  const [confirming, setConfirming] = useState(null);
  const [rejecting, setRejecting] = useState(null);
  const [reason, setReason] = useState('');
  const [bulkBusy, setBulkBusy] = useState(false);

  const sortField = { waiting: 'created', trader: 'user_email', system: 'plan', amount: 'amount' }[sortCol] || 'created';
  const pbSort = `${sortDir === 'desc' ? '-' : ''}${sortField}`;

  const page = usePagedList('payments', {
    filter: filter === 'all' ? '' : `status = '${filter}'`,
    sort: pbSort,
    searchKeys: ['user_email', 'txid', 'network', 'plan'],
    perPage: 15,
    search,
    onSearch: (v) => replaceParams({ q: v, page: '' }),
    page: urlPage,
    onPage: (np) => replaceParams({ page: np > 1 ? np : '' }),
  });

  // Deep-linked record (?id= may sit outside the current page).
  const [deeplinked, setDeeplinked] = useState(null);
  useEffect(() => {
    setDeeplinked(null);
    if (!query.id) return undefined;
    if (page.items.some((i) => i.id === query.id)) return undefined;
    let live = true;
    pb.collection('payments').getOne(query.id).then((r) => { if (live) setDeeplinked(r); }).catch(() => { if (live) setDeeplinked(false); });
    return () => { live = false; };
  }, [query.id, page.items]);
  const detailPayment = query.id
    ? (page.items.find((i) => i.id === query.id) || (deeplinked || null))
    : null;

  // Repeat-buyer trust context for the current page (one extra query).
  const [priorMap, setPriorMap] = useState({});
  useEffect(() => {
    const emails = [...new Set(page.items.map((p) => p.user_email).filter(Boolean))];
    if (!emails.length) { setPriorMap({}); return undefined; }
    const expr = emails.map((e) => `user_email = "${e}"`).join(' || ');
    pb.collection('payments').getFullList({ filter: `(${expr}) && status = 'confirmed'` })
      .then((recs) => {
        const m = {};
        recs.forEach((r) => { m[r.user_email] = (m[r.user_email] || 0) + 1; });
        setPriorMap(m);
      })
      .catch(() => setPriorMap({}));
    return undefined;
  }, [page.items]);

  const refresh = useCallback(() => { page.refresh(); setSelected(new Set()); }, [page]); // eslint-disable-line react-hooks/exhaustive-deps

  const openReject = (p) => { setRejecting(p); setReason(''); };
  const afterAction = () => refresh();

  const onApproveClick = (p) => setConfirming(p);

  /* ------------------------- keyboard: J/K/A/R ------------------------- */
  const items = page.items;
  const onKeyDown = useCallback((e) => {
    const t = e.target;
    if (t?.closest?.('input,textarea,select') || t?.isContentEditable) return;
    if (document.querySelector('[role="dialog"],[role="alertdialog"]')) return; // a modal is open
    const k = e.key.toLowerCase();
    if (k !== 'j' && k !== 'k' && k !== 'a' && k !== 'r' && e.key !== 'Enter') return;
    const row = items[cursor];
    if (!row) return;
    if (k === 'j') { e.preventDefault(); setCursor((c) => Math.min(items.length - 1, c + 1)); }
    else if (k === 'k') { e.preventDefault(); setCursor((c) => Math.max(0, c - 1)); }
    else if (e.key === 'Enter') {
      e.preventDefault();
      const exp = row.id;
      replaceParams({ exp: (query.exp === exp ? '' : exp), id: '' });
    } else if (k === 'a' && row.status === 'pending') {
      e.preventDefault();
      setConfirming(row);
    } else if (k === 'r' && row.status === 'pending') {
      e.preventDefault();
      openReject(row);
    }
  }, [items, cursor, query.exp]);

  useEffect(() => {
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onKeyDown]);

  /* ------------------------------- columns ------------------------------ */
  const columns = useMemo(() => [
    {
      key: 'waiting',
      sortKey: 'waiting',
      label: filter === 'pending' ? 'Waiting' : 'When',
      align: 'left',
      head: 'w-[86px]',
      cell: (p) => {
        const isPending = p.status === 'pending';
        const hrs = (Date.now() - new Date(String(p.created).replace(' ', 'T')).getTime()) / 3600000;
        return (
          <span className={cn(
            'font-data text-[10px] whitespace-nowrap',
            isPending && hrs > 24 ? 'font-bold text-rose-300'
              : isPending && hrs > 12 ? 'text-amber-300'
                : 'text-akg-muted',
          )}>
            {isPending ? timeWaiting(p.created) : fmtRelative(p.created)}
          </span>
        );
      },
    },
    {
      key: 'trader',
      sortKey: 'trader',
      label: 'Trader',
      cell: (p) => (
        <span className="flex min-w-0 items-center gap-2">
          <span className="truncate text-xs font-semibold text-white">{p.user_email || '—'}</span>
          {p.status === 'pending' && purchaseLabel(priorMap[p.user_email] || 0) && (
            <span className="shrink-0 rounded bg-white/[0.06] px-1.5 py-px font-data text-[9px] font-semibold text-akg-muted">{purchaseLabel(priorMap[p.user_email] || 0)} purchase</span>
          )}
        </span>
      ),
    },
    {
      key: 'system',
      sortKey: 'system',
      label: 'System',
      cell: (p) => <span className="whitespace-nowrap text-[11px] text-akg-silver">{planShort(p.plan)}</span>,
    },
    {
      key: 'method',
      label: 'Method',
      cell: (p) => (
        <span className={cn('inline-block whitespace-nowrap rounded px-1.5 py-px font-data text-[9px] font-bold',
          p.method === 'upi' ? 'bg-akg-green/15 text-akg-green' : 'bg-[#F3C653]/15 text-akg-gold')}
        >
          {p.method === 'upi' ? 'UPI' : p.network?.replace('USDT-', '') || 'USDT'}
        </span>
      ),
    },
    {
      key: 'amount',
      sortKey: 'amount',
      label: 'Amount',
      align: 'right',
      cell: (p) => (
        <span className="whitespace-nowrap font-data text-xs font-bold tabular-nums text-white">
          ${p.amount}
          {p.method === 'upi' && p.inr_amount ? <span className="ml-1 font-semibold text-akg-muted">₹{Number(p.inr_amount).toLocaleString('en-IN')}</span> : null}
        </span>
      ),
    },
    {
      key: 'state',
      label: '',
      align: 'right',
      cell: (p) => (p.status === 'pending' ? (
        <span className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => setConfirming(p)}
            title="Approve (A)"
            className="flex h-7 items-center gap-1 rounded-full bg-[linear-gradient(120deg,#E8BC4F,#F3C653,#DFAE3E)] px-2.5 font-data text-[10px] font-bold text-[#1C1403] transition-transform active:scale-95"
          >
            ✓ Approve
          </button>
          <button
            onClick={() => openReject(p)}
            title="Reject with reason (R)"
            className="flex h-7 w-7 items-center justify-center rounded-full border border-rose-500/30 text-xs font-bold text-rose-300 transition-colors hover:bg-rose-500/10 active:scale-95"
          >
            ✕
          </button>
        </span>
      ) : (
        <StatusDot status={p.status} pulse={false} />
      )),
    },
  ], [filter, priorMap]);

  const sortToggle = (col) => {
    if (sortCol === col) replaceParams({ dir: sortDir === 'desc' ? 'asc' : 'desc' });
    else replaceParams({ sort: col, dir: col === 'amount' ? 'desc' : 'asc', page: '' });
  };

  const bulk = (rows, clear) => (
    <>
      {bulkBusy && <span className="font-data text-[11px] text-akg-muted">working…</span>}
      <button
        disabled={bulkBusy || rows.every((r) => r.status !== 'pending')}
        onClick={async () => {
          setBulkBusy(true);
          let done = 0;
          for (const r of rows.filter((x) => x.status === 'pending')) {
            // eslint-disable-next-line no-await-in-loop
            if (await approvePayment(r)) done += 1;
          }
          setBulkBusy(false);
          clear();
          afterAction();
        }}
        className="rounded-full bg-[linear-gradient(120deg,#E8BC4F,#F3C653,#DFAE3E)] px-3 py-1.5 text-[11px] font-bold text-[#1C1403] disabled:opacity-40"
      >
        Approve {rows.filter((r) => r.status === 'pending').length || ''}
      </button>
    </>
  );

  return (
    <div className="space-y-4 pb-10">
      <SectionHeader
        title="Money Queue"
        sub={stats ? `Verified revenue $${stats.revenue.total.toLocaleString()} USDT across ${stats.payments.confirmed} confirmed payments.` : 'Loading desk totals…'}
        actions={
          <button
            onClick={() => exportPaymentsCsv({ search, items: page.items }, filter)}
            className="flex h-9 items-center gap-2 rounded-full border border-white/15 px-4 text-xs font-bold text-akg-silver transition-colors hover:border-[#F3C653]/40 hover:text-akg-gold"
          >
            <Download className="h-3.5 w-3.5" /> Export CSV
          </button>
        }
      />

      {/* verified-revenue strip */}
      {stats && (
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1 rounded-xl border border-white/[0.07] bg-akg-surface px-4 py-2 font-data text-[11px] text-akg-muted">
          <Kpi k="24h" v={`$${stats.revenue.last24h.toLocaleString()}`} />
          <Kpi k="7d" v={`$${stats.revenue.last7d.toLocaleString()}`} />
          <Kpi k="30d" v={`$${stats.revenue.last30d.toLocaleString()}`} />
          <Kpi k="all-time" v={`$${stats.revenue.total.toLocaleString()}`} gold />
          <span className="ml-auto">{stats.payments.pending} awaiting review</span>
        </div>
      )}

      <Toolbar
        chips={validFilters.map((f, i) => ({
          id: f,
          label: { pending: 'Pending', confirmed: 'Confirmed', rejected: 'Rejected', all: 'All' }[f],
          count: [stats?.payments.pending, stats?.payments.confirmed, stats?.payments.rejected, stats?.payments.total][i],
          danger: f === 'rejected',
        }))}
        chipValue={filter}
        onChip={(v) => { replaceParams({ f: v === 'pending' ? '' : v, page: '', exp: '', id: '' }); setCursor(0); }}
        search={search}
        onSearch={(v) => replaceParams({ q: v, page: '', exp: '' })}
        searchPlaceholder="Email, TXID, network, plan…"
        actions={(
          <span className="hidden font-data text-[10px] text-akg-muted/70 xl:block">
            <kbd className="rounded border border-white/10 px-1">J</kbd>/<kbd className="rounded border border-white/10 px-1">K</kbd> move ·
            <kbd className="ml-1 rounded border border-white/10 px-1">A</kbd> approve ·
            <kbd className="rounded border border-white/10 px-1">R</kbd> reject
          </span>
        )}
      />

      <DataTable
        name="money queue"
        columns={columns}
        rows={items}
        sort={[sortCol, sortDir]}
        onSort={sortToggle}
        selectable
        selected={selected}
        onSelected={setSelected}
        cursor={cursor}
        onCursor={setCursor}
        onRowClick={(p) => replaceParams({ exp: query.exp === p.id ? '' : p.id, id: '' })}
        expanded={query.exp}
        renderExpanded={(p) => (
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-white/[0.06] bg-[#0A0D13] px-3.5 py-3">
              <div className="mb-2 font-data text-[9px] uppercase tracking-wider text-akg-muted">Reference</div>
              <TxidCell network={p.network} txid={p.txid} full />
            </div>
            <div className="rounded-xl border border-white/[0.06] bg-[#0A0D13] px-3.5 py-3">
              <div className="mb-2 font-data text-[9px] uppercase tracking-wider text-akg-muted">Timeline</div>
              <div className="space-y-1 text-[11px] text-akg-silver">
                <div>Submitted {fmtDateTime(p.created)}</div>
                {p.license_key && <div className="font-data text-[10px] text-akg-gold">key {p.license_key}</div>}
                {p.admin_notes && <div className="text-akg-muted">note: {p.admin_notes}</div>}
              </div>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); replaceParams({ id: p.id, exp: '' }); }}
              className="justify-self-start rounded-full border border-[#F3C653]/40 bg-[#F3C653]/10 px-3.5 py-1.5 text-[11px] font-bold text-akg-gold hover:bg-[#F3C653]/20"
            >
              Open dossier →
            </button>
          </div>
        )}
        page={urlPage}
        onPage={(np) => {
          replaceParams({ page: np > 1 ? np : '' });
          setCursor(0);
        }}
        pageSize={15}
        total={page.total}
        bulk={bulk}
        mobileCard={(p) => (
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className={cn('font-data text-[10px]', p.status === 'pending' ? 'font-bold text-amber-300' : 'text-akg-muted')}>
                  {p.status === 'pending' ? timeWaiting(p.created) : fmtRelative(p.created)}
                </span>
                <span className="truncate text-xs font-semibold text-white">{p.user_email || '—'}</span>
                {p.status === 'pending' && purchaseLabel(priorMap[p.user_email] || 0) && (
                  <span className="shrink-0 rounded bg-white/[0.06] px-1.5 py-px font-data text-[9px] text-akg-muted">{purchaseLabel(priorMap[p.user_email] || 0)}</span>
                )}
              </div>
              <div className="mt-1 flex items-center gap-2 font-data text-[10px] text-akg-muted">
                <span className="text-akg-silver">{planShort(p.plan)}</span>
                <span>·</span>
                <span>{p.method === 'upi' ? 'UPI' : p.network?.replace('USDT-', '') || 'USDT'}</span>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <span className="font-data text-xs font-bold tabular-nums text-white">${p.amount}</span>
              {p.status === 'pending' ? (
                <span className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => setConfirming(p)}
                    aria-label="Approve (A)"
                    className="flex h-7 items-center rounded-full bg-[linear-gradient(120deg,#E8BC4F,#F3C653,#DFAE3E)] px-2.5 font-data text-[10px] font-bold text-[#1C1403]"
                  >
                    ✓
                  </button>
                  <button
                    onClick={() => openReject(p)}
                    aria-label="Reject with reason (R)"
                    className="flex h-7 w-7 items-center justify-center rounded-full border border-rose-500/30 text-xs font-bold text-rose-300"
                  >
                    ✕
                  </button>
                </span>
              ) : (
                <StatusDot status={p.status} pulse={false} />
              )}
            </div>
          </div>
        )}
        empty={(
          <EmptyState
            icon={filter === 'pending' ? CreditCard : Inbox}
            title={filter === 'pending' ? 'Queue is clear' : 'No payments match'}
            hint={filter === 'pending' ? 'New deposits appear here in real time.' : 'Adjust the filters or search.'}
          />
        )}
        className={cn(page.loading && 'opacity-70')}
      />

      <PaymentDrawer
        payment={query.id ? (detailPayment || null) : null}
        loading={!!query.id && !detailPayment}
        onClose={() => replaceParams({ id: '' })}
        onReject={(p) => openReject(p)}
      />

      {/* Approve (row button / keyboard A) */}
      {confirming && (
        <ConfirmSheet
          open
          onClose={() => setConfirming(null)}
          onConfirm={async () => {
            const p = confirming;
            setConfirming(null);
            const ok = await approvePayment(p);
            if (ok) afterAction();
          }}
          title="Approve this payment?"
          message={`${confirming.user_email} · ${planShort(confirming.plan)} · $${confirming.amount} USDT. ${String(confirming.plan || '').startsWith('BOT:') ? 'A license key will be issued automatically.' : 'A 30-day cycle activates automatically.'} Undo is available from the toast.`}
          confirmLabel={String(confirming.plan || '').startsWith('BOT:') ? 'Approve + License' : 'Approve + 30d'}
        />
      )}

      {/* Reject with reason */}
      {rejecting && (
        <ActionSheet
          open
          onClose={() => setRejecting(null)}
          title="Reject payment"
          subtitle={`${rejecting.user_email} · $${rejecting.amount} USDT · ${planShort(rejecting.plan)}`}
          footer={
            <div className="flex gap-2.5">
              <button onClick={() => setRejecting(null)} className="h-10 flex-1 rounded-full border border-white/15 text-sm font-semibold text-akg-silver hover:bg-white/5">
                Cancel
              </button>
              <button
                onClick={async () => { const pay = rejecting; setRejecting(null); if (pay) { await rejectPayment(pay, reason); afterAction(); } }}
                className="h-10 flex-1 rounded-full bg-rose-500 text-sm font-bold text-white hover:bg-rose-400 active:scale-[0.98]"
              >
                Reject & Notify
              </button>
            </div>
          }
        >
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-akg-silver" htmlFor="akg-admin-reject-reason">
              Reason <span className="font-normal text-akg-muted">(sent to the trader as a notification)</span>
            </label>
            <div className="mb-2.5 flex flex-wrap gap-1.5">
              {['TXID not found on-chain', 'Amount under-paid', 'Duplicate or already credited', 'Wrong network / address'].map((preset) => (
                <button
                  key={preset}
                  onClick={() => setReason(preset)}
                  className="rounded-full border border-rose-500/25 bg-rose-500/[0.06] px-2.5 py-1 text-[11px] font-semibold text-rose-200/90 transition-colors hover:bg-rose-500/15"
                >
                  {preset}
                </button>
              ))}
            </div>
            <textarea
              id="akg-admin-reject-reason"
              name="rejectReason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. TXID not found on-chain, or amount under-paid..."
              className="min-h-[80px] w-full rounded-xl border border-white/10 bg-[#0A0D13] px-3.5 py-2.5 text-sm leading-relaxed text-white placeholder:text-akg-muted/60 focus:border-rose-400/50 focus:outline-none"
            />
            <div className="mt-3 rounded-xl border border-white/[0.07] bg-[#0A0D13] px-3 py-2.5">
              <TxidCell network={rejecting.network} txid={rejecting.txid} full />
            </div>
          </div>
        </ActionSheet>
      )}
    </div>
  );
}

function Kpi({ k, v, gold }) {
  return (
    <span className="flex items-baseline gap-1.5">
      <span className="text-[10px] uppercase tracking-wider text-akg-muted/70">{k}</span>
      <span className={cn('font-bold tabular-nums', gold ? 'text-akg-gold' : 'text-white')}>{v}</span>
    </span>
  );
}

function timeWaiting(created) {
  const t = new Date(String(created || '').replace(' ', 'T')).getTime();
  if (Number.isNaN(t)) return '';
  const hrs = (Date.now() - t) / 3600000;
  if (hrs < 1) return `${Math.max(1, Math.round(hrs * 60))}m`;
  if (hrs < 24) return `${Math.round(hrs)}h`;
  return `${Math.round(hrs / 24)}d`;
}

function purchaseLabel(prior) {
  const n = prior + 1;
  const s = { 1: 'st', 2: 'nd', 3: 'rd' }[n % 10] && n % 100 !== 11 ? { 1: 'st', 2: 'nd', 3: 'rd' }[n % 10] : 'th';
  return `${n}${s}`;
}

/* ---- CSV export: fetches the FULL current filter (not just this page) ---- */
async function exportPaymentsCsv({ search, items }, filter) {
  const full = await pb.collection('payments').getFullList({
    filter: filter === 'all' ? '' : `status = '${filter}'`,
    sort: '-created',
  }).catch(() => items);
  const cols = ['created', 'user_email', 'plan', 'amount', 'inr_amount', 'method', 'network', 'txid', 'status', 'license_key', 'admin_notes'];
  const rows = [cols.join(',')].concat(
    full.map((p) => cols.map((c) => {
      const v = String(p[c] ?? '').replace(/"/g, '""');
      return /[",\n]/.test(v) ? `"${v}"` : v;
    }).join(','))
  );
  const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `akg_payments_${filter}_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
}
