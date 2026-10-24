import React, { useState, useEffect } from 'react';
import { pb } from '../../lib/pocketbase';
import { 
  Shield, Zap, CheckCircle2, XCircle, Trash2, Edit3, Plus, 
  Bell, Pin, Cpu, DollarSign, Users, RefreshCw, AlertCircle,
  ExternalLink, Search, Filter, TrendingUp, TrendingDown,
  Calendar, KeyRound, Check, X, ArrowUpRight, Network, Layers,
  LogOut, ArrowLeft, Menu, Activity, ShieldAlert, Clock, ChevronRight,
  ChevronDown, BarChart3, ChevronLeft, Lock, Link2, Download,
  MessageSquare, Send, Sparkles, Eye, Share2, Globe, Radio,
  Copy, Image as ImageIcon, Server, Terminal, Laptop, Upload, HardDrive, Camera
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

export function AdminPortal({ onNavigatePublic, notify }) {
  const [currentUser, setCurrentUser] = useState(pb.authStore.record);
  const [activeTab, setActiveTab] = useState('overview'); // overview, payments, signals, broadcasts, bots, users, connectors, resources
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  // Deep drilldown detail selection state
  const [selectedBotId, setSelectedBotId] = useState(null);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [selectedConnectorId, setSelectedConnectorId] = useState(null);

  // Data collections from PocketBase SQLite
  const [signals, setSignals] = useState([]);
  const [payments, setPayments] = useState([]);
  const [broadcasts, setBroadcasts] = useState([]);
  const [bots, setBots] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [connectors, setConnectors] = useState([]);
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Filters
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [signalFilter, setSignalFilter] = useState('all');
  const [botPlatformFilter, setBotPlatformFilter] = useState('all');
  const [resourceCategoryFilter, setResourceCategoryFilter] = useState('all');

  // Modals state
  const [signalModal, setSignalModal] = useState(null); // { mode, data, entryMode: 'form' | 'chatbox', chatText: '' }
  const [broadcastModal, setBroadcastModal] = useState(null);
  const [botModal, setBotModal] = useState(null);
  const [userModal, setUserModal] = useState(null);
  const [resourceModal, setResourceModal] = useState(null);

  // Admin login form state (for non-admin visitors)
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState(null);

  // Load all admin collections from PocketBase SQLite
  const loadData = async () => {
    setLoading(true);
    try {
      const [sRes, pRes, bRes, botRes, uRes, cRes, rRes] = await Promise.all([
        pb.collection('signals').getFullList({ sort: '-created' }),
        pb.collection('payments').getFullList({ sort: '-created' }),
        pb.collection('broadcasts').getFullList({ sort: '-pinned,-created' }),
        pb.collection('bots').getFullList({ sort: '-created' }),
        pb.collection('users').getFullList({ sort: '-created' }),
        pb.collection('connector_requests').getFullList({ sort: '-created' }).catch(() => []),
        pb.collection('resources').getFullList({ sort: 'sort_order,-created' }).catch(() => []),
      ]);
      setSignals(sRes);
      setPayments(pRes);
      setBroadcasts(bRes);
      setBots(botRes);
      setAllUsers(uRes);
      setConnectors(cRes);
      setResources(rRes);
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
      const unsubConnectors = pb.collection('connector_requests').subscribe('*', () => loadData()).catch(() => {});
      const unsubResources = pb.collection('resources').subscribe('*', () => loadData()).catch(() => {});

      return () => {
        unsubAuth();
        unsubSignals?.then?.(u => u && u());
        unsubPayments?.then?.(u => u && u());
        unsubBroadcasts?.then?.(u => u && u());
        unsubBots?.then?.(u => u && u());
        unsubUsers?.then?.(u => u && u());
        unsubConnectors?.then?.(u => u && u());
        unsubResources?.then?.(u => u && u());
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
  const activeSignals = signals.filter(s => s.status === 'active');
  const activeSignalsCount = activeSignals.length;
  const activeSubscribersCount = allUsers.filter(u => u.plan && u.plan !== 'NONE').length;
  const pendingConnectors = connectors.filter(c => c.status === 'pending_review' || c.status === 'pending');

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
        toast('Payment Approved', `Confirmed payment for ${p.user_email}`);
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

  // --- SIGNALS WORKFLOW & DUAL-MODE PARSER ---
  const parseSignalChatText = (text) => {
    if (!text || !text.trim()) return null;

    // Direction
    const dirMatch = text.match(/\b(BUY|SELL|LONG|SHORT)\b/i);
    let direction = dirMatch ? dirMatch[1].toUpperCase() : 'BUY';
    if (direction === 'LONG') direction = 'BUY';
    if (direction === 'SHORT') direction = 'SELL';

    // Symbol
    const pairMatch = text.match(/\b(XAUUSD|EURUSD|GBPUSD|USDJPY|USDCAD|AUDUSD|NZDUSD|USDCHF|BTCUSD|BTCUSDT|ETHUSD|US30|NAS100|GER40|USOIL|UKOIL)\b/i);
    const genericMatch = text.match(/\b([A-Z]{3,6}(?:USD|USDT|JPY|GBP|EUR|CHF|AUD|NZD|CAD)?|[A-Z]{2,6}\d{2,3})\b/i);
    const symbol = (pairMatch ? pairMatch[1] : (genericMatch ? genericMatch[1] : 'XAUUSD')).toUpperCase();

    // Entry
    let entry = '';
    const entryMatch = text.match(/(?:entry|price|@|at|open)\s*[:=]?\s*([0-9]+[.,]?[0-9]*)/i);
    if (entryMatch) entry = entryMatch[1].replace(',', '.');

    // Stop Loss
    let stopLoss = '';
    const slMatch = text.match(/(?:sl|stop\s*loss|stop)\s*[:=]?\s*([0-9]+[.,]?[0-9]*)/i);
    if (slMatch) stopLoss = slMatch[1].replace(',', '.');

    // Take Profit 1
    let tp1 = '';
    const tp1Match = text.match(/(?:tp1|tp\s*1|take\s*profit\s*1|tp)\s*[:=]?\s*([0-9]+[.,]?[0-9]*)/i);
    if (tp1Match) tp1 = tp1Match[1].replace(',', '.');

    // Take Profit 2
    let tp2 = '';
    const tp2Match = text.match(/(?:tp2|tp\s*2|take\s*profit\s*2)\s*[:=]?\s*([0-9]+[.,]?[0-9]*)/i);
    if (tp2Match) tp2 = tp2Match[1].replace(',', '.');

    // Notes
    let notes = '';
    const notesMatch = text.match(/(?:notes?|comment|reason|analysis)\s*[:=]?\s*(.+)/is);
    if (notesMatch) {
      notes = notesMatch[1].trim();
    } else {
      const lines = text.split('\n').filter(l => {
        const clean = l.trim();
        if (!clean) return false;
        if (clean.match(/^(buy|sell|long|short)\b/i)) return false;
        if (clean.match(/^(entry|sl|tp|stop)\b/i)) return false;
        return true;
      });
      if (lines.length > 0) notes = lines.join(' ').trim();
    }

    return {
      symbol,
      direction,
      entry: entry || '',
      stop_loss: stopLoss || '',
      take_profit_1: tp1 || '',
      take_profit_2: tp2 || '',
      plan_tier: 'PERFECT_SIGNAL_BOX',
      status: 'active',
      notes: notes || 'Dispatched via Quick Chatbox'
    };
  };

  const handleSaveSignal = async (e) => {
    e?.preventDefault();
    let data = signalModal.data;

    // If in chatbox mode, parse before saving
    if (signalModal.entryMode === 'chatbox') {
      const parsed = parseSignalChatText(signalModal.chatText);
      if (!parsed || !parsed.entry || !parsed.stop_loss || !parsed.take_profit_1) {
        toast('Parse Incomplete', 'Please ensure Symbol, Entry, SL, and TP are in the message.', 'error');
        return;
      }
      data = { ...data, ...parsed };
    }

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

  const handleBroadcastChatMessage = async () => {
    if (!signalModal?.chatText?.trim()) return;
    try {
      await pb.collection('broadcasts').create({
        title: `⚡ Trade Alert: ${signalModal.chatText.slice(0, 35)}...`,
        body: signalModal.chatText.trim(),
        author: currentUser?.name || 'Head Trader (London Desk)',
        pinned: true
      });
      toast('Alert Sent', 'Broadcasted as priority directive to all traders');
      setSignalModal(null);
      loadData();
    } catch (err) {
      toast('Broadcast Error', err.message, 'error');
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

  // --- BOTS WORKFLOW (Device Image Upload & Google Drive Downloads) ---
  const handleDeviceImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      toast('File Too Large', 'Please select an image under 8MB', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const dataUrl = uploadEvent.target?.result;
      setBotModal(prev => ({
        ...prev,
        data: { ...prev.data, image_url: dataUrl }
      }));
      toast('Photo Uploaded', `Loaded ${file.name} from device`);
    };
    reader.readAsDataURL(file);
  };

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
      if (selectedBotId === id) setSelectedBotId(null);
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

  // --- CONNECTORS WORKFLOW (Interactive Two-Way Live Sync) ---
  const handleUpdateConnectorStatus = async (connectorId, newStatus, optionalNote) => {
    try {
      const payload = { status: newStatus };
      if (optionalNote !== undefined) payload.admin_notes = optionalNote;
      await pb.collection('connector_requests').update(connectorId, payload);
      toast('Bridge Updated', `Status changed to ${newStatus.toUpperCase()}`);
      loadData();
    } catch (err) {
      toast('Update Error', err.message, 'error');
    }
  };

  // --- RESOURCES WORKFLOW (Downloads & Useful Links) ---
  const handleSaveResource = async (e) => {
    e.preventDefault();
    const data = resourceModal.data;
    try {
      if (resourceModal.mode === 'create') {
        await pb.collection('resources').create(data);
        toast('Resource Created', `${data.title} added to member kit`);
      } else {
        await pb.collection('resources').update(data.id, data);
        toast('Resource Updated', `${data.title} updated`);
      }
      setResourceModal(null);
      loadData();
    } catch (err) {
      toast('Resource Error', err.message, 'error');
    }
  };

  const handleDeleteResource = async (id) => {
    if (!window.confirm('Delete this resource link / download?')) return;
    try {
      await pb.collection('resources').delete(id);
      toast('Resource Deleted', 'Item removed', 'info');
      loadData();
    } catch (err) {
      toast('Error', err.message, 'error');
    }
  };

  const handleToggleResourceActive = async (res) => {
    try {
      await pb.collection('resources').update(res.id, { is_active: !res.is_active });
      toast('Status Changed', `Resource ${!res.is_active ? 'enabled' : 'hidden'}`);
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
            <img 
              src="/assets/logos/akg-algo-nav-dark.svg" 
              alt="AKG ALGO" 
              className="h-12 w-auto mx-auto mb-3 object-contain"
            />
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

  // Filtered bots
  const filteredBots = bots.filter((b) => {
    if (botPlatformFilter !== 'all' && !b.platform?.toUpperCase().includes(botPlatformFilter.toUpperCase())) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return b.name?.toLowerCase().includes(q) || b.pairs?.toLowerCase().includes(q);
    }
    return true;
  });

  // Filtered resources
  const filteredResources = resources.filter((r) => {
    if (resourceCategoryFilter !== 'all' && r.category !== resourceCategoryFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return r.title?.toLowerCase().includes(q) || r.url?.toLowerCase().includes(q);
    }
    return true;
  });

  // Selected bot object for dedicated detail view
  const currentSelectedBot = selectedBotId ? bots.find(b => b.id === selectedBotId) : null;
  // Selected user object for dedicated detail view
  const currentSelectedUser = selectedUserId ? allUsers.find(u => u.id === selectedUserId) : null;
  // Selected connector object for dedicated detail view
  const currentSelectedConnector = selectedConnectorId ? connectors.find(c => c.id === selectedConnectorId) : null;

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
      group: 'CATALOG & DIRECTIVES',
      items: [
        { id: 'bots', label: 'Trading Bots Catalog', icon: Cpu, count: bots.length },
        { id: 'broadcasts', label: 'Directives Feed', icon: Bell, count: broadcasts.length },
        { id: 'resources', label: 'Resources & Downloads', icon: Link2, count: resources.length },
      ]
    },
    {
      group: 'USERS & CONNECTORS',
      items: [
        { id: 'users', label: 'Traders & Access', icon: Users, count: allUsers.length },
        { id: 'connectors', label: 'Connector Demose', icon: Network, badge: pendingConnectors.length, count: connectors.length },
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
          mobileDrawerOpen ? 'translate-x-0 w-64' : '-translate-x-full lg:translate-x-0'
        } ${
          sidebarCollapsed ? 'lg:w-20' : 'lg:w-64'
        }`}
      >
        {/* Sidebar Header / Brand */}
        <div>
          <div className="h-16 px-4 border-b border-slate-100 flex items-center justify-between">
            <div className={`flex items-center gap-3 overflow-hidden select-none ${sidebarCollapsed ? 'justify-center w-full' : ''}`}>
              {sidebarCollapsed ? (
                <img 
                  src="/assets/logos/akg-algo-mark.svg" 
                  alt="AKG ALGO" 
                  className="h-8 w-8 object-contain shrink-0"
                />
              ) : (
                <img 
                  src="/assets/logos/akg-algo-nav-dark.svg" 
                  alt="AKG ALGO" 
                  className="h-7 w-auto object-contain shrink-0"
                />
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
                        setSelectedBotId(null);
                        setSelectedUserId(null);
                        setSelectedConnectorId(null);
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

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/50 space-y-2">
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
          RIGHT MAIN WORKSPACE
      ========================================================================= */}
      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${
        sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'
      }`}>
        
        {/* Top Operational Utility Bar (Shows Status and Telemetry in Header!) */}
        <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-30 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
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
                {selectedBotId ? 'Bot Detail Page' :
                 selectedUserId ? 'Trader Dossier' :
                 selectedConnectorId ? 'Connector Bridge Setup' :
                 activeTab === 'overview' ? 'Executive Overview' :
                 activeTab === 'payments' ? 'Payments Queue' :
                 activeTab === 'signals' ? 'Signals Desk' :
                 activeTab === 'broadcasts' ? 'Directives Feed' :
                 activeTab === 'bots' ? 'Trading Bots Catalog' :
                 activeTab === 'resources' ? 'Resources & Downloads' :
                 activeTab === 'users' ? 'Traders & Access' : 'Connector Demose'}
              </span>
            </div>
          </div>

          {/* Right: Operational Telemetry & Shortcuts */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* System Status in Navbar (No repetition on page!) */}
            <div className="hidden md:flex items-center gap-2 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-mono">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>LD4 Slough: 0.8ms</span>
            </div>

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
                onClick={() => { setActiveTab('payments'); setSelectedBotId(null); setSelectedUserId(null); }}
                className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold hover:bg-amber-100 cursor-pointer"
              >
                <span className="h-2 w-2 rounded-full bg-amber-500 animate-ping" />
                <span>{pendingPayments.length} Deposit Pending</span>
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

        {/* Mobile Fast Tab Switcher (One-touch momentum scrolling for phone screens) */}
        <div className="lg:hidden flex items-center gap-1.5 overflow-x-auto no-scrollbar py-2 px-3 border-b border-slate-200 bg-white sticky top-16 z-20 shadow-xs">
          {navigationGroups.flatMap(g => g.items).map(item => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                setSelectedBotId(null);
                setSelectedUserId(null);
                setSelectedConnectorId(null);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition-all flex items-center gap-1.5 shrink-0 ${
                activeTab === item.id
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <span>{item.label}</span>
              {item.badge !== undefined && item.badge > 0 ? (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  activeTab === item.id ? 'bg-white text-emerald-800' : 'bg-amber-500 text-white'
                }`}>
                  {item.badge}
                </span>
              ) : null}
            </button>
          ))}
        </div>

        {/* Content Workspace (Fluid 90-95% width, high information density, anti-slop) */}
        <main className="flex-1 p-3 sm:p-5 lg:p-7 space-y-5 w-[96%] max-w-[1850px] mx-auto">
          
          {/* ==================== TAB 0: EXECUTIVE OVERVIEW ==================== */}
          {activeTab === 'overview' && !selectedBotId && !selectedUserId && !selectedConnectorId && (
            <div className="space-y-6">
              {/* Direct 1-Click Operational Command Shortcuts */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <button
                  onClick={() => setSignalModal({
                    mode: 'create',
                    entryMode: 'chatbox',
                    chatText: 'BUY XAUUSD @ 2724.50\nSL: 2715.00\nTP1: 2735.00\nTP2: 2750.00\nNotes: London session breakout retest',
                    data: {
                      symbol: 'XAUUSD',
                      direction: 'BUY',
                      entry: '2724.50',
                      stop_loss: '2715.00',
                      take_profit_1: '2735.00',
                      take_profit_2: '2750.00',
                      plan_tier: 'PERFECT_SIGNAL_BOX',
                      status: 'active',
                      notes: 'London session breakout retest'
                    }
                  })}
                  className="p-3.5 rounded-xl bg-white border border-slate-200 hover:border-emerald-500 hover:shadow-sm text-left flex items-center justify-between cursor-pointer transition-all group"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                      <Zap className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 group-hover:text-emerald-700">Post Signal</div>
                      <div className="text-[10px] text-slate-400">Dual Chat / Form</div>
                    </div>
                  </div>
                  <Plus className="h-3.5 w-3.5 text-slate-400 group-hover:text-emerald-600" />
                </button>

                <button
                  onClick={() => setBroadcastModal({
                    mode: 'create',
                    data: { title: '', body: '', pinned: true, author: currentUser?.name || 'Desk Admin' }
                  })}
                  className="p-3.5 rounded-xl bg-white border border-slate-200 hover:border-blue-500 hover:shadow-sm text-left flex items-center justify-between cursor-pointer transition-all group"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
                      <Bell className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 group-hover:text-blue-700">Send Directive</div>
                      <div className="text-[10px] text-slate-400">Priority Bulletin</div>
                    </div>
                  </div>
                  <Plus className="h-3.5 w-3.5 text-slate-400 group-hover:text-blue-600" />
                </button>

                <button
                  onClick={() => setBotModal({
                    mode: 'create',
                    data: {
                      name: '',
                      platform: 'MT5',
                      price: 299,
                      version: 'v1.0',
                      recommended_deposit: '$500+',
                      win_rate: '80%',
                      drawdown: '4.5% Max DD',
                      profit_factor: '2.50 PF',
                      pairs: 'XAUUSD, EURUSD',
                      strategy_type: 'London Breakout',
                      features: 'Auto Lot Sizing\nStop-Loss Protection',
                      image_url: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&auto=format&fit=crop&q=80',
                      description: ''
                    }
                  })}
                  className="p-3.5 rounded-xl bg-white border border-slate-200 hover:border-amber-500 hover:shadow-sm text-left flex items-center justify-between cursor-pointer transition-all group"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
                      <Cpu className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 group-hover:text-amber-700">Add Trading Bot</div>
                      <div className="text-[10px] text-slate-400">Catalog Entry</div>
                    </div>
                  </div>
                  <Plus className="h-3.5 w-3.5 text-slate-400 group-hover:text-amber-600" />
                </button>

                <button
                  onClick={() => setActiveTab('connectors')}
                  className="p-3.5 rounded-xl bg-white border border-slate-200 hover:border-purple-500 hover:shadow-sm text-left flex items-center justify-between cursor-pointer transition-all group"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
                      <Network className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 group-hover:text-purple-700">Review Bridges</div>
                      <div className="text-[10px] text-slate-400">{pendingConnectors.length} Awaiting</div>
                    </div>
                  </div>
                  <ChevronRight className="h-3.5 w-3.5 text-slate-400 group-hover:text-purple-600" />
                </button>
              </div>

              {/* 4 KPI Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="p-5 space-y-2 bg-white">
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
                      className="text-emerald-700 font-semibold hover:underline flex items-center gap-0.5 cursor-pointer"
                    >
                      Verify queue <ChevronRight className="h-3 w-3" />
                    </button>
                  </div>
                </Card>

                <Card className="p-5 space-y-2 bg-white">
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

                <Card className="p-5 space-y-2 bg-white">
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
                      className="text-emerald-700 font-semibold hover:underline flex items-center gap-0.5 cursor-pointer"
                    >
                      Manage signals <ChevronRight className="h-3 w-3" />
                    </button>
                  </div>
                </Card>

                <Card className="p-5 space-y-2 bg-white">
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

              {/* Operational Real-time Live Streams */}
              <div className="grid lg:grid-cols-2 gap-6">
                {/* 1. Live Running Signals & Exposure */}
                <Card className="p-5 space-y-4 bg-white shadow-sm">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-emerald-600" />
                      <h3 className="font-bold text-slate-900 text-sm">Active Trading Exposure ({activeSignals.length})</h3>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setActiveTab('signals')}
                      className="text-xs text-emerald-700"
                    >
                      All Signals
                    </Button>
                  </div>

                  {activeSignals.length === 0 ? (
                    <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 rounded-xl">
                      No active market orders. All current setups resolved.
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {activeSignals.slice(0, 4).map((s) => (
                        <div key={s.id} className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center justify-between gap-3 text-xs">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900">{s.symbol}</span>
                              <Badge className={s.direction === 'BUY' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}>
                                {s.direction}
                              </Badge>
                              <span className="text-[11px] text-slate-400 font-mono">Entry: {s.entry}</span>
                            </div>
                            <div className="text-[11px] text-slate-500 font-mono mt-0.5 flex items-center gap-3">
                              <span className="text-rose-600 font-semibold">SL: {s.stop_loss}</span>
                              <span className="text-emerald-700 font-semibold">TP1: {s.take_profit_1}</span>
                            </div>
                          </div>

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCloseSignal(s)}
                            className="h-7 text-xs text-emerald-700 border-emerald-300 hover:bg-emerald-50 shrink-0"
                          >
                            Close / Outcome
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>

                {/* 2. Real-Time Activity & Audit Stream */}
                <Card className="p-5 space-y-4 bg-white shadow-sm">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <Activity className="h-4 w-4 text-blue-600" />
                      <h3 className="font-bold text-slate-900 text-sm">Real-Time Desk Audit Stream</h3>
                    </div>
                    <Badge variant="secondary" className="text-[10px]">Live Sync</Badge>
                  </div>

                  <div className="space-y-3">
                    {/* Recent Payments */}
                    {payments.slice(0, 3).map((p) => (
                      <div key={p.id} className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition-colors text-xs">
                        <div className={`h-7 w-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                          p.status === 'confirmed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          <DollarSign className="h-3.5 w-3.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-900 truncate">{p.user_email}</span>
                            <span className="font-bold text-slate-900 tabular-nums">${p.amount} USDT</span>
                          </div>
                          <div className="text-[11px] text-slate-400 flex items-center justify-between mt-0.5">
                            <span>{p.network} • {p.plan}</span>
                            <span className={`capitalize font-semibold ${p.status === 'confirmed' ? 'text-emerald-600' : 'text-amber-600'}`}>
                              {p.status}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* Recent Connector Inquiry */}
                    {connectors.slice(0, 2).map((c) => (
                      <div key={c.id} className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition-colors text-xs border-t border-slate-100">
                        <div className="h-7 w-7 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center shrink-0 mt-0.5">
                          <Network className="h-3.5 w-3.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-900 truncate">Connector: {c.account_number} ({c.platform})</span>
                            <Badge variant={c.status === 'connected' ? 'default' : 'secondary'} className="text-[10px]">
                              {c.status}
                            </Badge>
                          </div>
                          <div className="text-[11px] text-slate-400 truncate mt-0.5">
                            {c.user_email} • {c.server}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            </div>
          )}

          {/* ==================== TAB 1: PAYMENTS QUEUE ==================== */}
          {activeTab === 'payments' && !selectedBotId && !selectedUserId && !selectedConnectorId && (
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
                <Card className="p-8 text-center text-slate-500 text-xs bg-white">
                  No payment records matching criteria.
                </Card>
              ) : (
                <div className="space-y-3">
                  <div className="hidden md:block">
                    <Card className="overflow-hidden shadow-sm bg-white">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
                            <tr>
                              <th className="p-3.5">Trader Email</th>
                              <th className="p-3.5">Amount</th>
                              <th className="p-3.5">Network</th>
                              <th className="p-3.5">TxID / Blockchain</th>
                              <th className="p-3.5">Plan</th>
                              <th className="p-3.5">Status</th>
                              <th className="p-3.5 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {filteredPayments.map((p) => (
                              <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                                <td className="p-3.5 font-bold text-slate-900">{p.user_email}</td>
                                <td className="p-3.5 font-black text-slate-900 tabular-nums">${p.amount} USDT</td>
                                <td className="p-3.5 font-mono text-slate-600">{p.network}</td>
                                <td className="p-3.5 font-mono">
                                  {p.txid ? (
                                    <a
                                      href={getExplorerUrl(p.network, p.txid)}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-emerald-700 hover:underline flex items-center gap-1"
                                      title={p.txid}
                                    >
                                      <span>{p.txid.slice(0, 8)}...{p.txid.slice(-6)}</span>
                                      <ExternalLink className="h-3 w-3 shrink-0" />
                                    </a>
                                  ) : (
                                    <span className="text-slate-400">—</span>
                                  )}
                                </td>
                                <td className="p-3.5 font-semibold text-slate-800">{p.plan}</td>
                                <td className="p-3.5">
                                  <Badge variant={p.status === 'confirmed' ? 'default' : p.status === 'pending' ? 'secondary' : 'destructive'}>
                                    {p.status.toUpperCase()}
                                  </Badge>
                                </td>
                                <td className="p-3.5 text-right">
                                  <div className="flex items-center justify-end gap-1.5">
                                    {p.status === 'pending' && (
                                      <>
                                        <Button
                                          size="sm"
                                          onClick={() => handleApprovePayment(p)}
                                          className="h-7 text-xs px-2.5 bg-emerald-600 hover:bg-emerald-700"
                                        >
                                          Approve
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => handleRejectPayment(p)}
                                          className="h-7 text-xs px-2 text-rose-600 hover:bg-rose-50"
                                        >
                                          Reject
                                        </Button>
                                      </>
                                    )}
                                    <button
                                      onClick={() => handleDeletePayment(p.id)}
                                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </Card>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ==================== TAB 2: SIGNALS DESK (Dual-Mode Publisher) ==================== */}
          {activeTab === 'signals' && !selectedBotId && !selectedUserId && !selectedConnectorId && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => setSignalModal({
                      mode: 'create',
                      entryMode: 'chatbox',
                      chatText: 'BUY XAUUSD @ 2724.50\nSL: 2715.00\nTP1: 2735.00\nTP2: 2750.00\nNotes: London liquidity sweep off morning discount',
                      data: {
                        symbol: 'XAUUSD',
                        direction: 'BUY',
                        entry: '2724.50',
                        stop_loss: '2715.00',
                        take_profit_1: '2735.00',
                        take_profit_2: '2750.00',
                        plan_tier: 'PERFECT_SIGNAL_BOX',
                        status: 'active',
                        notes: 'London liquidity sweep off morning discount'
                      }
                    })}
                    className="gap-2 font-bold"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Post Trade Signal (Dual-Mode)</span>
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
                    <Card key={s.id} className="p-4 flex flex-col justify-between space-y-3 shadow-sm bg-white">
                      <div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-base text-slate-900">{s.symbol}</span>
                            <Badge className={isBuy ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-rose-100 text-rose-800 border-rose-300'}>
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

                        <div className="grid grid-cols-2 gap-2 mt-3 text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-100 font-mono">
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
                            <span className="text-xs text-slate-400 font-medium">Archived</span>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setSignalModal({ mode: 'edit', entryMode: 'form', data: s })}
                            className="h-8 text-xs text-slate-600"
                          >
                            Edit
                          </Button>
                        </div>

                        <button
                          onClick={() => handleDeleteSignal(s.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
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

          {/* ==================== TAB 3: TRADING BOTS CATALOG (With Dedicated Bot Detail Page!) ==================== */}
          {activeTab === 'bots' && !selectedBotId && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => setBotModal({
                      mode: 'create',
                      data: {
                        name: '',
                        platform: 'MT5',
                        price: 299,
                        version: 'v1.0',
                        recommended_deposit: '$500+',
                        win_rate: '80%',
                        drawdown: '4.5% Max DD',
                        profit_factor: '2.50 PF',
                        pairs: 'XAUUSD, EURUSD',
                        strategy_type: 'London Breakout',
                        features: 'Auto Lot Sizing\nStop-Loss Protection',
                        image_url: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&auto=format&fit=crop&q=80',
                        description: ''
                      }
                    })}
                    className="gap-2 font-bold"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add Bot to Store</span>
                  </Button>

                  <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs">
                    {['all', 'MT4', 'MT5'].map((pl) => (
                      <button
                        key={pl}
                        onClick={() => setBotPlatformFilter(pl)}
                        className={`px-2.5 py-1 rounded font-semibold capitalize cursor-pointer ${
                          botPlatformFilter === pl ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
                        }`}
                      >
                        {pl === 'all' ? 'All Platforms' : pl}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search bot name, pairs..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-300 text-xs bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredBots.map((bot) => (
                  <Card key={bot.id} className="flex flex-col justify-between shadow-sm bg-white overflow-hidden group">
                    <div>
                      {/* Bot Image Preview */}
                      {bot.image_url ? (
                        <div 
                          className="h-36 w-full relative overflow-hidden bg-slate-900 cursor-pointer"
                          onClick={() => setSelectedBotId(bot.id)}
                        >
                          <img 
                            src={bot.image_url} 
                            alt={bot.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          <div className="absolute top-2.5 left-2.5 flex items-center gap-1">
                            <Badge variant="secondary" className="bg-black/60 text-white backdrop-blur-md">
                              {bot.platform}
                            </Badge>
                          </div>
                        </div>
                      ) : null}

                      <div className="p-4 space-y-2.5">
                        <div 
                          className="cursor-pointer"
                          onClick={() => setSelectedBotId(bot.id)}
                        >
                          <div className="flex items-center justify-between">
                            <h4 className="text-base font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                              {bot.name}
                            </h4>
                            <span className="text-xs text-slate-400 font-mono">Ver {bot.version || 'v2.4'}</span>
                          </div>

                          <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mt-1">
                            {bot.description || 'Automated trading algorithm.'}
                          </p>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-100 font-mono">
                          <div>
                            <div className="text-[10px] text-slate-400">Drawdown</div>
                            <div className="font-bold text-emerald-700 mt-0.5">{bot.drawdown || '4.2% Max DD'}</div>
                          </div>
                          <div>
                            <div className="text-[10px] text-slate-400">Profit Factor</div>
                            <div className="font-bold text-amber-700 mt-0.5">{bot.profit_factor || '2.65 PF'}</div>
                          </div>
                        </div>

                        {bot.pairs && (
                          <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1 truncate">
                            <span className="text-slate-400">Traded:</span>
                            <span className="font-bold text-slate-800">{bot.pairs}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="p-4 pt-3 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
                      <div className="text-base font-black text-slate-900 tabular-nums">
                        ${bot.price} <span className="text-xs font-normal text-slate-500">USDT</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedBotId(bot.id)}
                          className="h-8 text-xs font-semibold"
                        >
                          View Details
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setBotModal({ mode: 'edit', data: bot })}
                          className="h-8 text-xs px-2"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
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

          {/* ==================== DEDICATED BOT DETAIL PAGE ==================== */}
          {activeTab === 'bots' && selectedBotId && currentSelectedBot && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setSelectedBotId(null)}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 cursor-pointer"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Back to Bot Catalog</span>
                </button>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setBotModal({ mode: 'edit', data: currentSelectedBot })}
                    className="text-xs gap-1.5"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                    <span>Edit Bot Parameters</span>
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDeleteBot(currentSelectedBot.id)}
                    className="text-xs text-rose-600 hover:bg-rose-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              {/* Bot Dossier Card */}
              <Card className="overflow-hidden bg-white shadow-sm space-y-6 p-6">
                <div className="grid md:grid-cols-3 gap-6">
                  {/* Hero Photo */}
                  <div className="h-56 md:h-full rounded-2xl overflow-hidden bg-slate-900 border border-slate-200 relative">
                    <img 
                      src={currentSelectedBot.image_url || 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&auto=format&fit=crop&q=80'} 
                      alt={currentSelectedBot.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-3 left-3 flex items-center gap-1.5">
                      <Badge className="bg-black/70 text-white backdrop-blur-md">
                        {currentSelectedBot.platform}
                      </Badge>
                      <Badge className="bg-emerald-600 text-white">
                        {currentSelectedBot.version || 'v2.4'}
                      </Badge>
                    </div>
                  </div>

                  {/* Main Info */}
                  <div className="md:col-span-2 space-y-4">
                    <div>
                      <h2 className="text-2xl font-black text-slate-900">{currentSelectedBot.name}</h2>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                        {currentSelectedBot.description || 'Institutional-grade automated execution algorithm.'}
                      </p>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                        <div className="text-[10px] text-slate-400">Price (USDT)</div>
                        <div className="text-base font-bold text-slate-900 mt-0.5">${currentSelectedBot.price}</div>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                        <div className="text-[10px] text-slate-400">Min Capital</div>
                        <div className="text-base font-bold text-slate-900 mt-0.5">{currentSelectedBot.recommended_deposit || '$500+'}</div>
                      </div>
                      <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                        <div className="text-[10px] text-emerald-700">Drawdown</div>
                        <div className="text-base font-bold text-emerald-800 mt-0.5">{currentSelectedBot.drawdown || '4.2% Max DD'}</div>
                      </div>
                      <div className="p-3 rounded-xl bg-amber-50 border border-amber-200">
                        <div className="text-[10px] text-amber-700">Profit Factor</div>
                        <div className="text-base font-bold text-amber-800 mt-0.5">{currentSelectedBot.profit_factor || '2.65 PF'}</div>
                      </div>
                    </div>

                    {/* Strategy info */}
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                      <div className="font-bold text-slate-900 flex items-center gap-1.5">
                        <Sparkles className="h-4 w-4 text-emerald-600" />
                        <span>Execution Architecture & Strategy</span>
                      </div>
                      <p className="text-slate-600 leading-relaxed">
                        {currentSelectedBot.strategy_type || 'Liquidity sweeps, Asian range breakouts, and London/New York session overlap momentum.'}
                      </p>
                      <div className="pt-1 flex items-center gap-2">
                        <span className="text-slate-400 font-semibold">Traded Pairs:</span>
                        <span className="font-bold text-emerald-700 font-mono">{currentSelectedBot.pairs || 'XAUUSD, EURUSD'}</span>
                      </div>
                    </div>

                    {/* Google Drive EA Download Link */}
                    {currentSelectedBot.download_url && (
                      <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
                        <div className="flex items-center gap-2.5 text-blue-800 font-bold min-w-0">
                          <HardDrive className="h-4 w-4 text-blue-600 shrink-0" />
                          <span className="truncate">Google Drive Package: {currentSelectedBot.download_url}</span>
                        </div>
                        <a
                          href={currentSelectedBot.download_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 text-white font-bold hover:bg-blue-700 transition-colors w-fit text-xs shrink-0"
                        >
                          <span>Open in Drive</span>
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                {/* Algorithmic Features List */}
                {currentSelectedBot.features && (
                  <div className="pt-4 border-t border-slate-100 space-y-2">
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Built-in Risk Rules & Features
                    </h3>
                    <div className="grid sm:grid-cols-2 gap-2 text-xs">
                      {currentSelectedBot.features.split('\n').filter(Boolean).map((f, idx) => (
                        <div key={idx} className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center gap-2 text-slate-700">
                          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                          <span>{f}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* LINKED SIGNALS (Signals matching this bot's pairs) */}
                <div className="pt-4 border-t border-slate-100 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                      <Zap className="h-4 w-4 text-emerald-600" />
                      <span>Linked Live Signals For Bot Pairs ({currentSelectedBot.pairs})</span>
                    </h3>
                    <Badge variant="secondary" className="text-[10px]">Real-Time Feeds</Badge>
                  </div>

                  {signals.filter(s => currentSelectedBot.pairs?.includes(s.symbol)).length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-xl">
                      No live signals currently linked to this bot's pairs.
                    </div>
                  ) : (
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {signals.filter(s => currentSelectedBot.pairs?.includes(s.symbol)).slice(0, 6).map((ls) => (
                        <div key={ls.id} className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-900">{ls.symbol}</span>
                            <Badge className={ls.direction === 'BUY' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}>
                              {ls.direction}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 gap-1 text-[11px] font-mono text-slate-600">
                            <div>Entry: {ls.entry}</div>
                            <div>SL: {ls.stop_loss}</div>
                            <div>TP1: {ls.take_profit_1}</div>
                            <div className="font-bold text-emerald-700">{ls.pnl || 'Active'}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Card>
            </div>
          )}

          {/* ==================== TAB 4: DIRECTIVES FEED ==================== */}
          {activeTab === 'broadcasts' && !selectedBotId && !selectedUserId && !selectedConnectorId && (
            <div className="space-y-4">
              <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Directives & Operational Bulletins</h3>
                  <p className="text-xs text-slate-500">Official memos broadcasted to active subscriber dashboards.</p>
                </div>
                <Button
                  onClick={() => setBroadcastModal({
                    mode: 'create',
                    data: { title: '', body: '', pinned: false, author: currentUser?.name || 'Desk Admin' }
                  })}
                  className="gap-2 font-bold"
                >
                  <Plus className="h-4 w-4" />
                  <span>New Bulletin</span>
                </Button>
              </div>

              <div className="space-y-3">
                {broadcasts.map((b) => (
                  <Card key={b.id} className="p-5 shadow-sm bg-white space-y-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-base font-bold text-slate-900">{b.title}</h4>
                          {b.pinned && (
                            <Badge variant="default" className="text-[10px] gap-1">
                              <Pin className="h-3 w-3" /> Pinned
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-slate-400">
                          By <span className="font-semibold text-slate-600">{b.author || 'Desk'}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleTogglePinBroadcast(b)}
                          className="h-8 text-xs gap-1"
                        >
                          <Pin className="h-3 w-3" />
                          <span>{b.pinned ? 'Unpin' : 'Pin'}</span>
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setBroadcastModal({ mode: 'edit', data: b })}
                          className="h-8 text-xs"
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

                    <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap bg-slate-50 p-3 rounded-xl border border-slate-100">
                      {b.body}
                    </p>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* ==================== TAB 5: RESOURCES, DOWNLOADS & USEFUL LINKS ==================== */}
          {activeTab === 'resources' && !selectedBotId && !selectedUserId && !selectedConnectorId && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => setResourceModal({
                      mode: 'create',
                      data: {
                        title: '',
                        category: 'software',
                        url: '',
                        description: '',
                        icon: 'download',
                        badge: 'v2.4 Production',
                        sort_order: 1,
                        is_active: true
                      }
                    })}
                    className="gap-2 font-bold"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add Resource / Download</span>
                  </Button>

                  <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs">
                    {[
                      { id: 'all', label: `All (${resources.length})` },
                      { id: 'software', label: 'Software/EAs' },
                      { id: 'useful_link', label: 'Brokers/VPS' },
                      { id: 'social', label: 'Socials' },
                    ].map((c) => (
                      <button
                        key={c.id}
                        onClick={() => setResourceCategoryFilter(c.id)}
                        className={`px-2.5 py-1 rounded font-semibold cursor-pointer ${
                          resourceCategoryFilter === c.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
                        }`}
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search title, URL..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-300 text-xs bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {filteredResources.map((res) => (
                  <Card key={res.id} className="p-4 shadow-sm bg-white flex flex-col justify-between space-y-3">
                    <div>
                      <div className="flex items-center justify-between">
                        <Badge variant="secondary" className="capitalize text-[10px]">
                          {res.category.replace('_', ' ')}
                        </Badge>
                        <button
                          onClick={() => handleToggleResourceActive(res)}
                          className={`text-[10px] px-2 py-0.5 rounded font-bold cursor-pointer ${
                            res.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {res.is_active ? 'Active' : 'Disabled'}
                        </button>
                      </div>

                      <h4 className="text-base font-bold text-slate-900 mt-2">{res.title}</h4>
                      <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                        {res.description || 'Official resource provided by AKG ALGO.'}
                      </p>

                      <div className="mt-3 p-2 rounded bg-slate-50 border border-slate-100 font-mono text-[11px] text-slate-600 truncate flex items-center justify-between">
                        <span className="truncate">{res.url}</span>
                        <a 
                          href={res.url} 
                          target="_blank" 
                          rel="noreferrer"
                          className="text-emerald-700 hover:text-emerald-900 p-1"
                        >
                          <ExternalLink className="h-3 w-3 shrink-0" />
                        </a>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-xs text-slate-400 font-mono">Badge: {res.badge || '—'}</span>
                      <div className="flex items-center gap-1.5">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setResourceModal({ mode: 'edit', data: res })}
                          className="h-7 text-xs px-2"
                        >
                          <Edit3 className="h-3 w-3" />
                        </Button>
                        <button
                          onClick={() => handleDeleteResource(res.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* ==================== TAB 6: TRADERS & ACCESS (With Dedicated User Dossier) ==================== */}
          {activeTab === 'users' && !selectedUserId && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Member Accounts & Access Rights</h3>
                  <p className="text-xs text-slate-500">Click any trader to open their complete subscription and payment profile.</p>
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

              <Card className="overflow-hidden shadow-sm bg-white">
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
                              <button
                                onClick={() => setSelectedUserId(u.id)}
                                className="text-left group cursor-pointer"
                              >
                                <div className="font-bold text-slate-900 group-hover:text-emerald-700">{u.name || 'Unnamed Trader'}</div>
                                <div className="text-[11px] text-slate-500">{u.email}</div>
                              </button>
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
                                  onClick={() => setSelectedUserId(u.id)}
                                  className="h-7 text-xs px-2 text-slate-600"
                                >
                                  View Dossier
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

          {/* ==================== DEDICATED USER DOSSIER PAGE ==================== */}
          {activeTab === 'users' && selectedUserId && currentSelectedUser && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setSelectedUserId(null)}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 cursor-pointer"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Back to Traders List</span>
                </button>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleGrantDays(currentSelectedUser, 30)}
                    className="text-xs text-emerald-700 border-emerald-300"
                  >
                    +30 Days Extension
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setUserModal({ data: currentSelectedUser })}
                    className="text-xs"
                  >
                    Edit Access Rights
                  </Button>
                </div>
              </div>

              {/* Trader Identity Card */}
              <div className="grid md:grid-cols-3 gap-6">
                <Card className="p-5 bg-white shadow-sm space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-xl bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-base">
                      {currentSelectedUser.email.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-slate-900">{currentSelectedUser.name || 'Trader Account'}</h3>
                      <p className="text-xs text-slate-500">{currentSelectedUser.email}</p>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Account Role</span>
                      <Badge variant={currentSelectedUser.role === 'admin' ? 'default' : 'secondary'}>
                        {currentSelectedUser.role.toUpperCase()}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Active Plan</span>
                      <span className="font-bold text-slate-900">{currentSelectedUser.plan || 'NONE'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Cycle Status</span>
                      <span className="font-bold text-emerald-700">
                        {formatExpiry(currentSelectedUser.cycle_expires_at).text}
                      </span>
                    </div>
                  </div>
                </Card>

                {/* Specific Payments For This Trader */}
                <Card className="md:col-span-2 p-5 bg-white shadow-sm space-y-3">
                  <h3 className="font-bold text-sm text-slate-900">Payment & Subscription Transactions</h3>
                  {payments.filter(p => p.user_email === currentSelectedUser.email).length === 0 ? (
                    <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 rounded-xl">
                      No payment transactions recorded for this user.
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100 text-xs">
                      {payments.filter(p => p.user_email === currentSelectedUser.email).map((p) => (
                        <div key={p.id} className="py-2.5 flex items-center justify-between gap-3">
                          <div>
                            <div className="font-bold text-slate-900">${p.amount} USDT ({p.plan})</div>
                            <div className="text-[11px] text-slate-400 font-mono">{p.network} • {p.txid?.slice(0, 10)}...</div>
                          </div>
                          <Badge variant={p.status === 'confirmed' ? 'default' : 'secondary'}>
                            {p.status.toUpperCase()}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              </div>
            </div>
          )}

          {/* ==================== TAB 7: CONNECTOR DEMOS (With Dedicated Connector Detail Page & Interactive Sync!) ==================== */}
          {activeTab === 'connectors' && !selectedConnectorId && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Connector Demo Inquiries & Bridge Links</h3>
                  <p className="text-xs text-slate-500">Live two-way sync: changing status or notes here immediately updates the user's dashboard.</p>
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="font-mono text-xs">
                    {pendingConnectors.length} Pending Review
                  </Badge>
                </div>
              </div>

              {connectors.length === 0 ? (
                <Card className="p-8 text-center text-slate-500 text-xs bg-white">
                  No connector demo inquiries logged in database.
                </Card>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {connectors.map((c) => {
                    const isConnected = c.status === 'connected';
                    const isInProgress = c.status === 'in_progress';

                    return (
                      <Card key={c.id} className="p-5 space-y-4 shadow-sm bg-white">
                        <div className="flex items-center justify-between">
                          <button
                            onClick={() => setSelectedConnectorId(c.id)}
                            className="font-bold text-sm text-slate-900 hover:text-emerald-700 text-left cursor-pointer"
                          >
                            {c.user_email}
                          </button>
                          <Badge variant={isConnected ? 'default' : isInProgress ? 'secondary' : 'outline'}>
                            {c.status.toUpperCase()}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-3 gap-2 text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-100 font-mono">
                          <div>
                            <div className="text-[10px] text-slate-400">Platform</div>
                            <div className="font-bold text-slate-900 mt-0.5">{c.platform}</div>
                          </div>
                          <div>
                            <div className="text-[10px] text-slate-400">Account #</div>
                            <div className="font-bold text-slate-900 mt-0.5">{c.account_number}</div>
                          </div>
                          <div>
                            <div className="text-[10px] text-slate-400">Server</div>
                            <div className="text-slate-700 mt-0.5 truncate">{c.server}</div>
                          </div>
                        </div>

                        {c.admin_notes && (
                          <div className="p-2 rounded bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
                            <span className="font-bold">Desk Note: </span>
                            <span>{c.admin_notes}</span>
                          </div>
                        )}

                        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setSelectedConnectorId(c.id)}
                            className="h-7 text-xs text-slate-600"
                          >
                            Open Bridge Dossier
                          </Button>

                          <div className="flex items-center gap-1.5">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleUpdateConnectorStatus(c.id, 'in_progress', 'Admin configuring Equinix LD4 bridge latency test.')}
                              className="h-7 text-xs text-blue-700 border-blue-300"
                            >
                              Configuring
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleUpdateConnectorStatus(c.id, 'connected', 'Bridge connected on Equinix LD4. Sub-millisecond latency active.')}
                              className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700"
                            >
                              Connect
                            </Button>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ==================== DEDICATED CONNECTOR DETAIL PAGE ==================== */}
          {activeTab === 'connectors' && selectedConnectorId && currentSelectedConnector && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setSelectedConnectorId(null)}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 cursor-pointer"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Back to Connector Demose</span>
                </button>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Account Details & Status Controls */}
                <Card className="p-6 bg-white shadow-sm space-y-5">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div>
                      <h3 className="font-bold text-base text-slate-900">Bridge Dossier: {currentSelectedConnector.account_number}</h3>
                      <p className="text-xs text-slate-500">{currentSelectedConnector.user_email}</p>
                    </div>
                    <Badge variant={currentSelectedConnector.status === 'connected' ? 'default' : 'secondary'}>
                      {currentSelectedConnector.status.toUpperCase()}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-3 font-mono text-xs">
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                      <div className="text-[10px] text-slate-400">Platform</div>
                      <div className="font-bold text-slate-900 mt-1">{currentSelectedConnector.platform}</div>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                      <div className="text-[10px] text-slate-400">Account Number</div>
                      <div className="font-bold text-slate-900 mt-1">{currentSelectedConnector.account_number}</div>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                      <div className="text-[10px] text-slate-400">Broker Server</div>
                      <div className="font-bold text-slate-900 mt-1 truncate">{currentSelectedConnector.server}</div>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                      <div className="text-[10px] text-slate-400">Configured Leverage</div>
                      <div className="font-bold text-slate-900 mt-1">{currentSelectedConnector.leverage || '1:100'}</div>
                    </div>
                  </div>

                  {/* Interactive Status Switcher (Syncs to User Instantly) */}
                  <div className="space-y-2 pt-3 border-t border-slate-100">
                    <label className="block text-xs font-bold text-slate-900">
                      Interactive Status Controller (Two-Way Real-Time Sync)
                    </label>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <Button
                        size="sm"
                        variant={currentSelectedConnector.status === 'in_progress' ? 'default' : 'outline'}
                        onClick={() => handleUpdateConnectorStatus(
                          currentSelectedConnector.id, 
                          'in_progress', 
                          'Admin reviewed credentials and is testing Equinix LD4 gateway routing.'
                        )}
                        className="text-xs font-semibold justify-center"
                      >
                        🔵 Mark In Progress
                      </Button>
                      <Button
                        size="sm"
                        variant={currentSelectedConnector.status === 'connected' ? 'default' : 'outline'}
                        onClick={() => handleUpdateConnectorStatus(
                          currentSelectedConnector.id, 
                          'connected', 
                          'Bridge active on Equinix LD4 Slough. IPC packet routing verified (0.8ms).'
                        )}
                        className="text-xs font-semibold justify-center bg-emerald-600 hover:bg-emerald-700 text-white"
                      >
                        🟢 Mark Connected
                      </Button>
                      <Button
                        size="sm"
                        variant={currentSelectedConnector.status === 'pending_review' ? 'default' : 'outline'}
                        onClick={() => handleUpdateConnectorStatus(
                          currentSelectedConnector.id, 
                          'pending_review', 
                          'Account queued for desk review.'
                        )}
                        className="text-xs font-semibold justify-center"
                      >
                        🟡 Reset Pending
                      </Button>
                      <Button
                        size="sm"
                        variant={currentSelectedConnector.status === 'rejected' ? 'default' : 'outline'}
                        onClick={() => handleUpdateConnectorStatus(
                          currentSelectedConnector.id, 
                          'rejected', 
                          'Could not establish broker connection. Invalid server or credentials.'
                        )}
                        className="text-xs font-semibold justify-center text-rose-600 border-rose-300"
                      >
                        🔴 Reject Bridge
                      </Button>
                    </div>
                  </div>
                </Card>

                {/* Desk Notes & Live User View Simulation */}
                <Card className="p-6 bg-white shadow-sm space-y-4">
                  <div className="border-b border-slate-100 pb-2">
                    <h3 className="font-bold text-sm text-slate-900">Custom Desk Note (Visible to User in Real-Time)</h3>
                    <p className="text-xs text-slate-500">Trader sees this message on their Connector tab immediately.</p>
                  </div>

                  <div className="space-y-3">
                    <textarea
                      rows={4}
                      defaultValue={currentSelectedConnector.admin_notes || ''}
                      id="customAdminNoteInput"
                      className="w-full rounded-xl border border-slate-300 p-3 text-xs text-slate-900 font-mono focus:border-emerald-600 focus:outline-none"
                      placeholder="e.g. Connected to ICMarketsSC-Live02 cross-connect. Execution active."
                    />

                    <Button
                      size="sm"
                      onClick={() => {
                        const note = document.getElementById('customAdminNoteInput')?.value;
                        handleUpdateConnectorStatus(currentSelectedConnector.id, currentSelectedConnector.status, note);
                      }}
                      className="w-full justify-center text-xs font-bold"
                    >
                      Save & Transmit Note to User
                    </Button>
                  </div>

                  {/* Live Simulation of what User Sees */}
                  <div className="mt-4 p-4 rounded-xl bg-slate-900 text-white font-mono text-xs space-y-2">
                    <div className="text-[10px] text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Terminal className="h-3 w-3 text-emerald-400" />
                      <span>Live User Screen Preview</span>
                    </div>
                    <div className="p-2.5 rounded bg-black/50 border border-white/10 space-y-1">
                      <div className="flex items-center justify-between text-[#00D878] font-bold">
                        <span>Account #{currentSelectedConnector.account_number}</span>
                        <span>{currentSelectedConnector.status.toUpperCase()}</span>
                      </div>
                      <div className="text-slate-400 text-[11px]">
                        "{currentSelectedConnector.admin_notes || 'No note set'}"
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* =========================================================================
          MODALS
      ========================================================================= */}

      {/* ===================== MODAL: DUAL-MODE SIGNAL PUBLISHER ===================== */}
      {signalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <Card className="w-full max-w-xl shadow-2xl bg-white overflow-hidden">
            <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Zap className="h-4 w-4 text-emerald-600" />
                  <span>{signalModal.mode === 'create' ? 'Post New Trade Signal' : 'Edit Trade Signal'}</span>
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Switch between structured parameters and fast WhatsApp / Telegram chatbox parsing.
                </CardDescription>
              </div>
              <button 
                onClick={() => setSignalModal(null)} 
                className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </CardHeader>

            {/* Mode Switcher Tabs */}
            <div className="px-6 pt-3 flex items-center gap-2 border-b border-slate-100 bg-slate-50/50">
              <button
                type="button"
                onClick={() => setSignalModal({ ...signalModal, entryMode: 'chatbox' })}
                className={`pb-2.5 px-3 text-xs font-bold border-b-2 cursor-pointer transition-all flex items-center gap-1.5 ${
                  signalModal.entryMode === 'chatbox'
                    ? 'border-emerald-600 text-emerald-700'
                    : 'border-transparent text-slate-400 hover:text-slate-700'
                }`}
              >
                <MessageSquare className="h-3.5 w-3.5" />
                <span>WhatsApp / Chatbox Mode</span>
              </button>
              <button
                type="button"
                onClick={() => setSignalModal({ ...signalModal, entryMode: 'form' })}
                className={`pb-2.5 px-3 text-xs font-bold border-b-2 cursor-pointer transition-all flex items-center gap-1.5 ${
                  signalModal.entryMode === 'form'
                    ? 'border-emerald-600 text-emerald-700'
                    : 'border-transparent text-slate-400 hover:text-slate-700'
                }`}
              >
                <Layers className="h-3.5 w-3.5" />
                <span>Structured Form Mode</span>
              </button>
            </div>

            {/* Mode A: WhatsApp / Chatbox Mode */}
            {signalModal.entryMode === 'chatbox' ? (
              <div className="p-6 space-y-4 text-xs font-sans">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-semibold text-slate-700">Type or Paste Signal Message</label>
                    <span className="text-[10px] text-slate-400 font-mono">Format: Symbol, Entry, SL, TP</span>
                  </div>
                  <textarea
                    rows={6}
                    value={signalModal.chatText || ''}
                    onChange={(e) => setSignalModal({ ...signalModal, chatText: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 p-3 font-mono text-xs text-slate-900 focus:border-emerald-600 focus:outline-none leading-relaxed bg-slate-50/50"
                    placeholder={`BUY XAUUSD @ 2724.50\nSL: 2715.00\nTP1: 2735.00\nTP2: 2750.00\nNotes: London liquidity sweep retest`}
                  />
                </div>

                {/* Live Parsed Preview */}
                {(() => {
                  const parsed = parseSignalChatText(signalModal.chatText);
                  if (!parsed) return null;

                  return (
                    <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-2">
                      <div className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                        <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
                        <span>Real-Time Parser Extraction</span>
                      </div>
                      <div className="grid grid-cols-4 gap-2 font-mono text-[11px]">
                        <div>Symbol: <span className="font-bold text-slate-900">{parsed.symbol}</span></div>
                        <div>Side: <span className="font-bold text-emerald-700">{parsed.direction}</span></div>
                        <div>Entry: <span className="font-bold text-slate-900">{parsed.entry || '—'}</span></div>
                        <div>SL: <span className="font-bold text-rose-700">{parsed.stop_loss || '—'}</span></div>
                        <div>TP1: <span className="font-bold text-emerald-700">{parsed.take_profit_1 || '—'}</span></div>
                        <div>TP2: <span className="font-bold text-emerald-700">{parsed.take_profit_2 || '—'}</span></div>
                      </div>
                    </div>
                  );
                })()}

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleBroadcastChatMessage}
                    className="text-xs text-blue-700 border-blue-300 gap-1.5"
                  >
                    <Send className="h-3.5 w-3.5" />
                    <span>Send as Chat Directive Message</span>
                  </Button>

                  <div className="flex items-center gap-2">
                    <Button type="button" variant="outline" onClick={() => setSignalModal(null)}>
                      Cancel
                    </Button>
                    <Button type="button" onClick={handleSaveSignal} className="font-bold gap-1.5">
                      <Zap className="h-3.5 w-3.5" />
                      <span>Broadcast as Trade Signal</span>
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              /* Mode B: Structured Form Mode */
              <form onSubmit={handleSaveSignal}>
                <CardContent className="space-y-3.5 pt-4 text-xs font-sans">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">Pair / Symbol</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. XAUUSD"
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
                      rows={2}
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
            )}
          </Card>
        </div>
      )}

      {/* ===================== MODAL: BOT CRUD (With Photo & Parameters) ===================== */}
      {botModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <Card className="w-full max-w-xl shadow-2xl bg-white my-8">
            <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
              <CardTitle className="text-base font-bold text-slate-900">
                {botModal.mode === 'create' ? 'Add Bot to Catalog' : 'Edit Bot Settings & Photos'}
              </CardTitle>
              <button onClick={() => setBotModal(null)} className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </CardHeader>

            <form onSubmit={handleSaveBot}>
              <CardContent className="space-y-3.5 pt-4 text-xs font-sans">
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
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-emerald-600 focus:outline-none cursor-pointer"
                    >
                      <option value="MT5">MetaTrader 5 (MT5)</option>
                      <option value="MT4">MetaTrader 4 (MT4)</option>
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

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Max Drawdown</label>
                    <input
                      type="text"
                      placeholder="e.g. 4.2% Max DD"
                      value={botModal.data.drawdown || ''}
                      onChange={(e) => setBotModal({
                        ...botModal,
                        data: { ...botModal.data, drawdown: e.target.value }
                      })}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-emerald-600 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Profit Factor</label>
                    <input
                      type="text"
                      placeholder="e.g. 2.65 PF"
                      value={botModal.data.profit_factor || ''}
                      onChange={(e) => setBotModal({
                        ...botModal,
                        data: { ...botModal.data, profit_factor: e.target.value }
                      })}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-emerald-600 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Traded Pairs</label>
                    <input
                      type="text"
                      placeholder="e.g. XAUUSD, EURUSD"
                      value={botModal.data.pairs || ''}
                      onChange={(e) => setBotModal({
                        ...botModal,
                        data: { ...botModal.data, pairs: e.target.value.toUpperCase() }
                      })}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 font-bold focus:border-emerald-600 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Bot Picture: Upload from Device or Paste Link */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-slate-700 font-bold text-xs">Bot Picture / Main Photo</label>
                    <span className="text-[10px] text-slate-400">Upload from camera/library or paste link</span>
                  </div>

                  {botModal.data.image_url ? (
                    <div className="relative rounded-xl overflow-hidden h-36 bg-slate-900 border border-slate-300">
                      <img 
                        src={botModal.data.image_url} 
                        alt="Bot Preview" 
                        className="w-full h-full object-cover" 
                      />
                      <button
                        type="button"
                        onClick={() => setBotModal(prev => ({
                          ...prev,
                          data: { ...prev.data, image_url: '' }
                        }))}
                        className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/70 text-white hover:bg-black/90 cursor-pointer"
                        title="Remove Photo"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : null}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <label 
                      htmlFor="adminDeviceBotPhotoInput"
                      className="flex items-center justify-center gap-2 p-3 rounded-xl border border-dashed border-emerald-400 bg-emerald-50/50 hover:bg-emerald-50 cursor-pointer text-emerald-800 font-bold transition-all text-xs"
                    >
                      <Camera className="h-4 w-4 text-emerald-600" />
                      <span>Upload from Device / Gallery</span>
                      <input 
                        type="file" 
                        id="adminDeviceBotPhotoInput" 
                        accept="image/*" 
                        onChange={handleDeviceImageUpload}
                        className="hidden" 
                      />
                    </label>

                    <input
                      type="url"
                      placeholder="Or paste external image URL..."
                      value={botModal.data.image_url || ''}
                      onChange={(e) => setBotModal({
                        ...botModal,
                        data: { ...botModal.data, image_url: e.target.value }
                      })}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 text-xs focus:border-emerald-600 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Google Drive / Cloud EA Download Link */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-slate-700 font-bold text-xs flex items-center gap-1.5">
                      <HardDrive className="h-3.5 w-3.5 text-blue-600" />
                      <span>Google Drive / Cloud EA Download Link</span>
                    </label>
                    <span className="text-[10px] text-slate-400 font-mono">Folder or .ex4/.ex5 setup link</span>
                  </div>
                  <input
                    type="url"
                    placeholder="https://drive.google.com/drive/folders/... or direct link"
                    value={botModal.data.download_url || ''}
                    onChange={(e) => setBotModal({
                      ...botModal,
                      data: { ...botModal.data, download_url: e.target.value }
                    })}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 font-mono text-xs focus:border-emerald-600 focus:outline-none"
                  />
                  <p className="text-[10px] text-slate-400">
                    Traders who unlock licenses can download the EA from this Google Drive link.
                  </p>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Strategy Description</label>
                  <textarea
                    rows={2}
                    value={botModal.data.description}
                    onChange={(e) => setBotModal({
                      ...botModal,
                      data: { ...botModal.data, description: e.target.value }
                    })}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-emerald-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Features (One per line)</label>
                  <textarea
                    rows={2}
                    placeholder="Auto Dynamic Lot Sizing&#10;Spread Guard&#10;Fixed Hard Stop-Loss"
                    value={botModal.data.features || ''}
                    onChange={(e) => setBotModal({
                      ...botModal,
                      data: { ...botModal.data, features: e.target.value }
                    })}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 font-mono text-xs focus:border-emerald-600 focus:outline-none"
                  />
                </div>
              </CardContent>

              <CardFooter className="border-t border-slate-100 pt-3 flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setBotModal(null)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {botModal.mode === 'create' ? 'Add Bot to Store' : 'Save Changes'}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      )}

      {/* ===================== MODAL: ANNOUNCEMENT ===================== */}
      {broadcastModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <Card className="w-full max-w-lg shadow-2xl bg-white">
            <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
              <CardTitle className="text-base font-bold text-slate-900">
                {broadcastModal.mode === 'create' ? 'Compose Directive Bulletin' : 'Edit Directive'}
              </CardTitle>
              <button onClick={() => setBroadcastModal(null)} className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </CardHeader>

            <form onSubmit={handleSaveBroadcast}>
              <CardContent className="space-y-4 pt-4 text-xs font-sans">
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

      {/* ===================== MODAL: RESOURCE CRUD (Links & Downloads) ===================== */}
      {resourceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <Card className="w-full max-w-lg shadow-2xl bg-white">
            <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
              <CardTitle className="text-base font-bold text-slate-900">
                {resourceModal.mode === 'create' ? 'Add Member Resource / Link' : 'Edit Resource'}
              </CardTitle>
              <button onClick={() => setResourceModal(null)} className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </CardHeader>

            <form onSubmit={handleSaveResource}>
              <CardContent className="space-y-3.5 pt-4 text-xs font-sans">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Resource Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. AKG Bridge Connector EA (MT5)"
                    value={resourceModal.data.title}
                    onChange={(e) => setResourceModal({
                      ...resourceModal,
                      data: { ...resourceModal.data, title: e.target.value }
                    })}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 font-bold focus:border-emerald-600 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Category</label>
                    <select
                      value={resourceModal.data.category}
                      onChange={(e) => setResourceModal({
                        ...resourceModal,
                        data: { ...resourceModal.data, category: e.target.value }
                      })}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-emerald-600 focus:outline-none cursor-pointer"
                    >
                      <option value="software">Software / EA Download</option>
                      <option value="useful_link">Useful Broker / VPS Link</option>
                      <option value="social">Social Media Channel</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Badge Tag</label>
                    <input
                      type="text"
                      placeholder="e.g. v2.4.1 Production"
                      value={resourceModal.data.badge || ''}
                      onChange={(e) => setResourceModal({
                        ...resourceModal,
                        data: { ...resourceModal.data, badge: e.target.value }
                      })}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-emerald-600 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Destination URL or Download Path</label>
                  <input
                    type="text"
                    required
                    placeholder="https://t.me/... or /downloads/AKG_Bridge.ex5"
                    value={resourceModal.data.url}
                    onChange={(e) => setResourceModal({
                      ...resourceModal,
                      data: { ...resourceModal.data, url: e.target.value }
                    })}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 font-mono focus:border-emerald-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Description</label>
                  <textarea
                    rows={2}
                    placeholder="Explain resource and onboarding purpose..."
                    value={resourceModal.data.description || ''}
                    onChange={(e) => setResourceModal({
                      ...resourceModal,
                      data: { ...resourceModal.data, description: e.target.value }
                    })}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-emerald-600 focus:outline-none"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="resourceActiveToggle"
                    checked={resourceModal.data.is_active}
                    onChange={(e) => setResourceModal({
                      ...resourceModal,
                      data: { ...resourceModal.data, is_active: e.target.checked }
                    })}
                    className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-600 cursor-pointer"
                  />
                  <label htmlFor="resourceActiveToggle" className="text-slate-700 font-semibold cursor-pointer">
                    Publish actively to user onboarding / resources kit
                  </label>
                </div>
              </CardContent>

              <CardFooter className="border-t border-slate-100 pt-3 flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setResourceModal(null)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {resourceModal.mode === 'create' ? 'Add Resource' : 'Save Changes'}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      )}

      {/* ===================== MODAL: EDIT USER ACCESS ===================== */}
      {userModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <Card className="w-full max-w-md shadow-2xl bg-white">
            <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold text-slate-900">Edit Trader Access</CardTitle>
                <CardDescription className="text-xs text-slate-500">{userModal.data.email}</CardDescription>
              </div>
              <button onClick={() => setUserModal(null)} className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </CardHeader>

            <form onSubmit={handleSaveUser}>
              <CardContent className="space-y-4 pt-4 text-xs font-sans">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Subscription Plan</label>
                  <select
                    value={userModal.data.plan || 'NONE'}
                    onChange={(e) => setUserModal({
                      ...userModal,
                      data: { ...userModal.data, plan: e.target.value }
                    })}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-emerald-600 focus:outline-none cursor-pointer"
                  >
                    <option value="NONE">No Subscription (Free Access)</option>
                    <option value="SR_SIGNAL_BOX">SR Signal Box ($10 Tier)</option>
                    <option value="PERFECT_SIGNAL_BOX">Perfect Signal Box ($20 VIP Tier)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Account Role</label>
                  <select
                    value={userModal.data.role}
                    onChange={(e) => setUserModal({
                      ...userModal,
                      data: { ...userModal.data, role: e.target.value }
                    })}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-emerald-600 focus:outline-none cursor-pointer"
                  >
                    <option value="user">Trader (Standard User)</option>
                    <option value="admin">Administrator (Executive Access)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Cycle Expiration (ISO Date)</label>
                  <input
                    type="text"
                    placeholder="YYYY-MM-DDTHH:mm:ss.sssZ"
                    value={userModal.data.cycle_expires_at || ''}
                    onChange={(e) => setUserModal({
                      ...userModal,
                      data: { ...userModal.data, cycle_expires_at: e.target.value }
                    })}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 font-mono focus:border-emerald-600 focus:outline-none"
                  />
                </div>
              </CardContent>

              <CardFooter className="border-t border-slate-100 pt-3 flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setUserModal(null)}>
                  Cancel
                </Button>
                <Button type="submit">
                  Save Access Rights
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
