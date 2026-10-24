import React, { useState, useEffect } from 'react';
import { pb } from '../lib/pocketbase';
import { 
  Zap, TrendingUp, TrendingDown, Clock, Plus, X, Radio, 
  Lock, ArrowRight, Edit3, Trash2, CheckCircle2 
} from 'lucide-react';

export function SignalsTab({ user, onOpenPricing, onOpenAuth }) {
  const [signals, setSignals] = useState([]);
  const [filter, setFilter] = useState('active');
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingSignal, setEditingSignal] = useState(null);

  // New Signal Form State
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

  useEffect(() => {
    loadSignals();

    // PocketBase Realtime Subscription (SSE)
    const unsubPromise = pb.collection('signals').subscribe('*', (e) => {
      if (e.action === 'create') {
        setSignals((prev) => [e.record, ...prev]);
      } else if (e.action === 'update') {
        setSignals((prev) => prev.map((s) => (s.id === e.record.id ? e.record : s)));
      } else if (e.action === 'delete') {
        setSignals((prev) => prev.filter((s) => s.id !== e.record.id));
      }
    });

    return () => {
      unsubPromise.then((unsub) => unsub());
    };
  }, []);

  const handleCreateOrUpdateSignal = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingSignal) {
        await pb.collection('signals').update(editingSignal.id, form);
      } else {
        await pb.collection('signals').create(form);
      }
      setShowModal(false);
      setEditingSignal(null);
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
      loadSignals();
    } catch (err) {
      alert('Error saving signal: ' + (err.message || 'Check your permissions'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this signal?')) return;
    try {
      await pb.collection('signals').delete(id);
      loadSignals();
    } catch (err) {
      alert('Error deleting signal: ' + err.message);
    }
  };

  const handleCloseSignal = async (s) => {
    const pnl = window.prompt('Enter final trade result / PnL (e.g. +85 pips, Hit TP1):', '+60 pips') || '';
    try {
      await pb.collection('signals').update(s.id, { status: 'closed', pnl });
      loadSignals();
    } catch (err) {
      alert('Error closing signal: ' + err.message);
    }
  };

  const openEditModal = (s) => {
    setEditingSignal(s);
    setForm({
      symbol: s.symbol,
      direction: s.direction,
      entry: s.entry,
      stop_loss: s.stop_loss,
      take_profit_1: s.take_profit_1,
      take_profit_2: s.take_profit_2 || '',
      plan_tier: s.plan_tier,
      status: s.status,
      notes: s.notes || ''
    });
    setShowModal(true);
  };

  const hasAccess = user && (user.role === 'admin' || user.plan === 'PERFECT_SIGNAL_BOX' || user.plan === 'SR_SIGNAL_BOX');
  const isAdmin = user?.role === 'admin';

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
            REALTIME SSE CONNECTED · {signals.length} TOTAL SIGNALS
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Algorithmic Execution Feeds</h1>
          <p className="text-xs text-slate-400">Institutional entry zones, stop losses, and multi-tier take-profit levels</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Status filter */}
          <div className="inline-flex rounded-lg border border-border bg-slate-900/80 p-1 text-xs font-mono">
            {['active', 'closed', 'all'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1 rounded-md capitalize font-medium transition-all cursor-pointer ${
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
          {isAdmin && (
            <button
              onClick={() => {
                setEditingSignal(null);
                setShowModal(true);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow transition-all cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              Post Signal
            </button>
          )}
        </div>
      </div>

      {/* Access Banner for non-members */}
      {!hasAccess && (
        <div className="p-4 rounded-xl border border-blue-500/30 bg-blue-500/10 backdrop-blur flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono">
          <div className="flex items-center gap-2.5 text-blue-300">
            <Lock className="h-4 w-4 text-blue-400 shrink-0" />
            <span>
              {user 
                ? 'Preview Mode Active · Subscribe to a 30-day cycle to unlock institutional entry, stop loss, and TP values.'
                : 'Preview Mode Active · Sign in or enroll to unlock live algorithmic execution parameters.'}
            </span>
          </div>
          <button
            onClick={user ? onOpenPricing : onOpenAuth}
            className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors shrink-0 cursor-pointer shadow flex items-center gap-1.5"
          >
            {user ? 'Unlock Full Access ($10)' : 'Sign In to Unlock'}
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

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
            const signalUnlocked = hasAccess;

            return (
              <div
                key={s.id}
                className="rounded-2xl border border-border/80 bg-card/90 backdrop-blur p-5 space-y-4 hover:border-blue-500/40 transition-all shadow-md group relative overflow-hidden"
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
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider ${
                      s.status === 'active'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}
                  >
                    {s.status === 'active' && <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />}
                    {s.status} {s.pnl ? `· ${s.pnl}` : ''}
                  </span>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-2 gap-2 text-xs font-mono relative">
                  <div className="p-2.5 rounded-xl bg-background/60 border border-border/60">
                    <div className="text-[10px] uppercase text-slate-400">Entry Price</div>
                    <div className={`text-sm font-bold text-slate-100 tabular-nums mt-0.5 ${!signalUnlocked ? 'blur-sm select-none' : ''}`}>
                      {signalUnlocked ? s.entry : '••••••'}
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-rose-500/5 border border-rose-500/20">
                    <div className="text-[10px] uppercase text-rose-400 font-medium">Stop Loss</div>
                    <div className={`text-sm font-bold text-rose-400 tabular-nums mt-0.5 ${!signalUnlocked ? 'blur-sm select-none' : ''}`}>
                      {signalUnlocked ? s.stop_loss : '••••••'}
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
                    <div className="text-[10px] uppercase text-emerald-400 font-medium">Target 1</div>
                    <div className={`text-sm font-bold text-emerald-400 tabular-nums mt-0.5 ${!signalUnlocked ? 'blur-sm select-none' : ''}`}>
                      {signalUnlocked ? s.take_profit_1 : '••••••'}
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
                    <div className="text-[10px] uppercase text-emerald-400 font-medium">Target 2</div>
                    <div className={`text-sm font-bold text-emerald-400 tabular-nums mt-0.5 ${!signalUnlocked ? 'blur-sm select-none' : ''}`}>
                      {signalUnlocked ? (s.take_profit_2 || 'Runner') : '••••••'}
                    </div>
                  </div>

                  {!signalUnlocked && (
                    <div 
                      onClick={user ? onOpenPricing : onOpenAuth}
                      className="absolute inset-0 bg-background/60 backdrop-blur-[2px] flex items-center justify-center rounded-xl cursor-pointer hover:bg-background/40 transition-all border border-blue-500/20"
                    >
                      <span className="px-3 py-1 rounded-lg bg-blue-600/90 text-white font-bold text-[11px] shadow flex items-center gap-1.5">
                        <Lock className="h-3.5 w-3.5" />
                        Unlock Values
                      </span>
                    </div>
                  )}
                </div>

                {/* Analysis Notes */}
                {s.notes && (
                  <div className="pt-2 border-t border-border/40 text-[11px] text-slate-400 leading-relaxed font-mono">
                    <span className="text-slate-500">Analysis: </span>
                    {signalUnlocked ? s.notes : 'Full technical commentary available to subscribed members.'}
                  </div>
                )}

                {/* Admin Quick Action Footer */}
                {isAdmin && (
                  <div className="pt-3 border-t border-border/50 flex items-center justify-between text-xs font-mono">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openEditModal(s)}
                        className="text-slate-400 hover:text-white flex items-center gap-1 text-[11px] cursor-pointer"
                      >
                        <Edit3 className="h-3.5 w-3.5" /> Edit
                      </button>
                      {s.status === 'active' && (
                        <button
                          onClick={() => handleCloseSignal(s)}
                          className="text-amber-400 hover:text-amber-300 flex items-center gap-1 text-[11px] cursor-pointer"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" /> Close
                        </button>
                      )}
                    </div>
                    <button
                      onClick={() => handleDelete(s.id)}
                      className="text-rose-400 hover:text-rose-300 flex items-center gap-1 text-[11px] cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Delete
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Admin Post/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-border/80">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Plus className="h-5 w-5 text-emerald-400" />
                {editingSignal ? 'Edit Signal' : 'Post Live Signal'}
              </h3>
              <button 
                onClick={() => {
                  setShowModal(false);
                  setEditingSignal(null);
                }} 
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateOrUpdateSignal} className="space-y-4 pt-4 text-xs font-mono">
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
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-white cursor-pointer"
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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Plan Tier</label>
                  <select
                    value={form.plan_tier}
                    onChange={(e) => setForm({ ...form, plan_tier: e.target.value })}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-white cursor-pointer"
                  >
                    <option value="SR_SIGNAL_BOX">SR_SIGNAL_BOX ($10/mo)</option>
                    <option value="PERFECT_SIGNAL_BOX">PERFECT_SIGNAL_BOX ($20/mo)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-white cursor-pointer"
                  >
                    <option value="active">Active</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
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

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow transition-all cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'Broadcasting...' : (editingSignal ? 'Update Signal' : 'Publish Signal')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingSignal(null);
                  }}
                  className="px-4 py-2.5 rounded-lg border border-border bg-slate-800 text-slate-300 cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
