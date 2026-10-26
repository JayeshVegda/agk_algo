import React, { useMemo, useState } from 'react';
import { CreditCard, Inbox, ChevronLeft, ChevronRight, Download } from 'lucide-react';
import { pb } from '../../../lib/pocketbase';
import { planShort } from '../components/PaymentRow';
import { useAdmin } from '../AdminContext';
import { usePagedList, useStats } from '../lib/pagedList';
import { SectionHeader, FilterChips, SearchInput, EmptyState, TxidCell } from '../components/ui';
import PaymentRow from '../components/PaymentRow';
import PaymentDetailSheet from '../components/PaymentDetailSheet';
import { ActionSheet } from '../components/ActionSheet';

/**
 * Money Queue — server-paginated. At 10-20 payments/day the queue stays tiny,
 * but the history keeps growing, so nothing beyond the current page is ever
 * loaded. Pending is oldest-first (fair); history newest-first.
 */
export default function Payments() {
  const { rejectPayment } = useAdmin();
  const { stats } = useStats();
  const [filter, setFilter] = useState('pending');
  const [rejecting, setRejecting] = useState(null);
  const [detail, setDetail] = useState(null);
  const [reason, setReason] = useState('');

  const sort = filter === 'pending' ? 'created' : '-created';
  const page = usePagedList('payments', {
    filter: filter === 'all' ? '' : `status = '${filter}'`,
    sort,
    searchKeys: ['user_email', 'txid', 'network'],
    perPage: 15,
  });

  // Repeat-buyer trust context for the current page (one extra query).
  const [priorMap, setPriorMap] = useState({});
  React.useEffect(() => {
    const emails = [...new Set(page.items.map((p) => p.user_email).filter(Boolean))];
    if (!emails.length) { setPriorMap({}); return; }
    const expr = emails.map((e) => `user_email = "${e}"`).join(' || ');
    pb.collection('payments').getFullList({ filter: `(${expr}) && status = 'confirmed'` })
      .then((recs) => {
        const m = {};
        recs.forEach((r) => { m[r.user_email] = (m[r.user_email] || 0) + 1; });
        setPriorMap(m);
      })
      .catch(() => setPriorMap({}));
  }, [page.items]);

  return (
    <div className="space-y-5">
      <SectionHeader
        title="Money Queue"
        actions={
          <button
            onClick={() => exportPaymentsCsv(page, filter)}
            className="flex h-10 items-center gap-2 rounded-full border border-white/15 px-4 text-xs font-bold text-akg-silver transition-colors hover:border-[#F3C653]/40 hover:text-akg-gold"
          >
            <Download className="h-3.5 w-3.5" /> Export CSV
          </button>
        }
        sub={stats ? `Verified revenue $${stats.revenue.total.toLocaleString()} USDT across ${stats.payments.confirmed} confirmed payments.` : 'Loading desk totals…'}
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <FilterChips
          value={filter}
          onChange={(v) => { setFilter(v); page.setPage(1); }}
          options={[
            { id: 'pending', label: 'Pending', count: stats?.payments.pending },
            { id: 'confirmed', label: 'Confirmed', count: stats?.payments.confirmed },
            { id: 'rejected', label: 'Rejected', count: stats?.payments.rejected },
            { id: 'all', label: 'All', count: stats?.payments.total },
          ]}
        />
        <SearchInput value={page.search} onChange={page.setSearch} placeholder="Email, TXID, network..." />
      </div>

      {page.items.length === 0 && !page.loading ? (
        <EmptyState
          icon={filter === 'pending' ? CreditCard : Inbox}
          title={filter === 'pending' ? 'Queue is clear' : 'No payments match'}
          hint={filter === 'pending' ? 'New deposits appear here in real time.' : 'Adjust the filters or search.'}
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-white/[0.07] bg-akg-surface">
          {page.items.map((p) => (
            <PaymentRow
              key={p.id}
              payment={p}
              prior={priorMap[p.user_email] || 0}
              onOpen={setDetail}
              onReject={(pay) => { setRejecting(pay); setReason(''); }}
            />
          ))}
          {page.loading && <div className="h-10 animate-pulse bg-white/[0.02]" />}
        </div>
      )}

      {/* pagination */}
      {page.total > 15 && (
        <div className="flex items-center justify-between font-data text-xs text-akg-muted">
          <span>{page.total} records</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => page.setPage((p) => Math.max(1, p - 1))}
              disabled={page.page <= 1}
              className="rounded-lg border border-white/10 p-1.5 disabled:opacity-30 hover:bg-white/5"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <span className="text-white">{page.page}/{page.totalPages}</span>
            <button
              onClick={() => page.setPage((p) => Math.min(page.totalPages, p + 1))}
              disabled={page.page >= page.totalPages}
              className="rounded-lg border border-white/10 p-1.5 disabled:opacity-30 hover:bg-white/5"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      <PaymentDetailSheet
        payment={detail}
        onClose={() => setDetail(null)}
        onReject={(pay) => { setRejecting(pay); setReason(''); }}
      />

      {/* Reject with reason */}
      <ActionSheet
        open={!!rejecting}
        onClose={() => setRejecting(null)}
        title="Reject payment"
        subtitle={rejecting ? `${rejecting.user_email} · $${rejecting.amount} USDT · ${rejecting.plan}` : ''}
        footer={
          <div className="flex gap-2.5">
            <button onClick={() => setRejecting(null)} className="h-11 flex-1 rounded-full border border-white/15 text-sm font-semibold text-akg-silver hover:bg-white/5">
              Cancel
            </button>
            <button
              onClick={async () => { const pay = rejecting; setRejecting(null); if (pay) await rejectPayment(pay, reason); }}
              className="h-11 flex-1 rounded-full bg-rose-500 text-sm font-bold text-white hover:bg-rose-400 active:scale-[0.98]"
            >
              Reject & Notify
            </button>
          </div>
        }
      >
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-akg-silver">
            Reason <span className="font-normal text-akg-muted">(sent to the trader as a notification)</span>
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. TXID not found on-chain, or amount under-paid..."
            className="min-h-[90px] w-full rounded-xl border border-white/10 bg-[#0A0D13] px-3.5 py-2.5 text-sm leading-relaxed text-white placeholder:text-akg-muted/60 focus:border-rose-400/50 focus:outline-none"
          />
          {rejecting && (
            <div className="mt-3 rounded-xl border border-white/[0.07] bg-[#0A0D13] px-3 py-2.5">
              <TxidCell network={rejecting.network} txid={rejecting.txid} full />
            </div>
          )}
        </div>
      </ActionSheet>
    </div>
  );
}


/* ---- CSV export: fetches the FULL current filter (not just this page) ---- */
async function exportPaymentsCsv(page, filter) {
  const full = await pb.collection('payments').getFullList({
    filter: page.search
      ? (filter === 'all' ? '' : `status = '${filter}'`)
      : (filter === 'all' ? '' : `status = '${filter}'`),
    sort: '-created',
  }).catch(() => page.items);
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
