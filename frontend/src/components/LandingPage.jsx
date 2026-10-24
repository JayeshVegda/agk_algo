import React, { useState, useEffect } from 'react';
import { 
  Zap, TrendingUp, TrendingDown, ShieldCheck, Terminal, 
  ArrowRight, Check, CheckCircle2, Lock, Sliders, Cpu, 
  Clock, Activity, Wifi, DollarSign, Layers, Radio, Copy, 
  ChevronDown, HelpCircle, Flame, Target, Award
} from 'lucide-react';

export function LandingPage({ onNavigate, onOpenAuth, notify }) {
  // Live radar active pair selection
  const [activePair, setActivePair] = useState('XAUUSD');
  const [copiedPair, setCopiedPair] = useState(false);

  // Capital projection calculator state
  const [capital, setCapital] = useState(10000);
  const [riskProfile, setRiskProfile] = useState('balanced'); // conservative, balanced, dynamic

  // FAQ accordion state
  const [openFaq, setOpenFaq] = useState(null);

  // Live fluctuating latency for LD4
  const [latency, setLatency] = useState(0.84);
  useEffect(() => {
    const interval = setInterval(() => {
      setLatency(Number((0.75 + Math.random() * 0.35).toFixed(2)));
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
    const text = `AKG ALGO RADAR: ${currentSetup.symbol} ${currentSetup.direction}\nEntry: ${currentSetup.entry}\nSL: ${currentSetup.sl}\nTP1: ${currentSetup.tp1}\nTP2: ${currentSetup.tp2}\nTarget: ${currentSetup.pipsTarget} (R:R ${currentSetup.rr})`;
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

  // Capital calculation multipliers based on audited historical backtests
  const riskMultipliers = {
    conservative: { monthlyPct: 8.5, maxDd: '< 3.4% DD', tradesPerWk: '4 - 6' },
    balanced: { monthlyPct: 14.2, maxDd: '< 5.8% DD', tradesPerWk: '8 - 12' },
    dynamic: { monthlyPct: 22.8, maxDd: '< 8.9% DD', tradesPerWk: '14 - 18' }
  };

  const currentRisk = riskMultipliers[riskProfile];
  const projectedReturn = Math.round(capital * (currentRisk.monthlyPct / 100));
  const projectedBalance = capital + projectedReturn;

  const FAQS = [
    {
      q: 'How are signal parameters delivered and executed?',
      a: 'Signals stream in real time over persistent Server-Sent Events (SSE). Every signal includes exact entry coordinates, invalidation stop loss, and multiple take profit targets with measured risk-to-reward ratios. You can copy parameters in one click directly into MT4, MT5, or cTrader.'
    },
    {
      q: 'How does the 30-day membership cycle work?',
      a: 'There are zero automated credit card rebills or recurring subscriptions. You settle directly with USDT (TRC-20, BEP-20, or ERC-20) for a 30-day cycle ($10 for SR Signal Box or $20 for Perfect Signal Box). When the cycle ends, you decide whether to renew.'
    },
    {
      q: 'Can I run the automated bots on any broker?',
      a: 'Yes. Our compiled Expert Advisors (.ex4 for MT4 and .ex5 for MT5) run on any broker supporting standard MetaTrader terminals (e.g. IC Markets, Pepperstone, FTMO, FundingPips). Each bot includes deterministic account binding for authorized usage.'
    },
    {
      q: 'What is the Connector Demo protocol?',
      a: 'The Connector is an isolated simulation bridge designed to demonstrate sub-millisecond execution routing via Equinix LD4 (London) fiber without exposing live capital to execution risk. It allows traders to benchmark latency and packet integrity.'
    },
    {
      q: 'How fast is payment verification?',
      a: 'Once you transfer USDT and submit your transaction hash (TXID), the desk confirms the blockchain transaction within 5 to 15 minutes, instantly activating your 30-day terminal entitlement.'
    }
  ];

  return (
    <div className="space-y-32 font-sans text-slate-100">
      {/* 1. HERO SECTION — Asymmetric, Bold, Left-Anchored */}
      <section className="pt-6 sm:pt-14">
        <div className="grid lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Direct Value Proposition */}
          <div className="lg:col-span-7 space-y-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs font-medium">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              <span>Desk active · High volatility regime</span>
            </div>

            <h1 className="text-4xl sm:text-6xl lg:text-[70px] font-extrabold tracking-tight text-white leading-[1.02] text-balance">
              Algorithmic execution for serious traders.
            </h1>

            <p className="text-lg sm:text-xl text-slate-300 max-w-xl font-normal leading-relaxed">
              Institutional trading signals, automated MT4 & MT5 algorithms, and low-latency execution routing. Direct 30-day USDT cycles with zero recurring fees.
            </p>

            {/* Decisive Action Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2 text-sm">
              <button
                onClick={() => onNavigate('signals')}
                className="px-8 py-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-colors flex items-center justify-center gap-2.5 cursor-pointer"
              >
                <span>Launch Live Terminal</span>
                <ArrowRight className="h-4 w-4" />
              </button>

              <button
                onClick={() => onNavigate('pricing')}
                className="px-7 py-4 rounded-xl bg-[#090D16] hover:bg-[#0D1321] text-slate-200 hover:text-white font-semibold transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                <DollarSign className="h-4 w-4 text-emerald-400" />
                <span>30-Day Cycles from $10</span>
              </button>
            </div>

            {/* Grounded Executive Metrics Bar */}
            <div className="grid grid-cols-3 gap-6 pt-6 text-sm">
              <div className="space-y-1">
                <div className="text-xs text-slate-400">30D Win Rate</div>
                <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400 tabular-nums">87.4%</div>
                <div className="text-xs text-slate-500">Audited 124 trades</div>
              </div>
              <div className="space-y-1">
                <div className="text-xs text-slate-400">Net Growth</div>
                <div className="text-2xl sm:text-3xl font-extrabold text-white tabular-nums">+1,840 pips</div>
                <div className="text-xs text-slate-500">XAUUSD & FX majors</div>
              </div>
              <div className="space-y-1">
                <div className="text-xs text-slate-400">Gateway Ping</div>
                <div className="text-2xl sm:text-3xl font-extrabold text-blue-400 tabular-nums">{latency}ms</div>
                <div className="text-xs text-slate-500">Equinix LD4 London</div>
              </div>
            </div>
          </div>

          {/* Right Column: Live Interactive Signal Radar (data-ui preserves UI widgets) */}
          <div className="lg:col-span-5" data-ui="radar">
            <div className="rounded-3xl bg-[#090D16] p-6 sm:p-8">
              {/* Radar Top Bar */}
              <div className="flex items-center justify-between pb-5">
                <div className="flex items-center gap-2.5">
                  <div className="h-9 w-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                    <Radio className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">Live Radar Setup</div>
                    <div className="text-[11px] text-slate-400">Realtime SSE Stream Active</div>
                  </div>
                </div>

                {/* Asset Chips */}
                <div className="flex gap-1 bg-[#05070D] p-1 rounded-xl text-xs">
                  {['XAUUSD', 'EURUSD', 'BTCUSD'].map((pair) => (
                    <button
                      key={pair}
                      onClick={() => setActivePair(pair)}
                      className={`px-3 py-1 rounded-lg transition-colors cursor-pointer text-xs font-bold ${
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

              {/* Active Signal Details */}
              <div className="space-y-5">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-2xl font-black text-white tracking-wide">{currentSetup.symbol}</div>
                    <div className="text-xs text-slate-400 mt-0.5">{currentSetup.name} · {currentSetup.timeframe}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 text-xs font-bold flex items-center gap-1">
                      <TrendingUp className="h-3.5 w-3.5" />
                      {currentSetup.direction}
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-[#05070D] text-slate-300 text-xs font-bold">
                      {currentSetup.pipsTarget}
                    </span>
                  </div>
                </div>

                {/* Risk-Reward Visual Scale */}
                <div>
                  <div className="flex justify-between text-xs text-slate-400 pb-1.5">
                    <span className="text-rose-400 font-bold">Risk (1.0)</span>
                    <span className="text-slate-200 font-bold">{currentSetup.rr} RR</span>
                    <span className="text-emerald-400 font-bold">Target Target</span>
                  </div>
                  <div className="h-2.5 w-full bg-[#05070D] rounded-full overflow-hidden flex">
                    <div style={{ width: `${currentSetup.riskPct}%` }} className="bg-rose-500/80 h-full" />
                    <div style={{ width: `${currentSetup.rewardPct}%` }} className="bg-emerald-500/80 h-full" />
                  </div>
                </div>

                {/* Numerical Parameters Matrix */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3.5 rounded-xl bg-[#05070D]">
                    <div className="text-slate-400">Entry Zone</div>
                    <div className="text-lg font-bold text-white mt-0.5 tabular-nums">{currentSetup.entry}</div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-[#05070D]">
                    <div className="text-rose-400 font-medium">Stop Loss</div>
                    <div className="text-lg font-bold text-rose-400 mt-0.5 tabular-nums">{currentSetup.sl}</div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-[#05070D]">
                    <div className="text-emerald-400 font-medium">Take Profit 1</div>
                    <div className="text-lg font-bold text-emerald-400 mt-0.5 tabular-nums">{currentSetup.tp1}</div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-[#05070D]">
                    <div className="text-emerald-400 font-medium">Take Profit 2</div>
                    <div className="text-lg font-bold text-emerald-400 mt-0.5 tabular-nums">{currentSetup.tp2}</div>
                  </div>
                </div>

                {/* Rationale Box */}
                <div className="p-4 rounded-xl bg-[#05070D] text-xs text-slate-300 leading-relaxed">
                  <div className="text-amber-400 font-bold mb-1">
                    Analysis Rationale:
                  </div>
                  <p className="text-slate-400 text-xs">{currentSetup.rationale}</p>
                </div>

                {/* 1-Click Interactive Action */}
                <button
                  onClick={handleCopyRadar}
                  className="w-full py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  {copiedPair ? (
                    <>
                      <Check className="h-4 w-4 text-emerald-400" />
                      <span className="text-emerald-400 font-bold">Parameters Copied for MetaTrader</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 text-slate-400" />
                      <span>Copy Signal Parameters (MT4 / MT5)</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. THREE PILLARS — Solid tone steps, no hairline dividers */}
      <section className="space-y-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-4">
          <div className="space-y-2">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Three execution verticals. One cohesive ecosystem.
            </h2>
            <p className="text-base text-slate-400 max-w-xl">
              Whether executing discretionary orders from high-probability signals or running hands-free automated expert advisors, every component is engineered for reliability.
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Pillar 1: Signals Feed */}
          <div className="rounded-3xl bg-[#090D16] p-8 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="h-12 w-12 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold">
                <Zap className="h-6 w-6" />
              </div>
              <h3 className="text-2xl font-bold text-white">Live Signal Terminal</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Real-time volatility signals delivered with precise entry coordinates, invalidation levels, multi-target take profits, and live desk technical commentary.
              </p>
              <ul className="space-y-3 text-xs text-slate-300 pt-2">
                <li className="flex items-center gap-2.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  <span>Gold (XAUUSD), FX Majors, Bitcoin & US Indices</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  <span>Real-time SSE zero-lag browser push</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  <span>Instant 1-click trade parameter copy</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => onNavigate('signals')}
              className="mt-8 py-3.5 w-full rounded-xl bg-[#0D1321] hover:bg-slate-800 text-slate-200 hover:text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <span>Explore Live Signals</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Pillar 2: Trading Bots */}
          <div className="rounded-3xl bg-[#090D16] p-8 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">
                <Cpu className="h-6 w-6" />
              </div>
              <h3 className="text-2xl font-bold text-white">Automated Quant Bots</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Compiled MT4 & MT5 algorithmic expert advisors (.ex4 & .ex5) equipped with automated trailing stops, equity preservation limits, and zero martingale risk.
              </p>
              <ul className="space-y-3 text-xs text-slate-300 pt-2">
                <li className="flex items-center gap-2.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  <span>Perpetual license with cryptographic account binding</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  <span>Audited historical backtests and verified DD</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  <span>Pre-calibrated .set strategy presets included</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => onNavigate('bots')}
              className="mt-8 py-3.5 w-full rounded-xl bg-[#0D1321] hover:bg-slate-800 text-slate-200 hover:text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <span>View Expert Advisors</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Pillar 3: Connector Bridge */}
          <div className="rounded-3xl bg-[#090D16] p-8 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="h-12 w-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold">
                <Activity className="h-6 w-6" />
              </div>
              <h3 className="text-2xl font-bold text-white">Execution Bridge Demo</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                High-speed simulated trading bridge demonstrating zero-slippage IPC order routing through Equinix LD4 London infrastructure with live telemetry.
              </p>
              <ul className="space-y-3 text-xs text-slate-300 pt-2">
                <li className="flex items-center gap-2.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  <span>Sub-millisecond packet roundtrip ({latency}ms)</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  <span>Demo isolation protocol for risk-free testing</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  <span>Full packet trace logs and terminal return ACK</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => onNavigate('connector')}
              className="mt-8 py-3.5 w-full rounded-xl bg-[#0D1321] hover:bg-slate-800 text-slate-200 hover:text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <span>Test Demo Connector</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </section>

      {/* 3. INTERACTIVE CAPITAL SIMULATOR */}
      <section className="rounded-3xl bg-[#090D16] p-8 sm:p-12" data-ui="calculator">
        <div className="grid lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-medium">
              <Sliders className="h-3.5 w-3.5" />
              <span>Interactive Capital Estimator</span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Model your algorithmic growth parameters.
            </h2>

            <p className="text-sm text-slate-300 leading-relaxed">
              Based on historical execution distributions across audited 30-day trading cycles. Adjust your starting capital and risk exposure to simulate conservative vs dynamic performance models.
            </p>

            {/* Capital Slider */}
            <div className="space-y-3 text-sm pt-2">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Initial Account Capital:</span>
                <span className="text-xl font-bold text-white tabular-nums">${capital.toLocaleString()} USD</span>
              </div>
              <input
                type="range"
                min="1000"
                max="50000"
                step="1000"
                value={capital}
                onChange={(e) => setCapital(Number(e.target.value))}
                className="w-full h-2 bg-[#05070D] rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
              <div className="flex justify-between text-xs text-slate-500">
                <span>$1,000 (Standard)</span>
                <span>$25,000 (Funded)</span>
                <span>$50,000 (Institutional)</span>
              </div>
            </div>

            {/* Risk Profile Switcher */}
            <div className="space-y-2 text-xs">
              <span className="text-slate-400">Execution Risk Profile:</span>
              <div className="grid grid-cols-3 gap-2.5">
                {[
                  { id: 'conservative', label: 'Conservative (1%)', dd: '< 3.4% DD' },
                  { id: 'balanced', label: 'Balanced (2%)', dd: '< 5.8% DD' },
                  { id: 'dynamic', label: 'Dynamic (3%)', dd: '< 8.9% DD' }
                ].map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setRiskProfile(p.id)}
                    className={`p-3 rounded-xl text-center transition-colors cursor-pointer ${
                      riskProfile === p.id
                        ? 'bg-blue-600 text-white font-bold'
                        : 'bg-[#05070D] text-slate-400 hover:text-white'
                    }`}
                  >
                    <div className="text-xs font-semibold">{p.label}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{p.dd}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Projection Results Card */}
          <div className="lg:col-span-6">
            <div className="p-8 rounded-2xl bg-[#05070D] space-y-6">
              <div className="text-xs text-slate-400 font-semibold">
                Simulated 30-Day Performance Outcome
              </div>

              <div className="grid grid-cols-2 gap-6 pb-6">
                <div>
                  <div className="text-xs text-slate-400">Target Monthly Growth</div>
                  <div className="text-3xl sm:text-4xl font-extrabold text-emerald-400 mt-1 tabular-nums">
                    +{currentRisk.monthlyPct}%
                  </div>
                  <div className="text-xs text-slate-500 mt-1">+${projectedReturn.toLocaleString()} net profit</div>
                </div>

                <div>
                  <div className="text-xs text-slate-400">Projected Month-End Equity</div>
                  <div className="text-3xl sm:text-4xl font-extrabold text-white mt-1 tabular-nums">
                    ${projectedBalance.toLocaleString()}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">Compounded 30D baseline</div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 text-xs">
                <div className="p-3.5 rounded-xl bg-[#090D16]">
                  <div className="text-[11px] text-slate-500 uppercase">Max Drawdown</div>
                  <div className="font-bold text-rose-400 mt-0.5">{currentRisk.maxDd}</div>
                </div>
                <div className="p-3.5 rounded-xl bg-[#090D16]">
                  <div className="text-[11px] text-slate-500 uppercase">Signal Frequency</div>
                  <div className="font-bold text-slate-200 mt-0.5">{currentRisk.tradesPerWk} / wk</div>
                </div>
                <div className="p-3.5 rounded-xl bg-[#090D16]">
                  <div className="text-[11px] text-slate-500 uppercase">Avg Risk:Reward</div>
                  <div className="font-bold text-blue-400 mt-0.5">1 : 2.8 RR</div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => onNavigate('pricing')}
                  className="w-full py-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>Lock in This Execution Profile ($10 / 30 Days)</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. QUANT ALGORITHM CATALOG — Verified EA Systems */}
      <section className="space-y-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-4">
          <div className="space-y-2">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Verified Expert Advisors catalog.
            </h2>
            <p className="text-base text-slate-400 max-w-xl">
              Every EA is delivered with full presets (.set files), comprehensive setup guide, and cryptographic account binding.
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Bot 1: Gold Sniper EA */}
          <div className="rounded-3xl bg-[#090D16] p-7 space-y-6 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="px-2.5 py-1 rounded bg-[#05070D] text-slate-300 text-xs font-bold">
                  MT4 / MT5
                </span>
                <span className="px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-400 text-xs font-bold">
                  Audited
                </span>
              </div>

              <div>
                <h3 className="text-xl font-bold text-white">AKG Gold Sniper EA</h3>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  Engineered specifically for XAUUSD liquidity sweeps and London PM volatility bursts with neural stop tracking.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2.5 text-xs">
                <div className="p-3 rounded-xl bg-[#05070D]">
                  <div className="text-[11px] text-slate-500 uppercase">Win Rate</div>
                  <div className="font-bold text-emerald-400 mt-0.5 tabular-nums">84.6%</div>
                </div>
                <div className="p-3 rounded-xl bg-[#05070D]">
                  <div className="text-[11px] text-slate-500 uppercase">Profit Factor</div>
                  <div className="font-bold text-blue-400 mt-0.5 tabular-nums">2.45</div>
                </div>
                <div className="p-3 rounded-xl bg-[#05070D]">
                  <div className="text-[11px] text-slate-500 uppercase">Max Drawdown</div>
                  <div className="font-bold text-rose-400 mt-0.5 tabular-nums">&lt; 4.8%</div>
                </div>
                <div className="p-3 rounded-xl bg-[#05070D]">
                  <div className="text-[11px] text-slate-500 uppercase">Min Deposit</div>
                  <div className="font-bold text-slate-200 mt-0.5 tabular-nums">$500+</div>
                </div>
              </div>
            </div>

            <div className="pt-4 flex items-center justify-between">
              <div>
                <div className="text-xs text-slate-400">Perpetual License</div>
                <div className="text-xl font-bold text-white tabular-nums">$299 USDT</div>
              </div>
              <button
                onClick={() => onNavigate('bots')}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors cursor-pointer"
              >
                License & EA
              </button>
            </div>
          </div>

          {/* Bot 2: Momentum Hunter */}
          <div className="rounded-3xl bg-[#090D16] p-7 space-y-6 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="px-2.5 py-1 rounded bg-[#05070D] text-slate-300 text-xs font-bold">
                  MT5 Exclusive
                </span>
                <span className="px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-400 text-xs font-bold">
                  Audited
                </span>
              </div>

              <div>
                <h3 className="text-xl font-bold text-white">AKG Momentum Hunter</h3>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  Multi-currency trend following system scanning EURUSD, GBPUSD, and USDJPY on hourly order block expansions.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2.5 text-xs">
                <div className="p-3 rounded-xl bg-[#05070D]">
                  <div className="text-[11px] text-slate-500 uppercase">Win Rate</div>
                  <div className="font-bold text-emerald-400 mt-0.5 tabular-nums">79.2%</div>
                </div>
                <div className="p-3 rounded-xl bg-[#05070D]">
                  <div className="text-[11px] text-slate-500 uppercase">Profit Factor</div>
                  <div className="font-bold text-blue-400 mt-0.5 tabular-nums">2.18</div>
                </div>
                <div className="p-3 rounded-xl bg-[#05070D]">
                  <div className="text-[11px] text-slate-500 uppercase">Max Drawdown</div>
                  <div className="font-bold text-rose-400 mt-0.5 tabular-nums">&lt; 5.9%</div>
                </div>
                <div className="p-3 rounded-xl bg-[#05070D]">
                  <div className="text-[11px] text-slate-500 uppercase">Min Deposit</div>
                  <div className="font-bold text-slate-200 mt-0.5 tabular-nums">$300+</div>
                </div>
              </div>
            </div>

            <div className="pt-4 flex items-center justify-between">
              <div>
                <div className="text-xs text-slate-400">Perpetual License</div>
                <div className="text-xl font-bold text-white tabular-nums">$349 USDT</div>
              </div>
              <button
                onClick={() => onNavigate('bots')}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors cursor-pointer"
              >
                License & EA
              </button>
            </div>
          </div>

          {/* Bot 3: Scalper Pro */}
          <div className="rounded-3xl bg-[#090D16] p-7 space-y-6 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="px-2.5 py-1 rounded bg-[#05070D] text-slate-300 text-xs font-bold">
                  MT4 & MT5
                </span>
                <span className="px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-400 text-xs font-bold">
                  HFT Scalper
                </span>
              </div>

              <div>
                <h3 className="text-xl font-bold text-white">AKG Scalper Pro HFT</h3>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  Sub-minute high-frequency liquidity provider capturing 3-8 pip micro-fluctuations during Asian and London sessions.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2.5 text-xs">
                <div className="p-3 rounded-xl bg-[#05070D]">
                  <div className="text-[11px] text-slate-500 uppercase">Win Rate</div>
                  <div className="font-bold text-emerald-400 mt-0.5 tabular-nums">88.1%</div>
                </div>
                <div className="p-3 rounded-xl bg-[#05070D]">
                  <div className="text-[11px] text-slate-500 uppercase">Profit Factor</div>
                  <div className="font-bold text-blue-400 mt-0.5 tabular-nums">2.82</div>
                </div>
                <div className="p-3 rounded-xl bg-[#05070D]">
                  <div className="text-[11px] text-slate-500 uppercase">Max Drawdown</div>
                  <div className="font-bold text-rose-400 mt-0.5 tabular-nums">&lt; 6.2%</div>
                </div>
                <div className="p-3 rounded-xl bg-[#05070D]">
                  <div className="text-[11px] text-slate-500 uppercase">Min Deposit</div>
                  <div className="font-bold text-slate-200 mt-0.5 tabular-nums">$1,000+</div>
                </div>
              </div>
            </div>

            <div className="pt-4 flex items-center justify-between">
              <div>
                <div className="text-xs text-slate-400">Perpetual License</div>
                <div className="text-xl font-bold text-white tabular-nums">$399 USDT</div>
              </div>
              <button
                onClick={() => onNavigate('bots')}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors cursor-pointer"
              >
                License & EA
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 5. PRICING & MEMBERSHIP CYCLES — Clear comparison */}
      <section className="space-y-12">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs font-medium">
            <DollarSign className="h-3.5 w-3.5" />
            <span>Transparent 30-Day Cycles</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Predictable membership. Zero hidden rebills.
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            Pay with USDT on TRC-20, BEP-20, or ERC-20. When your 30-day cycle finishes, you decide whether to renew. No credit cards, no recurring surprises.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* SR Signal Box */}
          <div className="rounded-3xl bg-[#090D16] p-8 sm:p-10 flex flex-col justify-between">
            <div className="space-y-6">
              <div>
                <span className="text-xs font-bold text-slate-400">
                  Standard Execution
                </span>
                <h3 className="text-2xl font-bold text-white mt-1">SR Signal Box</h3>
                <div className="flex items-baseline gap-2 mt-4">
                  <span className="text-5xl font-extrabold text-white tabular-nums">$10</span>
                  <span className="text-xs text-slate-400">USDT / 30-day cycle</span>
                </div>
              </div>

              <div className="pt-4">
                <ul className="space-y-3 text-xs text-slate-300">
                  <li className="flex items-start gap-3">
                    <Check className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Exact entry, stop loss, and TP coordinates</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Standard currency majors (EUR/USD, GBP/USD)</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Real-time SSE browser notification stream</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Full 30-day archive and historical review</span>
                  </li>
                </ul>
              </div>
            </div>

            <button
              onClick={() => onNavigate('pricing')}
              className="mt-8 w-full py-4 rounded-xl bg-[#0D1321] hover:bg-slate-800 text-white font-bold text-xs transition-colors cursor-pointer"
            >
              Enroll in SR Box ($10 USDT)
            </button>
          </div>

          {/* Perfect Signal Box */}
          <div className="rounded-3xl bg-[#0D1629] p-8 sm:p-10 flex flex-col justify-between relative border border-blue-500/40">
            <span className="absolute -top-3.5 right-8 px-3.5 py-1 rounded-full bg-blue-600 text-xs font-bold text-white">
              Most Popular Desk
            </span>

            <div className="space-y-6">
              <div>
                <span className="text-xs font-bold text-blue-300">
                  Institutional VIP
                </span>
                <h3 className="text-2xl font-bold text-white mt-1">Perfect Signal Box</h3>
                <div className="flex items-baseline gap-2 mt-4">
                  <span className="text-5xl font-extrabold text-white tabular-nums">$20</span>
                  <span className="text-xs text-slate-400">USDT / 30-day cycle</span>
                </div>
              </div>

              <div className="pt-4">
                <ul className="space-y-3 text-xs text-slate-300">
                  <li className="flex items-start gap-3">
                    <Check className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>High-volatility assets: Gold (XAUUSD), BTC, NAS100</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Multi-tier Take Profit & trailing invalidation zones</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Direct access to all EA presets and bot catalog</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Priority live desk announcements & directives feed</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Sub-millisecond simulated connector bridge access</span>
                  </li>
                </ul>
              </div>
            </div>

            <button
              onClick={() => onNavigate('pricing')}
              className="mt-8 w-full py-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-colors cursor-pointer"
            >
              Enroll in Perfect Signal Box ($20 USDT)
            </button>
          </div>
        </div>
      </section>

      {/* 6. OPERATIONAL FAQ ACCORDION */}
      <section className="space-y-8 max-w-3xl mx-auto">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-extrabold text-white tracking-tight">
            Frequently answered questions.
          </h2>
        </div>

        <div className="space-y-3 text-xs">
          {FAQS.map((faq, index) => {
            const isOpen = openFaq === index;
            return (
              <div
                key={index}
                className="rounded-2xl bg-[#090D16] overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(isOpen ? null : index)}
                  className="w-full p-5 text-left flex items-center justify-between gap-4 font-bold text-white hover:text-blue-300 transition-colors cursor-pointer"
                >
                  <span className="text-sm">{faq.q}</span>
                  <ChevronDown
                    className={`h-4 w-4 text-slate-400 shrink-0 transition-transform duration-200 ${
                      isOpen ? 'rotate-180 text-blue-400' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 pt-1 text-slate-400 leading-relaxed text-xs">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 7. DECISIVE CLOSING BANNER */}
      <section className="rounded-3xl bg-[#090D16] p-8 sm:p-14 text-center space-y-6">
        <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight max-w-2xl mx-auto leading-tight">
          Ready to trade with algorithmic precision?
        </h2>
        <p className="text-sm text-slate-300 max-w-lg mx-auto leading-relaxed">
          Access real-time institutional feeds, download compiled expert advisors, and test execution routing today.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2 text-sm">
          <button
            onClick={() => onNavigate('signals')}
            className="w-full sm:w-auto px-8 py-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer text-sm"
          >
            <span>Launch Live Terminal</span>
            <ArrowRight className="h-4 w-4" />
          </button>
          <button
            onClick={onOpenAuth}
            className="w-full sm:w-auto px-7 py-4 rounded-xl bg-[#0D1321] hover:bg-slate-800 text-slate-200 hover:text-white font-semibold transition-colors cursor-pointer"
          >
            Sign In / 1-Click Access
          </button>
        </div>
      </section>
    </div>
  );
}
