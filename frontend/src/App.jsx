import React, { useState, useEffect, useCallback } from 'react';
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
import { AdminPortal } from './components/admin/AdminPortal';
import { AuthModal } from './components/AuthModal';
import { AccountTab } from './components/AccountTab';
import { ToastContainer } from './components/Toast';
import { Compass, Zap, Cpu, Network, User } from 'lucide-react';

export default function App() {
  const [currentPath, setCurrentPath] = useState(
    window.location.pathname.startsWith('/admin') ? '/admin' : window.location.pathname
  );
  const [activeTab, setActiveTab] = useState('home');
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
      setCurrentPath(window.location.pathname.startsWith('/admin') ? '/admin' : window.location.pathname);
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  // Client-side router navigation helper
  const navigateTo = (path) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path.startsWith('/admin') ? '/admin' : path);
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
        <AdminPortal
          onNavigatePublic={() => navigateTo('/')}
          notify={notify}
        />
        <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      </div>
    );
  }

  // =========================================================================
  // PUBLIC WEBSITE (/)
  // Full consumer experience with market ticker, public navbar, and catalog
  // =========================================================================
  return (
    <div className="min-h-screen bg-[#07090D] text-[#E7E9EF] flex flex-col justify-between selection:bg-[#F3C653]/20 selection:text-[#F3C653] font-sans">
      <div>
        <Navbar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          user={user}
          notify={notify}
          onOpenAuth={() => setAuthOpen(true)}
          onNavigateAdmin={() => navigateTo('/admin')}
          onOpenAccount={() => {
            setActiveTab('account');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />

        <main className="w-[94%] max-w-[1750px] mx-auto px-2 sm:px-4 lg:px-6 py-6 pb-24 md:pb-6">
          {activeTab === 'home' && (
            <LandingPage
              onNavigate={(tab) => {
                setActiveTab(tab);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onOpenAuth={() => setAuthOpen(true)}
              notify={notify}
            />
          )}

          {activeTab === 'signals' && (
            <SignalsTab 
              user={user} 
              onOpenPricing={() => setActiveTab('pricing')} 
              onOpenAuth={() => setAuthOpen(true)}
              notify={notify}
            />
          )}

          {activeTab === 'bots' && (
            <BotsTab 
              user={user} 
              onOpenPricing={() => setActiveTab('pricing')}
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
              onNavigateSignals={() => setActiveTab('signals')}
              notify={notify}
            />
          )}

          {activeTab === 'resources' && (
            <ResourcesTab
              notify={notify}
            />
          )}

          {activeTab === 'account' && (
            <AccountTab
              user={user}
              notify={notify}
              onNavigate={(tab) => {
                setActiveTab(tab);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onOpenAuth={() => setAuthOpen(true)}
            />
          )}
        </main>
      </div>

      {/* Global Brand Kit Consumer Footer */}
      <footer className="border-t border-white/10 bg-[#07090D] py-12 text-xs text-[#A6ADB9] mt-20">
        <div className="w-[94%] max-w-[1750px] mx-auto px-2 sm:px-4 space-y-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="space-y-2">
              <img 
                src="/assets/logos/akg-algo-symbol-transparent.png" 
                alt="AKG ALGO — Trade Smarter" 
                className="h-10 w-auto"
              />
              <p className="text-xs text-[#A6ADB9] max-w-lg leading-relaxed">
                Automated MetaTrader Expert Advisors and institutional execution signals with strict stop-loss protection.
              </p>
            </div>

            <div className="flex items-center gap-6 text-xs flex-wrap">
              <button 
                onClick={() => { setActiveTab('signals'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                className="text-[#A6ADB9] hover:text-[#F3C653] transition-colors cursor-pointer font-medium"
              >
                Signals
              </button>
              <button 
                onClick={() => { setActiveTab('bots'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                className="text-[#A6ADB9] hover:text-[#F3C653] transition-colors cursor-pointer font-medium"
              >
                Trading Bots
              </button>
              <button 
                onClick={() => { setActiveTab('connector'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                className="text-[#A6ADB9] hover:text-[#F3C653] transition-colors cursor-pointer font-medium"
              >
                Connector Demo
              </button>
              <button 
                onClick={() => { setActiveTab('pricing'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                className="text-[#A6ADB9] hover:text-[#F3C653] transition-colors cursor-pointer font-medium"
              >
                Plans & Pricing
              </button>
              <button 
                onClick={() => { setActiveTab('resources'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                className="text-[#A6ADB9] hover:text-[#00D878] transition-colors cursor-pointer font-medium"
              >
                Downloads & Links
              </button>
              {user?.role === 'admin' && (
                <button
                  onClick={() => navigateTo('/admin')}
                  className="text-[#F3C653] font-bold hover:underline cursor-pointer flex items-center gap-1"
                >
                  Admin Console →
                </button>
              )}
            </div>
          </div>

          <div className="pt-6 border-t border-white/10 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs">
            <div className="flex items-center gap-4 text-[#A6ADB9]">
              <span>Platform: <span className="text-[#00D878] font-semibold">MT4 & MT5</span></span>
              <span>•</span>
              <span>Settlement: <span className="text-[#F3C653] font-semibold">USDT Direct</span></span>
              <span>•</span>
              <span>Perpetual Licenses & 30D Cycles</span>
            </div>
            <div className="text-white/40">
              © 2026 AKG ALGO. All rights reserved.
            </div>
          </div>
        </div>
      </footer>

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
          onClick={() => { setActiveTab('home'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
          className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl cursor-pointer transition-all ${
            activeTab === 'home' ? 'text-[#F3C653]' : 'text-[#A6ADB9] hover:text-white'
          }`}
        >
          <Compass className="h-5 w-5" />
          <span className="text-[10px] font-bold">Overview</span>
        </button>

        <button
          onClick={() => { setActiveTab('signals'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
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
          onClick={() => { setActiveTab('bots'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
          className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl cursor-pointer transition-all ${
            activeTab === 'bots' ? 'text-[#F3C653]' : 'text-[#A6ADB9] hover:text-white'
          }`}
        >
          <Cpu className="h-5 w-5" />
          <span className="text-[10px] font-bold">Bots</span>
        </button>

        <button
          onClick={() => { setActiveTab('connector'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
          className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl cursor-pointer transition-all ${
            activeTab === 'connector' ? 'text-purple-400' : 'text-[#A6ADB9] hover:text-white'
          }`}
        >
          <Network className="h-5 w-5" />
          <span className="text-[10px] font-bold">Bridge</span>
        </button>

        <button
          onClick={() => {
            if (user) {
              setActiveTab('account');
              window.scrollTo({ top: 0, behavior: 'smooth' });
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
