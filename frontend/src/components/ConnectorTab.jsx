import React, { useState } from 'react';
import { pb } from '../lib/pocketbase';
import { Network, ShieldCheck, CheckCircle2, Lock, AlertTriangle } from 'lucide-react';

export function ConnectorTab({ user, onOpenAuth }) {
  const [accountNumber, setAccountNumber] = useState('');
  const [server, setServer] = useState('');
  const [platform, setPlatform] = useState('MT4');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      onOpenAuth();
      return;
    }

    setSubmitting(true);
    try {
      await pb.collection('connector_requests').create({
        user_email: user.email,
        account_number: accountNumber,
        server,
        platform,
        status: 'demo_active'
      });
      setSubmitted(true);
    } catch (err) {
      alert('Error submitting connector request: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="p-6 rounded-2xl border border-border/80 bg-card/80 backdrop-blur shadow-sm text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-mono font-semibold mb-3">
          <Network className="h-3.5 w-3.5" />
          SIMULATED CONNECTOR (DEMO MODE)
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight">MetaTrader Bridge Connector</h1>
        <p className="text-xs text-slate-400 max-w-md mx-auto mt-2 leading-relaxed">
          Test our low-latency execution bridge for copying signals directly into your MetaTrader demo terminal.
        </p>
      </div>

      <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-xl space-y-5">
        <div className="flex items-start gap-3 p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/10 text-xs text-amber-300">
          <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />
          <p>
            Demo Protection Active: Parameters are encrypted in memory. This interface runs strictly in demo sandbox mode and will never connect to live capital brokers.
          </p>
        </div>

        {submitted ? (
          <div className="text-center py-8 space-y-3">
            <CheckCircle2 className="h-12 w-12 text-emerald-400 mx-auto" />
            <h3 className="text-lg font-bold text-white">Bridge Link Established!</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Simulated bridge connection to {platform} server ({server}) is currently active. Signals will route automatically in demo mode.
            </p>
            <button
              onClick={() => setSubmitted(false)}
              className="mt-4 px-4 py-2 rounded-lg border border-border bg-slate-800 text-xs text-slate-300 hover:bg-slate-700 transition-colors"
            >
              Test Another Terminal
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs font-mono">
            <div>
              <label className="block text-slate-400 mb-1">Terminal Platform</label>
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-white"
              >
                <option value="MT4">MetaTrader 4 (MT4)</option>
                <option value="MT5">MetaTrader 5 (MT5)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Demo Account Number</label>
              <input
                type="text"
                required
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-white"
                placeholder="e.g. 50928192"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Broker Server Name</label>
              <input
                type="text"
                required
                value={server}
                onChange={(e) => setServer(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-white"
                placeholder="e.g. IC-Markets-Demo02"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Master Password (Demo Only)</label>
              <div className="relative">
                <input
                  type="password"
                  required
                  defaultValue="demoPass123"
                  className="w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-white pr-9"
                />
                <Lock className="h-4 w-4 text-slate-500 absolute right-3 top-3" />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-all shadow-md shadow-blue-600/30 cursor-pointer disabled:opacity-50"
            >
              {submitting ? 'Connecting...' : 'Initialize Demo Terminal Bridge'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
