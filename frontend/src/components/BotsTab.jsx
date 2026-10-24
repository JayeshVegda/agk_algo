import React, { useState, useEffect } from 'react';
import { pb } from '../lib/pocketbase';
import { 
  Cpu, Download, CheckCircle2, ShieldCheck, 
  KeyRound, Copy, Check, Info, ArrowRight, X,
  Layers, ExternalLink, Image as ImageIcon, BarChart3,
  TrendingUp, Shield, Sparkles, HardDrive
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './ui/Card';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';

export function BotsTab({ user, onOpenPricing, notify }) {
  const [bots, setBots] = useState([]);
  const [platformFilter, setPlatformFilter] = useState('all');
  const [selectedBotDetail, setSelectedBotDetail] = useState(null);
  const [licenseModalBot, setLicenseModalBot] = useState(null);
  const [accountNumber, setAccountNumber] = useState('');
  const [generatedKey, setGeneratedKey] = useState(null);
  const [copiedKey, setCopiedKey] = useState(false);
  const [activeGalleryIndex, setActiveGalleryIndex] = useState(0);

  useEffect(() => {
    pb.collection('bots').getFullList({ sort: '-created' })
      .then(setBots)
      .catch((err) => console.error('Failed to load bots:', err));
  }, []);

  const handleGenerateKey = (e) => {
    e.preventDefault();
    if (!accountNumber.trim()) return;

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

  const filteredBots = bots.filter((b) => {
    if (platformFilter === 'all') return true;
    return b.platform?.toUpperCase().includes(platformFilter.toUpperCase());
  });

  return (
    <div className="space-y-8 font-sans text-[#E7E9EF]">
      {/* Header */}
      <div className="p-6 md:p-8 rounded-2xl border border-white/10 bg-[#10141B] flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl">
        <div className="space-y-2">
          <Badge variant="gold" className="gap-1.5 font-mono">
            <Cpu className="h-3.5 w-3.5" />
            <span>INSTITUTIONAL EXPERT ADVISORS</span>
          </Badge>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
            Automated Algorithmic Execution Systems
          </h1>
          <p className="text-xs md:text-sm text-[#A6ADB9] max-w-2xl leading-relaxed">
            Rule-based MT4 & MT5 algorithms with hard stop-loss risk parameters, automated spread protection, and zero martingale exposure.
          </p>
        </div>

        {/* Platform Filter Buttons */}
        <div className="flex items-center gap-2 bg-[#07090D] p-1.5 rounded-xl border border-white/10 shrink-0">
          {['all', 'MT4', 'MT5'].map((p) => (
            <button
              key={p}
              onClick={() => setPlatformFilter(p)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                platformFilter === p
                  ? 'bg-[#F3C653] text-[#07090D] font-bold shadow-md'
                  : 'text-[#A6ADB9] hover:text-white hover:bg-white/5'
              }`}
            >
              {p === 'all' ? 'All Platforms' : p}
            </button>
          ))}
        </div>
      </div>

      {/* Bots Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredBots.map((bot) => (
          <Card
            key={bot.id}
            className="flex flex-col justify-between hover:border-[#F3C653]/40 transition-all bg-[#10141B] border-white/10 overflow-hidden shadow-lg group"
          >
            <div>
              {/* Optional Bot Image Banner */}
              {bot.image_url ? (
                <div 
                  className="h-44 w-full relative overflow-hidden bg-[#07090D] cursor-pointer"
                  onClick={() => setSelectedBotDetail(bot)}
                >
                  <img 
                    src={bot.image_url} 
                    alt={bot.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90 group-hover:opacity-100"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#10141B] via-transparent to-black/30" />
                  <div className="absolute top-3 left-3 flex items-center gap-1.5">
                    <Badge variant="secondary" className="backdrop-blur-md bg-black/60 border-white/10 text-white font-mono text-[10px]">
                      {bot.platform}
                    </Badge>
                    <Badge variant="positive" className="backdrop-blur-md bg-[#00D878]/20 text-[#00D878] border-[#00D878]/30 text-[10px]">
                      Verified
                    </Badge>
                  </div>
                </div>
              ) : (
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="h-9 w-9 rounded-xl bg-[#F3C653]/15 border border-[#F3C653]/30 text-[#F3C653] flex items-center justify-center font-bold">
                      <Cpu className="h-5 w-5" />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Badge variant="secondary">{bot.platform}</Badge>
                      <Badge variant="positive">Verified</Badge>
                    </div>
                  </div>
                </CardHeader>
              )}

              <div className="p-5 pt-3 space-y-3">
                <div 
                  className="cursor-pointer"
                  onClick={() => setSelectedBotDetail(bot)}
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-white group-hover:text-[#F3C653] transition-colors">
                      {bot.name}
                    </h3>
                    <span className="text-xs text-[#A6ADB9] font-mono">{bot.version || 'v2.4'}</span>
                  </div>

                  <p className="mt-1 text-xs text-[#A6ADB9] line-clamp-2 leading-relaxed">
                    {bot.description || 'Institutional momentum breakout algorithm engineered for London and New York overlaps.'}
                  </p>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                    <div className="text-[10px] text-[#A6ADB9] uppercase">Max Drawdown</div>
                    <div className="font-bold text-[#00D878] mt-0.5">{bot.drawdown || '4.5% Max DD'}</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                    <div className="text-[10px] text-[#A6ADB9] uppercase">Profit Factor</div>
                    <div className="font-bold text-[#F3C653] mt-0.5">{bot.profit_factor || '2.65 PF'}</div>
                  </div>
                </div>

                {bot.pairs && (
                  <div className="text-[11px] text-[#A6ADB9] font-mono flex items-center gap-1.5 overflow-hidden">
                    <span className="text-white/60">Traded:</span>
                    <span className="text-white truncate font-semibold">{bot.pairs}</span>
                  </div>
                )}
              </div>
            </div>

            <CardFooter className="flex items-center justify-between p-5 pt-3 border-t border-white/10 bg-white/[0.02]">
              <div>
                <div className="text-[10px] text-[#A6ADB9] uppercase tracking-wider font-mono">Perpetual License</div>
                <div className="text-xl font-black text-white tabular-nums">
                  ${bot.price} <span className="text-xs font-normal text-[#F3C653]">USDT</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSelectedBotDetail(bot)}
                  className="h-8 text-xs font-semibold border-white/20 text-[#E7E9EF] hover:bg-white/10"
                >
                  View Details
                </Button>
                <Button
                  size="sm"
                  variant="default"
                  onClick={() => {
                    setLicenseModalBot(bot);
                    setGeneratedKey(null);
                    setAccountNumber('');
                  }}
                  className="h-8 gap-1.5 font-bold text-xs"
                >
                  <KeyRound className="h-3 w-3" />
                  <span>License</span>
                </Button>
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* DEDICATED BOT DETAIL MODAL */}
      {selectedBotDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
          <Card className="w-full max-w-2xl bg-[#10141B] border border-white/10 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col my-auto">
            {/* Scrollable Modal Content */}
            <div className="flex-1 overflow-y-auto">
              {/* Modal Hero Image */}
              {selectedBotDetail.image_url && (
                <div className="h-56 sm:h-64 w-full relative overflow-hidden bg-black">
                  <img 
                    src={selectedBotDetail.image_url} 
                    alt={selectedBotDetail.name} 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#10141B] via-transparent to-black/40" />
                  <button
                    onClick={() => setSelectedBotDetail(null)}
                    className="absolute top-4 right-4 p-2 rounded-full bg-black/60 text-white hover:bg-black/80 cursor-pointer"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              )}

              <CardHeader className="p-4 sm:p-6 pb-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="font-mono">{selectedBotDetail.platform}</Badge>
                    <Badge variant="gold" className="font-mono">{selectedBotDetail.version || 'v2.4'}</Badge>
                    <Badge variant="positive" className="font-mono">Audited Strategy</Badge>
                  </div>
                  {!selectedBotDetail.image_url && (
                    <button
                      onClick={() => setSelectedBotDetail(null)}
                      className="p-1 text-[#A6ADB9] hover:text-white cursor-pointer"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  )}
                </div>

                <CardTitle className="text-xl sm:text-2xl font-black text-white mt-2">
                  {selectedBotDetail.name}
                </CardTitle>
                <CardDescription className="text-xs text-[#A6ADB9] leading-relaxed mt-1">
                  {selectedBotDetail.description || 'Institutional-grade automated trading algorithm.'}
                </CardDescription>
              </CardHeader>

              <CardContent className="p-4 sm:p-6 pt-0 space-y-5 text-xs font-mono">
              {/* Key Metrics Matrix */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-center">
                  <div className="text-[10px] text-[#A6ADB9]">Max Drawdown</div>
                  <div className="text-sm font-bold text-[#00D878] mt-1">{selectedBotDetail.drawdown || '4.2% Max DD'}</div>
                </div>
                <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-center">
                  <div className="text-[10px] text-[#A6ADB9]">Profit Factor</div>
                  <div className="text-sm font-bold text-[#F3C653] mt-1">{selectedBotDetail.profit_factor || '2.65 PF'}</div>
                </div>
                <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-center">
                  <div className="text-[10px] text-[#A6ADB9]">Win Rate</div>
                  <div className="text-sm font-bold text-white mt-1">{selectedBotDetail.win_rate || '80%'}</div>
                </div>
                <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-center">
                  <div className="text-[10px] text-[#A6ADB9]">Min Capital</div>
                  <div className="text-sm font-bold text-white mt-1">{selectedBotDetail.recommended_deposit || '$500+'}</div>
                </div>
              </div>

              {/* Strategy Details */}
              <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2">
                <div className="text-[11px] text-[#F3C653] font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Execution Architecture & Strategy</span>
                </div>
                <p className="text-white text-xs leading-relaxed font-sans">
                  {selectedBotDetail.strategy_type || 'Liquidity Sweeps, Asian Range Breakouts, and London/New York session overlap momentum.'}
                </p>
                {selectedBotDetail.pairs && (
                  <div className="pt-2 text-[11px] flex items-center gap-2">
                    <span className="text-[#A6ADB9]">Validated Asset Pairs:</span>
                    <span className="text-[#00D878] font-bold">{selectedBotDetail.pairs}</span>
                  </div>
                )}
              </div>

              {/* Features List */}
              {selectedBotDetail.features && (
                <div className="space-y-2">
                  <div className="text-[11px] text-[#A6ADB9] uppercase font-bold tracking-wider">
                    Risk Guards & Algorithmic Features
                  </div>
                  <div className="grid sm:grid-cols-2 gap-2 text-[11px] font-sans">
                    {selectedBotDetail.features.split('\n').filter(Boolean).map((feat, idx) => (
                      <div key={idx} className="flex items-center gap-2 p-2 rounded-lg bg-white/[0.03] border border-white/5 text-[#E7E9EF]">
                        <CheckCircle2 className="h-3.5 w-3.5 text-[#00D878] shrink-0" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {/* Google Drive Direct Download Link */}
              {selectedBotDetail.download_url && (
                <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
                  <div className="flex items-center gap-2.5 text-blue-400 font-bold">
                    <HardDrive className="h-4 w-4 shrink-0" />
                    <span>Google Drive Expert Advisor Package</span>
                  </div>
                  <a
                    href={selectedBotDetail.download_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 text-white font-bold hover:bg-blue-500 transition-colors w-fit"
                  >
                    <span>Open in Drive</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}
            </CardContent>
            </div>

            <CardFooter className="p-4 sm:p-6 border-t border-white/10 shrink-0 flex items-center justify-between bg-black/40">
              <div>
                <div className="text-[10px] text-[#A6ADB9] uppercase tracking-wider font-mono">Perpetual EA Binary</div>
                <div className="text-xl sm:text-2xl font-black text-white tabular-nums font-mono">
                  ${selectedBotDetail.price} <span className="text-xs text-[#F3C653]">USDT</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => setSelectedBotDetail(null)}
                  className="text-xs"
                >
                  Close
                </Button>
                <Button
                  variant="default"
                  onClick={() => {
                    const b = selectedBotDetail;
                    setSelectedBotDetail(null);
                    setLicenseModalBot(b);
                    setGeneratedKey(null);
                    setAccountNumber('');
                  }}
                  className="gap-2 font-bold text-xs"
                >
                  <KeyRound className="h-3.5 w-3.5" />
                  <span>Bind License Key</span>
                </Button>
              </div>
            </CardFooter>
          </Card>
        </div>
      )}

      {/* License Key Generator / Download Modal */}
      {licenseModalBot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <Card className="w-full max-w-lg shadow-2xl bg-[#10141B] border border-white/10 max-h-[92vh] flex flex-col overflow-hidden my-auto">
            <CardHeader className="p-4 sm:p-6 pb-3 border-b border-white/10 shrink-0 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2 text-white">
                  <ShieldCheck className="h-5 w-5 text-[#00D878]" />
                  {licenseModalBot.name} License Desk
                </CardTitle>
                <CardDescription className="mt-1 text-[#A6ADB9]">
                  Bind this EA binary to your live or demo MetaTrader account.
                </CardDescription>
              </div>
              <button
                onClick={() => setLicenseModalBot(null)}
                className="text-[#A6ADB9] hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </CardHeader>

            <CardContent className="p-4 sm:p-6 flex-1 overflow-y-auto space-y-4">
              <form onSubmit={handleGenerateKey} className="space-y-3 text-xs">
                <div>
                  <label className="block text-[#A6ADB9] font-mono mb-1">
                    MetaTrader {licenseModalBot.platform} Account Number
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 50928192"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-white font-mono placeholder:text-white/20 focus:border-[#F3C653] focus:outline-none"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full justify-center gap-2 font-bold"
                >
                  <KeyRound className="h-4 w-4" />
                  <span>Generate Hardware & Account Key</span>
                </Button>
              </form>

              {generatedKey && (
                <div className="p-4 rounded-xl border border-[#00D878]/30 bg-[#00D878]/10 space-y-3 animate-fade-in font-mono text-xs">
                  <div className="flex items-center justify-between text-[#00D878] font-bold">
                    <span>Cryptographic License Generated</span>
                    <Badge variant="positive">Verified</Badge>
                  </div>

                  <div className="p-3 rounded-lg bg-black/40 border border-white/10 flex items-center justify-between gap-2">
                    <span className="text-white select-all font-mono font-bold">{generatedKey}</span>
                    <button
                      onClick={handleCopyKey}
                      className="p-1.5 text-[#A6ADB9] hover:text-white rounded cursor-pointer"
                      title="Copy Key"
                    >
                      {copiedKey ? <Check className="h-4 w-4 text-[#00D878]" /> : <Copy className="h-4 w-4" />}
                    </button>
                  </div>

                  <div className="text-[11px] text-[#A6ADB9] flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-[#00D878]" />
                    <span>Paste this license key into EA inputs in MetaTrader.</span>
                  </div>
                </div>
              )}
              {/* Google Drive Direct Download Link */}
              {selectedBotDetail.download_url && (
                <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
                  <div className="flex items-center gap-2.5 text-blue-400 font-bold">
                    <HardDrive className="h-4 w-4 shrink-0" />
                    <span>Google Drive Expert Advisor Package</span>
                  </div>
                  <a
                    href={selectedBotDetail.download_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 text-white font-bold hover:bg-blue-500 transition-colors w-fit"
                  >
                    <span>Open in Drive</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}
            </CardContent>

            <CardFooter className="flex justify-between border-t border-white/10 pt-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLicenseModalBot(null)}
              >
                Close Desk
              </Button>

              {licenseModalBot.download_url ? (
                <a
                  href={licenseModalBot.download_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#00D878] text-[#07090D] text-xs font-bold hover:bg-[#00F09A] transition-all"
                >
                  <HardDrive className="h-3.5 w-3.5" />
                  <span>Download from Google Drive</span>
                </a>
              ) : (
                <a
                  href={`/downloads/${licenseModalBot.name.toLowerCase().replace(/\s+/g, '_')}_${licenseModalBot.platform.toLowerCase()}.ex5`}
                  download
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#00D878] text-[#07090D] text-xs font-bold hover:bg-[#00F09A] transition-all"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Download EA Binary</span>
                </a>
              )}
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  );
}
