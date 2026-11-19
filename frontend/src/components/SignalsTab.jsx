import React, { useMemo } from 'react';
import { Button } from './ui/Button';
import { getPlans, useSiteSettings } from '../lib/wallets';
import { formatUsdt } from '../lib/utils';
import { cycleDay, getSignalPriceCycle } from '../lib/signalCycles';
import SignalRoom from './SignalRoom';

export function SignalsTab({ user, schedule, onOpenPricing, onOpenAuth }) {
  const plan = schedule?.plan;
  const end = schedule?.memberCycle?.endsAt;
  const roomUser = useMemo(() => user && plan && end
    ? { ...user, plan, cycle_expires_at: end } : user, [user, plan, end]);
  const settings = useSiteSettings();
  const priceCycle = getSignalPriceCycle(schedule);
  const prices = getPlans(settings, priceCycle);
  const active = schedule?.active;
  const next = schedule?.next;
  return (
    <div className="mx-auto w-full max-w-[1100px] px-2 pt-2 sm:px-4">
      {(active || next) && <p role="status" className="mb-3 rounded-xl border border-akg-hairline bg-akg-card px-4 py-3 text-sm text-akg-text">
        {active?.paused ? <>Desk paused. Signals resume {cycleDay(active.pauseUntil)}.</> :
          active ? <>{active.name} runs through {cycleDay(active.endsAt, true)}.</> :
          <>Desk paused. Next cycle starts {cycleDay(next.startsAt)}.</>}
      </p>}
      <section aria-label="Signal plan prices" className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-akg-hairline bg-akg-card px-4 py-3">
        <div className="space-y-1">
          <p className="text-xs text-akg-muted">{priceCycle ? `Prices for ${priceCycle.name}` : 'Standard prices per cycle'}</p>
          <dl className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-akg-text">
            {prices.map((price) => (
              <div key={price.id} className="flex flex-wrap items-baseline gap-x-1.5">
                <dt>{price.name}</dt>
                <dd className="font-data font-semibold text-akg-accent">{formatUsdt(price.price)} USDT</dd>
              </div>
            ))}
          </dl>
        </div>
        <Button variant="outline" size="sm" onClick={onOpenPricing}>View plans</Button>
      </section>
      <SignalRoom user={roomUser} onOpenPricing={onOpenPricing} onOpenAuth={onOpenAuth} />
    </div>
  );
}

export default SignalsTab;
