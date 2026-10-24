import React, { useState } from 'react';
import { 
  Cpu, Zap, ArrowRight, Check, ShieldCheck, 
  ChevronDown, HelpCircle, Terminal, Download
} from 'lucide-react';

export function LandingPage({ onNavigate, onOpenAuth, notify }) {
  const [openFaq, setOpenFaq] = useState(null);

  const BOTS = [
    {
      id: 'gold-trap',
      name: 'AKG Gold Trap EA',
      platform: 'MT4',
      target: 'XAUUSD (Gold)',
      price: 299,
      description: 'Mean-reversion and liquidity breakout algorithm with fixed risk management.',
      features: ['Fixed Stop Loss on every order', 'Dynamic lot sizing', 'Recommended deposit: $500+']
    },
    {
      id: 'momentum-hunter',
      name: 'AKG Momentum Hunter',
      platform: 'MT5',
      target: 'EURUSD, GBPUSD',
      price: 349,
      description: 'Multi-session trend-following algorithm capturing high-momentum expansions.',
      features: ['Session breakout filter', 'Automated trailing stop', 'Recommended deposit: $1,000+']
    },
    {
      id: 'scalper-pro',
      name: 'AKG Scalper Pro',
      platform: 'MT4 / MT5',
      target: 'Majors & Indices',
      price: 399,
      description: 'Fast M1 and M5 scalper designed for liquid market sessions with spread protection.',
      features: ['Spread filter protection', 'Quick multi-target exits', 'Recommended deposit: $300+']
    }
  ];

  const FAQS = [
    {
      q: 'Which brokers and platforms are supported?',
      a: 'Our Expert Advisors run on MetaTrader 4 (MT4) and MetaTrader 5 (MT5). You can use any broker of your choice, including IC Markets, Pepperstone, Tickmill, or prop firm accounts like FTMO.'
    },
    {
      q: 'Is the bot payment a one-time purchase?',
      a: 'Yes. Bot licenses are one-time payments for perpetual use. There are no recurring monthly charges for software licenses.'
    },
    {
      q: 'How does license activation work?',
      a: 'After checkout, enter your MetaTrader live or demo account number in your dashboard to generate your encrypted license key, then paste it into the EA settings on your chart.'
    },
    {
      q: 'Do the algorithms use martingale or grid?',
      a: 'No. Every single trade opened by our bots has a hard, predefined stop loss. We never use martingale, dangerous averaging, or grid recovery.'
    }
  ];

  return (
    <div className="space-y-16 py-6 font-sans text-slate-200 max-w-5xl mx-auto">
      {/* 1. HERO — Minimal, Direct, Focused */}
      <section className="text-center space-y-6 pt-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
          <span className="h-2 w-2 rounded-full bg-emerald-400" />
          <span>MetaTrader 4 & 5 Expert Advisors</span>
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight max-w-3xl mx-auto">
          Automated Trading Bots & Real-Time Signals
        </h1>

        <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Rule-based Expert Advisors with fixed stop-loss risk management. Perpetual licenses settled in USDT with zero recurring card rebills.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button
            onClick={() => onNavigate('bots')}
            className="px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold transition-colors flex items-center gap-2 cursor-pointer text-sm"
          >
            <Cpu className="h-4 w-4" />
            <span>Browse Trading Bots</span>
          </button>

          <button
            onClick={() => onNavigate('signals')}
            className="px-6 py-3 rounded-lg bg-[#0C101D] hover:bg-[#141A2E] text-slate-200 border border-[#1E293B] font-semibold transition-colors flex items-center gap-2 cursor-pointer text-sm"
          >
            <Terminal className="h-4 w-4 text-emerald-400" />
            <span>View Signals</span>
          </button>
        </div>

        {/* 3 Simple Badges */}
        <div className="flex flex-wrap items-center justify-center gap-6 pt-4 text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <Check className="h-4 w-4 text-emerald-400" />
            <span>MT4 & MT5 Compatible</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Check className="h-4 w-4 text-emerald-400" />
            <span>Hard Stop-Loss On Every Trade</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Check className="h-4 w-4 text-emerald-400" />
            <span>Instant USDT Settlement</span>
          </div>
        </div>
      </section>

      {/* 2. OUR TRADING BOTS — Clean 3-Card Grid */}
      <section className="space-y-6" data-ui="bots">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Trading Bots Catalog
          </h2>
          <p className="text-sm text-slate-400">
            Perpetual license keys bound to your MetaTrader account number.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          {BOTS.map((bot) => (
            <div
              key={bot.id}
              className="rounded-lg border border-[#1E293B] bg-[#0C101D] p-6 flex flex-col justify-between hover:border-slate-700 transition-colors"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 text-xs font-bold border border-blue-500/20">
                    {bot.platform}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">
                    {bot.target}
                  </span>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-white">
                    {bot.name}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    {bot.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-[#1E293B] space-y-2 text-xs text-slate-300">
                  {bot.features.map((feature, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-6 mt-4 border-t border-[#1E293B]">
                <div className="flex items-baseline justify-between mb-4">
                  <div>
                    <span className="text-2xl font-black text-white tabular-nums">${bot.price}</span>
                    <span className="text-xs text-slate-400 ml-1">USDT</span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-medium">One-time license</span>
                </div>

                <button
                  onClick={() => onNavigate('bots')}
                  className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>Select Bot</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. SIGNALS MEMBERSHIP — Simple 2 Tiers */}
      <section className="space-y-6" data-ui="pricing">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Signal Subscriptions
          </h2>
          <p className="text-sm text-slate-400">
            Real-time trade signals with clear entry, stop-loss, and take-profit targets.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-5 max-w-3xl mx-auto">
          {/* SR Box */}
          <div className="rounded-lg border border-[#1E293B] bg-[#0C101D] p-6 flex flex-col justify-between">
            <div className="space-y-4">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase">Standard</span>
                <h3 className="text-xl font-bold text-white mt-1">SR Signal Box</h3>
                <div className="mt-2">
                  <span className="text-3xl font-black text-white tabular-nums">$10</span>
                  <span className="text-xs text-slate-400 ml-1">USDT / 30 days</span>
                </div>
              </div>

              <div className="pt-4 border-t border-[#1E293B] space-y-2 text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                  <span>Currency pairs (EUR/USD, GBP/USD)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                  <span>Pre-calculated Entry, Stop Loss & Take Profit</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                  <span>Browser notifications on new signals</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => onNavigate('pricing')}
              className="mt-6 w-full py-2.5 rounded-lg bg-[#141A2E] hover:bg-[#1E293B] text-white font-bold text-xs border border-[#1E293B] transition-colors cursor-pointer"
            >
              Get SR Box ($10)
            </button>
          </div>

          {/* Perfect Signal Box */}
          <div className="rounded-lg border border-blue-500/50 bg-[#0C101D] p-6 flex flex-col justify-between">
            <div className="space-y-4">
              <div>
                <span className="text-xs font-bold text-blue-400 uppercase">VIP Access</span>
                <h3 className="text-xl font-bold text-white mt-1">Perfect Signal Box</h3>
                <div className="mt-2">
                  <span className="text-3xl font-black text-white tabular-nums">$20</span>
                  <span className="text-xs text-slate-400 ml-1">USDT / 30 days</span>
                </div>
              </div>

              <div className="pt-4 border-t border-[#1E293B] space-y-2 text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                  <span>Gold (XAUUSD), BTC & Indices</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                  <span>Multi-tier Take Profit targets</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                  <span>Full access to all bots & MT4/MT5 templates</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                  <span>Priority admin desk broadcast stream</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => onNavigate('pricing')}
              className="mt-6 w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-colors cursor-pointer"
            >
              Get Perfect Box ($20)
            </button>
          </div>
        </div>
      </section>

      {/* 4. HOW IT WORKS — 3 Simple Steps */}
      <section className="space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            How It Works
          </h2>
          <p className="text-sm text-slate-400">
            Three simple steps to automate your trading.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          <div className="p-5 rounded-lg border border-[#1E293B] bg-[#0C101D] space-y-2 text-center sm:text-left">
            <div className="text-base font-bold text-white">1. Select Your Bot</div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Choose the Expert Advisor matching your preferred currency pair, timeframe, and MT4 or MT5 platform.
            </p>
          </div>

          <div className="p-5 rounded-lg border border-[#1E293B] bg-[#0C101D] space-y-2 text-center sm:text-left">
            <div className="text-base font-bold text-white">2. Pay Once with USDT</div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Transfer USDT using TRC-20, BEP-20, or ERC-20 network. No credit card subscriptions or surprise charges.
            </p>
          </div>

          <div className="p-5 rounded-lg border border-[#1E293B] bg-[#0C101D] space-y-2 text-center sm:text-left">
            <div className="text-base font-bold text-white">3. Activate on Chart</div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Download your .ex4 or .ex5 file, paste your account license key in the EA inputs, and start trading.
            </p>
          </div>
        </div>
      </section>

      {/* 5. FAQ — Concise & Clear */}
      <section className="space-y-6 max-w-3xl mx-auto">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Frequently Asked Questions
          </h2>
          <p className="text-sm text-slate-400">
            Key details on licenses, platforms, and risk management.
          </p>
        </div>

        <div className="space-y-3">
          {FAQS.map((faq, index) => {
            const isOpen = openFaq === index;
            return (
              <div
                key={index}
                className="rounded-lg border border-[#1E293B] bg-[#0C101D] overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(isOpen ? null : index)}
                  className="w-full p-4 text-left flex items-center justify-between gap-4 cursor-pointer hover:bg-[#141A2E] transition-colors"
                >
                  <span className="text-sm font-semibold text-white">{faq.q}</span>
                  <ChevronDown
                    className={`h-4 w-4 text-slate-400 transition-transform ${
                      isOpen ? 'rotate-180 text-blue-400' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-4 pb-4 pt-1 text-xs text-slate-300 leading-relaxed border-t border-[#1E293B]">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 6. CALL TO ACTION — Minimal Terminal Launcher */}
      <section className="rounded-lg border border-[#1E293B] bg-[#0C101D] p-8 text-center space-y-4">
        <h2 className="text-2xl font-bold text-white">
          Ready to run automated trading?
        </h2>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          Explore our Expert Advisors or test real-time signals directly inside the web terminal.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button
            onClick={() => onNavigate('bots')}
            className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-colors cursor-pointer"
          >
            Explore All Bots
          </button>
          <button
            onClick={() => onNavigate('signals')}
            className="px-5 py-2.5 rounded-lg bg-[#141A2E] hover:bg-[#1E293B] text-slate-200 border border-[#1E293B] font-semibold text-xs transition-colors cursor-pointer"
          >
            Open Signals Desk
          </button>
        </div>
      </section>
    </div>
  );
}
