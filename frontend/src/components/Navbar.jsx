import React, { useEffect } from 'react';
import { pb } from '../lib/pocketbase';
import { 
  Shield, Zap, User, LogOut, Terminal, Bell, Cpu, 
  BarChart3, Network, CreditCard, Compass, ExternalLink 
} from 'lucide-react';

export function Navbar({ activeTab, setActiveTab, user, onOpenAuth }) {
  const handleLogout = () => {
    pb.authStore.clear();
    window.location.reload();
  };

  const navItems = [
    { id: 'home', label: 'Overview', icon: Compass, shortcut: '1' },
    { id: 'signals', label: 'Signals Feed', icon: Zap, badge: 'LIVE', shortcut: '2' },
    { id: 'bots', label: 'Trading Bots', icon: Cpu, shortcut: '3' },
    { id: 'charts', label: 'Live Charts', icon: BarChart3, shortcut: '4' },
    { id: 'connector', label: 'Connector Demo', icon: Network, shortcut: '5' },
    { id: 'broadcasts', label: 'Directives', icon: Bell, shortcut: '6' },
    { id: 'pricing', label: 'Plans & Pricing', icon: CreditCard, shortcut: '7' },
    ...(user?.role === 'admin' ? [{ id: 'admin', label: 'Admin Desk', icon: Shield, badge: 'CRUD', shortcut: '8' }] : []),
  ];

  // Optional keyboard navigation (1-8)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      const keyMap = {
        '1': 'home',
        '2': 'signals',
        '3': 'bots',
        '4': 'charts',
        '5': 'connector',
        '6': 'broadcasts',
        '7': 'pricing',
        '8': user?.role === 'admin' ? 'admin' : null,
      };
      if (keyMap[e.key]) {
        setActiveTab(keyMap[e.key]);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [user, setActiveTab]);

  return (
    <header className="border-b border-border bg-[#05070D]/95 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <div 
          onClick={() => setActiveTab('home')}
          className="flex items-center gap-3 cursor-pointer group select-none shrink-0"
        >
          <div className="relative">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-600/20 to-cyan-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 group-hover:border-blue-400 transition-all shadow-glow-blue">
              <Terminal className="h-5 w-5" />
            </div>
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 border border-[#05070D]"></span>
            </span>
          </div>

          <div>
            <div className="font-mono font-extrabold text-base tracking-wider text-white flex items-center gap-2">
              AKG ALGO
              <span className="text-[10px] font-bold text-blue-300 bg-blue-500/15 px-2 py-0.5 rounded-full border border-blue-500/30">
                PRO
              </span>
            </div>
            <div className="text-[10px] text-slate-400 font-mono tracking-tight hidden sm:block">
              Institutional Precision Systems
            </div>
          </div>
        </div>

        {/* Desktop Tabs */}
        <nav className="hidden xl:flex items-center gap-1 font-mono text-xs">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`px-3 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer relative ${
                  isActive
                    ? 'bg-blue-600/15 text-blue-300 border border-blue-500/30 font-bold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
                }`}
                title={`Shortcut: ${item.shortcut}`}
              >
                <Icon className={`h-3.5 w-3.5 ${isActive ? 'text-blue-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
                {item.badge && (
                  <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold uppercase ${
                    item.badge === 'LIVE' 
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}>
                    {item.badge}
                  </span>
                )}
                {isActive && (
                  <span className="absolute -bottom-[1px] left-3 right-3 h-[2px] bg-gradient-to-r from-transparent via-blue-400 to-transparent"></span>
                )}
              </button>
            );
          })}
        </nav>

        {/* User Status & Auth Area */}
        <div className="flex items-center gap-3 font-mono">
          {user ? (
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-xs font-semibold text-slate-200 flex items-center gap-1.5 justify-end">
                  {user.role === 'admin' && (
                    <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[10px] font-bold">
                      👑 ADMIN
                    </span>
                  )}
                  <span>{user.name || user.email.split('@')[0]}</span>
                </div>
                <div className="text-[10px] text-emerald-400 uppercase tracking-wider">
                  {user.role === 'admin' ? '● Executive Desk' : `● ${user.plan || 'Free Member'}`}
                </div>
              </div>

              {user.role === 'admin' && activeTab !== 'admin' && (
                <button
                  onClick={() => setActiveTab('admin')}
                  className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold hover:bg-amber-500/20 transition-all cursor-pointer shadow-glow-amber"
                >
                  <Shield className="h-3.5 w-3.5" />
                  Admin
                </button>
              )}

              <button
                onClick={handleLogout}
                className="h-9 w-9 rounded-xl border border-border bg-card flex items-center justify-center text-slate-400 hover:text-rose-400 hover:border-rose-500/40 transition-colors cursor-pointer"
                title="Sign Out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-md shadow-blue-600/30 transition-all cursor-pointer"
            >
              <Zap className="h-3.5 w-3.5" />
              Sign In / 1-Click
            </button>
          )}
        </div>
      </div>

      {/* Mobile & Tablet Nav Strip */}
      <div className="xl:hidden flex items-center gap-1 px-3 py-2 overflow-x-auto border-t border-border text-xs font-mono bg-[#05070D]">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                isActive
                  ? 'bg-blue-600 text-white font-bold shadow'
                  : 'text-slate-400 bg-slate-800/60 hover:text-white'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {item.label}
            </button>
          );
        })}
      </div>
    </header>
  );
}
