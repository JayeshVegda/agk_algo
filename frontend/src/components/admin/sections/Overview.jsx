import React, { useEffect, useMemo, useState } from 'react';
import {
  Zap, Bell, ChevronRight, CheckCircle2, Radio, Activity, Users as UsersIcon, TrendingUp,
} from 'lucide-react';
import { pb } from '../../../lib/pocketbase';
import { useAdmin } from '../AdminContext';
import { useStats } from '../lib/pagedList';
import PaymentRow from '../components/PaymentRow';
import PaymentDetailSheet from '../components/PaymentDetailSheet';
import SignalComposer from '../components/SignalComposer';
import { cycleDaysLeft, fmtRelative } from '../lib/format';
import { cn } from '../../../lib/utils';

/**
 * Dense ops console: revenue strip up top, money queue as 44px rows with
 * inline actions, side rail with live counts, expiries, bridges and open
 * exposure. Everything visible in one glance at 1440px; stacks on mobile.
 */
export default function Overview({ onNavigate }) {
  const admin = useAdmin();
  const { stats } = useStats();
  const [composerOpen, setComposerOpen] = useState(false);
  const [detailPayment, setDetailPayment] = useState(null);
  const { connectors } = admin;

  // Money queue preview (oldest 6) + trust map, refreshed by realtime.
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
      } catch { /* keep last state */ }
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

  const [activeSignals, setActiveSignals] = useState([]);
  useEffect(() => {
    const load = () => pb.collection('signals').getList(1, 5, { filter: "status = 'active'", sort: '-created' })
      .then((r) => setActiveSignals(r.items)).catch(() => {});
    load();
    const unsub = pb.collection('signals').subscribe('*', load).catch(() => null);
    return () => { unsub?.then?.((u) => u && u()); };
  }, []);

  const attention = pendingTotal + expiring.length + pendingBridges.length;
  const rev = stats?.revenue;

  return (
    <div className="space-y-4">
      {/* toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setComposerOpen(true)}
            className="flex h-8 items-center gap-1.5 rounded-full bg-[linear-gradient(120deg,#E8BC4F,#F3C653,#DFAE3E)] px-3.5 text-xs font-bold text-[#1C1403] active:scale-95"
          >
            <Zap className="h-3.5 w-3.5" /> Signal
          </button>
          <button
            onClick={() => onNavigate('briefings')}
            className="flex h-8 items-center gap-1.5 rounded-full border border-white/15 px-3.5 text-xs font-semibold text-akg-silver transition-colors hover:border-[#F3C653]/40 hover:text-akg-gold active:scale-95"
          >
            <Bell className="h-3.5 w-3.5" /> Directive
          </button>
          <span className="ml-1 hidden items-center gap-1.5 font-data text-[10px] text-akg-muted sm:flex">
            <span className="live-dot" /> live
          </span>
        </div>
        <div className={cn(
          'flex h-8 items-center gap-1.5 rounded-full px-3 font-data text-[11px] font-bold',
          attention > 0 ? 'bg-amber-400/10 text-amber-300' : 'bg-akg-green/10 text-akg-green'
        )}>
          {attention > 0 ? `${attention} NEEDS ATTENTION` : 'ALL CLEAR'}
        </div>
      </div>

      {/* revenue strip: market-data style */}
      <div className="grid grid-cols-2 divide-white/[0.06] overflow-hidden rounded-xl border border-white/[0.07] bg-akg-surface sm:grid-cols-4 sm:divide-x">
        {[
          ['24H', rev?.last24h], ['7D', rev?.last7d], ['30D', rev?.last30d], ['ALL', rev?.total],
        ].map(([label, val], i) => (
          <div key={label} className={cn('px-4 py-2.5', i < 2 && 'border-b border-white/[0.06] sm:border-b-0')}>
            <div className="flex items-baseline gap-2">
              <span className="font-data text-[9px] font-bold tracking-widest text-akg-muted">{label}</span>
              <span className={cn('font-data text-base font-bold tabular-nums', i === 3 ? 'text-akg-gold' : 'text-white')}>
                {val === undefined ? '—' : `$${val.toLocaleString()}`}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* main 2-col */}
      <div className="grid gap-4 lg:grid-cols-[1.7fr_1fr]">
        {/* LEFT: money queue + exposure */}
        <section className="overflow-hidden rounded-xl border border-white/[0.07] bg-akg-surface">
          <header className="flex items-center justify-between border-b border-white/[0.06] px-3.5 py-2.5">
            <h2 className="flex items-center gap-2 font-data text-[10px] font-bold uppercase tracking-[0.14em] text-akg-gold">
              Money queue
              {pendingTotal > 0 && <span className="rounded-full bg-amber-400/20 px-1.5 py-px text-[9px] text-amber-300">{pendingTotal}</span>}
            </h2>
            <button onClick={() => onNavigate('payments')} className="group flex items-center gap-0.5 text-[10px] font-semibold text-akg-muted hover:text-akg-gold">
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
                  className="w-full py-2 text-center font-data text-[10px] text-akg-muted transition-colors hover:text-akg-gold"
                >
                  + {pendingTotal - pending.length} more in queue
                </button>
              )}
            </>
          )}

          {activeSignals.length > 0 && (
            <div className="border-t border-white/[0.06]">
              <header className="flex items-center justify-between px-3.5 py-2">
                <h3 className="font-data text-[9px] font-bold uppercase tracking-[0.14em] text-akg-muted">Open exposure · {stats?.signals.active ?? activeSignals.length}</h3>
                <button onClick={() => onNavigate('signals')} className="text-[10px] font-semibold text-akg-muted hover:text-akg-gold">desk →</button>
              </header>
              <div className="divide-y divide-white/[0.04]">
                {activeSignals.slice(0, 4).map((s) => (
                  <button key={s.id} onClick={() => onNavigate('signals')} className="flex w-full items-center justify-between gap-2 px-3.5 py-1.5 text-left hover:bg-white/[0.02]">
                    <span className="flex items-center gap-2 font-data text-[11px]">
                      <span className="font-bold text-white">{s.symbol}</span>
                      <span className={cn('rounded px-1 text-[9px] font-bold', s.direction === 'BUY' ? 'bg-akg-green/15 text-akg-green' : 'bg-rose-500/15 text-rose-300')}>{s.direction}</span>
                      <span className="hidden text-akg-muted md:inline">E {s.entry} · SL {s.stop_loss} · TP {s.take_profit_1}</span>
                    </span>
                    <span className="shrink-0 font-data text-[9px] text-akg-muted">{s.plan_tier === 'PERFECT_SIGNAL_BOX' ? 'VIP' : 'SR'} · {fmtRelative(s.created)}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* RIGHT rail */}
        <div className="space-y-4">
          <section className="grid grid-cols-3 divide-x divide-white/[0.06] overflow-hidden rounded-xl border border-white/[0.07] bg-akg-surface">
            {[
              { icon: Activity, label: 'signals', val: stats?.signals.active, go: 'signals' },
              { icon: UsersIcon, label: 'members', val: stats ? `${stats.users.active}/${stats.users.total}` : undefined, go: 'users' },
              { icon: Radio, label: 'accounts', val: stats ? `${stats.connectors.trading}↑` : undefined, go: 'connectors' },
            ].map((c) => {
              const Icon = c.icon;
              return (
                <button key={c.label} onClick={() => onNavigate(c.go)} className="flex flex-col items-center gap-1 px-2 py-3 transition-colors hover:bg-white/[0.02]">
                  <Icon className="h-3.5 w-3.5 text-akg-gold" />
                  <span className="font-data text-sm font-bold text-white">{c.val ?? '—'}</span>
                  <span className="font-data text-[9px] uppercase tracking-wider text-akg-muted">{c.label}</span>
                </button>
              );
            })}
          </section>

          <section className="overflow-hidden rounded-xl border border-white/[0.07] bg-akg-surface">
            <header className="flex items-center justify-between border-b border-white/[0.06] px-3.5 py-2">
              <h3 className="font-data text-[9px] font-bold uppercase tracking-[0.14em] text-akg-muted">Expiring ≤3d</h3>
              <span className={cn('rounded-full px-1.5 py-px font-data text-[9px] font-bold', expiring.length ? 'bg-amber-400/20 text-amber-300' : 'bg-akg-green/15 text-akg-green')}>
                {expiring.length || '0'}
              </span>
            </header>
            {expiring.length === 0 ? (
              <p className="px-3.5 py-3 text-[11px] text-akg-muted">No renewals due in the next 3 days.</p>
            ) : (
              <div className="divide-y divide-white/[0.04]">
                {expiring.slice(0, 5).map(({ u, days }) => (
                  <button key={u.id} onClick={() => onNavigate('users')} className="flex w-full items-center justify-between gap-2 px-3.5 py-2 text-left hover:bg-white/[0.02]">
                    <span className="truncate text-[11px] font-semibold text-white">{u.email}</span>
                    <span className={cn('shrink-0 rounded-full px-1.5 py-px font-data text-[9px] font-bold', days === 0 ? 'bg-rose-500/20 text-rose-300' : 'bg-amber-400/20 text-amber-300')}>
                      {days === 0 ? 'today' : `${days}d`}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </section>

          {pendingBridges.length > 0 && (
            <section className="overflow-hidden rounded-xl border border-white/[0.07] bg-akg-surface">
              <header className="flex items-center justify-between border-b border-white/[0.06] px-3.5 py-2">
                <h3 className="font-data text-[9px] font-bold uppercase tracking-[0.14em] text-akg-muted">Bridge requests</h3>
                <span className="rounded-full bg-amber-400/20 px-1.5 py-px font-data text-[9px] font-bold text-amber-300">{pendingBridges.length}</span>
              </header>
              <div className="divide-y divide-white/[0.04]">
                {pendingBridges.slice(0, 4).map((c) => (
                  <button key={c.id} onClick={() => onNavigate('connectors')} className="flex w-full items-center justify-between gap-2 px-3.5 py-2 text-left hover:bg-white/[0.02]">
                    <span className="truncate text-[11px] font-semibold text-white">{c.user_email}</span>
                    <span className="shrink-0 font-data text-[9px] text-akg-muted">{c.platform} · #{c.account_number}</span>
                  </button>
                ))}
              </div>
            </section>
          )}

          <section className="rounded-xl border border-white/[0.07] bg-akg-surface p-3.5">
            <h3 className="mb-2 flex items-center gap-1.5 font-data text-[9px] font-bold uppercase tracking-[0.14em] text-akg-muted">
              <TrendingUp className="h-3 w-3" /> Ledger
            </h3>
            <div className="space-y-1 font-data text-[11px]">
              {[
                ['Confirmed', stats?.payments.confirmed],
                ['Pending', stats?.payments.pending],
                ['Rejected', stats?.payments.rejected],
                ['Records', stats?.payments.total],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between">
                  <span className="text-akg-muted">{k}</span>
                  <span className="font-bold text-white">{v ?? '—'}</span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>

      <PaymentDetailSheet payment={detailPayment} onClose={() => setDetailPayment(null)} onReject={() => onNavigate('payments')} />
      <SignalComposer open={composerOpen} onClose={() => setComposerOpen(false)} />
    </div>
  );
}
