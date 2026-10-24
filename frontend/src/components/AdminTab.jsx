import React, { useState, useEffect } from 'react';
import { pb } from '../lib/pocketbase';
import { 
  Shield, Zap, CheckCircle2, XCircle, Trash2, Edit3, Plus, 
  Bell, Pin, Cpu, DollarSign, Users, RefreshCw, AlertCircle,
  ExternalLink, Search, Filter, TrendingUp, TrendingDown,
  Calendar, KeyRound, Check, X, ArrowUpRight, Network, Layers
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './ui/Card';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';

export function AdminTab({ user, notify }) {
  const [activeSubTab, setActiveSubTab] = useState('payments');
  const [signals, setSignals] = useState([]);
  const [payments, setPayments] = useState([]);
  const [broadcasts, setBroadcasts] = useState([]);
  const [bots, setBots] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [connectors, setConnectors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('all'); // all, pending, confirmed, rejected
  const [signalFilter, setSignalFilter] = useState('all'); // all, active, closed

  // Modals state
  const [signalModal, setSignalModal] = useState(null); // null or { mode: 'create' | 'edit', data: ... }
  const [broadcastModal, setBroadcastModal] = useState(null);
  const [botModal, setBotModal] = useState(null);
  const [userModal, setUserModal] = useState(null); // edit user plan/expiry

  // Load all admin data
  const loadData = async () => {
    setLoading(true);
    try {
      const [sRes, pRes, bRes, botRes, uRes, cRes] = await Promise.all([
        pb.collection('signals').getFullList({ sort: '-created' }),
        pb.collection('payments').getFullList({ sort: '-created' }),
        pb.collection('broadcasts').getFullList({ sort: '-pinned,-created' }),
        pb.collection('bots').getFullList({ sort: '-created' }),
        pb.collection('users').getFullList({ sort: '-created' }),
        pb.collection('connector_requests').getFullList({ sort: '-created' }).catch(() => []),
      ]);
      setSignals(sRes);
      setPayments(pRes);
      setBroadcasts(bRes);
      setBots(botRes);
      setAllUsers(uRes);
      setConnectors(cRes);
    } catch (err) {
      console.error('Error fetching admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // Subscribe to realtime updates
    const unsubSignals = pb.collection('signals').subscribe('*', () => loadData()).catch(() => {});
    const unsubPayments = pb.collection('payments').subscribe('*', () => loadData()).catch(() => {});
    const unsubBroadcasts = pb.collection('broadcasts').subscribe('*', () => loadData()).catch(() => {});
    const unsubBots = pb.collection('bots').subscribe('*', () => loadData()).catch(() => {});
    const unsubUsers = pb.collection('users').subscribe('*', () => loadData()).catch(() => {});

    return () => {
      unsubSignals?.then?.(u => u && u());
      unsubPayments?.then?.(u => u && u());
      unsubBroadcasts?.then?.(u => u && u());
      unsubBots?.then?.(u => u && u());
      unsubUsers?.then?.(u => u && u());
    };
  }, []);

  const toast = (title, message, type = 'success') => {
    if (notify) {
      notify({ type, title, message });
    }
  };

  // --- STATS CALCULATIONS ---
  const pendingPayments = payments.filter(p => p.status === 'pending');
  const confirmedPayments = payments.filter(p => p.status === 'confirmed');
  const totalRevenue = confirmedPayments.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
  const activeSignalsCount = signals.filter(s => s.status === 'active').length;
  const activeSubscribersCount = allUsers.filter(u => u.plan && u.plan !== 'NONE').length;

  // --- PAYMENTS WORKFLOW (Most critical for Admin) ---
  const handleApprovePayment = async (p) => {
    try {
      // 1. Mark payment as confirmed
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
        toast('Payment Approved', `Granted 30-day ${p.plan} access to ${p.user_email}`);
      } else {
        toast('Payment Approved', `Confirmed ${p.user_email} payment (User record not found)`);
      }
      loadData();
    } catch (err) {
      toast('Approval Error', err.message || 'Failed to approve payment', 'error');
    }
  };

  const handleRejectPayment = async (p) => {
    if (!window.confirm(`Reject payment of $${p.amount} USDT from ${p.user_email}?`)) return;
    try {
      await pb.collection('payments').update(p.id, { status: 'rejected' });
      toast('Payment Rejected', `Marked payment from ${p.user_email} as rejected`, 'info');
      loadData();
    } catch (err) {
      toast('Reject Error', err.message, 'error');
    }
  };

  const handleDeletePayment = async (id) => {
    if (!window.confirm('Delete this payment record permanently?')) return;
    try {
      await pb.collection('payments').delete(id);
      toast('Payment Deleted', 'Record removed from ledger', 'info');
      loadData();
    } catch (err) {
      toast('Error', err.message, 'error');
    }
  };

  // --- SIGNALS WORKFLOW ---
  const handleSaveSignal = async (e) => {
    e.preventDefault();
    const data = signalModal.data;
    try {
      if (signalModal.mode === 'create') {
        await pb.collection('signals').create(data);
        toast('Signal Broadcasted', `${data.symbol} ${data.direction} posted to live feed`);
      } else {
        await pb.collection('signals').update(data.id, data);
        toast('Signal Updated', `${data.symbol} parameters updated`);
      }
      setSignalModal(null);
      loadData();
    } catch (err) {
      toast('Signal Error', err.message, 'error');
    }
  };

  const handleDeleteSignal = async (id) => {
    if (!window.confirm('Delete this trade signal permanently?')) return;
    try {
      await pb.collection('signals').delete(id);
      toast('Signal Deleted', 'Signal removed from database', 'info');
      loadData();
    } catch (err) {
      toast('Error', err.message, 'error');
    }
  };

  const handleCloseSignal = async (s) => {
    const outcome = window.prompt(
      `Enter trade outcome for ${s.symbol} (e.g. "+85 pips", "Hit TP1", "-25 pips"):`, 
      '+65 pips'
    );
    if (outcome === null) return;
    try {
      await pb.collection('signals').update(s.id, { 
        status: 'closed', 
        pnl: outcome || '+0 pips' 
      });
      toast('Trade Closed', `${s.symbol} marked closed with outcome: ${outcome}`);
      loadData();
    } catch (err) {
      toast('Error', err.message, 'error');
    }
  };

  const handleReopenSignal = async (s) => {
    try {
      await pb.collection('signals').update(s.id, { status: 'active', pnl: '' });
      toast('Signal Reopened', `${s.symbol} is active again in live feed`);
      loadData();
    } catch (err) {
      toast('Error', err.message, 'error');
    }
  };

  // --- BROADCASTS WORKFLOW ---
  const handleSaveBroadcast = async (e) => {
    e.preventDefault();
    const data = broadcastModal.data;
    try {
      if (broadcastModal.mode === 'create') {
        await pb.collection('broadcasts').create({
          ...data,
          author: data.author || user?.name || 'Desk Admin'
        });
        toast('Broadcast Sent', 'Announcement published to trader feeds');
      } else {
        await pb.collection('broadcasts').update(data.id, data);
        toast('Broadcast Updated', 'Announcement updated');
      }
      setBroadcastModal(null);
      loadData();
    } catch (err) {
      toast('Broadcast Error', err.message, 'error');
    }
  };

  const handleTogglePinBroadcast = async (b) => {
    try {
      await pb.collection('broadcasts').update(b.id, { pinned: !b.pinned });
      toast('Pinned Status', `Announcement ${!b.pinned ? 'pinned to top' : 'unpinned'}`);
      loadData();
    } catch (err) {
      toast('Error', err.message, 'error');
    }
  };

  const handleDeleteBroadcast = async (id) => {
    if (!window.confirm('Delete this announcement?')) return;
    try {
      await pb.collection('broadcasts').delete(id);
      toast('Broadcast Deleted', 'Announcement removed', 'info');
      loadData();
    } catch (err) {
      toast('Error', err.message, 'error');
    }
  };

  // --- BOTS WORKFLOW ---
  const handleSaveBot = async (e) => {
    e.preventDefault();
    const data = botModal.data;
    try {
      if (botModal.mode === 'create') {
        await pb.collection('bots').create(data);
        toast('Bot Added', `${data.name} added to catalog`);
      } else {
        await pb.collection('bots').update(data.id, data);
        toast('Bot Updated', `${data.name} parameters updated`);
      }
      setBotModal(null);
      loadData();
    } catch (err) {
      toast('Bot Error', err.message, 'error');
    }
  };

  const handleDeleteBot = async (id) => {
    if (!window.confirm('Delete this bot from the store catalog?')) return;
    try {
      await pb.collection('bots').delete(id);
      toast('Bot Removed', 'Bot deleted from catalog', 'info');
      loadData();
    } catch (err) {
      toast('Error', err.message, 'error');
    }
  };

  // --- USERS WORKFLOW ---
  const handleSaveUser = async (e) => {
    e.preventDefault();
    const data = userModal.data;
    try {
      await pb.collection('users').update(data.id, {
        plan: data.plan,
        role: data.role,
        cycle_expires_at: data.cycle_expires_at || ''
      });
      toast('User Updated', `Updated access for ${data.email}`);
      setUserModal(null);
      loadData();
    } catch (err) {
      toast('User Error', err.message, 'error');
    }
  };

  const handleGrantDays = async (u, days) => {
    try {
      const currentExpiry = u.cycle_expires_at ? new Date(u.cycle_expires_at) : new Date();
      const baseDate = currentExpiry > new Date() ? currentExpiry : new Date();
      baseDate.setDate(baseDate.getDate() + days);

      await pb.collection('users').update(u.id, {
        cycle_expires_at: baseDate.toISOString(),
        plan: u.plan === 'NONE' || !u.plan ? 'PERFECT_SIGNAL_BOX' : u.plan
      });
      toast('Access Extended', `Added ${days} days access to ${u.email}`);
      loadData();
    } catch (err) {
      toast('Error', err.message, 'error');
    }
  };

  // --- CONNECTOR WORKFLOW ---
  const handleUpdateConnectorStatus = async (c, status) => {
    try {
      await pb.collection('connector_requests').update(c.id, { status });
      toast('Connector Updated', `Status set to ${status}`);
      loadData();
    } catch (err) {
      toast('Error', err.message, 'error');
    }
  };

  const getExplorerUrl = (network, txid) => {
    if (!txid) return '#';
    const clean = txid.trim();
    if (network?.includes('TRC20')) {
      return `https://tronscan.org/#/transaction/${clean}`;
    }
    if (network?.includes('BEP20')) {
      return `https://bscscan.com/tx/${clean}`;
    }
    return `https://etherscan.io/tx/${clean}`;
  };

  // Helper to format cycle expiration
  const formatExpiry = (dateStr) => {
    if (!dateStr) return { text: 'No active cycle', active: false };
    const expiry = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
    if (diffDays <= 0) return { text: 'Expired', active: false };
    return { text: `${diffDays} days left`, active: true };
  };

  // Filtered payments
  const filteredPayments = payments.filter((p) => {
    if (paymentFilter !== 'all' && p.status !== paymentFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        p.user_email?.toLowerCase().includes(q) ||
        p.txid?.toLowerCase().includes(q) ||
        p.network?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Filtered signals
  const filteredSignals = signals.filter((s) => {
    if (signalFilter !== 'all' && s.status !== signalFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        s.symbol?.toLowerCase().includes(q) ||
        s.notes?.toLowerCase().includes(q) ||
        s.direction?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Filtered users
  const filteredUsers = allUsers.filter((u) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        u.email?.toLowerCase().includes(q) ||
        u.name?.toLowerCase().includes(q) ||
        u.role?.toLowerCase().includes(q) ||
        u.plan?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6 font-sans text-slate-800 pb-16">
      {/* 1. TOP HEADER & KPI SUMMARY */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl border border-slate-200 bg-slate-50">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="default" className="text-[11px] gap-1.5 py-0.5">
              <Shield className="h-3 w-3" />
              <span>Admin Operations Center</span>
            </Badge>
            <span className="text-xs text-slate-500 font-medium hidden sm:inline">• Realtime Go/SQLite Ledger</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
            Institutional Desk Administration
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Approve crypto deposits, post real-time signals, manage trading bots and member access.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={loadData}
          disabled={loading}
          className="self-start sm:self-auto gap-2 bg-white"
        >
          <RefreshCw className={`h-3.5 w-3.5 text-slate-600 ${loading ? 'animate-spin' : ''}`} />
          <span>Sync Data</span>
        </Button>
      </div>

      {/* 2. KPI METRICS STRIP (Responsive 2-col on mobile, 4-col on desktop) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="p-4 sm:p-5 flex items-center justify-between">
          <div>
            <div className="text-[11px] text-slate-500 font-medium">Pending Approvals</div>
            <div className="text-2xl font-black text-slate-900 mt-1 tabular-nums flex items-center gap-2">
              {pendingPayments.length}
              {pendingPayments.length > 0 && (
                <span className="h-2.5 w-2.5 rounded-full bg-amber-500 animate-ping" />
              )}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">Awaiting verification</div>
          </div>
          <div className="h-10 w-10 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center">
            <DollarSign className="h-5 w-5" />
          </div>
        </Card>

        <Card className="p-4 sm:p-5 flex items-center justify-between">
          <div>
            <div className="text-[11px] text-slate-500 font-medium">Confirmed Revenue</div>
            <div className="text-2xl font-black text-emerald-600 mt-1 tabular-nums">
              ${totalRevenue}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">{confirmedPayments.length} paid cycles</div>
          </div>
          <div className="h-10 w-10 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center">
            <TrendingUp className="h-5 w-5" />
          </div>
        </Card>

        <Card className="p-4 sm:p-5 flex items-center justify-between">
          <div>
            <div className="text-[11px] text-slate-500 font-medium">Active Signals</div>
            <div className="text-2xl font-black text-slate-900 mt-1 tabular-nums">
              {activeSignalsCount}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">{signals.length} total history</div>
          </div>
          <div className="h-10 w-10 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center">
            <Zap className="h-5 w-5" />
          </div>
        </Card>

        <Card className="p-4 sm:p-5 flex items-center justify-between">
          <div>
            <div className="text-[11px] text-slate-500 font-medium">Total Registered Users</div>
            <div className="text-2xl font-black text-slate-900 mt-1 tabular-nums">
              {allUsers.length}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">{activeSubscribersCount} active subscribers</div>
          </div>
          <div className="h-10 w-10 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center">
            <Users className="h-5 w-5" />
          </div>
        </Card>
      </div>

      {/* 3. MOBILE-OPTIMIZED SUBTABS NAVIGATION */}
      <div className="border-b border-slate-200 -mx-4 px-4 sm:mx-0 sm:px-0">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-2">
          {[
            { id: 'payments', label: 'Payments Queue', icon: DollarSign, badge: pendingPayments.length },
            { id: 'signals', label: 'Signals Desk', icon: Zap, count: signals.length },
            { id: 'broadcasts', label: 'Announcements', icon: Bell, count: broadcasts.length },
            { id: 'bots', label: 'Trading Bots', icon: Cpu, count: bots.length },
            { id: 'users', label: 'Users & Subscriptions', icon: Users, count: allUsers.length },
            { id: 'connectors', label: 'Connector Demose', icon: Network, count: connectors.length },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveSubTab(tab.id);
                  setSearchQuery('');
                }}
                className={`flex items-center gap-2 px-3.5 py-2.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{tab.label}</span>
                {tab.badge !== undefined && tab.badge > 0 ? (
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                    isActive ? 'bg-white text-emerald-800' : 'bg-amber-500 text-white'
                  }`}>
                    {tab.badge}
                  </span>
                ) : tab.count !== undefined ? (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded ${
                    isActive ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {tab.count}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. SUBTAB CONTENT PANELS */}

      {/* ===================== TAB 1: PAYMENTS QUEUE ===================== */}
      {activeSubTab === 'payments' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              {[
                { id: 'all', label: `All (${payments.length})` },
                { id: 'pending', label: `Pending (${pendingPayments.length})` },
                { id: 'confirmed', label: `Confirmed (${confirmedPayments.length})` },
                { id: 'rejected', label: `Rejected (${payments.filter(p => p.status === 'rejected').length})` },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setPaymentFilter(f.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                    paymentFilter === f.id
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search user, TXID, network..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-300 text-xs bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-600"
              />
            </div>
          </div>

          {filteredPayments.length === 0 ? (
            <Card className="p-8 text-center text-slate-500 text-xs">
              No payments found matching criteria.
            </Card>
          ) : (
            <div className="space-y-3">
              {/* Responsive Cards for Mobile & Clean Table for Desktop */}
              <div className="hidden md:block">
                <Card className="overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
                        <tr>
                          <th className="p-3.5">Trader Email</th>
                          <th className="p-3.5">Plan Selected</th>
                          <th className="p-3.5">Amount</th>
                          <th className="p-3.5">Network</th>
                          <th className="p-3.5">Transaction Hash (TXID)</th>
                          <th className="p-3.5">Status</th>
                          <th className="p-3.5 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredPayments.map((p) => {
                          const isPending = p.status === 'pending';
                          const isConfirmed = p.status === 'confirmed';

                          return (
                            <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                              <td className="p-3.5 font-semibold text-slate-900">
                                {p.user_email}
                              </td>
                              <td className="p-3.5">
                                <Badge variant="secondary">
                                  {p.plan === 'PERFECT_SIGNAL_BOX' ? 'Perfect Signal ($20)' : 'SR Box ($10)'}
                                </Badge>
                              </td>
                              <td className="p-3.5 font-bold text-slate-900 tabular-nums">
                                ${p.amount} USDT
                              </td>
                              <td className="p-3.5 text-slate-600 font-medium">
                                {p.network}
                              </td>
                              <td className="p-3.5 font-mono text-[11px] text-slate-500">
                                <div className="flex items-center gap-1.5 max-w-[200px] truncate">
                                  <span className="truncate" title={p.txid}>{p.txid || 'No hash provided'}</span>
                                  {p.txid && (
                                    <a
                                      href={getExplorerUrl(p.network, p.txid)}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="text-emerald-700 hover:text-emerald-800 p-0.5 shrink-0"
                                      title="Verify on Blockchain Explorer"
                                    >
                                      <ExternalLink className="h-3 w-3" />
                                    </a>
                                  )}
                                </div>
                              </td>
                              <td className="p-3.5">
                                <Badge
                                  variant={
                                    isConfirmed ? 'default' : isPending ? 'secondary' : 'outline'
                                  }
                                  className={
                                    isPending ? 'bg-amber-100 text-amber-800 border-amber-200' : ''
                                  }
                                >
                                  {p.status.toUpperCase()}
                                </Badge>
                              </td>
                              <td className="p-3.5 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  {isPending && (
                                    <>
                                      <Button
                                        size="sm"
                                        onClick={() => handleApprovePayment(p)}
                                        className="h-7 text-xs px-2.5 gap-1 bg-emerald-600 hover:bg-emerald-700"
                                      >
                                        <Check className="h-3 w-3" />
                                        <span>Approve</span>
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleRejectPayment(p)}
                                        className="h-7 text-xs px-2 text-rose-600 border-rose-200 hover:bg-rose-50"
                                      >
                                        <X className="h-3 w-3" />
                                        <span>Reject</span>
                                      </Button>
                                    </>
                                  )}
                                  <button
                                    onClick={() => handleDeletePayment(p.id)}
                                    className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                                    title="Delete record"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </div>

              {/* Mobile Card View (Optimized for small touch screens) */}
              <div className="grid gap-3 md:hidden">
                {filteredPayments.map((p) => {
                  const isPending = p.status === 'pending';
                  const isConfirmed = p.status === 'confirmed';

                  return (
                    <Card key={p.id} className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 text-sm truncate max-w-[200px]">
                          {p.user_email}
                        </span>
                        <Badge
                          variant={isConfirmed ? 'default' : isPending ? 'secondary' : 'outline'}
                          className={isPending ? 'bg-amber-100 text-amber-800 border-amber-200' : ''}
                        >
                          {p.status.toUpperCase()}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                        <div>
                          <div className="text-[10px] text-slate-400">Plan & Amount</div>
                          <div className="font-bold text-slate-900 mt-0.5">
                            ${p.amount} USDT · <span className="font-normal text-slate-600">{p.plan === 'PERFECT_SIGNAL_BOX' ? 'Perfect' : 'SR Box'}</span>
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] text-slate-400">Network</div>
                          <div className="font-medium text-slate-700 mt-0.5">{p.network}</div>
                        </div>
                      </div>

                      <div className="text-xs">
                        <div className="text-[10px] text-slate-400 mb-0.5">Transaction Hash (TXID)</div>
                        <div className="font-mono text-[11px] text-slate-600 break-all bg-white p-2 rounded border border-slate-200 flex items-center justify-between gap-2">
                          <span className="truncate">{p.txid || 'No hash submitted'}</span>
                          {p.txid && (
                            <a
                              href={getExplorerUrl(p.network, p.txid)}
                              target="_blank"
                              rel="noreferrer"
                              className="text-emerald-700 shrink-0 font-sans font-semibold text-[10px] flex items-center gap-0.5"
                            >
                              Explorer <ArrowUpRight className="h-3 w-3" />
                            </a>
                          )}
                        </div>
                      </div>

                      {isPending && (
                        <div className="grid grid-cols-2 gap-2 pt-1">
                          <Button
                            size="sm"
                            onClick={() => handleApprovePayment(p)}
                            className="w-full justify-center gap-1.5"
                          >
                            <Check className="h-3.5 w-3.5" />
                            <span>Approve (+30D)</span>
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRejectPayment(p)}
                            className="w-full justify-center gap-1.5 text-rose-600 border-rose-200 hover:bg-rose-50"
                          >
                            <X className="h-3.5 w-3.5" />
                            <span>Reject</span>
                          </Button>
                        </div>
                      )}
                    </Card>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===================== TAB 2: SIGNALS DESK ===================== */}
      {activeSubTab === 'signals' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Button
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
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                <span>Post New Trade Signal</span>
              </Button>

              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
                {['all', 'active', 'closed'].map((st) => (
                  <button
                    key={st}
                    onClick={() => setSignalFilter(st)}
                    className={`px-2.5 py-1 rounded text-xs font-semibold capitalize cursor-pointer ${
                      signalFilter === st ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search symbol, notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-300 text-xs bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-600"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredSignals.map((s) => {
              const isBuy = s.direction === 'BUY';
              const isActive = s.status === 'active';

              return (
                <Card key={s.id} className="p-4 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-base text-slate-900">{s.symbol}</span>
                        <Badge
                          className={isBuy ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-rose-100 text-rose-800 border-rose-300'}
                        >
                          {s.direction}
                        </Badge>
                      </div>

                      <Badge variant={isActive ? 'default' : 'secondary'}>
                        {s.status.toUpperCase()}
                      </Badge>
                    </div>

                    <div className="text-xs text-slate-500 mt-1">
                      {s.plan_tier === 'PERFECT_SIGNAL_BOX' ? '⚡ Perfect Signal Box' : 'SR Signal Box'}
                    </div>

                    {/* Coordinates Grid */}
                    <div className="grid grid-cols-2 gap-2 mt-3 text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                      <div>
                        <div className="text-[10px] text-slate-400 uppercase font-semibold">Entry Zone</div>
                        <div className="font-bold text-slate-900 mt-0.5 tabular-nums">{s.entry}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-rose-600 uppercase font-semibold">Stop Loss</div>
                        <div className="font-bold text-rose-700 mt-0.5 tabular-nums">{s.stop_loss}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-emerald-600 uppercase font-semibold">Take Profit 1</div>
                        <div className="font-bold text-emerald-700 mt-0.5 tabular-nums">{s.take_profit_1}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-emerald-600 uppercase font-semibold">Take Profit 2</div>
                        <div className="font-bold text-emerald-700 mt-0.5 tabular-nums">{s.take_profit_2 || '—'}</div>
                      </div>
                    </div>

                    {s.pnl && (
                      <div className="mt-2 p-2 rounded bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800 flex items-center justify-between">
                        <span>Outcome Result:</span>
                        <span className="tabular-nums">{s.pnl}</span>
                      </div>
                    )}

                    {s.notes && (
                      <p className="text-xs text-slate-600 mt-2 leading-relaxed bg-white p-2 rounded border border-slate-200">
                        {s.notes}
                      </p>
                    )}
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      {isActive ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCloseSignal(s)}
                          className="h-8 text-xs font-semibold text-emerald-700 border-emerald-300 hover:bg-emerald-50"
                        >
                          Close / Result
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleReopenSignal(s)}
                          className="h-8 text-xs text-slate-600"
                        >
                          Reopen
                        </Button>
                      )}

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setSignalModal({ mode: 'edit', data: s })}
                        className="h-8 text-xs p-2 text-slate-600 hover:text-slate-900"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                      </Button>
                    </div>

                    <button
                      onClick={() => handleDeleteSignal(s.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                      title="Delete signal"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* ===================== TAB 3: ANNOUNCEMENTS ===================== */}
      {activeSubTab === 'broadcasts' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Broadcasts & Directives</h3>
              <p className="text-xs text-slate-500">Global market announcements pinned to member dashboards.</p>
            </div>
            <Button
              onClick={() => setBroadcastModal({
                mode: 'create',
                data: { title: '', body: '', pinned: false, author: user?.name || 'Desk Admin' }
              })}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              <span>New Announcement</span>
            </Button>
          </div>

          <div className="space-y-3">
            {broadcasts.map((b) => (
              <Card key={b.id} className="p-5 space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-base font-bold text-slate-900">{b.title}</h4>
                      {b.pinned && (
                        <Badge variant="default" className="gap-1 text-[10px]">
                          <Pin className="h-3 w-3" />
                          <span>Pinned</span>
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">Author: {b.author || 'Desk Admin'}</div>
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleTogglePinBroadcast(b)}
                      className={`h-8 text-xs ${b.pinned ? 'text-amber-600' : 'text-slate-400'}`}
                      title={b.pinned ? 'Unpin' : 'Pin to top'}
                    >
                      <Pin className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setBroadcastModal({ mode: 'edit', data: b })}
                      className="h-8 text-xs text-slate-600"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                    </Button>
                    <button
                      onClick={() => handleDeleteBroadcast(b.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100 whitespace-pre-line">
                  {b.body}
                </p>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ===================== TAB 4: TRADING BOTS CATALOG ===================== */}
      {activeSubTab === 'bots' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Trading Bots & EAs</h3>
              <p className="text-xs text-slate-500">Manage Expert Advisors, pricing, and download binary catalog.</p>
            </div>
            <Button
              onClick={() => setBotModal({
                mode: 'create',
                data: {
                  name: '',
                  platform: 'MT4',
                  price: 299,
                  version: 'v1.0',
                  recommended_deposit: '$500+',
                  win_rate: '80%',
                  description: ''
                }
              })}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              <span>Add New Bot</span>
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {bots.map((bot) => (
              <Card key={bot.id} className="p-5 flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary">{bot.platform}</Badge>
                    <span className="text-xs text-slate-500 font-medium">Ver {bot.version}</span>
                  </div>

                  <h4 className="text-lg font-bold text-slate-900 mt-2">{bot.name}</h4>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    {bot.description || 'Automated trading algorithm.'}
                  </p>

                  <div className="grid grid-cols-2 gap-2 mt-3 text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <div>
                      <div className="text-[10px] text-slate-400">Min Capital</div>
                      <div className="font-bold text-slate-900 mt-0.5">{bot.recommended_deposit}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400">Win Rate</div>
                      <div className="font-bold text-emerald-600 mt-0.5">{bot.win_rate}</div>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div className="text-lg font-black text-slate-900 tabular-nums">
                    ${bot.price} <span className="text-xs font-normal text-slate-500">USDT</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setBotModal({ mode: 'edit', data: bot })}
                      className="h-8 text-xs gap-1"
                    >
                      <Edit3 className="h-3 w-3" />
                      <span>Edit</span>
                    </Button>
                    <button
                      onClick={() => handleDeleteBot(bot.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ===================== TAB 5: USERS & MEMBERSHIPS ===================== */}
      {activeSubTab === 'users' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Registered Traders & Members</h3>
              <p className="text-xs text-slate-500">Search users, grant manual cycles, and assign roles.</p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search name, email, plan..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-300 text-xs bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-600"
              />
            </div>
          </div>

          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
                  <tr>
                    <th className="p-3.5">Trader Details</th>
                    <th className="p-3.5">Role</th>
                    <th className="p-3.5">Current Plan</th>
                    <th className="p-3.5">Cycle Expiration</th>
                    <th className="p-3.5 text-right">Quick Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredUsers.map((u) => {
                    const expiry = formatExpiry(u.cycle_expires_at);

                    return (
                      <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="p-3.5">
                          <div className="font-bold text-slate-900">{u.name || 'Unnamed Trader'}</div>
                          <div className="text-[11px] text-slate-500">{u.email}</div>
                        </td>
                        <td className="p-3.5">
                          <Badge variant={u.role === 'admin' ? 'default' : 'secondary'}>
                            {u.role.toUpperCase()}
                          </Badge>
                        </td>
                        <td className="p-3.5">
                          <span className="font-semibold text-slate-800">
                            {u.plan === 'PERFECT_SIGNAL_BOX' ? '⚡ Perfect Signal' : u.plan === 'SR_SIGNAL_BOX' ? 'SR Signal Box' : 'Free / None'}
                          </span>
                        </td>
                        <td className="p-3.5">
                          <span className={`font-semibold ${expiry.active ? 'text-emerald-700' : 'text-slate-400'}`}>
                            {expiry.text}
                          </span>
                        </td>
                        <td className="p-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleGrantDays(u, 30)}
                              className="h-7 text-xs px-2 text-emerald-700 border-emerald-300 hover:bg-emerald-50"
                              title="Extend subscription by 30 days"
                            >
                              +30 Days
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setUserModal({ data: u })}
                              className="h-7 text-xs px-2 text-slate-600"
                            >
                              Edit Access
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* ===================== TAB 6: CONNECTOR DEMOS ===================== */}
      {activeSubTab === 'connectors' && (
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Connector Demo Inquiries</h3>
            <p className="text-xs text-slate-500">Trader demo execution requests submitted from the Connector tab.</p>
          </div>

          {connectors.length === 0 ? (
            <Card className="p-8 text-center text-slate-500 text-xs">
              No connector demo requests submitted yet.
            </Card>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {connectors.map((c) => (
                <Card key={c.id} className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{c.user_email}</span>
                    <Badge variant={c.status === 'connected' ? 'default' : 'secondary'}>
                      {c.status.toUpperCase()}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <div>
                      <div className="text-[10px] text-slate-400">Platform</div>
                      <div className="font-bold text-slate-900 mt-0.5">{c.platform}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400">Account #</div>
                      <div className="font-mono text-slate-900 mt-0.5">{c.account_number}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400">Server</div>
                      <div className="text-slate-700 mt-0.5 truncate">{c.server}</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleUpdateConnectorStatus(c, 'connected')}
                      className="h-7 text-xs text-emerald-700 border-emerald-300"
                    >
                      Mark Connected
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleUpdateConnectorStatus(c, 'rejected')}
                      className="h-7 text-xs text-rose-600"
                    >
                      Reject
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ===================== MODAL: CREATE / EDIT SIGNAL ===================== */}
      {signalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <Card className="w-full max-w-lg shadow-2xl my-8">
            <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">
                  {signalModal.mode === 'create' ? 'Post New Trade Signal' : 'Edit Trade Signal'}
                </CardTitle>
                <CardDescription>
                  Broadcasts real-time execution coordinates to trader dashboards.
                </CardDescription>
              </div>
              <button 
                onClick={() => setSignalModal(null)} 
                className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </CardHeader>

            <form onSubmit={handleSaveSignal}>
              <CardContent className="space-y-4 pt-4 text-xs">
                {/* Symbol and Direction */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Trading Instrument</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. XAUUSD, EURUSD"
                      value={signalModal.data.symbol}
                      onChange={(e) => setSignalModal({
                        ...signalModal,
                        data: { ...signalModal.data, symbol: e.target.value.toUpperCase() }
                      })}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 font-bold uppercase focus:border-emerald-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Direction</label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {['BUY', 'SELL'].map((dir) => (
                        <button
                          key={dir}
                          type="button"
                          onClick={() => setSignalModal({
                            ...signalModal,
                            data: { ...signalModal.data, direction: dir }
                          })}
                          className={`py-2 rounded-lg font-bold text-xs cursor-pointer border ${
                            signalModal.data.direction === dir
                              ? dir === 'BUY'
                                ? 'bg-emerald-600 text-white border-emerald-600'
                                : 'bg-rose-600 text-white border-rose-600'
                              : 'bg-white text-slate-600 border-slate-300'
                          }`}
                        >
                          {dir}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Entry & Stop Loss */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Entry Price Zone</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 2,748.50"
                      value={signalModal.data.entry}
                      onChange={(e) => setSignalModal({
                        ...signalModal,
                        data: { ...signalModal.data, entry: e.target.value }
                      })}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 font-mono focus:border-emerald-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-rose-700 font-semibold mb-1">Stop Loss (Hard SL)</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 2,735.00"
                      value={signalModal.data.stop_loss}
                      onChange={(e) => setSignalModal({
                        ...signalModal,
                        data: { ...signalModal.data, stop_loss: e.target.value }
                      })}
                      className="w-full rounded-lg border border-rose-300 bg-white px-3 py-2 text-rose-700 font-mono font-bold focus:border-rose-600 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Take Profit 1 & 2 */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-emerald-700 font-semibold mb-1">Take Profit 1</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 2,765.00"
                      value={signalModal.data.take_profit_1}
                      onChange={(e) => setSignalModal({
                        ...signalModal,
                        data: { ...signalModal.data, take_profit_1: e.target.value }
                      })}
                      className="w-full rounded-lg border border-emerald-300 bg-white px-3 py-2 text-emerald-700 font-mono font-bold focus:border-emerald-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-emerald-700 font-semibold mb-1">Take Profit 2 (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. 2,780.00"
                      value={signalModal.data.take_profit_2 || ''}
                      onChange={(e) => setSignalModal({
                        ...signalModal,
                        data: { ...signalModal.data, take_profit_2: e.target.value }
                      })}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 font-mono focus:border-emerald-600 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Plan Tier */}
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Plan Tier Access</label>
                  <select
                    value={signalModal.data.plan_tier}
                    onChange={(e) => setSignalModal({
                      ...signalModal,
                      data: { ...signalModal.data, plan_tier: e.target.value }
                    })}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-emerald-600 focus:outline-none cursor-pointer"
                  >
                    <option value="SR_SIGNAL_BOX">SR Signal Box ($10 Tier)</option>
                    <option value="PERFECT_SIGNAL_BOX">Perfect Signal Box ($20 VIP Tier)</option>
                  </select>
                </div>

                {/* Notes & Strategy Logic */}
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Trade Notes / Strategy Invalidation</label>
                  <textarea
                    rows={3}
                    placeholder="e.g. London liquidity sweep at session discount. Trailing stop into breakeven at TP1."
                    value={signalModal.data.notes || ''}
                    onChange={(e) => setSignalModal({
                      ...signalModal,
                      data: { ...signalModal.data, notes: e.target.value }
                    })}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-emerald-600 focus:outline-none leading-relaxed"
                  />
                </div>
              </CardContent>

              <CardFooter className="border-t border-slate-100 pt-3 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSignalModal(null)}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  {signalModal.mode === 'create' ? 'Broadcast Signal' : 'Save Changes'}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      )}

      {/* ===================== MODAL: ANNOUNCEMENT ===================== */}
      {broadcastModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <Card className="w-full max-w-lg shadow-2xl">
            <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
              <CardTitle className="text-lg">
                {broadcastModal.mode === 'create' ? 'Compose Announcement' : 'Edit Announcement'}
              </CardTitle>
              <button onClick={() => setBroadcastModal(null)} className="text-slate-400 hover:text-slate-700 p-1">
                <X className="h-5 w-5" />
              </button>
            </CardHeader>

            <form onSubmit={handleSaveBroadcast}>
              <CardContent className="space-y-4 pt-4 text-xs">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Announcement Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. US CPI Release Directives & Risk Off Alert"
                    value={broadcastModal.data.title}
                    onChange={(e) => setBroadcastModal({
                      ...broadcastModal,
                      data: { ...broadcastModal.data, title: e.target.value }
                    })}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 font-bold focus:border-emerald-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Message Content</label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Write detailed desk directives..."
                    value={broadcastModal.data.body}
                    onChange={(e) => setBroadcastModal({
                      ...broadcastModal,
                      data: { ...broadcastModal.data, body: e.target.value }
                    })}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-emerald-600 focus:outline-none leading-relaxed"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="pinToggle"
                    checked={broadcastModal.data.pinned}
                    onChange={(e) => setBroadcastModal({
                      ...broadcastModal,
                      data: { ...broadcastModal.data, pinned: e.target.checked }
                    })}
                    className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-600 cursor-pointer"
                  />
                  <label htmlFor="pinToggle" className="text-slate-700 font-semibold cursor-pointer">
                    Pin to top of member dashboards
                  </label>
                </div>
              </CardContent>

              <CardFooter className="border-t border-slate-100 pt-3 flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setBroadcastModal(null)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {broadcastModal.mode === 'create' ? 'Publish Announcement' : 'Save Changes'}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      )}

      {/* ===================== MODAL: BOT ===================== */}
      {botModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <Card className="w-full max-w-lg shadow-2xl">
            <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
              <CardTitle className="text-lg">
                {botModal.mode === 'create' ? 'Add Bot to Catalog' : 'Edit Bot Settings'}
              </CardTitle>
              <button onClick={() => setBotModal(null)} className="text-slate-400 hover:text-slate-700 p-1">
                <X className="h-5 w-5" />
              </button>
            </CardHeader>

            <form onSubmit={handleSaveBot}>
              <CardContent className="space-y-3.5 pt-4 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Bot Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. AKG Gold Trap EA"
                      value={botModal.data.name}
                      onChange={(e) => setBotModal({
                        ...botModal,
                        data: { ...botModal.data, name: e.target.value }
                      })}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 font-bold focus:border-emerald-600 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Platform</label>
                    <select
                      value={botModal.data.platform}
                      onChange={(e) => setBotModal({
                        ...botModal,
                        data: { ...botModal.data, platform: e.target.value }
                      })}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-emerald-600 focus:outline-none"
                    >
                      <option value="MT4">MetaTrader 4 (MT4)</option>
                      <option value="MT5">MetaTrader 5 (MT5)</option>
                      <option value="MT4/MT5">MT4 & MT5 Dual</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Price (USDT)</label>
                    <input
                      type="number"
                      required
                      value={botModal.data.price}
                      onChange={(e) => setBotModal({
                        ...botModal,
                        data: { ...botModal.data, price: Number(e.target.value) }
                      })}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 font-bold focus:border-emerald-600 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Version</label>
                    <input
                      type="text"
                      value={botModal.data.version}
                      onChange={(e) => setBotModal({
                        ...botModal,
                        data: { ...botModal.data, version: e.target.value }
                      })}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-emerald-600 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Min Capital</label>
                    <input
                      type="text"
                      value={botModal.data.recommended_deposit}
                      onChange={(e) => setBotModal({
                        ...botModal,
                        data: { ...botModal.data, recommended_deposit: e.target.value }
                      })}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-emerald-600 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Description</label>
                  <textarea
                    rows={3}
                    value={botModal.data.description}
                    onChange={(e) => setBotModal({
                      ...botModal,
                      data: { ...botModal.data, description: e.target.value }
                    })}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-emerald-600 focus:outline-none"
                  />
                </div>
              </CardContent>

              <CardFooter className="border-t border-slate-100 pt-3 flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setBotModal(null)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {botModal.mode === 'create' ? 'Add Bot to Catalog' : 'Save Changes'}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      )}

      {/* ===================== MODAL: EDIT USER ACCESS ===================== */}
      {userModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <Card className="w-full max-w-md shadow-2xl">
            <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">Edit Member Access</CardTitle>
                <CardDescription>{userModal.data.email}</CardDescription>
              </div>
              <button onClick={() => setUserModal(null)} className="text-slate-400 hover:text-slate-700 p-1">
                <X className="h-5 w-5" />
              </button>
            </CardHeader>

            <form onSubmit={handleSaveUser}>
              <CardContent className="space-y-4 pt-4 text-xs">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Subscription Plan</label>
                  <select
                    value={userModal.data.plan || 'NONE'}
                    onChange={(e) => setUserModal({
                      ...userModal,
                      data: { ...userModal.data, plan: e.target.value }
                    })}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-emerald-600 focus:outline-none"
                  >
                    <option value="NONE">NONE (No active signal access)</option>
                    <option value="SR_SIGNAL_BOX">SR_SIGNAL_BOX ($10 Tier)</option>
                    <option value="PERFECT_SIGNAL_BOX">PERFECT_SIGNAL_BOX ($20 VIP Tier)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Desk Role</label>
                  <select
                    value={userModal.data.role}
                    onChange={(e) => setUserModal({
                      ...userModal,
                      data: { ...userModal.data, role: e.target.value }
                    })}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-emerald-600 focus:outline-none"
                  >
                    <option value="user">User (Trader)</option>
                    <option value="admin">Admin (Executive Operations)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Cycle Expiration Date (ISO)</label>
                  <input
                    type="text"
                    value={userModal.data.cycle_expires_at || ''}
                    placeholder="e.g. 2026-11-24T12:00:00.000Z"
                    onChange={(e) => setUserModal({
                      ...userModal,
                      data: { ...userModal.data, cycle_expires_at: e.target.value }
                    })}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 font-mono focus:border-emerald-600 focus:outline-none"
                  />
                  <div className="flex gap-2 mt-2">
                    <button
                      type="button"
                      onClick={() => {
                        const d = new Date();
                        d.setDate(d.getDate() + 30);
                        setUserModal({
                          ...userModal,
                          data: { ...userModal.data, cycle_expires_at: d.toISOString() }
                        });
                      }}
                      className="text-[11px] text-emerald-700 font-semibold underline cursor-pointer"
                    >
                      Set to +30 Days from today
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setUserModal({
                          ...userModal,
                          data: { ...userModal.data, cycle_expires_at: '' }
                        });
                      }}
                      className="text-[11px] text-rose-600 font-semibold underline cursor-pointer"
                    >
                      Clear Expiration
                    </button>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="border-t border-slate-100 pt-3 flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setUserModal(null)}>
                  Cancel
                </Button>
                <Button type="submit">
                  Save Access
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
