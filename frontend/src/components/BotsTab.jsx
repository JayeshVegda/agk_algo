import React, { useState, useEffect, useMemo, useRef } from 'react';
import { pb, pbUrl } from '../lib/pocketbase';
import {
  Cpu, Download, CheckCircle2, KeyRound, Copy, Check,
  ExternalLink, HardDrive, Clock, AlertCircle, ChevronLeft,
  FlaskConical, Coins, Bitcoin, ArrowLeftRight, LineChart,
  FileText, RefreshCw, X
} from 'lucide-react';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { downloadLinksFor } from '../lib/utils';
import { pairsOf, featuresOf, timeframesOf, pctStat, statNumOrNull } from '../lib/bots';

const slugify = (name) =>
  String(name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const botCategory = (bot) => {
  const s = `${bot?.pairs || ''} ${bot?.strategy_type || ''}`.toLowerCase();
  if (s.includes('gold') || s.includes('xau')) return { label: 'Gold', icon: Coins };
  if (s.includes('btc') || s.includes('crypto') || s.includes('eth') || s.includes('sol')) return { label: 'Crypto', icon: Bitcoin };
  if (/us30|nas100|us500|dax40|indices|x\.?1/.test(s)) return { label: 'Indices', icon: ArrowLeftRight };
  return { label: 'Forex', icon: LineChart };
};

export function BotsTab({ user, botSlug, onOpenBot, onNavigate, onOpenPricing, onOpenAuth, onNavigateAdmin, notify }) {
  const [bots, setBots] = useState([]);
  const [botsLoading, setBotsLoading] = useState(true);
  const [platformFilter, setPlatformFilter] = useState('all');
  const [myPurchases, setMyPurchases] = useState([]);
  const [allBotChanges, setAllBotChanges] = useState([]);
  const [licenseModalBot, setLicenseModalBot] = useState(null);
  const [copiedKey, setCopiedKey] = useState(false);

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

  useEffect(() => {
    let stale = false;
    pb.collection('bot_changes').getFullList({ sort: '-released' })
      .then((items) => { if (!stale) setAllBotChanges(items); })
      .catch(() => {});
    return () => { stale = true; };
  }, [botSlug]);

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(true);
    if (notify) {
      notify({ type: 'copy', title: 'Copied to Clipboard', message: text });
    }
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const isBotOwned = (botName) => {
    return myPurchases.some((p) => p.status === 'confirmed' && p.plan?.includes(botName));
  };

  const isBotPending = (botName) => {
    return myPurchases.some((p) => p.status === 'pending' && p.plan?.includes(botName));
  };

  const getOwnedPurchase = (botName) => {
    return myPurchases.find((p) => p.status === 'confirmed' && p.plan?.includes(botName));
  };

  // Direct checkout flow — NO account prompt modal
  const startPurchase = (bot) => {
    if (!user) {
      if (onOpenAuth) onOpenAuth();
      return;
    }

    // Already owned: view license modal
    const existing = getOwnedPurchase(bot.name);
    if (existing) {
      setLicenseModalBot({ bot, payment: existing });
      return;
    }

    if (isBotPending(bot.name)) {
      if (notify) {
        notify({
          type: 'info',
          title: 'Verification in Progress',
          message: `Your payment for ${bot.name} is being verified by the desk.`
        });
      }
      return;
    }

    // Flow: Bot page -> Purchase -> Checkout (pay + TXID)
    sessionStorage.setItem('akg_order', JSON.stringify({
      kind: 'bot',
      id: bot.id,
      name: bot.name,
      price: bot.price,
      platform: bot.platform,
    }));
    if (onNavigate) onNavigate('checkout');
  };

  // Only Live bots show publicly
  const liveBots = useMemo(() => bots.filter((b) => b.is_live !== false), [bots]);

  const filteredBots = useMemo(() => {
    return liveBots.filter((bot) => {
      if (platformFilter === 'all') return true;
      return (bot.platform || '').includes(platformFilter);
    });
  }, [liveBots, platformFilter]);

  const selectedBot = botSlug ? liveBots.find((b) => slugify(b.name) === botSlug) : null;

  if (botSlug && botsLoading) {
    return (
      <div className="flex justify-center items-center py-24 font-data text-xs text-akg-muted">
        Loading Expert Advisor specifications…
      </div>
    );
  }

  if (botSlug && !selectedBot && liveBots.length > 0) {
    return (
      <div className="max-w-3xl mx-auto text-center py-24 space-y-4">
        <AlertCircle className="h-10 w-10 mx-auto text-akg-gold" />
        <h1 className="font-display text-2xl font-extrabold text-white">Expert Advisor not found</h1>
        <p className="text-sm text-akg-muted">The system may be unpublished or the link is outdated.</p>
        <Button variant="outline" onClick={() => onNavigate && onNavigate('bots')}>
          Back to Expert Advisors
        </Button>
      </div>
    );
  }

  // ==========================================================================
  // SINGLE BOT PRODUCT PAGE
  // ==========================================================================
  if (selectedBot) {
    const bot = selectedBot;
    const owned = isBotOwned(bot.name);
    const pending = isBotPending(bot.name);
    const ownedPayment = getOwnedPurchase(bot.name);
    const pairs = pairsOf(bot);
    const features = featuresOf(bot);
    const timeframes = timeframesOf(bot);
    const selectedChanges = allBotChanges.filter((ch) => ch.bot === bot.id);
    const cat = botCategory(bot);
    const CatIcon = cat.icon;

    // Stat tiles: only render if filled
    const statItems = [
      { label: 'Win rate', value: statNumOrNull(bot.win_rate) !== null ? pctStat(bot.win_rate) : null, tone: 'text-white' },
      { label: 'Profit factor', value: statNumOrNull(bot.profit_factor) !== null ? `${bot.profit_factor}` : null, tone: 'text-akg-gold' },
      { label: 'Max drawdown', value: statNumOrNull(bot.drawdown) !== null ? pctStat(bot.drawdown) : null, tone: 'text-rose-400' },
      { label: 'Min capital', value: bot.recommended_deposit || null, tone: 'text-white' },
    ].filter((s) => Boolean(s.value));

    const hasBacktestImg = Boolean(bot.image_url && bot.image_url.trim());

    return (
      <div className="max-w-5xl mx-auto font-sans text-akg-silver w-full space-y-8 pb-12">
        {/* Navigation & Admin Deep-link */}
        <div className="flex items-center justify-between gap-4">
          <button
            onClick={() => onNavigate && onNavigate('bots')}
            className="group inline-flex items-center gap-1.5 text-xs font-semibold text-akg-muted hover:text-akg-gold transition-colors cursor-pointer"
          >
            <ChevronLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
            All Expert Advisors
          </button>

          {user?.role === 'admin' && (
            <button
              onClick={() => onNavigateAdmin?.(`/admin?s=bots&edit=${bot?.id || ''}`)}
              className="flex h-7 items-center gap-1.5 rounded-full border border-[#F3C653]/40 px-3 font-data text-[10px] font-bold text-akg-gold hover:bg-[#F3C653]/10"
            >
              <FlaskConical className="h-3 w-3" /> Admin: Edit Bot
            </button>
          )}
        </div>

        {/* Hero Section */}
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] items-stretch">
          <div className="flex flex-col justify-center space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="font-mono">{bot.platform}</Badge>
              <Badge variant="gold" className="font-mono">{bot.version || 'v1.0'}</Badge>
              {owned && <Badge variant="positive">Licensed</Badge>}
              {pending && <Badge variant="gold">Verification in progress</Badge>}
            </div>

            <h1 className="font-display text-3xl font-extrabold leading-[1.08] tracking-tight text-white sm:text-4xl">
              {bot.name}
            </h1>

            {pairs.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {pairs.map((p) => (
                  <span
                    key={p}
                    className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 font-data text-[10px] font-semibold uppercase tracking-wider text-akg-gold"
                  >
                    {p}
                  </span>
                ))}
              </div>
            )}

            <div className="pt-3 flex flex-wrap items-center gap-5">
              <div>
                <div className="font-display text-3xl font-extrabold text-white tabular-nums">
                  ${bot.price}
                  <span className="ml-1.5 text-sm font-bold text-akg-gold">USDT</span>
                </div>
                <div className="text-[11px] text-akg-muted">One-time perpetual license</div>
              </div>

              <Button
                size="lg"
                variant={owned ? 'positive' : 'default'}
                className="gap-2 px-6"
                onClick={() => startPurchase(bot)}
              >
                {owned ? (
                  <>
                    <KeyRound className="h-4 w-4" />
                    <span>View License</span>
                  </>
                ) : pending ? (
                  <>
                    <Clock className="h-4 w-4" />
                    <span>Verification in Progress</span>
                  </>
                ) : (
                  <>
                    <KeyRound className="h-4 w-4" />
                    <span>Purchase License</span>
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Right Hero Media: Backtest Image (if uploaded) or Category Card */}
          <div className="relative min-h-[220px] overflow-hidden rounded-3xl border border-white/10 bg-[#0A0D13] flex items-center justify-center">
            {hasBacktestImg ? (
              <div className="relative h-full w-full">
                <img
                  src={pbUrl(bot.image_url.trim())}
                  alt={`${bot.name} Backtest`}
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
                <span className="absolute bottom-3 left-3 rounded-md border border-white/10 bg-black/70 px-2.5 py-1 font-data text-[9.5px] uppercase tracking-wider text-akg-gold backdrop-blur">
                  Backtest, not live results
                </span>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-2 p-8 text-center">
                <div className="h-12 w-12 rounded-2xl border border-white/10 bg-white/5 flex items-center justify-center">
                  <CatIcon className="h-6 w-6 text-akg-gold" />
                </div>
                <div className="font-data text-xs uppercase tracking-wider text-white">
                  {cat.label} Strategy
                </div>
                <div className="font-data text-[10px] text-akg-muted">
                  {pairs.join(', ') || 'All Pairs'} · {bot.platform}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Stat Tiles: ONLY rendered if at least one stat has data */}
        {statItems.length > 0 && (
          <div className={`grid gap-3 grid-cols-2 sm:grid-cols-${Math.min(statItems.length, 4)}`}>
            {statItems.map((s) => (
              <div key={s.label} className="rounded-2xl border border-white/10 bg-akg-surface p-4 text-center">
                <div className={`font-data text-xl font-bold ${s.tone}`}>{s.value}</div>
                <div className="mt-1 font-data text-[10px] uppercase tracking-wider text-akg-muted">{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Strategy Text & Details */}
        <section className="space-y-4 rounded-2xl border border-white/10 bg-akg-surface p-6">
          <h2 className="font-display text-lg font-bold text-white">Strategy Architecture</h2>
          {bot.description && (
            <p className="font-body text-sm leading-relaxed text-akg-silver whitespace-pre-line">
              {bot.description}
            </p>
          )}

          {bot.strategy_type && (
            <div className="pt-1 font-data text-xs text-akg-silver">
              Core logic: <span className="text-akg-gold font-semibold">{bot.strategy_type}</span>
            </div>
          )}

          {/* Running specifications (only if fields have data) */}
          {(timeframes.length > 0 || bot.min_lot != null || bot.leverage || bot.trading_style) && (
            <div className="grid gap-2.5 pt-3 sm:grid-cols-2 md:grid-cols-4">
              {timeframes.length > 0 && (
                <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-3">
                  <div className="font-data text-[9.5px] uppercase text-akg-muted">Timeframes</div>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {timeframes.map((tf) => (
                      <span key={tf} className="font-data text-xs text-akg-gold">{tf}</span>
                    ))}
                  </div>
                </div>
              )}
              {bot.trading_style && (
                <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-3">
                  <div className="font-data text-[9.5px] uppercase text-akg-muted">Style</div>
                  <div className="mt-1 font-data text-xs text-white">{bot.trading_style}</div>
                </div>
              )}
              {bot.min_lot != null && bot.min_lot !== '' && (
                <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-3">
                  <div className="font-data text-[9.5px] uppercase text-akg-muted">Min Lot</div>
                  <div className="mt-1 font-data text-xs text-white">{bot.min_lot}</div>
                </div>
              )}
              {bot.leverage && (
                <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-3">
                  <div className="font-data text-[9.5px] uppercase text-akg-muted">Leverage</div>
                  <div className="mt-1 font-data text-xs text-white">{bot.leverage}</div>
                </div>
              )}
            </div>
          )}

          {bot.broker_note && (
            <p className="text-xs text-akg-muted leading-relaxed pt-2">
              <span className="font-semibold text-akg-silver">Broker Note:</span> {bot.broker_note}
            </p>
          )}

          {features.length > 0 && (
            <div className="pt-3">
              <h3 className="font-data text-xs uppercase tracking-wider text-akg-muted mb-3">Key Features</h3>
              <div className="grid gap-2 sm:grid-cols-2">
                {features.map((f) => (
                  <div key={f} className="flex items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 text-xs text-akg-silver">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-akg-green" />
                    <span>{f}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* What You Get */}
        <section className="space-y-4">
          <h2 className="font-display text-lg font-bold text-white">What You Get</h2>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-akg-surface p-5 space-y-2">
              <div className="h-9 w-9 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center text-akg-gold">
                <Download className="h-4 w-4" />
              </div>
              <h3 className="font-bold text-sm text-white">EA Binary File</h3>
              <p className="text-xs text-akg-muted leading-relaxed">
                Compiled .{bot.platform.toLowerCase().includes('mt4') ? 'ex4' : 'ex5'} executable file, ready to attach to your charts.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-akg-surface p-5 space-y-2">
              <div className="h-9 w-9 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center text-akg-green">
                <FileText className="h-4 w-4" />
              </div>
              <h3 className="font-bold text-sm text-white">Setup Guide</h3>
              <p className="text-xs text-akg-muted leading-relaxed">
                Step-by-step setup documentation with WebRequest URL allowlisting instructions.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-akg-surface p-5 space-y-2">
              <div className="h-9 w-9 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center text-sky-400">
                <RefreshCw className="h-4 w-4" />
              </div>
              <h3 className="font-bold text-sm text-white">Version Updates</h3>
              <p className="text-xs text-akg-muted leading-relaxed">
                Perpetual license covers all future version releases and optimizations for this system.
              </p>
            </div>
          </div>

          {/* Drive package link if owned */}
          {owned && bot.download_url && (
            <div className="rounded-2xl border border-sky-400/30 bg-sky-400/[0.06] p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <HardDrive className="h-5 w-5 text-sky-400 shrink-0" />
                <div>
                  <div className="text-sm font-bold text-white">Google Drive Distribution Package</div>
                  <div className="text-xs text-sky-300/80">Contains full presets, historical set files, and release archives.</div>
                </div>
              </div>
              <a
                href={bot.download_url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto shrink-0 inline-flex items-center justify-center gap-1.5 rounded-full bg-sky-400 px-4 py-2 font-data text-xs font-bold text-black hover:bg-sky-300 transition-colors"
              >
                <span>Open Drive</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          )}
        </section>

        {/* Release History (if present) */}
        {selectedChanges.length > 0 && (
          <section className="space-y-3 rounded-2xl border border-white/10 bg-akg-surface p-6">
            <h2 className="font-display text-lg font-bold text-white">Release History</h2>
            <ol className="mt-3 space-y-3 border-l border-white/10 pl-4">
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
                  <p className="mt-1 text-xs text-akg-muted">{ch.summary}</p>
                </li>
              ))}
            </ol>
          </section>
        )}

        {/* One-line demo-account reminder & Risk Disclosure */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-4 text-xs text-akg-silver">
            <FlaskConical className="h-4 w-4 shrink-0 text-akg-gold" />
            <span>
              <strong className="text-white">Demo account reminder:</strong> Always run the EA on a demo account first to validate execution and slippage on your broker's live feed before committing live capital.
            </span>
          </div>

          <p className="text-[11px] leading-relaxed text-akg-muted">
            <strong className="text-akg-silver">Risk Disclosure:</strong> Backtested results do not represent actual trading and cannot account for impact of financial risk or market liquidity. Algorithmic trading carries risk of substantial loss.
          </p>
        </div>

        {/* License Viewer Modal for Owners */}
        {licenseModalBot && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-2xl border border-white/10 bg-akg-surface p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-akg-green" />
                  <h3 className="font-bold text-white text-base">Active License</h3>
                </div>
                <button
                  onClick={() => setLicenseModalBot(null)}
                  className="rounded-lg p-1 text-akg-muted hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div>
                <div className="font-bold text-sm text-white">{licenseModalBot.bot.name}</div>
                <div className="font-data text-xs text-akg-muted">Platform: {licenseModalBot.bot.platform}</div>
              </div>

              <div className="rounded-xl border border-akg-green/30 bg-akg-green/10 p-4 space-y-2 font-mono">
                <div className="flex items-center justify-between text-[11px] font-bold text-akg-green">
                  <span>License Key:</span>
                  <button
                    onClick={() => handleCopy(licenseModalBot.payment.license_key)}
                    className="flex items-center gap-1 hover:underline"
                  >
                    {copiedKey ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    <span>{copiedKey ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <div className="rounded-lg bg-black/60 border border-white/10 p-2.5 text-xs text-white font-bold break-all select-all">
                  {licenseModalBot.payment.license_key}
                </div>
                <p className="text-[10px] text-akg-silver font-sans">
                  Paste this key into the EA inputs dialog. It binds silently to your account on first run.
                </p>
              </div>

              <div className="flex flex-wrap gap-2 pt-2">
                {downloadLinksFor(licenseModalBot.bot).map((l) => (
                  <a
                    key={l.path}
                    href={l.path}
                    download
                    className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-akg-green px-3.5 py-2 font-data text-xs font-bold text-black hover:bg-emerald-400 transition-colors"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Download .{l.ext}</span>
                  </a>
                ))}
                {licenseModalBot.bot.download_url && (
                  <a
                    href={licenseModalBot.bot.download_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-sky-400/40 bg-sky-400/10 px-3.5 py-2 font-data text-xs font-semibold text-sky-300 hover:bg-sky-400/20"
                  >
                    <HardDrive className="h-3.5 w-3.5" />
                    <span>Drive Package</span>
                  </a>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ==========================================================================
  // CATALOG GRID: /bots
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
            Rule-based MT4 & MT5 systems with hard stop-loss risk parameters and zero martingale exposure. One-time USDT payment with automatic silent first-run binding.
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

      {/* Bots Grid */}
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
              {/* Card Header: Backtest Image if available, else clean category header */}
              {bot.image_url ? (
                <div className="relative h-32 w-full overflow-hidden border-b border-white/[0.06] bg-[#0A0D13]">
                  <img
                    src={pbUrl(bot.image_url.trim())}
                    alt={bot.name}
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
                  <div className="absolute top-3 left-3 flex items-center gap-2">
                    <Badge variant="secondary" className="font-mono text-[10px]">{bot.platform}</Badge>
                    <span className="font-data text-[10px] text-white/70">{bot.version || 'v1.0'}</span>
                  </div>
                  {owned ? (
                    <Badge variant="positive" className="absolute top-3 right-3 text-[10px]">Licensed</Badge>
                  ) : pending ? (
                    <Badge variant="gold" className="absolute top-3 right-3 text-[10px]">Pending</Badge>
                  ) : null}
                  <span className="absolute bottom-2 left-3 font-data text-[9px] uppercase tracking-wider text-akg-gold">
                    Backtest Preview
                  </span>
                </div>
              ) : (
                <div className="border-b border-white/[0.06] bg-[#0A0D13] p-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="font-mono text-[10px]">{bot.platform}</Badge>
                    <span className="font-data text-[10px] text-akg-muted">{bot.version || 'v1.0'}</span>
                  </div>
                  {owned ? (
                    <Badge variant="positive" className="text-[10px]">Licensed</Badge>
                  ) : pending ? (
                    <Badge variant="gold" className="text-[10px]">Pending</Badge>
                  ) : (
                    <span className="font-data text-[10px] uppercase text-akg-muted">{pairsOf(bot)[0] || 'FX'}</span>
                  )}
                </div>
              )}

              <div className="flex flex-1 flex-col p-5">
                <h3 className="font-display text-base font-bold text-white group-hover:text-akg-gold transition-colors">
                  {bot.name}
                </h3>
                {bot.strategy_type && (
                  <p className="mt-1 font-data text-[11px] uppercase tracking-wide text-akg-muted">
                    {bot.strategy_type}
                  </p>
                )}
                <p className="mt-2.5 line-clamp-2 text-xs leading-relaxed text-akg-muted">
                  {bot.description}
                </p>

                {/* Only display stats if filled */}
                {(bot.win_rate != null || bot.profit_factor != null || bot.drawdown != null) && (
                  <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 font-data text-[11px]">
                    {statNumOrNull(bot.win_rate) !== null && <span className="text-akg-green">{pctStat(bot.win_rate)} win</span>}
                    {statNumOrNull(bot.profit_factor) !== null && <span className="text-akg-muted">PF {bot.profit_factor}</span>}
                    {statNumOrNull(bot.drawdown) !== null && <span className="text-akg-muted">DD {pctStat(bot.drawdown)}</span>}
                  </div>
                )}

                <div className="mt-auto flex items-center justify-between pt-5 border-t border-white/[0.04]">
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
    </div>
  );
}
