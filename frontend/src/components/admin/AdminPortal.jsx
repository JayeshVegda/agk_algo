import React, { useEffect, useMemo, useState } from 'react';
import { Command as CommandIcon } from 'lucide-react';
import { pb } from '../../lib/pocketbase';
import {
  RefreshCw, LogOut, Globe, Menu, X, ChevronRight, AlertTriangle,
} from 'lucide-react';
import { NotificationBell } from '../NotificationBell';
import { AdminDataProvider, useAdmin } from './AdminContext';
import { useStats } from './lib/pagedList';
import { useUrlQuery, setParams, replaceParams } from './lib/urlState';
import { MOBILE_TABS, SECTIONS, SECTION_IDS } from './adminNav';
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
      <div className="flex min-h-[100dvh] items-center justify-center bg-akg-bg px-4 font-sans">
        <div className="w-full max-w-sm">
          <div className="rounded-3xl border border-white/10 bg-akg-surface p-7 shadow-2xl">
            <img
              src="/assets/logos/akg-algo-metallic-nav.png"
              alt="AKG ALGO"
              className="mx-auto h-10 w-auto"
            />
            <h1 className="mt-5 text-center font-display text-lg font-bold text-white">Admin Console</h1>
            <p className="mt-1 text-center text-xs text-akg-muted">Administrator access only.</p>

            {loginError && (
              <div className="mt-4 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3.5 py-2.5 text-xs text-rose-300">
                {loginError}
              </div>
            )}

            <form onSubmit={handleLogin} className="mt-5 space-y-3">
              <input
                type="email"
                required
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="admin@example.com"
                className="h-11 w-full rounded-xl border border-white/10 bg-[#0A0D13] px-3.5 text-sm text-white placeholder:text-akg-muted/60 focus:border-[#F3C653]/50 focus:outline-none"
              />
              <input
                type="password"
                required
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="Password"
                className="h-11 w-full rounded-xl border border-white/10 bg-[#0A0D13] px-3.5 text-sm text-white placeholder:text-akg-muted/60 focus:border-[#F3C653]/50 focus:outline-none"
              />
              <button
                type="submit"
                disabled={authBusy}
                className="h-11 w-full rounded-full bg-[linear-gradient(120deg,#E8BC4F_0%,#F3C653_38%,#FFE9A8_58%,#DFAE3E_100%)] text-sm font-bold text-[#1C1403] transition-all active:scale-[0.98] disabled:opacity-50"
              >
                {authBusy ? 'Authenticating...' : 'Sign In'}
              </button>
            </form>

            <button
              onClick={onNavigatePublic}
              className="mt-4 flex w-full items-center justify-center gap-1.5 text-xs font-semibold text-akg-muted transition-colors hover:text-akg-gold"
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
        <ConsoleShell currentUser={currentUser} onLogout={handleLogout} notify={notify} />
      </DensityProvider>
    </AdminDataProvider>
  );
}

function ConsoleShell({ currentUser, onLogout, notify }) {
  const admin = useAdmin();
  const { stats } = useStats();
  const query = useUrlQuery();
  const [section, setSectionState] = useState(() => (SECTION_IDS.has(query.s) ? query.s : query.s === 'connectors' ? 'users' : 'overview'));
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);

  const badges = useMemo(() => ({
    pendingPayments: stats?.payments.pending ?? 0,
    pendingConnectors: stats?.connectors.pending ?? 0,
  }), [stats]);

  const active = SECTIONS.find((s) => s.id === section) || SECTIONS[0];

  const go = (id, extra = {}) => {
    setParams({ s: id, t: extra.t, tab: extra.tab, id: extra.id, f: extra.f, q: extra.q, sort: extra.sort, page: extra.page }, { push: true });
    setSectionState(id);
    setDrawerOpen(false);
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  // Back/forward navigation and palette jumps re-read ?s=.
  useEffect(() => {
    if (query.s && SECTION_IDS.has(query.s) && query.s !== section) {
      setSectionState(query.s);
      setDrawerOpen(false);
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
    // Old ?s=connectors links (bookmarks, notifications) fold into Traders → Managed.
    if (query.s === 'connectors') {
      setSectionState('users');
      replaceParams({ s: 'users', tab: 'managed' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    <div className="admin-shell min-h-[100dvh] bg-akg-bg font-sans text-akg-silver">
      {/* ============ desktop rail ============ */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-white/[0.07] bg-[#0A0D13] lg:flex">
        <div className="flex items-center gap-2.5 border-b border-white/[0.07] px-5 py-4">
          <img src="/assets/logos/akg-algo-metallic-nav.png" alt="AKG ALGO" className="h-8 w-auto" />
        </div>
        <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
          {['Main', 'Desk'].map((group) => (
            <div key={group}>
              <div className="px-3 pb-1.5 font-data text-[9px] uppercase tracking-[0.2em] text-akg-muted/60">{group}</div>
              <div className="space-y-0.5">
                {SECTIONS.filter((s) => s.group === group).map((s) => {
                  const Icon = s.icon;
                  const badge = s.badge ? badges[s.badge] : 0;
                  return (
                    <button
                      key={s.id}
                      onClick={() => go(s.id)}
                      className={cn(
                        'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[13px] font-semibold transition-all',
                        section === s.id
                          ? 'bg-[#F3C653]/12 text-akg-gold ring-1 ring-[#F3C653]/25'
                          : 'text-akg-muted hover:bg-white/[0.04] hover:text-white'
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span className="flex-1 truncate">{s.label}</span>
                      {badge > 0 && (
                        <span className="rounded-full bg-amber-400/20 px-1.5 py-0.5 font-data text-[10px] font-bold text-amber-300">{badge}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
        <div className="border-t border-white/[0.07] p-3">
          <button
            onClick={onLogout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-semibold text-akg-muted transition-colors hover:bg-rose-500/10 hover:text-rose-300"
          >
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
      </aside>

      {/* ============ mobile top bar ============ */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-white/[0.07] bg-akg-bg/90 px-4 backdrop-blur-xl lg:hidden">
        <img src="/assets/logos/akg-algo-metallic-nav.png" alt="AKG ALGO" className="h-7 w-auto" />
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => admin.refresh()}
            className="rounded-full border border-white/10 p-2 text-akg-muted active:scale-95"
            title="Sync"
          >
            <RefreshCw className={cn('h-4 w-4', admin.loading && 'animate-spin')} />
          </button>
          <NotificationBell user={currentUser} notify={notify} />
          <button
            onClick={() => setDrawerOpen(true)}
            className="relative rounded-full border border-white/10 p-2 text-akg-muted active:scale-95"
            aria-label="All sections"
          >
            <Menu className="h-4 w-4" />
            {(badges.pendingPayments + badges.pendingConnectors) > 0 && (
              <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-amber-400" />
            )}
          </button>
        </div>
      </header>

      {/* desktop header strip */}
      <div className="hidden lg:block">
        <div className="flex items-center justify-between px-8 py-4 lg:pl-[17rem]">
          <div className="flex items-center gap-2.5 font-data text-[10px] text-akg-muted">
            <span className="live-dot" /> live console · {stats ? `${stats.payments.total} payments · ${stats.users.total} traders` : 'syncing…'}
          </div>
          <div className="flex items-center gap-2.5">
            {(badges.pendingPayments + badges.pendingConnectors) > 0 && (
              <button
                onClick={() => go('payments', { f: 'pending' })}
                title="Review the Money Queue"
                className="flex items-center gap-1.5 rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1.5 font-data text-[11px] font-bold text-amber-300 transition-colors hover:bg-amber-400/20"
              >
                <AlertTriangle className="h-3.5 w-3.5" />
                {badges.pendingPayments} deposits · {badges.pendingConnectors} bridges
              </button>
            )}
            <button
              onClick={() => setPaletteOpen(true)}
              className="flex items-center gap-1.5 rounded-full border border-white/10 bg-[#0A0D13] px-3 py-1.5 font-data text-[10px] text-akg-muted transition-colors hover:border-[#F3C653]/40 hover:text-akg-silver"
              title="Command palette (Ctrl+K)"
              aria-label="Open command palette"
            >
              <CommandIcon className="h-3 w-3" /> K
            </button>
            <DensityToggle />
            <button
              onClick={() => admin.refresh()}
              className="rounded-full border border-white/10 p-2.5 text-akg-muted transition-colors hover:border-[#F3C653]/40 hover:text-akg-gold"
              title="Sync"
            >
              <RefreshCw className={cn('h-4 w-4', admin.loading && 'animate-spin')} />
            </button>
            <NotificationBell user={currentUser} notify={notify} />
            <div className="flex items-center gap-2.5 rounded-full border border-white/10 py-1 pl-1 pr-3.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#F3C653]/20 font-data text-xs font-bold text-akg-gold">
                {(currentUser.name || currentUser.email)[0].toUpperCase()}
              </span>
              <span className="max-w-[140px] truncate text-xs font-semibold text-white">{currentUser.name || currentUser.email}</span>
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
              <div className="h-8 w-48 animate-pulse rounded bg-white/10" />
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                {[...Array(4)].map((_, i) => <div key={i} className="h-24 animate-pulse rounded-2xl bg-akg-surface" />)}
              </div>
              <div className="h-40 animate-pulse rounded-2xl bg-akg-surface" />
            </div>
          ) : (
            <SectionComponent onNavigate={go} />
          )}
        </div>
      </main>

      {/* ============ mobile bottom tabs ============ */}
      <nav className="fixed inset-x-0 bottom-0 z-30 flex items-stretch justify-around border-t border-white/[0.07] bg-akg-bg/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden">
        {MOBILE_TABS.map((id) => {
          const s = SECTIONS.find((x) => x.id === id);
          const Icon = s.icon;
          const badge = s.badge ? badges[s.badge] : 0;
          return (
            <button
              key={id}
              onClick={() => go(id)}
              className={cn(
                'relative flex min-h-[56px] flex-1 flex-col items-center justify-center gap-0.5 pt-1.5',
                section === id ? 'text-akg-gold' : 'text-akg-muted'
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px] font-bold">{s.short}</span>
              {badge > 0 && (
                <span className="absolute right-[22%] top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-400 px-1 font-data text-[9px] font-bold text-black">
                  {badge}
                </span>
              )}
            </button>
          );
        })}
        <button
          onClick={() => setDrawerOpen(true)}
          className="flex min-h-[56px] flex-1 flex-col items-center justify-center gap-0.5 pt-1.5 text-akg-muted"
        >
          <Menu className="h-5 w-5" />
          <span className="text-[10px] font-bold">More</span>
        </button>
      </nav>

      {/* ============ mobile drawer ============ */}
      <CommandPalette go={go} open={paletteOpen} setOpen={setPaletteOpen} />
      {drawerOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setDrawerOpen(false)} />
          <div className="absolute inset-y-0 right-0 flex w-[290px] flex-col border-l border-white/10 bg-[#0A0D13]">
            <div className="flex items-center justify-between border-b border-white/[0.07] px-5 py-4">
              <span className="font-display text-sm font-bold text-white">All sections</span>
              <button onClick={() => setDrawerOpen(false)} className="rounded-full border border-white/10 p-1.5 text-akg-muted">
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
                      'flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-left text-sm font-semibold transition-all',
                      section === s.id ? 'bg-[#F3C653]/12 text-akg-gold' : 'text-akg-muted hover:bg-white/[0.04] hover:text-white'
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="flex-1">{s.label}</span>
                    {badge > 0 && (
                      <span className="rounded-full bg-amber-400/20 px-1.5 py-0.5 font-data text-[10px] font-bold text-amber-300">{badge}</span>
                    )}
                    <ChevronRight className="h-3.5 w-3.5 opacity-40" />
                  </button>
                );
              })}
            </nav>
            <div className="space-y-1 border-t border-white/[0.07] p-3">
              <div className="px-3.5 py-2 font-data text-[10px] text-akg-muted">{currentUser.email}</div>
              <button
                onClick={onLogout}
                className="flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-semibold text-rose-300 transition-colors hover:bg-rose-500/10"
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
