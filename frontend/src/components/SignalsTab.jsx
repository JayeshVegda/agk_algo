import React, { useState, useEffect } from 'react';
import { pb } from '../lib/pocketbase';
import { 
  Zap, TrendingUp, TrendingDown, Clock, Plus, X, Radio, 
  Lock, ArrowRight, Edit3, Trash2, CheckCircle2, Copy, Check, 
  Search, SlidersHorizontal, ShieldAlert, Award, Target, Flame,
  LayoutGrid, Table as TableIcon, ChevronDown, ChevronUp
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './ui/Card';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';

export function SignalsTab({ user, onOpenPricing, onOpenAuth, notify }) {
  const [signals, setSignals] = useState([]);
  const [filter, setFilter] = useState('active');
  const [directionFilter, setDirectionFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingSignal, setEditingSignal] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

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

    const unsubPromise = pb.collection('signals').subscribe('*', (e) => {
      if (e.action === 'create') {
        setSignals((prev) => [e.record, ...prev]);
        if (notify) {
          notify({
            type: 'info',
            title: `Signal: ${e.record.symbol} ${e.record.direction}`,
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
            title: 'Signal Broadcasted',
            message: `${form.symbol} ${form.direction} published live`
          });
        }
      }
      setShowModal(false);
      setEditingSignal(null);
      setForm({
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
      loadSignals();
    } catch (err) {
      if (notify) {
        notify({
          type: 'error',
          title: 'Publish Error',
          message: err.message
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseSignal = async (signal) => {
    const pnlInput = window.prompt(`Enter final result for ${signal.symbol} (e.g. +45 pips or Hit SL):`, '+50 pips');
    if (pnlInput === null) return;

    try {
      await pb.collection('signals').update(signal.id, {
        status: 'closed',
        pnl: pnlInput.trim()
      });
      if (notify) {
        notify({
          type: 'info',
          title: 'Signal Archived',
          message: `${signal.symbol} closed with ${pnlInput}`
        });
      }
      loadSignals();
    } catch (err) {
      if (notify) notify({ type: 'error', title: 'Error', message: err.message });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this signal permanently?')) return;
    try {
      await pb.collection('signals').delete(id);
      if (notify) {
        notify({
          type: 'info',
          title: 'Signal Deleted',
          message: 'Signal removed from active feed'
        });
      }
      loadSignals();
    } catch (err) {
      if (notify) notify({ type: 'error', title: 'Delete Error', message: err.message });
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
      plan_tier: s.plan_tier || 'PERFECT_SIGNAL_BOX',
      status: s.status || 'active',
      notes: s.notes || ''
    });
    setShowModal(true);
  };

  const isAdmin = user?.role === 'admin';
  const hasAccess = isAdmin || (user?.cycle_expires_at && new Date(user.cycle_expires_at) > new Date());

  const filtered = signals.filter((s) => {
    if (filter !== 'all' && s.status !== filter) return false;
    if (directionFilter !== 'all' && s.direction !== directionFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        s.symbol.toLowerCase().includes(q) ||
        (s.notes && s.notes.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const activeCount = signals.filter(s => s.status === 'active').length;
  const closedCount = signals.filter(s => s.status === 'closed').length;

  const calculateRR = (entryStr, slStr, tpStr) => {
    const entry = parseFloat(entryStr?.replace(/,/g, ''));
    const sl = parseFloat(slStr?.replace(/,/g, ''));
    const tp = parseFloat(tpStr?.replace(/,/g, ''));
    if (isNaN(entry) || isNaN(sl) || isNaN(tp)) return { ratio: '1 : 2.0', riskPct: 33, rewardPct: 67 };

    const risk = Math.abs(entry - sl);
    const reward = Math.abs(tp - entry);
    if (risk <= 0) return { ratio: '1 : 2.0', riskPct: 33, rewardPct: 67 };

    const mult = (reward / risk).toFixed(1);
    const riskPct = Math.min(Math.max((1 / (1 + Number(mult))) * 100, 20), 50);
    const rewardPct = 100 - riskPct;
    return { ratio: `1 : ${mult}`, riskPct, rewardPct };
  };

  return (
    <div className="space-y-6 font-sans text-[#E7E9EF]">
      
      {/* 1. Header / Real Data KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl border border-white/10 bg-[#10141B] shadow-xl flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold text-[#A6ADB9] uppercase tracking-wider">Active Signals</div>
            <div className="text-xl font-bold text-white mt-0.5 tabular-nums flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#00D878] animate-pulse" />
              <span>{activeCount} Live</span>
            </div>
          </div>
          <Radio className="h-5 w-5 text-[#00D878]" />
        </div>

        <div className="p-4 rounded-2xl border border-white/10 bg-[#10141B] shadow-xl flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold text-[#A6ADB9] uppercase tracking-wider">Historical Setups</div>
            <div className="text-xl font-bold text-white mt-0.5 tabular-nums">
              {closedCount} Logged
            </div>
          </div>
          <Target className="h-5 w-5 text-[#A6ADB9]" />
        </div>

        <div className="p-4 rounded-2xl border border-white/10 bg-[#10141B] shadow-xl flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold text-[#A6ADB9] uppercase tracking-wider">Risk Protocol</div>
            <div className="text-xl font-bold text-white mt-0.5">
              Hard Stop-Loss
            </div>
          </div>
          <ShieldAlert className="h-5 w-5 text-[#00D878]" />
        </div>

        <div className="p-4 rounded-2xl border border-white/10 bg-[#10141B] shadow-xl flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold text-[#A6ADB9] uppercase tracking-wider">Settlement</div>
            <div className="text-xl font-bold text-white mt-0.5">
              30-Day USDT
            </div>
          </div>
          <Zap className="h-5 w-5 text-[#F3C653]" />
        </div>
      </div>

      {/* 2. Control Bar: Search + Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3 rounded-2xl border border-white/10 bg-[#10141B] text-xs">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#A6ADB9]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter by pair (e.g. XAUUSD, EURUSD)..."
            className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-white/10 bg-white/5 text-white placeholder:text-[#A6ADB9] focus:outline-none focus:border-[#F3C653] text-xs"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="inline-flex rounded-xl border border-white/10 bg-white/5 p-0.5">
            {[
              { id: 'active', label: `Active (${activeCount})` },
              { id: 'closed', label: `Closed (${closedCount})` },
              { id: 'all', label: `All (${signals.length})` },
            ].map((btn) => (
              <button
                key={btn.id}
                onClick={() => setFilter(btn.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                  filter === btn.id
                    ? 'bg-[#F3C653] text-[#07090D] font-bold'
                    : 'text-[#A6ADB9] hover:text-white hover:bg-white/5'
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>

          <div className="inline-flex rounded-xl border border-white/10 bg-white/5 p-0.5">
            {[
              { id: 'all', label: 'All Sides' },
              { id: 'BUY', label: 'BUY' },
              { id: 'SELL', label: 'SELL' },
            ].map((d) => (
              <button
                key={d.id}
                onClick={() => setDirectionFilter(d.id)}
                className={`px-2 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                  directionFilter === d.id
                    ? 'bg-white/20 text-white font-bold'
                    : 'text-[#A6ADB9] hover:text-white hover:bg-white/5'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>

          <div className="inline-flex rounded-xl border border-white/10 bg-white/5 p-0.5">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg cursor-pointer ${viewMode === 'grid' ? 'bg-white/20 text-white' : 'text-[#A6ADB9]'}`}
              title="Grid View"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg cursor-pointer ${viewMode === 'table' ? 'bg-white/20 text-white' : 'text-[#A6ADB9]'}`}
              title="Table View"
            >
              <TableIcon className="h-3.5 w-3.5" />
            </button>
          </div>

          {isAdmin && (
            <Button
              size="sm"
              onClick={() => { setEditingSignal(null); setShowModal(true); }}
              className="gap-1.5 font-bold"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Post Signal</span>
            </Button>
          )}
        </div>
      </div>

      {/* 3. Non-Subscribed Notice */}
      {!hasAccess && (
        <div className="p-4 rounded-2xl border border-[#F3C653]/30 bg-[#F3C653]/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 text-[#E7E9EF]">
            <Lock className="h-4 w-4 text-[#F3C653] shrink-0" />
            <span>
              {user 
                ? 'Preview Mode · Active 30-day membership required to view real-time Entry, SL, and TP targets.'
                : 'Preview Mode · Sign in or enroll in a 30-day signal box to unlock full coordinates.'}
            </span>
          </div>
          <Button
            size="sm"
            onClick={user ? onOpenPricing : onOpenAuth}
            className="shrink-0 gap-1.5 font-bold"
          >
            <span>{user ? 'Subscribe ($10 USDT)' : 'Sign In / Register'}</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}

      {/* 4. Signals List / Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 rounded-2xl border border-white/10 bg-[#10141B] p-6">
          <Clock className="h-8 w-8 text-[#A6ADB9] mx-auto mb-2" />
          <h3 className="text-sm font-bold text-white">No {filter} signals matching query</h3>
          <p className="text-xs text-[#A6ADB9] mt-1">
            New trades are broadcast during active London and New York market sessions.
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((s) => {
            const isBuy = s.direction === 'BUY';
            const signalUnlocked = hasAccess;
            const rrData = calculateRR(s.entry, s.stop_loss, s.take_profit_1);

            return (
              <Card key={s.id} className="flex flex-col justify-between hover:border-[#F3C653]/40 transition-all bg-[#10141B] border-white/10 shadow-xl">
                <div className="p-5 space-y-4">
                  {/* Top Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-white/5 border border-white/10 text-white font-bold text-xs flex items-center justify-center font-mono">
                        {s.symbol.slice(0, 3)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-white font-mono">{s.symbol}</span>
                          <span
                            className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${
                              isBuy
                                ? 'bg-[#00D878]/15 text-[#00D878] border border-[#00D878]/30'
                                : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                            }`}
                          >
                            {isBuy ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                            {s.direction}
                          </span>
                        </div>
                        <div className="text-[11px] text-[#A6ADB9] mt-0.5">
                          {s.plan_tier === 'PERFECT_SIGNAL_BOX' ? '⚡ Perfect Signal' : 'SR Box Tier'}
                        </div>
                      </div>
                    </div>

                    <Badge variant={s.status === 'active' ? 'positive' : 'secondary'}>
                      {s.status === 'active' ? 'ACTIVE' : (s.pnl || 'CLOSED')}
                    </Badge>
                  </div>

                  {/* Risk : Reward Gauge */}
                  <div>
                    <div className="flex justify-between text-[10px] text-[#A6ADB9] pb-1 font-semibold">
                      <span className="text-rose-400">Risk 1.0</span>
                      <span className="text-white font-mono">{rrData.ratio}</span>
                      <span className="text-[#00D878]">Reward Target</span>
                    </div>
                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden flex border border-white/10">
                      <div style={{ width: `${rrData.riskPct}%` }} className="bg-rose-500 h-full" />
                      <div style={{ width: `${rrData.rewardPct}%` }} className="bg-[#00D878] h-full" />
                    </div>
                  </div>

                  {/* Parameters Grid */}
                  <div className="grid grid-cols-2 gap-2 text-xs relative font-mono">
                    <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                      <div className="text-[10px] uppercase text-[#A6ADB9] font-semibold">Entry</div>
                      <div className={`text-sm font-bold text-white tabular-nums mt-0.5 ${!signalUnlocked ? 'blur-sm select-none' : ''}`}>
                        {signalUnlocked ? s.entry : '••••••'}
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20">
                      <div className="text-[10px] uppercase text-rose-400 font-semibold">Stop Loss</div>
                      <div className={`text-sm font-bold text-rose-400 tabular-nums mt-0.5 ${!signalUnlocked ? 'blur-sm select-none' : ''}`}>
                        {signalUnlocked ? s.stop_loss : '••••••'}
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-[#00D878]/10 border border-[#00D878]/20">
                      <div className="text-[10px] uppercase text-[#00D878] font-semibold">Take Profit 1</div>
                      <div className={`text-sm font-bold text-[#00D878] tabular-nums mt-0.5 ${!signalUnlocked ? 'blur-sm select-none' : ''}`}>
                        {signalUnlocked ? s.take_profit_1 : '••••••'}
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-[#00D878]/10 border border-[#00D878]/20">
                      <div className="text-[10px] uppercase text-[#00D878] font-semibold">Take Profit 2</div>
                      <div className={`text-sm font-bold text-[#00D878] tabular-nums mt-0.5 ${!signalUnlocked ? 'blur-sm select-none' : ''}`}>
                        {signalUnlocked ? (s.take_profit_2 || 'Runner') : '••••••'}
                      </div>
                    </div>

                    {!signalUnlocked && (
                      <div 
                        onClick={user ? onOpenPricing : onOpenAuth}
                        className="absolute inset-0 bg-[#10141B]/80 backdrop-blur-[2px] flex items-center justify-center rounded-xl cursor-pointer hover:bg-[#10141B]/60 transition-all border border-[#F3C653]/30"
                      >
                        <span className="px-3 py-1.5 rounded-xl bg-[#F3C653] text-[#07090D] font-bold text-[11px] shadow-sm flex items-center gap-1.5">
                          <Lock className="h-3 w-3" />
                          Unlock Coordinates
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Notes / Rationale */}
                  {s.notes && (
                    <div className="p-2.5 rounded-xl border border-white/10 bg-white/5 text-[11px] text-[#A6ADB9]">
                      <span className="font-bold text-white block mb-0.5 font-sans">Desk Rationale:</span>
                      <p>{signalUnlocked ? s.notes : 'Full technical trade notes reserved for subscribed members.'}</p>
                    </div>
                  )}
                </div>

                {/* Footer Controls */}
                <div className="p-3 border-t border-white/10 bg-white/5 flex items-center justify-between text-xs">
                  {signalUnlocked ? (
                    <button
                      onClick={() => handleCopyParams(s)}
                      className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#E7E9EF] hover:text-white py-1 px-2.5 rounded-lg border border-white/10 bg-[#10141B] cursor-pointer"
                    >
                      {copiedId === s.id ? (
                        <>
                          <Check className="h-3 w-3 text-[#00D878]" />
                          <span className="text-[#00D878]">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3 text-[#A6ADB9]" />
                          <span>Copy Parameters</span>
                        </>
                      )}
                    </button>
                  ) : (
                    <span className="text-[11px] text-[#A6ADB9]">Locked</span>
                  )}

                  <span className="text-[10px] text-[#A6ADB9] tabular-nums font-mono">
                    {new Date(s.created).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} UTC
                  </span>

                  {isAdmin && (
                    <div className="flex items-center gap-1">
                      {s.status === 'active' && (
                        <button
                          onClick={() => handleCloseSignal(s)}
                          className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#F3C653]/20 text-[#F3C653] border border-[#F3C653]/30 hover:bg-[#F3C653]/30 cursor-pointer"
                        >
                          Close / PnL
                        </button>
                      )}
                      <button
                        onClick={() => openEditModal(s)}
                        className="p-1 text-[#A6ADB9] hover:text-white cursor-pointer"
                        title="Edit"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(s.id)}
                        className="p-1 text-[#A6ADB9] hover:text-rose-400 cursor-pointer"
                        title="Delete"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <div className="rounded-2xl border border-white/10 bg-[#10141B] overflow-hidden shadow-xl text-xs font-mono">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-white/5 text-[#A6ADB9] border-b border-white/10 font-semibold">
                <tr>
                  <th className="p-3">Symbol</th>
                  <th className="p-3">Side</th>
                  <th className="p-3">Entry</th>
                  <th className="p-3">Stop Loss</th>
                  <th className="p-3">Target 1</th>
                  <th className="p-3">Target 2</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map((s) => {
                  const isBuy = s.direction === 'BUY';
                  const signalUnlocked = hasAccess;
                  return (
                    <tr key={s.id} className="hover:bg-white/5 transition-colors">
                      <td className="p-3 font-bold text-white">{s.symbol}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          isBuy ? 'bg-[#00D878]/15 text-[#00D878]' : 'bg-rose-500/15 text-rose-400'
                        }`}>
                          {s.direction}
                        </span>
                      </td>
                      <td className="p-3 tabular-nums">{signalUnlocked ? s.entry : '••••••'}</td>
                      <td className="p-3 tabular-nums text-rose-400">{signalUnlocked ? s.stop_loss : '••••••'}</td>
                      <td className="p-3 tabular-nums text-[#00D878]">{signalUnlocked ? s.take_profit_1 : '••••••'}</td>
                      <td className="p-3 tabular-nums text-[#00D878]">{signalUnlocked ? (s.take_profit_2 || 'Runner') : '••••••'}</td>
                      <td className="p-3">
                        <Badge variant={s.status === 'active' ? 'positive' : 'secondary'}>
                          {s.status === 'active' ? 'ACTIVE' : (s.pnl || 'CLOSED')}
                        </Badge>
                      </td>
                      <td className="p-3 text-right">
                        {signalUnlocked ? (
                          <button
                            onClick={() => handleCopyParams(s)}
                            className="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-white font-medium text-[11px] cursor-pointer"
                          >
                            {copiedId === s.id ? 'Copied' : 'Copy'}
                          </button>
                        ) : (
                          <button
                            onClick={user ? onOpenPricing : onOpenAuth}
                            className="text-[#F3C653] font-bold hover:underline text-[11px]"
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

      {/* Admin Post/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#10141B] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Zap className="h-4 w-4 text-[#F3C653]" />
                <span>{editingSignal ? 'Edit Signal' : 'Broadcast Signal'}</span>
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-[#A6ADB9] hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateOrUpdateSignal} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#E7E9EF] font-semibold mb-1">Symbol</label>
                  <input
                    type="text"
                    required
                    value={form.symbol}
                    onChange={(e) => setForm({ ...form, symbol: e.target.value.toUpperCase() })}
                    placeholder="e.g. XAUUSD"
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white focus:outline-none focus:border-[#F3C653]"
                  />
                </div>
                <div>
                  <label className="block text-[#E7E9EF] font-semibold mb-1">Direction</label>
                  <select
                    value={form.direction}
                    onChange={(e) => setForm({ ...form, direction: e.target.value })}
                    className="w-full rounded-xl border border-white/10 bg-[#171D26] px-3 py-2 text-white cursor-pointer"
                  >
                    <option value="BUY">BUY (Long)</option>
                    <option value="SELL">SELL (Short)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#E7E9EF] font-semibold mb-1">Entry</label>
                  <input
                    type="text"
                    required
                    value={form.entry}
                    onChange={(e) => setForm({ ...form, entry: e.target.value })}
                    placeholder="e.g. 2,748.50"
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-[#E7E9EF] font-semibold mb-1">Stop Loss (SL)</label>
                  <input
                    type="text"
                    required
                    value={form.stop_loss}
                    onChange={(e) => setForm({ ...form, stop_loss: e.target.value })}
                    placeholder="e.g. 2,735.00"
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-rose-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#E7E9EF] font-semibold mb-1">Take Profit 1</label>
                  <input
                    type="text"
                    required
                    value={form.take_profit_1}
                    onChange={(e) => setForm({ ...form, take_profit_1: e.target.value })}
                    placeholder="e.g. 2,765.00"
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-[#00D878]"
                  />
                </div>
                <div>
                  <label className="block text-[#E7E9EF] font-semibold mb-1">Take Profit 2 (Optional)</label>
                  <input
                    type="text"
                    value={form.take_profit_2}
                    onChange={(e) => setForm({ ...form, take_profit_2: e.target.value })}
                    placeholder="e.g. 2,780.00"
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-[#00D878]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#E7E9EF] font-semibold mb-1">Plan Tier</label>
                  <select
                    value={form.plan_tier}
                    onChange={(e) => setForm({ ...form, plan_tier: e.target.value })}
                    className="w-full rounded-xl border border-white/10 bg-[#171D26] px-3 py-2 text-white cursor-pointer"
                  >
                    <option value="PERFECT_SIGNAL_BOX">Perfect Signal Box ($20)</option>
                    <option value="SR_SIGNAL_BOX">SR Signal Box ($10)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[#E7E9EF] font-semibold mb-1">Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="w-full rounded-xl border border-white/10 bg-[#171D26] px-3 py-2 text-white cursor-pointer"
                  >
                    <option value="active">Active</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[#E7E9EF] font-semibold mb-1">Technical Rationale</label>
                <textarea
                  rows="2"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="e.g. Invalidation above 2,752 liquidity sweep."
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={submitting}
                  className="font-bold"
                >
                  {submitting ? 'Saving...' : editingSignal ? 'Update' : 'Broadcast'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
