import React, { useState, useEffect } from 'react';
import { pb } from '../lib/pocketbase';
import { Cpu, Download, CheckCircle, ShieldCheck, DollarSign, Activity, Zap, ExternalLink } from 'lucide-react';

export function BotsTab({ user, onOpenPricing }) {
  const [bots, setBots] = useState([]);
  const [downloadModal, setDownloadModal] = useState(null);

  useEffect(() => {
    pb.collection('bots').getFullList({ sort: '-created' })
      .then(setBots)
      .catch((err) => console.error('Failed to load bots:', err));
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-6 rounded-2xl border border-border bg-surface shadow-sm">
        <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[11px] font-mono font-semibold mb-2">
          <Cpu className="h-3.5 w-3.5" />
          VERIFIED EXPERT ADVISORS (EA)
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-white font-sans">Automated Algorithmic Execution Systems</h1>
        <p className="text-xs text-slate-400 font-mono max-w-2xl mt-1 leading-relaxed">
          Production-tested MT4 & MT5 algorithms with hardcoded drawdown stops, automated trailing stops, and multi-session volatility filters.
        </p>
      </div>

      {/* Bots Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {bots.map((bot) => (
          <div
            key={bot.id}
            className="rounded-2xl border border-border bg-card p-6 flex flex-col justify-between hover:border-slate-700 hover:bg-card-hover transition-all shadow-lg"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="h-10 w-10 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400 flex items-center justify-center font-bold">
                  <Cpu className="h-5 w-5" />
                </div>
                <span className="px-2.5 py-1 rounded-md bg-[#090e18] text-[11px] font-mono font-bold text-slate-300 border border-border">
                  {bot.platform}
                </span>
              </div>

              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2 font-sans">
                  {bot.name}
                  <span className="text-xs font-mono text-emerald-400 font-normal">({bot.version || 'v2.1'})</span>
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed mt-2 font-mono">{bot.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 text-xs font-mono">
                <div className="p-2.5 rounded-xl bg-[#090e18] border border-border/80">
                  <div className="text-[10px] text-slate-500 uppercase">Min Deposit</div>
                  <div className="font-bold text-slate-200 mt-0.5">{bot.recommended_deposit || '$500+'}</div>
                </div>
                <div className="p-2.5 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
                  <div className="text-[10px] text-emerald-400 uppercase">Win Rate</div>
                  <div className="font-bold text-emerald-400 mt-0.5">{bot.win_rate || '82%+'}</div>
                </div>
              </div>
            </div>

            <div className="pt-6 mt-6 border-t border-border/60 flex items-center justify-between font-mono">
              <div>
                <div className="text-[10px] text-slate-500 uppercase">Perpetual License</div>
                <div className="text-xl font-bold text-white">${bot.price} <span className="text-xs font-normal text-slate-400">USDT</span></div>
              </div>

              <button
                onClick={() => setDownloadModal(bot)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-md shadow-blue-600/30 transition-all cursor-pointer"
              >
                <Download className="h-4 w-4" />
                License & EA
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Download / Purchase Modal */}
      {downloadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2 font-sans">
              <ShieldCheck className="h-5 w-5 text-emerald-400" />
              {downloadModal.name} License
            </h3>
            <p className="text-xs text-slate-400 font-mono leading-relaxed">
              Your license key will be cryptographically bound to your MetaTrader account ID. Includes compiled binary (.ex4/.ex5), full presets (.set files), and setup guide.
            </p>

            <div className="rounded-xl border border-border/80 bg-[#090e18] p-4 font-mono text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">Target Terminal:</span>
                <span className="text-white font-bold">{downloadModal.platform}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">License Fee:</span>
                <span className="text-emerald-400 font-bold">${downloadModal.price} USDT (One-Time)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Delivery:</span>
                <span className="text-white">Instant Compiled Download</span>
              </div>
            </div>

            <div className="pt-2 flex gap-3 font-mono">
              <button
                onClick={() => {
                  setDownloadModal(null);
                  onOpenPricing();
                }}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors cursor-pointer"
              >
                Proceed to Checkout (USDT)
              </button>
              <button
                onClick={() => setDownloadModal(null)}
                className="px-4 py-2.5 rounded-xl border border-border bg-slate-800 text-slate-300 text-xs hover:bg-slate-700 transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
