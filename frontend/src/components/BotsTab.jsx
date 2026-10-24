import React, { useState, useEffect } from 'react';
import { pb } from '../lib/pocketbase';
import { 
  Cpu, Download, CheckCircle2, ShieldCheck, 
  KeyRound, Copy, Check, Info, ArrowRight, X
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './ui/Card';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';

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
    <div className="space-y-8 font-sans text-[#E7E9EF]">
      {/* Header */}
      <div className="p-6 rounded-2xl border border-white/10 bg-[#10141B] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <Badge variant="gold" className="mb-2">
            Verified Expert Advisors
          </Badge>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Automated Algorithmic Execution Systems
          </h1>
          <p className="text-xs text-[#A6ADB9] max-w-2xl mt-1 leading-relaxed">
            Rule-based MT4 & MT5 algorithms with hard stop-loss risk parameters, automated spread protection, and zero martingale exposure.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onOpenPricing}
          className="shrink-0"
        >
          View Signal Plans
        </Button>
      </div>

      {/* Bots Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {bots.map((bot) => (
          <Card
            key={bot.id}
            className="flex flex-col justify-between hover:border-[#F3C653]/40 transition-all bg-[#10141B] border-white/10"
          >
            <div>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="h-9 w-9 rounded-xl bg-[#F3C653]/15 border border-[#F3C653]/30 text-[#F3C653] flex items-center justify-center font-bold">
                    <Cpu className="h-5 w-5" />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Badge variant="secondary">
                      {bot.platform}
                    </Badge>
                    <Badge variant="positive">
                      Verified
                    </Badge>
                  </div>
                </div>

                <CardTitle className="mt-3 text-lg flex items-center justify-between text-white">
                  <span>{bot.name}</span>
                  <span className="text-xs text-[#A6ADB9] font-normal font-mono">({bot.version || 'v2.4'})</span>
                </CardTitle>

                <CardDescription className="mt-1 text-xs text-[#A6ADB9]">
                  {bot.description || 'High-probability momentum breakout algorithm engineered for London and New York overlaps.'}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-3 pt-2">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                    <div className="text-[10px] text-[#A6ADB9] uppercase tracking-wider">Min Capital</div>
                    <div className="font-bold text-white mt-0.5 tabular-nums">{bot.recommended_deposit || '$500+'}</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#00D878]/10 border border-[#00D878]/20">
                    <div className="text-[10px] text-[#00D878] uppercase tracking-wider font-semibold">Risk Policy</div>
                    <div className="font-bold text-[#00D878] mt-0.5">Fixed Stop-Loss</div>
                  </div>
                </div>
              </CardContent>
            </div>

            <CardFooter className="flex items-center justify-between pt-4 border-t border-white/10 mt-4">
              <div>
                <div className="text-[10px] text-[#A6ADB9] uppercase tracking-wider">Perpetual License</div>
                <div className="text-xl font-bold text-white tabular-nums">
                  ${bot.price} <span className="text-xs font-normal text-[#F3C653]">USDT</span>
                </div>
              </div>

              <Button
                size="sm"
                variant="default"
                onClick={() => {
                  setLicenseModalBot(bot);
                  setGeneratedKey(null);
                  setAccountNumber('');
                }}
                className="gap-1.5 font-bold"
              >
                <KeyRound className="h-3.5 w-3.5" />
                <span>Get License</span>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* License Key Generator / Download Modal */}
      {licenseModalBot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <Card className="w-full max-w-lg shadow-2xl space-y-4 bg-[#10141B] border-white/10">
            <CardHeader className="pb-3 border-b border-white/10 flex flex-row items-center justify-between">
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

            <CardContent className="space-y-4">
              <form onSubmit={handleGenerateKey} className="space-y-3 text-xs">
                <div>
                  <label className="block text-[#E7E9EF] font-semibold mb-1">
                    Target {licenseModalBot.platform} Account ID
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      required
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      placeholder="e.g. 50928192"
                      className="flex-1 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-white placeholder:text-[#A6ADB9] focus:border-[#F3C653] focus:outline-none"
                    />
                    <Button type="submit">
                      Generate Key
                    </Button>
                  </div>
                </div>
              </form>

              {generatedKey && (
                <div className="p-4 rounded-xl border border-[#00D878]/30 bg-[#00D878]/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#00D878] flex items-center gap-1.5">
                      <CheckCircle2 className="h-4 w-4" />
                      Cryptographic Key Generated
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCopyKey}
                      className="h-7 text-xs bg-[#10141B]"
                    >
                      {copiedKey ? <Check className="h-3 w-3 text-[#00D878]" /> : <Copy className="h-3 w-3" />}
                      <span>{copiedKey ? 'Copied' : 'Copy Key'}</span>
                    </Button>
                  </div>

                  <div className="p-2.5 rounded-lg bg-[#07090D] border border-white/10 text-xs font-mono font-bold text-[#F3C653] tracking-wider break-all select-all">
                    {generatedKey}
                  </div>

                  <div className="text-[11px] text-[#A6ADB9] leading-relaxed">
                    Paste this key into EA parameter <code className="bg-white/10 px-1 py-0.5 rounded text-white">License_Key</code> upon attaching to your {licenseModalBot.platform} chart.
                  </div>

                  <Button
                    onClick={() => {
                      if (notify) {
                        notify({
                          type: 'success',
                          title: 'Download Initiated',
                          message: `Downloading ${licenseModalBot.name}_Setup_Package.zip`
                        });
                      }
                    }}
                    className="w-full justify-center gap-2 mt-2"
                  >
                    <Download className="h-4 w-4" />
                    <span>Download EA Package (.zip)</span>
                  </Button>
                </div>
              )}

              <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-xs space-y-1.5 text-[#A6ADB9]">
                <div className="flex justify-between">
                  <span>Target Platform:</span>
                  <span className="font-semibold text-white">{licenseModalBot.platform}</span>
                </div>
                <div className="flex justify-between">
                  <span>License Validity:</span>
                  <span className="font-semibold text-[#00D878]">Perpetual (No Expiration)</span>
                </div>
                <div className="flex justify-between">
                  <span>Package Files:</span>
                  <span className="font-medium text-white">Compiled Binary (.ex4/.ex5), Preset Files (.set)</span>
                </div>
              </div>
            </CardContent>

            <CardFooter className="border-t border-white/10 pt-3 flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLicenseModalBot(null)}
              >
                Close
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  );
}
