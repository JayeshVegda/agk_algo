import React, { useState, useEffect } from 'react';
import { pb } from '../lib/pocketbase';
import { Zap, TrendingUp, TrendingDown, Clock, Plus, X, Radio } from 'lucide-react';

export function SignalsTab({ user }) {
  const [signals, setSignals] = useState([]);
  const [filter, setFilter] = useState('active');
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [livePings, setLivePings] = useState(0);

  // New Signal Form State (for Admin)
  const [form, setForm] = useState({
    symbol: 'XAUUSD',
    direction: 'BUY',
    entry: '',
    stop_loss: '',
    take_profit_1: '',
    take_profit_2: '',
    plan_tier: 'PERFECT_SIGNAL_BOX',
    status: 'active',
    notes: ''
  });

  // Load signals & setup realtime SSE subscription
  useEffect(() => {
    let unsubscribe = null;

    const loadSignals = async () => {
      try {
        const records = await pb.collection('signals').getFullList({
          sort: '-created',
        });
        setSignals(records);
      } catch (err) {
        console.error('Failed to load signals:', err);
      }
    };

    loadSignals();

    // PocketBase Realtime Subscription (SSE)
    pb.collection('signals').subscribe('*', (e) => {
      setLivePings((prev) => prev + 1);
      if (e.action === 'create') {
        setSignals((prev) => [e.record, ...prev]);
      } else if (e.action === 'update') {
        setSignals((prev) => prev.map((s) => (s.id === e.record.id ? e.record : s)));
      } else if (e.action === 'delete') {
        setSignals((prev) => prev.filter((s) => s.id !== e.record.id));
      }
    }).then((unsub) => {
      unsubscribe = unsub;
    }).catch((err) => console.error('Realtime SSE subscription error:', err));

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const handleCreateSignal = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await pb.collection('signals').create(form);
      setShowModal(false);
      setForm({
        symbol: 'EURUSD',
        direction: 'BUY',
        entry: '',
        stop_loss: '',
        take_profit_1: '',
        take_profit_2: '',
        plan_tier: 'SR_SIGNAL_BOX',
        status: 'active',
        notes: ''
      });
    } catch (err) {
      alert('Error creating signal: ' + (err.message || 'Check your permissions'));
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = signals.filter((s) => {
    if (filter === 'all') return true;
    return s.status === filter;
  });

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl border border-border/80 bg-card/80 backdrop-blur shadow-sm">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-mono font-semibold mb-1">
            <Radio className="h-3 w-3 animate-pulse" />
            REALTIME SSE CONNECTED {livePings > 0 && `(Pings: ${livePings})`}
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Algorithmic Execution Feeds</h1>
          <p className="text-xs text-slate-400">Institutional entry zones, stop losses, and multi-tier take-profit levels</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Status filter */}
          <div className="inline-flex rounded-lg border border-border bg-slate-900/80 p-1 text-xs">
            {['active', 'closed', 'all'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1 rounded-md capitalize font-medium transition-all ${
                  filter === f
                    ? 'bg-blue-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          {/* Admin Create Button */}
          {user?.role === 'admin' && (
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow transition-all cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              Post Signal
            </button>
          )}
        </div>
      </div>

      {/* Signals Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 rounded-2xl border border-border/60 bg-card/40 p-8">
          <Clock className="h-8 w-8 text-slate-500 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-300">No {filter} signals right now</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            Execution parameters update during the active London and New York trading sessions.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((s) => {
            const isBuy = s.direction === 'BUY';
            return (
              <div
                key={s.id}
                className="rounded-2xl border border-border/80 bg-card/90 backdrop-blur p-5 space-y-4 hover:border-blue-500/40 transition-all shadow-md group"
              >
                {/* Card Top */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="h-10 w-10 rounded-xl bg-slate-800 border border-border font-mono font-bold text-sm text-white flex items-center justify-center">
                      {s.symbol.slice(0, 3)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-base font-bold text-white">{s.symbol}</span>
                        <span
                          className={`rounded px-2 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1 ${
                            isBuy
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          }`}
                        >
                          {isBuy ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                          {s.direction}
                        </span>
                      </div>
                      <div className="text-[11px] font-mono text-slate-400">{s.plan_tier || 'SR Signal Box'}</div>
                    </div>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider ${
                      s.status === 'active'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}
                  >
                    {s.status === 'active' && <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />}
                    {s.status}
                  </span>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div className="p-2.5 rounded-xl bg-background/60 border border-border/60">
                    <div className="text-[10px] uppercase text-slate-400">Entry Price</div>
                    <div className="text-sm font-bold text-slate-100 tabular-nums mt-0.5">{s.entry}</div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-rose-500/5 border border-rose-500/20">
                    <div className="text-[10px] uppercase text-rose-400 font-medium">Stop Loss</div>
                    <div className="text-sm font-bold text-rose-400 tabular-nums mt-0.5">{s.stop_loss}</div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
                    <div className="text-[10px] uppercase text-emerald-400 font-medium">Target 1</div>
                    <div className="text-sm font-bold text-emerald-400 tabular-nums mt-0.5">{s.take_profit_1}</div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
                    <div className="text-[10px] uppercase text-emerald-400 font-medium">Target 2</div>
                    <div className="text-sm font-bold text-emerald-400 tabular-nums mt-0.5">{s.take_profit_2 || 'Runner'}</div>
                  </div>
                </div>

                {/* Notes */}
                {s.notes && (
                  <div className="pt-2 border-t border-border/40 text-[11px] text-slate-400 leading-relaxed font-mono">
                    <span className="text-slate-500">Analysis: </span>
                    {s.notes}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Admin Create Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-border/80">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Plus className="h-5 w-5 text-emerald-400" />
                Post Live Signal
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSignal} className="space-y-4 pt-4 text-xs font-mono">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Symbol</label>
                  <input
                    type="text"
                    required
                    value={form.symbol}
                    onChange={(e) => setForm({ ...form, symbol: e.target.value.toUpperCase() })}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-white"
                    placeholder="XAUUSD"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Direction</label>
                  <select
                    value={form.direction}
                    onChange={(e) => setForm({ ...form, direction: e.target.value })}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-white"
                  >
                    <option value="BUY">BUY</option>
                    <option value="SELL">SELL</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Entry Price</label>
                  <input
                    type="text"
                    required
                    value={form.entry}
                    onChange={(e) => setForm({ ...form, entry: e.target.value })}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-white"
                    placeholder="2748.50"
                  />
                </div>
                <div>
                  <label className="block text-rose-400 mb-1">Stop Loss</label>
                  <input
                    type="text"
                    required
                    value={form.stop_loss}
                    onChange={(e) => setForm({ ...form, stop_loss: e.target.value })}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-white"
                    placeholder="2735.00"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-emerald-400 mb-1">Take Profit 1</label>
                  <input
                    type="text"
                    required
                    value={form.take_profit_1}
                    onChange={(e) => setForm({ ...form, take_profit_1: e.target.value })}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-white"
                    placeholder="2765.00"
                  />
                </div>
                <div>
                  <label className="block text-emerald-400 mb-1">Take Profit 2</label>
                  <input
                    type="text"
                    value={form.take_profit_2}
                    onChange={(e) => setForm({ ...form, take_profit_2: e.target.value })}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-white"
                    placeholder="2780.00"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Plan Tier</label>
                <select
                  value={form.plan_tier}
                  onChange={(e) => setForm({ ...form, plan_tier: e.target.value })}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-white"
                >
                  <option value="SR_SIGNAL_BOX">SR_SIGNAL_BOX ($10/mo)</option>
                  <option value="PERFECT_SIGNAL_BOX">PERFECT_SIGNAL_BOX ($20/mo)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Rationale / Technical Notes</label>
                <textarea
                  rows={2}
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-white text-xs"
                  placeholder="Key H4 support bounce confirmation..."
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow transition-all cursor-pointer disabled:opacity-50"
              >
                {submitting ? 'Broadcasting...' : 'Publish Signal to All Clients'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
