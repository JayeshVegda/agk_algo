import React, { useState, useEffect } from 'react';
import { pb } from '../lib/pocketbase';
import { 
  Zap, Cpu, Network, BarChart3, Bell, 
  CreditCard, ChevronDown, User, LogOut, Shield, 
  Compass, Search, Menu, ArrowRight, CheckCircle2, 
  Sparkles, Layers, Download, Link2
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
} from './ui/Sheet';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { cn } from '../lib/utils';

export function Navbar({ activeTab, setActiveTab, user, onOpenAuth, onNavigateAdmin, onOpenPurchases }) {
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
      description: 'Institutional trade entries with strict SL/TP and real-time execution coordinates.',
      icon: Zap,
      badge: 'LIVE',
      badgeClass: 'bg-[#00D878]/15 text-[#00D878] border border-[#00D878]/30',
    },
    {
      id: 'bots',
      title: 'Trading Bots (MT4 / MT5)',
      description: 'Automated Expert Advisors with audited drawdown caps and dynamic lot algorithms.',
      icon: Cpu,
      badge: 'v4.2',
      badgeClass: 'bg-[#F3C653]/15 text-[#F3C653] border border-[#F3C653]/30',
    },
    {
      id: 'connector',
      title: 'Connector Demo',
      description: 'Zero-latency MT4/MT5 bridge simulator with direct ticket telemetry.',
      icon: Network,
      badge: 'DEMO',
      badgeClass: 'bg-white/10 text-[#E7E9EF] border border-white/15',
    },
  ];

  const marketIntelligence = [
    {
      id: 'charts',
      title: 'Live Charts Terminal',
      description: 'TradingView multi-asset technical charts with custom indicators.',
      icon: BarChart3,
    },
    {
      id: 'broadcasts',
      title: 'Directives & Bulletins',
      description: 'Official trade advisories, high-impact news warnings, and risk memos.',
      icon: Bell,
      badge: 'ALERTS',
      badgeClass: 'bg-[#00D878]/15 text-[#00D878] border border-[#00D878]/30',
    },
    {
      id: 'resources',
      title: 'Downloads & Useful Links',
      description: 'Official MT4/MT5 EAs, broker connectivity guides, and trading community feeds.',
      icon: Download,
      badge: 'KIT',
      badgeClass: 'bg-[#F3C653]/15 text-[#F3C653] border border-[#F3C653]/30',
    },
  ];

  const quickSearchItems = [
    { label: 'Overview / Home', tab: 'home', icon: Compass },
    { label: 'Signals Terminal (Live Setups)', tab: 'signals', icon: Zap },
    { label: 'Automated Trading Bots', tab: 'bots', icon: Cpu },
    { label: 'Interactive Live Charts', tab: 'charts', icon: BarChart3 },
    { label: 'Connector Execution Demo', tab: 'connector', icon: Network },
    { label: 'Executive Directives Feed', tab: 'broadcasts', icon: Bell },
    { label: 'Downloads & Resources Kit', tab: 'resources', icon: Download },
    { label: 'Subscription Plans & Pricing', tab: 'pricing', icon: CreditCard },
  ];

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
    <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-[#07090D]/90 backdrop-blur-md transition-all">
      <div className="w-[94%] max-w-[1750px] mx-auto px-2 sm:px-4 h-16 flex items-center justify-between gap-4">
        
        {/* Left: Official Brand Header Logo from Web Kit */}
        <div className="flex items-center gap-8">
          <div 
            onClick={() => setActiveTab('home')}
            className="flex items-center cursor-pointer select-none shrink-0 group"
          >
            <img 
              src="/assets/logos/akg-algo-nav.svg" 
              alt="AKG ALGO — Trade Smarter" 
              className="h-9 sm:h-10 w-auto hover:opacity-95 transition-opacity"
            />
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
                      'inline-flex h-9 items-center justify-center rounded-xl px-3.5 py-2 text-xs font-semibold transition-all cursor-pointer',
                      activeTab === 'home'
                        ? 'bg-[#F3C653]/15 text-[#F3C653] font-bold border border-[#F3C653]/30 shadow-sm'
                        : 'text-[#A6ADB9] hover:text-[#E7E9EF] hover:bg-white/5 border border-transparent'
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
                        'bg-[#F3C653]/15 text-[#F3C653] border border-[#F3C653]/30 font-bold'
                    )}
                  >
                    Trading Systems
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <div className="w-[430px] p-3 grid gap-1.5 bg-[#10141B] rounded-2xl shadow-2xl border border-white/10">
                      <div className="px-2 py-1 text-[10px] font-bold text-[#A6ADB9] uppercase tracking-wider">
                        Execution Modules
                      </div>
                      {tradingSystems.map((item) => {
                        const Icon = item.icon;
                        const isCurrent = activeTab === item.id;
                        return (
                          <div
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            className={cn(
                              'group flex items-start gap-3 p-2.5 rounded-xl transition-all cursor-pointer border',
                              isCurrent
                                ? 'bg-[#171D26] border-[#F3C653]/30'
                                : 'hover:bg-white/5 border-transparent'
                            )}
                          >
                            <div className={cn(
                              'p-2 rounded-lg shrink-0 transition-colors',
                              isCurrent 
                                ? 'bg-[#F3C653] text-[#07090D]' 
                                : 'bg-white/5 text-[#A6ADB9] group-hover:bg-[#F3C653]/15 group-hover:text-[#F3C653]'
                            )}>
                              <Icon className="h-4 w-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-[#E7E9EF] group-hover:text-[#F3C653] transition-colors">
                                  {item.title}
                                </span>
                                {item.badge && (
                                  <span className={cn('text-[9px] px-1.5 py-0.2 rounded font-bold uppercase', item.badgeClass)}>
                                    {item.badge}
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-[#A6ADB9] leading-snug mt-0.5">
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
                        'bg-[#F3C653]/15 text-[#F3C653] border border-[#F3C653]/30 font-bold'
                    )}
                  >
                    Intelligence
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <div className="w-[370px] p-3 grid gap-1.5 bg-[#10141B] rounded-2xl shadow-2xl border border-white/10">
                      <div className="px-2 py-1 text-[10px] font-bold text-[#A6ADB9] uppercase tracking-wider">
                        Market Telemetry
                      </div>
                      {marketIntelligence.map((item) => {
                        const Icon = item.icon;
                        const isCurrent = activeTab === item.id;
                        return (
                          <div
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            className={cn(
                              'group flex items-start gap-3 p-2.5 rounded-xl transition-all cursor-pointer border',
                              isCurrent
                                ? 'bg-[#171D26] border-[#F3C653]/30'
                                : 'hover:bg-white/5 border-transparent'
                            )}
                          >
                            <div className={cn(
                              'p-2 rounded-lg shrink-0 transition-colors',
                              isCurrent 
                                ? 'bg-[#F3C653] text-[#07090D]' 
                                : 'bg-white/5 text-[#A6ADB9] group-hover:bg-[#F3C653]/15 group-hover:text-[#F3C653]'
                            )}>
                              <Icon className="h-4 w-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-[#E7E9EF] group-hover:text-[#F3C653] transition-colors">
                                  {item.title}
                                </span>
                                {item.badge && (
                                  <span className={cn('text-[9px] px-1.5 py-0.2 rounded font-bold uppercase', item.badgeClass)}>
                                    {item.badge}
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-[#A6ADB9] leading-snug mt-0.5">
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
                      'inline-flex h-9 items-center justify-center rounded-xl px-3.5 py-2 text-xs font-semibold transition-all cursor-pointer gap-1.5',
                      activeTab === 'pricing'
                        ? 'bg-[#F3C653]/15 text-[#F3C653] font-bold border border-[#F3C653]/30 shadow-sm'
                        : 'text-[#A6ADB9] hover:text-[#E7E9EF] hover:bg-white/5 border border-transparent'
                    )}
                  >
                    <span>Plans & Pricing</span>
                    <span className="text-[10px] font-bold text-[#F3C653] bg-[#F3C653]/20 px-1.5 py-0.2 rounded border border-[#F3C653]/30">
                      USDT
                    </span>
                  </button>
                </NavigationMenuItem>

              </NavigationMenuList>
            </NavigationMenu>
          </div>
        </div>

        {/* Right: Search + Profile & Auth */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* Quick Search Trigger */}
          <button
            onClick={() => setSearchOpen(true)}
            className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl border border-white/10 bg-[#10141B] hover:bg-white/5 text-[#A6ADB9] text-xs transition-colors cursor-pointer"
            title="Press Cmd+K to search"
          >
            <Search className="h-3.5 w-3.5 text-[#A6ADB9]" />
            <span>Search systems...</span>
            <kbd className="hidden lg:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono text-[#A6ADB9] bg-white/5 border border-white/10 rounded">
              ⌘K
            </kbd>
          </button>

          {/* User Logged In / Out Controls */}
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2.5 p-1 sm:px-2.5 sm:py-1.5 rounded-xl border border-white/10 hover:border-[#F3C653]/30 hover:bg-white/5 transition-all cursor-pointer bg-[#10141B] shadow-sm focus:outline-none">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>
                      {(user.name || user.email || 'U')[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-left hidden sm:block leading-tight">
                    <div className="text-xs font-bold text-[#E7E9EF] flex items-center gap-1.5">
                      <span>{user.name || user.email.split('@')[0]}</span>
                      {user.role === 'admin' && (
                        <span className="px-1.5 py-0.2 rounded bg-[#F3C653]/20 text-[#F3C653] border border-[#F3C653]/30 text-[9px] font-extrabold uppercase">
                          ADMIN
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-[#00D878] font-semibold uppercase">
                      {user.role === 'admin' ? 'Executive Desk' : (user.plan || 'Free Tier')}
                    </div>
                  </div>
                  <ChevronDown className="h-3.5 w-3.5 text-[#A6ADB9]" />
                </button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="text-xs font-bold text-[#E7E9EF]">Signed in as</div>
                  <div className="text-[11px] font-normal text-[#A6ADB9] truncate">{user.email}</div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />

                <DropdownMenuItem onClick={() => setActiveTab('signals')}>
                  <Zap className="h-3.5 w-3.5 text-[#00D878]" />
                  <span>Signals Terminal</span>
                </DropdownMenuItem>

                <DropdownMenuItem onClick={() => setActiveTab('pricing')}>
                  <CreditCard className="h-3.5 w-3.5 text-[#F3C653]" />
                  <span>Subscription & Billing</span>
                </DropdownMenuItem>

                <DropdownMenuItem onClick={onOpenPurchases}>
                  <KeyRound className="h-3.5 w-3.5 text-[#00D878]" />
                  <span>My Purchases & Licenses</span>
                </DropdownMenuItem>

                {user.role === 'admin' && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={onNavigateAdmin}
                      className="bg-[#F3C653]/10 text-[#F3C653] font-semibold"
                    >
                      <Shield className="h-3.5 w-3.5 text-[#F3C653]" />
                      <span>Dedicated Admin Portal →</span>
                    </DropdownMenuItem>
                  </>
                )}

                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={handleLogout}
                  className="text-rose-400 focus:bg-rose-500/10 focus:text-rose-300 font-medium"
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
                className="gap-1.5 font-semibold text-xs"
              >
                <User className="h-3.5 w-3.5 text-[#A6ADB9]" />
                <span>Sign In</span>
              </Button>

              <Button
                variant="default"
                size="sm"
                onClick={() => setActiveTab('pricing')}
                className="gap-1.5 shadow-sm text-xs"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Get Access</span>
                <span className="sm:hidden">Plans</span>
              </Button>
            </div>
          )}

          {/* Mobile Drawer */}
          <div className="lg:hidden">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <button
                  className="p-2 rounded-xl border border-white/10 text-[#A6ADB9] hover:text-[#E7E9EF] hover:bg-white/5 transition-colors cursor-pointer"
                  aria-label="Open Mobile Menu"
                >
                  <Menu className="h-5 w-5" />
                </button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[350px] p-0 flex flex-col justify-between bg-[#07090D] border-l border-white/10">
                <div>
                  <SheetHeader className="p-4 border-b border-white/10">
                    <img 
                      src="/assets/logos/akg-algo-symbol-transparent.png" 
                      alt="AKG ALGO" 
                      className="h-8 w-auto"
                    />
                  </SheetHeader>

                  <div className="p-4 space-y-4 overflow-y-auto max-h-[calc(100vh-160px)]">
                    <div>
                      <div className="text-[10px] font-bold text-[#A6ADB9] uppercase tracking-wider mb-2">
                        General
                      </div>
                      <button
                        onClick={() => { setActiveTab('home'); setMobileOpen(false); }}
                        className={cn(
                          'w-full flex items-center gap-3 p-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer text-left',
                          activeTab === 'home'
                            ? 'bg-[#F3C653]/15 text-[#F3C653] border border-[#F3C653]/30'
                            : 'text-[#E7E9EF] hover:bg-white/5'
                        )}
                      >
                        <Compass className="h-4 w-4 text-[#F3C653]" />
                        <span>Overview & Terminal</span>
                      </button>
                    </div>

                    <div>
                      <div className="text-[10px] font-bold text-[#A6ADB9] uppercase tracking-wider mb-2">
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
                                'w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer text-left',
                                isCurrent
                                  ? 'bg-[#F3C653]/15 text-[#F3C653] border border-[#F3C653]/30'
                                  : 'text-[#E7E9EF] hover:bg-white/5'
                              )}
                            >
                              <div className="flex items-center gap-3">
                                <Icon className={cn('h-4 w-4', isCurrent ? 'text-[#F3C653]' : 'text-[#A6ADB9]')} />
                                <span>{item.title}</span>
                              </div>
                              {item.badge && (
                                <span className={cn('text-[9px] px-1.5 py-0.2 rounded font-bold', item.badgeClass)}>
                                  {item.badge}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <div className="text-[10px] font-bold text-[#A6ADB9] uppercase tracking-wider mb-2">
                        Intelligence
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
                                'w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer text-left',
                                isCurrent
                                  ? 'bg-[#F3C653]/15 text-[#F3C653] border border-[#F3C653]/30'
                                  : 'text-[#E7E9EF] hover:bg-white/5'
                              )}
                            >
                              <div className="flex items-center gap-3">
                                <Icon className={cn('h-4 w-4', isCurrent ? 'text-[#F3C653]' : 'text-[#A6ADB9]')} />
                                <span>{item.title}</span>
                              </div>
                              {item.badge && (
                                <span className={cn('text-[9px] px-1.5 py-0.2 rounded font-bold', item.badgeClass)}>
                                  {item.badge}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <div className="text-[10px] font-bold text-[#A6ADB9] uppercase tracking-wider mb-2">
                        Membership
                      </div>
                      <button
                        onClick={() => { setActiveTab('pricing'); setMobileOpen(false); }}
                        className={cn(
                          'w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer text-left',
                          activeTab === 'pricing'
                            ? 'bg-[#F3C653]/15 text-[#F3C653] border border-[#F3C653]/30'
                            : 'text-[#E7E9EF] hover:bg-white/5'
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <CreditCard className="h-4 w-4 text-[#F3C653]" />
                          <span>Plans & Pricing</span>
                        </div>
                        <span className="text-[10px] bg-[#F3C653]/20 text-[#F3C653] border border-[#F3C653]/30 px-1.5 py-0.5 rounded font-bold">
                          USDT
                        </span>
                      </button>
                    </div>

                    {user && (
                      <div className="pt-2">
                        <button
                          onClick={() => { if (onOpenPurchases) onOpenPurchases(); setMobileOpen(false); }}
                          className="w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-bold bg-[#00D878]/15 text-[#00D878] border border-[#00D878]/30 hover:bg-[#00D878]/25 transition-colors cursor-pointer"
                        >
                          <div className="flex items-center gap-2">
                            <KeyRound className="h-4 w-4 text-[#00D878]" />
                            <span>My Purchases & Licenses</span>
                          </div>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}

                    {user?.role === 'admin' && (
                      <div className="pt-2 border-t border-white/10">
                        <button
                          onClick={() => { onNavigateAdmin(); setMobileOpen(false); }}
                          className="w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-bold bg-[#F3C653]/15 text-[#F3C653] border border-[#F3C653]/30 hover:bg-[#F3C653]/25 transition-colors cursor-pointer"
                        >
                          <div className="flex items-center gap-2">
                            <Shield className="h-4 w-4 text-[#F3C653]" />
                            <span>Dedicated Admin Portal</span>
                          </div>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-4 border-t border-white/10 bg-[#10141B]">
                  {user ? (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>
                            {(user.name || user.email)[0].toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="text-left leading-none">
                          <div className="text-xs font-bold text-[#E7E9EF] truncate max-w-[140px]">
                            {user.name || user.email.split('@')[0]}
                          </div>
                          <div className="text-[10px] text-[#00D878] uppercase font-semibold mt-0.5">
                            {user.role === 'admin' ? 'Executive' : (user.plan || 'Free Member')}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={handleLogout}
                        className="p-2 rounded-lg text-[#A6ADB9] hover:text-rose-400 hover:bg-white/5 transition-colors"
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

      {/* Quick Jump Search Modal */}
      {searchOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-start justify-center pt-20 px-4">
          <div 
            className="w-full max-w-lg bg-[#10141B] rounded-2xl shadow-2xl border border-white/10 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10 bg-white/5">
              <Search className="h-4 w-4 text-[#A6ADB9]" />
              <input
                type="text"
                autoFocus
                placeholder="Jump to section, tool, or bot..."
                className="w-full bg-transparent text-sm text-[#E7E9EF] focus:outline-none placeholder:text-[#A6ADB9]"
                onKeyDown={(e) => {
                  if (e.key === 'Escape') setSearchOpen(false);
                }}
              />
              <kbd 
                onClick={() => setSearchOpen(false)}
                className="px-2 py-0.5 text-[10px] font-mono text-[#A6ADB9] bg-white/5 border border-white/10 rounded cursor-pointer hover:bg-white/10"
              >
                ESC
              </kbd>
            </div>

            <div className="p-2 max-h-80 overflow-y-auto space-y-1">
              <div className="px-3 py-1.5 text-[10px] font-bold text-[#A6ADB9] uppercase tracking-wider">
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
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold text-[#E7E9EF] hover:text-[#F3C653] hover:bg-white/5 transition-colors text-left cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="h-4 w-4 text-[#A6ADB9] group-hover:text-[#F3C653] transition-colors" />
                      <span>{item.label}</span>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-white/20 group-hover:text-[#F3C653] transition-colors" />
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
