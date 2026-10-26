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

const input = 'h-11 w-full rounded-xl border border-white/10 bg-[#0A0D13] px-3.5 text-sm text-white placeholder:text-akg-muted/50 focus:border-[#F3C653]/50 focus:outline-none';

/**
 * Account Management: hand your MT4/MT4 account to the desk. We run our
 * Expert Advisors on your balance; profits split 70% you / 30% desk. The
 * broker password travels once through this form, is stored AES-encrypted,
 * and is never displayed anywhere again.
 */
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
    <div className="mx-auto max-w-3xl font-sans text-akg-silver">
      <div className="max-w-2xl">
        <h1 className="font-display text-2xl font-extrabold tracking-tight text-white sm:text-3xl">Account Management</h1>
        <p className="mt-2 text-sm leading-relaxed text-akg-muted">
          Let the desk trade for you. We connect our Expert Advisors to your MetaTrader account and manage it
          professionally. You keep the account in your name; profits split <b className="text-akg-gold">70% you · 30% desk</b>.
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
            <div key={i} className="rounded-2xl border border-white/10 bg-akg-surface p-4">
              <Icon className="h-5 w-5 text-akg-gold" />
              <div className="mt-2.5 text-sm font-bold text-white">{s.t}</div>
              <p className="mt-1 text-[11px] leading-relaxed text-akg-muted">{s.d}</p>
            </div>
          );
        })}
      </div>

      {/* security note */}
      <div className="mt-4 flex items-start gap-2.5 rounded-2xl border border-akg-green/20 bg-akg-green/[0.05] px-4 py-3.5">
        <Lock className="mt-0.5 h-4 w-4 shrink-0 text-akg-green" />
        <p className="text-[11px] leading-relaxed text-akg-muted">
          Your broker password is stored <b className="text-akg-silver">AES-encrypted</b> and never appears in any list,
          export or log. Only the desk lead can decrypt it, on demand, to connect your account. You can change the
          password anytime after we go live.
        </p>
      </div>

      {/* application form */}
      <form onSubmit={submit} className="mt-6 space-y-4 rounded-2xl border border-white/10 bg-akg-surface p-5 sm:p-6">
        <h2 className="font-display text-base font-bold text-white">Apply for management</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-akg-silver">Platform</label>
            <div className="flex rounded-xl border border-white/10 bg-[#0A0D13] p-1">
              {['MT4', 'MT5'].map((p) => (
                <button key={p} type="button" onClick={() => setForm({ ...form, platform: p })}
                  className={cn('h-9 flex-1 rounded-lg text-xs font-bold transition-all',
                    form.platform === p ? 'bg-[#F3C653] text-[#1C1403]' : 'text-akg-muted')}>
                  {p}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-akg-silver">Account number *</label>
            <input value={form.account_number} onChange={(e) => setForm({ ...form, account_number: e.target.value })}
              placeholder="e.g. 8849201" className={`${input} font-data`} />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-akg-silver">Account password *</label>
            <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="investor or master password" className={input} autoComplete="new-password" />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-akg-silver">Server *</label>
            <input value={form.server} onChange={(e) => setForm({ ...form, server: e.target.value })}
              placeholder="e.g. ICMarketsSC-MT5" className={`${input} font-data text-xs`} />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-akg-silver">Broker</label>
            <input value={form.broker} onChange={(e) => setForm({ ...form, broker: e.target.value })}
              placeholder="e.g. IC Markets" className={input} />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-akg-silver">Leverage</label>
            <select value={form.leverage} onChange={(e) => setForm({ ...form, leverage: e.target.value })} className={input}>
              {['1:100', '1:200', '1:500', '1:1000'].map((l) => <option key={l}>{l}</option>)}
            </select>
          </div>
        </div>
        <Button type="submit" disabled={busy} className="h-11 w-full justify-center gap-2">
          <Send className="h-4 w-4" />
          {busy ? 'Submitting…' : user ? 'Submit Application' : 'Sign in to Apply'}
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
          <h2 className="mb-3 font-data text-[11px] uppercase tracking-[0.16em] text-akg-muted">My applications ({apps.length})</h2>
          <div className="space-y-3">
            {apps.map((a) => (
              <div key={a.id} className="rounded-2xl border border-white/10 bg-akg-surface p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <span className="font-data text-sm font-bold text-white">#{a.account_number}</span>
                    <span className="ml-2 font-data text-[11px] text-akg-muted">{a.platform} · {a.broker || a.server}</span>
                  </div>
                  <Badge variant={a.status === 'trading' ? 'positive' : a.status === 'rejected' ? 'gold' : 'secondary'}>
                    {STATUS_LABELS[a.status] || a.status}
                  </Badge>
                </div>
                {a.admin_notes && (
                  <p className="mt-2.5 rounded-xl bg-white/[0.03] px-3.5 py-2.5 text-[11px] leading-relaxed text-akg-silver">{a.admin_notes}</p>
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
      <h2 className="mb-3 font-data text-[11px] uppercase tracking-[0.16em] text-akg-muted">Profit-share statements</h2>
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-akg-surface">
        {rows.map((st) => (
          <div key={st.id} className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.05] p-4 last:border-0">
            <div>
              <div className="font-data text-xs font-bold text-white">{st.period_start} → {st.period_end}</div>
              <div className="mt-0.5 font-data text-[10px] text-akg-muted">
                acct #{st.expand?.account?.account_number || '-'} · gross ${Number(st.gross_profit).toLocaleString()}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-data text-sm font-bold text-akg-green">+${Number(st.user_amount).toLocaleString()}</span>
              <span className={`rounded-full px-2 py-0.5 font-data text-[9px] font-bold uppercase ${st.status === 'paid' ? 'bg-akg-green/15 text-akg-green' : 'bg-amber-400/15 text-amber-300'}`}>
                {st.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
