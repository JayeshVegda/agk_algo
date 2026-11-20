import React, { useEffect, useState } from 'react';
import { CalendarDays } from 'lucide-react';
import { pb } from '../../../lib/pocketbase';
import { CYCLE_ZONE, cycleDay } from '../../../lib/signalCycles';
import { Button } from '../../ui/Button';

const empty = {
  name: '', starts_at: '', ends_at: '', renewals_at: '', pause_from: '', pause_until: '',
  sr_price: 10, vip_price: 20, allow_late_join: false, is_draft: true,
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
  const [loadState, setLoadState] = useState('loading');
  const set = (field, value) => setForm((previous) => ({ ...previous, [field]: value }));

  useEffect(() => {
    let active = true;
    pb.collection('signal_cycles').getFullList({ sort: '-starts_at' }).then((records) => {
      if (active) { setCycles(records); setLoadState('ready'); }
    }).catch((error) => { if (active) { setFeedback(error.message); setLoadState('error'); } });
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
      name: form.name.trim() || `Signal cycle ${form.starts_at}`, sr_price: Number(form.sr_price), vip_price: Number(form.vip_price),
      allow_late_join: form.allow_late_join, is_draft: form.is_draft,
    };
    for (const [field] of dates) {
      const value = field === 'renewals_at' ? (form.renewals_at || new Date(Date.parse(form.starts_at + 'T00:00:00Z') - 7 * 86400000).toISOString().slice(0, 10)) : form[field];
      payload[field] = value ? new Date(Date.parse(value + 'T00:00:00+05:30') + (exclusive(field) ? 86400000 : 0)).toISOString() : '';
    }
    try {
      const records = pb.collection('signal_cycles');
      const saved = form.id ? await records.update(form.id, payload) : await records.create(payload);
      setCycles((previous) => [...previous.filter((cycle) => cycle.id !== saved.id), saved]
        .sort((a, b) => b.starts_at.localeCompare(a.starts_at)));
      setForm(empty);
      setFeedback(saved.is_draft ? 'Saved as a draft.' : 'Published cycle saved.');
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
          <h2 className="font-semibold">{form.id ? 'Edit cycle' : 'Create a signal cycle'}</h2>
          <p className="text-sm text-akg-muted">Choose the dates and prices for this cycle. All dates use India time.</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {[['starts_at', 'Start date'], ['ends_at', 'Last day']].map(([field, label]) => (
              <label key={field} className="block space-y-1 text-sm">
                <span>{label}</span>
                <input type="date" required min={field === 'ends_at' ? form.starts_at || undefined : undefined} className={inputClass} value={form[field]} onChange={(event) => set(field, event.target.value)} />
              </label>
            ))}
          </div>
          <p className="text-xs leading-relaxed text-akg-muted">Members have access through the last day. Leave a gap before the next cycle to pause between cycles.</p>
          <div className="grid grid-cols-2 gap-3">
            {[['sr_price', 'SR price (USDT)'], ['vip_price', 'Perfect price (USDT)']].map(([field, label]) => (
              <label key={field} className="space-y-1 text-sm">
                <span>{label}</span>
                <input type="number" min="0.01" step="0.01" required className={inputClass} value={form[field]} onChange={(event) => set(field, event.target.value)} />
              </label>
            ))}
          </div>
          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" checked={!form.is_draft} onChange={(event) => set('is_draft', !event.target.checked)} />
            <span>Publish this cycle and make it available when payments open</span>
          </label>
          <details className="rounded-lg border border-akg-hairline bg-akg-raised p-3">
            <summary className="cursor-pointer text-sm font-semibold">More options</summary>
            <div className="mt-4 space-y-4">
              <label className="block space-y-1 text-sm">
                <span>Cycle name (optional)</span>
                <input maxLength={100} className={inputClass} value={form.name} onChange={(event) => set('name', event.target.value)} placeholder="e.g. December signals" />
              </label>
              <label className="block space-y-1 text-sm">
                <span>Open payments early (optional)</span>
                <input type="date" max={form.starts_at || undefined} className={inputClass} value={form.renewals_at} onChange={(event) => set('renewals_at', event.target.value)} />
                <span className="block text-xs text-akg-muted">Leave blank to open payments 7 days before the start date.</span>
              </label>
              <div>
                <p className="text-sm font-medium">Pause during this cycle (optional)</p>
                <p className="mt-1 text-xs text-akg-muted">Members cannot read paid signals during the pause. The last day stays the same.</p>
                <div className="mt-2 grid gap-3 sm:grid-cols-2">
                  {[['pause_from', 'Pause starts'], ['pause_until', 'Last paused day']].map(([field, label]) => (
                    <label key={field} className="block space-y-1 text-sm">
                      <span>{label}</span>
                      <input type="date" min={form.starts_at || undefined} max={form.ends_at || undefined} required={Boolean(form[field === 'pause_from' ? 'pause_until' : 'pause_from'])} className={inputClass} value={form[field]} onChange={(event) => set(field, event.target.value)} />
                    </label>
                  ))}
                </div>
              </div>
              <label className="flex items-start gap-2 text-sm">
                <input type="checkbox" checked={form.allow_late_join} onChange={(event) => set('allow_late_join', event.target.checked)} />
                <span>Allow customers to join after the cycle starts</span>
              </label>
            </div>
          </details>
          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" disabled={busy}>{busy ? 'Saving…' : 'Save cycle'}</Button>
            {form.id && <Button type="button" variant="outline" onClick={() => setForm(empty)}>Cancel</Button>}
          </div>
          {feedback && <p role="status" className="text-sm text-akg-muted">{feedback}</p>}
        </form>
        <ul className="space-y-2" aria-label="Scheduled signal cycles">
          {loadState === 'loading' && <li className="p-4 text-sm text-akg-muted">Loading cycles…</li>}
          {loadState === 'ready' && cycles.length === 0 && <li className="rounded-xl border border-akg-hairline p-4 text-sm text-akg-muted">No scheduled cycles yet.</li>}
          {cycles.map((cycle) => (
            <li key={cycle.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-akg-hairline bg-akg-card px-4 py-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2 font-semibold"><CalendarDays className="h-4 w-4 text-akg-accent" />{cycle.name}{cycle.is_draft && <span className="text-xs text-akg-muted">Draft</span>}</div>
                <p className="text-xs text-akg-muted">{cycleDay(cycle.starts_at)} – {cycleDay(cycle.ends_at, true)}</p>
                <p className="text-xs text-akg-muted">SR {cycle.sr_price} USDT · Perfect {cycle.vip_price} USDT</p>
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
