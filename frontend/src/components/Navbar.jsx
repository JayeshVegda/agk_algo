import React, { useState, useEffect } from 'react';
import { pb } from '../lib/pocketbase';
import { 
  Terminal, Zap, Cpu, Network, BarChart3, Bell, 
  CreditCard, ChevronDown, User, LogOut, Shield, 
  Compass, Search, Menu, ArrowRight, CheckCircle2, 
  Sparkles, Layers, Sliders, DollarSign, Command
} from 'lucide-react';
import { 
  NavigationMenu, 
  NavigationMenuList, 
  NavigationMenuItem, 
  NavigationMenuTrigger, 
  NavigationMenuContent, 
  NavigationMenuLink 
} from './ui/NavigationMenu';
import { 
  DropdownMenu, 
  DropdownMenuTrigger, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator 
} from './ui/DropdownMenu';
import { Avatar, AvatarFallback } from './ui/Avatar';
import { 
  Sheet, 
  SheetTrigger, 
  SheetContent, 
  SheetHeader, 
  SheetTitle,
  SheetClose 
} from './ui/Sheet';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { cn } from '../lib/utils';

export function Navbar({ activeTab, setActiveTab, user, onOpenAuth, onNavigateAdmin }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const handleLogout = () => {
    pb.authStore.clear();
    window.location.reload();
  };

  const tradingSystems = [
    {
      id: 'signals',
      title: 'Signals Feed',
      description: 'Institutional trade entries with strict SL/TP and live execution pips.',
      icon: Zap,
      badge: 'LIVE',
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    },
    {
      id: 'bots',
      title: 'Trading Bots (MT4 / MT5)',
      description: 'Automated EA algorithms with audited drawdown limits and risk management.',
      icon: Cpu,
      badge: 'v4.2',
      badgeColor: 'bg-blue-100 text-blue-800 border-blue-300',
    },
    {
      id: 'connector',
      title: 'Connector Demo',
      description: 'Zero-latency MT4/MT5 bridge simulator with direct ticket telemetry.',
      icon: Network,
      badge: 'DEMO',
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-300',
    },
  ];

  const marketIntelligence = [
    {
      id: 'charts',
      title: 'Live Charts Terminal',
      description: 'TradingView multi-asset technical charts with custom overlay indicators.',
      icon: BarChart3,
    },
    {
      id: 'broadcasts',
      title: 'Directives & Bulletins',
      description: 'Executive trade advisories, high-impact news warnings, and risk memos.',
      icon: Bell,
      badge: 'ALERTS',
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    },
  ];

  const quickSearchItems = [
    { label: 'Overview / Home', tab: 'home', icon: Compass },
    { label: 'Signals Terminal (Live Trades)', tab: 'signals', icon: Zap },
    { label: 'Automated Trading Bots', tab: 'bots', icon: Cpu },
    { label: 'Interactive Live Charts', tab: 'charts', icon: BarChart3 },
    { label: 'Connector Execution Demo', tab: 'connector', icon: Network },
    { label: 'Executive Directives Feed', tab: 'broadcasts', icon: Bell },
    { label: 'Subscription Plans & Pricing', tab: 'pricing', icon: CreditCard },
  ];

  // Global keyboard shortcut: Cmd+K or Ctrl+K to open quick jump
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/95 backdrop-blur-md transition-all">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        
        {/* Left: Brand Identity */}
        <div className="flex items-center gap-8">
          <div 
            onClick={() => { setActiveTab('home'); }}
            className="flex items-center gap-3 cursor-pointer group select-none shrink-0"
          >
            <div className="relative">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 text-white flex items-center justify-center shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform duration-200">
                <Terminal className="h-5 w-5" />
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 ring-2 ring-white"></span>
              </span>
            </div>

            <div>
              <div className="font-extrabold text-base tracking-tight text-slate-900 flex items-center gap-2">
                AKG ALGO
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-full">
                  SYSTEMS
                </span>
              </div>
              <div className="text-[11px] text-slate-500 font-medium hidden sm:block">
                Institutional Quant Desk
              </div>
            </div>
          </div>

          {/* Desktop Navigation Menu (Radix UI NavigationMenu) */}
          <div className="hidden lg:block">
            <NavigationMenu>
              <NavigationMenuList className="flex items-center gap-1">
                
                {/* 1. Overview */}
                <NavigationMenuItem>
                  <button
                    onClick={() => setActiveTab('home')}
                    className={cn(
                      'inline-flex h-9 items-center justify-center rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors cursor-pointer',
                      activeTab === 'home'
                        ? 'bg-emerald-50 text-emerald-800 font-bold border border-emerald-200 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent'
                    )}
                  >
                    Overview
                  </button>
                </NavigationMenuItem>

                {/* 2. Trading Systems Dropdown */}
                <NavigationMenuItem>
                  <NavigationMenuTrigger
                    className={cn(
                      ['signals', 'bots', 'connector'].includes(activeTab) &&
                        'bg-emerald-50 text-emerald-800 border-emerald-200 font-bold'
                    )}
                  >
                    Trading Systems
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <div className="w-[420px] p-3 grid gap-1.5 bg-white rounded-xl shadow-xl border border-slate-100">
                      <div className="px-2 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        Automated & Discretionary Execution
                      </div>
                      {tradingSystems.map((item) => {
                        const Icon = item.icon;
                        const isCurrent = activeTab === item.id;
                        return (
                          <div
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            className={cn(
                              'group flex items-start gap-3 p-2.5 rounded-lg transition-all cursor-pointer',
                              isCurrent
                                ? 'bg-emerald-50/80 border border-emerald-200'
                                : 'hover:bg-slate-50 border border-transparent'
                            )}
                          >
                            <div className={cn(
                              'p-2 rounded-lg shrink-0 transition-colors',
                              isCurrent 
                                ? 'bg-emerald-600 text-white' 
                                : 'bg-slate-100 text-slate-600 group-hover:bg-emerald-100 group-hover:text-emerald-700'
                            )}>
                              <Icon className="h-4 w-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                                  {item.title}
                                </span>
                                {item.badge && (
                                  <span className={cn(
                                    'text-[9px] px-1.5 py-0.2 rounded border font-bold uppercase',
                                    item.badgeColor
                                  )}>
                                    {item.badge}
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-500 leading-snug mt-0.5">
                                {item.description}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </NavigationMenuContent>
                </NavigationMenuItem>

                {/* 3. Market Intelligence Dropdown */}
                <NavigationMenuItem>
                  <NavigationMenuTrigger
                    className={cn(
                      ['charts', 'broadcasts'].includes(activeTab) &&
                        'bg-emerald-50 text-emerald-800 border-emerald-200 font-bold'
                    )}
                  >
                    Intelligence
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <div className="w-[360px] p-3 grid gap-1.5 bg-white rounded-xl shadow-xl border border-slate-100">
                      <div className="px-2 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        Market Data & Directives
                      </div>
                      {marketIntelligence.map((item) => {
                        const Icon = item.icon;
                        const isCurrent = activeTab === item.id;
                        return (
                          <div
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            className={cn(
                              'group flex items-start gap-3 p-2.5 rounded-lg transition-all cursor-pointer',
                              isCurrent
                                ? 'bg-emerald-50/80 border border-emerald-200'
                                : 'hover:bg-slate-50 border border-transparent'
                            )}
                          >
                            <div className={cn(
                              'p-2 rounded-lg shrink-0 transition-colors',
                              isCurrent 
                                ? 'bg-emerald-600 text-white' 
                                : 'bg-slate-100 text-slate-600 group-hover:bg-emerald-100 group-hover:text-emerald-700'
                            )}>
                              <Icon className="h-4 w-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                                  {item.title}
                                </span>
                                {item.badge && (
                                  <span className={cn(
                                    'text-[9px] px-1.5 py-0.2 rounded border font-bold uppercase',
                                    item.badgeColor
                                  )}>
                                    {item.badge}
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-500 leading-snug mt-0.5">
                                {item.description}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </NavigationMenuContent>
                </NavigationMenuItem>

                {/* 4. Plans & Pricing */}
                <NavigationMenuItem>
                  <button
                    onClick={() => setActiveTab('pricing')}
                    className={cn(
                      'inline-flex h-9 items-center justify-center rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors cursor-pointer gap-1.5',
                      activeTab === 'pricing'
                        ? 'bg-emerald-50 text-emerald-800 font-bold border border-emerald-200 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent'
                    )}
                  >
                    <span>Plans & Pricing</span>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded">
                      USDT
                    </span>
                  </button>
                </NavigationMenuItem>

              </NavigationMenuList>
            </NavigationMenu>
          </div>
        </div>

        {/* Right: Quick Search + User Profile / Auth Area */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* Quick Search Trigger */}
          <button
            onClick={() => setSearchOpen(true)}
            className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-500 text-xs transition-colors cursor-pointer"
            title="Press Cmd+K to jump"
          >
            <Search className="h-3.5 w-3.5 text-slate-400" />
            <span>Search systems...</span>
            <kbd className="hidden lg:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono text-slate-400 bg-white border border-slate-200 rounded">
              ⌘K
            </kbd>
          </button>

          {/* User Logged In / Out Controls */}
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2.5 p-1 sm:px-2.5 sm:py-1.5 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all cursor-pointer bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>
                      {(user.name || user.email || 'U')[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-left hidden sm:block leading-tight">
                    <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <span>{user.name || user.email.split('@')[0]}</span>
                      {user.role === 'admin' && (
                        <span className="px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 border border-amber-300 text-[9px] font-extrabold uppercase">
                          ADMIN
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-emerald-700 font-semibold uppercase">
                      {user.role === 'admin' ? 'Executive Desk' : (user.plan || 'Free Tier')}
                    </div>
                  </div>
                  <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                </button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="text-xs font-bold text-slate-900">Signed in as</div>
                  <div className="text-[11px] font-normal text-slate-500 truncate">{user.email}</div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />

                <DropdownMenuItem onClick={() => setActiveTab('signals')}>
                  <Zap className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Signals Terminal</span>
                </DropdownMenuItem>

                <DropdownMenuItem onClick={() => setActiveTab('pricing')}>
                  <CreditCard className="h-3.5 w-3.5 text-slate-500" />
                  <span>Subscription & Billing</span>
                </DropdownMenuItem>

                {user.role === 'admin' && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={onNavigateAdmin}
                      className="bg-emerald-50/70 text-emerald-900 font-semibold focus:bg-emerald-100"
                    >
                      <Shield className="h-3.5 w-3.5 text-emerald-700" />
                      <span>Dedicated Admin Portal →</span>
                    </DropdownMenuItem>
                  </>
                )}

                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={handleLogout}
                  className="text-rose-600 focus:bg-rose-50 focus:text-rose-700 font-medium"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Sign Out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onOpenAuth}
                className="gap-1.5 font-medium"
              >
                <User className="h-3.5 w-3.5 text-slate-500" />
                <span>Sign In</span>
              </Button>

              <Button
                size="sm"
                onClick={() => setActiveTab('pricing')}
                className="gap-1.5 shadow-sm"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Get Access</span>
                <span className="sm:hidden">Plans</span>
              </Button>
            </div>
          )}

          {/* Mobile Hamburger Drawer Trigger */}
          <div className="lg:hidden">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <button
                  className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                  aria-label="Open Mobile Menu"
                >
                  <Menu className="h-5 w-5" />
                </button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[360px] p-0 flex flex-col justify-between">
                <div>
                  <SheetHeader className="p-4 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
                        <Terminal className="h-4 w-4" />
                      </div>
                      <div>
                        <SheetTitle className="text-sm font-extrabold text-slate-900">
                          AKG ALGO
                        </SheetTitle>
                        <p className="text-[11px] text-slate-500">Navigation Menu</p>
                      </div>
                    </div>
                  </SheetHeader>

                  {/* Navigation Links */}
                  <div className="p-4 space-y-4 overflow-y-auto max-h-[calc(100vh-160px)]">
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                        General
                      </div>
                      <button
                        onClick={() => { setActiveTab('home'); setMobileOpen(false); }}
                        className={cn(
                          'w-full flex items-center gap-3 p-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer text-left',
                          activeTab === 'home'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : 'text-slate-700 hover:bg-slate-50'
                        )}
                      >
                        <Compass className="h-4 w-4 text-emerald-600" />
                        <span>Overview & Terminal</span>
                      </button>
                    </div>

                    <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                        Trading Systems
                      </div>
                      <div className="space-y-1">
                        {tradingSystems.map((item) => {
                          const Icon = item.icon;
                          const isCurrent = activeTab === item.id;
                          return (
                            <button
                              key={item.id}
                              onClick={() => { setActiveTab(item.id); setMobileOpen(false); }}
                              className={cn(
                                'w-full flex items-center justify-between p-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer text-left',
                                isCurrent
                                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                  : 'text-slate-700 hover:bg-slate-50'
                              )}
                            >
                              <div className="flex items-center gap-3">
                                <Icon className={cn('h-4 w-4', isCurrent ? 'text-emerald-700' : 'text-slate-500')} />
                                <span>{item.title}</span>
                              </div>
                              {item.badge && (
                                <span className={cn('text-[9px] px-1.5 py-0.2 rounded border font-bold', item.badgeColor)}>
                                  {item.badge}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                        Market Intelligence
                      </div>
                      <div className="space-y-1">
                        {marketIntelligence.map((item) => {
                          const Icon = item.icon;
                          const isCurrent = activeTab === item.id;
                          return (
                            <button
                              key={item.id}
                              onClick={() => { setActiveTab(item.id); setMobileOpen(false); }}
                              className={cn(
                                'w-full flex items-center justify-between p-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer text-left',
                                isCurrent
                                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                  : 'text-slate-700 hover:bg-slate-50'
                              )}
                            >
                              <div className="flex items-center gap-3">
                                <Icon className={cn('h-4 w-4', isCurrent ? 'text-emerald-700' : 'text-slate-500')} />
                                <span>{item.title}</span>
                              </div>
                              {item.badge && (
                                <span className={cn('text-[9px] px-1.5 py-0.2 rounded border font-bold', item.badgeColor)}>
                                  {item.badge}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                        Membership
                      </div>
                      <button
                        onClick={() => { setActiveTab('pricing'); setMobileOpen(false); }}
                        className={cn(
                          'w-full flex items-center justify-between p-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer text-left',
                          activeTab === 'pricing'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : 'text-slate-700 hover:bg-slate-50'
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <CreditCard className="h-4 w-4 text-emerald-600" />
                          <span>Plans & Pricing</span>
                        </div>
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-bold">
                          USDT
                        </span>
                      </button>
                    </div>

                    {user?.role === 'admin' && (
                      <div className="pt-2 border-t border-slate-100">
                        <button
                          onClick={() => { onNavigateAdmin(); setMobileOpen(false); }}
                          className="w-full flex items-center justify-between p-2.5 rounded-lg text-xs font-bold bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100 transition-colors cursor-pointer"
                        >
                          <div className="flex items-center gap-2">
                            <Shield className="h-4 w-4 text-amber-700" />
                            <span>Dedicated Admin Portal</span>
                          </div>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Mobile Drawer Footer */}
                <div className="p-4 border-t border-slate-100 bg-slate-50">
                  {user ? (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>
                            {(user.name || user.email)[0].toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="text-left leading-none">
                          <div className="text-xs font-bold text-slate-800 truncate max-w-[140px]">
                            {user.name || user.email.split('@')[0]}
                          </div>
                          <div className="text-[10px] text-emerald-700 uppercase font-semibold mt-0.5">
                            {user.role === 'admin' ? 'Executive' : (user.plan || 'Free Member')}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={handleLogout}
                        className="p-2 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-white border border-transparent hover:border-slate-200 transition-colors"
                        title="Sign Out"
                      >
                        <LogOut className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => { onOpenAuth(); setMobileOpen(false); }}
                      >
                        Sign In
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => { setActiveTab('pricing'); setMobileOpen(false); }}
                      >
                        Get Access
                      </Button>
                    </div>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>

        </div>
      </div>

      {/* Quick Jump Search Modal (Cmd+K) */}
      {searchOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-start justify-center pt-20 px-4 animate-in fade-in-0 duration-150">
          <div 
            className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 bg-slate-50/50">
              <Search className="h-4 w-4 text-slate-400" />
              <input
                type="text"
                autoFocus
                placeholder="Jump to section, tool, or plan..."
                className="w-full bg-transparent text-sm text-slate-900 focus:outline-none placeholder:text-slate-400"
                onKeyDown={(e) => {
                  if (e.key === 'Escape') setSearchOpen(false);
                }}
              />
              <kbd 
                onClick={() => setSearchOpen(false)}
                className="px-2 py-0.5 text-[10px] font-mono text-slate-400 bg-white border border-slate-200 rounded cursor-pointer hover:bg-slate-100"
              >
                ESC
              </kbd>
            </div>

            <div className="p-2 max-h-80 overflow-y-auto space-y-1">
              <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Quick Navigation
              </div>
              {quickSearchItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.tab}
                    onClick={() => {
                      setActiveTab(item.tab);
                      setSearchOpen(false);
                    }}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-700 hover:text-emerald-800 hover:bg-emerald-50 transition-colors text-left cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="h-4 w-4 text-slate-400 group-hover:text-emerald-600 transition-colors" />
                      <span>{item.label}</span>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-slate-300 group-hover:text-emerald-600 transition-colors" />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
