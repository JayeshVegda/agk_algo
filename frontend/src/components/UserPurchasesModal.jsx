import React, { useState, useEffect } from 'react';
import { pb } from '../lib/pocketbase';
import { 
  ShieldCheck, Cpu, Zap, KeyRound, Copy, Check, 
  ExternalLink, Download, Clock, HardDrive, AlertCircle, 
  X, CreditCard, ChevronRight, CheckCircle2, ArrowRight,
  LogOut, FileText
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './ui/Card';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';

export function UserPurchasesModal({ isOpen, onClose, user, onOpenPricing, notify }) {
  const [payments, setPayments] = useState([]);
  const [botsList, setBotsList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [copiedKey, setCopiedKey] = useState(null);

  const loadUserData = async () => {
    if (!user?.email) return;
    setLoading(true);
    try {
      const [payRecords, botRecords] = await Promise.all([
        pb.collection('payments').getFullList({
          filter: `user_email = "${user.email}"`,
          sort: '-created'
        }),
        pb.collection('bots').getFullList({ sort: '-created' }).catch(() => [])
      ]);
      setPayments(payRecords);
      setBotsList(botRecords);
    } catch (err) {
      console.error('Failed to load user purchases:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && user?.email) {
      loadUserData();
      const unsub = pb.collection('payments').subscribe('*', () => loadUserData()).catch(() => {});
      return () => { unsub?.then?.((u) => u && u()); };
    }
  }, [isOpen, user?.email]);

  if (!isOpen) return null;

  // Calculate days remaining for signal subscription
  const now = new Date();
  const expiryDate = user?.cycle_expires_at ? new Date(user.cycle_expires_at) : null;
  const isSubscriptionActive = expiryDate && expiryDate > now;
  const daysRemaining = isSubscriptionActive
    ? Math.max(0, Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24)))
    : 0;

  // Filter confirmed bot purchases
  const botPurchases = payments.filter((p) => p.plan?.startsWith('BOT:') && p.status === 'confirmed');
  const pendingPurchases = payments.filter((p) => p.status === 'pending');

  const generateLicenseKey = (botPlanString) => {
    // Expected format: BOT: Bot Name (Platform #AccountNumber)
    const match = botPlanString.match(/BOT:\s*([^(]+)\s*\(([^#]+)#([^)]+)\)/i);
    const platform = match ? match[2].trim() : 'MT5';
    const acc = match ? match[3].trim() : '884920';

    const cleanAcc = acc.replace(/\D/g, '') || '884920';
    const hash = Math.abs(
      cleanAcc.split('').reduce((accVal, char) => (accVal << 5) - accVal + char.charCodeAt(0), 0)
    ).toString(16).toUpperCase().padStart(8, '0');

    return `AKG-${platform}-${cleanAcc.slice(-3)}-${hash.slice(0, 4)}-${hash.slice(4, 8)}`;
  };

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    if (notify) {
      notify({
        type: 'copy',
        title: 'Copied to Clipboard',
        message: text
      });
    }
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <Card className="w-full max-w-2xl bg-[#10141B] border border-white/10 shadow-2xl max-h-[92vh] flex flex-col overflow-hidden my-auto text-[#E7E9EF]">
        
        {/* Header */}
        <CardHeader className="p-4 sm:p-5 pb-3 border-b border-white/10 shrink-0 flex flex-row items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-[#00D878]" />
              <CardTitle className="text-lg font-bold text-white">
                My Purchases & Active Licenses
              </CardTitle>
            </div>
            <CardDescription className="text-xs text-[#A6ADB9] mt-0.5">
              Account: <span className="font-bold text-white">{user?.email}</span>
            </CardDescription>
          </div>
          <button
            onClick={onClose}
            className="text-[#A6ADB9] hover:text-white p-1 rounded-lg cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </CardHeader>

        {/* Scrollable Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6 text-xs">
          
          {/* SECTION 1: SIGNAL SUBSCRIPTION STATUS */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#A6ADB9] flex items-center gap-1.5">
                <Zap className="h-3.5 w-3.5 text-[#F3C653]" />
                <span>Signal Box Membership</span>
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                isSubscriptionActive
                  ? 'bg-[#00D878]/15 text-[#00D878] border border-[#00D878]/30'
                  : 'bg-white/5 text-slate-400 border border-white/10'
              }`}>
                {isSubscriptionActive ? '● ACTIVE' : '○ EXPIRED / NONE'}
              </span>
            </div>

            <div className="p-4 rounded-xl border border-white/10 bg-white/5 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="text-base font-bold text-white flex items-center gap-2">
                    <span>
                      {user?.plan === 'PERFECT_SIGNAL_BOX' ? '⚡ Perfect Signal Box (VIP Tier)' :
                       user?.plan === 'SR_SIGNAL_BOX' ? 'SR Signal Box Standard' :
                       'Free Member Access'}
                    </span>
                  </div>
                  <div className="text-[#A6ADB9] text-[11px] mt-0.5">
                    {isSubscriptionActive ? (
                      <span>Expires on {new Date(user.cycle_expires_at).toLocaleDateString()} (<b>{daysRemaining} days remaining</b>)</span>
                    ) : (
                      <span>No active 30-day signal cycle attached to this account.</span>
                    )}
                  </div>
                </div>

                <Button
                  size="sm"
                  variant={isSubscriptionActive ? 'outline' : 'default'}
                  onClick={() => {
                    onClose();
                    if (onOpenPricing) onOpenPricing();
                  }}
                  className="gap-1.5 text-xs font-bold shrink-0"
                >
                  <CreditCard className="h-3.5 w-3.5" />
                  <span>{isSubscriptionActive ? 'Extend / Upgrade Cycle' : 'Unlock Signal Box ($10 / $20)'}</span>
                </Button>
              </div>
            </div>
          </div>

          {/* SECTION 2: BOUGHT EXPERT ADVISOR BOTS */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#A6ADB9] flex items-center gap-1.5">
                <Cpu className="h-3.5 w-3.5 text-[#00D878]" />
                <span>My Trading Bots Fleet ({botPurchases.length})</span>
              </span>
            </div>

            {botPurchases.length === 0 ? (
              <div className="p-5 rounded-xl border border-white/10 bg-white/5 text-center space-y-2">
                <p className="text-slate-400">No perpetual bot licenses purchased yet.</p>
                <p className="text-[11px] text-slate-500">
                  When you purchase an MT4/MT5 EA binary, your bound account number and official license key appear here.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {botPurchases.map((bp) => {
                  const key = generateLicenseKey(bp.plan);
                  const isCopied = copiedKey === bp.id;

                  // Extract bot clean name and account
                  const match = bp.plan.match(/BOT:\s*([^(]+)\s*\(([^#]+)#([^)]+)\)/i);
                  const botName = match ? match[1].trim() : bp.plan.replace('BOT:', '').trim();
                  const platform = match ? match[2].trim() : 'MT5';
                  const acc = match ? match[3].trim() : '—';

                  return (
                    <div key={bp.id} className="p-4 rounded-xl border border-white/10 bg-[#07090D] space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="gold" className="font-mono text-[10px]">{platform}</Badge>
                          <span className="font-bold text-sm text-white">{botName}</span>
                        </div>
                        <Badge variant="positive" className="text-[10px]">Perpetual License</Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[11px] font-mono bg-white/5 p-2.5 rounded-lg border border-white/5">
                        <div>
                          <span className="text-slate-400">Bound Account:</span>
                          <span className="font-bold text-white ml-1.5">#{acc}</span>
                        </div>
                        <div>
                          <span className="text-slate-400">Paid:</span>
                          <span className="font-bold text-[#F3C653] ml-1.5">${bp.amount} USDT</span>
                        </div>
                      </div>

                      {/* License Key Box */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-400 font-semibold flex items-center gap-1">
                            <KeyRound className="h-3 w-3 text-[#00D878]" />
                            Official Binary License Key:
                          </span>
                          <button
                            onClick={() => handleCopy(key, bp.id)}
                            className="text-[#00D878] hover:underline flex items-center gap-1 cursor-pointer font-bold"
                          >
                            {isCopied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                            <span>{isCopied ? 'Copied' : 'Copy Key'}</span>
                          </button>
                        </div>
                        <div className="p-2.5 rounded-lg bg-black/60 border border-white/10 font-mono text-xs text-[#00D878] break-all select-all flex items-center justify-between">
                          <span>{key}</span>
                        </div>
                      </div>

                      {/* Download Buttons */}
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        {(() => {
                          const ext = platform.toLowerCase().includes('4') ? 'ex4' : 'ex5';
                          const fileSlug = botName.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
                          const downloadPath = `/downloads/${fileSlug}_${platform.toLowerCase().replace(/[^a-z0-9]/g, '')}.${ext}`;
                          const matchedBot = botsList.find(b => b.name.toLowerCase().trim() === botName.toLowerCase().trim());
                          const driveUrl = matchedBot?.download_url || "https://drive.google.com";

                          return (
                            <>
                              <a
                                href={downloadPath}
                                download
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#00D878] text-[#07090D] font-bold hover:bg-[#00F09A] transition-colors text-xs cursor-pointer shadow-xs"
                              >
                                <Download className="h-3.5 w-3.5" />
                                <span>Download .{ext.toUpperCase()} Binary</span>
                              </a>

                              {driveUrl && (
                                <a
                                  href={driveUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600/20 border border-blue-500/30 text-blue-400 font-semibold hover:bg-blue-600/30 transition-colors text-xs"
                                >
                                  <HardDrive className="h-3.5 w-3.5 text-blue-400" />
                                  <span>Google Drive Package</span>
                                  <ExternalLink className="h-3 w-3 text-blue-400" />
                                </a>
                              )}

                              <a
                                href="/downloads/AKG_ALGO_SETUP_GUIDE.txt"
                                download
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white font-semibold hover:bg-white/10 transition-colors text-xs"
                              >
                                <FileText className="h-3.5 w-3.5 text-[#F3C653]" />
                                <span>Setup Guide (.txt)</span>
                              </a>
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* SECTION 3: TRANSACTION & SETTLEMENT HISTORY */}
          <div className="space-y-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#A6ADB9] flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-slate-400" />
              <span>Payment & Settlement Ledger ({payments.length})</span>
            </span>

            {payments.length === 0 ? (
              <div className="p-4 rounded-xl border border-white/10 bg-white/5 text-center text-slate-400">
                No payment transactions recorded for this account.
              </div>
            ) : (
              <div className="divide-y divide-white/5 rounded-xl border border-white/10 bg-white/5 overflow-hidden">
                {payments.map((p) => {
                  const isConfirmed = p.status === 'confirmed';
                  const isPending = p.status === 'pending';

                  return (
                    <div key={p.id} className="p-3.5 flex items-center justify-between gap-3 text-xs">
                      <div className="min-w-0">
                        <div className="font-bold text-white flex items-center gap-2 truncate">
                          <span>${p.amount} USDT</span>
                          <span className="text-slate-400 font-normal">({p.plan})</span>
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5 truncate">
                          {p.network} • {p.txid ? `${p.txid.slice(0, 10)}...${p.txid.slice(-6)}` : 'Demo Test TXID'}
                        </div>
                      </div>

                      <div className="shrink-0 flex items-center gap-2">
                        <Badge variant={isConfirmed ? 'positive' : isPending ? 'secondary' : 'destructive'} className="font-mono text-[10px]">
                          {p.status.toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <CardFooter className="p-4 sm:p-5 pt-3 border-t border-white/10 shrink-0 flex flex-wrap items-center justify-between gap-3 bg-black/40">
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={onClose}
            >
              Close
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                pb.authStore.clear();
                window.location.reload();
              }}
              className="text-rose-400 border-rose-500/20 hover:bg-rose-500/10 text-xs"
            >
              <LogOut className="h-3.5 w-3.5 mr-1" />
              <span>Sign Out</span>
            </Button>
          </div>

          <Button
            size="sm"
            variant="default"
            onClick={() => {
              onClose();
              if (onOpenPricing) onOpenPricing();
            }}
            className="gap-1.5 font-bold"
          >
            <span>Extend / Purchase Services</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
