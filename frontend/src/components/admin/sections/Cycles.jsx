import React, { useEffect, useState } from 'react';
import { pb } from '../../../lib/pocketbase';
import { CYCLE_ZONE, cycleDay, useSignalSchedule } from '../../../lib/signalCycles';
import { Button } from '../../ui/Button';

function inputDay(value = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: CYCLE_ZONE, year: 'numeric', month: '2-digit', day: '2-digit' })
    .format(value);
}

export default function Cycles() {
  const { data, status, retry } = useSignalSchedule(pb.authStore.record?.id || '', true);
  const current = data?.active;
  const next = data?.next;
  const [date, setDate] = useState('');
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    setDate(next?.startsAt ? inputDay(new Date(next.startsAt.replace(' ', 'T'))) : '');
  }, [next?.startsAt]);

  async function save(event) {
    event.preventDefault();
    setBusy(true);
    setFeedback(null);
    try {
      await pb.send('/api/akg/signal-cycle/next', { method: 'POST', body: { startDate: date } });
      setFeedback({ message: 'Cycle start saved.' });
      retry();
    } catch (error) {
      setFeedback({ message: error.message, error: true });
    } finally {
      setBusy(false);
    }
  }

  const earliest = current ? inputDay(new Date(current.endsAt.replace(' ', 'T'))) : inputDay();

  return (
    <section className="mx-auto max-w-3xl space-y-5 text-akg-text">
      <header>
        <h1 className="font-display text-2xl font-bold">Signal cycles</h1>
        <p className="mt-1 text-sm text-akg-muted">Each new cycle runs for 30 days. Dates use India time.</p>
      </header>
      {status === 'loading' && <p role="status" className="text-sm text-akg-muted">Loading cycle dates…</p>}
      {status === 'error' && (
        <div className="flex items-center gap-3" role="alert">
          <p>Couldn’t load the schedule.</p><Button variant="outline" onClick={retry}>Try again</Button>
        </div>
      )}
      {status === 'ready' && (
        <>
          <dl className="grid gap-3 sm:grid-cols-2">
            {[[current, 'Current cycle'], [next, 'Next cycle']].map(([cycle, label]) => (
              <div key={label} className="rounded-xl border border-akg-hairline bg-akg-card p-4">
                <dt className="text-sm font-semibold">{label}</dt>
                <dd className="mt-1 text-sm text-akg-muted">
                  {cycle ? `${cycleDay(cycle.startsAt)} – ${cycleDay(cycle.endsAt, true)}` : 'None scheduled'}
                </dd>
                {cycle && <dd className="mt-1 text-xs text-akg-muted">SR {cycle.srPrice} USDT · Perfect {cycle.vipPrice} USDT</dd>}
              </div>
            ))}
          </dl>
          <form onSubmit={save} className="space-y-4 rounded-xl border border-akg-hairline bg-akg-card p-4 sm:p-5">
            <h2 className="font-semibold">{current || next ? 'Change the next start date' : 'Start your first cycle'}</h2>
            <p className="text-sm text-akg-muted">
              {current || next
                ? 'Leave the date as it is for automatic renewal. Choose a later date to leave a break between cycles. The next cycle is available to buy in advance.'
                : 'Choose a start date once. After that, cycles renew automatically and can be bought in advance.'}
            </p>
            <label className="block max-w-xs space-y-1 text-sm">
              <span>Start date</span>
              <input type="date" required min={earliest} value={date} onChange={(event) => setDate(event.target.value)}
                className="w-full rounded-lg border border-akg-hairline bg-akg-raised px-3 py-2 text-akg-text" />
            </label>
            <Button type="submit" disabled={busy}>{busy ? 'Saving…' : 'Save start date'}</Button>
            <p className="text-xs text-akg-muted">An upcoming cycle’s dates are locked once it has a pending or confirmed order.</p>
          </form>
        </>
      )}
      {feedback && <p role={feedback.error ? 'alert' : 'status'} className="text-sm text-akg-muted">{feedback.message}</p>}
    </section>
  );
}
