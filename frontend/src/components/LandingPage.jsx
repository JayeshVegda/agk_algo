import React, { useState, useEffect } from 'react';
import { pb, pbUrl } from '../lib/pocketbase';
import { pairsOf, pctStat, statNumOrNull } from '../lib/bots';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import {
  Cpu, Zap, ArrowRight, Check, ShieldCheck,
  Terminal, TrendingUp, TrendingDown, Lock, Activity, Wallet, KeyRound,
  Coins, Bitcoin, ArrowLeftRight, ChevronLeft, ChevronRight, LineChart,
  BellRing, FileText, Database, Headphones, Newspaper,
  Target, Sparkles, RefreshCw, Sliders, Globe, Layers, ArrowUpRight,
  Command
} from 'lucide-react';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from './ui/Accordion';
import Reveal, { RevealGroup, RevealItem } from './motion/Reveal';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import CountUp from './motion/CountUp';
import EquityCurve from './EquityCurve';
import { useSiteSettings } from '../lib/wallets';
import { SpotlightCard } from './ui/SpotlightCard';
import FluidCursorCanvas from './ui/FluidCursorCanvas';

const botSlug = (name) =>
  String(name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const hasStats = (bot) => Boolean(bot?.win_rate || bot?.profit_factor || bot?.drawdown);

const botCategory = (bot) => {
  const s = `${pairsOf(bot).join(' ')} ${bot?.strategy_type || ''}`.toLowerCase();
  if (s.includes('gold') || s.includes('xau')) return { label: 'Gold', icon: Coins };
  if (s.includes('btc') || s.includes('crypto') || s.includes('eth') || s.includes('sol')) return { label: 'Crypto', icon: Bitcoin };
  if (/us30|nas100|us500|dax40|indices|x\.?1/.test(s)) return { label: 'Indices', icon: ArrowLeftRight };
  return { label: 'Forex', icon: LineChart };
};

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
    price: 399, version: 'v4.0',
    description: 'Sub-minute spread-capture model for tight liquid markets with spread protection.',
    features: 'Spread-protection filter, Sub-minute execution, Fixed-risk compounding, Recommended deposit: $2,000+',
    image_url: '',
  },
  {
    id: 'institutional-trend', name: 'AKG Institutional Trend', platform: 'MT5', pairs: 'Forex Majors',
    price: 449, version: 'v1.9',
    description: 'Order-block mitigation strategy aligned with central bank flow and interbank liquidity.',
    features: 'Order-block detection, Breakeven trailing algorithm, Low drawdown curve, Recommended deposit: $1,500+',
    image_url: '',
  },
];

const FAQS = [
  {
    q: 'What is AKG ALGO and how does the desk work?',
    a: 'AKG ALGO builds rule-based Expert Advisors for MetaTrader 4 and 5, and runs a live execution room where the desk broadcasts entries, stop-losses, and profit targets while setups are forming. All signals carry hard stop-loss coordinates.',
  },
  {
    q: 'How does Expert Advisor licensing and delivery work?',
    a: 'Every EA purchase is a one-time payment. Once confirmed, you receive an instant download link and a unique license key. On first launch inside MetaTrader, the EA silently binds itself to your account number with no manual account configuration required beforehand.',
  },
  {
    q: 'Can I run these bots on any broker or prop firm?',
    a: 'Yes. Every EA is built to run on standard MT4 or MT5 terminals across any regulated broker. They are also compatible with prop firm challenges that allow algorithmic trading.',
  },
  {
    q: 'What payment methods do you accept?',
    a: 'We accept USDT across TRC-20, BEP-20, and ERC-20 networks for global members, and instant UPI / GPay for Indian traders at the live conversion rate.',
  },
  {
    q: 'Can I get a refund if the bot is not for me?',
    a: 'Digital software licenses cannot be uninstalled once delivered. To protect both parties, we provide full verified performance metrics, live account drawdowns, and a 3-day test trial before you purchase.',
  },
];

const PLANS = [
  {
    id: 'standard',
    name: 'Standard Signal Room',
    price: 99,
    tier: 'Tier 1',
    vip: false,
    blurb: 'Complete setups on major forex pairs and indices, broadcast with clear entry and stop levels.',
    features: [
      'Forex majors and indices coverage',
      'Hard stop-loss on every broadcast',
      'Desk commentary and session updates',
      'Web broadcast room with live alerts',
      '30-day manual renewal, no auto-billing',
    ],
  },
  {
    id: 'vip',
    name: 'VIP Executive Room',
    price: 199,
    tier: 'Tier 2',
    vip: true,
    blurb: 'Gold (XAUUSD) liquidity sweeps, high-volatility session updates, and direct desk priority.',
    features: [
      'Everything in Standard',
      'Exclusive Gold (XAUUSD) trade setups',
      'Desk directives before red-folder news',
      'Priority execution channel',
      'Direct Telegram & email support access',
    ],
  },
];



function HeroHeadline({ botCount = 8 }) {
  return (
    <div className="relative z-10 mx-auto max-w-4xl px-4 sm:px-6 text-center select-none py-2">
      <Reveal>
        <div className="inline-flex items-center gap-2 rounded-full border border-akg-hairline bg-akg-card/90 px-3.5 py-1.5 text-xs font-medium text-akg-text shadow-xs backdrop-blur-sm">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-semibold text-akg-text">{botCount} robots</span>
          <span className="text-akg-muted/40">·</span>
          <span className="text-akg-muted">34 on our accounts</span>
        </div>
      </Reveal>

      <Reveal delay={0.06}>
        <h1 className="mt-6 font-display text-4xl sm:text-6xl font-extrabold tracking-tight leading-[1.08]">
          <span className="text-akg-text">Forex Trading Robots &amp; Expert Advisors,</span>
          <br />
          <span className="text-slate-400 dark:text-slate-400 font-bold">with what they did on our accounts.</span>
        </h1>
      </Reveal>

      <Reveal delay={0.1}>
        <p className="mt-4 max-w-2xl mx-auto text-base sm:text-lg text-akg-muted leading-relaxed">
          Every forex trading robot we list runs on real accounts of our own, so you can see the real drawdown next to the gain before you buy.
        </p>
      </Reveal>
    </div>
  );
}

export function LandingPage({ onNavigate, onOpenAuth, notify }) {
  const [bots, setBots] = useState(FALLBACK_BOTS);
  const [botCount, setBotCount] = useState(FALLBACK_BOTS.length);
  const [briefings, setBriefings] = useState([]);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const settings = useSiteSettings();

  const [botsAutoplay] = useState(() => Autoplay({ delay: 3800, stopOnInteraction: false }));
  const [botsEmblaRef, botsEmbla] = useEmblaCarousel(
    { loop: true, align: 'start', duration: 26 },
    [botsAutoplay]
  );
  const [botsSel, setBotsSel] = useState(0);
  const [botsSnaps, setBotsSnaps] = useState(0);
  const [chartFailed, setChartFailed] = useState({});
  const [botsHover, setBotsHover] = useState(false);
  const reduceMotionRef = React.useRef(false);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (!botsEmbla) return undefined;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const settle = (reduced) => {
      try {
        if (reduced) {
          botsAutoplay.stop();
        } else {
          botsAutoplay.play();
        }
      } catch {
        setTimeout(() => {
          try { reduced ? botsAutoplay.stop() : botsAutoplay.play(); } catch { /* ignore */ }
        }, 60);
      }
    };
    const apply = (reduced) => {
      reduceMotionRef.current = reduced;
      settle(reduced);
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
      settle(true);
    };
  }, [botsEmbla, botsAutoplay]);

  const scrollBots = (dir) => {
    if (!botsEmbla) return;
    if (dir < 0) botsEmbla.scrollPrev();
    else botsEmbla.scrollNext();
  };

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
        /* fallback data */
      }
      try {
        const brRes = await pb.collection('broadcasts').getList(1, 3, { sort: '-created' });
        if (!cancelled) setBriefings(brRes.items);
      } catch {
        /* absent */
      }
    };

    load();

    const unsubBots = pb.collection('bots').subscribe('*', () => load()).catch(() => {});
    const unsubBrief = pb.collection('broadcasts').subscribe('*', () => load()).catch(() => {});

    return () => {
      cancelled = true;
      unsubBots.then((unsub) => unsub && unsub()).catch(() => {});
      unsubBrief.then((unsub) => unsub && unsub()).catch(() => {});
    };
  }, []);

  return (
    <div className="font-sans text-akg-text w-full -mt-6">
      {settings?.landing_announcement && !bannerDismissed && (
        <div className="-mt-2 mb-4 flex items-center justify-between gap-3 rounded-xl border border-akg-hairline bg-akg-surface px-4 py-2.5">
          <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">{settings.landing_announcement}</p>
          <button onClick={() => setBannerDismissed(true)} className="shrink-0 text-xs text-akg-muted hover:text-akg-text cursor-pointer" aria-label="Dismiss">✕</button>
        </div>
      )}

      {/* ============================================================
          1. HERO - Minimal, Confident, Direct with Fluid WebGL Cursor
      ============================================================ */}
      <section className="relative overflow-hidden pt-10 pb-16 sm:pt-16 sm:pb-24 bg-tech-grid">
        <FluidCursorCanvas palette={['#10b981', '#06b6d4', '#34d399']} />

        <div className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 h-[380px] w-[800px] rounded-full bg-gradient-to-b from-emerald-500/10 via-teal-500/10 to-transparent blur-3xl z-0" />

        <HeroHeadline botCount={botCount} />

        <div className="relative z-10 mx-auto max-w-4xl px-4 sm:px-6 text-center">
          <Reveal delay={0.14}>
            <div className="mt-8 flex flex-col items-center justify-center">
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5">
                <button
                  onClick={() => onNavigate('bots')}
                  className="btn-cyan-emerald flex items-center justify-center gap-2 rounded-xl px-7 py-3.5 text-sm font-semibold active:scale-[0.98] cursor-pointer shadow-md"
                >
                  <span>Browse forex trading robots</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
                <button
                  onClick={() => onNavigate('signals')}
                  className="flex items-center justify-center gap-2 rounded-xl border border-akg-hairline bg-akg-card px-6 py-3.5 text-sm font-semibold text-akg-text hover:border-emerald-500/40 hover:text-emerald-500 transition-all cursor-pointer card-depth"
                >
                  <Terminal className="h-4 w-4 text-emerald-500" />
                  <span>Signal Room</span>
                </button>
              </div>

              {/* Breadcrumb matching Image 0 */}
              <div className="mt-6 text-xs text-akg-muted flex items-center gap-2 font-medium">
                <span className="hover:text-akg-text cursor-pointer transition-colors" onClick={() => onNavigate('home')}>Home</span>
                <span className="text-akg-muted/40">/</span>
                <span className="hover:text-akg-text cursor-pointer transition-colors" onClick={() => onNavigate('bots')}>Trading robots</span>
                <span className="text-akg-muted/40">/</span>
                <span className="text-akg-text font-semibold">Forex Trading Robots</span>
              </div>
            </div>
          </Reveal>

          {/* Minimal 4-Metric Strip with tactile unified card matching reference Image 0 */}
          <Reveal delay={0.18}>
            <div className="mt-10 rounded-2xl border border-akg-hairline bg-akg-card/90 backdrop-blur-md shadow-sm overflow-hidden text-left">
              <div className="grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-akg-hairline">
                <div className="p-5 sm:p-6 flex flex-col justify-between">
                  <div className="text-xs font-medium text-akg-muted">Robots</div>
                  <div className="mt-2 font-mono text-3xl sm:text-4xl font-extrabold text-akg-text"><CountUp value={botCount} /></div>
                  <div className="mt-1.5 text-[11px] text-akg-muted font-medium">2 free</div>
                </div>
                <div className="p-5 sm:p-6 flex flex-col justify-between">
                  <div className="text-xs font-medium text-akg-muted">On our own accounts</div>
                  <div className="mt-2 font-mono text-3xl sm:text-4xl font-extrabold text-emerald-600 dark:text-emerald-400"><CountUp value={33} /></div>
                  <div className="mt-1.5 text-[11px] text-emerald-600/80 dark:text-emerald-400/80 font-medium">Live verified</div>
                </div>
                <div className="p-5 sm:p-6 flex flex-col justify-between">
                  <div className="text-xs font-medium text-akg-muted">Drawdown published</div>
                  <div className="mt-2 font-mono text-3xl sm:text-4xl font-extrabold text-akg-text"><CountUp value={36} /></div>
                  <div className="mt-1.5 text-[11px] text-akg-muted font-medium">Max peak-to-valley</div>
                </div>
                <div className="p-5 sm:p-6 flex flex-col justify-between">
                  <div className="text-xs font-medium text-akg-muted">Symbols traded</div>
                  <div className="mt-2 font-mono text-3xl sm:text-4xl font-extrabold text-sky-600 dark:text-sky-400"><CountUp value={37} /></div>
                  <div className="mt-1.5 text-[11px] text-sky-600/80 dark:text-sky-400/80 font-medium">Forex, Gold &amp; Indices</div>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ============================================================
          2. WHAT MAKES AKG ALGO UNIQUE - 5 Signature Pillars (Image 1)
      ============================================================ */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:py-24 border-b border-akg-hairline">
        <div className="text-center max-w-2xl mx-auto">
          <Reveal>
            <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-akg-text tracking-tight">
              What makes AKG ALGO unique?
            </h2>
            <p className="mt-3 text-sm sm:text-base text-akg-muted leading-relaxed">
              Understand the product before creating your bot
            </p>
          </Reveal>
        </div>

        {/* Row 1: 3 Equal Width Cards */}
        <RevealGroup className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3" stagger={0.08}>
          {/* Card 1 */}
          <RevealItem>
            <div className="card-depth h-full rounded-2xl border border-akg-hairline bg-akg-card p-6 sm:p-7 flex flex-col justify-between hover:border-emerald-500/40 hover:-translate-y-1 transition-all">
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                  <Check className="h-5 w-5" strokeWidth={2.5} />
                </div>
                <div>
                  <h3 className="font-display text-base sm:text-lg font-bold text-akg-text">Proven Strategies</h3>
                  <p className="mt-2 text-xs sm:text-[13px] leading-relaxed text-akg-muted">
                    Access 10+ trusted entry strategies, tested by traders worldwide, to give you a reliable foundation for trading.
                  </p>
                </div>
              </div>
            </div>
          </RevealItem>

          {/* Card 2 */}
          <RevealItem>
            <div className="card-depth h-full rounded-2xl border border-akg-hairline bg-akg-card p-6 sm:p-7 flex flex-col justify-between hover:border-emerald-500/40 hover:-translate-y-1 transition-all">
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                  <Command className="h-5 w-5" strokeWidth={2.2} />
                </div>
                <div>
                  <h3 className="font-display text-base sm:text-lg font-bold text-akg-text">Live Tracking Record</h3>
                  <p className="mt-2 text-xs sm:text-[13px] leading-relaxed text-akg-muted">
                    Traders can track the full history of each strategy on MyFxBook including drawdown, win rate, etc.
                  </p>
                </div>
              </div>
            </div>
          </RevealItem>

          {/* Card 3 */}
          <RevealItem>
            <div className="card-depth h-full rounded-2xl border border-akg-hairline bg-akg-card p-6 sm:p-7 flex flex-col justify-between hover:border-emerald-500/40 hover:-translate-y-1 transition-all">
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                  <Target className="h-5 w-5" strokeWidth={2.2} />
                </div>
                <div>
                  <h3 className="font-display text-base sm:text-lg font-bold text-akg-text">All Markets Covered</h3>
                  <p className="mt-2 text-xs sm:text-[13px] leading-relaxed text-akg-muted">
                    Trade across every major financial market including forex, crypto, gold, and indices through one powerful platform.
                  </p>
                </div>
              </div>
            </div>
          </RevealItem>
        </RevealGroup>

        {/* Row 2: 2 Centered Cards (Identical Width to Row 1) */}
        <div className="mt-6 flex flex-col md:flex-row justify-center gap-6">
          {/* Card 4 */}
          <div className="w-full md:w-[calc(33.333%-16px)] card-depth rounded-2xl border border-akg-hairline bg-akg-card p-6 sm:p-7 flex flex-col justify-between hover:border-emerald-500/40 hover:-translate-y-1 transition-all">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/15 font-bold font-mono text-sm text-emerald-600 dark:text-emerald-400">
                AI
              </div>
              <div>
                <h3 className="font-display text-base sm:text-lg font-bold text-akg-text">AI-Powered Decisions</h3>
                <p className="mt-2 text-xs sm:text-[13px] leading-relaxed text-akg-muted">
                  Get AI-powered insights that combine real-time sentiment, market news, and historical data for smarter trading.
                </p>
              </div>
            </div>
          </div>

          {/* Card 5 */}
          <div className="w-full md:w-[calc(33.333%-16px)] card-depth rounded-2xl border border-akg-hairline bg-akg-card p-6 sm:p-7 flex flex-col justify-between hover:border-emerald-500/40 hover:-translate-y-1 transition-all">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                <RefreshCw className="h-5 w-5" strokeWidth={2.2} />
              </div>
              <div>
                <h3 className="font-display text-base sm:text-lg font-bold text-akg-text">Fully Automated Trading</h3>
                <p className="mt-2 text-xs sm:text-[13px] leading-relaxed text-akg-muted">
                  Automate the entire process by scanning markets, analyzing opportunities, and executing trades with precision, hands-free.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
          3. HOW IT WORKS - 3 Easy Steps with Visual Mockups (Image 2)
      ============================================================ */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:py-24 border-b border-akg-hairline">
        <div className="text-center max-w-xl mx-auto">
          <Reveal>
            <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-akg-text tracking-tight">
              Get started in 3 easy steps
            </h2>
            <p className="mt-3 text-sm sm:text-base text-akg-muted leading-relaxed">
              A clearer path from create to install and automate your trading
            </p>
          </Reveal>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {/* Step 1 */}
          <div className="group rounded-[28px] border border-emerald-900/5 dark:border-white/[0.08] bg-[#EEF7F2] dark:bg-[#0C1619] p-6 sm:p-7 flex flex-col justify-between overflow-hidden relative shadow-xs hover:shadow-md transition-all">
            <div>
              <div className="inline-flex items-center rounded-full bg-emerald-500/15 px-3 py-1 font-mono text-[10px] font-bold text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                STEP 01
              </div>
              <h3 className="mt-4 font-display text-xl sm:text-2xl font-bold text-akg-text">
                1. Build Your Trading Bot
              </h3>
              <p className="mt-2 text-xs sm:text-[13px] leading-relaxed text-akg-muted">
                Select your market, choose a trusted strategy, customise the settings and download the compiled MT4 or MT5 version
              </p>

              <button
                onClick={() => onNavigate('bots')}
                className="mt-5 inline-flex items-center gap-1.5 rounded-xl bg-[#009A60] hover:bg-[#008352] px-4 py-2 text-xs font-semibold text-white shadow-xs transition-colors cursor-pointer"
              >
                <span>Start free to build</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Visual: Isometric Floating Market Selector Tokens */}
            <div className="mt-8 pt-6 relative flex flex-col items-center justify-center min-h-[170px]">
              <div className="relative w-full max-w-[240px] h-[120px]">
                {/* Top BTC */}
                <div className="absolute top-0 right-8 rounded-xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-slate-800 px-3 py-1 text-xs font-bold text-amber-500 shadow-xs">
                  BTC
                </div>
                {/* Left AU */}
                <div className="absolute top-7 left-2 rounded-xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-slate-800 px-3 py-1 text-xs font-bold text-amber-600 shadow-xs">
                  AU
                </div>
                {/* Center Highlighted AI */}
                <div className="absolute top-3 left-1/2 -translate-x-1/2 rounded-xl bg-[#056847] px-4 py-2 text-sm font-bold text-white shadow-md ring-4 ring-emerald-500/20">
                  AI
                </div>
                {/* Right EQ */}
                <div className="absolute top-9 right-0 rounded-xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-slate-800 px-3 py-1 text-xs font-bold text-slate-600 dark:text-slate-300 shadow-xs">
                  EQ
                </div>
                {/* Bottom Selected market badge */}
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border border-slate-200/80 dark:border-white/10 bg-white dark:bg-slate-800 px-3.5 py-1 text-[11px] font-medium text-slate-700 dark:text-slate-200 shadow-xs flex items-center gap-1.5">
                  <span>Selected market</span>
                  <Check className="h-3 w-3 text-emerald-500" strokeWidth={3} />
                </div>
              </div>
            </div>
          </div>

          {/* Step 2 */}
          <div className="group rounded-[28px] border border-emerald-900/5 dark:border-white/[0.08] bg-[#EEF7F2] dark:bg-[#0C1619] p-6 sm:p-7 flex flex-col justify-between overflow-hidden relative shadow-xs hover:shadow-md transition-all">
            <div>
              <div className="inline-flex items-center rounded-full bg-emerald-500/15 px-3 py-1 font-mono text-[10px] font-bold text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                STEP 02
              </div>
              <h3 className="mt-4 font-display text-xl sm:text-2xl font-bold text-akg-text">
                2. Connect Your Trading Account
              </h3>
              <p className="mt-2 text-xs sm:text-[13px] leading-relaxed text-akg-muted">
                Copy the bot into MetaTrader, connect a compatible account and test the setup on demo first
              </p>
            </div>

            {/* Visual: Layered Stacked Config Cards */}
            <div className="mt-8 pt-6 relative min-h-[170px] flex items-end justify-center">
              <div className="w-full space-y-[-14px]">
                {/* Layer 3 (Back) */}
                <div className="mx-4 rounded-xl border border-slate-200/60 dark:border-white/5 bg-white/60 dark:bg-slate-800/60 p-2.5 flex items-center justify-between text-xs opacity-50 shadow-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] font-bold text-slate-400">03</span>
                    <div>
                      <div className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">Risk settings</div>
                      <div className="text-[9px] text-slate-400">Review before building</div>
                    </div>
                  </div>
                </div>

                {/* Layer 2 (Middle) */}
                <div className="mx-2 rounded-xl border border-slate-200/70 dark:border-white/10 bg-white/80 dark:bg-slate-800/80 p-2.5 flex items-center justify-between text-xs opacity-80 shadow-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] font-bold text-emerald-600 dark:text-emerald-400">02</span>
                    <div>
                      <div className="text-[11px] font-semibold text-slate-800 dark:text-white">Platform &amp; account</div>
                      <div className="text-[9px] text-slate-400">MT4 / MT5 connection</div>
                    </div>
                  </div>
                </div>

                {/* Layer 1 (Front, prominent) */}
                <div className="relative z-10 rounded-xl border border-slate-200 dark:border-white/15 bg-white dark:bg-slate-800 p-3 flex items-center justify-between text-xs shadow-md">
                  <div className="flex items-center gap-2.5">
                    <div className="h-7 w-7 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono font-bold text-xs flex items-center justify-center">
                      01
                    </div>
                    <div>
                      <div className="font-bold text-[11px] text-slate-900 dark:text-white">Multi-Level Strategy</div>
                      <div className="text-[9px] text-slate-500 dark:text-slate-400">Configure, test and refine</div>
                    </div>
                  </div>
                  <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 font-mono text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                    Ready
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Step 3 */}
          <div className="group rounded-[28px] border border-emerald-900/5 dark:border-white/[0.08] bg-[#EEF7F2] dark:bg-[#0C1619] p-6 sm:p-7 flex flex-col justify-between overflow-hidden relative shadow-xs hover:shadow-md transition-all">
            <div>
              <div className="inline-flex items-center rounded-full bg-emerald-500/15 px-3 py-1 font-mono text-[10px] font-bold text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                STEP 03
              </div>
              <h3 className="mt-4 font-display text-xl sm:text-2xl font-bold text-akg-text">
                3. Start Automated Trading
              </h3>
              <p className="mt-2 text-xs sm:text-[13px] leading-relaxed text-akg-muted">
                Turn on your algotrading, then monitor trading behaviour, platform connectivity and account risk
              </p>
            </div>

            {/* Visual: Live Automated Trades Desk */}
            <div className="mt-8 pt-6 relative min-h-[170px] flex items-end">
              <div className="w-full rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-slate-800 p-3.5 shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-2.5">
                  <span className="font-display text-[11px] font-bold text-slate-900 dark:text-white">Automated trades</span>
                  <span className="flex items-center gap-1 font-mono text-[9px] font-bold text-emerald-600 dark:text-emerald-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Live monitoring
                  </span>
                </div>
                <div className="mt-2.5 space-y-2">
                  <div className="flex items-center justify-between rounded-lg bg-slate-50 dark:bg-slate-900/60 p-2 border border-slate-100 dark:border-white/5">
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-mono text-[9px] font-bold flex items-center justify-center">
                        AU
                      </div>
                      <div>
                        <div className="font-bold text-[11px] text-slate-900 dark:text-white">XAU / USD</div>
                        <div className="text-[9px] text-slate-400">Gold · Trend</div>
                      </div>
                    </div>
                    <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 font-mono text-[10px] font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      Running
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-slate-50 dark:bg-slate-900/60 p-2 border border-slate-100 dark:border-white/5">
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 rounded-full bg-sky-500/10 text-sky-700 dark:text-sky-300 font-mono text-[9px] font-bold flex items-center justify-center">
                        FX
                      </div>
                      <div>
                        <div className="font-bold text-[11px] text-slate-900 dark:text-white">EUR / USD</div>
                        <div className="text-[9px] text-slate-400">Forex · Multi-Level</div>
                      </div>
                    </div>
                    <span className="rounded-full bg-slate-200/60 dark:bg-slate-700/60 px-2 py-0.5 font-mono text-[10px] font-bold text-slate-600 dark:text-slate-300">
                      Watching
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
          4. BOTS SHOWCASE - snap carousel, one card per bot
      ============================================================ */}
      <section className="relative mx-auto max-w-7xl px-4 py-14 sm:py-20">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <Reveal>
            <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              EA catalog
            </span>
            <h2 className="mt-2.5 font-display text-3xl font-extrabold leading-[1.12] tracking-tight text-akg-text sm:text-4xl">
              Buy once, own it for good.
            </h2>
            <p className="mt-3 max-w-[60ch] text-sm text-akg-muted sm:text-[15px]">
              Compare win rate, drawdown, and strategy type, then pick the bot that fits your market. Licenses bind to your MetaTrader account automatically on first launch.
            </p>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="hidden sm:flex items-center gap-2.5">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => scrollBots(-1)}
                aria-label="Previous bots"
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-akg-hairline bg-akg-card text-akg-text hover:border-emerald-500/50 hover:text-emerald-500 cursor-pointer transition-colors shadow-sm"
              >
                <ChevronLeft className="h-4.5 w-4.5" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => scrollBots(1)}
                aria-label="Next bots"
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-akg-hairline bg-akg-card text-akg-text hover:border-emerald-500/50 hover:text-emerald-500 cursor-pointer transition-colors shadow-sm"
              >
                <ChevronRight className="h-4.5 w-4.5" />
              </motion.button>
            </div>
          </Reveal>
        </div>

        <Reveal delay={0.08} y={36}>
          <div
            className="-mx-4 mt-9"
            onMouseEnter={() => setBotsHover(true)}
            onMouseLeave={() => setBotsHover(false)}
          >
            <div className="overflow-hidden py-2" ref={botsEmblaRef}>
              <div className="flex">
                {bots.map((bot) => {
                  const cat = botCategory(bot);
                  const CatIcon = cat.icon;
                  const img = pbUrl((bot.image_url || '').trim());
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
                        className="card-depth group flex h-full flex-col overflow-hidden rounded-2xl border border-akg-hairline bg-akg-card hover:border-emerald-500/40 transition-all cursor-pointer"
                        onClick={() => onNavigate('bots', botSlug(bot.name))}
                      >
                        {/* Media */}
                        <div className="relative shrink-0 overflow-hidden bg-akg-surfaceElevated">
                          {showChart ? (
                            <img
                              src={chartSrc}
                              alt={bot.name}
                              className="h-40 w-full object-cover transition-transform duration-500 group-hover:scale-105"
                              loading="lazy"
                              onError={() => setChartFailed((prev) => ({ ...prev, [bot.id]: true }))}
                            />
                          ) : (
                            <div className="flex h-40 w-full flex-col items-center justify-center p-4 text-center">
                              <CatIcon className="h-8 w-8 text-akg-muted/60" strokeWidth={1.5} />
                              <span className="mt-2 font-mono text-[10px] text-akg-muted">{cat.label} EA</span>
                            </div>
                          )}
                          <div className="absolute left-3 top-3 flex items-center gap-1.5">
                            <span className="rounded-md border border-akg-hairline bg-akg-card/90 px-2 py-0.5 font-mono text-[10px] font-bold text-akg-text shadow-sm backdrop-blur-md">
                              {bot.platform || 'MT4 / MT5'}
                            </span>
                            {bot.version && (
                              <span className="rounded-md border border-akg-hairline bg-akg-card/90 px-1.5 py-0.5 font-mono text-[10px] text-akg-muted shadow-sm backdrop-blur-md">
                                {bot.version}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Details */}
                        <div className="flex flex-1 flex-col p-5">
                          <h3 className="font-display text-lg font-bold text-akg-text group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                            {bot.name}
                          </h3>
                          <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-akg-muted">
                            {bot.description}
                          </p>

                          {/* Stats Pill */}
                          {hasStats(bot) && (
                            <div className="mt-4 grid grid-cols-3 gap-2 border-t border-akg-hairline pt-3 font-mono text-center">
                              <div>
                                <div className="text-[10px] text-akg-muted">Win Rate</div>
                                <div className="mt-0.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">{pctStat(bot.win_rate)}</div>
                              </div>
                              <div>
                                <div className="text-[10px] text-akg-muted">Profit Factor</div>
                                <div className="mt-0.5 text-xs font-bold text-akg-text">{statNumOrNull(bot.profit_factor) ?? '-'}</div>
                              </div>
                              <div>
                                <div className="text-[10px] text-akg-muted">Drawdown</div>
                                <div className="mt-0.5 text-xs font-bold text-rose-500">{pctStat(bot.drawdown)}</div>
                              </div>
                            </div>
                          )}

                          {/* Footer / Price */}
                          <div className="mt-auto pt-4 flex items-center justify-between border-t border-akg-hairline">
                            <div>
                              <span className="text-[10px] text-akg-muted">Lifetime license</span>
                              <div className="font-display text-lg font-extrabold text-akg-text">${bot.price || 299} USDT</div>
                            </div>
                            <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 group-hover:translate-x-0.5 transition-transform">
                              Details <ArrowRight className="h-3.5 w-3.5" />
                            </span>
                          </div>
                        </div>
                      </article>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </Reveal>

        <Reveal>
          <div className="mt-8 text-center">
            <button
              onClick={() => onNavigate('bots')}
              className="btn-cyan-emerald inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-bold shadow-md cursor-pointer"
            >
              <span>Browse all {botCount} Expert Advisors</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </Reveal>
      </section>

      {/* ============================================================
          5. SIGNAL PLANS - duo with clean VIP styling
      ============================================================ */}
      <section className="border-y border-akg-hairline bg-akg-card/40">
        <div className="mx-auto max-w-5xl px-4 py-14 sm:py-20">
          <Reveal>
            <div className="text-center">
              <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                Signal plans
              </span>
            </div>
            <h2 className="mt-2.5 text-center font-display text-3xl font-extrabold leading-[1.12] tracking-tight text-akg-text sm:text-4xl">
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
                  className={`card-depth flex h-full flex-col rounded-2xl p-7 bg-akg-card ${
                    plan.vip
                      ? 'border border-emerald-500/40 ring-1 ring-emerald-500/20'
                      : 'border border-akg-hairline'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <Badge variant={plan.vip ? 'emerald' : 'secondary'}>{plan.tier}</Badge>
                    <span className="text-[11px] text-akg-muted">Manual 30-day renewal</span>
                  </div>

                  <h3 className="mt-4 font-display text-xl font-bold text-akg-text">{plan.name}</h3>

                  <div className="mt-3 flex items-baseline gap-1.5">
                    <span className="font-display text-4xl font-extrabold tabular-nums text-akg-text">
                      ${plan.price}
                    </span>
                    <span className="text-xs text-akg-muted">USDT / 30 days</span>
                  </div>

                  <p className="mt-3 text-sm text-akg-muted">{plan.blurb}</p>

                  <ul className="mt-6 space-y-3">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2.5 text-sm text-akg-text">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" strokeWidth={2.5} />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-auto pt-7">
                    <button
                      onClick={() => onNavigate('pricing')}
                      className={`w-full py-3 rounded-xl font-bold text-sm transition-all cursor-pointer ${
                        plan.vip
                          ? 'btn-cyan-emerald'
                          : 'border border-akg-hairline bg-akg-surface hover:bg-akg-surfaceElevated text-akg-text shadow-sm'
                      }`}
                    >
                      Get Access
                    </button>
                  </div>
                </article>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </section>



      {/* ============================================================
          7. LATEST FROM THE DESK - real briefings
      ============================================================ */}
      {briefings.length > 0 && (
        <section className="border-y border-akg-hairline bg-akg-card/30">
          <div className="mx-auto max-w-5xl px-4 py-12 sm:py-20">
            <div className="flex items-end justify-between gap-6">
              <Reveal>
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  From the desk
                </span>
                <h2 className="mt-2.5 font-display text-2xl font-extrabold tracking-tight text-akg-text sm:text-3xl">
                  Latest briefings
                </h2>
                <p className="mt-2 max-w-[55ch] text-sm text-akg-muted">
                  Short desk notes as market conditions change.
                </p>
              </Reveal>
              <Reveal delay={0.1}>
                <button
                  onClick={() => onNavigate('broadcasts')}
                  className="group hidden shrink-0 items-center gap-1.5 text-sm font-semibold text-emerald-600 dark:text-emerald-400 hover:underline sm:inline-flex cursor-pointer"
                >
                  All briefings
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </button>
              </Reveal>
            </div>

            <RevealGroup className="mt-8 overflow-hidden rounded-2xl border border-akg-hairline bg-akg-card shadow-sm" stagger={0.08}>
              {briefings.map((b, i) => (
                <RevealItem key={b.id}>
                  <button
                    onClick={() => onNavigate('broadcasts')}
                    className={`w-full px-6 py-5 text-left transition-colors hover:bg-akg-surfaceElevated cursor-pointer ${i > 0 ? 'border-t border-akg-hairline' : ''}`}
                  >
                    <div className="flex items-baseline justify-between gap-4">
                      <h3 className="font-display text-[15px] font-bold text-akg-text">{b.title}</h3>
                      <span className="shrink-0 font-mono text-[10px] text-akg-muted">
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
          8. FAQ - single column accordion
      ============================================================ */}
      <section className="mx-auto max-w-3xl px-4 pb-14 pt-14 sm:pt-20 sm:pb-20">
        <Reveal>
          <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
            FAQ
          </span>
          <h2 className="mt-2.5 font-display text-2xl font-extrabold tracking-tight text-akg-text sm:text-4xl">
            Frequently asked questions
          </h2>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="card-depth mt-8 rounded-2xl border border-akg-hairline bg-akg-card px-6 py-2 shadow-sm">
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
          9. FINAL CTA - high-impact card
      ============================================================ */}
      <section className="px-4 pb-12">
        <Reveal>
          <div className="card-depth relative overflow-hidden rounded-3xl border border-emerald-500/30 bg-akg-card px-5 py-12 text-center sm:px-6 sm:py-20 shadow-lg">
            <div className="pointer-events-none absolute -top-24 left-1/2 h-64 w-[36rem] -translate-x-1/2 rounded-full bg-gradient-to-r from-sky-400/10 to-emerald-400/15 blur-3xl" />

            <img
              src="/assets/logos/akg-algo-metallic-footer.webp"
              alt="AKG ALGO"
              className="relative z-10 mx-auto h-12 w-auto sm:h-14 opacity-90"
              loading="lazy"
            />

            <h2 className="relative z-10 mt-6 font-display text-2xl font-extrabold tracking-tight text-akg-text sm:text-3xl">
              Your desk is ready when you are.
            </h2>
            <p className="relative z-10 mx-auto mt-3 max-w-[45ch] text-sm text-akg-muted">
              Pick an Expert Advisor license or watch live setups inside the web terminal.
            </p>

            <div className="relative z-10 mt-8 flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={() => onNavigate('pricing')}
                className="btn-cyan-emerald px-7 py-3 rounded-xl font-bold text-sm shadow-md cursor-pointer"
              >
                <span>Get Access</span>
              </button>
              <button
                onClick={() => onNavigate('signals')}
                className="px-6 py-3 rounded-xl border border-akg-hairline bg-akg-surface hover:bg-akg-surfaceElevated font-semibold text-sm text-akg-text shadow-sm cursor-pointer"
              >
                <span>Open Signal Room</span>
              </button>
            </div>
          </div>
        </Reveal>
      </section>
    </div>
  );
}

/* ============================================================
   MEMBERSHIP GAINS
============================================================ */
const GAINS = [
  {
    id: 'bots',
    tab: 'Automated bots',
    title: 'Bots that run the rules for you',
    checks: [
      'Rule-based entries with a hard stop-loss on every trade',
      'Silent binding: your EA locks itself to your account on first launch',
      'Works on any broker, no platform lock-in',
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
      'Live execution broadcasts with transparent member rooms',
      'Setup guide and step-by-step activation for each bot',
      'One-time prices, no automatic rebilling',
    ],
  },
];

function Achievements({ briefings, onNavigate }) {
  const [tab, setTab] = useState(GAINS[0].id);
  const active = GAINS.find((g) => g.id === tab);
  const reduce = useReducedMotion();
  const swap = {
    initial: reduce ? { opacity: 0 } : { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    exit: reduce ? { opacity: 0 } : { opacity: 0, y: -6 },
    transition: { duration: 0.18, ease: [0.16, 1, 0.3, 1] },
  };

  return (
    <div>
      <div className="mt-8 flex gap-1.5 overflow-x-auto rounded-xl border border-akg-hairline bg-akg-surfaceElevated p-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mt-10">
        {GAINS.map((g) => (
          <button
            key={g.id}
            onClick={() => setTab(g.id)}
            className={`flex-1 whitespace-nowrap rounded-lg px-4 py-2.5 text-[13px] font-semibold transition-all cursor-pointer ${
              tab === g.id
                ? 'btn-cyan-emerald shadow-sm'
                : 'text-akg-muted hover:text-akg-text'
            }`}
          >
            {g.tab}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait" initial={false}>
      <motion.div key={tab} className="mt-8 grid gap-8 lg:grid-cols-[0.45fr_0.55fr] sm:mt-10" {...swap}>
        <div>
          <h3 className="font-display text-2xl font-extrabold leading-tight text-akg-text sm:text-[1.7rem]">
            {active.title}
          </h3>
          <motion.ul
            className="mt-6 space-y-4"
            initial="hidden"
            animate="show"
            exit="exit"
            variants={{
              hidden: {},
              show: { transition: { staggerChildren: 0.045 } },
              exit: {},
            }}
          >
            {active.checks.map((c) => (
              <motion.li
                key={c}
                variants={{
                  hidden: reduce ? { opacity: 0 } : { opacity: 0, x: -8 },
                  show: { opacity: 1, x: 0, transition: { duration: 0.2, ease: [0.16, 1, 0.3, 1] } },
                  exit: { opacity: 0 },
                }}
                className="flex items-start gap-3"
              >
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-emerald-500/10 border border-emerald-500/30">
                  <Check className="h-3.5 w-3.5 text-emerald-500" strokeWidth={3} />
                </span>
                <span className="text-sm leading-relaxed text-akg-text">{c}</span>
              </motion.li>
            ))}
          </motion.ul>
        </div>

        <div className="rounded-2xl border border-akg-hairline bg-akg-surfaceElevated p-4 sm:p-5 shadow-sm">
          {tab === 'bots' && (
            <div>
              <div className="flex items-center justify-between border-b border-akg-hairline px-2 pb-3">
                <span className="font-mono text-[10px] uppercase tracking-wider text-akg-text">
                  Equity monitor
                </span>
                <TrendingUp className="h-4 w-4 text-emerald-500" />
              </div>
              <div className="px-2 pt-4">
                <EquityCurve seed="membership" points={100} className="h-40 w-full sm:h-44" />
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2 px-2 pb-1">
                {['Hard stop-loss', 'MT4 & MT5', 'License key included'].map((t) => (
                  <div
                    key={t}
                    className="rounded-lg border border-akg-hairline bg-akg-card px-2 py-2 text-center font-mono text-[9px] uppercase tracking-wide text-akg-muted"
                  >
                    {t}
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'signals' && (
            <div>
              <div className="flex items-center justify-between border-b border-akg-hairline px-2 pb-3">
                <span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-akg-text">
                  <span className="live-dot" />
                  Live feed
                </span>
                <BellRing className="h-4 w-4 text-emerald-500" />
              </div>
              <div className="divide-y divide-akg-hairline">
                {[
                  { tone: 'vip' },
                  { tone: 'sr' },
                  { tone: 'vip' },
                  { tone: 'sr' },
                ].map((row, i) => (
                  <div key={i} className={`flex items-center justify-between gap-3 py-3 ${i === 0 ? 'pt-3.5' : ''}`}>
                    <span className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      <span className="relative h-2 overflow-hidden rounded bg-akg-card" style={{ width: 130 - i * 22 }}>
                        <span className="absolute inset-0 rounded bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                      </span>
                    </span>
                    <span className={`rounded-md px-2 py-0.5 font-mono text-[9px] font-semibold ${row.tone === 'vip' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' : 'bg-akg-card text-akg-muted border border-akg-hairline'}`}>
                      {row.tone === 'vip' ? 'VIP · locked' : 'SR · locked'}
                    </span>
                  </div>
                ))}
              </div>
              <p className="mt-3 px-2 font-mono text-[10px] text-akg-muted">
                The room streams live. Members only.
              </p>
            </div>
          )}

          {tab === 'care' && (
            <div>
              <div className="flex items-center justify-between border-b border-akg-hairline px-2 pb-3">
                <span className="font-mono text-[10px] uppercase tracking-wider text-akg-text">
                  From the desk
                </span>
                <Headphones className="h-4 w-4 text-emerald-500" />
              </div>
              {briefings.length ? (
                briefings.slice(0, 3).map((b) => (
                  <div key={b.id} className="border-b border-akg-hairline px-2 py-3.5 last:border-b-0">
                    <h4 className="text-[13px] font-bold text-akg-text">{b.title}</h4>
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
      </motion.div>
      </AnimatePresence>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <button
          onClick={() => onNavigate('pricing')}
          className="btn-cyan-emerald px-6 py-2.5 rounded-xl font-bold text-sm shadow-md cursor-pointer"
        >
          See Plans &amp; Pricing
        </button>
        <button
          onClick={() => onNavigate('bots')}
          className="px-6 py-2.5 rounded-xl border border-akg-hairline bg-akg-card hover:bg-akg-surfaceElevated font-semibold text-sm text-akg-text shadow-sm cursor-pointer"
        >
          Browse the Bots
        </button>
      </div>
    </div>
  );
}

/* ============================================================
   DESK TOOLKIT - text-tab switcher over tool cards
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
    tab: 'Signal room',
    prefix: 'Follow the desk while it works',
    cards: [
      {
        icon: Activity,
        title: 'Live broadcasts',
        body: 'Entries, stops and take-profits posted in real time inside the member signal room.',
      },
      {
        icon: Database,
        title: 'Locked-tier previews',
        body: 'Guests and lower tiers see that a broadcast exists, never its content.',
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
      <div className="mt-6 flex gap-1.5 overflow-x-auto rounded-xl border border-akg-hairline bg-akg-surfaceElevated p-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {TOOLS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 whitespace-nowrap rounded-lg px-4 py-2.5 text-[13px] font-semibold transition-all cursor-pointer ${
              tab === t.id
                ? 'btn-cyan-emerald shadow-sm'
                : 'text-akg-muted hover:text-akg-text'
            }`}
          >
            {t.tab}
          </button>
        ))}
      </div>

      <p className="mt-5 text-center text-sm text-akg-muted">{active.prefix}</p>

      <motion.div
        key={tab}
        className="mt-6 grid gap-4 md:grid-cols-3"
        initial="hidden"
        animate="show"
        variants={{ hidden: {}, show: { transition: { staggerChildren: 0.055 } } }}
      >
        {active.cards.map(({ icon: Icon, title, body }) => (
          <motion.div
            key={title}
            variants={{
              hidden: { opacity: 0, y: 10 },
              show: { opacity: 1, y: 0, transition: { duration: 0.22, ease: [0.16, 1, 0.3, 1] } },
            }}
            className="card-depth flex flex-col rounded-2xl border border-akg-hairline bg-akg-card p-5 text-center transition-all hover:border-emerald-500/40"
          >
            <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400">
              <Icon className="h-5 w-5" strokeWidth={2} />
            </div>
            <h3 className="mt-3.5 font-display text-[15px] font-bold text-akg-text">{title}</h3>
            <p className="mt-2 text-xs leading-relaxed text-akg-muted">{body}</p>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}

export default LandingPage;
