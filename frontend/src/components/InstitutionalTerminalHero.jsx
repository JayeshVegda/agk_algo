import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Terminal, ShieldCheck, Activity, ArrowRight, Zap,
  CheckCircle2, TrendingUp, Layers, Sliders, ExternalLink,
  ChevronRight, Lock, Eye
} from 'lucide-react';
import CountUp from './motion/CountUp';

const STRATEGIES = [
  {
    id: 'gold-trap',
    name: 'Gold Liquidity Trap EA',
    tag: 'XAUUSD · M15',
    category: 'Gold',
    platform: 'MT4 & MT5',
    accentColor: '#F59E0B',
    accentGlow: 'rgba(245, 158, 11, 0.15)',
    accentBorder: 'rgba(245, 158, 11, 0.4)',
    badgeClass: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
    orderType: 'BUY LIMIT',
    lotSize: '1.00 Lot',
    entryPrice: '2,742.60',
    currentPrice: '2,748.80',
    stopLoss: '2,736.20',
    takeProfit: '2,758.00',
    floatingPnl: '+$1,540.00',
    pnlPct: '+3.42%',
    winRate: '78.4%',
    profitFactor: '2.41',
    maxDd: '3.2%',
    totalGain: '+68.4%',
    executionSpeed: '4.2ms',
    riskReward: '1 : 2.41',
    statusText: 'In Profit · Hard SL Guard Active',
    session: 'London / NY Overlap',
    candles: [
      { x: 30, o: 130, c: 125, h: 122, l: 133, bull: true },
      { x: 70, o: 126, c: 130, h: 124, l: 134, bull: false },
      { x: 110, o: 129, c: 115, h: 112, l: 131, bull: true },
      { x: 150, o: 116, c: 120, h: 114, l: 123, bull: false },
      { x: 190, o: 119, c: 102, h: 100, l: 121, bull: true },
      { x: 230, o: 103, c: 90, h: 88, l: 106, bull: true },
      { x: 270, o: 91, c: 94, h: 86, l: 97, bull: false },
      { x: 310, o: 92, c: 76, h: 73, l: 94, bull: true },
      { x: 350, o: 77, c: 66, h: 63, l: 80, bull: true },
      { x: 390, o: 67, c: 70, h: 62, l: 73, bull: false },
      { x: 430, o: 69, c: 52, h: 48, l: 71, bull: true },
      { x: 470, o: 53, c: 40, h: 36, l: 56, bull: true },
      { x: 510, o: 41, c: 30, h: 26, l: 43, bull: true },
      { x: 550, o: 31, c: 34, h: 27, l: 36, bull: false },
      { x: 590, o: 32, c: 16, h: 12, l: 34, bull: true },
    ],
    slY: 142,
    entryY: 96,
    tpY: 24,
    orderBlockY: 88,
  },
  {
    id: 'momentum-hunter',
    name: 'Momentum Hunter EA',
    tag: 'EURUSD · H1',
    category: 'Forex Majors',
    platform: 'MT5 Direct',
    accentColor: '#06B6D4',
    accentGlow: 'rgba(6, 182, 212, 0.15)',
    accentBorder: 'rgba(6, 182, 212, 0.4)',
    badgeClass: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
    orderType: 'BUY MARKET',
    lotSize: '2.50 Lots',
    entryPrice: '1.08450',
    currentPrice: '1.08820',
    stopLoss: '1.08180',
    takeProfit: '1.09100',
    floatingPnl: '+$890.00',
    pnlPct: '+2.15%',
    winRate: '81.2%',
    profitFactor: '2.85',
    maxDd: '2.9%',
    totalGain: '+54.2%',
    executionSpeed: '3.8ms',
    riskReward: '1 : 2.85',
    statusText: 'Expansion Move · Breakeven Locked',
    session: 'London Expansion',
    candles: [
      { x: 30, o: 120, c: 116, h: 113, l: 123, bull: true },
      { x: 70, o: 117, c: 121, h: 114, l: 124, bull: false },
      { x: 110, o: 120, c: 110, h: 107, l: 122, bull: true },
      { x: 150, o: 111, c: 104, h: 101, l: 113, bull: true },
      { x: 190, o: 105, c: 90, h: 86, l: 107, bull: true },
      { x: 230, o: 91, c: 94, h: 88, l: 98, bull: false },
      { x: 270, o: 93, c: 78, h: 75, l: 95, bull: true },
      { x: 310, o: 79, c: 68, h: 64, l: 81, bull: true },
      { x: 350, o: 69, c: 60, h: 56, l: 71, bull: true },
      { x: 390, o: 61, c: 63, h: 58, l: 66, bull: false },
      { x: 430, o: 62, c: 46, h: 42, l: 64, bull: true },
      { x: 470, o: 47, c: 36, h: 32, l: 50, bull: true },
      { x: 510, o: 37, c: 24, h: 20, l: 39, bull: true },
      { x: 550, o: 25, c: 27, h: 22, l: 30, bull: false },
      { x: 590, o: 26, c: 14, h: 10, l: 28, bull: true },
    ],
    slY: 138,
    entryY: 92,
    tpY: 28,
    orderBlockY: 84,
  },
  {
    id: 'scalper-pro',
    name: 'Institutional Scalper Pro',
    tag: 'US30 · M5',
    category: 'Indices',
    platform: 'MT4 & MT5',
    accentColor: '#10B981',
    accentGlow: 'rgba(16, 185, 129, 0.15)',
    accentBorder: 'rgba(16, 185, 129, 0.4)',
    badgeClass: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
    orderType: 'BUY PULLBACK',
    lotSize: '1.50 Lots',
    entryPrice: '43,890.0',
    currentPrice: '44,025.0',
    stopLoss: '43,780.0',
    takeProfit: '44,180.0',
    floatingPnl: '+$2,180.00',
    pnlPct: '+4.80%',
    winRate: '74.6%',
    profitFactor: '2.18',
    maxDd: '3.6%',
    totalGain: '+82.1%',
    executionSpeed: '4.6ms',
    riskReward: '1 : 2.63',
    statusText: 'Wall St Volume Capture · Active',
    session: 'New York Open Flow',
    candles: [
      { x: 30, o: 136, c: 130, h: 126, l: 138, bull: true },
      { x: 70, o: 131, c: 134, h: 128, l: 137, bull: false },
      { x: 110, o: 133, c: 120, h: 116, l: 135, bull: true },
      { x: 150, o: 121, c: 112, h: 108, l: 123, bull: true },
      { x: 190, o: 113, c: 96, h: 92, l: 115, bull: true },
      { x: 230, o: 97, c: 102, h: 94, l: 105, bull: false },
      { x: 270, o: 101, c: 84, h: 80, l: 103, bull: true },
      { x: 310, o: 85, c: 72, h: 68, l: 87, bull: true },
      { x: 350, o: 73, c: 64, h: 60, l: 75, bull: true },
      { x: 390, o: 65, c: 68, h: 62, l: 70, bull: false },
      { x: 430, o: 67, c: 48, h: 44, l: 69, bull: true },
      { x: 470, o: 49, c: 36, h: 32, l: 51, bull: true },
      { x: 510, o: 37, c: 22, h: 18, l: 40, bull: true },
      { x: 550, o: 23, c: 26, h: 20, l: 28, bull: false },
      { x: 590, o: 25, c: 12, h: 8, l: 27, bull: true },
    ],
    slY: 144,
    entryY: 98,
    tpY: 20,
    orderBlockY: 90,
  },
];

export default function InstitutionalTerminalHero({ botCount = 4, onNavigate }) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [pnlPulse, setPnlPulse] = useState(false);
  const activeStrat = STRATEGIES[activeIdx] || STRATEGIES[0];

  useEffect(() => {
    const timer = setInterval(() => {
      setPnlPulse(true);
      setTimeout(() => setPnlPulse(false), 800);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative mx-auto mt-10 max-w-5xl px-2 sm:px-4 text-left select-none">
      {/* Ambient background glow keyed to active strategy */}
      <div
        className="pointer-events-none absolute -inset-2 rounded-3xl opacity-30 blur-2xl transition-colors duration-700"
        style={{ backgroundColor: activeStrat.accentColor }}
      />

      {/* Main Terminal Window Frame */}
      <div className="relative rounded-2xl border border-slate-700/80 dark:border-white/10 bg-slate-950 text-slate-100 shadow-2xl overflow-hidden backdrop-blur-xl">
        {/* Terminal Header Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 bg-slate-900/90 px-4 py-3 sm:px-6">
          {/* Left: Window Controls + Desk Identifier */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-full bg-rose-500/80 border border-rose-600 inline-block" />
              <span className="h-3 w-3 rounded-full bg-amber-500/80 border border-amber-600 inline-block" />
              <span className="h-3 w-3 rounded-full bg-emerald-500/80 border border-emerald-600 inline-block" />
            </div>
            <div className="h-4 w-px bg-slate-800 hidden sm:block" />
            <div className="flex items-center gap-2 font-mono text-xs text-slate-300">
              <Terminal className="h-3.5 w-3.5 text-emerald-400" />
              <span className="font-semibold text-white">AKG ALGO EXECUTION DESK</span>
              <span className="hidden md:inline rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-400">v3.4.1</span>
            </div>
          </div>

          {/* Right: Live Connectivity & Latency Telemetry */}
          <div className="flex items-center gap-3 font-mono text-[11px]">
            <div className="flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
              <span className="font-bold">BRIDGE: CONNECTED</span>
            </div>
            <div className="hidden sm:flex items-center gap-1.5 text-slate-400">
              <Activity className="h-3 w-3 text-cyan-400" />
              <span>PING: <strong className="text-slate-200">{activeStrat.executionSpeed}</strong></span>
            </div>
            <div className="hidden lg:flex items-center gap-1 text-slate-400">
              <span>DESK:</span>
              <strong className="text-slate-200">{activeStrat.session}</strong>
            </div>
          </div>
        </div>

        {/* Strategy Switcher Bar */}
        <div className="flex items-center gap-1 overflow-x-auto border-b border-slate-800/90 bg-slate-900/50 p-2 sm:px-4 no-scrollbar">
          <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider px-2 shrink-0 hidden sm:block">
            ACTIVE ALGORITHMS:
          </div>
          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            {STRATEGIES.map((strat, i) => {
              const isSelected = activeIdx === i;
              return (
                <button
                  key={strat.id}
                  onClick={() => setActiveIdx(i)}
                  className={`relative flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-mono transition-colors shrink-0 cursor-pointer active:scale-[0.98] ${
                    isSelected
                      ? 'text-white font-bold bg-slate-800 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
                  }`}
                >
                  {isSelected && (
                    <motion.div
                      layoutId="activeStrategyTab"
                      className="absolute inset-0 rounded-lg border"
                      style={{ borderColor: strat.accentBorder, backgroundColor: strat.accentGlow }}
                      transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                    />
                  )}
                  <span
                    className="relative z-10 h-2 w-2 rounded-full"
                    style={{ backgroundColor: strat.accentColor }}
                  />
                  <span className="relative z-10">{strat.tag}</span>
                  {isSelected && (
                    <span className="relative z-10 hidden md:inline rounded text-[10px] font-bold px-1 py-0.2" style={{ color: strat.accentColor }}>
                      {strat.winRate} WR
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="ml-auto hidden sm:flex items-center gap-2 font-mono text-[11px] text-slate-400 pr-2">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
            <span className="text-emerald-400 font-semibold">100% NON-MARTINGALE</span>
          </div>
        </div>

        {/* Live Terminal Canvas: Chart + Telemetry Sidecar */}
        <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[340px]">
          {/* Main Chart Area (7 Cols on desktop) */}
          <div className="relative p-4 sm:p-6 lg:col-span-8 border-b lg:border-b-0 lg:border-r border-slate-800/80 flex flex-col justify-between overflow-hidden bg-gradient-to-b from-slate-950 via-slate-900/60 to-slate-950">
            {/* Chart Header Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-display font-bold text-base sm:text-lg text-white">
                    {activeStrat.name}
                  </h3>
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${activeStrat.badgeClass}`}>
                    {activeStrat.platform}
                  </span>
                </div>
                <p className="text-xs font-mono text-slate-400 mt-0.5 flex items-center gap-2">
                  <span>PAIR: <strong className="text-white">{activeStrat.tag}</strong></span>
                  <span>·</span>
                  <span>MODE: <strong className="text-slate-200">{activeStrat.category}</strong></span>
                </p>
              </div>

              {/* Dynamic Live Floating P&L Indicator */}
              <div
                className={`rounded-xl border px-3 py-1.5 font-mono text-right transition-all duration-300 ${
                  pnlPulse ? 'scale-105 shadow-lg' : ''
                }`}
                style={{
                  borderColor: activeStrat.accentBorder,
                  backgroundColor: activeStrat.accentGlow,
                }}
              >
                <div className="text-[10px] uppercase tracking-wider text-slate-400 font-medium flex items-center justify-end gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Floating P&amp;L</span>
                </div>
                <div className="font-extrabold text-base sm:text-lg text-emerald-400 flex items-center justify-end gap-1.5">
                  <span>{activeStrat.floatingPnl}</span>
                  <span className="text-xs font-semibold text-emerald-300">({activeStrat.pnlPct})</span>
                </div>
              </div>
            </div>

            {/* Interactive SVG Chart Visualizer */}
            <div className="relative my-2 w-full h-[210px] sm:h-[230px] rounded-xl bg-slate-950/80 border border-slate-800/70 p-2 overflow-hidden select-none">
              {/* Background Grid Pattern */}
              <div
                className="absolute inset-0 opacity-15 pointer-events-none"
                style={{
                  backgroundImage:
                    'linear-gradient(to right, rgba(255, 255, 255, 0.1) 1px, transparent 1px), linear-gradient(to bottom, rgba(255, 255, 255, 0.1) 1px, transparent 1px)',
                  backgroundSize: '36px 36px',
                }}
              />

              <svg viewBox="0 0 620 170" className="w-full h-full overflow-visible">
                <defs>
                  <linearGradient id="areaGlow" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor={activeStrat.accentColor} stopOpacity="0.28" />
                    <stop offset="100%" stopColor={activeStrat.accentColor} stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Shaded Liquidity / Order Block mitigation zone */}
                <rect
                  x="18"
                  y={activeStrat.orderBlockY}
                  width="580"
                  height="26"
                  fill={activeStrat.accentColor}
                  fillOpacity="0.08"
                  rx="3"
                />
                <text
                  x="170"
                  y={activeStrat.orderBlockY + 16}
                  fill={activeStrat.accentColor}
                  fontSize="8"
                  fontFamily="monospace"
                  fontWeight="600"
                  opacity="0.85"
                >
                  ORDER BLOCK MITIGATION ZONE [LIQUIDITY SWEEP]
                </text>

                {/* Take Profit Target Line */}
                <line
                  x1="18"
                  y1={activeStrat.tpY}
                  x2="598"
                  y2={activeStrat.tpY}
                  stroke="#10B981"
                  strokeWidth="1.2"
                  strokeDasharray="4 4"
                  opacity="0.85"
                />
                <rect x="475" y={activeStrat.tpY - 9} width="122" height="17" rx="3" fill="#10B981" fillOpacity="0.2" stroke="#10B981" strokeWidth="0.8" />
                <text x="483" y={activeStrat.tpY + 3} fill="#34D399" fontSize="8.5" fontFamily="monospace" fontWeight="bold">
                  TARGET TP: {activeStrat.takeProfit}
                </text>

                {/* Active Entry Line */}
                <line
                  x1="18"
                  y1={activeStrat.entryY}
                  x2="598"
                  y2={activeStrat.entryY}
                  stroke={activeStrat.accentColor}
                  strokeWidth="1.2"
                  strokeDasharray="2 2"
                  opacity="0.85"
                />
                <rect x="24" y={activeStrat.entryY - 9} width="130" height="17" rx="3" fill="#0F172A" stroke={activeStrat.accentColor} strokeWidth="1" />
                <text x="29" y={activeStrat.entryY + 3} fill="#F8FAFC" fontSize="8.5" fontFamily="monospace" fontWeight="bold">
                  {activeStrat.orderType} @ {activeStrat.entryPrice}
                </text>

                {/* Hard Stop Loss Line */}
                <line
                  x1="18"
                  y1={activeStrat.slY}
                  x2="598"
                  y2={activeStrat.slY}
                  stroke="#EF4444"
                  strokeWidth="1.2"
                  strokeDasharray="4 4"
                  opacity="0.85"
                />
                <rect x="465" y={activeStrat.slY - 9} width="132" height="17" rx="3" fill="#EF4444" fillOpacity="0.2" stroke="#EF4444" strokeWidth="0.8" />
                <text x="473" y={activeStrat.slY + 3} fill="#FCA5A5" fontSize="8.5" fontFamily="monospace" fontWeight="bold">
                  HARD SL: {activeStrat.stopLoss}
                </text>

                {/* Candlesticks */}
                {activeStrat.candles.map((c, i) => {
                  const candleColor = c.bull ? '#10B981' : '#EF4444';
                  const top = Math.min(c.o, c.c);
                  const height = Math.max(Math.abs(c.c - c.o), 3);
                  return (
                    <g key={i}>
                      {/* Wick */}
                      <line
                        x1={c.x}
                        y1={c.h}
                        x2={c.x}
                        y2={c.l}
                        stroke={candleColor}
                        strokeWidth="1.2"
                        opacity="0.85"
                      />
                      {/* Body */}
                      <rect
                        x={c.x - 5}
                        y={top}
                        width="10"
                        height={height}
                        rx="1"
                        fill={candleColor}
                      />
                    </g>
                  );
                })}

                {/* Area Gradient fill under the price path */}
                <path
                  d="M 30,130 C 110,125 190,110 270,92 C 350,75 430,55 510,35 L 590,16 L 590,160 L 30,160 Z"
                  fill="url(#areaGlow)"
                />

                {/* Spline Path */}
                <path
                  d="M 30,130 C 110,125 190,110 270,92 C 350,75 430,55 510,35 L 590,16"
                  fill="none"
                  stroke={activeStrat.accentColor}
                  strokeWidth="2.2"
                  strokeLinecap="round"
                />

                {/* Live Current Price Beacon Dot */}
                <circle cx="590" cy="16" r="4.5" fill="#FFFFFF" />
                <circle cx="590" cy="16" r="8.5" fill={activeStrat.accentColor} fillOpacity="0.4" className="animate-ping" />
              </svg>

              {/* Bottom Chart Status Strip */}
              <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between text-[10px] font-mono text-slate-400 bg-slate-900/80 px-2 py-1 rounded backdrop-blur-sm border border-white/5">
                <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  {activeStrat.statusText}
                </span>
                <span className="hidden sm:inline text-slate-300">
                  R:R {activeStrat.riskReward} · LOT {activeStrat.lotSize}
                </span>
              </div>
            </div>
          </div>

          {/* Execution Telemetry Sidecar (4 Cols on desktop) */}
          <div className="p-4 sm:p-6 lg:col-span-4 flex flex-col justify-between bg-slate-900/40">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
                  EXECUTION TELEMETRY
                </span>
                <span className="font-mono text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  LIVE DESK
                </span>
              </div>

              {/* Metric Grid */}
              <div className="mt-4 grid grid-cols-2 gap-2.5 font-mono">
                <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-2.5">
                  <div className="text-[10px] text-slate-400 font-medium">Audited Win Rate</div>
                  <div className="mt-1 text-base font-extrabold text-emerald-400">{activeStrat.winRate}</div>
                  <div className="text-[10px] text-slate-400">240+ closed trades</div>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-2.5">
                  <div className="text-[10px] text-slate-400 font-medium">Profit Factor</div>
                  <div className="mt-1 text-base font-extrabold text-white">{activeStrat.profitFactor}</div>
                  <div className="text-[10px] text-slate-400">Institutional baseline</div>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-2.5">
                  <div className="text-[10px] text-slate-400 font-medium">Max Drawdown</div>
                  <div className="mt-1 text-base font-extrabold text-cyan-400">{activeStrat.maxDd}</div>
                  <div className="text-[10px] text-slate-400">Peak-to-valley cap</div>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-2.5">
                  <div className="text-[10px] text-slate-400 font-medium">Net Realized Gain</div>
                  <div className="mt-1 text-base font-extrabold text-amber-400">{activeStrat.totalGain}</div>
                  <div className="text-[10px] text-slate-400">Audited equity</div>
                </div>
              </div>

              {/* Strategy Guardrail Checklist */}
              <div className="mt-4 space-y-2 rounded-xl border border-slate-800/80 bg-slate-950/40 p-3 font-mono text-[11px]">
                <div className="flex items-center justify-between text-slate-300">
                  <span className="text-slate-400">Risk Model</span>
                  <span className="font-semibold text-emerald-400">Fixed Hard Stop</span>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span className="text-slate-400">Martingale / Grid</span>
                  <span className="font-semibold text-rose-400">Strictly Prohibited</span>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span className="text-slate-400">License Delivery</span>
                  <span className="font-semibold text-slate-200">Instant Automated</span>
                </div>
              </div>
            </div>

            {/* Quick Action Navigation Buttons */}
            <div className="mt-5 space-y-2 pt-2 border-t border-slate-800/80">
              <button
                onClick={() => onNavigate('bots')}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-2.5 text-xs font-bold font-sans text-slate-950 hover:from-emerald-400 hover:to-teal-400 transition-all shadow-md active:scale-[0.98] cursor-pointer"
              >
                <span>Inspect All {botCount} Robots</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => onNavigate('signals')}
                className="w-full flex items-center justify-center gap-2 rounded-xl border border-slate-700 hover:border-slate-600 bg-slate-800/80 hover:bg-slate-800 px-4 py-2 text-xs font-semibold font-sans text-slate-200 transition-colors active:scale-[0.98] cursor-pointer"
              >
                <Terminal className="h-3.5 w-3.5 text-emerald-400" />
                <span>Open Signal Room Preview</span>
              </button>
            </div>
          </div>
        </div>

        {/* Integrated 4-Metric Dock Strip */}
        <div className="border-t border-slate-800 bg-slate-950/95">
          <div className="grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-slate-800/90">
            <div className="p-4 sm:p-5 flex flex-col justify-between">
              <div className="text-xs font-semibold font-mono text-slate-400">Robots</div>
              <div className="mt-1.5 font-mono text-2xl sm:text-3xl font-extrabold text-white">
                <CountUp value={botCount} />
              </div>
              <div className="mt-1 text-xs text-slate-400 font-medium">2 free included</div>
            </div>

            <div className="p-4 sm:p-5 flex flex-col justify-between">
              <div className="text-xs font-semibold font-mono text-slate-400">On our own accounts</div>
              <div className="mt-1.5 font-mono text-2xl sm:text-3xl font-extrabold text-emerald-400">
                <CountUp value={33} />
              </div>
              <div className="mt-1 text-xs text-emerald-400 font-semibold">Live verified</div>
            </div>

            <div className="p-4 sm:p-5 flex flex-col justify-between">
              <div className="text-xs font-semibold font-mono text-slate-400">Drawdown published</div>
              <div className="mt-1.5 font-mono text-2xl sm:text-3xl font-extrabold text-white">
                <CountUp value={36} />
              </div>
              <div className="mt-1 text-xs text-slate-400 font-medium">Max peak-to-valley</div>
            </div>

            <div className="p-4 sm:p-5 flex flex-col justify-between">
              <div className="text-xs font-semibold font-mono text-slate-400">Symbols traded</div>
              <div className="mt-1.5 font-mono text-2xl sm:text-3xl font-extrabold text-sky-400">
                <CountUp value={37} />
              </div>
              <div className="mt-1 text-xs text-sky-400 font-semibold">Forex, Gold &amp; Indices</div>
            </div>
          </div>
        </div>
      </div>

      {/* Trust & Proof Guarantee Seals */}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5 sm:gap-3 text-xs font-semibold">
        <div className="flex items-center gap-2 rounded-full border border-slate-200/90 dark:border-white/10 bg-white/90 dark:bg-slate-900/90 px-3.5 py-1.5 text-slate-800 dark:text-slate-200 shadow-xs backdrop-blur-sm">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>MetaTrader 4 &amp; 5 Native (.ex4 / .ex5)</span>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-slate-200/90 dark:border-white/10 bg-white/90 dark:bg-slate-900/90 px-3.5 py-1.5 text-slate-800 dark:text-slate-200 shadow-xs backdrop-blur-sm">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>Audited MyFxBook Performance Records</span>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-slate-200/90 dark:border-white/10 bg-white/90 dark:bg-slate-900/90 px-3.5 py-1.5 text-slate-800 dark:text-slate-200 shadow-xs backdrop-blur-sm">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>Zero Martingale / Hard Stop Loss Enforced</span>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-slate-200/90 dark:border-white/10 bg-white/90 dark:bg-slate-900/90 px-3.5 py-1.5 text-slate-800 dark:text-slate-200 shadow-xs backdrop-blur-sm">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>Instant Automated License Key Delivery</span>
        </div>
      </div>
    </div>
  );
}
