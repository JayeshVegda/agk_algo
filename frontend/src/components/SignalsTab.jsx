import React, { useMemo } from 'react';
import { cycleDay } from '../lib/signalCycles';
import SignalRoom from './SignalRoom';

export function SignalsTab({ user, schedule, onOpenPricing, onOpenAuth }) {
  const plan = schedule?.plan;
  const end = schedule?.memberCycle?.endsAt;
  const roomUser = useMemo(() => user && plan && end
    ? { ...user, plan, cycle_expires_at: end } : user, [user, plan, end]);
  const active = schedule?.active;
  const next = schedule?.next;
  return (
    <div className="mx-auto w-full max-w-[1100px] px-2 pt-2 sm:px-4">
      {(active || next) && <p role="status" className="mb-3 rounded-xl border border-akg-hairline bg-akg-card px-4 py-3 text-sm text-akg-text">
        {active?.paused ? <>Desk paused. Signals resume {cycleDay(active.pauseUntil)}.</> :
          active ? <>{active.name} runs through {cycleDay(active.endsAt, true)}.</> :
          <>Desk paused. Next cycle starts {cycleDay(next.startsAt)}.</>}
      </p>}
      <SignalRoom user={roomUser} onOpenPricing={onOpenPricing} onOpenAuth={onOpenAuth} />
    </div>
  );
}

export default SignalsTab;
