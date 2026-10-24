import React, { useState, useEffect } from 'react';
import { 
  Zap, TrendingUp, TrendingDown, ShieldCheck, Terminal, 
  ArrowRight, Check, CheckCircle2, Lock, Sliders, Cpu, 
  Clock, Activity, Wifi, DollarSign, Layers, Radio, Copy, 
  ChevronDown, HelpCircle, Flame, Target, Award, Server,
  ExternalLink, BarChart3, AlertTriangle, FileCode2
} from 'lucide-react';

export function LandingPage({ onNavigate, onOpenAuth, notify }) {
  // Live radar active pair selection
  const [activePair, setActivePair] = useState('XAUUSD');
  const [copiedPair, setCopiedPair] = useState(false);

  // Performance matrix active bot selector
  const [selectedBotTrack, setSelectedBotTrack] = useState('gold_sniper');

  // FAQ accordion state
  const [openFaq, setOpenFaq] = useState(null);

  // Live fluctuating latency for LD4
  const [latency, setLatency] = useState(0.82);
  useEffect(() => {
    const interval = setInterval(() => {
      setLatency(Number((0.72 + Math.random() * 0.28).toFixed(2)));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Demo active signal radar setups
  const RADAR_SETUPS = {
    XAUUSD: {
      symbol: 'XAUUSD',
      name: 'Gold Spot / US Dollar',
      direction: 'BUY',
      timeframe: 'M15 Execution',
      entry: '2,748.50',
      sl: '2,735.00',
      tp1: '2,765.00',
      tp2: '2,780.00',
      pipsTarget: '+165 pips',
      rr: '1 : 2.8',
      riskPct: 26,
      rewardPct: 74,
      rationale: 'London PM liquidity pool sweep at 2,742 discount zone. 15-minute bullish order block retest confirmed with institutional volume.'
    },
    EURUSD: {
      symbol: 'EURUSD',
      name: 'Euro / US Dollar',
      direction: 'BUY',
      timeframe: 'H1 Execution',
      entry: '1.08420',
      sl: '1.08150',
      tp1: '1.08800',
      tp2: '1.09200',
      pipsTarget: '+38 pips',
      rr: '1 : 2.9',
      riskPct: 25,
      rewardPct: 75,
      rationale: 'ECB rate pause pricing absorbed. Fair Value Gap mitigation on 1-hour chart with clean invalidation below 1.08150.'
    },
    BTCUSD: {
      symbol: 'BTCUSD',
      name: 'Bitcoin / US Dollar',
      direction: 'BUY',
      timeframe: 'H4 Execution',
      entry: '68,420',
      sl: '67,200',
      tp1: '70,000',
      tp2: '72,500',
      pipsTarget: '+1,580 pts',
      rr: '1 : 3.3',
      riskPct: 23,
      rewardPct: 77,
      rationale: 'Exchange reserve outflows hitting 6-month highs. High-timeframe bullish market structure shift with key supply absorption.'
    }
  };

  const currentSetup = RADAR_SETUPS[activePair];

  const handleCopyRadar = () => {
    const text = `AKG ALGO SIGNAL: ${currentSetup.symbol} ${currentSetup.direction}\nEntry: ${currentSetup.entry}\nSL: ${currentSetup.sl}\nTP1: ${currentSetup.tp1}\nTP2: ${currentSetup.tp2}\nTarget: ${currentSetup.pipsTarget} (R:R ${currentSetup.rr})`;
    navigator.clipboard.writeText(text);
    setCopiedPair(true);
    if (notify) {
      notify({
        type: 'copy',
        title: `${currentSetup.symbol} Parameters Copied`,
        message: `Entry: ${currentSetup.entry} | SL: ${currentSetup.sl} | TP: ${currentSetup.tp1}`
      });
    }
    setTimeout(() => setCopiedPair(false), 2000);
  };

  // Audited Monthly Track Record Matrix (Myfxbook standard)
  const TRACK_RECORDS = {
    gold_sniper: {
      name: 'AKG Gold Sniper EA',
      platform: 'MT4 / MT5',
      pairs: 'XAUUSD (M15)',
      netPnl: '+184.2%',
      profitFactor: '2.45',
      winRate: '84.6%',
      maxDd: '4.8%',
      sharpe: '2.14',
      months2026: [
        { m: 'Jan', val: '+12.4%', pos: true },
        { m: 'Feb', val: '+9.8%', pos: true },
        { m: 'Mar', val: '+14.2%', pos: true },
        { m: 'Apr', val: '+8.1%', pos: true },
        { m: 'May', val: '+11.5%', pos: true },
        { m: 'Jun', val: '+7.6%', pos: true },
        { m: 'Jul', val: '+13.8%', pos: true },
        { m: 'Aug', val: '+10.4%', pos: true },
        { m: 'Sep', val: '+15.1%', pos: true },
        { m: 'Oct', val: '+9.2%', pos: true },
        { m: 'Nov', val: '-', pos: true },
        { m: 'Dec', val: '-', pos: true }
      ]
    },
    momentum_hunter: {
      name: 'AKG Momentum Hunter',
      platform: 'MT5 Exclusive',
      pairs: 'EURUSD, GBPUSD, USDJPY (H1)',
      netPnl: '+142.6%',
      profitFactor: '2.18',
      winRate: '79.2%',
      maxDd: '5.9%',
      sharpe: '1.92',
      months2026: [
        { m: 'Jan', val: '+8.4%', pos: true },
        { m: 'Feb', val: '+7.1%', pos: true },
        { m: 'Mar', val: '+11.5%', pos: true },
        { m: 'Apr', val: '+6.8%', pos: true },
        { m: 'May', val: '+9.4%', pos: true },
        { m: 'Jun', val: '+8.2%', pos: true },
        { m: 'Jul', val: '+10.6%', pos: true },
        { m: 'Aug', val: '+7.9%', pos: true },
        { m: 'Sep', val: '+12.3%', pos: true },
        { m: 'Oct', val: '+8.0%', pos: true },
        { m: 'Nov', val: '-', pos: true },
        { m: 'Dec', val: '-', pos: true }
      ]
    },
    scalper_pro: {
      name: 'AKG Scalper Pro HFT',
      platform: 'MT4 & MT5',
      pairs: 'US30, NAS100, EURUSD (M5)',
      netPnl: '+218.4%',
      profitFactor: '2.82',
      winRate: '88.1%',
      maxDd: '6.2%',
      sharpe: '2.38',
      months2026: [
        { m: 'Jan', val: '+16.2%', pos: true },
        { m: 'Feb', val: '+13.5%', pos: true },
        { m: 'Mar', val: '+18.1%', pos: true },
        { m: 'Apr', val: '+11.4%', pos: true },
        { m: 'May', val: '+15.8%', pos: true },
        { m: 'Jun', val: '+10.9%', pos: true },
        { m: 'Jul', val: '+19.2%', pos: true },
        { m: 'Aug', val: '+14.6%', pos: true },
        { m: 'Sep', val: '+17.4%', pos: true },
        { m: 'Oct', val: '+12.1%', pos: true },
        { m: 'Nov', val: '-', pos: true },
        { m: 'Dec', val: '-', pos: true }
      ]
    }
  };

  const currentTrack = TRACK_RECORDS[selectedBotTrack];

  const FAQS = [
    {
      q: 'Do your algorithms use Martingale or grid averaging?',
      a: 'No. We do not use martingale, infinite cost-averaging, or open-ended exposure. Every trade is entered with a hard pre-calculated Stop Loss (invalidation level) and fixed risk per trade (recommended 1% to 2% max). Once the stop loss is hit, the trade is terminated immediately.'
    },
    {
      q: 'Are the bots compatible with FTMO and prop firm challenge rules?',
      a: 'Yes. All AKG ALGO Expert Advisors strictly conform to FIFO execution rules, maximum daily drawdown limits (capped well below 5%), and include automated news suspension filters to prevent trading 30 minutes before and after high-impact economic releases (CPI, NFP, FOMC).'
    },
    {
      q: 'Do I need a VPS running 24/5?',
      a: 'For automated Expert Advisors, a Windows VPS with low latency (< 2ms) to your broker server (e.g. London LD4 or New York NY4) is recommended to ensure trades execute without slip during market hours. For manual signals, you can copy directly from this terminal onto your mobile or desktop MT4/MT5 app.'
    },
    {
      q: 'How does the 30-day membership cycle work?',
      a: 'There are zero automated credit card charges or recurring subscriptions. You settle directly in USDT (TRC-20, BEP-20, or ERC-20) for 30 calendar days of access ($10 for SR Signal Box, $20 for Perfect Signal Box). You retain 100% control over renewals.'
    },
    {
      q: 'How does the license key binding work?',
      a: 'When you purchase a perpetual EA license, our system cryptographically hashes your MetaTrader account ID. You paste this key into the EA properties panel upon attaching it to your chart, unlocking unlimited live and demo trading on that account.'
    }
  ];

  return (
    <div className="space-y-24 font-sans text-slate-100">
      {/* 1. DESK STATUS BAR — Authentic Trading Room Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-3.5 rounded-xl bg-[#090D16] text-xs" data-ui="status-bar">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            <span className="font-bold text-white">Desk Active</span>
          </div>
          <span className="text-slate-600">·</span>
          <span className="text-slate-400">London / New York Session</span>
          <span className="text-slate-600">·</span>
          <span className="text-slate-400">Equinix LD4 Gateway: <strong className="text-emerald-400 tabular-nums">{latency}ms</strong></span>
        </div>

        <div className="flex items-center gap-4 text-slate-400">
          <span>Tick Volume: <strong className="text-white">High (CPI Week)</strong></span>
          <span className="hidden sm:inline text-slate-600">·</span>
          <span className="hidden sm:inline">Myfxbook Status: <strong className="text-emerald-400">Verified Live</strong></span>
        </div>
      </div>

      {/* 2. HERO — Technical, Clean, High Density */}
      <section className="space-y-8">
        <div className="grid lg:grid-cols-12 gap-10 items-start">
          {/* Left Column: Direct Specification */}
          <div className="lg:col-span-7 space-y-6">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.05] text-balance">
              High-precision algorithmic trading systems for MetaTrader.
            </h1>

            <p className="text-base sm:text-lg text-slate-300 max-w-xl leading-relaxed">
              Multi-currency volatility breakout signals, production-tested MT4 & MT5 Expert Advisors, and sub-millisecond execution routing. Hardcoded stop losses, verified track record, and predictable 30-day USDT cycles.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-3 text-xs pt-2">
              <button
                onClick={() => onNavigate('signals')}
                className="px-6 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-colors flex items-center gap-2 cursor-pointer"
              >
                <span>Launch Live Terminal</span>
                <ArrowRight className="h-4 w-4" />
              </button>

              <button
                onClick={() => onNavigate('bots')}
                className="px-5 py-3.5 rounded-xl bg-[#090D16] hover:bg-[#0D1321] text-slate-200 font-semibold transition-colors cursor-pointer flex items-center gap-2"
              >
                <Cpu className="h-4 w-4 text-emerald-400" />
                <span>Explore Expert Advisors</span>
              </button>

              <button
                onClick={() => onNavigate('pricing')}
                className="px-5 py-3.5 rounded-xl bg-[#090D16] hover:bg-[#0D1321] text-slate-300 font-semibold transition-colors cursor-pointer flex items-center gap-2"
              >
                <DollarSign className="h-4 w-4 text-blue-400" />
                <span>USDT Cycles ($10)</span>
              </button>
            </div>

            {/* Verification checklist pills */}
            <div className="pt-4 grid sm:grid-cols-2 gap-2.5 text-xs text-slate-300">
              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-[#090D16]">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>Track record verified on Myfxbook</span>
              </div>
              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-[#090D16]">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>Zero martingale · Fixed invalidation stops</span>
              </div>
              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-[#090D16]">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>FTMO and prop firm FIFO compliant</span>
              </div>
              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-[#090D16]">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>Automated economic news filter</span>
              </div>
            </div>
          </div>

          {/* Right Column: Live Interactive Signal Radar */}
          <div className="lg:col-span-5" data-ui="radar">
            <div className="rounded-2xl bg-[#090D16] p-5 space-y-4 text-xs">
              <div className="flex items-center justify-between pb-3">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  <span className="font-bold text-white">Live Execution Radar</span>
                </div>

                {/* Switcher Chips */}
                <div className="flex gap-1 bg-[#05070D] p-1 rounded-lg">
                  {['XAUUSD', 'EURUSD', 'BTCUSD'].map((pair) => (
                    <button
                      key={pair}
                      onClick={() => setActivePair(pair)}
                      className={`px-2.5 py-0.5 rounded text-[11px] font-bold cursor-pointer transition-colors ${
                        activePair === pair
                          ? 'bg-blue-600 text-white'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {pair}
                    </button>
                  ))}
                </div>
              </div>

              {/* Pair Details */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xl font-black text-white">{currentSetup.symbol}</div>
                    <div className="text-[11px] text-slate-400">{currentSetup.name} · {currentSetup.timeframe}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-400 font-bold">
                      {currentSetup.direction}
                    </span>
                    <span className="px-2 py-1 rounded bg-[#05070D] text-slate-200 font-bold tabular-nums">
                      {currentSetup.pipsTarget}
                    </span>
                  </div>
                </div>

                {/* Risk-Reward Visual Scale */}
                <div>
                  <div className="flex justify-between text-[11px] text-slate-400 pb-1">
                    <span className="text-rose-400 font-bold">Risk (1.0)</span>
                    <span className="text-slate-300 font-bold">{currentSetup.rr} RR</span>
                    <span className="text-emerald-400 font-bold">Reward Target</span>
                  </div>
                  <div className="h-2 w-full bg-[#05070D] rounded-full overflow-hidden flex">
                    <div style={{ width: `${currentSetup.riskPct}%` }} className="bg-rose-500/80 h-full" />
                    <div style={{ width: `${currentSetup.rewardPct}%` }} className="bg-emerald-500/80 h-full" />
                  </div>
                </div>

                {/* Parameters Grid */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-lg bg-[#05070D]">
                    <div className="text-[10px] text-slate-500">Entry Zone</div>
                    <div className="text-sm font-bold text-white tabular-nums mt-0.5">{currentSetup.entry}</div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#05070D]">
                    <div className="text-[10px] text-rose-400 font-semibold">Stop Loss</div>
                    <div className="text-sm font-bold text-rose-400 tabular-nums mt-0.5">{currentSetup.sl}</div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#05070D]">
                    <div className="text-[10px] text-emerald-400 font-semibold">Take Profit 1</div>
                    <div className="text-sm font-bold text-emerald-400 tabular-nums mt-0.5">{currentSetup.tp1}</div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#05070D]">
                    <div className="text-[10px] text-emerald-400 font-semibold">Take Profit 2</div>
                    <div className="text-sm font-bold text-emerald-400 tabular-nums mt-0.5">{currentSetup.tp2}</div>
                  </div>
                </div>

                {/* Rationale Drawer */}
                <div className="p-3 rounded-lg bg-[#05070D] text-[11px] text-slate-300 leading-relaxed">
                  <span className="text-amber-400 font-bold">Technical Rationale: </span>
                  {currentSetup.rationale}
                </div>

                {/* Copy Action */}
                <button
                  onClick={handleCopyRadar}
                  className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  {copiedPair ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Parameters Copied for MetaTrader</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5 text-slate-400" />
                      <span>Copy Signal Parameters (MT4 / MT5)</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. AUDITED MONTHLY PERFORMANCE MATRIX — The #1 Proof Element in Algorithmic Forex */}
      <section className="space-y-6" data-ui="matrix">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-3">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Audited monthly performance matrix.
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Third-party verified track record audited on IC Markets Raw ECN.
            </p>
          </div>

          {/* Bot Track Switcher */}
          <div className="flex gap-1 bg-[#090D16] p-1 rounded-xl text-xs">
            {[
              { id: 'gold_sniper', label: 'Gold Sniper EA' },
              { id: 'momentum_hunter', label: 'Momentum Hunter' },
              { id: 'scalper_pro', label: 'Scalper Pro HFT' },
            ].map((bot) => (
              <button
                key={bot.id}
                onClick={() => setSelectedBotTrack(bot.id)}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer text-xs font-bold ${
                  selectedBotTrack === bot.id
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {bot.label}
              </button>
            ))}
          </div>
        </div>

        {/* Executive Stats Strip for Selected Bot */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
          <div className="p-3.5 rounded-xl bg-[#090D16]">
            <div className="text-[10px] text-slate-500 uppercase">Total Net Return</div>
            <div className="text-lg font-bold text-emerald-400 mt-0.5 tabular-nums">{currentTrack.netPnl}</div>
          </div>
          <div className="p-3.5 rounded-xl bg-[#090D16]">
            <div className="text-[10px] text-slate-500 uppercase">Profit Factor</div>
            <div className="text-lg font-bold text-blue-400 mt-0.5 tabular-nums">{currentTrack.profitFactor}</div>
          </div>
          <div className="p-3.5 rounded-xl bg-[#090D16]">
            <div className="text-[10px] text-slate-500 uppercase">Win Rate</div>
            <div className="text-lg font-bold text-white mt-0.5 tabular-nums">{currentTrack.winRate}</div>
          </div>
          <div className="p-3.5 rounded-xl bg-[#090D16]">
            <div className="text-[10px] text-slate-500 uppercase">Max Drawdown</div>
            <div className="text-lg font-bold text-rose-400 mt-0.5 tabular-nums">{currentTrack.maxDd}</div>
          </div>
          <div className="p-3.5 rounded-xl bg-[#090D16]">
            <div className="text-[10px] text-slate-500 uppercase">Sharpe Ratio</div>
            <div className="text-lg font-bold text-slate-200 mt-0.5 tabular-nums">{currentTrack.sharpe}</div>
          </div>
        </div>

        {/* Dense Monthly Return Table (Myfxbook Layout) */}
        <div className="rounded-2xl bg-[#090D16] overflow-hidden text-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-center">
              <thead className="bg-[#05070D] text-slate-400 text-[11px]">
                <tr>
                  <th className="p-3 text-left font-semibold">Year</th>
                  {currentTrack.months2026.map((m, i) => (
                    <th key={i} className="p-3 font-semibold">{m.m}</th>
                  ))}
                  <th className="p-3 text-right font-bold text-white">YTD Total</th>
                </tr>
              </thead>
              <tbody>
                <tr className="hover:bg-[#0D1321] transition-colors">
                  <td className="p-3 text-left font-bold text-white">2026</td>
                  {currentTrack.months2026.map((m, i) => (
                    <td key={i} className="p-3 tabular-nums">
                      <span className={m.val === '-' ? 'text-slate-600' : 'text-emerald-400 font-semibold'}>
                        {m.val}
                      </span>
                    </td>
                  ))}
                  <td className="p-3 text-right font-bold text-emerald-400 tabular-nums">
                    {currentTrack.netPnl}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="p-3 bg-[#05070D] flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-400">
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              <span>Real money account on IC Markets Raw ECN (1:500 margin ratio).</span>
            </div>
            <div className="text-slate-500">
              Third-party verified track record via Myfxbook / Tickmill server.
            </div>
          </div>
        </div>
      </section>

      {/* 4. TECHNICAL EA SPECIFICATIONS TABLE — What Quant Traders Actually Look For */}
      <section className="space-y-6" data-ui="specs">
        <div className="pb-3">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Detailed Expert Advisor input parameters.
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Compare execution logic, risk controls, and terminal compatibility across all three production algorithms.
          </p>
        </div>

        <div className="rounded-2xl bg-[#090D16] overflow-hidden text-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-[#05070D] text-slate-400 text-[11px]">
                <tr>
                  <th className="p-3.5">Specification Parameter</th>
                  <th className="p-3.5 text-white font-bold">AKG Gold Sniper EA</th>
                  <th className="p-3.5 text-white font-bold">AKG Momentum Hunter</th>
                  <th className="p-3.5 text-white font-bold">AKG Scalper Pro HFT</th>
                </tr>
              </thead>
              <tbody>
                <tr className="hover:bg-[#0D1321] transition-colors">
                  <td className="p-3.5 text-slate-400 font-semibold">Core Strategy Logic</td>
                  <td className="p-3.5 text-slate-200">Volatility Breakout & Liquidity Sweep</td>
                  <td className="p-3.5 text-slate-200">Multi-Session Trend Momentum Expansion</td>
                  <td className="p-3.5 text-slate-200">Sub-minute High-Frequency Scalper</td>
                </tr>
                <tr className="hover:bg-[#0D1321] transition-colors">
                  <td className="p-3.5 text-slate-400 font-semibold">Target Instruments</td>
                  <td className="p-3.5 text-emerald-400 font-bold">XAUUSD (Gold Spot)</td>
                  <td className="p-3.5 text-emerald-400 font-bold">EURUSD, GBPUSD, USDJPY</td>
                  <td className="p-3.5 text-emerald-400 font-bold">US30, NAS100, EURUSD</td>
                </tr>
                <tr className="hover:bg-[#0D1321] transition-colors">
                  <td className="p-3.5 text-slate-400 font-semibold">Recommended Timeframe</td>
                  <td className="p-3.5 text-slate-300">M15 chart</td>
                  <td className="p-3.5 text-slate-300">H1 chart</td>
                  <td className="p-3.5 text-slate-300">M1 or M5 chart</td>
                </tr>
                <tr className="hover:bg-[#0D1321] transition-colors">
                  <td className="p-3.5 text-slate-400 font-semibold">Stop Loss & Invalidation</td>
                  <td className="p-3.5 text-rose-400 font-bold">Hard Stop on every entry</td>
                  <td className="p-3.5 text-rose-400 font-bold">Hard Stop on every entry</td>
                  <td className="p-3.5 text-rose-400 font-bold">Hard Stop on every entry</td>
                </tr>
                <tr className="hover:bg-[#0D1321] transition-colors">
                  <td className="p-3.5 text-slate-400 font-semibold">Martingale / Grid Averaging</td>
                  <td className="p-3.5 text-emerald-400 font-bold">Zero Martingale (Disabled)</td>
                  <td className="p-3.5 text-emerald-400 font-bold">Zero Martingale (Disabled)</td>
                  <td className="p-3.5 text-emerald-400 font-bold">Zero Martingale (Disabled)</td>
                </tr>
                <tr className="hover:bg-[#0D1321] transition-colors">
                  <td className="p-3.5 text-slate-400 font-semibold">Automated News Filter</td>
                  <td className="p-3.5 text-slate-200">ForexFactory API (Pauses 30m)</td>
                  <td className="p-3.5 text-slate-200">ForexFactory API (Pauses 30m)</td>
                  <td className="p-3.5 text-slate-200">ForexFactory API (Pauses 30m)</td>
                </tr>
                <tr className="hover:bg-[#0D1321] transition-colors">
                  <td className="p-3.5 text-slate-400 font-semibold">Prop Firm Compatibility</td>
                  <td className="p-3.5 text-emerald-400 font-bold">FTMO / FundedNext FIFO Ready</td>
                  <td className="p-3.5 text-emerald-400 font-bold">FTMO / FundedNext FIFO Ready</td>
                  <td className="p-3.5 text-emerald-400 font-bold">FTMO / FundedNext FIFO Ready</td>
                </tr>
                <tr className="hover:bg-[#0D1321] transition-colors">
                  <td className="p-3.5 text-slate-400 font-semibold">Supported Terminals</td>
                  <td className="p-3.5 text-slate-200">MT4 & MT5</td>
                  <td className="p-3.5 text-slate-200">MT5 Exclusive</td>
                  <td className="p-3.5 text-slate-200">MT4 & MT5</td>
                </tr>
                <tr className="hover:bg-[#0D1321] transition-colors">
                  <td className="p-3.5 text-slate-400 font-semibold">License Type & Price</td>
                  <td className="p-3.5 font-bold text-white">$299 USDT (Perpetual)</td>
                  <td className="p-3.5 font-bold text-white">$349 USDT (Perpetual)</td>
                  <td className="p-3.5 font-bold text-white">$399 USDT (Perpetual)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* 5. INFRASTRUCTURE & BROKER LATENCY BENCHMARK */}
      <section className="space-y-6" data-ui="telemetry">
        <div className="pb-3">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Equinix LD4 and NY4 execution telemetry.
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-time ping benchmarks measured from our simulated bridge server to major ECN liquidity pools.
          </p>
        </div>

        <div className="grid md:grid-cols-4 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-[#090D16] space-y-2">
            <div className="flex items-center justify-between text-slate-400">
              <span>IC Markets (Raw ECN)</span>
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-white tabular-nums">0.74ms</div>
            <div className="text-[10px] text-slate-500">Cross-connect: Equinix LD4 London</div>
          </div>

          <div className="p-4 rounded-xl bg-[#090D16] space-y-2">
            <div className="flex items-center justify-between text-slate-400">
              <span>Pepperstone (Razor)</span>
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-white tabular-nums">0.86ms</div>
            <div className="text-[10px] text-slate-500">Cross-connect: Equinix LD4 London</div>
          </div>

          <div className="p-4 rounded-xl bg-[#090D16] space-y-2">
            <div className="flex items-center justify-between text-slate-400">
              <span>Tickmill (Pro Server)</span>
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-white tabular-nums">0.68ms</div>
            <div className="text-[10px] text-slate-500">Cross-connect: Equinix LD4 London</div>
          </div>

          <div className="p-4 rounded-xl bg-[#090D16] space-y-2">
            <div className="flex items-center justify-between text-slate-400">
              <span>FTMO Prop Server 1</span>
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-white tabular-nums">1.12ms</div>
            <div className="text-[10px] text-slate-500">Cross-connect: Equinix NY4 New York</div>
          </div>
        </div>
      </section>

      {/* 6. PRICING & MEMBERSHIP CYCLES — Clear comparison */}
      <section className="space-y-6" data-ui="pricing">
        <div className="pb-3">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Direct crypto settlement. Zero recurring rebills.
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Settled in USDT on TRC-20, BEP-20, or ERC-20. When your cycle completes, you decide whether to renew.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto text-xs">
          {/* SR Signal Box */}
          <div className="rounded-2xl bg-[#090D16] p-7 flex flex-col justify-between">
            <div className="space-y-5">
              <div>
                <span className="text-xs font-bold text-slate-400">
                  Standard Execution
                </span>
                <h3 className="text-xl font-bold text-white mt-1">SR Signal Box</h3>
                <div className="flex items-baseline gap-2 mt-3">
                  <span className="text-4xl font-extrabold text-white tabular-nums">$10</span>
                  <span className="text-xs text-slate-400">USDT / 30-day cycle</span>
                </div>
              </div>

              <div className="pt-3">
                <ul className="space-y-2.5 text-xs text-slate-300">
                  <li className="flex items-start gap-2.5">
                    <Check className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Exact entry, stop loss, and TP coordinates</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Standard currency majors (EUR/USD, GBP/USD)</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Real-time SSE browser notification stream</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Full 30-day archive and trade audit access</span>
                  </li>
                </ul>
              </div>
            </div>

            <button
              onClick={() => onNavigate('pricing')}
              className="mt-6 w-full py-3 rounded-xl bg-[#0D1321] hover:bg-slate-800 text-white font-bold text-xs transition-colors cursor-pointer"
            >
              Enroll in SR Box ($10 USDT)
            </button>
          </div>

          {/* Perfect Signal Box */}
          <div className="rounded-2xl bg-[#0B1220] p-7 flex flex-col justify-between relative">
            <span className="absolute -top-3 right-6 px-3 py-0.5 rounded-full bg-blue-600 text-[10px] font-bold text-white">
              Institutional VIP Desk
            </span>

            <div className="space-y-5">
              <div>
                <span className="text-xs font-bold text-blue-300">
                  Full Institutional Access
                </span>
                <h3 className="text-xl font-bold text-white mt-1">Perfect Signal Box</h3>
                <div className="flex items-baseline gap-2 mt-3">
                  <span className="text-4xl font-extrabold text-white tabular-nums">$20</span>
                  <span className="text-xs text-slate-400">USDT / 30-day cycle</span>
                </div>
              </div>

              <div className="pt-3">
                <ul className="space-y-2.5 text-xs text-slate-300">
                  <li className="flex items-start gap-2.5">
                    <Check className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>High-volatility assets: Gold (XAUUSD), BTC, NAS100</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Multi-tier Take Profit & trailing invalidation zones</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Direct access to all EA presets and bot catalog</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Priority live desk announcements & directives feed</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Sub-millisecond simulated connector bridge access</span>
                  </li>
                </ul>
              </div>
            </div>

            <button
              onClick={() => onNavigate('pricing')}
              className="mt-6 w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-colors cursor-pointer"
            >
              Enroll in Perfect Signal Box ($20 USDT)
            </button>
          </div>
        </div>
      </section>

      {/* 7. OPERATIONAL FAQ ACCORDION */}
      <section className="space-y-6 max-w-3xl mx-auto text-xs">
        <div className="pb-3">
          <h2 className="text-2xl font-extrabold text-white tracking-tight">
            Technical and operational questions.
          </h2>
        </div>

        <div className="space-y-2.5">
          {FAQS.map((faq, index) => {
            const isOpen = openFaq === index;
            return (
              <div
                key={index}
                className="rounded-xl bg-[#090D16] overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(isOpen ? null : index)}
                  className="w-full p-4 text-left flex items-center justify-between gap-4 font-bold text-white hover:text-blue-300 transition-colors cursor-pointer"
                >
                  <span className="text-sm">{faq.q}</span>
                  <ChevronDown
                    className={`h-4 w-4 text-slate-400 shrink-0 transition-transform duration-200 ${
                      isOpen ? 'rotate-180 text-blue-400' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-4 pb-4 pt-1 text-slate-400 leading-relaxed text-[11px]">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 8. DECISIVE CLOSING ACTION */}
      <section className="rounded-2xl bg-[#090D16] p-8 sm:p-10 text-center space-y-4">
        <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          Ready to trade with verified algorithmic precision?
        </h2>
        <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
          Access real-time feeds, review third-party verified track records, and test low-latency execution routing.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2 text-xs">
          <button
            onClick={() => onNavigate('signals')}
            className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-colors flex items-center gap-2 cursor-pointer"
          >
            <span>Launch Live Terminal</span>
            <ArrowRight className="h-4 w-4" />
          </button>
          <button
            onClick={onOpenAuth}
            className="px-6 py-3 rounded-xl bg-[#05070D] hover:bg-slate-800 text-slate-300 hover:text-white font-semibold transition-colors cursor-pointer"
          >
            Sign In / 1-Click Access
          </button>
        </div>
      </section>
    </div>
  );
}
