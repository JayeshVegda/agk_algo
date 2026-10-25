import React, { useState, useEffect } from 'react';
import { pb } from '../lib/pocketbase';
import { 
  Cpu, Download, CheckCircle2, ShieldCheck, 
  KeyRound, Copy, Check, Info, ArrowRight, X,
  Layers, ExternalLink, Image as ImageIcon, BarChart3,
  TrendingUp, Shield, Sparkles, HardDrive, CreditCard,
  Clock, AlertCircle
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './ui/Card';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { downloadLinksFor } from '../lib/utils';

export function BotsTab({ user, onOpenPricing, onOpenAuth, notify }) {
  const [bots, setBots] = useState([]);
  const [platformFilter, setPlatformFilter] = useState('all');
  const [selectedBotDetail, setSelectedBotDetail] = useState(null);
  const [checkoutBot, setCheckoutBot] = useState(null);
  
  // Checkout state
  const [checkoutAccount, setCheckoutAccount] = useState('');
  const [checkoutNetwork, setCheckoutNetwork] = useState('USDT-TRC20');
  const [checkoutTxid, setCheckoutTxid] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [purchaseResult, setPurchaseResult] = useState(null);
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState(false);
  
  // User confirmed purchases
  const [myPurchases, setMyPurchases] = useState([]);

  const WALLETS = {
    'USDT-TRC20': 'TLa2g9Y8kP2qXvL1b8Jp9wZmN4qK7dEf9A',
    'USDT-BEP20': '0x71C2B81F1A9D4E72b83A072fCc8295b7A19D38Ef',
    'USDT-ERC20': '0x71C2B81F1A9D4E72b83A072fCc8295b7A19D38Ef',
  };

  const loadBots = async () => {
    try {
      const records = await pb.collection('bots').getFullList({ sort: '-created' });
      setBots(records);
    } catch (err) {
      console.error('Failed to load bots:', err);
    }
  };

  const loadUserPurchases = async () => {
    if (!user?.email) return;
    try {
      const records = await pb.collection('payments').getFullList({
        filter: `user_email = "${user.email}"`,
        sort: '-created'
      });
      setMyPurchases(records);
    } catch (err) {
      console.error('Failed to load user bot purchases:', err);
    }
  };

  useEffect(() => {
    loadBots();
  }, []);

  useEffect(() => {
    if (user?.email) {
      loadUserPurchases();
      const unsub = pb.collection('payments').subscribe('*', () => loadUserPurchases()).catch(() => {});
      return () => { unsub?.then?.((u) => u && u()); };
    }
  }, [user?.email]);

  const handleCopy = (text, type = 'key') => {
    navigator.clipboard.writeText(text);
    if (type === 'key') setCopiedKey(true);
    if (type === 'address') setCopiedAddress(true);

    if (notify) {
      notify({
        type: 'copy',
        title: 'Copied to Clipboard',
        message: text
      });
    }
    setTimeout(() => {
      setCopiedKey(false);
      setCopiedAddress(false);
    }, 2000);
  };

  const openCheckout = (bot) => {
    if (!user) {
      if (notify) {
        notify({
          type: 'info',
          title: 'Sign In Required',
          message: 'Please sign in or register to purchase and bind trading bots.'
        });
      }
      if (onOpenAuth) onOpenAuth();
      return;
    }

    // A payment for this bot is already awaiting desk verification.
    if (isBotPending(bot.name)) {
      if (notify) {
        notify({
          type: 'info',
          title: 'Verification in Progress',
          message: `Your payment for ${bot.name} is being verified. The license key is issued automatically once approved.`
        });
      }
      return;
    }

    // Check if user already owns this bot
    const existing = getOwnedPurchase(bot.name);
    if (existing) {      const match = existing.plan.match(/BOT:\s*([^(]+)\s*\(([^#]+)#([^)]+)\)/i);
      const acc = match ? match[3].trim() : '—';
      setCheckoutBot(bot);
      setPurchaseResult({
        status: 'confirmed',
        bot,
        account: acc,
        key: existing.license_key || '',
        txid: existing.txid,
        isExisting: true
      });
      return;
    }

    setCheckoutBot(bot);
    setCheckoutAccount('');
    setCheckoutTxid('');
    setPurchaseResult(null);
  };

  // Submit purchase: logs the payment as pending; the license key is issued
  // server-side once the desk approves the payment.
  const handlePurchase = async () => {
    if (!user) {
      if (onOpenAuth) onOpenAuth();
      return;
    }

    if (!checkoutAccount.trim()) {
      if (notify) notify({ type: 'error', title: 'Account Number Missing', message: 'Please enter your MetaTrader account number to bind this license.' });
      return;
    }

    if (!checkoutTxid.trim()) {
      if (notify) notify({ type: 'error', title: 'TXID Missing', message: 'Please enter your USDT transfer hash.' });
      return;
    }

    setSubmitting(true);
    try {
      const cleanAcc = checkoutAccount.trim().replace(/\D/g, '');
      const planString = `BOT: ${checkoutBot.name} (${checkoutBot.platform} #${cleanAcc})`;

      await pb.collection('payments').create({
        user_email: user.email,
        plan: planString,
        amount: checkoutBot.price,
        network: checkoutNetwork,
        txid: checkoutTxid.trim(),
        status: 'pending'
      });

      setPurchaseResult({
        status: 'pending',
        bot: checkoutBot,
        account: cleanAcc,
        key: '',
        txid: checkoutTxid.trim()
      });

      await loadUserPurchases();

      if (notify) {
        notify({
          type: 'success',
          title: 'Payment Logged for Verification',
          message: `TXID submitted. Desk will verify the blockchain transfer of $${checkoutBot.price} USDT and issue your license key.`
        });
      }
    } catch (err) {
      if (notify) notify({ type: 'error', title: 'Checkout Error', message: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const filteredBots = bots.filter((b) => {
    if (platformFilter === 'all') return true;
    return b.platform?.toUpperCase().includes(platformFilter.toUpperCase());
  });

  const isBotOwned = (botName) => {
    return myPurchases.some(p => p.status === 'confirmed' && p.plan?.includes(botName));
  };

  const isBotPending = (botName) => {
    return myPurchases.some(p => p.status === 'pending' && p.plan?.includes(botName));
  };

  const getOwnedPurchase = (botName) => {
    return myPurchases.find(p => p.status === 'confirmed' && p.plan?.includes(botName));
  };

  return (
    <div className="space-y-8 font-sans text-[#E7E9EF] w-full">
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
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filteredBots.map((bot) => {
          const owned = isBotOwned(bot.name);
          const pending = !owned && isBotPending(bot.name);
          const ownedRecord = owned ? getOwnedPurchase(bot.name) : null;

          return (
            <Card
              key={bot.id}
              className={`flex flex-col justify-between transition-all bg-[#10141B] border overflow-hidden shadow-lg group ${
                owned ? 'border-[#00D878]/40 ring-1 ring-[#00D878]/20' : 'border-white/10 hover:border-[#F3C653]/40'
              }`}
            >
              <div>
                {/* Bot Image Banner */}
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
                      {owned ? (
                        <Badge variant="positive" className="backdrop-blur-md bg-[#00D878] text-[#07090D] font-bold text-[10px]">
                          LICENSED
                        </Badge>
                      ) : pending ? (
                        <Badge variant="gold" className="backdrop-blur-md bg-[#F3C653] text-[#07090D] font-bold text-[10px]">
                          PENDING
                        </Badge>
                      ) : (
                        <Badge variant="positive" className="backdrop-blur-md bg-[#00D878]/20 text-[#00D878] border-[#00D878]/30 text-[10px]">
                          Verified
                        </Badge>
                      )}
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
                        {owned ? (
                          <Badge variant="positive" className="bg-[#00D878] text-[#07090D] font-bold">LICENSED</Badge>
                        ) : pending ? (
                          <Badge variant="gold" className="bg-[#F3C653] text-[#07090D] font-bold">PENDING</Badge>
                        ) : (
                          <Badge variant="positive">Verified</Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                )}

                <div className="p-4 sm:p-5 pt-3 space-y-3">
                  <div 
                    className="cursor-pointer"
                    onClick={() => setSelectedBotDetail(bot)}
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="text-base sm:text-lg font-bold text-white group-hover:text-[#F3C653] transition-colors truncate">
                        {bot.name}
                      </h3>
                      <span className="text-xs text-[#A6ADB9] font-mono shrink-0 ml-2">{bot.version || 'v2.4'}</span>
                    </div>

                    <p className="mt-1 text-xs text-[#A6ADB9] line-clamp-2 leading-relaxed">
                      {bot.description || 'Institutional momentum breakout algorithm engineered for London and New York overlaps.'}
                    </p>
                  </div>

                  {/* Metrics */}
                  <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                    <div className="p-2 sm:p-2.5 rounded-xl bg-white/5 border border-white/10">
                      <div className="text-[10px] text-[#A6ADB9] uppercase">Max Drawdown</div>
                      <div className="font-bold text-[#00D878] mt-0.5">{bot.drawdown || '4.5% Max DD'}</div>
                    </div>
                    <div className="p-2 sm:p-2.5 rounded-xl bg-white/5 border border-white/10">
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

              <CardFooter className="flex items-center justify-between p-4 sm:p-5 pt-3 border-t border-white/10 bg-white/[0.02]">
                <div>
                  <div className="text-[10px] text-[#A6ADB9] uppercase tracking-wider font-mono">Perpetual Binary</div>
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
                    Specs
                  </Button>
                  
                  {owned ? (
                    <Button
                      size="sm"
                      onClick={() => openCheckout(bot)}
                      className="h-8 gap-1.5 font-bold text-xs bg-[#00D878] text-[#07090D] hover:bg-[#00F09A]"
                    >
                      <Download className="h-3 w-3" />
                      <span>Download</span>
                    </Button>
                  ) : pending ? (
                    <Button
                      size="sm"
                      disabled
                      className="h-8 gap-1.5 font-bold text-xs opacity-70 cursor-not-allowed"
                    >
                      <Clock className="h-3 w-3" />
                      <span>Verifying…</span>
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => openCheckout(bot)}
                      className="h-8 gap-1.5 font-bold text-xs"
                    >
                      <KeyRound className="h-3 w-3" />
                      <span>Purchase</span>
                    </Button>
                  )}
                </div>
              </CardFooter>
            </Card>
          );
        })}
      </div>

      {/* DEDICATED BOT DETAIL MODAL */}
      {selectedBotDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
          <Card className="w-full max-w-2xl bg-[#10141B] border border-white/10 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col my-auto">
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
                    <div className="text-sm font-bold text-white mt-1">{selectedBotDetail.win_rate || '84.2%'}</div>
                  </div>
                  <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-center">
                    <div className="text-[10px] text-[#A6ADB9]">Min Capital</div>
                    <div className="text-sm font-bold text-white mt-1">{selectedBotDetail.recommended_deposit || '$500+'}</div>
                  </div>
                </div>

                {/* Strategy Technical Specifications */}
                <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2.5">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-[#F3C653]">
                    Algorithm Mechanics & Guardrails
                  </div>
                  <div className="grid sm:grid-cols-2 gap-2 text-[#E7E9EF]">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-[#00D878] shrink-0" />
                      <span>Hard Invalidation Stop Loss</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-[#00D878] shrink-0" />
                      <span>Dynamic Volatility Lot Sizing</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-[#00D878] shrink-0" />
                      <span>Zero Martingale / Grid Risk</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-[#00D878] shrink-0" />
                      <span>Spread & Slippage Filters</span>
                    </div>
                  </div>
                </div>

                {/* Google Drive Link */}
                {selectedBotDetail.download_url && (
                  <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
                    <div className="flex items-center gap-2.5 text-blue-400 font-bold">
                      <HardDrive className="h-4 w-4 shrink-0" />
                      <span>Official Google Drive Package</span>
                    </div>
                    <a
                      href={selectedBotDetail.download_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 text-white font-bold hover:bg-blue-500 transition-colors w-fit"
                    >
                      <span>Open Drive</span>
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
                    openCheckout(b);
                  }}
                  className="gap-2 font-bold text-xs"
                >
                  <KeyRound className="h-3.5 w-3.5" />
                  <span>{isBotOwned(selectedBotDetail.name) ? 'View License Key' : isBotPending(selectedBotDetail.name) ? 'Verification in Progress' : 'Purchase License'}</span>
                </Button>
              </div>
            </CardFooter>
          </Card>
        </div>
      )}

      {/* =========================================================================
          BOT CHECKOUT & LICENSE DESK MODAL
      ========================================================================= */}
      {checkoutBot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <Card className="w-full max-w-lg shadow-2xl bg-[#10141B] border border-white/10 max-h-[92vh] flex flex-col overflow-hidden my-auto">
            <CardHeader className="p-4 sm:p-5 pb-3 border-b border-white/10 shrink-0 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base sm:text-lg flex items-center gap-2 text-white">
                  <CreditCard className="h-5 w-5 text-[#F3C653]" />
                  <span>{checkoutBot.name} · Checkout</span>
                </CardTitle>
                <CardDescription className="text-xs text-[#A6ADB9] mt-0.5">
                  Perpetual binary EA license for {checkoutBot.platform}.
                </CardDescription>
              </div>
              <button
                onClick={() => setCheckoutBot(null)}
                className="text-[#A6ADB9] hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </CardHeader>

            <CardContent className="p-4 sm:p-6 flex-1 overflow-y-auto space-y-4 text-xs font-sans">
              
              {/* SUCCESS / PURCHASE RESULT VIEW */}
              {purchaseResult ? (
                <div className="space-y-4 py-2">
                  <div className="text-center space-y-2">
                    <div className={`h-12 w-12 rounded-full flex items-center justify-center mx-auto border ${
                      purchaseResult.status === 'confirmed'
                        ? 'bg-[#00D878]/15 text-[#00D878] border-[#00D878]/30'
                        : 'bg-[#F3C653]/15 text-[#F3C653] border-[#F3C653]/30'
                    }`}>
                      {purchaseResult.status === 'confirmed' ? <CheckCircle2 className="h-7 w-7" /> : <Clock className="h-7 w-7" />}
                    </div>
                    <h3 className="text-lg font-bold text-white">
                      {purchaseResult.status === 'confirmed' && purchaseResult.key
                        ? 'License Key Active & Bound'
                        : 'Payment Submitted for Desk Verification'}
                    </h3>
                    <p className="text-xs text-[#A6ADB9] max-w-sm mx-auto leading-relaxed">
                      {purchaseResult.status === 'confirmed' && purchaseResult.key
                        ? `Bound to MetaTrader ${purchaseResult.bot.platform} Account #${purchaseResult.account}.`
                        : `Your TXID has been logged. Once the desk approves the payment, your license key is issued automatically and appears here and in My Purchases.`}
                    </p>
                  </div>

                  {/* License Key Box (only after server-side issuance) */}
                  {purchaseResult.status === 'confirmed' && purchaseResult.key && (
                    <div className="p-4 rounded-xl border border-[#00D878]/30 bg-[#00D878]/10 space-y-2 font-mono">
                      <div className="flex items-center justify-between text-[#00D878] text-[11px] font-bold">
                        <span className="flex items-center gap-1.5">
                          <KeyRound className="h-3.5 w-3.5" />
                          <span>Hardware & Account License Key:</span>
                        </span>
                        <button
                          onClick={() => handleCopy(purchaseResult.key, 'key')}
                          className="hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          {copiedKey ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                          <span>{copiedKey ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>
                      <div className="p-2.5 rounded-lg bg-black/60 border border-white/10 text-white font-bold text-xs break-all select-all">
                        {purchaseResult.key}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Paste this into your MetaTrader {purchaseResult.bot.platform} EA inputs dialog.
                      </div>
                    </div>
                  )}

                  {/* Download Options */}
                  <div className="grid grid-cols-2 gap-2 pt-2">
                    {downloadLinksFor(purchaseResult.bot).map((l) => (
                      <a
                        key={l.path}
                        href={l.path}
                        download
                        className="inline-flex items-center justify-center gap-2 p-2.5 rounded-xl bg-[#00D878] text-[#07090D] font-bold hover:bg-[#00F09A] transition-all text-xs text-center cursor-pointer shadow-xs"
                      >
                        <Download className="h-4 w-4" />
                        <span>Download .{l.ext} ({l.platform})</span>
                      </a>
                    ))}

                    {purchaseResult.bot.download_url ? (
                      <a
                        href={purchaseResult.bot.download_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-2 p-2.5 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-500 transition-all text-xs text-center"
                      >
                        <HardDrive className="h-4 w-4" />
                        <span>Google Drive Pack</span>
                      </a>
                    ) : (
                      <Button
                        variant="outline"
                        onClick={() => setCheckoutBot(null)}
                        className="text-xs"
                      >
                        Done
                      </Button>
                    )}
                  </div>

                  {purchaseResult.isExisting && (
                    <div className="pt-2 flex items-center justify-between border-t border-white/10 text-xs">
                      <span className="text-[#A6ADB9]">Need to bind another account?</span>
                      <button
                        type="button"
                        onClick={() => {
                          setPurchaseResult(null);
                          setCheckoutAccount('');
                          setCheckoutTxid('');
                        }}
                        className="text-[#F3C653] hover:underline font-bold cursor-pointer"
                      >
                        + Purchase License for New Account #
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                /* CHECKOUT FORM */
                <div className="space-y-4">
                  {/* Price Banner */}
                  <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] text-[#A6ADB9] uppercase tracking-wider font-mono">One-Time Perpetual Price</div>
                      <div className="text-2xl font-black text-white font-mono mt-0.5">
                        ${checkoutBot.price}.00 <span className="text-xs text-[#F3C653]">USDT</span>
                      </div>
                    </div>
                    <Badge variant="positive">Perpetual Binary</Badge>
                  </div>

                  {/* Required Account Number */}
                  <div>
                    <label className="block text-[#E7E9EF] font-semibold mb-1">
                      MetaTrader {checkoutBot.platform} Account Number <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 884920 or demo account number"
                      value={checkoutAccount}
                      onChange={(e) => setCheckoutAccount(e.target.value)}
                      className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-white font-mono placeholder:text-white/20 focus:border-[#F3C653] focus:outline-none text-xs"
                    />
                    <span className="text-[10px] text-slate-400 mt-0.5 block">
                      The generated binary license will be bound to this account number.
                    </span>
                  </div>

                  {/* Network Picker */}
                  <div>
                    <label className="block text-[#E7E9EF] font-semibold mb-1">Select Settlement Network</label>
                    <div className="grid grid-cols-3 gap-2">
                      {['USDT-TRC20', 'USDT-BEP20', 'USDT-ERC20'].map((net) => (
                        <button
                          key={net}
                          type="button"
                          onClick={() => setCheckoutNetwork(net)}
                          className={`py-2 px-2.5 rounded-xl border text-center transition-all cursor-pointer font-bold text-xs ${
                            checkoutNetwork === net
                              ? 'border-[#F3C653] bg-[#F3C653]/15 text-[#F3C653]'
                              : 'border-white/10 bg-white/5 text-[#A6ADB9] hover:bg-white/10'
                          }`}
                        >
                          {net.replace('USDT-', '')}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Deposit Address Box */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#E7E9EF] font-semibold">Deposit Wallet Address ({checkoutNetwork})</span>
                      <button
                        type="button"
                        onClick={() => handleCopy(WALLETS[checkoutNetwork], 'address')}
                        className="text-[#F3C653] hover:underline flex items-center gap-1 cursor-pointer font-semibold"
                      >
                        {copiedAddress ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                        <span>{copiedAddress ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                    <div className="p-2.5 rounded-xl border border-white/10 bg-[#07090D] text-[#F3C653] break-all select-all font-mono text-xs">
                      {WALLETS[checkoutNetwork]}
                    </div>
                  </div>

                  {/* TXID Input */}
                  <div>
                    <label className="block text-[#E7E9EF] font-semibold mb-1">
                      Transaction Hash / TXID
                    </label>
                    <input
                      type="text"
                      value={checkoutTxid}
                      onChange={(e) => setCheckoutTxid(e.target.value)}
                      placeholder="Paste your blockchain transaction hash here..."
                      className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-white placeholder:text-white/20 focus:border-[#F3C653] focus:outline-none text-xs font-mono"
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-2 pt-2">
                    <Button
                      type="button"
                      disabled={submitting}
                      onClick={() => handlePurchase()}
                      className="w-full justify-center gap-2 font-bold"
                    >
                      <span>{submitting ? 'Processing...' : 'Submit Payment for Desk Verification'}</span>
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
