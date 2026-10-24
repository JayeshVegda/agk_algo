import React, { useState } from 'react';
import { pb } from '../lib/pocketbase';
import { Network, ShieldCheck, CheckCircle2, Lock, AlertTriangle, Activity, Wifi } from 'lucide-react';

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
      <div className="p-6 rounded-2xl border border-border bg-surface shadow-sm text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-mono font-semibold mb-3">
          <Network className="h-3.5 w-3.5" />
          SIMULATED TERMINAL BRIDGE (DEMO PROTOCOL)
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight font-sans">MetaTrader Signal Bridge</h1>
        <p className="text-xs text-slate-400 font-mono max-w-md mx-auto mt-2 leading-relaxed">
          Simulate low-latency execution parameter routing directly into your MetaTrader 4 or MetaTrader 5 demo trading terminal.
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 shadow-xl space-y-5">
        <div className="flex items-start gap-3 p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/10 text-xs font-mono text-amber-300">
          <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />
          <p>
            Demo Isolation Protocol: Credentials are never stored in plaintext and never connect to live financial brokers. Strictly for latency and signal execution simulation.
          </p>
        </div>

        {submitted ? (
          <div className="text-center py-8 space-y-3 font-mono">
            <div className="relative inline-flex mb-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-50"></span>
              <CheckCircle2 className="h-12 w-12 text-emerald-400 relative" />
            </div>
            <h3 className="text-lg font-bold text-white">Bridge Link Established!</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
              Simulated WebSocket bridge to {platform} server ({server || 'Demo-Live01'}) is active. Latency: <span className="text-emerald-400 font-bold">1.4ms</span>.
            </p>
            <div className="pt-2">
              <button
                onClick={() => setSubmitted(false)}
                className="px-4 py-2 rounded-xl border border-border bg-slate-800 text-xs text-slate-300 hover:bg-slate-700 transition-colors cursor-pointer"
              >
                Configure Another Terminal
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs font-mono">
            <div>
              <label className="block text-slate-400 mb-1">Terminal Platform</label>
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                className="w-full rounded-xl border border-border bg-[#090e18] px-3.5 py-2.5 text-white cursor-pointer"
              >
                <option value="MT4">MetaTrader 4 (MT4 EA Bridge)</option>
                <option value="MT5">MetaTrader 5 (MT5 EA Bridge)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Demo Account Number</label>
              <input
                type="text"
                required
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                className="w-full rounded-xl border border-border bg-[#090e18] px-3.5 py-2.5 text-white placeholder:text-slate-600"
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
                className="w-full rounded-xl border border-border bg-[#090e18] px-3.5 py-2.5 text-white placeholder:text-slate-600"
                placeholder="e.g. ICMarkets-Demo02"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-all cursor-pointer shadow-md shadow-blue-600/30 disabled:opacity-50"
            >
              {submitting ? 'Connecting Simulation Bridge...' : 'Establish Simulation Bridge'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
