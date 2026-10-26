import React, { useState, useEffect } from 'react';
import { pb } from '../lib/pocketbase';
import {
  Cpu, Download, CheckCircle2,
  KeyRound, Copy, Check, ArrowRight, X,
  ExternalLink, BarChart3,
  Shield, HardDrive, CreditCard,
  Clock, AlertCircle, ChevronLeft, FlaskConical, Lock, Timer,
  Coins, Bitcoin, ArrowLeftRight, LineChart
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './ui/Card';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { downloadLinksFor } from '../lib/utils';
import { pairsOf, featuresOf, timeframesOf, pctStat, statNumOrNull } from '../lib/bots';
import { useWallets } from '../lib/wallets';
import EquityCurve from './EquityCurve';

const slugify = (name) =>
  String(name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const botCategory = (bot) => {
  const s = `${bot?.pairs || ''} ${bot?.strategy_type || ''}`.toLowerCase();
  if (s.includes('gold') || s.includes('xau')) return { label: 'Gold', icon: Coins };
  if (s.includes('btc') || s.includes('crypto') || s.includes('eth') || s.includes('sol')) return { label: 'Crypto', icon: Bitcoin };
  if (/us30|nas100|us500|dax40|indices|x\.?1/.test(s)) return { label: 'Indices', icon: ArrowLeftRight };
  return { label: 'Forex', icon: LineChart };
};

/* Product-page hero media: the bot's image over the equity fallback,
   with category chip and its own stat pills straight from the record. */
function BotHeroMedia({ bot }) {
  const [imgFailed, setImgFailed] = useState(false);
  const cat = botCategory(bot);
  const CatIcon = cat.icon;
  const img = (bot.image_url || '').trim();
  const showImg = img && !imgFailed;
  const stats = [
    { k: 'Win rate', v: bot.win_rate, c: 'text-white', fmt: pctStat },
    { k: 'Profit factor', v: bot.profit_factor, c: 'text-akg-gold', fmt: null },
    { k: 'Max drawdown', v: bot.drawdown, c: 'text-rose-400', fmt: pctStat },
  ].filter((s) => statNumOrNull(s.v) !== null || (typeof s.v === 'string' && s.v));

  return (
    <div className="relative min-h-[280px] overflow-hidden rounded-3xl border border-white/10 bg-[#0A0D13] sm:min-h-[360px]">
      {showImg ? (
        <img
          src={img}
          alt={`${bot.name} showcase`}
          onError={() => setImgFailed(true)}
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : stats.length > 0 ? (
        <div className="absolute inset-0 px-5 pt-6 pb-24">
          <EquityCurve
            seed={bot.name}
            profitFactor={bot.profit_factor}
            drawdown={bot.drawdown}
            winRate={bot.win_rate}
            points={110}
            className="h-full w-full"
          />
        </div>
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 text-center">
          <CatIcon className="h-6 w-6 text-akg-muted" />
          <span className="px-6 font-data text-[10px] uppercase tracking-wide text-akg-muted">
            {bot.pairs} · {bot.platform}
          </span>
        </div>
      )}

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#07090D] via-black/10 to-black/30" />

      <span className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-black/55 px-3 py-1.5 font-data text-[10px] font-bold uppercase tracking-[0.14em] text-white backdrop-blur">
        <CatIcon className="h-3 w-3" />
        {cat.label}
      </span>

      {stats.length > 0 && (
        <div className="absolute inset-x-4 bottom-4 flex flex-wrap gap-2">
          {stats.map((s) => (
            <div key={s.k} className="rounded-xl bg-black/55 px-3.5 py-2 backdrop-blur">
              <div className={`font-data text-sm font-bold ${s.c}`}>{s.fmt ? s.fmt(s.v) : `${s.v}`}</div>
              <div className="mt-0.5 text-[9px] uppercase tracking-wide text-white/55">{s.k}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function BotsTab({ user, botSlug, onOpenBot, onNavigate, onOpenPricing, onOpenAuth, notify }) {
  const [bots, setBots] = useState([]);
  const [botsLoading, setBotsLoading] = useState(true);
  const [platformFilter, setPlatformFilter] = useState('all');
  const [checkoutBot, setCheckoutBot] = useState(null);
  const [promptBot, setPromptBot] = useState(null); // asking for MT account number before checkout
  const [promptAccount, setPromptAccount] = useState('');

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
  const [allBotChanges, setAllBotChanges] = useState([]);

  // Live wallets from site_settings (rotatable without redeploy); see lib/wallets.
  const WALLETS = useWallets();

  const loadBots = async () => {
    try {
      const records = await pb.collection('bots').getFullList({ sort: '-created' });
      setBots(records);
    } catch (err) {
      console.error('Failed to load bots:', err);
    } finally {
      setBotsLoading(false);
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
      pendingRef.current = records.some((p) => p.status === 'pending');
      const confirmed = records.filter((p) => p.status === 'confirmed').map((p) => p.plan || '');
      if (knownConfirmedRef.current) {
        const fresh = confirmed.filter((plan) => !knownConfirmedRef.current.includes(plan));
        if (fresh.length && notify) {
          notify({
            type: 'success',
            title: 'Payment Approved',
            message: 'Your license key and Google Drive package link are unlocked below.'
          });
        }
      }
      knownConfirmedRef.current = confirmed;
    } catch (err) {
      console.error('Failed to load user bot purchases:', err);
    }
  };

  useEffect(() => {
    loadBots();
  }, []);

  // Release notes feed the product page timeline (direct collection read,
  // public list rule). Rewind on slug change so cross-navigation never shows stale notes.
  useEffect(() => {
    let stale = false;
    pb.collection('bot_changes').getFullList({ sort: '-released' })
      .then((items) => { if (!stale) setAllBotChanges(items); })
      .catch(() => {});
    return () => { stale = true; };
  }, [botSlug]);

  // Escape closes the checkout modal.
  useEffect(() => {
    if (!checkoutBot) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') setCheckoutBot(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [checkoutBot]);

  const pendingRef = React.useRef(false);
  const knownConfirmedRef = React.useRef(null);

  useEffect(() => {
    if (user?.email) {
      loadUserPurchases();
      const unsub = pb.collection('payments').subscribe('*', () => loadUserPurchases()).catch(() => {});
      // Belt and braces: realtime can silently drop (PB restart, network
      // flap). While any payment is pending, poll slowly so the license
      // key + Drive link unlock appears without a manual reload.
      const timer = setInterval(() => {
        if (document.visibilityState === 'visible' && pendingRef.current) {
          loadUserPurchases();
        }
      }, 10000);
      return () => { unsub?.then?.((u) => u && u()); clearInterval(timer); };
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
          message: `Your payment for ${bot.name} is being verified. Your license key and Google Drive package link unlock automatically once approved.`
        });
      }
      return;
    }

    // Check if user already owns this bot
    const existing = getOwnedPurchase(bot.name);
    if (existing) {      const match = existing.plan.match(/BOT:\s*([^(]+)\s*\(([^#]+)#([^)]+)\)/i);
      const acc = match ? match[3].trim() : 'N/A';
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

    // New purchase: collect the MetaTrader account number, then hand off to
    // the dedicated checkout page (crypto or GPay/UPI).
    setPromptBot(bot);
    setPromptAccount('');
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

    if (!/^[a-zA-Z0-9]{20,128}$/.test(checkoutTxid.trim())) {
      if (notify) notify({ type: 'error', title: 'Invalid TXID', message: 'A transaction hash is 64 hexadecimal characters (letters and digits only). Paste the full hash from your wallet.' });
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
          message: `TXID submitted. Desk will verify the blockchain transfer of $${checkoutBot.price} USDT and issue your license key and Drive package link.`
        });
      }
    } catch (err) {
      if (notify) notify({ type: 'error', title: 'Checkout Error', message: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const isBotOwned = (botName) => {
    return myPurchases.some(p => p.status === 'confirmed' && p.plan?.includes(botName));
  };

  const isBotPending = (botName) => {
    return myPurchases.some(p => p.status === 'pending' && p.plan?.includes(botName));
  };

  const getOwnedPurchase = (botName) => {
    return myPurchases.find(p => p.status === 'confirmed' && p.plan?.includes(botName));
  };

  const botFeatures = (bot) => featuresOf(bot);

  const filteredBots = bots.filter((b) => {
    if (platformFilter === 'all') return true;
    return b.platform?.toUpperCase().includes(platformFilter.toUpperCase());
  });

  // ==========================================================================
  // PRODUCT PAGE: /bots/<slug>
  // ==========================================================================
  const selectedBot = botSlug ? bots.find((b) => slugify(b.name) === botSlug) : null;

  if (botSlug && botsLoading) {
    return (
      <div className="max-w-6xl mx-auto animate-pulse space-y-6 py-8">
        <div className="h-4 w-32 rounded bg-white/10" />
        <div className="h-10 w-2/3 rounded bg-white/10" />
        <div className="h-44 rounded-2xl bg-akg-surface" />
      </div>
    );
  }

  if (botSlug && !selectedBot && bots.length > 0) {
    return (
      <div className="max-w-3xl mx-auto text-center py-24 space-y-4">
        <AlertCircle className="h-10 w-10 mx-auto text-akg-gold" />
        <h1 className="font-display text-2xl font-extrabold text-white">Expert Advisor not found</h1>
        <p className="text-sm text-akg-muted">The link may be outdated. Browse the current catalog instead.</p>
        <Button variant="outline" onClick={() => onNavigate && onNavigate('bots')}>
          Back to Expert Advisors
        </Button>
      </div>
    );
  }

  if (selectedBot) {
    const bot = selectedBot;
    const owned = isBotOwned(bot.name);
    const pending = isBotPending(bot.name);
    const features = botFeatures(bot);
    const pairs = pairsOf(bot);
    const selectedChanges = allBotChanges.filter((ch) => ch.bot === bot.id);

    return (
      <div className="max-w-6xl mx-auto font-sans text-akg-silver w-full">
        <button
          onClick={() => onNavigate && onNavigate('bots')}
          className="group inline-flex items-center gap-1.5 mt-2 text-xs font-semibold text-akg-muted hover:text-akg-gold transition-colors cursor-pointer"
        >
          <ChevronLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
          All Expert Advisors
        </button>

        {/* Hero: facts left, provenance media right */}
        <div className="mt-5 grid items-stretch gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="flex flex-col justify-center">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="font-mono">{bot.platform}</Badge>
              <Badge variant="gold" className="font-mono">{bot.version || ''}</Badge>
              {owned && <Badge variant="positive">Licensed</Badge>}
              {pending && <Badge variant="gold">Verification in progress</Badge>}
            </div>
            <h1 className="mt-3 font-display text-3xl font-extrabold leading-[1.08] tracking-tight text-white sm:text-[2.75rem]">
              {bot.name}
            </h1>

            <div className="mt-4 flex flex-wrap gap-2">
              {pairs.map((p) => (
                <span key={p} className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 font-data text-[10px] font-semibold uppercase tracking-[0.12em] text-akg-gold">
                  {p}
                </span>
              ))}
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-5">
              <div>
                <div className="font-display text-4xl font-extrabold text-white tabular-nums">
                  ${bot.price}
                  <span className="ml-1.5 text-sm font-bold text-akg-gold">USDT</span>
                </div>
                <div className="mt-0.5 text-[11px] text-akg-muted">One-time perpetual license</div>
              </div>
              <Button
                size="lg"
                variant={owned ? 'positive' : 'default'}
                className="gap-2"
                onClick={() => openCheckout(bot)}
              >
                {owned ? (
                  <><KeyRound className="h-4 w-4" /><span>View License Key</span></>
                ) : pending ? (
                  <><Clock className="h-4 w-4" /><span>Verification in Progress</span></>
                ) : (
                  <><KeyRound className="h-4 w-4" /><span>Purchase License</span></>
                )}
              </Button>
            </div>
          </div>

          <BotHeroMedia bot={bot} />
        </div>

        {/* Performance panel */}
        <div className="mt-8 overflow-hidden rounded-2xl border border-white/10 bg-akg-surface">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.07] px-5 py-3.5">
            <div className="flex items-center gap-2.5">
              <BarChart3 className="h-4 w-4 text-akg-gold" />
              <span className="font-data text-[11px] uppercase tracking-[0.16em] text-akg-silver">
                Performance profile
              </span>
            </div>
            <span className="font-data text-[10px] text-akg-muted">
              Illustrative profile from strategy statistics
            </span>
          </div>

          <div className="relative px-5 py-6">
            <EquityCurve
              seed={bot.name}
              profitFactor={bot.profit_factor}
              drawdown={bot.drawdown}
              winRate={bot.win_rate}
              points={110}
              className="h-40 w-full sm:h-48"
            />
            {/* stat overlay */}
            <div className="mt-5 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-white/[0.07] bg-white/[0.04] sm:grid-cols-4">
              {[
                { k: 'Win rate', v: bot.win_rate, tone: 'text-white', fmt: pctStat },
                { k: 'Profit factor', v: bot.profit_factor, tone: 'text-akg-gold', fmt: null },
                { k: 'Max drawdown', v: bot.drawdown, tone: 'rose-400', fmt: pctStat },
                { k: 'Min capital', v: bot.recommended_deposit, tone: 'text-white', fmt: null },
              ].filter((s) => (typeof s.v === 'number' ? statNumOrNull(s.v) !== null : !!s.v)).map((s) => (
                <div key={s.k} className="bg-akg-surface px-4 py-3">
                  <div className={`font-data text-base font-semibold ${s.tone}`}>{s.fmt ? s.fmt(s.v) : `${s.v}`}</div>
                  <div className="mt-0.5 text-[10px] uppercase tracking-wide text-akg-muted">{s.k}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Body grid */}
        <div className="mt-8 grid gap-8 lg:grid-cols-[1.6fr_1fr] pb-8">
          <div className="space-y-8">
            <section>
              <h2 className="font-display text-lg font-bold text-white">The strategy</h2>
              <p className="mt-3 font-body text-[15px] leading-[1.75] text-akg-silver">{bot.description}</p>
              {bot.strategy_type && (
                <p className="mt-3 font-data text-xs text-akg-silver">
                  Core logic: <span className="text-akg-gold">{bot.strategy_type}</span>
                </p>
              )}
            </section>

            {features.length > 0 && (
              <section>
                <h2 className="font-display text-lg font-bold text-white">What it does</h2>
                <ul className="mt-4 grid gap-2.5 sm:grid-cols-2">
                  {features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 rounded-xl border border-white/[0.07] bg-akg-surface px-3.5 py-3 text-xs text-akg-silver">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-akg-green" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <section>
              <h2 className="font-display text-lg font-bold text-white">Running requirements</h2>
              <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
                <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] px-4 py-3">
                  <div className="font-data text-[10px] uppercase tracking-wide text-akg-muted">Timeframe</div>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {(timeframesOf(bot).length ? timeframesOf(bot) : ['—']).map((tf) => (
                      <span key={tf} className="rounded-md border border-white/10 bg-white/[0.04] px-2 py-0.5 font-data text-[11px] text-akg-gold">{tf}</span>
                    ))}
                  </div>
                </div>
                <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] px-4 py-3">
                  <div className="font-data text-[10px] uppercase tracking-wide text-akg-muted">Min capital</div>
                  <div className="mt-1 font-data text-[13px] text-akg-silver">{bot.recommended_deposit || '—'}</div>
                </div>
                <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] px-4 py-3">
                  <div className="font-data text-[10px] uppercase tracking-wide text-akg-muted">Min lot</div>
                  <div className="mt-1 font-data text-[13px] text-akg-silver">{bot.min_lot != null ? bot.min_lot : '—'}</div>
                </div>
                <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] px-4 py-3">
                  <div className="font-data text-[10px] uppercase tracking-wide text-akg-muted">Leverage guide</div>
                  <div className="mt-1 font-data text-[13px] text-akg-silver">{bot.leverage || '—'}</div>
                </div>
              </div>
              {bot.broker_note && (
                <p className="mt-3 text-xs leading-relaxed text-akg-muted">{bot.broker_note}</p>
              )}
            </section>

            <section>
              <h2 className="font-display text-lg font-bold text-white">Before you go live</h2>
              <div className="mt-4 space-y-2.5">
                {[
                  { icon: FlaskConical, text: 'Run it on a demo account first. Validate the behavior on your broker\'s feed before funding a live account.' },
                  { icon: Shield, text: 'Every position carries a hard stop-loss. The strategy set rejects martingale and grid averaging.' },
                  { icon: Lock, text: 'Your license key is bound to the MetaTrader account number you choose at checkout.' },
                ].map((row) => {
                  const Icon = row.icon;
                  return (
                    <div key={row.text} className="flex items-start gap-3 rounded-xl border border-white/[0.07] bg-white/[0.02] px-4 py-3">
                      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-akg-gold" strokeWidth={1.75} />
                      <span className="text-xs leading-relaxed text-akg-muted">{row.text}</span>
                    </div>
                  );
                })}
              </div>
            </section>

            {selectedChanges.length > 0 && (
              <section>
                <h2 className="font-display text-lg font-bold text-white">Release history</h2>
                <ol className="mt-4 space-y-3 border-l border-white/10 pl-4">
                  {selectedChanges.map((ch) => (
                    <li key={ch.id} className="relative">
                      <span className="absolute -left-[21px] top-1.5 h-2 w-2 rounded-full bg-akg-gold" />
                      <div className="flex items-baseline gap-2">
                        <span className="font-data text-xs font-bold text-akg-gold">{ch.version}</span>
                        {ch.released && (
                          <span className="font-data text-[10px] text-akg-muted">
                            {new Date(ch.released).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-xs leading-relaxed text-akg-muted">{ch.summary}</p>
                    </li>
                  ))}
                </ol>
              </section>
            )}
          </div>

          {/* Side rail */}
          <div className="space-y-5">
            <div className="rounded-2xl border border-[#F3C653]/25 bg-gradient-to-b from-[#171208] to-akg-surface p-6 shadow-gold ring-1 ring-[#F3C653]/20">
              <div className="font-display text-2xl font-extrabold text-white tabular-nums">
                ${bot.price}
                <span className="ml-1.5 text-xs font-bold text-akg-gold">USDT</span>
              </div>
              <div className="mt-1 text-[11px] text-akg-muted">You pay once. The license stays yours — no renewals, no subscription.</div>
              <Button
                variant={owned ? 'positive' : 'default'}
                className="mt-4 w-full justify-center gap-2"
                onClick={() => openCheckout(bot)}
              >
                {owned ? (
                  <><KeyRound className="h-4 w-4" /><span>View License Key</span></>
                ) : pending ? (
                  <><Clock className="h-4 w-4" /><span>Verification in Progress</span></>
                ) : (
                  <><KeyRound className="h-4 w-4" /><span>Purchase License</span></>
                )}
              </Button>
              {!user && (
                <div className="mt-2 text-center text-[10px] text-akg-muted">
                  You will be asked to sign in first.
                </div>
              )}
            </div>

            {bot.download_url && owned && (
              <div className="rounded-2xl border border-white/10 bg-akg-surface p-5">
                <div className="flex items-center gap-2 text-xs font-bold text-akg-silver">
                  <HardDrive className="h-4 w-4 text-akg-gold" />
                  Distribution package
                </div>
                <p className="mt-2 text-[11px] leading-relaxed text-akg-muted">
                  The package is served from Google Drive and updated with every release.
                </p>
                <a
                  href={bot.download_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-akg-gold hover:text-akg-goldLight"
                >
                  <span>Open Drive package</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            )}

            {bot.download_url && pending && (
              <div className="rounded-2xl border border-amber-400/20 bg-amber-400/[0.04] p-5">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-200">
                  <Timer className="h-4 w-4 shrink-0" />
                  Drive package locked
                </div>
                <p className="mt-2 text-[11px] leading-relaxed text-akg-muted">
                  Your payment is being verified. The Google Drive package link unlocks in My Account as soon as the desk approves your payment.
                </p>
              </div>
            )}

            <div className="rounded-2xl border border-white/10 bg-akg-surface p-5">
              <div className="text-xs font-bold text-akg-silver">At a glance</div>
              <dl className="mt-3 space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-[11px] text-akg-muted">Platform</dt>
                  <dd className="font-data text-[11px] text-akg-silver">MetaTrader {bot.platform}</dd>
                </div>
                {bot.version && (
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-[11px] text-akg-muted">Version</dt>
                    <dd className="font-data text-[11px] text-akg-silver">{bot.version}</dd>
                  </div>
                )}
                <div className="flex items-start justify-between gap-3">
                  <dt className="text-[11px] text-akg-muted">Pairs</dt>
                  <dd className="text-right font-data text-[11px] text-akg-silver">{bot.pairs}</dd>
                </div>
                {bot.recommended_deposit && (
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-[11px] text-akg-muted">Min capital</dt>
                    <dd className="font-data text-[11px] text-akg-silver">{bot.recommended_deposit}</dd>
                  </div>
                )}
              </dl>
            </div>
          </div>
        </div>

        {/* checkout modal is rendered below and shared */}
        <CheckoutModal />
      </div>
    );
  }

  // ==========================================================================
  // CATALOG: /bots
  // ==========================================================================
  return (
    <div className="space-y-8 font-sans text-akg-silver w-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
            Expert Advisors
          </h1>
          <p className="max-w-2xl text-sm text-akg-muted">
            Rule-based MT4 & MT5 systems with hard stop-loss risk parameters and zero martingale exposure. One-time USDT payment, perpetual license bound to your account.
          </p>
        </div>

        {/* Platform Filter */}
        <div className="flex items-center gap-2 bg-[#0A0D13] p-1.5 rounded-full border border-white/10 shrink-0 self-start">
          {['all', 'MT4', 'MT5'].map((p) => (
            <button
              key={p}
              onClick={() => setPlatformFilter(p)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                platformFilter === p
                  ? 'bg-[#F3C653] text-[#1C1403] font-bold shadow-md'
                  : 'text-akg-muted hover:text-white hover:bg-white/5'
              }`}
            >
              {p === 'all' ? 'All Platforms' : p}
            </button>
          ))}
        </div>
      </div>

      {/* Bots Grid: performance-first cards */}
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {filteredBots.map((bot) => {
          const owned = isBotOwned(bot.name);
          const pending = !owned && isBotPending(bot.name);

          return (
            <article
              key={bot.id}
              className="group flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-akg-surface transition-all hover:border-[#F3C653]/35 hover:shadow-gold cursor-pointer"
              onClick={() => onOpenBot && onOpenBot(slugify(bot.name))}
            >
              {/* Equity sparkline replaces stock photography */}
              <div className="relative border-b border-white/[0.06] bg-[#0A0D13] px-4 pt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="font-mono text-[10px]">{bot.platform}</Badge>
                    <span className="font-data text-[10px] text-akg-muted">{bot.version || ''}</span>
                  </div>
                  {owned ? (
                    <Badge variant="positive" className="text-[10px]">Licensed</Badge>
                  ) : pending ? (
                    <Badge variant="gold" className="text-[10px]">Pending</Badge>
                  ) : null}
                </div>
                <EquityCurve
                  seed={bot.name}
                  profitFactor={bot.profit_factor}
                  drawdown={bot.drawdown}
                  winRate={bot.win_rate}
                  points={70}
                  strokeWidth={1.75}
                  className="h-24 w-full"
                />
              </div>

              <div className="flex flex-1 flex-col p-5">
                <h3 className="font-display text-base font-bold text-white group-hover:text-akg-gold transition-colors">
                  {bot.name}
                </h3>
                <p className="mt-1 font-data text-[11px] uppercase tracking-wide text-akg-muted">
                  {bot.strategy_type}
                </p>
                <p className="mt-2.5 line-clamp-2 text-xs leading-relaxed text-akg-muted">
                  {bot.description}
                </p>

                <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 font-data text-[11px]">
                  {statNumOrNull(bot.win_rate) !== null && <span className="text-akg-green">{pctStat(bot.win_rate)} win</span>}
                  {statNumOrNull(bot.profit_factor) !== null && <span className="text-akg-muted">PF {bot.profit_factor}</span>}
                  {statNumOrNull(bot.drawdown) !== null && <span className="text-akg-muted">DD {pctStat(bot.drawdown)}</span>}
                </div>

                <div className="mt-auto flex items-center justify-between pt-5">
                  <div>
                    <div className="font-display text-lg font-extrabold text-white tabular-nums">
                      ${bot.price}
                      <span className="ml-1 text-[10px] font-bold text-akg-gold">USDT</span>
                    </div>
                    <div className="text-[10px] text-akg-muted">Perpetual license</div>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenBot && onOpenBot(slugify(bot.name));
                    }}
                  >
                    View EA
                  </Button>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {filteredBots.length === 0 && (
        <div className="rounded-2xl border border-white/10 bg-akg-surface p-12 text-center">
          <Cpu className="h-8 w-8 mx-auto text-akg-muted" />
          <h3 className="mt-3 text-sm font-bold text-white">No systems on this platform yet</h3>
          <p className="mt-1 text-xs text-akg-muted">Switch the platform filter to see the full catalog.</p>
        </div>
      )}

      {/* Account-number prompt before the cart */}
      {promptBot && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 backdrop-blur-sm sm:items-center sm:p-4">
          <div className="absolute inset-0" onClick={() => setPromptBot(null)} />
          <div className="relative w-full rounded-t-3xl border border-white/10 bg-akg-surface p-6 shadow-2xl sm:max-w-md sm:rounded-2xl">
            <div className="mx-auto mt-[-10px] mb-3 h-1 w-10 rounded-full bg-white/15 sm:hidden" />
            <h3 className="font-display text-base font-bold text-white">Bind your license</h3>
            <p className="mt-1 text-xs leading-relaxed text-akg-muted">
              Enter your MetaTrader {promptBot.platform} account number. The license key is permanently bound to it.
            </p>
            <input
              autoFocus
              value={promptAccount}
              onChange={(e) => setPromptAccount(e.target.value)}
              placeholder="e.g. 884920"
              className="mt-4 h-11 w-full rounded-xl border border-white/10 bg-[#0A0D13] px-3.5 font-data text-sm text-white placeholder:text-akg-muted/50 focus:border-[#F3C653]/50 focus:outline-none"
            />
            <button
              onClick={() => {
                if (!promptAccount.trim()) return;
                sessionStorage.setItem('akg_order', JSON.stringify({
                  kind: 'bot',
                  id: promptBot.id,
                  name: promptBot.name,
                  price: promptBot.price,
                  platform: promptBot.platform,
                  account: promptAccount.trim(),
                }));
                const nav = onNavigate;
                setPromptBot(null);
                if (nav) nav('checkout');
              }}
              disabled={!promptAccount.trim()}
              className="mt-4 h-11 w-full rounded-full bg-[linear-gradient(120deg,#E8BC4F_0%,#F3C653_38%,#FFE9A8_58%,#DFAE3E_100%)] text-sm font-bold text-[#1C1403] disabled:opacity-40"
            >
              Continue to Checkout
            </button>
          </div>
        </div>
      )}

      {/* =========================================================================
          BOT LICENSE VIEW MODAL (existing purchases; new buys go to /checkout)
      ========================================================================= */}
      <CheckoutModal />
    </div>
  );

  function CheckoutModal() {
    if (!checkoutBot) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
        <Card className="w-full max-w-lg shadow-2xl bg-akg-surface border border-white/10 max-h-[92vh] flex flex-col overflow-hidden my-auto">
          <CardHeader className="p-4 sm:p-5 pb-3 border-b border-white/10 shrink-0 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base sm:text-lg flex items-center gap-2 text-white">
                <CreditCard className="h-5 w-5 text-akg-gold" />
                <span>{checkoutBot.name} · Checkout</span>
              </CardTitle>
              <CardDescription className="text-xs text-akg-muted mt-0.5">
                Perpetual binary EA license for {checkoutBot.platform}.
              </CardDescription>
            </div>
            <button
              onClick={() => setCheckoutBot(null)}
              className="text-akg-muted hover:text-white p-1 rounded-lg cursor-pointer"
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
                  <p className="text-xs text-akg-muted max-w-sm mx-auto leading-relaxed">
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
                      className="inline-flex items-center justify-center gap-2 p-2.5 rounded-xl bg-[#00D878] text-[#052012] font-bold hover:bg-[#00F09A] transition-all text-xs text-center cursor-pointer shadow-xs"
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
                    <span className="text-akg-muted">Need to bind another account?</span>
                    <button
                      type="button"
                      onClick={() => {
                        setPurchaseResult(null);
                        setCheckoutAccount('');
                        setCheckoutTxid('');
                      }}
                      className="text-akg-gold hover:underline font-bold cursor-pointer"
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
                    <div className="text-[10px] text-akg-muted uppercase tracking-wider font-mono">One-Time Perpetual Price</div>
                    <div className="text-2xl font-black text-white font-mono mt-0.5">
                      ${checkoutBot.price}.00 <span className="text-xs text-akg-gold">USDT</span>
                    </div>
                  </div>
                  <Badge variant="positive">Perpetual Binary</Badge>
                </div>

                {/* Required Account Number */}
                <div>
                  <label className="block text-akg-silver font-semibold mb-1">
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
                  <label className="block text-akg-silver font-semibold mb-1">Select Settlement Network</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['USDT-TRC20', 'USDT-BEP20', 'USDT-ERC20'].map((net) => (
                      <button
                        key={net}
                        type="button"
                        onClick={() => setCheckoutNetwork(net)}
                        className={`py-2 px-2.5 rounded-xl border text-center transition-all cursor-pointer font-bold text-xs ${
                          checkoutNetwork === net
                            ? 'border-[#F3C653] bg-[#F3C653]/15 text-[#F3C653]'
                            : 'border-white/10 bg-white/5 text-akg-muted hover:bg-white/10'
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
                    <span className="text-akg-silver font-semibold">Deposit Wallet Address ({checkoutNetwork})</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(WALLETS[checkoutNetwork], 'address')}
                      className="text-akg-gold hover:underline flex items-center gap-1 cursor-pointer font-semibold"
                    >
                      {copiedAddress ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                      <span>{copiedAddress ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <div className="p-2.5 rounded-xl border border-white/10 bg-[#07090D] text-akg-gold break-all select-all font-mono text-xs">
                    {WALLETS[checkoutNetwork]}
                  </div>
                </div>

                {/* TXID Input */}
                <div>
                  <label className="block text-akg-silver font-semibold mb-1">
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
    );
  }
}
