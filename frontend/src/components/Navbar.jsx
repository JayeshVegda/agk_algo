import React from 'react';
import { pb } from '../lib/pocketbase';
import { Shield, Zap, User, LogOut, Terminal, Bell, Cpu, BarChart3, Network, CreditCard } from 'lucide-react';

export function Navbar({ activeTab, setActiveTab, user, onOpenAuth }) {
  const handleLogout = () => {
    pb.authStore.clear();
    window.location.reload();
  };

  const navItems = [
    { id: 'signals', label: 'Signals Feed', icon: Zap, badge: 'LIVE' },
    { id: 'bots', label: 'Trading Bots', icon: Cpu },
    { id: 'charts', label: 'Live Charts', icon: BarChart3 },
    { id: 'connector', label: 'Connector Demo', icon: Network },
    { id: 'broadcasts', label: 'Announcements', icon: Bell },
    { id: 'pricing', label: 'Plans & Pricing', icon: CreditCard },
    ...(user?.role === 'admin' ? [{ id: 'admin', label: '👑 Admin Desk', icon: Shield, badge: 'CRUD' }] : []),
  ];

  return (
    <header className="border-b border-border/80 bg-[#070d17]/95 backdrop-blur sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        {/* Logo */}
        <div 
          onClick={() => setActiveTab('signals')}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="h-9 w-9 rounded-lg bg-blue-600/10 border border-blue-500/30 flex items-center justify-center text-blue-400 group-hover:scale-105 transition-all">
            <Terminal className="h-5 w-5" />
          </div>
          <div>
            <div className="font-mono font-extrabold text-base tracking-wider text-white flex items-center gap-2">
              AKG ALGO
              <span className="text-[10px] font-bold text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20">
                PRO
              </span>
            </div>
            <div className="text-[10px] text-slate-400 font-mono tracking-tight hidden sm:block">Institutional Precision Desk</div>
          </div>
        </div>

        {/* Desktop Tabs */}
        <nav className="hidden lg:flex items-center gap-1 font-medium text-xs font-mono">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`px-3 py-2 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                  isActive
                    ? 'bg-blue-600/20 text-blue-300 border border-blue-500/40 shadow-sm font-bold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {item.label}
                {item.badge && (
                  <span className={`text-[9px] px-1 py-0.2 rounded font-bold uppercase ${
                    item.badge === 'LIVE' 
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* User / Auth Area */}
        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-xs font-semibold text-slate-200 flex items-center gap-1 justify-end">
                  {user.role === 'admin' && <Shield className="h-3.5 w-3.5 text-amber-400" />}
                  {user.name || user.email}
                </div>
                <div className="text-[10px] font-mono text-emerald-400 uppercase">
                  {user.role === 'admin' ? '● Full Admin' : `● ${user.plan || 'Free Member'}`}
                </div>
              </div>

              {user.role === 'admin' && (
                <button
                  onClick={() => setActiveTab('admin')}
                  className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-medium hover:bg-amber-500/20 transition-colors cursor-pointer"
                >
                  <Shield className="h-3.5 w-3.5" />
                  Admin Desk
                </button>
              )}

              <button
                onClick={handleLogout}
                className="h-8 w-8 rounded-lg border border-border bg-slate-800/80 flex items-center justify-center text-slate-400 hover:text-rose-400 hover:border-rose-500/40 transition-colors cursor-pointer"
                title="Sign Out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-md shadow-blue-600/30 transition-all cursor-pointer font-mono"
            >
              <Zap className="h-3.5 w-3.5" />
              Sign In / 1-Click
            </button>
          )}
        </div>
      </div>

      {/* Mobile & Tablet Nav Strip (ALWAYS visible and clickable on smaller screens) */}
      <div className="lg:hidden flex items-center gap-1 px-3 py-2 overflow-x-auto border-t border-border/50 text-xs font-mono bg-[#05080f]">
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
              <Icon className="h-3 w-3" />
              {item.label}
            </button>
          );
        })}
      </div>
    </header>
  );
}
