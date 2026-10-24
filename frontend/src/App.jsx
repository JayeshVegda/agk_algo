import React, { useState, useEffect, useCallback } from 'react';
import { pb } from './lib/pocketbase';
import { TickerBar } from './components/TickerBar';
import { Navbar } from './components/Navbar';
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
  const [activeTab, setActiveTab] = useState('signals');
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
      <footer className="border-t border-border/80 bg-[#070B14] py-8 text-xs text-slate-500 font-mono mt-16">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-200">AKG ALGO</span>
            <span className="text-slate-600">·</span>
            <span>Institutional Precision Trading Systems</span>
          </div>

          <div className="flex items-center gap-6 text-[11px]">
            <span>Engine: <span className="text-emerald-400 font-medium">PocketBase Go / SQLite</span></span>
            <span>Realtime: <span className="text-emerald-400 font-medium">Active SSE Stream</span></span>
            <span>Latency: <span className="text-emerald-400 font-medium">&lt; 0.9ms</span></span>
            <span className="text-slate-400">© 2026 AKG ALGO</span>
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
