import React, { useState, useEffect } from 'react';
import { pb } from '../lib/pocketbase';
import {
  Cpu, Zap, ArrowRight, Check, ShieldCheck,
  Terminal, TrendingUp, TrendingDown, Lock, Activity, Wallet, KeyRound
} from 'lucide-react';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from './ui/Accordion';
import Reveal, { RevealGroup, RevealItem } from './motion/Reveal';
import CountUp from './motion/CountUp';
import Ticker from './motion/Ticker';
import EquityCurve from './EquityCurve';
import { useSiteSettings } from '../lib/wallets';

const botSlug = (name) =>
  String(name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

/* Performance stats render only when an admin actually entered them in PocketBase. */
const hasStats = (bot) => Boolean(bot?.win_rate || bot?.profit_factor || bot?.drawdown);

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

  const featured = bots[0];
  const rest = bots.slice(1, 3);

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
          4. BOTS SHOWCASE — featured card + compact pair (asymmetric)
      ============================================================ */}
      <section className="mx-auto max-w-7xl px-4 py-14 sm:py-20">
        <Reveal>
          <span className="font-data text-[10px] font-bold uppercase tracking-[0.22em] text-akg-gold/80">
            EA catalog
          </span>
          <h2 className="mt-2.5 font-display text-3xl font-extrabold leading-[1.12] tracking-tight text-white sm:text-4xl">
            Buy once, own it for good.
          </h2>
          <p className="mt-3 max-w-[60ch] text-sm text-akg-muted sm:text-[15px]">
            Every license is locked to your MetaTrader account number. One payment, no renewals.
          </p>
        </Reveal>

        <div className="mt-10 grid gap-5 lg:grid-cols-2">
          {/* Featured bot: large card with real image */}
          {featured && (
            <Reveal className="lg:row-span-2">
              <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-[#F3C653]/25 bg-akg-surface shadow-gold transition-transform duration-500 ease-akg hover:-translate-y-1">
                <div className="relative border-b border-white/[0.06] bg-[#0A0D13]">
                  <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5 px-5 pt-5 sm:px-6">
                    <Badge variant="gold" className="gap-1 border border-[#F3C653]/40">
                      Most deployed
                    </Badge>
                    {hasStats(featured) && (
                      <span className="ml-auto whitespace-nowrap font-data text-[10px] text-akg-muted">
                        Illustrative equity profile
                      </span>
                    )}
                  </div>
                  {hasStats(featured) && (
                    <EquityCurve
                      seed={featured.name}
                      profitFactor={featured.profit_factor}
                      drawdown={featured.drawdown}
                      winRate={featured.win_rate}
                      points={90}
                      className="h-32 w-full sm:h-36"
                    />
                  )}
                </div>

                <div className="flex flex-1 flex-col p-5 sm:p-7">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-data text-[11px] uppercase tracking-[0.14em] text-akg-muted">
                      {featured.platform} · {featured.pairs}
                    </span>
                    <span className="font-data text-[11px] text-akg-gold">{featured.version}</span>
                  </div>

                  <h3 className="mt-3 font-display text-xl font-bold text-white sm:text-2xl">
                    {featured.name}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-akg-muted">{featured.description}</p>

                  {/* Terminal stat strip */}
                  {hasStats(featured) && (
                    <div className="mt-5 grid grid-cols-3 gap-px overflow-hidden rounded-xl border border-white/[0.07] bg-white/[0.04]">
                      {[
                        { k: 'Win rate', v: featured.win_rate },
                        { k: 'Profit factor', v: featured.profit_factor },
                        { k: 'Max drawdown', v: featured.drawdown },
                      ].filter((s) => s.v).map((s) => (
                        <div key={s.k} className="bg-akg-surface px-3 py-2.5 text-center">
                          <div className="font-data text-sm font-semibold text-akg-green">{s.v}</div>
                          <div className="mt-0.5 text-[10px] uppercase tracking-wide text-akg-muted">{s.k}</div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="mt-auto flex flex-wrap items-end justify-between gap-4 pt-6">
                    <div>
                      <div className="font-display text-2xl font-extrabold text-white tabular-nums">
                        ${featured.price}
                        <span className="ml-1.5 text-xs font-bold text-akg-gold">USDT</span>
                      </div>
                      <div className="text-[11px] text-akg-muted">One-time perpetual license</div>
                    </div>
                    <Button variant="default" onClick={() => onNavigate('bots', botSlug(featured.name))} className="gap-1.5">
                      <span>View Bot</span>
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </article>
            </Reveal>
          )}

          {/* Compact bot cards + what's inside a license */}
          <RevealGroup className="grid gap-5" stagger={0.1}>
            {rest.map((bot) => (
              <RevealItem key={bot.id}>
                <article className="group flex flex-col gap-4 rounded-2xl border border-white/10 bg-akg-surface p-5 transition-all duration-300 hover:border-[#F3C653]/25 sm:flex-row sm:items-center sm:p-6">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2.5">
                      <h3 className="font-display text-base font-bold text-white">{bot.name}</h3>
                      <span className="font-data text-[10px] text-akg-muted">{bot.version}</span>
                    </div>
                    <p className="mt-1 font-data text-[11px] uppercase tracking-wide text-akg-muted">
                      {bot.platform} · {bot.pairs}
                    </p>
                    <p className="mt-2.5 line-clamp-2 text-xs leading-relaxed text-akg-muted">
                      {bot.description}
                    </p>
                    {hasStats(bot) && (
                      <div className="mt-3 flex flex-wrap gap-1.5 font-data text-[11px]">
                        {bot.win_rate && (
                          <span className="rounded-md bg-akg-green/[0.08] px-2 py-0.5 text-akg-green">{bot.win_rate} win</span>
                        )}
                        {bot.profit_factor && (
                          <span className="rounded-md bg-white/[0.04] px-2 py-0.5 text-akg-muted">PF {bot.profit_factor}</span>
                        )}
                        {bot.drawdown && (
                          <span className="rounded-md bg-white/[0.04] px-2 py-0.5 text-akg-muted">DD {bot.drawdown}</span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex shrink-0 flex-row items-center justify-between gap-3 sm:flex-col sm:items-end">
                    <div className="font-display text-lg font-extrabold text-white tabular-nums">
                      ${bot.price}
                    </div>
                    <Button variant="secondary" size="sm" onClick={() => onNavigate('bots', botSlug(bot.name))}>
                      Details
                    </Button>
                  </div>
                </article>
              </RevealItem>
            ))}

            <RevealItem>
              <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-5 sm:p-6">
                <span className="font-data text-[10px] font-bold uppercase tracking-[0.18em] text-akg-gold/80">
                  Every license includes
                </span>
                <ul className="mt-3.5 grid gap-2.5">
                  {['Free lifetime updates', 'Cryptographic account binding', 'Hard stop-loss on every position', 'Priority desk support'].map((t) => (
                    <li key={t} className="flex items-center gap-2.5 text-sm text-akg-silver">
                      <Check className="h-3.5 w-3.5 shrink-0 text-akg-green" strokeWidth={2.5} />
                      <span>{t}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </RevealItem>
          </RevealGroup>
        </div>

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
