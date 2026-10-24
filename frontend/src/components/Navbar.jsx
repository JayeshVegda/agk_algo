import React, { useEffect } from 'react';
import { pb } from '../lib/pocketbase';
import { 
  Shield, Zap, User, LogOut, Terminal, Bell, Cpu, 
  BarChart3, Network, CreditCard, Compass 
} from 'lucide-react';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';

export function Navbar({ activeTab, setActiveTab, user, onOpenAuth, onNavigateAdmin }) {
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
    <header className="border-b border-slate-200 bg-white/95 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <div 
          onClick={() => setActiveTab('home')}
          className="flex items-center gap-3 cursor-pointer group select-none shrink-0"
        >
          <div className="relative">
            <div className="h-10 w-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 group-hover:border-emerald-400 group-hover:bg-emerald-100 transition-all shadow-sm">
              <Terminal className="h-5 w-5" />
            </div>
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-600 border border-white"></span>
            </span>
          </div>

          <div>
            <div className="font-extrabold text-base tracking-tight text-slate-900 flex items-center gap-2">
              AKG ALGO
              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200">
                PRO
              </span>
            </div>
            <div className="text-[11px] text-slate-500 hidden sm:block">
              Algorithmic Trading Systems
            </div>
          </div>
        </div>

        {/* Desktop Tabs */}
        <nav className="hidden xl:flex items-center gap-1 text-xs">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`px-3 py-2 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer relative ${
                  isActive
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-transparent'
                }`}
                title={`Shortcut: ${item.shortcut}`}
              >
                <Icon className={`h-3.5 w-3.5 ${isActive ? 'text-emerald-700' : 'text-slate-500'}`} />
                <span>{item.label}</span>
                {item.badge && (
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase ${
                    item.badge === 'LIVE' 
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                      : 'bg-amber-100 text-amber-800 border border-amber-300'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* User Status & Auth Area */}
        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-xs font-semibold text-slate-800 flex items-center gap-1.5 justify-end">
                  {user.role === 'admin' && (
                    <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-100 border border-amber-300 text-amber-900 text-[10px] font-bold">
                      ADMIN
                    </span>
                  )}
                  <span>{user.name || user.email.split('@')[0]}</span>
                </div>
                <div className="text-[10px] text-emerald-700 uppercase tracking-wider font-medium">
                  {user.role === 'admin' ? 'Executive Desk' : `${user.plan || 'Free Member'}`}
                </div>
              </div>

              {user.role === 'admin' && (
                <button
                  onClick={onNavigateAdmin}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-semibold hover:bg-emerald-100 transition-all cursor-pointer shadow-sm"
                  title="Open Dedicated Admin Console"
                >
                  <Shield className="h-3.5 w-3.5 text-emerald-700" />
                  <span>Admin Console →</span>
                </button>
              )}

              <button
                onClick={handleLogout}
                className="h-9 w-9 rounded-lg border border-slate-200 bg-white flex items-center justify-center text-slate-500 hover:text-rose-600 hover:border-rose-300 transition-colors cursor-pointer shadow-sm"
                title="Sign Out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <Button
              size="sm"
              onClick={onOpenAuth}
              className="gap-1.5 shadow-sm"
            >
              <Zap className="h-3.5 w-3.5" />
              <span>Sign In / 1-Click</span>
            </Button>
          )}
        </div>
      </div>

      {/* Mobile & Tablet Nav Strip */}
      <div className="xl:hidden flex items-center gap-1.5 px-3 py-2 overflow-x-auto border-t border-slate-200 text-xs bg-slate-50">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer shrink-0 font-medium ${
                isActive
                  ? 'bg-emerald-600 text-white font-bold shadow-sm'
                  : 'text-slate-600 bg-white border border-slate-200 hover:text-slate-900'
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
