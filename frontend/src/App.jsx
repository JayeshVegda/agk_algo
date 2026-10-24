import React, { useState, useEffect, useCallback } from 'react';
import { pb } from './lib/pocketbase';
import { TickerBar } from './components/TickerBar';
import { Navbar } from './components/Navbar';
import { LandingPage } from './components/LandingPage';
import { SignalsTab } from './components/SignalsTab';
import { BotsTab } from './components/BotsTab';
import { ChartsTab } from './components/ChartsTab';
import { ConnectorTab } from './components/ConnectorTab';
import { BroadcastsTab } from './components/BroadcastsTab';
import { PricingTab } from './components/PricingTab';
import { AdminTab } from './components/AdminTab';
import { AuthModal } from './components/AuthModal';
import { ToastContainer } from './components/Toast';

export default function App() {
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

  useEffect(() => {
    // Listen for auth store changes
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

  return (
    <div className="min-h-screen bg-[#05070D] text-slate-100 flex flex-col justify-between selection:bg-blue-600/30 selection:text-blue-400 bg-grid-pattern">
      <div>
        <TickerBar />
        <Navbar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          user={user}
          onOpenAuth={() => setAuthOpen(true)}
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

          {activeTab === 'admin' && user?.role === 'admin' && (
            <AdminTab 
              user={user} 
              notify={notify}
            />
          )}
        </main>
      </div>

      {/* Global Terminal Footer */}
      <footer className="border-t border-border/80 bg-[#070B14] py-12 text-xs text-slate-500 font-mono mt-20">
        <div className="max-w-7xl mx-auto px-4 space-y-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-white text-sm tracking-wider">AKG ALGO</span>
                <span className="text-slate-600">·</span>
                <span className="text-slate-400">Institutional Quantitative Trading Infrastructure</span>
              </div>
              <p className="text-[11px] text-slate-500 max-w-lg">
                High-probability volatility signals, verified MT4 & MT5 algorithmic expert advisors, and simulated low-latency execution routing.
              </p>
            </div>

            <div className="flex items-center gap-6 text-[11px]">
              <button 
                onClick={() => { setActiveTab('signals'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                Signals
              </button>
              <button 
                onClick={() => { setActiveTab('bots'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                Quant Bots
              </button>
              <button 
                onClick={() => { setActiveTab('connector'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                Connector Demo
              </button>
              <button 
                onClick={() => { setActiveTab('pricing'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                Plans
              </button>
            </div>
          </div>

          <div className="pt-6 border-t border-border/40 flex flex-col sm:flex-row justify-between items-center gap-4 text-[11px]">
            <div className="flex items-center gap-4 text-slate-400">
              <span>Engine: <span className="text-emerald-400 font-medium">PocketBase Go / SQLite</span></span>
              <span>•</span>
              <span>SSE Realtime: <span className="text-emerald-400 font-medium">Online</span></span>
              <span>•</span>
              <span>Latency: <span className="text-emerald-400 font-medium">&lt; 0.9ms</span></span>
            </div>
            <div className="text-slate-500">
              © 2026 AKG ALGO. Strict Regulatory Risk Compliance.
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
