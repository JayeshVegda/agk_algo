import React, { useState, useEffect } from 'react';
import { pb } from './lib/pocketbase';
import { TickerBar } from './components/TickerBar';
import { Navbar } from './components/Navbar';
import { SignalsTab } from './components/SignalsTab';
import { BotsTab } from './components/BotsTab';
import { ChartsTab } from './components/ChartsTab';
import { ConnectorTab } from './components/ConnectorTab';
import { BroadcastsTab } from './components/BroadcastsTab';
import { PricingTab } from './components/PricingTab';
import { AuthModal } from './components/AuthModal';
import { Shield, ExternalLink } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('signals');
  const [user, setUser] = useState(pb.authStore.record);
  const [authOpen, setAuthOpen] = useState(false);

  useEffect(() => {
    // Listen for auth store changes
    const unsub = pb.authStore.onChange((token, model) => {
      setUser(model);
    });
    return () => unsub();
  }, []);

  return (
    <div className="min-h-screen bg-background text-slate-100 flex flex-col justify-between">
      <div>
        <TickerBar />
        <Navbar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          user={user}
          onOpenAuth={() => setAuthOpen(true)}
        />

        <main className="max-w-7xl mx-auto px-4 py-8">
          {activeTab === 'signals' && <SignalsTab user={user} />}
          {activeTab === 'bots' && <BotsTab user={user} onOpenPricing={() => setActiveTab('pricing')} />}
          {activeTab === 'charts' && <ChartsTab />}
          {activeTab === 'connector' && <ConnectorTab user={user} onOpenAuth={() => setAuthOpen(true)} />}
          {activeTab === 'broadcasts' && <BroadcastsTab />}
          {activeTab === 'pricing' && <PricingTab user={user} onOpenAuth={() => setAuthOpen(true)} />}
        </main>
      </div>

      {/* Global Footer */}
      <footer className="border-t border-border/60 bg-[#05080f] py-8 text-xs text-slate-500 font-mono mt-16">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-300">AKG ALGO</span>
            <span>· Institutional Precision Trading Systems</span>
          </div>

          <div className="flex items-center gap-6">
            <span>Server: <span className="text-emerald-400">PocketBase Go / SQLite</span></span>
            <span>Latency: <span className="text-emerald-400">&lt; 1ms</span></span>
            <span className="text-slate-400">© 2026 AKG ALGO. All rights reserved.</span>
          </div>
        </div>
      </footer>

      {/* Auth Modal */}
      <AuthModal
        isOpen={authOpen}
        onClose={() => setAuthOpen(false)}
        onAuthSuccess={(u) => setUser(u)}
      />
    </div>
  );
}
