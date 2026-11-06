import { useState, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp,
  ShieldCheck,
  Zap,
  Activity,
  ArrowUpRight,
  Sliders,
  CheckCircle2,
  Lock,
  Cpu,
  Layers,
} from 'lucide-react';
import { cn } from '../lib/utils';

const STRATEGIES = [
  {
    id: 'gold-scalper',
    name: 'Apex Gold Scalper Pro',
    symbol: 'XAU/USD',
    type: 'Volatility Breakout',
    riskLevel: 'Disciplined',
    returnPct: '+194.2%',
    profitFactor: '2.48',
    maxDrawdown: '3.9%',
    winRate: '78.4%',
    trades: '512',
    avgDuration: '38m',
    equityData: [
      10000, 10850, 11400, 12100, 11950, 13400, 14200, 15800, 15450, 17200, 18900, 20400,
      19800, 22100, 24300, 26100, 25700, 27400, 29420,
    ],
    recentOrders: [
      { time: '10:58:14', type: 'BUY', symbol: 'XAUUSD', lots: '0.25', entry: '2642.50', exit: '2652.00', pnl: '+$237.50', status: 'TP HIT' },
      { time: '09:41:02', type: 'BUY', symbol: 'XAUUSD', lots: '0.25', entry: '2636.10', exit: '2644.80', pnl: '+$217.50', status: 'TP HIT' },
      { time: '08:15:30', type: 'SELL', symbol: 'XAUUSD', lots: '0.25', entry: '2648.20', exit: '2644.00', pnl: '+$105.00', status: 'TRAIL' },
    ],
  },
  {
    id: 'alpha-momentum',
    name: 'Alpha Momentum EA',
    symbol: 'EUR/USD',
    type: 'Trend Continuation',
    riskLevel: 'Conservative',
    returnPct: '+128.5%',
    profitFactor: '2.18',
    maxDrawdown: '3.4%',
    winRate: '73.8%',
    trades: '388',
    avgDuration: '2h 15m',
    equityData: [
      10000, 10420, 10900, 11250, 11800, 12100, 12950, 13400, 13150, 14600, 15400, 16250,
      16900, 17800, 18450, 19200, 20100, 21400, 22850,
    ],
    recentOrders: [
      { time: '10:52:01', type: 'SELL', symbol: 'EURUSD', lots: '0.50', entry: '1.0844', exit: '1.0805', pnl: '+$195.00', status: 'TP HIT' },
      { time: '08:33:18', type: 'BUY', symbol: 'EURUSD', lots: '0.50', entry: '1.0790', exit: '1.0825', pnl: '+$175.00', status: 'TP HIT' },
      { time: '06:12:44', type: 'SELL', symbol: 'EURUSD', lots: '0.50', entry: '1.0860', exit: '1.0842', pnl: '+$90.00', status: 'TRAIL' },
    ],
  },
  {
    id: 'grid-shield',
    name: 'Multi-Pair Grid Shield',
    symbol: 'GBP/USD + USD/CAD',
    type: 'Mean Reversion & Delta Hedge',
    riskLevel: 'Balanced',
    returnPct: '+246.0%',
    profitFactor: '2.64',
    maxDrawdown: '4.8%',
    winRate: '84.1%',
    trades: '740',
    avgDuration: '4h 10m',
    equityData: [
      10000, 10700, 11600, 12800, 13400, 14900, 16200, 17100, 18600, 19400, 21200, 23000,
      24100, 26000, 27800, 29900, 31400, 32900, 34600,
    ],
    recentOrders: [
      { time: '10:45:10', type: 'BUY', symbol: 'GBPUSD', lots: '0.30', entry: '1.2915', exit: '1.2952', pnl: '+$111.00', status: 'HEDGE CLOSE' },
      { time: '09:20:00', type: 'SELL', symbol: 'USDCAD', lots: '0.30', entry: '1.3840', exit: '1.3810', pnl: '+$90.00', status: 'TP HIT' },
      { time: '07:18:22', type: 'BUY', symbol: 'GBPUSD', lots: '0.30', entry: '1.2880', exit: '1.2930', pnl: '+$150.00', status: 'TP HIT' },
    ],
  },
];

export function InteractiveTradingTerminal({ onDeploy }) {
  const [activeStrategyIndex, setActiveStrategyIndex] = useState(0);
  const [hoverIndex, setHoverIndex] = useState(null);
  const strategy = STRATEGIES[activeStrategyIndex];

  // SVG Chart Geometry calculations
  const chartPoints = useMemo(() => {
    const raw = strategy.equityData;
    const min = Math.min(...raw);
    const max = Math.max(...raw);
    const range = max - min || 1;

    const width = 640;
    const height = 180;
    const paddingX = 20;
    const paddingY = 25;

    const stepX = (width - paddingX * 2) / (raw.length - 1);
    const pts = raw.map((val, idx) => {
      const x = paddingX + idx * stepX;
      const normalized = (val - min) / range;
      const y = height - paddingY - normalized * (height - paddingY * 2);
      return { x, y, val };
    });

    const linePath = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
    const areaPath = `${linePath} L ${pts[pts.length - 1].x.toFixed(1)} ${height} L ${pts[0].x.toFixed(1)} ${height} Z`;

    return { pts, linePath, areaPath, width, height };
  }, [strategy]);

  const activePoint = hoverIndex !== null && chartPoints.pts[hoverIndex]
    ? chartPoints.pts[hoverIndex]
    : chartPoints.pts[chartPoints.pts.length - 1];

  return (
    <div className="relative w-full rounded-2xl border border-emerald-500/20 bg-akg-card shadow-2xl overflow-hidden backdrop-blur-xl card-depth">
      {/* Top Chrome Header */}
      <div className="flex flex-wrap items-center justify-between border-b border-akg-hairline bg-akg-bg/60 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/80 shadow-sm" />
            <span className="h-2.5 w-2.5 rounded-full bg-teal-500/80 shadow-sm" />
            <span className="h-2.5 w-2.5 rounded-full bg-cyan-500/80 shadow-sm" />
          </div>
          <span className="font-mono text-xs font-semibold text-akg-text tracking-wide">
            AKG Quantitative Terminal <span className="text-emerald-500 font-bold">v2.4</span>
          </span>
          <div className="hidden sm:flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-mono text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
              11ms Execution • MT4/MT5 Socket Active
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-akg-hairline bg-akg-card px-2.5 py-1 font-mono text-[11px] text-akg-muted">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
            <span>Risk Guard: 3.0% Max DD Cap</span>
          </span>
        </div>
      </div>

      {/* Strategy Selector Tabs */}
      <div className="border-b border-akg-hairline bg-akg-tint/40 px-3 py-2 sm:px-6">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          {STRATEGIES.map((strat, idx) => {
            const isActive = idx === activeStrategyIndex;
            return (
              <button
                key={strat.id}
                onClick={() => {
                  setActiveStrategyIndex(idx);
                  setHoverIndex(null);
                }}
                className={cn(
                  'relative flex items-center gap-2.5 rounded-xl px-3.5 py-2 text-xs font-medium transition-all shrink-0 cursor-pointer',
                  isActive
                    ? 'text-akg-text font-bold shadow-sm'
                    : 'text-akg-muted hover:text-akg-text hover:bg-akg-card/50'
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeStrategyPill"
                    className="absolute inset-0 rounded-xl bg-akg-card border border-emerald-500/30 shadow-md"
                    transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-2">
                  <span className={cn('h-2 w-2 rounded-full', isActive ? 'bg-emerald-500' : 'bg-akg-muted/40')} />
                  <span>{strat.name}</span>
                  <span className="rounded bg-akg-tint px-1.5 py-0.5 font-mono text-[10px] text-emerald-600 dark:text-emerald-400">
                    {strat.symbol}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Terminal Stage */}
      <div className="p-4 sm:p-6">
        {/* KPI Row */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:gap-4">
          <div className="rounded-xl border border-akg-hairline bg-akg-card/60 p-3.5 backdrop-blur-sm">
            <div className="flex items-center justify-between text-akg-muted">
              <span className="text-xs font-medium">Cumulative Return</span>
              <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
            </div>
            <div className="mt-1.5 font-mono text-xl sm:text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
              {strategy.returnPct}
            </div>
            <div className="mt-1 text-[11px] text-akg-muted">Live Forward Statement</div>
          </div>

          <div className="rounded-xl border border-akg-hairline bg-akg-card/60 p-3.5 backdrop-blur-sm">
            <div className="flex items-center justify-between text-akg-muted">
              <span className="text-xs font-medium">Profit Factor</span>
              <Activity className="h-3.5 w-3.5 text-teal-500" />
            </div>
            <div className="mt-1.5 font-mono text-xl sm:text-2xl font-bold tracking-tight text-akg-text">
              {strategy.profitFactor}
            </div>
            <div className="mt-1 text-[11px] text-akg-muted">Gross Profit / Gross Loss</div>
          </div>

          <div className="rounded-xl border border-akg-hairline bg-akg-card/60 p-3.5 backdrop-blur-sm">
            <div className="flex items-center justify-between text-akg-muted">
              <span className="text-xs font-medium">Max Drawdown</span>
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
            </div>
            <div className="mt-1.5 font-mono text-xl sm:text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
              {strategy.maxDrawdown}
            </div>
            <div className="mt-1 text-[11px] text-akg-muted">Hard Breaker Protected</div>
          </div>

          <div className="rounded-xl border border-akg-hairline bg-akg-card/60 p-3.5 backdrop-blur-sm">
            <div className="flex items-center justify-between text-akg-muted">
              <span className="text-xs font-medium">Win Ratio</span>
              <Zap className="h-3.5 w-3.5 text-cyan-500" />
            </div>
            <div className="mt-1.5 font-mono text-xl sm:text-2xl font-bold tracking-tight text-akg-text">
              {strategy.winRate}
            </div>
            <div className="mt-1 text-[11px] text-akg-muted">{strategy.trades} trades executed</div>
          </div>
        </div>

        {/* Dynamic Equity Curve with Interactive Scrub */}
        <div className="relative mt-5 rounded-xl border border-akg-hairline bg-akg-bg/50 p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-semibold text-akg-text">Growth Profile</span>
              <span className="rounded bg-emerald-500/10 px-2 py-0.5 font-mono text-[10px] text-emerald-600 dark:text-emerald-400">
                Forward Testing Account
              </span>
            </div>
            <div className="font-mono text-xs text-akg-muted">
              Current Capital:{' '}
              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                ${activePoint.val.toLocaleString()}
              </span>
            </div>
          </div>

          <div className="relative h-44 w-full cursor-crosshair">
            <svg
              viewBox={`0 0 ${chartPoints.width} ${chartPoints.height}`}
              preserveAspectRatio="none"
              className="h-full w-full overflow-visible"
              onMouseMove={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const mouseX = e.clientX - rect.left;
                const ratio = mouseX / rect.width;
                const idx = Math.min(
                  chartPoints.pts.length - 1,
                  Math.max(0, Math.round(ratio * (chartPoints.pts.length - 1)))
                );
                setHoverIndex(idx);
              }}
              onMouseLeave={() => setHoverIndex(null)}
            >
              <defs>
                <linearGradient id="eqGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10B981" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#06B6D4" stopOpacity="0.00" />
                </linearGradient>
                <linearGradient id="eqStroke" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#059669" />
                  <stop offset="60%" stopColor="#10B981" />
                  <stop offset="100%" stopColor="#06B6D4" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              <line x1="20" y1="40" x2="620" y2="40" stroke="currentColor" strokeOpacity="0.06" strokeDasharray="3 3" />
              <line x1="20" y1="90" x2="620" y2="90" stroke="currentColor" strokeOpacity="0.06" strokeDasharray="3 3" />
              <line x1="20" y1="140" x2="620" y2="140" stroke="currentColor" strokeOpacity="0.06" strokeDasharray="3 3" />

              {/* Area Fill */}
              <motion.path
                key={`area-${strategy.id}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4 }}
                d={chartPoints.areaPath}
                fill="url(#eqGradient)"
              />

              {/* Line Stroke */}
              <motion.path
                key={`line-${strategy.id}`}
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                d={chartPoints.linePath}
                fill="none"
                stroke="url(#eqStroke)"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Interactive Scrub Line & Dot */}
              {hoverIndex !== null && (
                <>
                  <line
                    x1={activePoint.x}
                    y1="10"
                    x2={activePoint.x}
                    y2="170"
                    stroke="#10B981"
                    strokeWidth="1.5"
                    strokeDasharray="2 2"
                  />
                  <circle
                    cx={activePoint.x}
                    cy={activePoint.y}
                    r="5"
                    fill="#10B981"
                    className="shadow-lg"
                  />
                  <circle
                    cx={activePoint.x}
                    cy={activePoint.y}
                    r="9"
                    fill="none"
                    stroke="#10B981"
                    strokeWidth="1.5"
                    strokeOpacity="0.5"
                  />
                </>
              )}
            </svg>
          </div>
        </div>

        {/* Live Simulated Order Feed & Quick Deploy */}
        <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex-1 rounded-xl border border-akg-hairline bg-akg-card/40 p-3">
            <div className="flex items-center justify-between text-xs font-semibold text-akg-muted mb-2">
              <span className="flex items-center gap-1.5 font-mono">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Execution Feed
              </span>
              <span className="font-mono text-[10px] text-akg-muted">Sub-15ms WebSocket stream</span>
            </div>

            <div className="space-y-1.5">
              {strategy.recentOrders.map((ord, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-lg bg-akg-bg/50 px-2.5 py-1.5 font-mono text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-akg-muted text-[11px]">{ord.time}</span>
                    <span
                      className={cn(
                        'rounded px-1.5 py-0.2 text-[10px] font-bold',
                        ord.type === 'BUY'
                          ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                          : 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                      )}
                    >
                      {ord.type}
                    </span>
                    <span className="font-semibold text-akg-text">{ord.symbol}</span>
                    <span className="text-akg-muted text-[11px]">{ord.lots} lot</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">{ord.pnl}</span>
                    <span className="rounded border border-akg-hairline bg-akg-card px-1.5 py-0.5 text-[9px] text-akg-muted">
                      {ord.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Trigger */}
          <div className="shrink-0 flex sm:flex-col justify-end gap-2">
            <button
              onClick={() => onDeploy?.(strategy.id)}
              className="btn-cyan-emerald inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-xs font-bold cursor-pointer"
            >
              <span>Deploy on MetaTrader</span>
              <ArrowUpRight className="h-4 w-4" />
            </button>
            <div className="text-center font-mono text-[10px] text-akg-muted hidden sm:block">
              Includes MQL4 & MQL5 binaries
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
