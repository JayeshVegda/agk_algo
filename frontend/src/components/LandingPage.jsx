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
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './ui/Card';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from './ui/Accordion';
import Reveal, { RevealGroup, RevealItem } from './motion/Reveal';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import CountUp from './motion/CountUp';
import EquityCurve from './EquityCurve';
import { useSiteSettings, getPlans } from '../lib/wallets';
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





function TerminalBotCardPreview({ bot, cat }) {
  const CatIcon = cat?.icon || LineChart;
  const pairStr = String(bot?.pairs || '').toLowerCase();
  const isGold = pairStr.includes('gold') || pairStr.includes('xau');
  const isCrypto = pairStr.includes('btc') || pairStr.includes('crypto');
  const isIndices = /us30|nas100|us500|dax40/.test(pairStr);

  const strokeColor = isGold ? '#F59E0B' : isCrypto ? '#38BDF8' : isIndices ? '#A855F7' : '#10B981';

  return (
    <div className="relative h-40 w-full overflow-hidden bg-slate-900 select-none flex flex-col justify-between p-3.5 border-b border-slate-800">
      <div 
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(to right, rgba(255, 255, 255, 0.1) 1px, transparent 1px), linear-gradient(to bottom, rgba(255, 255, 255, 0.1) 1px, transparent 1px)',
          backgroundSize: '20px 20px',
        }}
      />
      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-1.5 rounded-md border border-white/10 bg-black/40 px-2 py-0.5 text-[10px] font-mono font-medium text-slate-300 backdrop-blur-sm">
          <CatIcon className="h-3 w-3" style={{ color: strokeColor }} />
          <span>{cat?.label || 'Forex'} · {bot?.platform || 'MT5'}</span>
        </div>
        <div className="flex items-center gap-1 font-mono text-[9px] text-emerald-400 font-semibold bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>VERIFIED EA</span>
        </div>
      </div>

      <div className="relative z-10 my-auto py-1">
        <svg viewBox="0 0 280 48" className="w-full h-11 overflow-visible">
          <defs>
            <linearGradient id={`spark-${bot?.id || 'gen'}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={strokeColor} stopOpacity="0.25" />
              <stop offset="100%" stopColor={strokeColor} stopOpacity="0.0" />
            </linearGradient>
          </defs>
          <path
            d="M 0,40 Q 40,36 75,28 T 150,22 T 215,12 T 280,5"
            fill="none"
            stroke={strokeColor}
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <path
            d="M 0,40 Q 40,36 75,28 T 150,22 T 215,12 T 280,5 L 280,48 L 0,48 Z"
            fill={`url(#spark-${bot?.id || 'gen'})`}
          />
          <circle cx="280" cy="5" r="3" fill="#FFFFFF" />
        </svg>
      </div>

      <div className="relative z-10 flex items-center justify-between text-[10px] font-mono text-slate-400">
        <span className="truncate max-w-[170px] text-slate-300 font-medium">
          {bot?.pairs || 'All Sessions'}
        </span>
        <span className="text-emerald-400 font-semibold">
          Hard SL Guard
        </span>
      </div>
    </div>
  );
}

function HeroHeadline({ botCount = 8 }) {
  return (
    <div className="relative z-10 mx-auto max-w-4xl px-4 sm:px-6 text-center select-none py-2">
      <div className="inline-flex items-center gap-2 rounded-full border border-slate-200/90 dark:border-white/10 bg-white/95 dark:bg-akg-card/95 px-4 py-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200 shadow-xs backdrop-blur-md">
        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
        <span className="font-bold text-slate-900 dark:text-white">{botCount} active robots</span>
        <span className="text-slate-400">·</span>
        <span className="text-emerald-700 dark:text-emerald-400 font-semibold">33 running live</span>
        <span className="text-slate-400">·</span>
        <span className="text-slate-600 dark:text-slate-300">MyFxBook verified</span>
      </div>

      <h1 className="mt-6 font-display text-4xl sm:text-6xl font-extrabold tracking-tight leading-[1.08]">
        <span className="text-slate-900 dark:text-white">Forex Trading Robots &amp; Expert Advisors,</span>
        <br />
        <span className="text-slate-500 dark:text-slate-400 font-bold">verified on our live trading accounts.</span>
      </h1>

      <p className="mt-4 max-w-2xl mx-auto text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
        Every algorithm runs on our proprietary capital. Inspect drawdown curves, win rates, and execution stats before purchasing a lifetime license.
      </p>
    </div>
  );
}

export function LandingPage({ onNavigate, onOpenAuth, notify }) {
  const [bots, setBots] = useState(FALLBACK_BOTS);
  const [botCount, setBotCount] = useState(FALLBACK_BOTS.length);
  const [briefings, setBriefings] = useState([]);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const settings = useSiteSettings();
  const PLANS = getPlans(settings);

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
          <div className="mt-8 flex flex-col items-center justify-center">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5">
              <Button
                variant="gradient"
                size="lg"
                onClick={() => onNavigate('bots')}
                className="px-8 shadow-md font-bold text-sm"
              >
                <span>Browse forex trading robots</span>
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => onNavigate('signals')}
                className="px-7 font-bold text-sm"
              >
                <Terminal className="h-4 w-4 text-emerald-600 dark:text-emerald-400 mr-2" />
                <span>Signal Room</span>
              </Button>
            </div>

            {/* Breadcrumb matching Image 0 */}
            <div className="mt-6 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2 font-medium">
              <span className="hover:text-slate-900 dark:hover:text-white cursor-pointer transition-colors" onClick={() => onNavigate('home')}>Home</span>
              <span className="text-slate-400">/</span>
              <span className="hover:text-slate-900 dark:hover:text-white cursor-pointer transition-colors" onClick={() => onNavigate('bots')}>Trading robots</span>
              <span className="text-slate-400">/</span>
              <span className="text-slate-900 dark:text-white font-semibold">Forex Trading Robots</span>
            </div>
          </div>

          {/* Minimal 4-Metric Strip with tactile unified card matching reference Image 0 */}
          <div className="mt-10 rounded-2xl border border-slate-200/90 dark:border-white/10 bg-white dark:bg-akg-card shadow-sm overflow-hidden text-left">
            <div className="grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-slate-200 dark:divide-white/10">
              <div className="p-5 sm:p-6 flex flex-col justify-between">
                <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">Robots</div>
                <div className="mt-2 font-mono text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white"><CountUp value={botCount} /></div>
                <div className="mt-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium">2 free included</div>
              </div>
              <div className="p-5 sm:p-6 flex flex-col justify-between">
                <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">On our own accounts</div>
                <div className="mt-2 font-mono text-3xl sm:text-4xl font-extrabold text-emerald-600 dark:text-emerald-400"><CountUp value={33} /></div>
                <div className="mt-1.5 text-xs text-emerald-600 font-semibold">Live verified</div>
              </div>
              <div className="p-5 sm:p-6 flex flex-col justify-between">
                <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">Drawdown published</div>
                <div className="mt-2 font-mono text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white"><CountUp value={36} /></div>
                <div className="mt-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium">Max peak-to-valley</div>
              </div>
              <div className="p-5 sm:p-6 flex flex-col justify-between">
                <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">Symbols traded</div>
                <div className="mt-2 font-mono text-3xl sm:text-4xl font-extrabold text-sky-600 dark:text-sky-400"><CountUp value={37} /></div>
                <div className="mt-1.5 text-xs text-sky-600 font-semibold">Forex, Gold &amp; Indices</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
          2. WHAT MAKES AKG ALGO UNIQUE - 5 Signature Pillars (Image 1)
      ============================================================ */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:py-24 border-b border-slate-200/80 dark:border-white/10">
        <div className="text-center max-w-2xl mx-auto">
          <Reveal>
            <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              What makes AKG ALGO unique?
            </h2>
            <p className="mt-3 text-sm sm:text-base text-slate-500 dark:text-slate-400 leading-relaxed">
              Institutional engineering across every strategy and execution model
            </p>
          </Reveal>
        </div>

        {/* Row 1: 3 Equal Width Cards */}
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {/* Pillar 1 */}
          <Card className="hover:border-emerald-500/40 hover:-translate-y-0.5 transition-all flex flex-col justify-between">
            <CardContent className="p-6 sm:p-7 flex flex-col justify-between h-full">
              <div>
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                    <Check className="h-5 w-5" strokeWidth={2.5} />
                  </div>
                  <div>
                    <h3 className="font-display text-base sm:text-lg font-bold text-slate-900 dark:text-white">Proven Strategies</h3>
                    <span className="font-mono text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">10+ PRODUCTION ALGORITHMS</span>
                  </div>
                </div>
                <p className="mt-3 text-xs sm:text-[13px] leading-relaxed text-slate-600 dark:text-slate-400">
                  Access battle-tested entry algorithms built for MetaTrader 4 and 5 with hard stop-loss coordinates on every trade.
                </p>
              </div>

              {/* Micro-diagram: Execution Stack */}
              <div className="mt-5 rounded-xl border border-slate-200/80 dark:border-white/10 bg-slate-50/90 dark:bg-slate-900/60 p-3 font-mono">
                <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 pb-1.5 border-b border-slate-200/60 dark:border-white/5">
                  <span>EXECUTION PIPELINE</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">MT4 / MT5</span>
                </div>
                <div className="mt-2.5 flex items-center justify-between gap-1 text-[10px]">
                  <span className="rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 px-2 py-1 text-slate-800 dark:text-slate-200 font-medium">Session Filter</span>
                  <span className="text-emerald-500 font-bold">→</span>
                  <span className="rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 px-2 py-1 text-slate-800 dark:text-slate-200 font-medium">Volatility Cap</span>
                  <span className="text-emerald-500 font-bold">→</span>
                  <span className="rounded bg-emerald-500/15 border border-emerald-500/30 px-2 py-1 text-emerald-600 dark:text-emerald-400 font-bold">Hard SL</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pillar 2 */}
          <Card className="hover:border-emerald-500/40 hover:-translate-y-0.5 transition-all flex flex-col justify-between">
            <CardContent className="p-6 sm:p-7 flex flex-col justify-between h-full">
              <div>
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                    <Command className="h-5 w-5" strokeWidth={2.2} />
                  </div>
                  <div>
                    <h3 className="font-display text-base sm:text-lg font-bold text-slate-900 dark:text-white">Live Track Record</h3>
                    <span className="font-mono text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">MYFXBOOK VERIFIED</span>
                  </div>
                </div>
                <p className="mt-3 text-xs sm:text-[13px] leading-relaxed text-slate-600 dark:text-slate-400">
                  Track full historical performance on live accounts: peak-to-valley drawdown, profit factor, and Sharpe ratios.
                </p>
              </div>

              {/* Micro-diagram: Mini Equity Sparkline */}
              <div className="mt-5 rounded-xl border border-slate-200/80 dark:border-white/10 bg-slate-50/90 dark:bg-slate-900/60 p-3 font-mono">
                <div className="flex items-center justify-between text-[10px] pb-1 border-b border-slate-200/60 dark:border-white/5">
                  <span className="flex items-center gap-1.5 font-semibold text-emerald-600 dark:text-emerald-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    LIVE ACCOUNT GAIN
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white">+68.4% NET</span>
                </div>
                <div className="mt-2.5">
                  <svg viewBox="0 0 200 32" className="w-full h-8 overflow-visible">
                    <path d="M 0,26 Q 30,24 60,18 T 120,14 T 165,8 T 200,3" fill="none" stroke="#10B981" strokeWidth="2.2" strokeLinecap="round" />
                    <circle cx="200" cy="3" r="3" fill="#10B981" />
                  </svg>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pillar 3 */}
          <Card className="hover:border-emerald-500/40 hover:-translate-y-0.5 transition-all flex flex-col justify-between">
            <CardContent className="p-6 sm:p-7 flex flex-col justify-between h-full">
              <div>
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                    <Target className="h-5 w-5" strokeWidth={2.2} />
                  </div>
                  <div>
                    <h3 className="font-display text-base sm:text-lg font-bold text-slate-900 dark:text-white">All Markets Covered</h3>
                    <span className="font-mono text-[10px] text-sky-600 dark:text-sky-400 font-semibold">37 TRADED SYMBOLS</span>
                  </div>
                </div>
                <p className="mt-3 text-xs sm:text-[13px] leading-relaxed text-slate-600 dark:text-slate-400">
                  Engineered for Gold (XAUUSD), major currency pairs, equity indices (US30, NAS100), and liquid crypto perpetuals.
                </p>
              </div>

              {/* Micro-diagram: Asset Chips */}
              <div className="mt-5 rounded-xl border border-slate-200/80 dark:border-white/10 bg-slate-50/90 dark:bg-slate-900/60 p-3 font-mono">
                <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 pb-1.5 border-b border-slate-200/60 dark:border-white/5">
                  <span>SUPPORTED MARKETS</span>
                  <span className="text-sky-600 dark:text-sky-400 font-semibold">&lt; 12ms LATENCY</span>
                </div>
                <div className="mt-2.5 grid grid-cols-2 gap-1.5 text-[10px]">
                  <div className="flex items-center justify-between rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 px-2 py-1">
                    <span className="font-bold text-slate-800 dark:text-slate-200">XAUUSD</span>
                    <span className="text-amber-500 font-semibold">Gold</span>
                  </div>
                  <div className="flex items-center justify-between rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 px-2 py-1">
                    <span className="font-bold text-slate-800 dark:text-slate-200">EURUSD</span>
                    <span className="text-emerald-500 font-semibold">Forex</span>
                  </div>
                  <div className="flex items-center justify-between rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 px-2 py-1">
                    <span className="font-bold text-slate-800 dark:text-slate-200">US30</span>
                    <span className="text-purple-500 font-semibold">Index</span>
                  </div>
                  <div className="flex items-center justify-between rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 px-2 py-1">
                    <span className="font-bold text-slate-800 dark:text-slate-200">BTCUSD</span>
                    <span className="text-sky-500 font-semibold">Crypto</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Row 2: 2 Centered Cards (Identical Width to Row 1) */}
        <div className="mt-6 flex flex-col md:flex-row justify-center gap-6">
          {/* Pillar 4 */}
          <Card className="w-full md:w-[calc(33.333%-16px)] hover:border-emerald-500/40 hover:-translate-y-0.5 transition-all flex flex-col justify-between">
            <CardContent className="p-6 sm:p-7 flex flex-col justify-between h-full">
              <div>
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 font-bold font-mono text-sm text-emerald-600 dark:text-emerald-400">
                    AI
                  </div>
                  <div>
                    <h3 className="font-display text-base sm:text-lg font-bold text-slate-900 dark:text-white">Multi-Timeframe Logic</h3>
                    <span className="font-mono text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">CONFLUENCE ENGINE</span>
                  </div>
                </div>
                <p className="mt-3 text-xs sm:text-[13px] leading-relaxed text-slate-600 dark:text-slate-400">
                  Combines macro trend direction, interbank order blocks, and micro session liquidity before arming an entry.
                </p>
              </div>

              {/* Micro-diagram: Multi-Timeframe Alignment */}
              <div className="mt-5 rounded-xl border border-slate-200/80 dark:border-white/10 bg-slate-50/90 dark:bg-slate-900/60 p-3 font-mono">
                <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 pb-1.5 border-b border-slate-200/60 dark:border-white/5">
                  <span>CONFLUENCE FILTER</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">3 OF 3 MET</span>
                </div>
                <div className="mt-2.5 space-y-1.5 text-[10px]">
                  <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                    <span>H1 Macro Trend</span>
                    <span className="text-emerald-500 font-bold">ALIGNED</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                    <span>M15 Volume Sweep</span>
                    <span className="text-sky-500 font-bold">CONFIRMED</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                    <span>M1 Snipe Trigger</span>
                    <span className="text-emerald-500 font-bold">ARMED</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pillar 5 */}
          <Card className="w-full md:w-[calc(33.333%-16px)] hover:border-emerald-500/40 hover:-translate-y-0.5 transition-all flex flex-col justify-between">
            <CardContent className="p-6 sm:p-7 flex flex-col justify-between h-full">
              <div>
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                    <RefreshCw className="h-5 w-5" strokeWidth={2.2} />
                  </div>
                  <div>
                    <h3 className="font-display text-base sm:text-lg font-bold text-slate-900 dark:text-white">Capital Protection</h3>
                    <span className="font-mono text-[10px] text-rose-500 font-semibold">NO MARTINGALE / NO GRID</span>
                  </div>
                </div>
                <p className="mt-3 text-xs sm:text-[13px] leading-relaxed text-slate-600 dark:text-slate-400">
                  Fixed risk compounding, automated breakeven trailing, and hard equity stop-out rules to pass prop firm challenges.
                </p>
              </div>

              {/* Micro-diagram: Risk Guard */}
              <div className="mt-5 rounded-xl border border-slate-200/80 dark:border-white/10 bg-slate-50/90 dark:bg-slate-900/60 p-3 font-mono">
                <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 pb-1.5 border-b border-slate-200/60 dark:border-white/5">
                  <span>RISK PARAMETERS</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">PROP FIRM SAFE</span>
                </div>
                <div className="mt-2.5 grid grid-cols-2 gap-2 text-[10px]">
                  <div className="rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 p-2 text-center">
                    <div className="text-[9px] text-slate-500 dark:text-slate-400">Max DD Cap</div>
                    <div className="font-bold text-rose-500 mt-0.5">3.6% Peak</div>
                  </div>
                  <div className="rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 p-2 text-center">
                    <div className="text-[9px] text-slate-500 dark:text-slate-400">Lot Sizing</div>
                    <div className="font-bold text-emerald-500 mt-0.5">Dynamic 1%</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ============================================================
          3. HOW IT WORKS - 3 Easy Steps with Visual Mockups (Image 2)
      ============================================================ */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:py-24 border-b border-slate-200/80 dark:border-white/10">
        <div className="text-center max-w-xl mx-auto">
          <Reveal>
            <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Get started in 3 easy steps
            </h2>
            <p className="mt-3 text-sm sm:text-base text-slate-500 dark:text-slate-400 leading-relaxed">
              Deploy an Expert Advisor to your terminal in three steps
            </p>
          </Reveal>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {/* Step 1 */}
          <Card className="group rounded-[28px] border border-emerald-200/70 dark:border-white/10 bg-[var(--akg-accent-soft)] dark:bg-akg-tint p-6 sm:p-7 flex flex-col justify-between overflow-hidden relative shadow-sm hover:shadow-md transition-all">
            <div>
              <Badge variant="emerald" className="font-mono text-[10px] font-bold px-3 py-1">
                STEP 01
              </Badge>
              <h3 className="mt-4 font-display text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                1. Build Your Trading Bot
              </h3>
              <p className="mt-2 text-xs sm:text-[13px] leading-relaxed text-slate-600 dark:text-slate-400">
                Select your market, choose a trusted strategy, customise the settings and download the compiled MT4 or MT5 version
              </p>

              <div className="mt-5">
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => onNavigate('bots')}
                  className="gap-1.5 font-semibold text-xs"
                >
                  <span>Start free to build</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            {/* Visual: Isometric Floating Market Selector Tokens */}
            <div className="mt-8 pt-6 relative flex flex-col items-center justify-center min-h-[170px]">
              <div className="relative w-full max-w-[240px] h-[120px]">
                {/* Top BTC */}
                <div className="absolute top-0 right-8 rounded-xl border border-slate-200 bg-white dark:bg-slate-800 dark:border-white/10 px-3.5 py-1.5 text-xs font-bold text-slate-900 dark:text-white shadow-xs">
                  BTC
                </div>
                {/* Left AU */}
                <div className="absolute top-7 left-2 rounded-xl border border-slate-200 bg-white dark:bg-slate-800 dark:border-white/10 px-3.5 py-1.5 text-xs font-bold text-slate-900 dark:text-white shadow-xs">
                  AU
                </div>
                {/* Center Highlighted AI */}
                <div className="absolute top-3 left-1/2 -translate-x-1/2 rounded-xl bg-emerald-700 px-4 py-2 text-sm font-bold text-white shadow-md ring-4 ring-emerald-500/20">
                  AI
                </div>
                {/* Right EQ */}
                <div className="absolute top-9 right-0 rounded-xl border border-slate-200 bg-white dark:bg-slate-800 dark:border-white/10 px-3.5 py-1.5 text-xs font-bold text-slate-900 dark:text-white shadow-xs">
                  EQ
                </div>
                {/* Bottom Selected market badge */}
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border border-slate-200 bg-white dark:bg-slate-800 dark:border-white/10 px-4 py-1.5 text-xs font-semibold text-slate-900 dark:text-slate-100 shadow-xs flex items-center gap-1.5">
                  <span>Selected market</span>
                  <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" strokeWidth={3} />
                </div>
              </div>
            </div>
          </Card>

          {/* Step 2 */}
          <Card className="group rounded-[28px] border border-emerald-200/70 dark:border-white/10 bg-[var(--akg-accent-soft)] dark:bg-akg-tint p-6 sm:p-7 flex flex-col justify-between overflow-hidden relative shadow-sm hover:shadow-md transition-all">
            <div>
              <Badge variant="emerald" className="font-mono text-[10px] font-bold px-3 py-1">
                STEP 02
              </Badge>
              <h3 className="mt-4 font-display text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                2. Connect Your Trading Account
              </h3>
              <p className="mt-2 text-xs sm:text-[13px] leading-relaxed text-slate-600 dark:text-slate-400">
                Copy the bot into MetaTrader, connect a compatible account and test the setup on demo first
              </p>
            </div>

            {/* Visual: Layered Stacked Config Cards */}
            <div className="mt-8 pt-6 relative min-h-[170px] flex items-end justify-center">
              <div className="w-full space-y-[-14px]">
                {/* Layer 3 (Back) */}
                <div className="mx-4 rounded-xl border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-slate-800/80 p-2.5 flex items-center justify-between text-xs opacity-75 shadow-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] font-bold text-slate-500 dark:text-slate-400">03</span>
                    <div>
                      <div className="text-[11px] font-semibold text-slate-800 dark:text-slate-200">Risk settings</div>
                      <div className="text-[9px] text-slate-500 dark:text-slate-400">Review before building</div>
                    </div>
                  </div>
                </div>

                {/* Layer 2 (Middle) */}
                <div className="mx-2 rounded-xl border border-slate-200 dark:border-white/15 bg-white/95 dark:bg-slate-800/95 p-2.5 flex items-center justify-between text-xs opacity-90 shadow-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] font-bold text-emerald-600 dark:text-emerald-400">02</span>
                    <div>
                      <div className="text-[11px] font-semibold text-slate-900 dark:text-white">Platform &amp; account</div>
                      <div className="text-[9px] text-slate-500 dark:text-slate-400">MT4 / MT5 connection</div>
                    </div>
                  </div>
                </div>

                {/* Layer 1 (Front, prominent) */}
                <div className="relative z-10 rounded-xl border border-slate-200 dark:border-white/20 bg-white dark:bg-slate-850 p-3.5 flex items-center justify-between text-xs shadow-md">
                  <div className="flex items-center gap-2.5">
                    <div className="h-7 w-7 rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-mono font-bold text-xs flex items-center justify-center">
                      01
                    </div>
                    <div>
                      <div className="font-bold text-[12px] text-slate-900 dark:text-white">Multi-Level Strategy</div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400">Configure, test and refine</div>
                    </div>
                  </div>
                  <Badge variant="emerald" className="font-mono text-[10px]">
                    Ready
                  </Badge>
                </div>
              </div>
            </div>
          </Card>

          {/* Step 3 */}
          <Card className="group rounded-[28px] border border-emerald-200/70 dark:border-white/10 bg-[var(--akg-accent-soft)] dark:bg-akg-tint p-6 sm:p-7 flex flex-col justify-between overflow-hidden relative shadow-sm hover:shadow-md transition-all">
            <div>
              <Badge variant="emerald" className="font-mono text-[10px] font-bold px-3 py-1">
                STEP 03
              </Badge>
              <h3 className="mt-4 font-display text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                3. Start Automated Trading
              </h3>
              <p className="mt-2 text-xs sm:text-[13px] leading-relaxed text-slate-600 dark:text-slate-400">
                Turn on your algotrading, then monitor trading behaviour, platform connectivity and account risk
              </p>
            </div>

            {/* Visual: Live Automated Trades Desk */}
            <div className="mt-8 pt-6 relative min-h-[170px] flex items-end">
              <div className="w-full rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800 p-4 shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-2.5">
                  <span className="font-display text-[12px] font-bold text-slate-900 dark:text-white">Automated trades</span>
                  <span className="flex items-center gap-1.5 font-mono text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Live monitoring
                  </span>
                </div>
                <div className="mt-3 space-y-2">
                  <div className="flex items-center justify-between rounded-lg bg-slate-50 dark:bg-slate-900/60 p-2.5 border border-slate-100 dark:border-white/5">
                    <div className="flex items-center gap-2.5">
                      <div className="h-6 w-6 rounded-full bg-emerald-50 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300 font-mono text-[10px] font-bold flex items-center justify-center">
                        AU
                      </div>
                      <div>
                        <div className="font-bold text-[12px] text-slate-900 dark:text-white">XAU / USD</div>
                        <div className="text-[10px] text-slate-500">Gold · Trend</div>
                      </div>
                    </div>
                    <Badge variant="emerald" className="font-mono text-[10px]">
                      Running
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-slate-50 dark:bg-slate-900/60 p-2.5 border border-slate-100 dark:border-white/5">
                    <div className="flex items-center gap-2.5">
                      <div className="h-6 w-6 rounded-full bg-sky-50 text-sky-800 dark:bg-sky-500/10 dark:text-sky-300 font-mono text-[10px] font-bold flex items-center justify-center">
                        FX
                      </div>
                      <div>
                        <div className="font-bold text-[12px] text-slate-900 dark:text-white">EUR / USD</div>
                        <div className="text-[10px] text-slate-500">Forex · Multi-Level</div>
                      </div>
                    </div>
                    <Badge variant="secondary" className="font-mono text-[10px]">
                      Watching
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </Card>
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
              Lifetime Licenses. Audited Drawdowns.
            </h2>
            <p className="mt-3 max-w-[60ch] text-sm text-akg-muted sm:text-[15px]">
              Compare win rates, peak drawdowns, and execution logic. Licenses bind silently to your MetaTrader account on first launch.
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
                      <div className="relative shrink-0 overflow-hidden bg-slate-900 h-40">
                        <TerminalBotCardPreview bot={bot} cat={cat} />
                        {showChart && (
                          <img
                            src={chartSrc}
                            alt={bot.name}
                            className="absolute inset-0 h-40 w-full object-cover transition-opacity duration-300 group-hover:scale-105"
                            loading="lazy"
                            onError={() => setChartFailed((prev) => ({ ...prev, [bot.id]: true }))}
                          />
                        )}
                        <div className="absolute left-3 top-3 flex items-center gap-1.5 z-20">
                          <span className="rounded-md border border-white/20 bg-black/75 px-2 py-0.5 font-mono text-[10px] font-bold text-white shadow-sm backdrop-blur-md">
                            {bot.platform || 'MT4 / MT5'}
                          </span>
                          {bot.version && (
                            <span className="rounded-md border border-white/10 bg-black/60 px-1.5 py-0.5 font-mono text-[10px] text-slate-300 shadow-sm backdrop-blur-md">
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

        <div className="mt-10 text-center">
          <Button
            variant="gradient"
            size="lg"
            onClick={() => onNavigate('bots')}
            className="px-8 shadow-md font-bold text-sm"
          >
            <span>Browse all {botCount} Expert Advisors</span>
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
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
                    <Button
                      variant={plan.vip ? 'gradient' : 'secondary'}
                      size="lg"
                      onClick={() => onNavigate('pricing')}
                      className="w-full font-bold text-sm shadow-sm"
                    >
                      Get Access
                    </Button>
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

            <div className="relative z-10 mt-8 flex flex-wrap items-center justify-center gap-3.5">
              <Button
                variant="gradient"
                size="lg"
                onClick={() => onNavigate('pricing')}
                className="px-8 font-bold text-sm shadow-md"
              >
                <span>Get Access</span>
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => onNavigate('signals')}
                className="px-7 font-bold text-sm"
              >
                <span>Open Signal Room</span>
              </Button>
            </div>
          </div>
        </Reveal>
      </section>
    </div>
  );
}

export default LandingPage;
