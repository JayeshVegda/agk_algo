import React, { useEffect, useMemo, useState } from 'react';
import { Command as CommandIcon, Sun, Moon } from 'lucide-react';
import { pb } from '../../lib/pocketbase';
import {
  RefreshCw, LogOut, Globe, Menu, X, ChevronRight, AlertTriangle,
} from 'lucide-react';
import { NotificationBell } from '../NotificationBell';
import { useTheme } from '../../lib/theme';
import { Button } from '../ui/Button';
import { AdminDataProvider, useAdmin } from './AdminContext';
import { useStats } from './lib/pagedList';
import { useUrlQuery, setParams, replaceParams } from './lib/urlState';
import { MOBILE_TABS, SECTIONS, SECTION_IDS, GROUPS } from './adminNav';
import { DensityProvider, DensityToggle, useDensity } from './components/Density';
import CommandPalette from './components/CommandPalette';
import Overview from './sections/Overview';
import Payments from './sections/Payments';
import Signals from './sections/Signals';
import Bots from './sections/Bots';
import Briefings from './sections/Briefings';
import Resources from './sections/Resources';
import Users from './sections/Users';
import Settings from './sections/Settings';
import { cn } from '../../lib/utils';

export function AdminPortal({ onNavigatePublic, notify }) {
  const [currentUser, setCurrentUser] = useState(pb.authStore.record);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState(null);
  const [authBusy, setAuthBusy] = useState(false);
  const { isDark, toggleTheme } = useTheme();

  useEffect(() => {
    const unsub = pb.authStore.onChange((token, model) => setCurrentUser(model));
    return () => unsub();
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError(null);
    setAuthBusy(true);
    try {
      const authData = await pb.collection('users').authWithPassword(loginEmail, loginPassword);
      if (authData.record.role !== 'admin') {
        pb.authStore.clear();
        setLoginError('Account does not have Administrator privileges.');
        return;
      }
    } catch (err) {
      setLoginError(err.message || 'Authentication error. Check your credentials.');
    } finally {
      setAuthBusy(false);
    }
  };

  const handleLogout = () => {
    pb.authStore.clear();
    window.location.reload();
  };

  /* ------------------------- login gate ------------------------- */
  if (!currentUser || currentUser.role !== 'admin') {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-akg-bg px-4 font-sans text-akg-text">
        <div className="w-full max-w-sm">
          <div className="relative rounded-2xl border border-slate-200/90 dark:border-white/10 bg-white dark:bg-akg-card p-7 shadow-2xl">
            <button
              onClick={toggleTheme}
              className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 dark:border-white/10 text-akg-muted hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
              title={isDark ? 'Switch to Light theme' : 'Switch to Dark theme'}
              aria-label="Toggle theme"
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>

            <img
              src="/assets/logos/akg-algo-metallic-nav.png"
              alt="AKG ALGO"
              className="mx-auto h-10 w-auto opacity-95"
            />
            <h1 className="mt-5 text-center font-display text-xl font-bold text-slate-900 dark:text-white">Admin Console</h1>
            <p className="mt-1 text-center text-xs text-akg-muted">Administrator access only.</p>

            {loginError && (
              <div className="mt-4 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3.5 py-2.5 text-xs text-rose-500 dark:text-rose-600 dark:text-rose-400">
                {loginError}
              </div>
            )}

            <form onSubmit={handleLogin} className="mt-5 space-y-3.5">
              <input
                type="email"
                required
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="admin@example.com"
                className="h-11 w-full rounded-xl border border-slate-300 dark:border-white/15 bg-slate-50 dark:bg-akg-raised px-3.5 text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-akg-muted/60 focus:border-emerald-500 focus:bg-white dark:focus:bg-akg-raised focus:outline-none"
              />
              <input
                type="password"
                required
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="Password"
                className="h-11 w-full rounded-xl border border-slate-300 dark:border-white/15 bg-slate-50 dark:bg-akg-raised px-3.5 text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-akg-muted/60 focus:border-emerald-500 focus:bg-white dark:focus:bg-akg-raised focus:outline-none"
              />
              <Button
                type="submit"
                variant="gradient"
                size="lg"
                disabled={authBusy}
                className="w-full font-bold text-sm shadow-md"
              >
                {authBusy ? 'Authenticating...' : 'Sign In'}
              </Button>
            </form>

            <button
              onClick={onNavigatePublic}
              className="mt-4 flex w-full items-center justify-center gap-1.5 text-xs font-semibold text-akg-muted transition-colors hover:text-emerald-600 dark:hover:text-akg-accent cursor-pointer"
            >
              <Globe className="h-3.5 w-3.5" /> Return to public website
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ------------------------- console shell ------------------------- */
  return (
    <AdminDataProvider currentUser={currentUser} notify={notify}>
      <DensityProvider>
        <ConsoleShell currentUser={currentUser} onLogout={handleLogout} notify={notify} onNavigatePublic={onNavigatePublic} />
      </DensityProvider>
    </AdminDataProvider>
  );
}

function ConsoleShell({ currentUser, onLogout, notify, onNavigatePublic }) {
  const admin = useAdmin();
  const { stats } = useStats();
  const query = useUrlQuery();
  const { isDark, toggleTheme } = useTheme();
  const [section, setSectionState] = useState(() => (SECTION_IDS.has(query.s) ? query.s : query.s === 'connectors' ? 'users' : 'overview'));
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);

  const badges = useMemo(() => ({
    pendingPayments: stats?.payments.pending ?? 0,
    pendingConnectors: stats?.connectors.pending ?? 0,
  }), [stats]);

  const [collapsed, setCollapsed] = useState(() => {
    try { return JSON.parse(localStorage.getItem('akg.admin.navGroups') || '[]'); } catch { return []; }
  });
  const toggleGroup = (gid) => setCollapsed((c) => {
    const next = c.includes(gid) ? c.filter((x) => x !== gid) : [...c, gid];
    try { localStorage.setItem('akg.admin.navGroups', JSON.stringify(next)); } catch { /* private */ }
    return next;
  });

  const active = SECTIONS.find((s) => s.id === section) || SECTIONS[0];

  const go = (id, extra = {}) => {
    setParams({ s: id, t: extra.t, tab: extra.tab, id: extra.id, f: extra.f, q: extra.q, sort: extra.sort, page: extra.page }, { push: true });
    setSectionState(id);
    setDrawerOpen(false);
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  useEffect(() => {
    if (query.s && SECTION_IDS.has(query.s) && query.s !== section) {
      setSectionState(query.s);
      setDrawerOpen(false);
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
    if (query.s === 'connectors') {
      setSectionState('users');
      replaceParams({ s: 'users', tab: 'managed' });
    }
  }, [query.s]);

  const SectionComponent = {
    overview: Overview,
    payments: Payments,
    signals: Signals,
    bots: Bots,
    briefings: Briefings,
    resources: Resources,
    users: Users,
    settings: Settings,
  }[section];

  return (
    <div className="admin-shell min-h-[100dvh] bg-akg-bg font-sans text-akg-text">
      {/* ============ desktop rail ============ */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-akg-hairline bg-akg-card lg:flex">
        <div className="flex items-center gap-2.5 border-b border-akg-hairline px-5 py-4">
          <img src="/assets/logos/akg-algo-metallic-nav.png" alt="AKG ALGO" className="h-8 w-auto opacity-90" />
        </div>
        <nav className="flex-1 space-y-4 overflow-y-auto px-3 py-4">
          {GROUPS.map((g) => {
            const items = SECTIONS.filter((s) => s.group === g.id);
            const groupBadge = items.reduce((n, s) => n + (s.badge ? badges[s.badge] || 0 : 0), 0);
            const isCollapsed = collapsed.includes(g.id);
            return (
              <div key={g.id}>
                <button
                  onClick={() => toggleGroup(g.id)}
                  aria-expanded={!isCollapsed}
                  className="flex w-full items-center gap-1.5 px-3 pb-1.5 font-mono text-[9px] uppercase tracking-wider text-akg-muted/70 transition-colors hover:text-akg-text cursor-pointer"
                >
                  <ChevronRight className={cn('h-3 w-3 transition-transform', !isCollapsed && 'rotate-90')} />
                  <span className="flex-1 text-left">{g.label}</span>
                  {groupBadge > 0 && (
                    <span className="rounded-md bg-amber-100 dark:bg-amber-500/20 px-1.5 py-px font-mono text-[9px] font-bold text-amber-900 dark:text-amber-600 dark:text-amber-400 border border-amber-300/60 dark:border-amber-500/30">{groupBadge}</span>
                  )}
                </button>
                {!isCollapsed && (
                  <div className="space-y-0.5">
                    {items.map((s) => {
                      const Icon = s.icon;
                      const badge = s.badge ? badges[s.badge] : 0;
                      return (
                        <button
                          key={s.id}
                          onClick={() => go(s.id)}
                          className={cn(
                            'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-[13px] font-semibold transition-all cursor-pointer',
                            section === s.id
                              ? 'bg-emerald-500/10 text-emerald-800 dark:text-akg-accent ring-1 ring-emerald-500/25 font-bold'
                              : 'text-slate-600 dark:text-akg-muted hover:bg-slate-100 dark:hover:bg-akg-raised hover:text-slate-900 dark:hover:text-akg-text'
                          )}
                        >
                          <Icon className="h-4 w-4 shrink-0" />
                          <span className="flex-1 truncate">{s.label}</span>
                          {badge > 0 && (
                            <span className="rounded-md bg-amber-100 dark:bg-amber-500/20 px-1.5 py-0.5 font-mono text-[10px] font-bold text-amber-900 dark:text-amber-600 dark:text-amber-400 border border-amber-300/60 dark:border-amber-500/30">{badge}</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
        <div className="border-t border-akg-hairline p-3">
          <button
            onClick={onLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-semibold text-rose-500 dark:text-rose-600 dark:text-rose-400 transition-colors hover:bg-rose-500/10 cursor-pointer"
          >
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
      </aside>

      {/* ============ mobile top bar ============ */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-akg-hairline bg-akg-card/90 px-4 backdrop-blur-xl lg:hidden">
        <img src="/assets/logos/akg-algo-metallic-nav.png" alt="AKG ALGO" className="h-7 w-auto opacity-90" />
        <div className="flex items-center gap-1.5">
          <button
            onClick={toggleTheme}
            className="rounded-lg border border-akg-hairline bg-akg-card p-2 text-akg-muted active:scale-95 cursor-pointer"
            title={isDark ? 'Switch to Light theme' : 'Switch to Dark theme'}
            aria-label="Toggle theme"
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          <button
            onClick={() => admin.refresh()}
            className="rounded-lg border border-akg-hairline bg-akg-card p-2 text-akg-muted active:scale-95 cursor-pointer"
            title="Sync"
          >
            <RefreshCw className={cn('h-4 w-4', admin.loading && 'animate-spin')} />
          </button>
          <NotificationBell user={currentUser} notify={notify} />
          <button
            onClick={() => setDrawerOpen(true)}
            className="relative rounded-lg border border-akg-hairline bg-akg-card p-2 text-akg-muted active:scale-95 cursor-pointer"
            aria-label="All sections"
          >
            <Menu className="h-4 w-4" />
            {(badges.pendingPayments + badges.pendingConnectors) > 0 && (
              <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-amber-500" />
            )}
          </button>
        </div>
      </header>

      {/* desktop header strip */}
      <div className="hidden lg:block">
        <div className="flex items-center justify-between px-8 py-4 lg:pl-[17rem]">
          <div className="flex items-center gap-2.5 font-mono text-[10px] text-akg-muted">
            <span className="live-dot" /> live console · {stats ? `${stats.payments.total} payments · ${stats.users.total} traders` : 'syncing...'}
          </div>
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => onNavigatePublic?.()}
              className="flex items-center gap-1.5 rounded-lg border border-akg-hairline bg-akg-card px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-akg-muted hover:text-emerald-700 dark:hover:text-akg-accent hover:border-emerald-500/40 transition-colors cursor-pointer"
              title="Return to Public Website"
            >
              <Globe className="h-3.5 w-3.5" /> Public Desk
            </button>
            {(badges.pendingPayments + badges.pendingConnectors) > 0 && (
              <button
                onClick={() => go('payments', { f: 'pending' })}
                title="Review the Money Queue"
                className="flex items-center gap-1.5 rounded-md border border-amber-300 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 px-3 py-1.5 font-mono text-[11px] font-bold text-amber-900 dark:text-amber-600 dark:text-amber-400 transition-colors hover:bg-amber-100 dark:hover:bg-amber-500/20 cursor-pointer"
              >
                <AlertTriangle className="h-3.5 w-3.5" />
                {badges.pendingPayments} deposits · {badges.pendingConnectors} bridges
              </button>
            )}
            <button
              onClick={() => setPaletteOpen(true)}
              className="flex items-center gap-1.5 rounded-lg border border-akg-hairline bg-akg-card px-3 py-1.5 font-mono text-[10px] text-akg-muted transition-colors hover:border-akg-accent/40 hover:text-akg-text cursor-pointer"
              title="Command palette (Ctrl+K)"
              aria-label="Open command palette"
            >
              <CommandIcon className="h-3 w-3" /> K
            </button>
            <DensityToggle />
            <button
              onClick={toggleTheme}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-akg-hairline bg-akg-card text-akg-muted hover:text-akg-text transition-colors cursor-pointer"
              title={isDark ? 'Switch to Light theme' : 'Switch to Dark theme'}
              aria-label="Toggle theme"
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <button
              onClick={() => admin.refresh()}
              className="rounded-lg border border-akg-hairline bg-akg-card p-2 text-akg-muted transition-colors hover:border-akg-accent/40 hover:text-akg-accent cursor-pointer"
              title="Sync"
            >
              <RefreshCw className={cn('h-4 w-4', admin.loading && 'animate-spin')} />
            </button>
            <NotificationBell user={currentUser} notify={notify} />
            <div className="flex items-center gap-2 rounded-lg border border-akg-hairline bg-akg-card py-1 pl-1.5 pr-3">
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-emerald-500/15 font-mono text-xs font-bold text-akg-accent">
                {(currentUser.name || currentUser.email)[0].toUpperCase()}
              </span>
              <span className="max-w-[140px] truncate text-xs font-semibold text-akg-text">{currentUser.name || currentUser.email}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ============ content ============ */}
      <main
        className="px-4 py-5 sm:px-6 lg:py-6 lg:pl-[16.5rem] lg:pr-8"
        style={{ paddingBottom: 'max(7rem, calc(env(safe-area-inset-bottom) + 5rem))' }}
      >
        <div className="mx-auto w-full max-w-[1400px]">
          {admin.loading && admin.bots.length === 0 ? (
            <div className="space-y-4">
              <div className="h-8 w-48 animate-pulse rounded bg-akg-raised" />
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                {[...Array(4)].map((_, i) => <div key={i} className="h-24 animate-pulse rounded-xl bg-akg-card border border-akg-hairline" />)}
              </div>
              <div className="h-40 animate-pulse rounded-xl bg-akg-card border border-akg-hairline" />
            </div>
          ) : (
            <SectionComponent onNavigate={go} />
          )}
        </div>
      </main>

      {/* ============ mobile bottom tabs ============ */}
      <nav className="fixed inset-x-0 bottom-0 z-30 flex items-stretch justify-around border-t border-akg-hairline bg-akg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden">
        {MOBILE_TABS.map((id) => {
          const s = SECTIONS.find((x) => x.id === id);
          const Icon = s.icon;
          const badge = s.badge ? badges[s.badge] : 0;
          return (
            <button
              key={id}
              onClick={() => go(id)}
              className={cn(
                'relative flex min-h-[56px] flex-1 flex-col items-center justify-center gap-0.5 pt-1.5 cursor-pointer',
                section === id ? 'text-akg-accent' : 'text-akg-muted'
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px] font-semibold">{s.short}</span>
              {badge > 0 && (
                <span className="absolute right-[22%] top-1 flex h-4 min-w-4 items-center justify-center rounded-md bg-amber-500 px-1 font-mono text-[9px] font-bold text-black">
                  {badge}
                </span>
              )}
            </button>
          );
        })}
        <button
          onClick={() => setDrawerOpen(true)}
          className="flex min-h-[56px] flex-1 flex-col items-center justify-center gap-0.5 pt-1.5 text-akg-muted cursor-pointer"
        >
          <Menu className="h-5 w-5" />
          <span className="text-[10px] font-semibold">More</span>
        </button>
      </nav>

      {/* ============ mobile drawer ============ */}
      <CommandPalette go={go} open={paletteOpen} setOpen={setPaletteOpen} />
      {drawerOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setDrawerOpen(false)} />
          <div className="absolute inset-y-0 right-0 flex w-[290px] flex-col border-l border-akg-hairline bg-akg-card">
            <div className="flex items-center justify-between border-b border-akg-hairline px-5 py-4">
              <span className="font-display text-sm font-bold text-akg-text">All sections</span>
              <button onClick={() => setDrawerOpen(false)} className="rounded-lg border border-akg-hairline p-1.5 text-akg-muted cursor-pointer">
                <X className="h-4 w-4" />
              </button>
            </div>
            <nav className="flex-1 space-y-1 overflow-y-auto p-3">
              {SECTIONS.map((s) => {
                const Icon = s.icon;
                const badge = s.badge ? badges[s.badge] : 0;
                return (
                  <button
                    key={s.id}
                    onClick={() => go(s.id)}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-lg px-3.5 py-3 text-left text-sm font-semibold transition-all cursor-pointer',
                      section === s.id ? 'bg-emerald-500/10 text-akg-accent' : 'text-akg-muted hover:bg-akg-raised hover:text-akg-text'
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="flex-1">{s.label}</span>
                    {badge > 0 && (
                      <span className="rounded-md bg-amber-500/20 px-1.5 py-0.5 font-mono text-[10px] font-bold text-amber-700 dark:text-amber-400">{badge}</span>
                    )}
                    <ChevronRight className="h-3.5 w-3.5 opacity-40" />
                  </button>
                );
              })}
            </nav>
            <div className="space-y-1 border-t border-akg-hairline p-3">
              <div className="px-3.5 py-2 font-mono text-[10px] text-akg-muted">{currentUser.email}</div>
              <button
                onClick={onLogout}
                className="flex w-full items-center gap-3 rounded-lg px-3.5 py-3 text-sm font-semibold text-rose-600 dark:text-rose-400 transition-colors hover:bg-rose-500/10 cursor-pointer"
              >
                <LogOut className="h-4 w-4" /> Sign out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
