import React, { useState, useEffect } from 'react';
import { pb } from '../lib/pocketbase';
import { Cpu, Download, CheckCircle, ShieldCheck, DollarSign } from 'lucide-react';

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
      <div className="p-6 rounded-2xl border border-border/80 bg-card/80 backdrop-blur shadow-sm">
        <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[11px] font-mono font-semibold mb-2">
          <Cpu className="h-3 w-3" />
          VERIFIED EXPERT ADVISORS (EA)
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Algorithmic Trading Bots</h1>
        <p className="text-xs text-slate-400 max-w-2xl mt-1">
          Production-tested MT4/MT5 algorithms designed for institutional execution, drawdown minimization, and strict risk parameters.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {bots.map((bot) => (
          <div
            key={bot.id}
            className="rounded-2xl border border-border/80 bg-card/90 backdrop-blur p-6 flex flex-col justify-between hover:border-blue-500/40 transition-all shadow-lg"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="h-10 w-10 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400 flex items-center justify-center font-bold">
                  <Cpu className="h-5 w-5" />
                </div>
                <span className="px-2.5 py-1 rounded-md bg-slate-800 text-[11px] font-mono font-bold text-slate-300 border border-slate-700">
                  {bot.platform}
                </span>
              </div>

              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  {bot.name}
                  <span className="text-xs font-mono text-emerald-400 font-normal">({bot.version})</span>
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed mt-2">{bot.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 text-xs font-mono">
                <div className="p-2.5 rounded-lg bg-background/60 border border-border/50">
                  <div className="text-[10px] text-slate-500 uppercase">Min Deposit</div>
                  <div className="font-bold text-slate-200 mt-0.5">{bot.recommended_deposit || '$500+'}</div>
                </div>
                <div className="p-2.5 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
                  <div className="text-[10px] text-emerald-400 uppercase">Win Rate</div>
                  <div className="font-bold text-emerald-400 mt-0.5">{bot.win_rate || '80%+'}</div>
                </div>
              </div>
            </div>

            <div className="pt-6 mt-6 border-t border-border/60 flex items-center justify-between">
              <div>
                <div className="text-[10px] font-mono text-slate-500 uppercase">One-Time License</div>
                <div className="text-xl font-bold font-mono text-white">${bot.price}</div>
              </div>

              <button
                onClick={() => setDownloadModal(bot)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-md shadow-blue-600/30 transition-all cursor-pointer"
              >
                <Download className="h-4 w-4" />
                Get License & EA
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Download / Purchase Modal */}
      {downloadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-400" />
              {downloadModal.name}
            </h3>
            <p className="text-xs text-slate-400">
              Your license key will be cryptographically bound to your MetaTrader account number upon payment confirmation.
            </p>

            <div className="rounded-xl border border-border/60 bg-background/80 p-4 font-mono text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">Platform:</span>
                <span className="text-white font-bold">{downloadModal.platform}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Price:</span>
                <span className="text-emerald-400 font-bold">${downloadModal.price} USDT</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Delivery:</span>
                <span className="text-white">Instant Compiled (.ex4 / .ex5)</span>
              </div>
            </div>

            <div className="pt-2 flex gap-3">
              <button
                onClick={() => {
                  setDownloadModal(null);
                  onOpenPricing();
                }}
                className="flex-1 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors cursor-pointer"
              >
                Proceed to Checkout (USDT)
              </button>
              <button
                onClick={() => setDownloadModal(null)}
                className="px-4 py-2.5 rounded-lg border border-border bg-slate-800 text-slate-300 text-xs hover:bg-slate-700 transition-colors cursor-pointer"
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
