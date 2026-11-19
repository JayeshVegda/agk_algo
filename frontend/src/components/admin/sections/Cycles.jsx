import React, { useEffect, useState } from 'react';
import { CalendarDays } from 'lucide-react';
import { pb } from '../../../lib/pocketbase';
import { CYCLE_ZONE, cycleDay } from '../../../lib/signalCycles';
import { Button } from '../../ui/Button';

const empty = {
  name: '', starts_at: '', ends_at: '', renewals_at: '', pause_from: '', pause_until: '',
  sr_price: 10, vip_price: 20, allow_late_join: false,
};
const dates = [
  ['starts_at', 'Starts'], ['ends_at', 'Last day'], ['renewals_at', 'Renewals open'],
  ['pause_from', 'Pause starts'], ['pause_until', 'Last paused day'],
];
const exclusive = (field) => field === 'ends_at' || field === 'pause_until';
const inputClass = 'w-full rounded-lg border border-akg-hairline bg-akg-raised px-3 py-2 text-sm text-akg-text';

function inputDay(value, end) {
  if (!value) return '';
  return new Intl.DateTimeFormat('en-CA', { timeZone: CYCLE_ZONE, year: 'numeric', month: '2-digit', day: '2-digit' })
    .format(new Date(Date.parse(value.replace(' ', 'T')) - (end ? 1 : 0)));
}

export default function Cycles() {
  const [cycles, setCycles] = useState([]);
  const [form, setForm] = useState(empty);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState('');
  const set = (field, value) => setForm((previous) => ({ ...previous, [field]: value }));

  useEffect(() => {
    let active = true;
    pb.collection('signal_cycles').getFullList({ sort: '-starts_at' }).then((records) => {
      if (active) setCycles(records);
    }).catch((error) => { if (active) setFeedback(error.message); });
    return () => { active = false; };
  }, []);

  const edit = (cycle) => {
    setFeedback('');
    setForm({ ...cycle, ...Object.fromEntries(dates.map(([field]) => [field, inputDay(cycle[field], exclusive(field))])) });
  };

  const save = async (event) => {
    event.preventDefault();
    setBusy(true);
    setFeedback('');
    const payload = {
      name: form.name.trim(), sr_price: Number(form.sr_price), vip_price: Number(form.vip_price),
      allow_late_join: form.allow_late_join,
    };
    for (const [field] of dates) {
      const value = form[field];
      payload[field] = value ? new Date(Date.parse(value + 'T00:00:00+05:30') + (exclusive(field) ? 86400000 : 0)).toISOString() : '';
    }
    try {
      const records = pb.collection('signal_cycles');
      const saved = form.id ? await records.update(form.id, payload) : await records.create(payload);
      setCycles((previous) => [...previous.filter((cycle) => cycle.id !== saved.id), saved]
        .sort((a, b) => b.starts_at.localeCompare(a.starts_at)));
      setForm(empty);
      setFeedback('Signal cycle saved.');
    } catch (error) {
      setFeedback(error.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="space-y-5 text-akg-text">
      <header>
        <h1 className="font-display text-2xl font-bold">Signal cycles</h1>
        <p className="mt-1 text-sm text-akg-muted">Dates use India time. Leave a gap between cycles for a planned desk break.</p>
      </header>
      <div className="grid items-start gap-5 xl:grid-cols-[1fr_1fr]">
        <form onSubmit={save} className="space-y-4 rounded-xl border border-akg-hairline bg-akg-card p-4 sm:p-5">
          <h2 className="font-semibold">{form.id ? 'Edit cycle' : 'Schedule a cycle'}</h2>
          <label className="block space-y-1 text-sm">
            <span>Cycle name</span>
            <input required maxLength={100} className={inputClass} value={form.name} onChange={(event) => set('name', event.target.value)} />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            {dates.map(([field, label], index) => (
              <label key={field} className="space-y-1 text-sm">
                <span>{label}{index > 2 && ' (optional)'}</span>
                <input type="date" required={index < 3} className={inputClass} value={form[field]} onChange={(event) => set(field, event.target.value)} />
              </label>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[['sr_price', 'SR price (USDT)'], ['vip_price', 'Perfect price (USDT)']].map(([field, label]) => (
              <label key={field} className="space-y-1 text-sm">
                <span>{label}</span>
                <input type="number" min="0.01" step="0.01" required className={inputClass} value={form[field]} onChange={(event) => set(field, event.target.value)} />
              </label>
            ))}
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.allow_late_join} onChange={(event) => set('allow_late_join', event.target.checked)} />
            Allow joining after the cycle starts
          </label>
          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" disabled={busy}>{busy ? 'Saving…' : 'Save cycle'}</Button>
            {form.id && <Button type="button" variant="outline" onClick={() => setForm(empty)}>Cancel</Button>}
          </div>
          {feedback && <p role="status" className="text-sm text-akg-muted">{feedback}</p>}
        </form>
        <ul className="space-y-2">
          {cycles.length === 0 && <li className="rounded-xl border border-akg-hairline p-4 text-sm text-akg-muted">No scheduled cycles yet.</li>}
          {cycles.map((cycle) => (
            <li key={cycle.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-akg-hairline bg-akg-card px-4 py-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2 font-semibold"><CalendarDays className="h-4 w-4 text-akg-accent" />{cycle.name}</div>
                <p className="text-xs text-akg-muted">{cycleDay(cycle.starts_at)} – {cycleDay(cycle.ends_at, true)}</p>
                {cycle.pause_from && <p className="text-xs text-akg-muted">Pause {cycleDay(cycle.pause_from)} – {cycleDay(cycle.pause_until, true)}</p>}
              </div>
              <Button type="button" variant="outline" size="sm" onClick={() => edit(cycle)}>Edit</Button>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
