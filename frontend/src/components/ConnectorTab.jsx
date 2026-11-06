import React, { useState, useEffect } from 'react';
import { pb } from '../lib/pocketbase';
import { ShieldCheck, Lock, Handshake, Send, CheckCircle2, Clock } from 'lucide-react';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { cn } from '../lib/utils';

const STATUS_LABELS = {
  pending_review: 'Desk review',
  in_progress: 'Desk reviewing credentials',
  trading: 'Bots trading your account',
  settlement: 'Settlement due',
  paused: 'Paused by desk',
  rejected: 'Rejected',
  connected: 'Connected',
};

const inputClass = 'h-11 w-full rounded-lg border border-akg-hairline bg-akg-raised px-3.5 text-sm text-akg-text placeholder:text-akg-muted/60 focus:border-akg-accent focus:outline-none';

export function ConnectorTab({ user, onOpenAuth, notify }) {
  const [apps, setApps] = useState([]);
  const [form, setForm] = useState({ platform: 'MT5', account_number: '', password: '', server: '', broker: '', leverage: '1:100' });
  const [busy, setBusy] = useState(false);

  const load = () => {
    if (!user?.email) return;
    pb.collection('connector_requests')
      .getFullList({ filter: `user_email = "${user.email}"`, sort: '-created' })
      .then(setApps)
      .catch(() => {});
  };

  useEffect(() => {
    load();
    const unsub = pb.collection('connector_requests').subscribe('*', () => load()).catch(() => {});
    return () => { unsub?.then?.((u) => u && u()); };
  }, [user?.email]);

  const submit = async (e) => {
    e.preventDefault();
    if (!user) { onOpenAuth?.(); return; }
    if (!form.account_number.trim() || !form.password.trim() || !form.server.trim()) {
      notify?.({ type: 'error', title: 'Missing Details', message: 'Account number, password and server are required.' });
      return;
    }
    setBusy(true);
    try {
      await pb.send('/api/akg/managed/apply', { method: 'POST', body: JSON.stringify(form) });
      notify?.({ type: 'success', title: 'Application Received', message: 'The desk will review your account and get back to you here.' });
      setForm({ ...form, account_number: '', password: '' });
      load();
    } catch (err) {
      notify?.({ type: 'error', title: 'Submission Failed', message: err.message || 'Try again.' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl font-sans text-akg-text">
      <div className="max-w-2xl">
        <h1 className="font-display text-2xl font-extrabold tracking-tight text-akg-text sm:text-3xl">Account Management</h1>
        <p className="mt-2 text-sm leading-relaxed text-akg-muted">
          Let the desk trade for you. We connect our Expert Advisors to your MetaTrader account and manage it
          professionally. You keep the account in your name; profits split <b className="text-akg-accent">70% you · 30% desk</b>.
        </p>
      </div>

      {/* how it works */}
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        {[
          { icon: Send, t: 'Submit credentials', d: 'Account number, password and server. Encrypted the moment it reaches us.' },
          { icon: CheckCircle2, t: 'Desk connects', d: 'We attach the AKG systems sized to your balance and risk profile.' },
          { icon: Handshake, t: 'Profits split 70/30', d: 'You keep 70% of net profits. Statements shared at every settlement.' },
        ].map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} className="rounded-xl border border-akg-hairline bg-akg-card p-4">
              <Icon className="h-5 w-5 text-akg-accent" />
              <div className="mt-2.5 text-sm font-bold text-akg-text">{s.t}</div>
              <p className="mt-1 text-[11px] leading-relaxed text-akg-muted">{s.d}</p>
            </div>
          );
        })}
      </div>

      {/* security note */}
      <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.05] px-4 py-3.5">
        <Lock className="mt-0.5 h-4 w-4 shrink-0 text-akg-green" />
        <p className="text-[11px] leading-relaxed text-akg-muted">
          Your broker password is stored <b className="text-akg-text">AES-encrypted</b> and never appears in any list,
          export or log. Only the desk lead can decrypt it, on demand, to connect your account. You can change the
          password anytime after we go live.
        </p>
      </div>

      {/* application form */}
      <form onSubmit={submit} className="mt-6 space-y-4 rounded-xl border border-akg-hairline bg-akg-card p-5 sm:p-6">
        <h2 className="font-display text-base font-bold text-akg-text">Apply for management</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-akg-text">Platform</label>
            <div className="flex rounded-lg border border-akg-hairline bg-akg-raised p-1">
              {['MT4', 'MT5'].map((p) => (
                <button key={p} type="button" onClick={() => setForm({ ...form, platform: p })}
                  className={cn('h-8 flex-1 rounded-md text-xs font-semibold transition-all cursor-pointer',
                    form.platform === p ? 'bg-akg-cta text-akg-cta-text shadow-sm' : 'text-akg-muted hover:text-akg-text')}>
                  {p}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-akg-text">Account number *</label>
            <input value={form.account_number} onChange={(e) => setForm({ ...form, account_number: e.target.value })}
              placeholder="e.g. 8849201" className={`${inputClass} font-mono`} />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-akg-text">Account password *</label>
            <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="investor or master password" className={inputClass} autoComplete="new-password" />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-akg-text">Server *</label>
            <input value={form.server} onChange={(e) => setForm({ ...form, server: e.target.value })}
              placeholder="e.g. ICMarketsSC-MT5" className={`${inputClass} font-mono text-xs`} />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-akg-text">Broker</label>
            <input value={form.broker} onChange={(e) => setForm({ ...form, broker: e.target.value })}
              placeholder="e.g. IC Markets" className={inputClass} />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-akg-text">Leverage</label>
            <select value={form.leverage} onChange={(e) => setForm({ ...form, leverage: e.target.value })} className={inputClass}>
              {['1:100', '1:200', '1:500', '1:1000'].map((l) => <option key={l} className="bg-akg-card text-akg-text">{l}</option>)}
            </select>
          </div>
        </div>
        <Button type="submit" disabled={busy} className="h-11 w-full justify-center gap-2 font-bold">
          <Send className="h-4 w-4" />
          {busy ? 'Submitting...' : user ? 'Submit Application' : 'Sign in to Apply'}
        </Button>
        <p className="text-center text-[11px] text-akg-muted">
          By applying you agree to the 70/30 profit split and that the desk may trade this account on your behalf.
        </p>
      </form>

      {/* settlement statements */}
      {user?.email && (
        <SettlementStatements email={user.email} />
      )}

      {/* my applications */}
      {apps.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-3 font-mono text-[11px] uppercase tracking-wider text-akg-muted">My applications ({apps.length})</h2>
          <div className="space-y-3">
            {apps.map((a) => (
              <div key={a.id} className="rounded-xl border border-akg-hairline bg-akg-card p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <span className="font-mono text-sm font-bold text-akg-text">#{a.account_number}</span>
                    <span className="ml-2 font-mono text-[11px] text-akg-muted">{a.platform} · {a.broker || a.server}</span>
                  </div>
                  <Badge variant={a.status === 'trading' ? 'emerald' : a.status === 'rejected' ? 'outline' : 'secondary'}>
                    {STATUS_LABELS[a.status] || a.status}
                  </Badge>
                </div>
                {a.admin_notes && (
                  <p className="mt-2.5 rounded-lg bg-akg-raised px-3.5 py-2.5 text-[11px] leading-relaxed text-akg-muted">{a.admin_notes}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function SettlementStatements({ email }) {
  const [rows, setRows] = useState(null);
  useEffect(() => {
    pb.collection('managed_settlements').getFullList({
      filter: `account.user_email = "${email}"`,
      sort: '-period_end',
      expand: 'account',
    })
      .then(setRows)
      .catch(() => setRows([]));
  }, [email]);

  if (rows === null || rows.length === 0) return null;

  return (
    <div className="mt-8">
      <h2 className="mb-3 font-mono text-[11px] uppercase tracking-wider text-akg-muted">Profit-share statements</h2>
      <div className="overflow-hidden rounded-xl border border-akg-hairline bg-akg-card">
        {rows.map((st) => (
          <div key={st.id} className="flex flex-wrap items-center justify-between gap-2 border-b border-akg-hairline p-4 last:border-0">
            <div>
              <div className="font-mono text-xs font-bold text-akg-text">{st.period_start} → {st.period_end}</div>
              <div className="mt-0.5 font-mono text-[10px] text-akg-muted">
                acct #{st.expand?.account?.account_number || '-'} · gross ${Number(st.gross_profit).toLocaleString()}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-mono text-sm font-bold text-akg-green">+${Number(st.user_amount).toLocaleString()}</span>
              <span className={`rounded-md px-2 py-0.5 font-mono text-[9px] font-bold uppercase ${st.status === 'paid' ? 'bg-emerald-500/15 text-akg-green border border-emerald-500/30' : 'bg-amber-500/15 text-amber-500 border border-amber-500/30'}`}>
                {st.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
