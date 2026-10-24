import React, { useState, useEffect } from 'react';
import { pb } from '../lib/pocketbase';
import { 
  Zap, TrendingUp, TrendingDown, Clock, Plus, X, Radio, 
  Lock, ArrowRight, Edit3, Trash2, CheckCircle2, Copy, Check, 
  Search, SlidersHorizontal, ShieldAlert, Award, Target, Flame,
  LayoutGrid, Table as TableIcon, ChevronDown, ChevronUp
} from 'lucide-react';

export function SignalsTab({ user, onOpenPricing, onOpenAuth, notify }) {
  const [signals, setSignals] = useState([]);
  const [filter, setFilter] = useState('active');
  const [directionFilter, setDirectionFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingSignal, setEditingSignal] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [expandedAnalysisId, setExpandedAnalysisId] = useState(null);

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
        if (notify) {
          notify({
            type: 'info',
            title: `New Signal Broadcasted: ${e.record.symbol} ${e.record.direction}`,
            message: `Entry: ${e.record.entry} | SL: ${e.record.stop_loss} | TP: ${e.record.take_profit_1}`
          });
        }
      } else if (e.action === 'update') {
        setSignals((prev) => prev.map((s) => (s.id === e.record.id ? e.record : s)));
      } else if (e.action === 'delete') {
        setSignals((prev) => prev.filter((s) => s.id !== e.record.id));
      }
    });

    return () => {
      unsubPromise.then((unsub) => unsub());
    };
  }, [notify]);

  const handleCopyParams = (s) => {
    const text = `AKG ALGO SIGNAL\n${s.symbol} ${s.direction}\nEntry: ${s.entry}\nSL: ${s.stop_loss}\nTP1: ${s.take_profit_1}${s.take_profit_2 ? `\nTP2: ${s.take_profit_2}` : ''}`;
    navigator.clipboard.writeText(text);
    setCopiedId(s.id);
    if (notify) {
      notify({
        type: 'copy',
        title: `${s.symbol} ${s.direction} Copied`,
        message: `Entry: ${s.entry} | SL: ${s.stop_loss} | TP: ${s.take_profit_1}`
      });
    }
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCreateOrUpdateSignal = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingSignal) {
        await pb.collection('signals').update(editingSignal.id, form);
        if (notify) {
          notify({
            type: 'success',
            title: 'Signal Updated',
            message: `${form.symbol} parameters updated successfully`
          });
        }
      } else {
        await pb.collection('signals').create(form);
        if (notify) {
          notify({
            type: 'success',
            title: 'Signal Published',
            message: `${form.symbol} ${form.direction} active in live feed`
          });
        }
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
      if (notify) {
        notify({
          type: 'error',
          title: 'Operation Failed',
          message: err.message || 'Check your permissions'
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this signal from live stream?')) return;
    try {
      await pb.collection('signals').delete(id);
      if (notify) {
        notify({
          type: 'warning',
          title: 'Signal Deleted',
          message: 'Signal removed from live stream'
        });
      }
      loadSignals();
    } catch (err) {
      if (notify) notify({ type: 'error', title: 'Error', message: err.message });
    }
  };

  const handleCloseSignal = async (s) => {
    const pnl = window.prompt('Enter final trade result / PnL (e.g. +85 pips, Hit TP1):', '+65 pips') || '';
    try {
      await pb.collection('signals').update(s.id, { status: 'closed', pnl });
      if (notify) {
        notify({
          type: 'success',
          title: `${s.symbol} Closed`,
          message: `Closed with result: ${pnl}`
        });
      }
      loadSignals();
    } catch (err) {
      if (notify) notify({ type: 'error', title: 'Error', message: err.message });
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

  const hasAccess = user && (user.role === 'admin' || user.plan === 'PERFECT_SIGNAL_BOX' || user.plan === 'SR_SIGNAL_BOX' || user.plan === 'active');
  const isAdmin = user?.role === 'admin';

  // Multi-criteria filtering
  const filtered = signals.filter((s) => {
    if (filter !== 'all' && s.status !== filter) return false;
    if (directionFilter !== 'all' && s.direction !== directionFilter) return false;
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      return (
        s.symbol.toLowerCase().includes(q) ||
        (s.notes && s.notes.toLowerCase().includes(q)) ||
        s.plan_tier.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const activeCount = signals.filter(s => s.status === 'active').length;
  const closedCount = signals.filter(s => s.status === 'closed').length;

  // Calculate dynamic Risk:Reward ratio
  const calculateRR = (entryStr, slStr, tpStr) => {
    const entry = parseFloat(entryStr?.replace(/,/g, ''));
    const sl = parseFloat(slStr?.replace(/,/g, ''));
    const tp = parseFloat(tpStr?.replace(/,/g, ''));
    if (isNaN(entry) || isNaN(sl) || isNaN(tp)) return { ratio: '1 : 2.5', riskPct: 30, rewardPct: 70 };

    const risk = Math.abs(entry - sl);
    const reward = Math.abs(tp - entry);
    if (risk <= 0) return { ratio: '1 : 2.5', riskPct: 30, rewardPct: 70 };

    const mult = (reward / risk).toFixed(1);
    const riskPct = Math.min(Math.max((1 / (1 + Number(mult))) * 100, 18), 50);
    const rewardPct = 100 - riskPct;
    return { ratio: `1 : ${mult}`, riskPct, rewardPct };
  };

  return (
    <div className="space-y-6">
      {/* Trading Performance Executive Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 font-mono">
        <div className="p-4 rounded-2xl border border-border bg-card flex items-center justify-between shadow-sm">
          <div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider">Active Feeds</div>
            <div className="text-xl font-bold text-slate-900 mt-0.5 tabular-nums flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
              {activeCount} Live
            </div>
          </div>
          <Radio className="h-5 w-5 text-emerald-400/50" />
        </div>

        <div className="p-4 rounded-2xl border border-border bg-card flex items-center justify-between shadow-sm">
          <div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider">Session Win Rate</div>
            <div className="text-xl font-bold text-emerald-400 mt-0.5 tabular-nums">
              87.4%
            </div>
          </div>
          <Award className="h-5 w-5 text-emerald-400/50" />
        </div>

        <div className="p-4 rounded-2xl border border-border bg-card flex items-center justify-between shadow-sm">
          <div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider">Net 30D Growth</div>
            <div className="text-xl font-bold text-slate-900 mt-0.5 tabular-nums flex items-center gap-1">
              <Flame className="h-4 w-4 text-amber-400" />
              +1,840 pips
            </div>
          </div>
          <TrendingUp className="h-5 w-5 text-blue-400/50" />
        </div>

        <div className="p-4 rounded-2xl border border-border bg-card flex items-center justify-between shadow-sm">
          <div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider">Risk : Reward</div>
            <div className="text-xl font-bold text-slate-800 mt-0.5 tabular-nums">
              1 : 2.8 RR
            </div>
          </div>
          <Target className="h-5 w-5 text-slate-500/50" />
        </div>
      </div>

      {/* Control & Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-2xl border border-border bg-surface shadow-sm font-mono text-xs">
        {/* Search Input */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search symbol (e.g. XAUUSD, EURUSD)..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-border bg-slate-50 text-white placeholder:text-slate-600 focus:border-blue-500 focus:outline-none text-xs transition-colors"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filters and Actions */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Status filter */}
          <div className="inline-flex rounded-xl border border-border bg-slate-50 p-1 text-xs">
            {[
              { id: 'active', label: `Active (${activeCount})` },
              { id: 'closed', label: `Closed (${closedCount})` },
              { id: 'all', label: `All (${signals.length})` },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id)}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                  filter === tab.id
                    ? 'bg-blue-600 text-white font-bold shadow'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Direction Filter */}
          <div className="inline-flex rounded-xl border border-border bg-slate-50 p-1 text-xs">
            {['all', 'BUY', 'SELL'].map((dir) => (
              <button
                key={dir}
                onClick={() => setDirectionFilter(dir)}
                className={`px-2.5 py-1.5 rounded-lg font-medium transition-all cursor-pointer uppercase ${
                  directionFilter === dir
                    ? 'bg-slate-700 text-slate-900 font-bold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {dir}
              </button>
            ))}
          </div>

          {/* View Mode Toggle */}
          <div className="inline-flex rounded-xl border border-border bg-slate-50 p-1 text-xs">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'grid' ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Cards Grid View"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'table' ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Terminal Table View"
            >
              <TableIcon className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Admin Create Button */}
          {isAdmin && (
            <button
              onClick={() => {
                setEditingSignal(null);
                setShowModal(true);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-glow-emerald transition-all cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              Post Signal
            </button>
          )}
        </div>
      </div>

      {/* Access Banner for non-members */}
      {!hasAccess && (
        <div className="p-4 rounded-2xl border border-blue-500/30 bg-gradient-to-r from-blue-600/10 via-cyan-500/5 to-transparent backdrop-blur flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono shadow-sm">
          <div className="flex items-center gap-2.5 text-blue-300">
            <div className="h-8 w-8 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center shrink-0">
              <Lock className="h-4 w-4 text-blue-400" />
            </div>
            <span>
              {user 
                ? 'Trader Preview Mode · Subscribe to a 30-day cycle to unlock institutional entry, stop loss, and TP values.'
                : 'Guest Terminal Mode · Sign in or enroll to unlock live algorithmic execution parameters.'}
            </span>
          </div>
          <button
            onClick={user ? onOpenPricing : onOpenAuth}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-all shrink-0 cursor-pointer shadow-glow-blue flex items-center gap-1.5"
          >
            {user ? 'Unlock Full Access ($10)' : 'Sign In / 1-Click'}
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Signals Content */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 rounded-2xl border border-border bg-card/60 p-8 font-mono">
          <Clock className="h-8 w-8 text-slate-500 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-700">No {filter} signals matching query</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            Execution parameters update continuously during active market volatility hours.
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((s) => {
            const isBuy = s.direction === 'BUY';
            const signalUnlocked = hasAccess;
            const rrData = calculateRR(s.entry, s.stop_loss, s.take_profit_1);

            return (
              <div
                key={s.id}
                className="rounded-2xl border border-border bg-card p-5 space-y-4 hover:border-slate-300 hover:bg-card-hover transition-all duration-200 shadow-lg group relative overflow-hidden flex flex-col justify-between"
              >
                <div className="space-y-4">
                  {/* Card Top */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-[#0B101C] to-[#04060A] border border-border font-mono font-bold text-sm text-slate-900 flex items-center justify-center shadow-inner">
                        {s.symbol.slice(0, 3)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-base font-bold text-slate-900 tracking-wide">{s.symbol}</span>
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1 ${
                              isBuy
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            }`}
                          >
                            {isBuy ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                            {s.direction}
                          </span>
                        </div>
                        <div className="text-[11px] font-mono text-slate-500 flex items-center gap-1.5 mt-0.5">
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-700">
                            {s.plan_tier === 'PERFECT_SIGNAL_BOX' ? '⚡ Perfect Signal' : 'SR Box'}
                          </span>
                          <span>· 60m Scan</span>
                        </div>
                      </div>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider ${
                        s.status === 'active'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-slate-800 text-slate-500 border border-slate-700'
                      }`}
                    >
                      {s.status === 'active' && <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />}
                      {s.status} {s.pnl ? `· ${s.pnl}` : ''}
                    </span>
                  </div>

                  {/* Visual Dynamic Risk:Reward Scale */}
                  <div className="py-1">
                    <div className="flex justify-between text-[10px] font-mono text-slate-500 pb-1">
                      <span className="text-rose-400 font-semibold">Risk (1.0)</span>
                      <span className="text-slate-500 font-bold">{rrData.ratio}</span>
                      <span className="text-emerald-400 font-semibold">Reward Target</span>
                    </div>
                    <div className="h-2 w-full bg-slate-50 rounded-full overflow-hidden flex border border-border">
                      <div 
                        style={{ width: `${rrData.riskPct}%` }} 
                        className="bg-rose-500/70 h-full border-r border-[#05070D]" 
                      />
                      <div 
                        style={{ width: `${rrData.rewardPct}%` }} 
                        className="bg-emerald-500/70 h-full" 
                      />
                    </div>
                  </div>

                  {/* Numeric Parameters Grid */}
                  <div className="grid grid-cols-2 gap-2 text-xs font-mono relative">
                    <div className="p-3 rounded-xl bg-slate-50 border border-border">
                      <div className="text-[10px] uppercase text-slate-500 tracking-wider">Entry Zone</div>
                      <div className={`text-sm font-bold text-slate-900 tabular-nums mt-0.5 ${!signalUnlocked ? 'blur-sm select-none' : ''}`}>
                        {signalUnlocked ? s.entry : '••••••'}
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-rose-500/5 border border-rose-500/20">
                      <div className="text-[10px] uppercase text-rose-400 font-semibold tracking-wider">Stop Loss</div>
                      <div className={`text-sm font-bold text-rose-400 tabular-nums mt-0.5 ${!signalUnlocked ? 'blur-sm select-none' : ''}`}>
                        {signalUnlocked ? s.stop_loss : '••••••'}
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
                      <div className="text-[10px] uppercase text-emerald-400 font-semibold tracking-wider">Take Profit 1</div>
                      <div className={`text-sm font-bold text-emerald-400 tabular-nums mt-0.5 ${!signalUnlocked ? 'blur-sm select-none' : ''}`}>
                        {signalUnlocked ? s.take_profit_1 : '••••••'}
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
                      <div className="text-[10px] uppercase text-emerald-400 font-semibold tracking-wider">Take Profit 2</div>
                      <div className={`text-sm font-bold text-emerald-400 tabular-nums mt-0.5 ${!signalUnlocked ? 'blur-sm select-none' : ''}`}>
                        {signalUnlocked ? (s.take_profit_2 || 'Runner TP') : '••••••'}
                      </div>
                    </div>

                    {!signalUnlocked && (
                      <div 
                        onClick={user ? onOpenPricing : onOpenAuth}
                        className="absolute inset-0 bg-background/80 backdrop-blur-[3px] flex items-center justify-center rounded-xl cursor-pointer hover:bg-background/60 transition-all border border-blue-500/30"
                      >
                        <span className="px-3.5 py-1.5 rounded-xl bg-blue-600 text-white font-bold text-[11px] shadow-glow-blue flex items-center gap-1.5 font-mono">
                          <Lock className="h-3.5 w-3.5" />
                          Unlock Parameters
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Analysis Drawer */}
                  {s.notes && (
                    <div className="rounded-xl border border-border bg-slate-50 p-3 text-[11px] text-slate-700 leading-relaxed font-mono">
                      <div className="flex items-center justify-between text-amber-400 font-bold mb-1">
                        <span>Desk Analysis Rationale:</span>
                      </div>
                      <p>{signalUnlocked ? s.notes : 'Full technical commentary and institutional sweep confirmation visible to subscribed members.'}</p>
                    </div>
                  )}
                </div>

                {/* Bottom Actions */}
                <div className="pt-3 border-t border-border/60 space-y-2">
                  {signalUnlocked && (
                    <div className="flex items-center justify-between text-xs font-mono">
                      <button
                        onClick={() => handleCopyParams(s)}
                        className="text-slate-500 hover:text-white flex items-center gap-1.5 text-[11px] cursor-pointer py-1.5 px-3 rounded-lg hover:bg-slate-100 transition-colors border border-border/50"
                      >
                        {copiedId === s.id ? (
                          <>
                            <Check className="h-3.5 w-3.5 text-emerald-400" />
                            <span className="text-emerald-400 font-bold">Copied to Clipboard</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3.5 w-3.5 text-slate-500" />
                            <span>Copy for MetaTrader</span>
                          </>
                        )}
                      </button>

                      <span className="text-[10px] text-slate-500 tabular-nums">
                        {new Date(s.created).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} UTC
                      </span>
                    </div>
                  )}

                  {/* Admin inline controls */}
                  {isAdmin && (
                    <div className="pt-2 border-t border-border/40 flex items-center justify-between font-mono text-[11px]">
                      <div className="flex items-center gap-1.5">
                        {s.status === 'active' && (
                          <button
                            onClick={() => handleCloseSignal(s)}
                            className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30 transition-colors cursor-pointer"
                          >
                            Close / Set PnL
                          </button>
                        )}
                        <button
                          onClick={() => openEditModal(s)}
                          className="p-1 text-slate-500 hover:text-blue-400 rounded cursor-pointer"
                          title="Edit Signal"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <button
                        onClick={() => handleDelete(s.id)}
                        className="p-1 text-slate-500 hover:text-rose-400 rounded cursor-pointer"
                        title="Delete Signal"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Terminal Table View */
        <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-lg font-mono text-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-slate-500 border-b border-border">
                <tr>
                  <th className="p-3.5">Symbol</th>
                  <th className="p-3.5">Direction</th>
                  <th className="p-3.5">Entry Zone</th>
                  <th className="p-3.5">Stop Loss</th>
                  <th className="p-3.5">Take Profit 1</th>
                  <th className="p-3.5">Take Profit 2</th>
                  <th className="p-3.5">R:R Ratio</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {filtered.map((s) => {
                  const isBuy = s.direction === 'BUY';
                  const signalUnlocked = hasAccess;
                  const rrData = calculateRR(s.entry, s.stop_loss, s.take_profit_1);

                  return (
                    <tr key={s.id} className="hover:bg-card-hover transition-colors">
                      <td className="p-3.5 font-bold text-slate-900">{s.symbol}</td>
                      <td className="p-3.5">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            isBuy ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                          }`}
                        >
                          {s.direction}
                        </span>
                      </td>
                      <td className="p-3.5 tabular-nums text-slate-800">
                        {signalUnlocked ? s.entry : '••••••'}
                      </td>
                      <td className="p-3.5 tabular-nums text-rose-400">
                        {signalUnlocked ? s.stop_loss : '••••••'}
                      </td>
                      <td className="p-3.5 tabular-nums text-emerald-400">
                        {signalUnlocked ? s.take_profit_1 : '••••••'}
                      </td>
                      <td className="p-3.5 tabular-nums text-emerald-400">
                        {signalUnlocked ? (s.take_profit_2 || '-') : '••••••'}
                      </td>
                      <td className="p-3.5 tabular-nums text-slate-700 font-bold">
                        {rrData.ratio}
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            s.status === 'active'
                              ? 'bg-emerald-500/10 text-emerald-400'
                              : 'bg-slate-800 text-slate-500'
                          }`}
                        >
                          {s.status} {s.pnl ? `(${s.pnl})` : ''}
                        </span>
                      </td>
                      <td className="p-3.5 text-right">
                        {signalUnlocked ? (
                          <button
                            onClick={() => handleCopyParams(s)}
                            className="inline-flex items-center gap-1 text-[11px] text-slate-500 hover:text-white bg-slate-50 px-2.5 py-1 rounded-lg border border-border cursor-pointer"
                          >
                            {copiedId === s.id ? (
                              <Check className="h-3 w-3 text-emerald-400" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                            {copiedId === s.id ? 'Copied' : 'Copy'}
                          </button>
                        ) : (
                          <button
                            onClick={user ? onOpenPricing : onOpenAuth}
                            className="text-blue-400 hover:underline text-[11px]"
                          >
                            Unlock
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Admin Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl border border-border bg-card p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 font-sans">
                <Zap className="h-5 w-5 text-emerald-400" />
                {editingSignal ? 'Edit Signal Parameters' : 'Publish New Algorithmic Signal'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-500 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateOrUpdateSignal} className="space-y-4 font-mono text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 mb-1">Symbol</label>
                  <input
                    type="text"
                    required
                    value={form.symbol}
                    onChange={(e) => setForm({ ...form, symbol: e.target.value.toUpperCase() })}
                    placeholder="e.g. XAUUSD"
                    className="w-full rounded-xl border border-border bg-slate-50 px-3.5 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Direction</label>
                  <select
                    value={form.direction}
                    onChange={(e) => setForm({ ...form, direction: e.target.value })}
                    className="w-full rounded-xl border border-border bg-slate-50 px-3.5 py-2 text-white cursor-pointer"
                  >
                    <option value="BUY">BUY (Long)</option>
                    <option value="SELL">SELL (Short)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 mb-1">Entry Price</label>
                  <input
                    type="text"
                    required
                    value={form.entry}
                    onChange={(e) => setForm({ ...form, entry: e.target.value })}
                    placeholder="e.g. 2,748.50"
                    className="w-full rounded-xl border border-border bg-slate-50 px-3.5 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Stop Loss (SL)</label>
                  <input
                    type="text"
                    required
                    value={form.stop_loss}
                    onChange={(e) => setForm({ ...form, stop_loss: e.target.value })}
                    placeholder="e.g. 2,735.00"
                    className="w-full rounded-xl border border-border bg-slate-50 px-3.5 py-2 text-rose-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 mb-1">Take Profit 1 (TP1)</label>
                  <input
                    type="text"
                    required
                    value={form.take_profit_1}
                    onChange={(e) => setForm({ ...form, take_profit_1: e.target.value })}
                    placeholder="e.g. 2,765.00"
                    className="w-full rounded-xl border border-border bg-slate-50 px-3.5 py-2 text-emerald-400"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Take Profit 2 (Optional)</label>
                  <input
                    type="text"
                    value={form.take_profit_2}
                    onChange={(e) => setForm({ ...form, take_profit_2: e.target.value })}
                    placeholder="e.g. 2,780.00"
                    className="w-full rounded-xl border border-border bg-slate-50 px-3.5 py-2 text-emerald-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 mb-1">Plan Tier</label>
                  <select
                    value={form.plan_tier}
                    onChange={(e) => setForm({ ...form, plan_tier: e.target.value })}
                    className="w-full rounded-xl border border-border bg-slate-50 px-3.5 py-2 text-white cursor-pointer"
                  >
                    <option value="PERFECT_SIGNAL_BOX">Perfect Signal Box ($20)</option>
                    <option value="SR_SIGNAL_BOX">SR Signal Box ($10)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="w-full rounded-xl border border-border bg-slate-50 px-3.5 py-2 text-white cursor-pointer"
                  >
                    <option value="active">Active</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-500 mb-1">Analysis Rationale & Notes</label>
                <textarea
                  rows="3"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="e.g. London liquidity sweep confirmed on M15. Institutional order block retest."
                  className="w-full rounded-xl border border-border bg-slate-50 px-3.5 py-2 text-white"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl border border-border bg-slate-800 text-slate-700 hover:bg-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-glow-emerald cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'Publishing...' : editingSignal ? 'Update Signal' : 'Broadcast Signal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
