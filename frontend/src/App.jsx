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
import { AdminPortal } from './components/admin/AdminPortal';
import { AuthModal } from './components/AuthModal';
import { ToastContainer } from './components/Toast';

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
    <div className="min-h-screen bg-white text-slate-800 flex flex-col justify-between selection:bg-emerald-100 selection:text-emerald-900 font-sans">
      <div>
        <Navbar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          user={user}
          onOpenAuth={() => setAuthOpen(true)}
          onNavigateAdmin={() => navigateTo('/admin')}
        />

        <main className="max-w-7xl mx-auto px-4 py-8">
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
              notify={notify}
            />
          )}
        </main>
      </div>

      {/* Global Clean White-Green Consumer Footer */}
      <footer className="border-t border-slate-200 bg-slate-50 py-10 text-xs text-slate-500 mt-20">
        <div className="max-w-7xl mx-auto px-4 space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-slate-900 text-sm tracking-tight">AKG ALGO</span>
                <span className="text-slate-400">·</span>
                <span className="text-slate-600 font-medium">MetaTrader Algorithmic Trading Systems</span>
              </div>
              <p className="text-xs text-slate-500 max-w-lg leading-relaxed">
                Automated Expert Advisors and real-time execution signals with strict stop-loss protection.
              </p>
            </div>

            <div className="flex items-center gap-6 text-xs">
              <button 
                onClick={() => { setActiveTab('signals'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                className="text-slate-600 hover:text-emerald-700 transition-colors cursor-pointer font-medium"
              >
                Signals
              </button>
              <button 
                onClick={() => { setActiveTab('bots'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                className="text-slate-600 hover:text-emerald-700 transition-colors cursor-pointer font-medium"
              >
                Trading Bots
              </button>
              <button 
                onClick={() => { setActiveTab('connector'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                className="text-slate-600 hover:text-emerald-700 transition-colors cursor-pointer font-medium"
              >
                Connector Demo
              </button>
              <button 
                onClick={() => { setActiveTab('pricing'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                className="text-slate-600 hover:text-emerald-700 transition-colors cursor-pointer font-medium"
              >
                Pricing Plans
              </button>
              {user?.role === 'admin' && (
                <button
                  onClick={() => navigateTo('/admin')}
                  className="text-emerald-700 font-bold hover:underline cursor-pointer flex items-center gap-1"
                >
                  Admin Console →
                </button>
              )}
            </div>
          </div>

          <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs">
            <div className="flex items-center gap-4 text-slate-600">
              <span>Platform: <span className="text-emerald-700 font-semibold">MT4 & MT5</span></span>
              <span>•</span>
              <span>Settlement: <span className="text-emerald-700 font-semibold">USDT Direct</span></span>
              <span>•</span>
              <span>Zero Card Rebills</span>
            </div>
            <div className="text-slate-400">
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

      {/* Global Toast Container */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
