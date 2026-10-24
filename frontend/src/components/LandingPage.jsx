import React from 'react';
import { 
  Cpu, Zap, ArrowRight, Check, ShieldCheck, 
  Terminal, Shield, DollarSign, Download, Lock
} from 'lucide-react';
import { Button } from './ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './ui/Card';
import { Badge } from './ui/Badge';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from './ui/Accordion';

export function LandingPage({ onNavigate, onOpenAuth, notify }) {
  const BOTS = [
    {
      id: 'gold-trap',
      name: 'AKG Gold Trap EA',
      platform: 'MT4',
      target: 'XAUUSD (Gold)',
      price: 299,
      description: 'Mean-reversion and liquidity breakout algorithm with automated drawdown protection.',
      features: [
        'Hard Stop-Loss on every trade',
        'Dynamic lot-sizing algorithm',
        'Built for volatile Gold sessions',
        'Recommended deposit: $500+'
      ],
      popular: false
    },
    {
      id: 'momentum-hunter',
      name: 'AKG Momentum Hunter',
      platform: 'MT5',
      target: 'EURUSD, GBPUSD',
      price: 349,
      description: 'Multi-session trend-following algorithm specialized for currency breakout expansions.',
      features: [
        'Session momentum expansion filter',
        'Automated trailing stop-loss',
        'FTMO & prop firm FIFO compatible',
        'Recommended deposit: $1,000+'
      ],
      popular: true
    },
    {
      id: 'scalper-pro',
      name: 'AKG Scalper Pro',
      platform: 'MT4 / MT5',
      target: 'Majors & Indices',
      price: 399,
      description: 'Low-latency M1 and M5 scalper engineered for liquid market hours with spread protection.',
      features: [
        'Automated spread spike filter',
        'Rapid multi-tier profit targets',
        'Zero martingale exposure',
        'Recommended deposit: $300+'
      ],
      popular: false
    }
  ];

  const FAQS = [
    {
      q: 'Which brokers and platforms are supported?',
      a: 'Our Expert Advisors run on MetaTrader 4 (MT4) and MetaTrader 5 (MT5). You can use any regulated broker (such as IC Markets, Pepperstone, Tickmill) or prop firm evaluation accounts like FTMO.'
    },
    {
      q: 'Are the bot licenses a one-time purchase?',
      a: 'Yes. Every bot license is a one-time payment for perpetual use. There are zero recurring monthly charges or hidden maintenance fees.'
    },
    {
      q: 'How does license activation work?',
      a: 'After purchasing, navigate to your Trading Bots tab, input your MetaTrader live or demo account number, and copy your generated cryptographic license key. Enter this key into the EA inputs when attaching it to your chart.'
    },
    {
      q: 'Do the trading bots use dangerous martingale or grid techniques?',
      a: 'Never. Every position opened by our algorithms has an immediate, pre-calculated hard stop loss. We strictly reject martingale, grid averaging, or unhedged drawdown strategies.'
    },
    {
      q: 'How are payments settled?',
      a: 'We accept direct USDT transfers over TRC-20, BEP-20, and ERC-20 networks. Your transaction is verified on-chain without third-party card processors or automatic rebilling.'
    }
  ];

  return (
    <div className="space-y-16 py-4 font-sans text-slate-800 max-w-5xl mx-auto">
      {/* 1. HERO — Clean, Minimal, White-Green */}
      <section className="text-center space-y-6 pt-6">
        <div className="flex justify-center">
          <Badge variant="default" className="gap-1.5 py-1 px-3 text-xs">
            <span className="h-2 w-2 rounded-full bg-emerald-600" />
            <span>MetaTrader 4 & 5 Expert Advisors</span>
          </Badge>
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-tight max-w-3xl mx-auto">
          Automated Trading Bots & Real-Time Signals
        </h1>

        <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
          Rule-based Expert Advisors engineered with fixed stop-loss controls. Perpetual software licenses settled in USDT with zero recurring card rebills.
        </p>

        {/* Action Buttons using UI components */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Button
            size="lg"
            onClick={() => onNavigate('bots')}
            className="gap-2"
          >
            <Cpu className="h-4 w-4" />
            <span>Browse Expert Advisors</span>
          </Button>

          <Button
            variant="outline"
            size="lg"
            onClick={() => onNavigate('signals')}
            className="gap-2"
          >
            <Terminal className="h-4 w-4 text-emerald-600" />
            <span>View Signal Feed</span>
          </Button>
        </div>

        {/* Trust Points */}
        <div className="flex flex-wrap items-center justify-center gap-6 pt-3 text-xs text-slate-600">
          <div className="flex items-center gap-1.5">
            <Check className="h-4 w-4 text-emerald-600 stroke-[2.5]" />
            <span>MT4 & MT5 Compatible</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Check className="h-4 w-4 text-emerald-600 stroke-[2.5]" />
            <span>Hard Stop-Loss On Every Trade</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Check className="h-4 w-4 text-emerald-600 stroke-[2.5]" />
            <span>One-Time USDT Payment</span>
          </div>
        </div>
      </section>

      {/* 2. BOTS SHOWCASE — Card Grid using UI Components */}
      <section className="space-y-6" data-ui="bots">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Trading Bots Catalog
          </h2>
          <p className="text-sm text-slate-500">
            Perpetual license keys bound to your MetaTrader account number.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {BOTS.map((bot) => (
            <Card
              key={bot.id}
              className={`flex flex-col justify-between hover:border-emerald-300 transition-all ${
                bot.popular ? 'border-emerald-500 ring-1 ring-emerald-500/20 shadow-md' : ''
              }`}
            >
              <div>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <Badge variant={bot.popular ? 'default' : 'secondary'}>
                      {bot.platform}
                    </Badge>
                    <span className="text-xs text-slate-500 font-medium">
                      {bot.target}
                    </span>
                  </div>

                  <CardTitle className="mt-2 text-lg">
                    {bot.name}
                  </CardTitle>

                  <CardDescription className="mt-1">
                    {bot.description}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-2.5 pt-2">
                  <div className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                    Key Specifications
                  </div>
                  {bot.features.map((feature, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-slate-600">
                      <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </CardContent>
              </div>

              <CardFooter className="flex-col items-stretch pt-4 border-t border-slate-100 mt-4">
                <div className="flex items-baseline justify-between mb-4">
                  <div>
                    <span className="text-2xl font-black text-slate-900 tabular-nums">${bot.price}</span>
                    <span className="text-xs text-slate-500 ml-1">USDT</span>
                  </div>
                  <span className="text-xs text-slate-500">One-time license</span>
                </div>

                <Button
                  variant={bot.popular ? 'default' : 'secondary'}
                  onClick={() => onNavigate('bots')}
                  className="w-full justify-center"
                >
                  <span>Select Bot</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </section>

      {/* 3. SIGNAL MEMBERSHIP — Clean 2-Tier Cards */}
      <section className="space-y-6" data-ui="pricing">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Signal Subscriptions
          </h2>
          <p className="text-sm text-slate-500">
            Real-time trade alerts with pre-calculated entry, stop-loss, and take-profit coordinates.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {/* SR Box */}
          <Card className="flex flex-col justify-between">
            <div>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <Badge variant="secondary">Standard</Badge>
                  <span className="text-xs text-slate-500">Manual 30-day renewal</span>
                </div>
                <CardTitle className="mt-2 text-xl">SR Signal Box</CardTitle>
                <div className="mt-3">
                  <span className="text-3xl font-black text-slate-900 tabular-nums">$10</span>
                  <span className="text-xs text-slate-500 ml-1">USDT / 30 days</span>
                </div>
              </CardHeader>

              <CardContent className="space-y-2.5">
                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Currency pairs (EUR/USD, GBP/USD)</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Pre-calculated Entry, Stop Loss & Take Profit</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Real-time web browser alerts</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>30-day signal archive access</span>
                </div>
              </CardContent>
            </div>

            <CardFooter className="pt-4 border-t border-slate-100">
              <Button
                variant="outline"
                onClick={() => onNavigate('pricing')}
                className="w-full justify-center"
              >
                Enroll in SR Box ($10)
              </Button>
            </CardFooter>
          </Card>

          {/* Perfect Signal Box */}
          <Card className="flex flex-col justify-between border-emerald-500 ring-1 ring-emerald-500/20 shadow-md">
            <div>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <Badge variant="default">Institutional VIP</Badge>
                  <span className="text-xs text-slate-500">Manual 30-day renewal</span>
                </div>
                <CardTitle className="mt-2 text-xl">Perfect Signal Box</CardTitle>
                <div className="mt-3">
                  <span className="text-3xl font-black text-slate-900 tabular-nums">$20</span>
                  <span className="text-xs text-slate-500 ml-1">USDT / 30 days</span>
                </div>
              </CardHeader>

              <CardContent className="space-y-2.5">
                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>High-volatility assets: Gold (XAUUSD), BTC & Indices</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Multi-tier Take Profit & trailing invalidation zones</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Direct access to all bot presets & MT4/MT5 templates</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Priority admin execution directives</span>
                </div>
              </CardContent>
            </div>

            <CardFooter className="pt-4 border-t border-slate-100">
              <Button
                variant="default"
                onClick={() => onNavigate('pricing')}
                className="w-full justify-center"
              >
                Enroll in Perfect Box ($20)
              </Button>
            </CardFooter>
          </Card>
        </div>
      </section>

      {/* 4. HOW IT WORKS — 3 Clean Step Cards */}
      <section className="space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            How It Works
          </h2>
          <p className="text-sm text-slate-500">
            Three simple steps to automate your trading.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <Card className="p-6 space-y-2">
            <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-sm">
              1
            </div>
            <div className="text-base font-bold text-slate-900">Select Your Bot</div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Choose the Expert Advisor tailored to your preferred currency pair, timeframe, and MT4 or MT5 platform.
            </p>
          </Card>

          <Card className="p-6 space-y-2">
            <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-sm">
              2
            </div>
            <div className="text-base font-bold text-slate-900">Pay Once with USDT</div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Transfer USDT using TRC-20, BEP-20, or ERC-20 network. No recurring credit card charges or hidden fees.
            </p>
          </Card>

          <Card className="p-6 space-y-2">
            <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-sm">
              3
            </div>
            <div className="text-base font-bold text-slate-900">Activate on Chart</div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Download your .ex4 or .ex5 file, paste your account license key in the EA inputs, and start trading.
            </p>
          </Card>
        </div>
      </section>

      {/* 5. FAQ — Radix UI Accessible Accordion */}
      <section className="space-y-6 max-w-3xl mx-auto">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Frequently Asked Questions
          </h2>
          <p className="text-sm text-slate-500">
            Key details on licenses, platforms, and risk management.
          </p>
        </div>

        <Card className="p-6">
          <Accordion type="single" collapsible className="w-full">
            {FAQS.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger>{faq.q}</AccordionTrigger>
                <AccordionContent>{faq.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Card>
      </section>

      {/* 6. CALL TO ACTION — Clean White-Green Banner */}
      <section className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-8 sm:p-10 text-center space-y-4">
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
          Ready to automate your trading execution?
        </h2>
        <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
          Select an Expert Advisor license or view live setups directly inside the web terminal.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Button
            size="lg"
            onClick={() => onNavigate('bots')}
          >
            Explore All Bots
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={() => onNavigate('signals')}
          >
            Open Signals Desk
          </Button>
        </div>
      </section>
    </div>
  );
}
