import React, { useState, useEffect } from 'react';
import { pb } from '../lib/pocketbase';
import { 
  Shield, Zap, CheckCircle2, XCircle, Trash2, Edit3, Plus, 
  Bell, Pin, Cpu, DollarSign, Users, RefreshCw, AlertCircle
} from 'lucide-react';

export function AdminTab({ user }) {
  const [activeSubTab, setActiveSubTab] = useState('signals');
  const [signals, setSignals] = useState([]);
  const [payments, setPayments] = useState([]);
  const [broadcasts, setBroadcasts] = useState([]);
  const [bots, setBots] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);

  // Modals state
  const [signalModal, setSignalModal] = useState(null); // null or { mode: 'create' | 'edit', data: ... }
  const [broadcastModal, setBroadcastModal] = useState(null);
  const [botModal, setBotModal] = useState(null);

  // Load all admin data
  const loadData = async () => {
    setLoading(true);
    try {
      const [sRes, pRes, bRes, botRes, uRes] = await Promise.all([
        pb.collection('signals').getFullList({ sort: '-created' }),
        pb.collection('payments').getFullList({ sort: '-created' }),
        pb.collection('broadcasts').getFullList({ sort: '-created' }),
        pb.collection('bots').getFullList({ sort: '-created' }),
        pb.collection('users').getFullList({ sort: '-created' }),
      ]);
      setSignals(sRes);
      setPayments(pRes);
      setBroadcasts(bRes);
      setBots(botRes);
      setAllUsers(uRes);
    } catch (err) {
      console.error('Error fetching admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // Subscribe to realtime updates for all collections
    const unsubSignals = pb.collection('signals').subscribe('*', () => loadData());
    const unsubPayments = pb.collection('payments').subscribe('*', () => loadData());
    const unsubBroadcasts = pb.collection('broadcasts').subscribe('*', () => loadData());
    const unsubBots = pb.collection('bots').subscribe('*', () => loadData());
    const unsubUsers = pb.collection('users').subscribe('*', () => loadData());

    return () => {
      unsubSignals.then(u => u());
      unsubPayments.then(u => u());
      unsubBroadcasts.then(u => u());
      unsubBots.then(u => u());
      unsubUsers.then(u => u());
    };
  }, []);

  const showNotification = (text, isError = false) => {
    setMsg({ text, isError });
    setTimeout(() => setMsg(null), 4000);
  };

  // --- SIGNALS CRUD ---
  const handleSaveSignal = async (e) => {
    e.preventDefault();
    const data = signalModal.data;
    try {
      if (signalModal.mode === 'create') {
        await pb.collection('signals').create(data);
        showNotification('Signal created & broadcasted in realtime!');
      } else {
        await pb.collection('signals').update(data.id, data);
        showNotification('Signal updated in realtime!');
      }
      setSignalModal(null);
      loadData();
    } catch (err) {
      showNotification(err.message || 'Error saving signal', true);
    }
  };

  const handleDeleteSignal = async (id) => {
    if (!window.confirm('Are you sure you want to delete this signal?')) return;
    try {
      await pb.collection('signals').delete(id);
      showNotification('Signal deleted.');
      loadData();
    } catch (err) {
      showNotification(err.message || 'Error deleting signal', true);
    }
  };

  const handleToggleSignalStatus = async (s) => {
    const newStatus = s.status === 'active' ? 'closed' : 'active';
    let pnl = s.pnl;
    if (newStatus === 'closed' && !pnl) {
      pnl = window.prompt('Enter final trade result / PnL (e.g. +110 pips, Hit TP2):', '+85 pips') || '';
    }
    try {
      await pb.collection('signals').update(s.id, { status: newStatus, pnl });
      showNotification(`Signal marked as ${newStatus}.`);
      loadData();
    } catch (err) {
      showNotification(err.message || 'Error updating status', true);
    }
  };

  // --- PAYMENTS & SUBSCRIPTIONS CRUD ---
  const handleApprovePayment = async (p) => {
    try {
      // 1. Mark payment confirmed
      await pb.collection('payments').update(p.id, { status: 'confirmed' });

      // 2. Grant 30 days cycle to user
      const userList = await pb.collection('users').getList(1, 1, {
        filter: `email = "${p.user_email}"`
      });

      if (userList.items.length > 0) {
        const targetUser = userList.items[0];
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + 30);

        await pb.collection('users').update(targetUser.id, {
          plan: p.plan,
          cycle_expires_at: expiryDate.toISOString()
        });
        showNotification(`Payment confirmed & granted 30-day ${p.plan} access to ${p.user_email}!`);
      } else {
        showNotification(`Payment confirmed (User account ${p.user_email} not found).`);
      }
      loadData();
    } catch (err) {
      showNotification(err.message || 'Error approving payment', true);
    }
  };

  const handleRejectPayment = async (p) => {
    if (!window.confirm(`Reject payment for ${p.user_email}?`)) return;
    try {
      await pb.collection('payments').update(p.id, { status: 'rejected' });
      showNotification('Payment marked as rejected.');
      loadData();
    } catch (err) {
      showNotification(err.message || 'Error rejecting payment', true);
    }
  };

  // --- BROADCASTS CRUD ---
  const handleSaveBroadcast = async (e) => {
    e.preventDefault();
    const data = broadcastModal.data;
    try {
      if (broadcastModal.mode === 'create') {
        await pb.collection('broadcasts').create({
          ...data,
          author: data.author || user?.name || 'Lead Desk Admin'
        });
        showNotification('Announcement broadcasted!');
      } else {
        await pb.collection('broadcasts').update(data.id, data);
        showNotification('Announcement updated.');
      }
      setBroadcastModal(null);
      loadData();
    } catch (err) {
      showNotification(err.message || 'Error saving broadcast', true);
    }
  };

  const handleDeleteBroadcast = async (id) => {
    if (!window.confirm('Delete this announcement?')) return;
    try {
      await pb.collection('broadcasts').delete(id);
      showNotification('Announcement deleted.');
      loadData();
    } catch (err) {
      showNotification(err.message || 'Error deleting broadcast', true);
    }
  };

  // --- BOTS CRUD ---
  const handleSaveBot = async (e) => {
    e.preventDefault();
    const data = botModal.data;
    try {
      if (botModal.mode === 'create') {
        await pb.collection('bots').create(data);
        showNotification('Bot added to store!');
      } else {
        await pb.collection('bots').update(data.id, data);
        showNotification('Bot updated.');
      }
      setBotModal(null);
      loadData();
    } catch (err) {
      showNotification(err.message || 'Error saving bot', true);
    }
  };

  const handleDeleteBot = async (id) => {
    if (!window.confirm('Delete this bot from store?')) return;
    try {
      await pb.collection('bots').delete(id);
      showNotification('Bot deleted.');
      loadData();
    } catch (err) {
      showNotification(err.message || 'Error deleting bot', true);
    }
  };

  // --- USER PLAN & ROLE UPDATE ---
  const handleUpdateUserPlan = async (userId, newPlan) => {
    try {
      await pb.collection('users').update(userId, { plan: newPlan });
      showNotification('User plan updated successfully.');
      loadData();
    } catch (err) {
      showNotification(err.message || 'Error updating user plan', true);
    }
  };

  const handleToggleUserRole = async (u) => {
    const newRole = u.role === 'admin' ? 'user' : 'admin';
    try {
      await pb.collection('users').update(u.id, { role: newRole });
      showNotification(`User role set to ${newRole}.`);
      loadData();
    } catch (err) {
      showNotification(err.message || 'Error updating user role', true);
    }
  };

  const pendingPaymentsCount = payments.filter(p => p.status === 'pending').length;

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl border border-amber-500/30 bg-amber-500/5 backdrop-blur shadow-sm">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[11px] font-mono font-semibold mb-1 border border-amber-500/30">
            <Shield className="h-3 w-3" />
            ADMINISTRATOR DESK CONTROL
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Institutional Operations Center</h1>
          <p className="text-xs text-slate-400">Full Realtime CRUD · Manage Signals, Subscriptions, Bots, and User Accounts</p>
        </div>

        <button
          onClick={loadData}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card hover:bg-slate-800 text-xs text-slate-300 transition-colors cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Data
        </button>
      </div>

      {/* Toast Notification */}
      {msg && (
        <div className={`p-3.5 rounded-xl text-xs font-mono flex items-center justify-between transition-all ${
          msg.isError 
            ? 'bg-rose-500/10 border border-rose-500/30 text-rose-300' 
            : 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
        }`}>
          <span>{msg.text}</span>
          <button onClick={() => setMsg(null)} className="text-slate-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Admin Subtabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-mono">
        {[
          { id: 'signals', label: `Signals (${signals.length})`, icon: Zap },
          { id: 'payments', label: `Payments & Subs (${payments.length})`, icon: DollarSign, badge: pendingPaymentsCount },
          { id: 'broadcasts', label: `Announcements (${broadcasts.length})`, icon: Bell },
          { id: 'bots', label: `Trading Bots (${bots.length})`, icon: Cpu },
          { id: 'users', label: `Users (${allUsers.length})`, icon: Users },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              className={`px-3.5 py-2 rounded-xl border flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-blue-600/20 border-blue-500 text-blue-300 font-bold shadow-sm'
                  : 'border-border/80 bg-card/70 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{tab.label}</span>
              {tab.badge > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-black text-[10px] font-bold">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* SUBTAB 1: SIGNALS CRUD */}
      {activeSubTab === 'signals' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">Signal Feeds Management</h3>
            <button
              onClick={() => setSignalModal({
                mode: 'create',
                data: {
                  symbol: 'XAUUSD',
                  direction: 'BUY',
                  entry: '',
                  stop_loss: '',
                  take_profit_1: '',
                  take_profit_2: '',
                  plan_tier: 'PERFECT_SIGNAL_BOX',
                  status: 'active',
                  notes: ''
                }
              })}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow transition-all cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              Post New Signal
            </button>
          </div>

          <div className="rounded-2xl border border-border/80 bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-[#05080f] text-slate-400 border-b border-border/60">
                  <tr>
                    <th className="p-3">Symbol / Type</th>
                    <th className="p-3">Entry</th>
                    <th className="p-3">Stop Loss</th>
                    <th className="p-3">Take Profit</th>
                    <th className="p-3">Plan Tier</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {signals.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="p-3">
                        <span className="font-bold text-white mr-2">{s.symbol}</span>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          s.direction === 'BUY' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                        }`}>
                          {s.direction}
                        </span>
                      </td>
                      <td className="p-3 text-slate-200">{s.entry}</td>
                      <td className="p-3 text-rose-400">{s.stop_loss}</td>
                      <td className="p-3 text-emerald-400">{s.take_profit_1} {s.take_profit_2 ? `/ ${s.take_profit_2}` : ''}</td>
                      <td className="p-3 text-slate-400">{s.plan_tier}</td>
                      <td className="p-3">
                        <button
                          onClick={() => handleToggleSignalStatus(s)}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase transition-colors cursor-pointer ${
                            s.status === 'active' 
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                              : 'bg-slate-800 text-slate-400 border border-slate-700'
                          }`}
                          title="Click to toggle status"
                        >
                          {s.status} {s.pnl ? `(${s.pnl})` : ''}
                        </button>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => setSignalModal({ mode: 'edit', data: { ...s } })}
                            className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                            title="Edit Signal"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteSignal(s.id)}
                            className="p-1 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-400"
                            title="Delete Signal"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {signals.length === 0 && (
                    <tr>
                      <td colSpan="7" className="p-8 text-center text-slate-500">
                        No signals currently published.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 2: PAYMENTS & SUBSCRIPTIONS */}
      {activeSubTab === 'payments' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
              Pending & Confirmed Payments ({payments.length})
            </h3>
          </div>

          <div className="rounded-2xl border border-border/80 bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-[#05080f] text-slate-400 border-b border-border/60">
                  <tr>
                    <th className="p-3">Trader Email</th>
                    <th className="p-3">Plan</th>
                    <th className="p-3">Amount</th>
                    <th className="p-3">Network</th>
                    <th className="p-3">Blockchain TXID</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {payments.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="p-3 font-semibold text-white">{p.user_email}</td>
                      <td className="p-3 text-blue-400 font-bold">{p.plan}</td>
                      <td className="p-3 text-emerald-400 font-bold">${p.amount} USDT</td>
                      <td className="p-3 text-slate-300">{p.network}</td>
                      <td className="p-3 max-w-[180px] truncate text-slate-400" title={p.txid}>
                        {p.txid}
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          p.status === 'confirmed'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : p.status === 'rejected'
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="p-3">
                        {p.status === 'pending' ? (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleApprovePayment(p)}
                              className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] shadow cursor-pointer transition-colors"
                            >
                              Approve & Grant
                            </button>
                            <button
                              onClick={() => handleRejectPayment(p)}
                              className="px-2 py-1 rounded bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 text-[10px] cursor-pointer"
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-500">Processed</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {payments.length === 0 && (
                    <tr>
                      <td colSpan="7" className="p-8 text-center text-slate-500">
                        No payment requests received yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 3: ANNOUNCEMENTS CRUD */}
      {activeSubTab === 'broadcasts' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">Announcements & Broadcasts</h3>
            <button
              onClick={() => setBroadcastModal({
                mode: 'create',
                data: { title: '', body: '', pinned: false, author: user?.name || 'Lead Desk Admin' }
              })}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow transition-all cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              New Announcement
            </button>
          </div>

          <div className="grid gap-3">
            {broadcasts.map((b) => (
              <div key={b.id} className="p-4 rounded-xl border border-border/80 bg-card flex justify-between items-start gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    {b.pinned && (
                      <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-mono font-bold">
                        PINNED
                      </span>
                    )}
                    <h4 className="font-bold text-white text-sm">{b.title}</h4>
                  </div>
                  <p className="text-xs text-slate-300 font-mono leading-relaxed">{b.body}</p>
                  <div className="text-[10px] text-slate-500 font-mono pt-1">
                    By {b.author} · {new Date(b.created).toLocaleString()}
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => setBroadcastModal({ mode: 'edit', data: { ...b } })}
                    className="p-1.5 rounded bg-slate-800 text-slate-300 hover:bg-slate-700"
                    title="Edit"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteBroadcast(b.id)}
                    className="p-1.5 rounded bg-rose-500/10 text-rose-400 hover:bg-rose-500/20"
                    title="Delete"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
            {broadcasts.length === 0 && (
              <div className="p-8 text-center text-slate-500 rounded-xl border border-border/50">
                No announcements currently published.
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUBTAB 4: BOTS STORE CRUD */}
      {activeSubTab === 'bots' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">Expert Advisors Store Management</h3>
            <button
              onClick={() => setBotModal({
                mode: 'create',
                data: {
                  name: '',
                  platform: 'MT4/MT5',
                  price: 99,
                  version: 'v2.1',
                  recommended_deposit: '$500+',
                  win_rate: '82%',
                  description: ''
                }
              })}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow transition-all cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              Add Trading Bot
            </button>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {bots.map((bot) => (
              <div key={bot.id} className="p-5 rounded-2xl border border-border/80 bg-card flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                      {bot.platform}
                    </span>
                    <span className="font-mono text-base font-bold text-emerald-400">
                      ${bot.price}
                    </span>
                  </div>
                  <h4 className="font-bold text-white text-base">{bot.name} <span className="text-xs text-slate-400 font-mono">({bot.version})</span></h4>
                  <p className="text-xs text-slate-400 leading-relaxed font-mono">{bot.description}</p>
                </div>

                <div className="pt-3 border-t border-border/50 flex items-center justify-between">
                  <div className="text-[10px] font-mono text-slate-500">
                    WR: <span className="text-slate-300 font-bold">{bot.win_rate}</span> · Min: <span className="text-slate-300 font-bold">{bot.recommended_deposit}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setBotModal({ mode: 'edit', data: { ...bot } })}
                      className="p-1 rounded bg-slate-800 text-slate-300 hover:bg-slate-700"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteBot(bot.id)}
                      className="p-1 rounded bg-rose-500/10 text-rose-400 hover:bg-rose-500/20"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUBTAB 5: USERS MANAGEMENT */}
      {activeSubTab === 'users' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
              Registered Accounts ({allUsers.length})
            </h3>
          </div>

          <div className="rounded-2xl border border-border/80 bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-[#05080f] text-slate-400 border-b border-border/60">
                  <tr>
                    <th className="p-3">Email</th>
                    <th className="p-3">Trader Name</th>
                    <th className="p-3">Role</th>
                    <th className="p-3">Membership Plan</th>
                    <th className="p-3">Expiry Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {allUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="p-3 font-semibold text-white">{u.email}</td>
                      <td className="p-3 text-slate-300">{u.name || 'Anonymous'}</td>
                      <td className="p-3">
                        <button
                          onClick={() => handleToggleUserRole(u)}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase transition-colors cursor-pointer ${
                            u.role === 'admin'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-slate-800 text-slate-400 border border-slate-700'
                          }`}
                          title="Click to toggle user/admin"
                        >
                          {u.role || 'user'}
                        </button>
                      </td>
                      <td className="p-3">
                        <select
                          value={u.plan || 'NONE'}
                          onChange={(e) => handleUpdateUserPlan(u.id, e.target.value)}
                          className="bg-background border border-border rounded px-2 py-1 text-xs text-white"
                        >
                          <option value="NONE">NONE (Free)</option>
                          <option value="SR_SIGNAL_BOX">SR_SIGNAL_BOX ($10/mo)</option>
                          <option value="PERFECT_SIGNAL_BOX">PERFECT_SIGNAL_BOX ($20/mo)</option>
                        </select>
                      </td>
                      <td className="p-3 text-slate-400">
                        {u.cycle_expires_at ? new Date(u.cycle_expires_at).toLocaleDateString() : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SIGNAL MODAL */}
      {signalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Zap className="h-4 w-4 text-emerald-400" />
              {signalModal.mode === 'create' ? 'Post Live Signal' : 'Edit Signal'}
            </h3>

            <form onSubmit={handleSaveSignal} className="space-y-3.5 text-xs font-mono">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Symbol</label>
                  <input
                    type="text"
                    required
                    value={signalModal.data.symbol}
                    onChange={(e) => setSignalModal({
                      ...signalModal,
                      data: { ...signalModal.data, symbol: e.target.value.toUpperCase() }
                    })}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Direction</label>
                  <select
                    value={signalModal.data.direction}
                    onChange={(e) => setSignalModal({
                      ...signalModal,
                      data: { ...signalModal.data, direction: e.target.value }
                    })}
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
                    value={signalModal.data.entry}
                    onChange={(e) => setSignalModal({
                      ...signalModal,
                      data: { ...signalModal.data, entry: e.target.value }
                    })}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-rose-400 mb-1">Stop Loss</label>
                  <input
                    type="text"
                    required
                    value={signalModal.data.stop_loss}
                    onChange={(e) => setSignalModal({
                      ...signalModal,
                      data: { ...signalModal.data, stop_loss: e.target.value }
                    })}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-emerald-400 mb-1">Take Profit 1</label>
                  <input
                    type="text"
                    required
                    value={signalModal.data.take_profit_1}
                    onChange={(e) => setSignalModal({
                      ...signalModal,
                      data: { ...signalModal.data, take_profit_1: e.target.value }
                    })}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-emerald-400 mb-1">Take Profit 2</label>
                  <input
                    type="text"
                    value={signalModal.data.take_profit_2 || ''}
                    onChange={(e) => setSignalModal({
                      ...signalModal,
                      data: { ...signalModal.data, take_profit_2: e.target.value }
                    })}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Plan Tier</label>
                  <select
                    value={signalModal.data.plan_tier}
                    onChange={(e) => setSignalModal({
                      ...signalModal,
                      data: { ...signalModal.data, plan_tier: e.target.value }
                    })}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-white"
                  >
                    <option value="SR_SIGNAL_BOX">SR_SIGNAL_BOX ($10)</option>
                    <option value="PERFECT_SIGNAL_BOX">PERFECT_SIGNAL_BOX ($20)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Status</label>
                  <select
                    value={signalModal.data.status}
                    onChange={(e) => setSignalModal({
                      ...signalModal,
                      data: { ...signalModal.data, status: e.target.value }
                    })}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-white"
                  >
                    <option value="active">Active</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Analysis / Notes</label>
                <textarea
                  rows={2}
                  value={signalModal.data.notes || ''}
                  onChange={(e) => setSignalModal({
                    ...signalModal,
                    data: { ...signalModal.data, notes: e.target.value }
                  })}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-white text-xs"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition-colors cursor-pointer"
                >
                  Save & Broadcast
                </button>
                <button
                  type="button"
                  onClick={() => setSignalModal(null)}
                  className="px-4 py-2.5 rounded-lg border border-border bg-slate-800 text-slate-300"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BROADCAST MODAL */}
      {broadcastModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Bell className="h-4 w-4 text-amber-400" />
              {broadcastModal.mode === 'create' ? 'New Announcement' : 'Edit Announcement'}
            </h3>

            <form onSubmit={handleSaveBroadcast} className="space-y-3.5 text-xs font-mono">
              <div>
                <label className="block text-slate-400 mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={broadcastModal.data.title}
                  onChange={(e) => setBroadcastModal({
                    ...broadcastModal,
                    data: { ...broadcastModal.data, title: e.target.value }
                  })}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-white"
                  placeholder="e.g. London Session Market Briefing"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Announcement Body</label>
                <textarea
                  rows={4}
                  required
                  value={broadcastModal.data.body}
                  onChange={(e) => setBroadcastModal({
                    ...broadcastModal,
                    data: { ...broadcastModal.data, body: e.target.value }
                  })}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-white"
                  placeholder="Market parameters and key directives..."
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="pinnedToggle"
                  checked={broadcastModal.data.pinned || false}
                  onChange={(e) => setBroadcastModal({
                    ...broadcastModal,
                    data: { ...broadcastModal.data, pinned: e.target.checked }
                  })}
                  className="rounded border-border"
                />
                <label htmlFor="pinnedToggle" className="text-slate-300 cursor-pointer">
                  Pin to top of feed
                </label>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition-colors cursor-pointer"
                >
                  Publish Announcement
                </button>
                <button
                  type="button"
                  onClick={() => setBroadcastModal(null)}
                  className="px-4 py-2.5 rounded-lg border border-border bg-slate-800 text-slate-300"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BOT MODAL */}
      {botModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Cpu className="h-4 w-4 text-blue-400" />
              {botModal.mode === 'create' ? 'Add Trading Bot' : 'Edit Trading Bot'}
            </h3>

            <form onSubmit={handleSaveBot} className="space-y-3.5 text-xs font-mono">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Bot Name</label>
                  <input
                    type="text"
                    required
                    value={botModal.data.name}
                    onChange={(e) => setBotModal({
                      ...botModal,
                      data: { ...botModal.data, name: e.target.value }
                    })}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-white"
                    placeholder="TrendMaster EA"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Platform</label>
                  <select
                    value={botModal.data.platform}
                    onChange={(e) => setBotModal({
                      ...botModal,
                      data: { ...botModal.data, platform: e.target.value }
                    })}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-white"
                  >
                    <option value="MT4">MT4</option>
                    <option value="MT5">MT5</option>
                    <option value="MT4/MT5">MT4/MT5</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1">Price ($)</label>
                  <input
                    type="number"
                    required
                    value={botModal.data.price}
                    onChange={(e) => setBotModal({
                      ...botModal,
                      data: { ...botModal.data, price: Number(e.target.value) }
                    })}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Win Rate</label>
                  <input
                    type="text"
                    value={botModal.data.win_rate || ''}
                    onChange={(e) => setBotModal({
                      ...botModal,
                      data: { ...botModal.data, win_rate: e.target.value }
                    })}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-white"
                    placeholder="84%"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Min Deposit</label>
                  <input
                    type="text"
                    value={botModal.data.recommended_deposit || ''}
                    onChange={(e) => setBotModal({
                      ...botModal,
                      data: { ...botModal.data, recommended_deposit: e.target.value }
                    })}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-white"
                    placeholder="$500+"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Description</label>
                <textarea
                  rows={3}
                  required
                  value={botModal.data.description}
                  onChange={(e) => setBotModal({
                    ...botModal,
                    data: { ...botModal.data, description: e.target.value }
                  })}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-white"
                  placeholder="Algorithmic strategy, risk profile, and recommended timeframes..."
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition-colors cursor-pointer"
                >
                  Save Bot
                </button>
                <button
                  type="button"
                  onClick={() => setBotModal(null)}
                  className="px-4 py-2.5 rounded-lg border border-border bg-slate-800 text-slate-300"
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
