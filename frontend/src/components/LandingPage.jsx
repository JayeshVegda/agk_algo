import React, { useState, useEffect } from 'react';
import { pb } from '../lib/pocketbase';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import {
  Cpu, Zap, ArrowRight, Check, ShieldCheck,
  Terminal, TrendingUp, TrendingDown, Lock, Activity, Wallet, KeyRound,
  Coins, Bitcoin, ArrowLeftRight, ChevronLeft, ChevronRight, LineChart,
  BellRing, FileText, Database, Headphones, Newspaper
} from 'lucide-react';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from './ui/Accordion';
import Reveal, { RevealGroup, RevealItem } from './motion/Reveal';
import { motion, useReducedMotion } from 'motion/react';
import CountUp from './motion/CountUp';
import Ticker from './motion/Ticker';
import EquityCurve from './EquityCurve';
import { useSiteSettings } from '../lib/wallets';

const botSlug = (name) =>
  String(name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

/* Performance stats render only when an admin actually entered them in PocketBase. */
const hasStats = (bot) => Boolean(bot?.win_rate || bot?.profit_factor || bot?.drawdown);

/* Market category chip on bot cards, derived from pairs/strategy. */
const botCategory = (bot) => {
  const s = `${bot?.pairs || ''} ${bot?.strategy_type || ''}`.toLowerCase();
  if (s.includes('gold') || s.includes('xau')) return { label: 'Gold', icon: Coins };
  if (s.includes('btc') || s.includes('crypto') || s.includes('eth') || s.includes('sol')) return { label: 'Crypto', icon: Bitcoin };
  if (/us30|nas100|us500|dax40|indices|x\.?1/.test(s)) return { label: 'Indices', icon: ArrowLeftRight };
  return { label: 'Forex', icon: LineChart };
};

/* Static fallbacks shown if the API is unreachable.
   No performance stats here — win rate / P.F. / drawdown stat displays
   only render when they come from admin-entered PocketBase records. */
const FALLBACK_BOTS = [
  {
    id: 'gold-trap', name: 'AKG Gold Trap EA', platform: 'MT4', pairs: 'XAUUSD (Gold)',
    price: 299, version: 'v3.2',
    description: 'Liquidity-sweep reversal algorithm engineered for Gold sessions with volatility trailing stops.',
    features: 'Hard Stop-Loss on every trade, Dynamic lot-sizing, Built for volatile Gold sessions, Recommended deposit: $500+',
    image_url: '',
  },
  {
    id: 'momentum-hunter', name: 'AKG Momentum Hunter', platform: 'MT5', pairs: 'EURUSD, GBPUSD',
    price: 349, version: 'v2.8',
    description: 'Multi-session trend-following algorithm specialized for currency breakout expansions.',
    features: 'Session momentum filter, Automated trailing stop, Prop firm FIFO compatible, Recommended deposit: $1,000+',
    image_url: '',
  },
  {
    id: 'scalper-pro', name: 'AKG Scalper Pro', platform: 'MT4 / MT5', pairs: 'Majors & Indices',
    price: 399, version: 'v4.1',
    description: 'Low-latency M1 and M5 scalper engineered for liquid market hours with spread protection.',
    features: 'Spread spike filter, Multi-tier profit targets, Zero martingale exposure, Recommended deposit: $300+',
    image_url: '',
  },
];

const FAQS = [
  {
    q: 'Which brokers and platforms are supported?',
    a: 'Our Expert Advisors run on MetaTrader 4 (MT4) and MetaTrader 5 (MT5). You can use any regulated broker (IC Markets, Pepperstone, Tickmill) or prop firm evaluation accounts like FTMO.',
  },
  {
    q: 'Are the bot licenses a one-time purchase?',
    a: 'Yes. Every bot license is a one-time payment for perpetual use. There are zero recurring monthly charges or hidden maintenance fees.',
  },
  {
    q: 'How does license activation work?',
    a: 'After purchasing, open the Trading Bots tab, enter your MetaTrader live or demo account number, and copy your generated license key into the EA inputs when attaching it to your chart.',
  },
  {
    q: 'Do the trading bots use martingale or grid techniques?',
    a: 'Never. Every position opened by our algorithms carries an immediate, pre-calculated hard stop loss. We reject martingale, grid averaging, and unhedged drawdown strategies.',
  },
  {
    q: 'How are payments settled?',
    a: 'We accept direct USDT transfers over TRC-20, BEP-20, and ERC-20 networks. Your transaction is verified on-chain with no card processors and no automatic rebilling.',
  },
];

const PLANS = [
  {
    id: 'SR_SIGNAL_BOX',
    name: 'SR Signal Box',
    price: 10,
    tier: 'Standard',
    blurb: 'Daily EURUSD and GBPUSD setups, delivered in real time.',
    features: [
      'Currency pairs (EURUSD, GBPUSD)',
      'Entry, stop-loss and take-profit included',
      'Real-time browser alerts',
      '30-day signal archive access',
    ],
    vip: false,
  },
  {
    id: 'PERFECT_SIGNAL_BOX',
    name: 'Perfect Signal Box',
    price: 20,
    tier: 'VIP',
    blurb: 'Gold, bitcoin and index setups during high-volatility sessions.',
    features: [
      'High-volatility assets: XAUUSD, BTC & indices',
      'Multiple take-profit levels and trailing stops',
      'All bot presets & MT4/MT5 templates',
      'Priority desk alerts',
    ],
    vip: true,
  },
];

const STEPS = [
  {
    label: 'Choose your system',
    body: 'Pick the Expert Advisor or signal box that matches your pair, timeframe, and MT4 or MT5 platform.',
    icon: Cpu,
  },
  {
    label: 'Settle in USDT',
    body: 'Pay once with USDT on TRC-20, BEP-20, or ERC-20. No card processors, no recurring charges.',
    icon: Wallet,
  },
  {
    label: 'Attach & activate',
    body: 'Download your EA file, paste the license key issued to your account, and let it run on your chart.',
    icon: KeyRound,
  },
];

export function LandingPage({ onNavigate, onOpenAuth, notify }) {
  const settings = useSiteSettings();
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [bots, setBots] = useState(FALLBACK_BOTS);
  const [botCount, setBotCount] = useState(FALLBACK_BOTS.length);
  const [previews, setPreviews] = useState([]);
  const [briefings, setBriefings] = useState([]);
  /* Embla autoplay is a vestibular trigger (iart-ai accessible-animation:
     continuous carousels are Tier 1) — only play with motion preference. */
  const botsAutoplay = React.useMemo(
    () => Autoplay({
      delay: 3800,
      stopOnMouseEnter: true,
      stopOnInteraction: false,
      playOnInit: !(
        typeof window !== 'undefined'
        && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
      ),
    }),
    []
  );
  const [botsEmblaRef, botsEmbla] = useEmblaCarousel(
    { loop: true, align: 'start', duration: 26 },
    [botsAutoplay]
  );
  const [botsSel, setBotsSel] = useState(0);
  const [botsSnaps, setBotsSnaps] = useState(0);
  const [chartFailed, setChartFailed] = useState({});
  const reduceMotionRef = React.useRef(false);

  useEffect(() => {
    if (!botsEmbla) return undefined;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const apply = (reduced) => {
      reduceMotionRef.current = reduced;
      if (reduced) botsAutoplay.stop();
      else botsAutoplay.play();
    };
    const onMq = (e) => apply(e.matches);
    const onReInit = () => apply(mq.matches);
    apply(mq.matches);
    mq.addEventListener('change', onMq);
    botsEmbla.on('reInit', onReInit);
    const onSelect = () => setBotsSel(botsEmbla.selectedScrollSnap());
    const onSnaps = () => setBotsSnaps(botsEmbla.scrollSnapList().length);
    botsEmbla.on('select', onSelect);
    botsEmbla.on('reInit', onSnaps);
    onSelect();
    onSnaps();
    return () => {
      mq.removeEventListener('change', onMq);
      botsEmbla.off('reInit', onReInit);
      botsAutoplay.stop();
    };
  }, [botsEmbla, botsAutoplay]);

  const scrollBots = (dir) => {
    if (!botsEmbla) return;
    if (dir < 0) botsEmbla.scrollPrev();
    else botsEmbla.scrollNext();
  };

  // Live catalog + masked signal previews (both publicly readable by API rules)
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const botsRes = await pb.collection('bots').getList(1, 8, { sort: '-created' });
        if (!cancelled && botsRes.items.length) {
          setBots(botsRes.items);
          setBotCount(botsRes.totalItems);
        }
      } catch {
        /* fallback data already in state */
      }
      try {
        const prevRes = await pb.collection('signal_previews').getList(1, 8, { sort: '-created' });
        if (!cancelled) setPreviews(prevRes.items);
      } catch {
        /* hero feed simply renders empty */
      }
      try {
        const brRes = await pb.collection('broadcasts').getList(1, 3, { sort: '-created' });
        if (!cancelled) setBriefings(brRes.items);
      } catch {
        /* desk section simply hidden when absent */
      }
    };

    load();

    const unsubBots = pb.collection('bots').subscribe('*', () => load()).catch(() => {});
    const unsubPrev = pb.collection('signal_previews').subscribe('*', () => load()).catch(() => {});
    const unsubBrief = pb.collection('broadcasts').subscribe('*', () => load()).catch(() => {});

    return () => {
      cancelled = true;
      unsubBots.then((unsub) => unsub && unsub()).catch(() => {});
      unsubPrev.then((unsub) => unsub && unsub()).catch(() => {});
      unsubBrief.then((unsub) => unsub && unsub()).catch(() => {});
    };
  }, []);


  const tickerItems = previews.slice(0, 8).map((s) => {
    const pnl = String(s.pnl || '');
    const down = pnl.trim().startsWith('-');
    return {
      label: `${s.symbol} ${s.direction}`,
      value: pnl || s.status,
      tone: down ? 'down' : 'up',
    };
  });

  return (
    <div className="font-sans text-akg-silver w-full -mt-6">
      {settings.landing_announcement && !bannerDismissed && (
        <div className="-mt-2 mb-4 flex items-center justify-between gap-3 rounded-xl border border-[#F3C653]/30 bg-[#F3C653]/[0.06] px-4 py-2.5">
          <p className="text-xs font-semibold text-akg-gold">{settings.landing_announcement}</p>
          <button onClick={() => setBannerDismissed(true)} className="shrink-0 text-xs text-akg-muted hover:text-white" aria-label="Dismiss">✕</button>
        </div>
      )}
      {/* ============================================================
          1. HERO — asymmetric split: copy left, real live feed right
      ============================================================ */}
      <section className="relative overflow-hidden lg:flex lg:min-h-[calc(100dvh-7rem)] lg:items-center">
        {/* ambient brand glow + faint terminal dot-grid for depth */}
        <div className="pointer-events-none absolute -top-32 right-[10%] h-96 w-96 rounded-full bg-[#F3C653]/[0.05] blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-[5%] h-72 w-72 rounded-full bg-[#00D878]/[0.04] blur-3xl" />
        <div
          className="pointer-events-none absolute inset-0 [background-image:radial-gradient(circle_at_1px,rgba(231,233,239,0.055)_1px,transparent_0)] [background-size:26px_26px] [mask-image:radial-gradient(ellipse_65%_70%_at_60%_40%,black,transparent)]"
        />

        <div className="grid w-full items-center gap-8 py-4 sm:gap-12 sm:py-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 lg:py-14">
          {/* Copy column */}
          <div className="max-w-2xl">
            <Reveal>
              <span className="inline-flex items-center gap-2 font-data text-[11px] uppercase tracking-[0.18em] text-akg-gold">
                <span className="live-dot" />
                MT4 &amp; MT5 Expert Advisors
              </span>
            </Reveal>

            <Reveal delay={0.08}>
              <h1 className="mt-4 font-display text-[2rem] font-extrabold leading-[1.08] tracking-tight text-white sm:mt-5 sm:text-5xl">
                Trade <span className="text-metallic">smarter.</span>
                <br className="hidden sm:block" />{' '}
                Automate every entry.
              </h1>
            </Reveal>

            <Reveal delay={0.16}>
              <p className="mt-4 max-w-[52ch] text-[15px] leading-relaxed text-akg-muted sm:mt-5 sm:text-lg">
                Rule-based Expert Advisors and live signal desks with hard stop-loss on every trade. Settled in USDT, yours forever.
              </p>
            </Reveal>

            <Reveal delay={0.24}>
              <div className="mt-6 flex flex-col gap-2.5 sm:mt-8 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
                <Button size="lg" variant="default" onClick={() => onNavigate('pricing')} className="w-full gap-2 sm:w-auto">
                  <Cpu className="h-4 w-4" />
                  <span>Get Access</span>
                </Button>
                <Button size="lg" variant="outline" onClick={() => onNavigate('signals')} className="w-full gap-2 sm:w-auto">
                  <Terminal className="h-4 w-4 text-akg-green" />
                  <span>View Live Signals</span>
                </Button>
              </div>
            </Reveal>

            <Reveal delay={0.28}>
              <p className="mt-5 flex flex-wrap items-center gap-x-2.5 gap-y-1 font-data text-[10px] uppercase tracking-[0.13em] text-akg-muted/80">
                <span>Hard stop-loss on every trade</span>
                <span className="text-akg-gold/40">/</span>
                <span>USDT settled</span>
                <span className="text-akg-gold/40">/</span>
                <span>One-time licenses</span>
              </p>
            </Reveal>
          </div>

          {/* Live feed column: a real component rendering the real masked feed */}
          <Reveal delay={0.2} className="w-full">
            <div className="surface-glass rounded-2xl">
              <div className="flex items-center justify-between border-b border-white/[0.07] px-4 py-3 sm:px-5 sm:py-3.5">
                <div className="flex items-center gap-2.5">
                  <span className="live-dot" />
                  <span className="font-data text-[11px] uppercase tracking-[0.16em] text-akg-silver">
                    Live signal feed
                  </span>
                </div>
                <Activity className="h-4 w-4 text-akg-green" />
              </div>

              <div className="divide-y divide-white/[0.05]">
                {previews.length === 0 && (
                  <div className="px-5 py-8 text-center text-xs text-akg-muted">
                    Connecting to the signal desk...
                  </div>
                )}
                {previews.slice(0, 5).map((s, i) => {
                  const down = String(s.pnl || '').trim().startsWith('-');
                  return (
                    <div
                      key={s.id}
                      className={`${i === 4 ? 'hidden sm:flex' : 'flex'} items-center justify-between gap-3 px-4 py-3 sm:px-5`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-data text-sm font-semibold text-white">{s.symbol}</span>
                        <span
                          className={`rounded px-1.5 py-0.5 font-data text-[10px] font-bold ${
                            s.direction === 'BUY'
                              ? 'bg-akg-green/15 text-akg-green'
                              : 'bg-rose-500/15 text-rose-400'
                          }`}
                        >
                          {s.direction}
                        </span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-data text-xs text-akg-muted">{s.plan_tier === 'PERFECT_SIGNAL_BOX' ? 'VIP' : 'SR'}</span>
                        <span className={`w-20 text-right font-data text-xs font-semibold ${down ? 'text-rose-400' : 'text-akg-green'}`}>
                          {s.pnl}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-between gap-3 border-t border-white/[0.07] px-4 py-3 sm:px-5">
                <span className="flex items-center gap-1.5 text-[11px] text-akg-muted">
                  <Lock className="h-3 w-3 shrink-0" />
                  Entry, SL &amp; TP visible to members
                </span>
                <button
                  onClick={() => onNavigate('signals')}
                  className="group flex shrink-0 items-center gap-1 text-[11px] font-semibold text-akg-gold hover:text-akg-goldLight"
                >
                  View Live Signals
                  <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                </button>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ============================================================
          2. TICKER TAPE — real recent signals, the single marquee
      ============================================================ */}
      {tickerItems.length > 0 && (
        <Ticker items={tickerItems} className="-mt-2 mb-4" />
      )}

      {/* ============================================================
          3. STATS BAND — real counts, hairline separated, no cards
      ============================================================ */}
      <section className="border-y border-white/[0.07]">
        <RevealGroup className="mx-auto grid max-w-5xl grid-cols-2 gap-y-6 px-4 py-8 md:grid-cols-4 md:py-10">
          {[
            { value: botCount, label: 'Expert Advisors', format: (v) => `${Math.round(v)}` },
            { value: 30, label: 'Day signal cycles', format: (v) => `${Math.round(v)}` },
            { value: 3, label: 'USDT networks', format: (v) => `${Math.round(v)}` },
            { value: 100, label: 'Hard stop-loss policy', format: (v) => `${Math.round(v)}%` },
          ].map((stat) => (
            <RevealItem key={stat.label} className="text-center">
              <div className="font-display text-3xl font-extrabold text-white sm:text-4xl">
                <CountUp value={stat.value} format={stat.format} />
              </div>
              <div className="mt-1.5 text-xs text-akg-muted">{stat.label}</div>
            </RevealItem>
          ))}
        </RevealGroup>
      </section>

      {/* ============================================================
          4. BOTS SHOWCASE — snap carousel, one card per bot
      ============================================================ */}
      <section className="relative mx-auto max-w-7xl px-4 py-14 sm:py-20">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <Reveal>
            <span className="font-data text-[10px] font-bold uppercase tracking-[0.22em] text-akg-gold/80">
              EA catalog
            </span>
            <h2 className="mt-2.5 font-display text-3xl font-extrabold leading-[1.12] tracking-tight text-white sm:text-4xl">
              Buy once, own it for good.
            </h2>
            <p className="mt-3 max-w-[60ch] text-sm text-akg-muted sm:text-[15px]">
              Compare win rate, drawdown, and strategy type, then pick the bot that fits your market. Every license is locked to your MetaTrader account number.
            </p>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="hidden sm:flex items-center gap-2.5">
              <motion.button
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.9 }}
                transition={{ type: 'spring', stiffness: 420, damping: 26 }}
                onClick={() => scrollBots(-1)}
                aria-label="Previous bots"
                className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-akg-surface text-akg-silver transition-colors hover:border-[#F3C653]/40 hover:text-akg-gold cursor-pointer"
              >
                <ChevronLeft className="h-4.5 w-4.5" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.9 }}
                transition={{ type: 'spring', stiffness: 420, damping: 26 }}
                onClick={() => scrollBots(1)}
                aria-label="Next bots"
                className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-akg-surface text-akg-silver transition-colors hover:border-[#F3C653]/40 hover:text-akg-gold cursor-pointer"
              >
                <ChevronRight className="h-4.5 w-4.5" />
              </motion.button>
            </div>
          </Reveal>
        </div>

        <Reveal delay={0.08} y={36}>
          <div className="-mx-4 mt-9">
            <div className="overflow-hidden py-2" ref={botsEmblaRef}>
              <div className="flex">
                {bots.map((bot) => {
                  const cat = botCategory(bot);
                  const CatIcon = cat.icon;
                  const img = (bot.image_url || '').trim();
                  const g0 = (bot.gallery && bot.gallery[0]) || '';
                  let chartSrc = img
                    || (/^(https?:|data:)/.test(g0) ? g0 : (g0 && g0.length > 6 ? pb.files.getURL(bot, g0) : ''));
                  const broken = chartFailed[bot.id];
                  const showChart = chartSrc && !broken;
                  return (
                    <div
                      key={bot.id}
                      className="min-w-0 shrink-0 flex-[0_0_300px] pl-4 sm:flex-[0_0_340px]"
                    >
                      <article
                        className="bot-card group flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.05] to-white/[0.015]"
                        onMouseEnter={() => botsAutoplay.stop()}
                        onMouseLeave={() => {
                          if (reduceMotionRef.current === false) botsAutoplay.play();
                        }}
                      >
                        {/* Media: real chart image, equity fallback, or neutral placeholder */}
                        <div className="relative shrink-0 overflow-hidden bg-[#0A0D13]">
                          {showChart ? (
                            <img
                              src={chartSrc}
                              alt={`${bot.name} chart`}
                              loading="lazy"
                              onError={() => setChartFailed((p) => ({ ...p, [bot.id]: true }))}
                              className="h-44 w-full object-cover transition-transform duration-700 ease-akg group-hover:scale-[1.045] sm:h-48 will-change-transform"
                            />
                          ) : hasStats(bot) ? (
                            <div className="relative px-3 pt-3">
                              <EquityCurve
                                seed={bot.name}
                                profitFactor={bot.profit_factor}
                                drawdown={bot.drawdown}
                                winRate={bot.win_rate}
                                points={80}
                                className="h-36 w-full sm:h-40"
                              />
                            </div>
                          ) : (
                            <div className="flex h-44 flex-col items-center justify-center gap-1.5 text-center sm:h-48">
                              <LineChart className="h-5 w-5 text-akg-muted" />
                              <span className="px-6 font-data text-[10px] uppercase tracking-wide text-akg-muted">
                                {bot.pairs} · {bot.platform}
                              </span>
                            </div>
                          )}
                          {/* Depth overlay so floating chips stay legible */}
                          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-black/30" />

                          <div className="absolute left-3 top-3 flex items-center gap-2">
                            <motion.span
                              whileHover={{ scale: 1.05 }}
                              className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-black/40 px-2.5 py-1 font-data text-[10px] font-bold uppercase tracking-[0.14em] text-akg-silver backdrop-blur-md"
                            >
                              <CatIcon className="h-3.5 w-3.5 text-akg-gold" />
                              {cat.label}
                            </motion.span>
                          </div>
                          {hasStats(bot) && (
                            <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-akg-green/90 px-2.5 py-1 font-data text-[9px] font-bold uppercase tracking-wide text-[#04240E]">
                              <Check className="h-2.5 w-2.5" strokeWidth={3} />
                              Backtested
                            </span>
                          )}

                          <h3 className="absolute bottom-3 left-3 right-3 font-display text-[17px] font-bold leading-tight text-white">
                            {bot.name}
                          </h3>
                        </div>

                        {/* Body */}
                        <div className="flex flex-1 flex-col p-4">
                          <div className="flex items-center justify-between font-data text-[10px] uppercase tracking-wide text-akg-muted">
                            <span>{bot.platform} · {bot.pairs}</span>
                            <span className="text-akg-gold/80">{bot.version}</span>
                          </div>

                          <div className="mt-3 grid grid-cols-3 gap-2">
                            {[
                              { k: 'Strategy', v: bot.strategy_type },
                              { k: 'Win rate', v: bot.win_rate },
                              { k: 'Drawdown', v: bot.drawdown },
                            ].map(({ k, v }) => (
                              <div key={k} className="flex flex-col justify-center rounded-lg bg-white/[0.05] px-2 py-2 text-center transition-colors group-hover:bg-white/[0.07]">
                                <div
                                  className={`font-data font-semibold text-white ${k === 'Strategy' ? 'line-clamp-2 text-[10px] leading-tight' : 'text-[13px]'}`}
                                >
                                  {v || <span className="text-akg-muted">—</span>}
                                </div>
                                <div className="mt-0.5 text-[9px] uppercase tracking-wide text-akg-muted">{k}</div>
                              </div>
                            ))}
                          </div>

                          <div className="mt-auto pt-4">
                            <Button
                              variant="default"
                              className="w-full justify-center text-[13px]"
                              onClick={() => onNavigate('bots', botSlug(bot.name))}
                            >
                              <span>View Bot · ${bot.price}</span>
                              <ArrowRight className="h-3.5 w-3.5" />
                            </Button>
                            <div className="mt-2 text-center text-[10px] text-akg-muted">
                              One-time license · {bot.platform}
                            </div>
                          </div>
                        </div>
                      </article>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Compact counter-dots (transform-only active state) */}
            {botsSnaps > 1 && (
              <div className="mt-3 flex justify-center gap-2" role="tablist" aria-label="Bot slides">
                {Array.from({ length: botsSnaps }).map((_, i) => (
                  <button
                    key={i}
                    aria-label={`Go to slide ${i + 1}`}
                    onClick={() => botsEmbla && botsEmbla.scrollTo(i)}
                    className={`flex h-6 w-6 items-center justify-center cursor-pointer`}
                  >
                    <span
                      className={`h-1 w-5 rounded-full transition-all duration-200 ${
                        i === botsSel ? 'bg-akg-gold' : 'scale-x-50 bg-white/20'
                      }`}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        </Reveal>

        <Reveal>
          <div className="mt-8 text-center">
            <button
              onClick={() => onNavigate('bots')}
              className="group inline-flex items-center gap-1.5 text-sm font-semibold text-akg-gold hover:text-akg-goldLight"
            >
              Browse all {botCount} Expert Advisors
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </button>
          </div>
        </Reveal>
      </section>

      {/* ============================================================
          5. SIGNAL PLANS — duo with metallic VIP treatment
      ============================================================ */}
      <section className="border-y border-white/[0.07] bg-[#0A0D12]">
        <div className="mx-auto max-w-5xl px-4 py-14 sm:py-20">
          <Reveal>
            <div className="text-center">
              <span className="font-data text-[10px] font-bold uppercase tracking-[0.22em] text-akg-gold/80">
                Signal plans
              </span>
            </div>
            <h2 className="mt-2.5 text-center font-display text-3xl font-extrabold leading-[1.12] tracking-tight text-white sm:text-4xl">
              Live signals, complete setups.
            </h2>
            <p className="mx-auto mt-3 max-w-[55ch] text-center text-sm text-akg-muted sm:text-[15px]">
              Every alert comes with the entry, stop-loss, and take-profit already worked out.
            </p>
          </Reveal>

          <RevealGroup className="mt-10 grid gap-6 md:grid-cols-2 sm:mt-12" stagger={0.12}>
            {PLANS.map((plan) => (
              <RevealItem key={plan.id}>
                <article
                  className={`flex h-full flex-col rounded-2xl p-7 ${
                    plan.vip
                      ? 'border border-[#F3C653]/40 bg-gradient-to-b from-[#171208] to-akg-surface shadow-gold ring-1 ring-[#F3C653]/25'
                      : 'border border-white/10 bg-akg-surface'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <Badge variant={plan.vip ? 'gold' : 'secondary'}>{plan.tier}</Badge>
                    <span className="text-[11px] text-akg-muted">Manual 30-day renewal</span>
                  </div>

                  <h3 className="mt-4 font-display text-xl font-bold text-white">{plan.name}</h3>

                  <div className="mt-3 flex items-baseline gap-1.5">
                    <span className={`font-display text-4xl font-extrabold tabular-nums ${plan.vip ? 'text-metallic' : 'text-white'}`}>
                      ${plan.price}
                    </span>
                    <span className="text-xs text-akg-muted">USDT / 30 days</span>
                  </div>

                  <p className="mt-3 text-sm text-akg-muted">{plan.blurb}</p>

                  <ul className="mt-6 space-y-3">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2.5 text-sm text-akg-silver">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-akg-green" strokeWidth={2.5} />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-auto pt-7">
                    <Button
                      variant={plan.vip ? 'default' : 'outline'}
                      className="w-full justify-center"
                      onClick={() => onNavigate('pricing')}
                    >
                      <span>Get Access</span>
                    </Button>
                  </div>
                </article>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </section>

      {/* ============================================================
          5.5 MEMBERSHIP GAINS — tabbed checks + live panel
      ============================================================ */}
      <section className="relative border-y border-white/[0.07] bg-[#0A0D12]">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:py-20">
          <Reveal>
            <div className="text-center">
              <span className="font-data text-[10px] font-bold uppercase tracking-[0.22em] text-akg-gold/80">
                Inside AKG
              </span>
              <h2 className="mt-2.5 font-display text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                What membership gives you
              </h2>
            </div>
          </Reveal>
          <Reveal delay={0.08}>
            <Achievements previews={previews} briefings={briefings} onNavigate={onNavigate} />
          </Reveal>
        </div>
      </section>

      {/* ============================================================
          6. HOW IT WORKS — vertical flow, verb-noun labels
      ============================================================ */}
      <section className="mx-auto max-w-3xl px-4 py-14 sm:py-20">
        <Reveal>
          <span className="font-data text-[10px] font-bold uppercase tracking-[0.22em] text-akg-gold/80">
            Setup
          </span>
          <h2 className="mt-2.5 font-display text-3xl font-extrabold leading-[1.12] tracking-tight text-white sm:text-4xl">
            How it works
          </h2>
        </Reveal>

        <div className="mt-10 space-y-0 sm:mt-12">
          {STEPS.map((step, i) => {
            const Icon = step.icon;
            return (
              <Reveal key={step.label} delay={i * 0.08}>
                <div className="relative flex gap-5 pb-10 last:pb-0 sm:gap-6">
                  {/* connector line */}
                  {i < STEPS.length - 1 && (
                    <div className="absolute left-[27px] top-14 h-[calc(100%-3.5rem)] w-px bg-gradient-to-b from-[#F3C653]/40 to-white/[0.06]" />
                  )}
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-[#F3C653]/25 bg-[#F3C653]/[0.07]">
                    <Icon className="h-6 w-6 text-akg-gold" strokeWidth={1.75} />
                  </div>
                  <div className="pt-1">
                    <h3 className="font-display text-lg font-bold text-white">
                      <span className="mr-2 font-data text-[11px] font-bold text-akg-gold/70">0{i + 1}</span>
                      {step.label}
                    </h3>
                    <p className="mt-1.5 max-w-[55ch] text-sm leading-relaxed text-akg-muted">{step.body}</p>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* ============================================================
          6.3 DESK TOOLKIT — switchable tool cards
      ============================================================ */}
      <section className="mx-auto max-w-6xl px-4 pb-14 sm:pb-20">
        <Reveal>
          <div className="rounded-3xl border border-white/[0.07] bg-akg-surface px-4 py-10 sm:px-8 sm:py-12">
            <h2 className="text-center font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              The desk toolkit
            </h2>
            <Toolkit />
          </div>
        </Reveal>
      </section>

      {/* ============================================================
          6.5 LATEST FROM THE DESK — real briefings, proof the desk is live
      ============================================================ */}
      {briefings.length > 0 && (
        <section className="border-y border-white/[0.07] bg-[#0A0D12]">
          <div className="mx-auto max-w-5xl px-4 py-12 sm:py-20">
            <div className="flex items-end justify-between gap-6">
              <Reveal>
                <span className="font-data text-[10px] font-bold uppercase tracking-[0.22em] text-akg-gold/80">
                  From the desk
                </span>
                <h2 className="mt-2.5 font-display text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
                  Latest briefings
                </h2>
                <p className="mt-2 max-w-[55ch] text-sm text-akg-muted">
                  Short desk notes as market conditions change.
                </p>
              </Reveal>
              <Reveal delay={0.1}>
                <button
                  onClick={() => onNavigate('broadcasts')}
                  className="group hidden shrink-0 items-center gap-1.5 text-sm font-semibold text-akg-gold hover:text-akg-goldLight sm:inline-flex"
                >
                  All briefings
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </button>
              </Reveal>
            </div>

            <RevealGroup className="mt-8 overflow-hidden rounded-2xl border border-white/10 bg-akg-surface" stagger={0.08}>
              {briefings.map((b, i) => (
                <RevealItem key={b.id}>
                  <button
                    onClick={() => onNavigate('broadcasts')}
                    className={`w-full px-6 py-5 text-left transition-colors hover:bg-white/[0.02] ${i > 0 ? 'border-t border-white/[0.06]' : ''}`}
                  >
                    <div className="flex items-baseline justify-between gap-4">
                      <h3 className="font-display text-[15px] font-bold text-white">{b.title}</h3>
                      <span className="shrink-0 font-data text-[10px] text-akg-muted">
                        {b.author || 'Desk'}
                      </span>
                    </div>
                    <p className="mt-1.5 line-clamp-1 text-xs text-akg-muted">{b.body}</p>
                  </button>
                </RevealItem>
              ))}
            </RevealGroup>
          </div>
        </section>
      )}

      {/* ============================================================
          7. FAQ — single column accordion
      ============================================================ */}
      <section className="mx-auto max-w-3xl px-4 pb-14 pt-14 sm:pt-20 sm:pb-20">
        <Reveal>
          <span className="font-data text-[10px] font-bold uppercase tracking-[0.22em] text-akg-gold/80">
            FAQ
          </span>
          <h2 className="mt-2.5 font-display text-2xl font-extrabold tracking-tight text-white sm:text-4xl">
            Frequently asked questions
          </h2>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="mt-8 rounded-2xl border border-white/10 bg-akg-surface px-6 py-2">
            <Accordion type="single" collapsible className="w-full">
              {FAQS.map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`}>
                  <AccordionTrigger>{faq.q}</AccordionTrigger>
                  <AccordionContent>{faq.a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </Reveal>
      </section>

      {/* ============================================================
          8. FINAL CTA — full-width gradient panel
      ============================================================ */}
      <section className="px-4 pb-4">
        <Reveal>
          <div className="relative overflow-hidden rounded-3xl border border-[#F3C653]/25 bg-gradient-to-b from-[#14100A] via-akg-surface to-akg-bg px-5 py-12 text-center sm:px-6 sm:py-20">
            <div className="pointer-events-none absolute -top-24 left-1/2 h-64 w-[36rem] -translate-x-1/2 rounded-full bg-[#F3C653]/[0.07] blur-3xl" />

            <img
              src="/assets/logos/akg-algo-metallic-footer.webp"
              alt="AKG ALGO"
              className="relative z-10 mx-auto h-12 w-auto sm:h-14"
              loading="lazy"
            />

            <h2 className="relative z-10 mt-6 font-display text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
              Your desk is ready when you are.
            </h2>
            <p className="relative z-10 mx-auto mt-3 max-w-[45ch] text-sm text-akg-muted">
              Pick an Expert Advisor license or watch live setups inside the web terminal.
            </p>

            <div className="relative z-10 mt-8 flex flex-wrap items-center justify-center gap-3">
              <Button size="lg" variant="default" onClick={() => onNavigate('pricing')}>
                <span>Get Access</span>
              </Button>
              <Button size="lg" variant="outline" onClick={() => onNavigate('signals')}>
                <span>View Live Signals</span>
              </Button>
            </div>
          </div>
        </Reveal>
      </section>
    </div>
  );
}

/* ============================================================
   MEMBERSHIP GAINS — pill tabs, check list + live panel
============================================================ */
const GAINS = [
  {
    id: 'bots',
    tab: 'Automated bots',
    title: 'Bots that run the rules for you',
    checks: [
      'Rule-based entries with a hard stop-loss on every trade',
      'Your license is bound to your MT4/MT5 account number',
      'Works on any broker — no platform lock-in',
      'Free updates for the life of the release',
    ],
  },
  {
    id: 'signals',
    tab: 'Signal desk',
    title: 'Signals with the full setup inside',
    checks: [
      'Standard and VIP desks, delivered while setups are live',
      'Entry, stop-loss, and take-profit included with every alert',
      'Browser alerts the moment a signal fires',
      'A 30-day archive you can reread anytime',
    ],
  },
  {
    id: 'care',
    tab: 'Desk care',
    title: 'Real people behind the systems',
    checks: [
      'Priority support over Telegram and email',
      'Short briefings whenever market conditions shift',
      'A track record built from real closed signals',
      'Setup guide and step-by-step activation for each bot',
      'One-time prices — no automatic rebilling',
    ],
  },
];

function Achievements({ previews, briefings, onNavigate }) {
  const [tab, setTab] = useState(GAINS[0].id);
  const active = GAINS.find((g) => g.id === tab);

  return (
    <div>
      <div className="mt-8 flex gap-1.5 overflow-x-auto rounded-full border border-white/10 bg-akg-surface p-1.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mt-10">
        {GAINS.map((g) => (
          <button
            key={g.id}
            onClick={() => setTab(g.id)}
            className={`flex-1 whitespace-nowrap rounded-full px-4 py-2 text-[13px] font-semibold transition-all cursor-pointer ${
              tab === g.id
                ? 'bg-[#EDEFF7] text-[#07090D] shadow-sm'
                : 'text-akg-muted hover:text-white'
            }`}
          >
            {g.tab}
          </button>
        ))}
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[0.45fr_0.55fr] sm:mt-10">
        <div>
          <h3 className="font-display text-2xl font-extrabold leading-tight text-white sm:text-[1.7rem]">
            {active.title}
          </h3>
          <ul className="mt-6 space-y-4">
            {active.checks.map((c) => (
              <li key={c} className="flex items-start gap-3">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-akg-green/10 ring-1 ring-akg-green/30">
                  <Check className="h-3.5 w-3.5 text-akg-green" strokeWidth={3} />
                </span>
                <span className="text-sm leading-relaxed text-akg-silver">{c}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-[#F3C653]/20 bg-[#0A0D13] p-4 sm:p-5">
          {tab === 'bots' && (
            <div>
              <div className="flex items-center justify-between border-b border-white/[0.07] px-2 pb-3">
                <span className="font-data text-[10px] uppercase tracking-[0.16em] text-akg-silver">
                  Equity monitor
                </span>
                <TrendingUp className="h-4 w-4 text-akg-green" />
              </div>
              <div className="px-2 pt-4">
                <EquityCurve seed="membership" points={100} className="h-40 w-full sm:h-44" />
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2 px-2 pb-1">
                {['Hard stop-loss', 'MT4 & MT5', 'License bound'].map((t) => (
                  <div
                    key={t}
                    className="rounded-lg border border-dashed border-white/10 px-2 py-2 text-center font-data text-[9px] uppercase tracking-wide text-akg-muted"
                  >
                    {t}
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'signals' && (
            <div>
              <div className="flex items-center justify-between border-b border-white/[0.07] px-2 pb-3">
                <span className="flex items-center gap-2 font-data text-[10px] uppercase tracking-[0.16em] text-akg-silver">
                  <span className="live-dot" />
                  Live feed
                </span>
                <BellRing className="h-4 w-4 text-akg-green" />
              </div>
              <div className="divide-y divide-white/[0.05]">
                {(previews.length ? previews.slice(0, 5) : [
                  { symbol: '—', direction: 'BUY', pnl: '', plan_tier: '' },
                  { symbol: '—', direction: 'SELL', pnl: '', plan_tier: '' },
                  { symbol: '—', direction: 'BUY', pnl: '', plan_tier: '' },
                ]).map((s, i) => {
                  const down = String(s.pnl || '').trim().startsWith('-');
                  const placeholder = !s.pnl && !previews.length;
                  return (
                    <div key={i} className={`flex items-center justify-between gap-3 py-3 ${i === 0 ? 'pt-3.5' : ''}`}>
                      <span className="font-data text-sm font-semibold text-white">{s.symbol}</span>
                      <span
                        className={`rounded px-1.5 py-0.5 font-data text-[10px] font-bold ${
                          placeholder
                            ? 'bg-white/5 text-akg-muted'
                            : s.direction === 'BUY'
                              ? 'bg-akg-green/15 text-akg-green'
                              : 'bg-rose-500/15 text-rose-400'
                        }`}
                      >
                        {s.direction}
                      </span>
                      <span className={`font-data text-xs font-semibold ${placeholder ? 'text-akg-muted' : down ? 'text-rose-400' : 'text-akg-green'}`}>
                        {s.pnl || 'members see full coords'}
                      </span>
                    </div>
                  );
                })}
              </div>
              <p className="mt-3 px-2 font-data text-[10px] text-akg-muted">
                Entry, SL & TP visible to members only.
              </p>
            </div>
          )}

          {tab === 'care' && (
            <div>
              <div className="flex items-center justify-between border-b border-white/[0.07] px-2 pb-3">
                <span className="font-data text-[10px] uppercase tracking-[0.16em] text-akg-silver">
                  From the desk
                </span>
                <Headphones className="h-4 w-4 text-akg-gold" />
              </div>
              {briefings.length ? (
                briefings.slice(0, 3).map((b) => (
                  <div key={b.id} className="border-b border-white/[0.05] px-2 py-3.5 last:border-b-0">
                    <h4 className="text-[13px] font-bold text-white">{b.title}</h4>
                    <p className="mt-1 line-clamp-1 text-[11px] text-akg-muted">{b.body}</p>
                  </div>
                ))
              ) : (
                <p className="px-2 py-6 text-center text-[11px] text-akg-muted">
                  Desk briefings appear here as the team posts them.
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Button variant="default" onClick={() => onNavigate('pricing')}>
          <span>See Plans &amp; Pricing</span>
        </Button>
        <Button variant="outline" onClick={() => onNavigate('bots')}>
          <span>Browse the Bots</span>
        </Button>
      </div>
    </div>
  );
}

/* ============================================================
   DESK TOOLKIT — text-tab switcher over tool cards
============================================================ */
const TOOLS = [
  {
    id: 'market',
    tab: 'Charts & news',
    prefix: 'Markets, on your dashboard',
    cards: [
      {
        icon: LineChart,
        title: 'TradingView charts',
        body: 'Live chart module for any symbol you watch, right inside the site.',
      },
      {
        icon: Newspaper,
        title: 'Forex Factory calendar',
        body: 'Know when the red-folder releases hit, before your bot meets them.',
      },
      {
        icon: FileText,
        title: 'Latest news posts',
        body: 'Market notes the desk considers relevant to current signal cycles.',
      },
    ],
  },
  {
    id: 'record',
    tab: 'Track record',
    prefix: 'Numbers you can check yourself',
    cards: [
      {
        icon: Database,
        title: 'Closed-signal aggregates',
        body: 'Monthly win rate and net pips computed only from signals the desk marked closed.',
      },
      {
        icon: Activity,
        title: 'Per-month breakdown',
        body: 'Each month listed separately — you read the record, not a highlight reel.',
      },
      {
        icon: BellRing,
        title: 'Desk briefings',
        body: 'Notes when volatility or risk sizing changes, posted as conditions change.',
      },
    ],
  },
  {
    id: 'connector',
    tab: 'Managed accounts',
    prefix: 'For hands-off members',
    cards: [
      {
        icon: KeyRound,
        title: 'Connector demo request',
        body: 'Submit your account number, server, and delegation details for a free demo setup.',
      },
      {
        icon: ShieldCheck,
        title: 'Admin-reviewed intake',
        body: 'The desk reviews every request manually before anything is configured.',
      },
      {
        icon: Lock,
        title: 'Demo scope only',
        body: 'The Connector is a demonstration bridge. It never places live orders.',
      },
    ],
  },
];

function Toolkit() {
  const [tab, setTab] = useState(TOOLS[0].id);
  const active = TOOLS.find((t) => t.id === tab);

  return (
    <div>
      <div className="mt-6 flex gap-1.5 overflow-x-auto rounded-full border border-white/10 bg-white/[0.03] p-1.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {TOOLS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 whitespace-nowrap rounded-full px-4 py-2 text-[13px] font-semibold transition-all cursor-pointer ${
              tab === t.id
                ? 'bg-[#EDEFF7] text-[#07090D] shadow-sm'
                : 'text-akg-muted hover:text-white'
            }`}
          >
            {t.tab}
          </button>
        ))}
      </div>

      <p className="mt-5 text-center text-sm text-akg-muted">{active.prefix}</p>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {active.cards.map(({ icon: Icon, title, body }) => (
          <div
            key={title}
            className="flex flex-col rounded-2xl border border-white/10 bg-[#0A0D13] p-5 text-center transition-colors hover:border-[#F3C653]/25"
          >
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-akg-gold/10 ring-1 ring-akg-gold/25">
              <Icon className="h-4.5 w-4.5 text-akg-gold" strokeWidth={1.75} />
            </div>
            <h3 className="mt-3.5 font-display text-[15px] font-bold text-white">{title}</h3>
            <p className="mt-2 text-xs leading-relaxed text-akg-muted">{body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
