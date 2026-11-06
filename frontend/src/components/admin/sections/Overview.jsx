import React, { useEffect, useMemo, useState } from 'react';
import {
  Zap, Bell, ChevronRight, CheckCircle2, Radio, Activity, Users as UsersIcon, TrendingUp,
} from 'lucide-react';
import { pb } from '../../../lib/pocketbase';
import { useAdmin } from '../AdminContext';
import { useStats } from '../lib/pagedList';
import PaymentRow from '../components/PaymentRow';
import PaymentDetailSheet from '../components/PaymentDetailSheet';
import { cycleDaysLeft, fmtRelative } from '../lib/format';
import { cn } from '../../../lib/utils';

export default function Overview({ onNavigate }) {
  const admin = useAdmin();
  const { stats } = useStats();
  const [detailPayment, setDetailPayment] = useState(null);
  const { connectors } = admin;

  const [pending, setPending] = useState([]);
  const [priorMap, setPriorMap] = useState({});

  useEffect(() => {
    let alive = true;
    async function loadPending() {
      try {
        const res = await pb.collection('payments').getList(1, 6, { filter: "status = 'pending'", sort: 'created' });
        if (!alive) return;
        setPending(res.items);
        const emails = [...new Set(res.items.map((p) => p.user_email).filter(Boolean))];
        if (!emails.length) { setPriorMap({}); return; }
        const expr = emails.map((e) => `user_email = "${e}"`).join(' || ');
        const recs = await pb.collection('payments').getFullList({ filter: `(${expr}) && status = 'confirmed'` }).catch(() => []);
        const m = {};
        recs.forEach((r) => { m[r.user_email] = (m[r.user_email] || 0) + 1; });
        if (alive) setPriorMap(m);
      } catch { /* keep last */ }
    }
    loadPending();
    const unsub = pb.collection('payments').subscribe('*', loadPending).catch(() => null);
    return () => { alive = false; unsub?.then?.((u) => u && u()); };
  }, []);

  const pendingTotal = stats?.payments.pending ?? 0;
  const expiring = (stats?.expiring || []).map((u) => ({ u, days: cycleDaysLeft(u) }));
  const pendingBridges = useMemo(
    () => connectors.filter((c) => c.status === 'pending_review' || c.status === 'pending'),
    [connectors]
  );

  const attention = pendingTotal + expiring.length + pendingBridges.length;
  const rev = stats?.revenue;

  return (
    <div className="space-y-4 font-sans text-akg-text">
      {/* toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('briefings')}
            className="flex h-8 items-center gap-1.5 rounded-lg border border-akg-hairline bg-akg-card px-3.5 text-xs font-semibold text-akg-text transition-colors hover:border-akg-accent/40 hover:text-akg-accent active:scale-95 cursor-pointer"
          >
            <Bell className="h-3.5 w-3.5" /> Directive
          </button>
          <span className="ml-1 hidden items-center gap-1.5 font-mono text-[10px] text-akg-muted sm:flex">
            <span className="live-dot" /> live
          </span>
        </div>
        <div className={cn(
          'flex h-8 items-center gap-1.5 rounded-md px-3 font-mono text-[11px] font-bold',
          attention > 0 ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20' : 'bg-emerald-500/10 text-akg-green border border-emerald-500/20'
        )}>
          {attention > 0 ? `${attention} NEEDS ATTENTION` : 'ALL CLEAR'}
        </div>
      </div>

      {/* revenue strip */}
      <div className="grid grid-cols-2 divide-akg-hairline overflow-hidden rounded-xl border border-akg-hairline bg-akg-card sm:grid-cols-4 sm:divide-x">
        {[
          ['24H', rev?.last24h], ['7D', rev?.last7d], ['30D', rev?.last30d], ['ALL', rev?.total],
        ].map(([label, val], i) => (
          <div key={label} className={cn('px-4 py-2.5', i < 2 && 'border-b border-akg-hairline sm:border-b-0')}>
            <div className="flex items-baseline gap-2">
              <span className="font-mono text-[9px] font-bold tracking-wider text-akg-muted">{label}</span>
              <span className={cn('font-mono text-base font-bold tabular-nums', i === 3 ? 'text-akg-accent' : 'text-akg-text')}>
                {val === undefined ? '-' : `$${val.toLocaleString()}`}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* main 2-col */}
      <div className="grid gap-4 lg:grid-cols-[1.7fr_1fr]">
        {/* LEFT: money queue */}
        <section className="overflow-hidden rounded-xl border border-akg-hairline bg-akg-card">
          <header className="flex items-center justify-between border-b border-akg-hairline px-3.5 py-2.5">
            <h2 className="flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-wider text-akg-accent">
              Money queue
              {pendingTotal > 0 && <span className="rounded-md bg-amber-500/20 px-1.5 py-px text-[9px] text-amber-700 dark:text-amber-400 font-mono">{pendingTotal}</span>}
            </h2>
            <button onClick={() => onNavigate('payments')} className="group flex items-center gap-0.5 text-[10px] font-semibold text-akg-muted hover:text-akg-accent cursor-pointer">
              all <ChevronRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
            </button>
          </header>

          {pending.length === 0 ? (
            <div className="flex items-center justify-center gap-2 py-8 text-xs text-akg-muted">
              <CheckCircle2 className="h-4 w-4 text-akg-green" /> Queue is clear
            </div>
          ) : (
            <>
              {pending.map((p) => (
                <PaymentRow key={p.id} payment={p} prior={priorMap[p.user_email] || 0} onOpen={setDetailPayment} onReject={() => onNavigate('payments')} />
              ))}
              {pendingTotal > pending.length && (
                <button
                  onClick={() => onNavigate('payments')}
                  className="w-full py-2 text-center font-mono text-[10px] text-akg-muted transition-colors hover:text-akg-accent cursor-pointer"
                >
                  + {pendingTotal - pending.length} more in queue
                </button>
              )}
            </>
          )}
        </section>

        {/* RIGHT rail */}
        <div className="space-y-4">
          <section className="grid grid-cols-3 divide-x divide-akg-hairline overflow-hidden rounded-xl border border-akg-hairline bg-akg-card">
            {[
              { icon: Activity, label: 'room', val: stats?.room?.last7d, go: 'signals' },
              { icon: UsersIcon, label: 'members', val: stats ? `${stats.users.active}/${stats.users.total}` : undefined, go: 'users' },
              { icon: Radio, label: 'accounts', val: stats ? `${stats.connectors.trading}↑` : undefined, go: 'users', extra: { tab: 'managed' } },
            ].map((c) => {
              const Icon = c.icon;
              return (
                <button key={c.label} onClick={() => onNavigate(c.go, c.extra)} className="flex flex-col items-center gap-1 px-2 py-3 transition-colors hover:bg-akg-raised cursor-pointer">
                  <Icon className="h-3.5 w-3.5 text-akg-accent" />
                  <span className="font-mono text-sm font-bold text-akg-text">{c.val ?? '-'}</span>
                  <span className="font-mono text-[9px] uppercase tracking-wider text-akg-muted">{c.label}</span>
                </button>
              );
            })}
          </section>

          <section className="overflow-hidden rounded-xl border border-akg-hairline bg-akg-card">
            <header className="flex items-center justify-between border-b border-akg-hairline px-3.5 py-2">
              <h3 className="font-mono text-[9px] font-bold uppercase tracking-wider text-akg-muted">Expiring ≤3d</h3>
              <span className={cn('rounded-md px-1.5 py-px font-mono text-[9px] font-bold', expiring.length ? 'bg-amber-500/20 text-amber-700 dark:text-amber-400' : 'bg-emerald-500/15 text-akg-green')}>
                {expiring.length || '0'}
              </span>
            </header>
            {expiring.length === 0 ? (
              <p className="px-3.5 py-3 text-[11px] text-akg-muted">No renewals due in the next 3 days.</p>
            ) : (
              <div className="divide-y divide-akg-hairline">
                {expiring.slice(0, 5).map(({ u, days }) => (
                  <button key={u.id} onClick={() => onNavigate('users')} className="flex w-full items-center justify-between gap-2 px-3.5 py-2 text-left hover:bg-akg-raised cursor-pointer">
                    <span className="truncate text-[11px] font-semibold text-akg-text">{u.email}</span>
                    <span className={cn('shrink-0 rounded-md px-1.5 py-px font-mono text-[9px] font-bold', days === 0 ? 'bg-rose-500/20 text-rose-600 dark:text-rose-400' : 'bg-amber-500/20 text-amber-700 dark:text-amber-400')}>
                      {days === 0 ? 'today' : `${days}d`}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </section>

          {pendingBridges.length > 0 && (
            <section className="overflow-hidden rounded-xl border border-akg-hairline bg-akg-card">
              <header className="flex items-center justify-between border-b border-akg-hairline px-3.5 py-2">
                <h3 className="font-mono text-[9px] font-bold uppercase tracking-wider text-akg-muted">Bridge requests</h3>
                <span className="rounded-md bg-amber-500/20 px-1.5 py-px font-mono text-[9px] font-bold text-amber-700 dark:text-amber-400">{pendingBridges.length}</span>
              </header>
              <div className="divide-y divide-akg-hairline">
                {pendingBridges.slice(0, 4).map((c) => (
                  <button key={c.id} onClick={() => onNavigate('users', { tab: 'managed', id: c.id })} className="flex w-full items-center justify-between gap-2 px-3.5 py-2 text-left hover:bg-akg-raised cursor-pointer">
                    <span className="truncate text-[11px] font-semibold text-akg-text">{c.user_email}</span>
                    <span className="shrink-0 font-mono text-[9px] text-akg-muted">{c.platform} · #{c.account_number}</span>
                  </button>
                ))}
              </div>
            </section>
          )}

          <section className="rounded-xl border border-akg-hairline bg-akg-card p-3.5">
            <h3 className="mb-2 flex items-center gap-1.5 font-mono text-[9px] font-bold uppercase tracking-wider text-akg-muted">
              <TrendingUp className="h-3 w-3 text-akg-accent" /> Ledger
            </h3>
            <div className="space-y-1 font-mono text-[11px]">
              {[
                ['Confirmed', stats?.payments.confirmed],
                ['Pending', stats?.payments.pending],
                ['Rejected', stats?.payments.rejected],
                ['Records', stats?.payments.total],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between">
                  <span className="text-akg-muted">{k}</span>
                  <span className="font-bold text-akg-text">{v ?? '-'}</span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>

      <PaymentDetailSheet payment={detailPayment} onClose={() => setDetailPayment(null)} onReject={() => onNavigate('payments')} />
    </div>
  );
}
