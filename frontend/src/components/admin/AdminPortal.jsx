import React, { useState, useEffect } from 'react';
import { pb } from '../../lib/pocketbase';
import { 
  Shield, Zap, CheckCircle2, XCircle, Trash2, Edit3, Plus, 
  Bell, Pin, Cpu, DollarSign, Users, RefreshCw, AlertCircle,
  ExternalLink, Search, Filter, TrendingUp, TrendingDown,
  Calendar, KeyRound, Check, X, ArrowUpRight, Network, Layers,
  LogOut, ArrowLeft, Menu, Activity, ShieldAlert, Clock, ChevronRight,
  ChevronDown, BarChart3, ChevronLeft, Lock
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

export function AdminPortal({ onNavigatePublic, notify }) {
  const [currentUser, setCurrentUser] = useState(pb.authStore.record);
  const [activeTab, setActiveTab] = useState('overview'); // overview, payments, signals, broadcasts, bots, users, connectors
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  // Data collections
  const [signals, setSignals] = useState([]);
  const [payments, setPayments] = useState([]);
  const [broadcasts, setBroadcasts] = useState([]);
  const [bots, setBots] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [connectors, setConnectors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Filters
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [signalFilter, setSignalFilter] = useState('all');

  // Modals state
  const [signalModal, setSignalModal] = useState(null);
  const [broadcastModal, setBroadcastModal] = useState(null);
  const [botModal, setBotModal] = useState(null);
  const [userModal, setUserModal] = useState(null);

  // Admin login form state (for non-admin visitors)
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState(null);

  // Load all admin collections from PocketBase SQLite
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
    const unsubAuth = pb.authStore.onChange((token, model) => {
      setCurrentUser(model);
    });

    if (currentUser && currentUser.role === 'admin') {
      loadData();

      const unsubSignals = pb.collection('signals').subscribe('*', () => loadData()).catch(() => {});
      const unsubPayments = pb.collection('payments').subscribe('*', () => loadData()).catch(() => {});
      const unsubBroadcasts = pb.collection('broadcasts').subscribe('*', () => loadData()).catch(() => {});
      const unsubBots = pb.collection('bots').subscribe('*', () => loadData()).catch(() => {});
      const unsubUsers = pb.collection('users').subscribe('*', () => loadData()).catch(() => {});

      return () => {
        unsubAuth();
        unsubSignals?.then?.(u => u && u());
        unsubPayments?.then?.(u => u && u());
        unsubBroadcasts?.then?.(u => u && u());
        unsubBots?.then?.(u => u && u());
        unsubUsers?.then?.(u => u && u());
      };
    }

    return () => unsubAuth();
  }, [currentUser]);

  const toast = (title, message, type = 'success') => {
    if (notify) notify({ type, title, message });
  };

  const handleAdminLogin = async (e) => {
    e?.preventDefault();
    setLoginError(null);
    setLoginLoading(true);
    try {
      const authData = await pb.collection('users').authWithPassword(loginEmail, loginPassword);
      if (authData.record.role !== 'admin') {
        pb.authStore.clear();
        setLoginError('Account does not have Administrator privileges.');
        return;
      }
      setCurrentUser(authData.record);
      toast('Welcome Admin', `Logged in as ${authData.record.name || authData.record.email}`);
    } catch (err) {
      setLoginError(err.message || 'Invalid administrator credentials');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleQuickAdminLogin = async () => {
    setLoginError(null);
    setLoginLoading(true);
    try {
      const authData = await pb.collection('users').authWithPassword('jayeshvegda@gmail.com', 'root1234');
      setCurrentUser(authData.record);
      toast('Welcome Admin', 'Logged in with 1-Click Executive Admin');
    } catch (err) {
      setLoginError(err.message || '1-Click admin login failed');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    pb.authStore.clear();
    setCurrentUser(null);
    toast('Signed Out', 'Admin session terminated', 'info');
  };

  // --- STATS CALCULATIONS ---
  const pendingPayments = payments.filter(p => p.status === 'pending');
  const confirmedPayments = payments.filter(p => p.status === 'confirmed');
  const totalRevenue = confirmedPayments.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
  const activeSignalsCount = signals.filter(s => s.status === 'active').length;
  const activeSubscribersCount = allUsers.filter(u => u.plan && u.plan !== 'NONE').length;

  // --- PAYMENTS WORKFLOW ---
  const handleApprovePayment = async (p) => {
    try {
      await pb.collection('payments').update(p.id, { status: 'confirmed' });

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
        toast('Payment Approved', `Confirmed payment for ${p.user_email} (User not found)`);
      }
      loadData();
    } catch (err) {
      toast('Approval Error', err.message, 'error');
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

  // --- BROADCASTS WORKFLOW ---
  const handleSaveBroadcast = async (e) => {
    e.preventDefault();
    const data = broadcastModal.data;
    try {
      if (broadcastModal.mode === 'create') {
        await pb.collection('broadcasts').create({
          ...data,
          author: data.author || currentUser?.name || 'Desk Admin'
        });
        toast('Broadcast Sent', 'Announcement published to member feeds');
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

  // Helper for explorer URLs
  const getExplorerUrl = (network, txid) => {
    if (!txid) return '#';
    const clean = txid.trim();
    if (network?.includes('TRC20')) return `https://tronscan.org/#/transaction/${clean}`;
    if (network?.includes('BEP20')) return `https://bscscan.com/tx/${clean}`;
    return `https://etherscan.io/tx/${clean}`;
  };

  // Helper for cycle expiration
  const formatExpiry = (dateStr) => {
    if (!dateStr) return { text: 'No active cycle', active: false };
    const expiry = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
    if (diffDays <= 0) return { text: 'Expired', active: false };
    return { text: `${diffDays} days left`, active: true };
  };

  // --- GUEST / LOGIN GATE (When not authenticated as Admin) ---
  if (!currentUser || currentUser.role !== 'admin') {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col justify-center items-center p-4 font-sans text-slate-800">
        <div className="w-full max-w-md">
          <div className="text-center mb-6">
            <div className="inline-flex h-12 w-12 rounded-xl bg-emerald-600 text-white items-center justify-center shadow-md mb-3">
              <Shield className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">AKG ALGO Admin Console</h1>
            <p className="text-xs text-slate-500 mt-1">Dedicated Administrative Portal & Operational Ledger</p>
          </div>

          <Card className="p-6 shadow-xl space-y-5 bg-white">
            <div className="space-y-1 pb-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">Sign In with Admin Credentials</h2>
              <p className="text-xs text-slate-500">Access to payment confirmations, signal broadcasting, and member controls.</p>
            </div>

            {loginError && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700">
                ⚠ {loginError}
              </div>
            )}

            {/* 1-Click Admin Button */}
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 space-y-2">
              <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                ⚡ Quick Executive Access
              </div>
              <Button
                type="button"
                onClick={handleQuickAdminLogin}
                disabled={loginLoading}
                className="w-full justify-between gap-2"
              >
                <span className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  <span>Log in as Jayesh Vegda</span>
                </span>
                <span className="text-[11px] bg-emerald-700 px-2 py-0.5 rounded">1-Click →</span>
              </Button>
            </div>

            <div className="relative my-2">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200"></div></div>
              <div className="relative flex justify-center text-[10px] uppercase font-semibold"><span className="bg-white px-2 text-slate-400">Or Manual Admin Login</span></div>
            </div>

            <form onSubmit={handleAdminLogin} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Admin Email</label>
                <input
                  type="email"
                  required
                  placeholder="admin@akgalgo.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-emerald-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Password</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-emerald-600 focus:outline-none"
                />
              </div>

              <Button
                type="submit"
                disabled={loginLoading}
                variant="outline"
                className="w-full justify-center pt-2.5 pb-2.5"
              >
                {loginLoading ? 'Authenticating...' : 'Sign In to Admin Console'}
              </Button>
            </form>

            <div className="pt-3 border-t border-slate-100 text-center">
              <button
                type="button"
                onClick={onNavigatePublic}
                className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 font-medium cursor-pointer"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Return to Public Website</span>
              </button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

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

  // Sidebar navigation menu structured logically
  const navigationGroups = [
    {
      group: 'MAIN OPERATIONS',
      items: [
        { id: 'overview', label: 'Executive Overview', icon: Layers },
        { id: 'payments', label: 'Payments Queue', icon: DollarSign, badge: pendingPayments.length },
        { id: 'signals', label: 'Signals Desk', icon: Zap, count: activeSignalsCount },
      ]
    },
    {
      group: 'MANAGEMENT & CATALOG',
      items: [
        { id: 'broadcasts', label: 'Directives Feed', icon: Bell, count: broadcasts.length },
        { id: 'bots', label: 'Trading Bots Catalog', icon: Cpu, count: bots.length },
      ]
    },
    {
      group: 'USERS & INQUIRIES',
      items: [
        { id: 'users', label: 'Traders & Access', icon: Users, count: allUsers.length },
        { id: 'connectors', label: 'Connector Demose', icon: Network, count: connectors.length },
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-800">
      {/* =========================================================================
          LEFT SIDEBAR (Desktop Fixed & Collapsible, Mobile Slide-over Drawer)
      ========================================================================= */}
      
      {/* Mobile Drawer Backdrop */}
      {mobileDrawerOpen && (
        <div 
          onClick={() => setMobileDrawerOpen(false)}
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden transition-opacity"
        />
      )}

      {/* The Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 bg-white border-r border-slate-200 flex flex-col justify-between transition-all duration-300 ease-in-out ${
          // Mobile state
          mobileDrawerOpen ? 'translate-x-0 w-64' : '-translate-x-full lg:translate-x-0'
        } ${
          // Desktop collapsed vs expanded
          sidebarCollapsed ? 'lg:w-20' : 'lg:w-64'
        }`}
      >
        {/* Sidebar Header / Brand */}
        <div>
          <div className="h-16 px-4 border-b border-slate-100 flex items-center justify-between">
            <div className={`flex items-center gap-3 overflow-hidden select-none ${sidebarCollapsed ? 'justify-center w-full' : ''}`}>
              <div className="h-9 w-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-sm shrink-0">
                <Shield className="h-5 w-5" />
              </div>
              {!sidebarCollapsed && (
                <div className="truncate">
                  <div className="font-black text-sm tracking-tight text-slate-900 flex items-center gap-1.5">
                    <span>AKG ALGO</span>
                    <span className="text-[10px] bg-slate-900 text-white px-1.5 py-0.2 rounded font-bold">
                      ADMIN
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 font-medium truncate">
                    Control Center
                  </div>
                </div>
              )}
            </div>

            {/* Mobile close button */}
            <button
              onClick={() => setMobileDrawerOpen(false)}
              className="lg:hidden p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Sidebar Navigation Items */}
          <div className="p-3 space-y-6 overflow-y-auto max-h-[calc(100vh-140px)] no-scrollbar">
            {navigationGroups.map((group, gIdx) => (
              <div key={gIdx} className="space-y-1">
                {!sidebarCollapsed && (
                  <div className="px-3 text-[10px] font-bold text-slate-400 tracking-wider uppercase mb-1.5">
                    {group.group}
                  </div>
                )}
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;

                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id);
                        setMobileDrawerOpen(false);
                        setSearchQuery('');
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                        isActive
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      } ${sidebarCollapsed ? 'justify-center px-0' : ''}`}
                      title={sidebarCollapsed ? item.label : undefined}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                        {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                      </div>

                      {!sidebarCollapsed && (
                        <>
                          {item.badge !== undefined && item.badge > 0 ? (
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              isActive ? 'bg-white text-emerald-800' : 'bg-amber-500 text-white'
                            }`}>
                              {item.badge}
                            </span>
                          ) : item.count !== undefined ? (
                            <span className={`text-[10px] px-1.5 py-0.2 rounded font-medium ${
                              isActive ? 'bg-emerald-700 text-white' : 'text-slate-400 bg-slate-100'
                            }`}>
                              {item.count}
                            </span>
                          ) : null}
                        </>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar Footer / User Profile & Desktop Toggle */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/50 space-y-2">
          {/* Quick link: View Public Website */}
          <button
            onClick={onNavigatePublic}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-white border border-transparent hover:border-slate-200 transition-all cursor-pointer ${
              sidebarCollapsed ? 'justify-center px-0' : ''
            }`}
            title="Return to Public Customer Website"
          >
            <ExternalLink className="h-4 w-4 shrink-0 text-slate-500" />
            {!sidebarCollapsed && <span>View Public Site</span>}
          </button>

          {/* Admin User Row */}
          <div className={`flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200 ${sidebarCollapsed ? 'justify-center' : ''}`}>
            {!sidebarCollapsed ? (
              <div className="flex items-center gap-2.5 overflow-hidden">
                <div className="h-8 w-8 rounded-lg bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-xs shrink-0">
                  {currentUser.email?.slice(0, 2).toUpperCase() || 'AD'}
                </div>
                <div className="truncate text-xs">
                  <div className="font-bold text-slate-900 truncate">{currentUser.name || currentUser.email}</div>
                  <div className="text-[10px] text-emerald-700 font-medium">Administrator</div>
                </div>
              </div>
            ) : null}

            <button
              onClick={handleLogout}
              className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>

          {/* Desktop Collapse Toggle */}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="hidden lg:flex w-full items-center justify-center py-1 text-slate-400 hover:text-slate-700 text-xs gap-1 cursor-pointer"
            title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {sidebarCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <>
                <ChevronLeft className="h-3.5 w-3.5" />
                <span className="text-[11px]">Collapse sidebar</span>
              </>
            )}
          </button>
        </div>
      </aside>

      {/* =========================================================================
          RIGHT MAIN WORKSPACE (Dynamic margin based on sidebar state)
      ========================================================================= */}
      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${
        sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'
      }`}>
        
        {/* Top Operational Utility Bar */}
        <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-30 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
          {/* Left: Mobile hamburger & Breadcrumb */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileDrawerOpen(true)}
              className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
            >
              <Menu className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400">Admin</span>
              <span className="text-slate-300">/</span>
              <span className="font-bold text-slate-900 capitalize">
                {activeTab === 'overview' ? 'Executive Overview' :
                 activeTab === 'payments' ? 'Payments Queue' :
                 activeTab === 'signals' ? 'Signals Desk' :
                 activeTab === 'broadcasts' ? 'Directives Feed' :
                 activeTab === 'bots' ? 'Trading Bots' :
                 activeTab === 'users' ? 'Traders & Access' : 'Connector Demose'}
              </span>
            </div>
          </div>

          {/* Right: Sync & Status */}
          <div className="flex items-center gap-2 sm:gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={loadData}
              disabled={loading}
              className="h-8 text-xs gap-1.5 bg-white"
            >
              <RefreshCw className={`h-3 w-3 text-slate-500 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Sync Data</span>
            </Button>

            {pendingPayments.length > 0 && (
              <button
                onClick={() => setActiveTab('payments')}
                className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold hover:bg-amber-100 cursor-pointer"
              >
                <span className="h-2 w-2 rounded-full bg-amber-500 animate-ping" />
                <span>{pendingPayments.length} Pending</span>
              </button>
            )}

            <button
              onClick={onNavigatePublic}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 cursor-pointer"
            >
              <span>Public Site</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </header>

        {/* Content Workspace */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl w-full mx-auto">
          
          {/* ==================== TAB 0: EXECUTIVE OVERVIEW ==================== */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Welcome banner */}
              <div className="p-5 rounded-2xl bg-white border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
                <div>
                  <h2 className="text-xl font-black text-slate-900 tracking-tight">Executive Operations Center</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Real-time status of trading signals, subscriptions, and crypto settlement ledger.</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="default" className="text-xs">
                    ● System Active
                  </Badge>
                  <span className="text-xs text-slate-400 font-mono">LD4 Bridge: Online</span>
                </div>
              </div>

              {/* 4 KPI Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="p-5 space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                    <span>Pending Deposits</span>
                    <div className="h-8 w-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
                      <DollarSign className="h-4 w-4" />
                    </div>
                  </div>
                  <div className="text-3xl font-black text-slate-900 tabular-nums flex items-center gap-2">
                    {pendingPayments.length}
                    {pendingPayments.length > 0 && (
                      <span className="h-2.5 w-2.5 rounded-full bg-amber-500 animate-ping" />
                    )}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    <button 
                      onClick={() => setActiveTab('payments')} 
                      className="text-emerald-700 font-semibold hover:underline flex items-center gap-0.5"
                    >
                      Open queue <ChevronRight className="h-3 w-3" />
                    </button>
                  </div>
                </Card>

                <Card className="p-5 space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                    <span>Confirmed Revenue</span>
                    <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                      <TrendingUp className="h-4 w-4" />
                    </div>
                  </div>
                  <div className="text-3xl font-black text-emerald-600 tabular-nums">
                    ${totalRevenue}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {confirmedPayments.length} verified 30-day cycles
                  </div>
                </Card>

                <Card className="p-5 space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                    <span>Active Signals</span>
                    <div className="h-8 w-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
                      <Zap className="h-4 w-4" />
                    </div>
                  </div>
                  <div className="text-3xl font-black text-slate-900 tabular-nums">
                    {activeSignalsCount}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    <button 
                      onClick={() => setActiveTab('signals')} 
                      className="text-emerald-700 font-semibold hover:underline flex items-center gap-0.5"
                    >
                      Manage signals <ChevronRight className="h-3 w-3" />
                    </button>
                  </div>
                </Card>

                <Card className="p-5 space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                    <span>Active Subscribers</span>
                    <div className="h-8 w-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
                      <Users className="h-4 w-4" />
                    </div>
                  </div>
                  <div className="text-3xl font-black text-slate-900 tabular-nums">
                    {activeSubscribersCount}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    out of {allUsers.length} total members
                  </div>
                </Card>
              </div>

              {/* Action Blocks */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* Urgent Action: Pending Payments */}
                <Card className="p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-emerald-600" />
                      <span>Pending Deposit Queue ({pendingPayments.length})</span>
                    </h3>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setActiveTab('payments')}
                      className="text-xs text-emerald-700"
                    >
                      View All
                    </Button>
                  </div>

                  {pendingPayments.length === 0 ? (
                    <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 rounded-xl">
                      ✓ All transactions verified! No pending deposits.
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {pendingPayments.slice(0, 3).map((p) => (
                        <div key={p.id} className="p-3 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-between gap-3 text-xs">
                          <div className="truncate">
                            <div className="font-bold text-slate-900 truncate">{p.user_email}</div>
                            <div className="text-[11px] text-slate-500">${p.amount} USDT · {p.network}</div>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => handleApprovePayment(p)}
                            className="h-7 text-xs px-2.5 shrink-0"
                          >
                            Approve (+30D)
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>

                {/* Active Signals Board */}
                <Card className="p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                      <Zap className="h-4 w-4 text-blue-600" />
                      <span>Active Trade Setups ({activeSignalsCount})</span>
                    </h3>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setActiveTab('signals')}
                      className="text-xs text-emerald-700"
                    >
                      Post Signal
                    </Button>
                  </div>

                  {signals.filter(s => s.status === 'active').length === 0 ? (
                    <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 rounded-xl">
                      No active trade setups currently open.
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {signals.filter(s => s.status === 'active').slice(0, 3).map((s) => (
                        <div key={s.id} className="p-3 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-between gap-3 text-xs">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-extrabold text-slate-900">{s.symbol}</span>
                              <Badge className={s.direction === 'BUY' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}>
                                {s.direction}
                              </Badge>
                            </div>
                            <div className="text-[11px] text-slate-500 mt-0.5">Entry: {s.entry} · TP1: {s.take_profit_1}</div>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCloseSignal(s)}
                            className="h-7 text-xs px-2.5 shrink-0 text-emerald-700 border-emerald-300"
                          >
                            Close / Result
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              </div>
            </div>
          )}

          {/* ==================== TAB 1: PAYMENTS QUEUE ==================== */}
          {activeTab === 'payments' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
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
                  No payment records matching criteria.
                </Card>
              ) : (
                <div className="space-y-3">
                  {/* Desktop Data Table */}
                  <div className="hidden md:block">
                    <Card className="overflow-hidden shadow-sm">
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
                                      variant={isConfirmed ? 'default' : isPending ? 'secondary' : 'outline'}
                                      className={isPending ? 'bg-amber-100 text-amber-800 border-amber-200' : ''}
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

                  {/* Mobile Touch Cards */}
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

          {/* ==================== TAB 2: SIGNALS DESK ==================== */}
          {activeTab === 'signals' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
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
                    <span>Post Trade Signal</span>
                  </Button>

                  <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs">
                    {['all', 'active', 'closed'].map((st) => (
                      <button
                        key={st}
                        onClick={() => setSignalFilter(st)}
                        className={`px-2.5 py-1 rounded font-semibold capitalize cursor-pointer ${
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
                    <Card key={s.id} className="p-4 flex flex-col justify-between space-y-3 shadow-sm">
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
                              onClick={async () => {
                                await pb.collection('signals').update(s.id, { status: 'active', pnl: '' });
                                loadData();
                              }}
                              className="h-8 text-xs text-slate-600"
                            >
                              Reopen
                            </Button>
                          )}

                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setSignalModal({ mode: 'edit', data: s })}
                            className="h-8 text-xs p-2 text-slate-600"
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

          {/* ==================== TAB 3: ANNOUNCEMENTS ==================== */}
          {activeTab === 'broadcasts' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Directives & Announcements</h3>
                  <p className="text-xs text-slate-500">Global notices pushed to all trader dashboards.</p>
                </div>
                <Button
                  onClick={() => setBroadcastModal({
                    mode: 'create',
                    data: { title: '', body: '', pinned: false, author: currentUser?.name || 'Desk Admin' }
                  })}
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>New Announcement</span>
                </Button>
              </div>

              <div className="space-y-3">
                {broadcasts.map((b) => (
                  <Card key={b.id} className="p-5 space-y-3 shadow-sm">
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

          {/* ==================== TAB 4: TRADING BOTS CATALOG ==================== */}
          {activeTab === 'bots' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Trading Bots & EA Catalog</h3>
                  <p className="text-xs text-slate-500">Configure bot pricing, supported platforms, and recommended capital.</p>
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
                  <span>Add Bot to Store</span>
                </Button>
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {bots.map((bot) => (
                  <Card key={bot.id} className="p-5 flex flex-col justify-between space-y-4 shadow-sm">
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

          {/* ==================== TAB 5: TRADERS & ACCESS ==================== */}
          {activeTab === 'users' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Member Accounts & Access Rights</h3>
                  <p className="text-xs text-slate-500">Manage plan entitlements, cycle renewals, and administrative access.</p>
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

              <Card className="overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
                      <tr>
                        <th className="p-3.5">Trader Details</th>
                        <th className="p-3.5">Role</th>
                        <th className="p-3.5">Current Plan</th>
                        <th className="p-3.5">Cycle Expiration</th>
                        <th className="p-3.5 text-right">Access Controls</th>
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

          {/* ==================== TAB 6: CONNECTOR DEMOS ==================== */}
          {activeTab === 'connectors' && (
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900">Connector Demo Inquiries</h3>
                <p className="text-xs text-slate-500">MetaTrader broker connections requested by users.</p>
              </div>

              {connectors.length === 0 ? (
                <Card className="p-8 text-center text-slate-500 text-xs">
                  No connector demo inquiries logged in database.
                </Card>
              ) : (
                <div className="grid gap-3 md:grid-cols-2">
                  {connectors.map((c) => (
                    <Card key={c.id} className="p-4 space-y-3 shadow-sm">
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
                          onClick={async () => {
                            await pb.collection('connector_requests').update(c.id, { status: 'connected' });
                            loadData();
                          }}
                          className="h-7 text-xs text-emerald-700 border-emerald-300"
                        >
                          Mark Connected
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={async () => {
                            await pb.collection('connector_requests').update(c.id, { status: 'rejected' });
                            loadData();
                          }}
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
        </main>
      </div>

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
              <button onClick={() => setSignalModal(null)} className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </CardHeader>

            <form onSubmit={handleSaveSignal}>
              <CardContent className="space-y-4 pt-4 text-xs">
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

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Trade Notes / Strategy Invalidation</label>
                  <textarea
                    rows={3}
                    placeholder="e.g. London liquidity sweep at session discount."
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
                <Button type="button" variant="outline" onClick={() => setSignalModal(null)}>
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
              <button onClick={() => setBroadcastModal(null)} className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </CardHeader>

            <form onSubmit={handleSaveBroadcast}>
              <CardContent className="space-y-4 pt-4 text-xs">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. US CPI High Volatility Advisory"
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
                    id="pinToggleModalSidebar"
                    checked={broadcastModal.data.pinned}
                    onChange={(e) => setBroadcastModal({
                      ...broadcastModal,
                      data: { ...broadcastModal.data, pinned: e.target.checked }
                    })}
                    className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-600 cursor-pointer"
                  />
                  <label htmlFor="pinToggleModalSidebar" className="text-slate-700 font-semibold cursor-pointer">
                    Pin to top of member dashboards
                  </label>
                </div>
              </CardContent>

              <CardFooter className="border-t border-slate-100 pt-3 flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setBroadcastModal(null)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {broadcastModal.mode === 'create' ? 'Publish' : 'Save Changes'}
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
              <button onClick={() => setBotModal(null)} className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer">
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
                  {botModal.mode === 'create' ? 'Add Bot' : 'Save Changes'}
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
                <CardTitle className="text-lg">Edit Trader Access</CardTitle>
                <CardDescription>{userModal.data.email}</CardDescription>
              </div>
              <button onClick={() => setUserModal(null)} className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer">
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
                      +30 Days from today
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
