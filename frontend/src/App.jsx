import React, { useState, useEffect, useCallback, Suspense, lazy } from 'react';
import { pb } from './lib/pocketbase';
import { Navbar } from './components/Navbar';
import { LandingPage } from './components/LandingPage';
import { SignalsTab } from './components/SignalsTab';
import { BotsTab } from './components/BotsTab';
import { ChartsTab } from './components/ChartsTab';
import { ConnectorTab } from './components/ConnectorTab';
import { BroadcastsTab } from './components/BroadcastsTab';
import { PricingTab } from './components/PricingTab';
import { ResourcesTab } from './components/ResourcesTab';
// The admin portal is a 200+ KB chunk most visitors never open: load on demand.
const AdminPortal = lazy(() => import('./components/admin/AdminPortal').then((m) => ({ default: m.AdminPortal })));
import { AuthModal } from './components/AuthModal';
import { AccountTab } from './components/AccountTab';
import { CheckoutPage } from './components/CheckoutPage';
import { TrackRecordPage } from './components/TrackRecordPage';
import { TermsPage, RefundPage, RiskPage, PrivacyPage } from './components/LegalPages';
import { ToastContainer } from './components/Toast';
import { Footer } from './components/Footer';
import { Compass, Zap, Cpu, Network, User } from 'lucide-react';

// Public tab routes: path -> tab id. Tabs are URL-addressable so any page
// (and any bot product page) can be shared or refreshed directly.
const TAB_ROUTES = {
  '/': 'home',
  '/signals': 'signals',
  '/bots': 'bots',
  '/pricing': 'pricing',
  '/charts': 'charts',
  '/desk': 'broadcasts',
  '/kit': 'resources',
  '/account': 'account',
  '/checkout': 'checkout',
  '/track-record': 'track',
  '/terms': 'terms',
  '/refund': 'refund',
  '/risk': 'risk',
  '/privacy': 'privacy',
};

const pathToTab = (pathname) => {
  if (pathname.startsWith('/admin')) return '/admin';
  if (pathname.startsWith('/bots')) return 'bots'; // includes /bots/<slug> product pages
  return TAB_ROUTES[pathname] || 'home';
};

export default function App() {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);
  const [activeTab, setActiveTab] = useState(() => {
    const t = pathToTab(window.location.pathname);
    return t === '/admin' ? 'home' : t;
  });
  const [user, setUser] = useState(pb.authStore.record);
  const [authOpen, setAuthOpen] = useState(false);
  const [toasts, setToasts] = useState([]);

  // Toast notification dispatcher
  const notify = useCallback((toast) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 9);
    const newToast = { id, type: 'info', ...toast };
    setToasts((prev) => [...prev, newToast]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3800);
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Listen for browser back/forward buttons
  useEffect(() => {
    const onPopState = () => {
      setCurrentPath(window.location.pathname);
      const t = pathToTab(window.location.pathname);
      setActiveTab(t === '/admin' ? 'home' : t);
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  // Tab switch keeps the URL in sync: every tab is a shareable path.
  const switchTab = useCallback((tab, botSlug) => {
    const pathForTab = Object.entries(TAB_ROUTES).find(([, id]) => id === tab)?.[0] || '/';
    const path = botSlug && tab === 'bots' ? `/bots/${botSlug}` : pathForTab;
    if (window.location.pathname !== path) {
      window.history.pushState({}, '', path);
    }
    setCurrentPath(path);
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const navigateTo = (path) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
    if (!path.startsWith('/admin')) {
      const t = pathToTab(path);
      setActiveTab(t === '/admin' ? 'home' : t);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    const unsub = pb.authStore.onChange((token, model) => {
      setUser(model);
      if (model) {
        notify({
          type: 'success',
          title: 'Authenticated Session',
          message: `Logged in as ${model.email} (${model.role.toUpperCase()})`
        });
      }
    });
    return () => unsub();
  }, [notify]);

  // Real-time synchronization for current user record (plan upgrades, cycle expiration, role changes)
  useEffect(() => {
    if (!user?.id) return;
    const unsubPromise = pb.collection('users').subscribe(user.id, (e) => {
      if (e.action === 'update') {
        setUser(e.record);
        pb.authStore.save(pb.authStore.token, e.record);
        notify({
          type: 'success',
          title: 'Membership Tier Synced',
          message: `Your account was updated: ${e.record.plan === 'PERFECT_SIGNAL_BOX' ? '⚡ Perfect Signal VIP' : e.record.plan === 'SR_SIGNAL_BOX' ? 'SR Signal Box' : 'Standard'}`
        });
      }
    }).catch((err) => {
      console.warn('Realtime user subscription warning:', err);
    });

    return () => {
      unsubPromise.then((unsub) => unsub && unsub()).catch(() => {});
    };
  }, [user?.id, notify]);

  // =========================================================================
  // DEDICATED STANDALONE ADMIN PORTAL (/admin)
  // Completely separate page, template, and layout without public navigation
  // =========================================================================
  if (currentPath === '/admin') {
    return (
      <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
        <Suspense fallback={<div className="p-10 text-center text-sm text-slate-500">Loading admin console...</div>}>
          <AdminPortal
            onNavigatePublic={() => navigateTo('/')}
            notify={notify}
          />
        </Suspense>
        <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      </div>
    );
  }

  // =========================================================================
  // PUBLIC WEBSITE (/)
  // Full consumer experience with market ticker, public navbar, and catalog
  // =========================================================================
  // Deep-linkable bot product pages: /bots/<slug>
  const botSlug = currentPath.startsWith('/bots/')
    ? decodeURIComponent(currentPath.slice('/bots/'.length)) || null
    : null;

  return (
    <div className="min-h-screen bg-[#07090D] text-[#E7E9EF] flex flex-col justify-between selection:bg-[#F3C653]/20 selection:text-[#F3C653] font-sans">
      <div>
        <Navbar
          activeTab={activeTab}
          setActiveTab={switchTab}
          user={user}
          notify={notify}
          onOpenAuth={() => setAuthOpen(true)}
          onNavigateAdmin={() => navigateTo('/admin')}
          onOpenAccount={() => switchTab('account')}
        />

        <main className="w-[94%] max-w-[1750px] mx-auto px-2 sm:px-4 lg:px-6 py-6 pb-24 md:pb-6">
          {activeTab === 'home' && (
            <LandingPage
              onNavigate={switchTab}
              onOpenAuth={() => setAuthOpen(true)}
              notify={notify}
            />
          )}

          {activeTab === 'signals' && (
            <SignalsTab
              user={user}
              onOpenPricing={() => switchTab('pricing')}
              onOpenAuth={() => setAuthOpen(true)}
              notify={notify}
            />
          )}

          {activeTab === 'bots' && (
            <BotsTab
              user={user}
              botSlug={botSlug}
              onOpenBot={(slug) => switchTab('bots', slug)}
              onNavigate={(tab) => switchTab(tab)}
              onOpenPricing={() => switchTab('pricing')}
              onOpenAuth={() => setAuthOpen(true)}
              notify={notify}
            />
          )}

          {activeTab === 'charts' && <ChartsTab />}

          {activeTab === 'connector' && (
            <ConnectorTab
              user={user}
              onOpenAuth={() => setAuthOpen(true)}
              notify={notify}
            />
          )}

          {activeTab === 'broadcasts' && (
            <BroadcastsTab
              user={user}
              notify={notify}
            />
          )}

          {activeTab === 'pricing' && (
            <PricingTab
              user={user}
              onOpenAuth={() => setAuthOpen(true)}
              onNavigate={(tab) => switchTab(tab)}
              onNavigateSignals={() => switchTab('signals')}
              notify={notify}
            />
          )}

          {activeTab === 'resources' && (
            <ResourcesTab
              notify={notify}
              onNavigate={(tab) => switchTab(tab)}
            />
          )}

          {activeTab === 'checkout' && (
            <CheckoutPage
              user={user}
              onOpenAuth={() => setAuthOpen(true)}
              onNavigate={switchTab}
              notify={notify}
            />
          )}

          {activeTab === 'track' && <TrackRecordPage />}

          {activeTab === 'terms' && <TermsPage />}
          {activeTab === 'refund' && <RefundPage />}
          {activeTab === 'risk' && <RiskPage />}
          {activeTab === 'privacy' && <PrivacyPage />}

          {activeTab === 'account' && (
            <AccountTab
              user={user}
              notify={notify}
              onNavigate={(tab) => switchTab(tab)}
              onOpenAuth={() => setAuthOpen(true)}
            />
          )}
        </main>
      </div>

      <Footer
        onNavigate={switchTab}
        user={user}
        onNavigateAdmin={() => navigateTo('/admin')}
      />

      {/* Auth Modal */}
      <AuthModal
        isOpen={authOpen}
        onClose={() => setAuthOpen(false)}
        onAuthSuccess={(u) => {
          setUser(u);
          notify({
            type: 'success',
            title: 'Welcome Back',
            message: `Signed in as ${u.name || u.email}`
          });
        }}
      />

      {/* Mobile Bottom Navigation Dock for Android & Mobile Web */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#07090D]/95 backdrop-blur-xl border-t border-white/10 px-2 py-1.5 flex items-center justify-around shadow-2xl safe-area-pb">
        <button
          onClick={() => switchTab('home')}
          className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl cursor-pointer transition-all ${
            activeTab === 'home' ? 'text-[#F3C653]' : 'text-[#A6ADB9] hover:text-white'
          }`}
        >
          <Compass className="h-5 w-5" />
          <span className="text-[10px] font-bold">Overview</span>
        </button>

        <button
          onClick={() => switchTab('signals')}
          className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl cursor-pointer transition-all relative ${
            activeTab === 'signals' ? 'text-[#00D878]' : 'text-[#A6ADB9] hover:text-white'
          }`}
        >
          <div className="relative">
            <Zap className="h-5 w-5" />
            <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-[#00D878] animate-pulse" />
          </div>
          <span className="text-[10px] font-bold">Signals</span>
        </button>

        <button
          onClick={() => switchTab('bots')}
          className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl cursor-pointer transition-all ${
            activeTab === 'bots' ? 'text-[#F3C653]' : 'text-[#A6ADB9] hover:text-white'
          }`}
        >
          <Cpu className="h-5 w-5" />
          <span className="text-[10px] font-bold">Bots</span>
        </button>

        <button
          onClick={() => switchTab('connector')}
          className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl cursor-pointer transition-all ${
            activeTab === 'connector' ? 'text-purple-400' : 'text-[#A6ADB9] hover:text-white'
          }`}
        >
          <Network className="h-5 w-5" />
          <span className="text-[10px] font-bold">Manage</span>
        </button>

        <button
          onClick={() => {
            if (user) {
              switchTab('account');
            } else {
              setAuthOpen(true);
            }
          }}
          className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl cursor-pointer transition-all relative ${
            activeTab === 'account' && user ? 'text-[#00D878]' : 'text-[#A6ADB9] hover:text-white'
          }`}
        >
          <div className="relative">
            <User className="h-5 w-5" />
            {user && (
              <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-[#00D878]" />
            )}
          </div>
          <span className="text-[10px] font-bold truncate max-w-[55px]">
            {user ? 'Account' : 'Sign In'}
          </span>
        </button>
      </nav>

      {/* Global Toast Container */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
