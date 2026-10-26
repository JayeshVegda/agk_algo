import React, { useEffect, useState } from 'react';
import { pb } from '../lib/pocketbase';
import { TrendingUp, Target, Activity, CalendarDays } from 'lucide-react';
import { cn } from '../lib/utils';

const MONTH_LABEL = (m) => {
  const [y, mo] = m.split('-');
  return new Date(Number(y), Number(mo) - 1, 1).toLocaleDateString([], { month: 'short', year: 'numeric' });
};

/**
 * Public desk track record: honest aggregates computed server-side from
 * closed signals. No simulated numbers, no projections.
 */
export function TrackRecordPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    pb.send('/api/akg/track-record', { method: 'GET' })
      .then(setData)
      .catch(() => setError(true));
  }, []);

  const o = data?.overall;

  return (
    <div className="mx-auto max-w-4xl font-sans text-akg-silver">
      <div className="max-w-2xl">
        <h1 className="font-display text-2xl font-extrabold tracking-tight text-white sm:text-3xl">Desk Track Record</h1>
        <p className="mt-2 text-sm leading-relaxed text-akg-muted">
          Every signal the desk closes is settled with an outcome and recorded here. These are real desk records -
          wins, losses, and breakeven alike. Nothing on this page is simulated or projected.
        </p>
      </div>

      {error ? (
        <p className="mt-10 rounded-2xl border border-white/10 bg-akg-surface px-5 py-8 text-center text-sm text-akg-muted">
          Track record is unavailable right now.
        </p>
      ) : !data ? (
        <div className="mt-8 space-y-3">
          <div className="h-24 animate-pulse rounded-2xl bg-akg-surface" />
          <div className="h-64 animate-pulse rounded-2xl bg-akg-surface" />
        </div>
      ) : (
        <>
          {/* headline stats */}
          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: 'Net pips (all time)', value: o.netPips > 0 ? `+${o.netPips}` : `${o.netPips}`, tone: 'gold', icon: TrendingUp },
              { label: 'Win rate', value: o.winRate !== null ? `${o.winRate}%` : '—', tone: 'green', icon: Target },
              { label: 'Signals closed', value: String(o.closed), tone: 'plain', icon: Activity },
              { label: 'Months tracked', value: String(data.months.length), tone: 'plain', icon: CalendarDays },
            ].map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.label} className={cn(
                  'rounded-2xl border p-4',
                  s.tone === 'gold' ? 'border-[#F3C653]/30 bg-gradient-to-b from-[#171208] to-akg-surface'
                  : s.tone === 'green' ? 'border-akg-green/25 bg-akg-surface'
                  : 'border-white/10 bg-akg-surface'
                )}>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-akg-muted">{s.label}</span>
                    <Icon className="h-4 w-4 text-akg-gold" />
                  </div>
                  <div className={cn('mt-1.5 font-data text-2xl font-bold tabular-nums',
                    s.tone === 'gold' ? 'text-metallic' : s.tone === 'green' ? 'text-akg-green' : 'text-white')}>
                    {s.value}
                  </div>
                </div>
              );
            })}
          </div>

          {/* monthly table */}
          <div className="mt-6 overflow-hidden rounded-2xl border border-white/10 bg-akg-surface">
            <div className="grid grid-cols-[minmax(0,1.2fr)_repeat(4,minmax(0,1fr))] border-b border-white/[0.07] px-4 py-2.5 font-data text-[10px] uppercase tracking-wider text-akg-muted">
              <span>Month</span><span className="text-right">Signals</span><span className="text-right">W / L / BE</span><span className="text-right">Win rate</span><span className="text-right">Net pips</span>
            </div>
            {data.months.map((m) => {
              const decided = m.wins + m.losses;
              return (
                <div key={m.month} className="grid grid-cols-[minmax(0,1.2fr)_repeat(4,minmax(0,1fr))] items-center border-b border-white/[0.04] px-4 py-2.5 last:border-0 hover:bg-white/[0.015]">
                  <span className="text-xs font-bold text-white">{MONTH_LABEL(m.month)}</span>
                  <span className="text-right font-data text-xs text-akg-silver">{m.closed}</span>
                  <span className="text-right font-data text-xs">
                    <span className="text-akg-green">{m.wins}</span>
                    <span className="text-akg-muted"> / </span>
                    <span className="text-rose-300">{m.losses}</span>
                    <span className="text-akg-muted"> / {m.be}</span>
                  </span>
                  <span className="text-right font-data text-xs text-akg-silver">
                    {decided ? `${Math.round((m.wins / decided) * 100)}%` : '—'}
                  </span>
                  <span className={cn('text-right font-data text-xs font-bold', m.net > 0 ? 'text-akg-green' : m.net < 0 ? 'text-rose-300' : 'text-akg-muted')}>
                    {m.net > 0 ? `+${m.net}` : m.net}
                  </span>
                </div>
              );
            })}
            {data.months.length === 0 && (
              <p className="px-4 py-8 text-center text-xs text-akg-muted">No closed signals recorded yet.</p>
            )}
          </div>

          <p className="mt-4 text-[11px] leading-relaxed text-akg-muted">
            Win rate counts decided signals (breakeven excluded). Pip figures are the desk's posted outcomes at
            signal close. Past performance does not guarantee future results; see our{' '}
            <a href="/risk" className="text-akg-gold underline-offset-2 hover:underline">risk disclosure</a>.
          </p>
        </>
      )}
    </div>
  );
}
