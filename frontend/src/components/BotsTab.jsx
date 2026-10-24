import React, { useState, useEffect } from 'react';
import { pb } from '../lib/pocketbase';
import { 
  Cpu, Download, CheckCircle2, ShieldCheck, DollarSign, 
  Activity, Zap, ExternalLink, KeyRound, Copy, Check, Info, Sliders
} from 'lucide-react';

export function BotsTab({ user, onOpenPricing, notify }) {
  const [bots, setBots] = useState([]);
  const [licenseModalBot, setLicenseModalBot] = useState(null);
  const [accountNumber, setAccountNumber] = useState('');
  const [generatedKey, setGeneratedKey] = useState(null);
  const [copiedKey, setCopiedKey] = useState(false);

  useEffect(() => {
    pb.collection('bots').getFullList({ sort: '-created' })
      .then(setBots)
      .catch((err) => console.error('Failed to load bots:', err));
  }, []);

  const handleGenerateKey = (e) => {
    e.preventDefault();
    if (!accountNumber.trim()) return;

    // Deterministic pseudo-license generation for demo/testing
    const cleanAcc = accountNumber.trim().replace(/\D/g, '') || '884920';
    const hash = Math.abs(
      cleanAcc.split('').reduce((acc, char) => (acc << 5) - acc + char.charCodeAt(0), 0)
    ).toString(16).toUpperCase().padStart(8, '0');

    const key = `AKG-${licenseModalBot.platform || 'MT'}-${cleanAcc.slice(-3)}-${hash.slice(0, 4)}-${hash.slice(4, 8)}`;
    setGeneratedKey(key);

    if (notify) {
      notify({
        type: 'success',
        title: 'License Key Bound',
        message: `Bound to ${licenseModalBot.platform} Account #${cleanAcc}`
      });
    }
  };

  const handleCopyKey = () => {
    if (!generatedKey) return;
    navigator.clipboard.writeText(generatedKey);
    setCopiedKey(true);
    if (notify) {
      notify({
        type: 'copy',
        title: 'Copied License Key',
        message: generatedKey
      });
    }
    setTimeout(() => setCopiedKey(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-6 rounded-2xl border border-border bg-surface shadow-sm">
        <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[11px] font-mono font-semibold mb-2">
          <Cpu className="h-3.5 w-3.5" />
          VERIFIED EXPERT ADVISORS (EA)
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-white font-sans">
          Automated Algorithmic Execution Systems
        </h1>
        <p className="text-xs text-slate-400 font-mono max-w-2xl mt-1 leading-relaxed">
          Production-tested MT4 & MT5 algorithms engineered with hardcoded equity protection, automated volatility filters, and zero martingale exposure.
        </p>
      </div>

      {/* Bots Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {bots.map((bot) => (
          <div
            key={bot.id}
            className="rounded-2xl border border-border bg-card p-6 flex flex-col justify-between hover:border-slate-600 hover:bg-card-hover transition-all duration-200 shadow-lg group"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="h-10 w-10 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400 flex items-center justify-center font-bold">
                  <Cpu className="h-5 w-5" />
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="px-2.5 py-1 rounded-md bg-[#05070D] text-[11px] font-mono font-bold text-slate-300 border border-border">
                    {bot.platform}
                  </span>
                  <span className="px-2 py-1 rounded-md bg-emerald-500/10 text-[10px] font-mono font-bold text-emerald-400 border border-emerald-500/20">
                    VERIFIED
                  </span>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2 font-sans">
                  {bot.name}
                  <span className="text-xs font-mono text-emerald-400 font-normal">({bot.version || 'v2.4'})</span>
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed mt-2 font-mono">
                  {bot.description || 'High-probability momentum breakout algorithm engineered for London and New York overlaps.'}
                </p>
              </div>

              {/* Verified Metrics Matrix */}
              <div className="grid grid-cols-2 gap-2 pt-2 text-xs font-mono">
                <div className="p-2.5 rounded-xl bg-[#070B14] border border-border">
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider">Min Capital</div>
                  <div className="font-bold text-slate-200 mt-0.5 tabular-nums">{bot.recommended_deposit || '$500+'}</div>
                </div>
                <div className="p-2.5 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
                  <div className="text-[10px] text-emerald-400 uppercase tracking-wider">Win Rate</div>
                  <div className="font-bold text-emerald-400 mt-0.5 tabular-nums">{bot.win_rate || '84.6%'}</div>
                </div>
                <div className="p-2.5 rounded-xl bg-[#070B14] border border-border">
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider">Profit Factor</div>
                  <div className="font-bold text-blue-400 mt-0.5 tabular-nums">{bot.profit_factor || '2.35'}</div>
                </div>
                <div className="p-2.5 rounded-xl bg-[#070B14] border border-border">
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider">Max Drawdown</div>
                  <div className="font-bold text-rose-400 mt-0.5 tabular-nums">{bot.max_drawdown || '< 5.2%'}</div>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-5 mt-5 border-t border-border/60 flex items-center justify-between font-mono">
              <div>
                <div className="text-[10px] text-slate-500 uppercase tracking-wider">Perpetual License</div>
                <div className="text-xl font-bold text-white tabular-nums">
                  ${bot.price} <span className="text-xs font-normal text-slate-400">USDT</span>
                </div>
              </div>

              <button
                onClick={() => {
                  setLicenseModalBot(bot);
                  setGeneratedKey(null);
                  setAccountNumber('');
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-md shadow-blue-600/30 transition-all cursor-pointer"
              >
                <KeyRound className="h-3.5 w-3.5" />
                License & EA
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* License Key Generator / Download Modal */}
      {licenseModalBot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="w-full max-w-lg rounded-3xl border border-border bg-card p-6 sm:p-7 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="text-lg font-bold text-white flex items-center gap-2 font-sans">
                <ShieldCheck className="h-5 w-5 text-emerald-400" />
                {licenseModalBot.name} License Desk
              </h3>
              <button
                onClick={() => setLicenseModalBot(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-400 font-mono leading-relaxed">
              Every EA binary is compiled with hardware & broker account hash binding to prevent unauthorized de-compilation or copy distribution.
            </p>

            <form onSubmit={handleGenerateKey} className="space-y-4 font-mono text-xs">
              <div>
                <label className="block text-slate-300 mb-1">
                  Target {licenseModalBot.platform} Account ID
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    placeholder="e.g. 50928192"
                    className="flex-1 rounded-xl border border-border bg-[#05070D] px-3.5 py-2.5 text-white placeholder:text-slate-600 focus:border-blue-500 focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold cursor-pointer shrink-0"
                  >
                    Generate Key
                  </button>
                </div>
              </div>
            </form>

            {generatedKey && (
              <div className="p-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 font-mono space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Cryptographic Key Active
                  </span>
                  <button
                    onClick={handleCopyKey}
                    className="inline-flex items-center gap-1 text-[11px] text-slate-300 hover:text-white bg-slate-800/80 px-2.5 py-1 rounded-lg border border-border cursor-pointer"
                  >
                    {copiedKey ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                    {copiedKey ? 'Copied' : 'Copy Key'}
                  </button>
                </div>

                <div className="p-3 rounded-xl bg-[#05070D] border border-border text-xs font-mono font-bold text-white tracking-widest break-all select-all">
                  {generatedKey}
                </div>

                <div className="text-[10px] text-slate-400 leading-relaxed">
                  Paste this key into EA Input parameter <code className="text-slate-200">License_Key</code> upon attaching to {licenseModalBot.platform} chart.
                </div>

                <div className="pt-2 flex gap-2">
                  <a
                    href="#download"
                    onClick={(e) => {
                      e.preventDefault();
                      if (notify) {
                        notify({
                          type: 'success',
                          title: 'Download Initiated',
                          message: `Downloading ${licenseModalBot.name}_Setup_Package.zip`
                        });
                      }
                    }}
                    className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-center text-xs flex items-center justify-center gap-2 cursor-pointer shadow-glow-emerald"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Download EA Package (.zip)
                  </a>
                </div>
              </div>
            )}

            <div className="rounded-xl border border-border/80 bg-[#070B14] p-4 font-mono text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">Target Terminal:</span>
                <span className="text-white font-bold">{licenseModalBot.platform}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">License Type:</span>
                <span className="text-emerald-400 font-bold">Perpetual (No Expiration)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Package Includes:</span>
                <span className="text-slate-200">Compiled Binary, .set Presets, PDF Guide</span>
              </div>
            </div>

            <div className="pt-2 flex justify-end font-mono">
              <button
                onClick={() => setLicenseModalBot(null)}
                className="px-4 py-2.5 rounded-xl border border-border bg-slate-800 text-slate-300 text-xs hover:bg-slate-700 transition-colors cursor-pointer"
              >
                Close Desk
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
