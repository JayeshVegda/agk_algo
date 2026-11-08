import React, { useState, useEffect } from 'react';
import { pb } from '../lib/pocketbase';
import { 
  Zap, Cpu, Network, BarChart3, Bell, 
  CreditCard, ChevronDown, User, LogOut, Shield, 
  Compass, Search, Menu, ArrowRight, Download, 
  KeyRound, Sun, Moon
} from 'lucide-react';

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
} from './ui/Sheet';
import { Button } from './ui/Button';
import { NotificationBell } from './NotificationBell';
import { useTheme } from '../lib/theme';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

export function Navbar({ activeTab, setActiveTab, user, notify, onOpenAuth, onNavigateAdmin, onOpenAccount }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { isDark, toggleTheme } = useTheme();

  const handleLogout = () => {
    pb.authStore.clear();
    window.location.reload();
  };

  const tradingSystems = [
    {
      id: 'signals',
      title: 'Signal Room',
      description: 'Real-time trade broadcasts with strict tier gating and live desk updates.',
      icon: Zap,
      badge: 'LIVE',
      badgeClass: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20',
    },
    {
      id: 'bots',
      title: 'Expert Advisors (MT4 / MT5)',
      description: 'Automated Expert Advisors with audited drawdown caps and dynamic lot algorithms.',
      icon: Cpu,
      badge: 'v4.2',
      badgeClass: 'bg-akg-surfaceElevated text-akg-muted border border-akg-hairline',
    },
    {
      id: 'connector',
      title: 'Account Management',
      description: 'Hand your account to the desk: bots trade it for you, profits split 70/30.',
      icon: Network,
      badge: 'DEMO',
      badgeClass: 'bg-akg-surfaceElevated text-akg-muted border border-akg-hairline',
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
      title: 'Desk Briefings',
      description: 'Live desk announcements, risk directives, and desk-lead analysis.',
      icon: Bell,
      badge: 'ALERTS',
      badgeClass: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20',
    },
    {
      id: 'resources',
      title: 'Traders Kit',
      description: 'Official files, vetted brokers and VPS, and the community channels.',
      icon: Download,
      badge: 'KIT',
      badgeClass: 'bg-akg-surfaceElevated text-akg-muted border border-akg-hairline',
    },
  ];

  const quickSearchItems = [
    { label: 'Overview', tab: 'home', icon: Compass },
    { label: 'Signal Room (Live Broadcasts)', tab: 'signals', icon: Zap },
    { label: 'Expert Advisors', tab: 'bots', icon: Cpu },
    { label: 'Live Charts', tab: 'charts', icon: BarChart3 },
    { label: 'Bridge Connector Demo', tab: 'connector', icon: Network },
    { label: 'Desk Briefings', tab: 'broadcasts', icon: Bell },
    { label: 'Traders Kit (Downloads & Links)', tab: 'resources', icon: Download },
    { label: 'Plans & Pricing', tab: 'pricing', icon: CreditCard },
  ];

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
        setSearchQuery('');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-akg-hairline bg-akg-bg/85 backdrop-blur-xl transition-[background-color,border-color] duration-150">
      <div className="mx-auto flex h-16 w-full max-w-[1360px] items-center px-4 sm:px-6">

        {/* Left: Brand Header Logo */}
        <div className="flex flex-1 items-center">
          <div
            onClick={() => setActiveTab('home')}
            className="flex items-center gap-2 cursor-pointer select-none shrink-0 group"
          >
            <img
              src="/assets/logos/akg-algo-metallic-nav.png"
              alt="AKG ALGO"
              className="h-8 sm:h-9 w-auto group-hover:opacity-90 transition-opacity"
            />
          </div>
        </div>

        {/* Desktop Navigation Links: centered group, flush with header border */}
        <nav className="hidden lg:flex h-full items-stretch">
            {[
              { id: 'home', label: 'Overview' },
              { id: 'bots', label: 'Robots' },
              { id: 'signals', label: 'Signal Room' },
              { id: 'connector', label: 'Terminal Desk' },
              { id: 'pricing', label: 'Pricing' },
              { id: 'resources', label: 'Traders Kit' },
            ].map((link) => {
              const isActive = activeTab === link.id;
              return (
                <button
                  key={link.id}
                  onClick={() => setActiveTab(link.id)}
                  className={cn(
                    'relative flex items-center px-3 xl:px-4 text-[13px] font-medium transition-colors cursor-pointer select-none active:scale-[0.98]',
                    isActive
                      ? 'text-emerald-700 dark:text-emerald-400 font-semibold'
                      : 'text-akg-muted hover:text-akg-text'
                  )}
                >
                  <span>{link.label}</span>
                  {link.id === 'signals' && (
                    <span className="ml-1.5 inline-block h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  )}
                  {isActive && (
                    <motion.span
                      layoutId="navActiveIndicator"
                      className="absolute bottom-0 left-3 right-3 h-[2.5px] bg-emerald-500 rounded-t-full shadow-[0_0_8px_rgba(16,185,129,0.4)]"
                      transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                    />
                  )}
                </button>
              );
            })}
        </nav>

        {/* Right: Theme Toggle + Search + Notifications + Profile & Auth */}
        <div className="flex flex-1 items-center justify-end gap-2 sm:gap-2.5">
          {/* Quick Search Trigger Icon */}
          <button
            onClick={() => setSearchOpen(true)}
            className="flex items-center justify-center h-8 w-8 rounded-lg border border-akg-hairline bg-akg-surface hover:bg-akg-surfaceElevated text-akg-muted hover:text-akg-text transition-colors cursor-pointer"
            title="Search systems (⌘K)"
            aria-label="Search systems"
          >
            <Search className="h-3.5 w-3.5" />
          </button>

          {/* Theme Toggle (Dark / Light) */}
          <button
            onClick={toggleTheme}
            className="flex items-center justify-center h-8 w-8 rounded-lg border border-akg-hairline bg-akg-surface hover:bg-akg-surfaceElevated text-akg-muted hover:text-akg-text transition-colors cursor-pointer"
            title={isDark ? 'Switch to Light theme' : 'Switch to Dark theme'}
            aria-label="Toggle theme"
          >
            {isDark ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
          </button>

          {/* Realtime Notifications */}
          <NotificationBell user={user} notify={notify} dark={isDark} />

          {/* User Logged In / Out Controls */}
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2.5 p-1 sm:px-2.5 sm:py-1 rounded-lg border border-akg-hairline hover:border-emerald-500/30 hover:bg-akg-surfaceElevated transition-colors cursor-pointer bg-akg-surface shadow-sm focus:outline-none">
                  <Avatar className="h-7 w-7">
                    <AvatarFallback>
                      {(user.name || user.email || 'U')[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-left hidden md:block leading-tight max-w-[120px]">
                    <div className="text-xs font-medium text-akg-text flex items-center gap-1.5">
                      <span className="max-w-[96px] truncate">{user.name || user.email.split('@')[0]}</span>
                      {user.role === 'admin' && (
                        <span className="px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 text-[9px] font-mono uppercase">
                          ADMIN
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-akg-green font-medium uppercase truncate">
                      {user.role === 'admin' ? 'Executive Desk' : (user.plan || 'Free Tier')}
                    </div>
                  </div>
                  <ChevronDown className="h-3.5 w-3.5 text-akg-muted" />
                </button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-56 bg-akg-card border-akg-hairline">
                <DropdownMenuLabel>
                  <div className="text-xs font-medium text-akg-text">Signed in as</div>
                  <div className="text-[11px] font-normal text-akg-muted truncate">{user.email}</div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />

                <DropdownMenuItem onClick={() => setActiveTab('signals')}>
                  <Zap className="h-3.5 w-3.5 text-akg-green" />
                  <span>Signal Room</span>
                </DropdownMenuItem>

                <DropdownMenuItem onClick={() => setActiveTab('pricing')}>
                  <CreditCard className="h-3.5 w-3.5 text-akg-muted" />
                  <span>Subscription & Billing</span>
                </DropdownMenuItem>

                <DropdownMenuItem onClick={onOpenAccount}>
                  <KeyRound className="h-3.5 w-3.5 text-akg-green" />
                  <span>My Account & Licenses</span>
                </DropdownMenuItem>

                {user.role === 'admin' && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={onNavigateAdmin}
                      className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-medium"
                    >
                      <Shield className="h-3.5 w-3.5 text-akg-green" />
                      <span>Dedicated Admin Portal →</span>
                    </DropdownMenuItem>
                  </>
                )}

                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={handleLogout}
                  className="text-rose-500 dark:text-rose-400 focus:bg-rose-500/10 font-medium"
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
                className="gap-1.5 font-medium text-xs"
              >
                <User className="h-3.5 w-3.5 text-akg-muted" />
                <span>Sign In</span>
              </Button>

              <Button
                variant="default"
                size="sm"
                onClick={() => setActiveTab('pricing')}
                className="gap-1.5 text-xs"
              >
                <span>Get Access</span>
              </Button>
            </div>
          )}

          {/* Mobile Menu Trigger */}
          <div className="lg:hidden">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <button
                  className="p-1.5 rounded-lg border border-akg-hairline text-akg-muted hover:text-akg-text hover:bg-akg-surface transition-colors cursor-pointer"
                  aria-label="Open Mobile Menu"
                >
                  <Menu className="h-5 w-5" />
                </button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[350px] p-0 flex flex-col justify-between bg-akg-bg border-l border-akg-hairline">
                <div>
                  <SheetHeader className="p-4 pr-12 border-b border-akg-hairline flex flex-row items-center justify-between">
                    <img
                      src="/assets/logos/akg-algo-metallic-nav.png"
                      alt="AKG ALGO"
                      className="h-7 w-auto max-w-[70%] object-contain"
                    />
                    <button
                      onClick={toggleTheme}
                      className="p-1.5 rounded-md border border-akg-hairline bg-akg-surface text-akg-muted hover:text-akg-text"
                      title="Toggle Theme"
                    >
                      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                    </button>
                  </SheetHeader>

                  <div className="p-4 space-y-4 overflow-y-auto max-h-[calc(100vh-160px)]">
                    <div>
                      <div className="text-[10px] font-medium text-akg-muted uppercase tracking-wider mb-2">
                        General
                      </div>
                      <button
                        onClick={() => { setActiveTab('home'); setMobileOpen(false); }}
                        className={cn(
                          'w-full flex items-center gap-3 p-2.5 rounded-lg text-xs font-medium transition-colors cursor-pointer text-left',
                          activeTab === 'home'
                            ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/25'
                            : 'text-akg-text hover:bg-akg-surface'
                        )}
                      >
                        <Compass className="h-4 w-4 text-akg-green" />
                        <span>Overview & Terminal</span>
                      </button>
                    </div>

                    <div>
                      <div className="text-[10px] font-medium text-akg-muted uppercase tracking-wider mb-2">
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
                                'w-full flex items-center justify-between p-2.5 rounded-lg text-xs font-medium transition-colors cursor-pointer text-left',
                                isCurrent
                                  ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/25'
                                  : 'text-akg-text hover:bg-akg-surface'
                              )}
                            >
                              <div className="flex items-center gap-3">
                                <Icon className={cn('h-4 w-4', isCurrent ? 'text-akg-green' : 'text-akg-muted')} />
                                <span>{item.title}</span>
                              </div>
                              {item.badge && (
                                <span className={cn('text-[9px] px-1.5 py-0.5 rounded font-medium', item.badgeClass)}>
                                  {item.badge}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <div className="text-[10px] font-medium text-akg-muted uppercase tracking-wider mb-2">
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
                                'w-full flex items-center justify-between p-2.5 rounded-lg text-xs font-medium transition-colors cursor-pointer text-left',
                                isCurrent
                                  ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/25'
                                  : 'text-akg-text hover:bg-akg-surface'
                              )}
                            >
                              <div className="flex items-center gap-3">
                                <Icon className={cn('h-4 w-4', isCurrent ? 'text-akg-green' : 'text-akg-muted')} />
                                <span>{item.title}</span>
                              </div>
                              {item.badge && (
                                <span className={cn('text-[9px] px-1.5 py-0.5 rounded font-medium', item.badgeClass)}>
                                  {item.badge}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <div className="text-[10px] font-medium text-akg-muted uppercase tracking-wider mb-2">
                        Membership
                      </div>
                      <button
                        onClick={() => { setActiveTab('pricing'); setMobileOpen(false); }}
                        className={cn(
                          'w-full flex items-center justify-between p-2.5 rounded-lg text-xs font-medium transition-colors cursor-pointer text-left',
                          activeTab === 'pricing'
                            ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/25'
                            : 'text-akg-text hover:bg-akg-surface'
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <CreditCard className="h-4 w-4 text-akg-green" />
                          <span>Plans & Pricing</span>
                        </div>
                        <span className="text-[10px] bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded font-mono">
                          USDT
                        </span>
                      </button>
                    </div>

                    {user && (
                      <div className="pt-2">
                        <button
                          onClick={() => { if (onOpenAccount) onOpenAccount(); setMobileOpen(false); }}
                          className="w-full flex items-center justify-between p-2.5 rounded-lg text-xs font-medium bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/25 hover:bg-emerald-500/20 transition-colors cursor-pointer"
                        >
                          <div className="flex items-center gap-2">
                            <KeyRound className="h-4 w-4 text-akg-green" />
                            <span>My Account & Licenses</span>
                          </div>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}

                    {user?.role === 'admin' && (
                      <div className="pt-2 border-t border-akg-hairline">
                        <button
                          onClick={() => { onNavigateAdmin(); setMobileOpen(false); }}
                          className="w-full flex items-center justify-between p-2.5 rounded-lg text-xs font-medium bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/25 hover:bg-emerald-500/20 transition-colors cursor-pointer"
                        >
                          <div className="flex items-center gap-2">
                            <Shield className="h-4 w-4 text-akg-green" />
                            <span>Dedicated Admin Portal</span>
                          </div>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-4 border-t border-akg-hairline bg-akg-card">
                  {user ? (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <Avatar className="h-7 w-7">
                          <AvatarFallback>
                            {(user.name || user.email)[0].toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="text-left leading-none">
                          <div className="text-xs font-medium text-akg-text truncate max-w-[140px]">
                            {user.name || user.email.split('@')[0]}
                          </div>
                          <div className="text-[10px] text-akg-green uppercase font-medium mt-0.5">
                            {user.role === 'admin' ? 'Executive' : (user.plan || 'Free Member')}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={handleLogout}
                        className="p-1.5 rounded-md text-akg-muted hover:text-rose-500 transition-colors"
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
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start justify-center pt-20 px-4">
          <div 
            className="w-full max-w-lg bg-akg-card rounded-xl shadow-2xl border border-akg-hairline overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 px-4 py-3 border-b border-akg-hairline bg-akg-surface">
              <Search className="h-4 w-4 text-akg-muted" />
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Jump to section, tool, or kit..."
                className="w-full bg-transparent text-sm text-akg-text focus:outline-none placeholder:text-akg-muted"
                onKeyDown={(e) => {
                  if (e.key === 'Escape') setSearchOpen(false);
                }}
              />
              <kbd 
                onClick={() => setSearchOpen(false)}
                className="px-2 py-0.5 text-[10px] font-mono text-akg-muted bg-akg-surfaceElevated border border-akg-hairline rounded cursor-pointer hover:opacity-80"
              >
                ESC
              </kbd>
            </div>

            <div className="p-2 max-h-80 overflow-y-auto space-y-1">
              <div className="px-3 py-1.5 text-[10px] font-medium text-akg-muted uppercase tracking-wider">
                Quick Navigation
              </div>
              {quickSearchItems
                .filter((item) =>
                  searchQuery.trim()
                    ? item.label.toLowerCase().includes(searchQuery.trim().toLowerCase())
                    : true
                )
                .map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.tab}
                    onClick={() => {
                      setActiveTab(item.tab);
                      setSearchOpen(false);
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-akg-text hover:text-akg-green hover:bg-akg-surface transition-colors text-left cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="h-4 w-4 text-akg-muted group-hover:text-akg-green transition-colors" />
                      <span>{item.label}</span>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-akg-muted group-hover:text-akg-green transition-colors" />
                  </button>
                );
                })}
                {searchQuery.trim() &&
                  quickSearchItems.filter((item) =>
                    item.label.toLowerCase().includes(searchQuery.trim().toLowerCase())
                  ).length === 0 && (
                  <div className="px-3 py-6 text-center text-xs text-akg-muted">
                    No matches for "{searchQuery.trim()}"
                  </div>
                )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
