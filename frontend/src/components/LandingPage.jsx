import React from 'react';
import { 
  Cpu, Zap, ArrowRight, Check, ShieldCheck, 
  Terminal, Shield, DollarSign, Download, Lock,
  TrendingUp, Sparkles, CheckCircle2
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
      a: 'Our Expert Advisors run on MetaTrader 4 (MT4) and MetaTrader 5 (MT5). You can use any regulated broker (IC Markets, Pepperstone, Tickmill) or prop firm evaluation accounts like FTMO.'
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
    <div className="space-y-20 py-6 font-sans text-[#E7E9EF] max-w-5xl mx-auto">
      
      {/* 1. HERO — Official AKG ALGO Brand Kit Showcase */}
      <section className="text-center space-y-6 pt-4">
        
        {/* Brand Symbol Artwork from Web Kit */}
        <div className="flex justify-center mb-2">
          <img 
            src="/assets/logos/akg-algo-symbol-transparent.png" 
            alt="AKG ALGO Art Lockup" 
            className="h-20 sm:h-28 w-auto object-contain opacity-95 hover:scale-105 transition-transform duration-300"
          />
        </div>

        <div className="flex justify-center">
          <Badge variant="gold" className="gap-1.5 py-1 px-3.5 text-xs font-bold">
            <span className="h-2 w-2 rounded-full bg-[#00D878] animate-pulse" />
            <span>Official MetaTrader 4 & 5 Expert Advisors</span>
          </Badge>
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight max-w-3xl mx-auto">
          Trade <span className="text-[#F3C653]">smarter.</span> Automated bots & real-time signals.
        </h1>

        <p className="text-base sm:text-lg text-[#A6ADB9] max-w-2xl mx-auto leading-relaxed">
          Rule-based Expert Advisors engineered with fixed stop-loss controls. Perpetual software licenses settled directly in USDT with zero recurring card rebills.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Button
            size="lg"
            variant="default"
            onClick={() => onNavigate('bots')}
            className="gap-2 text-sm font-bold"
          >
            <Cpu className="h-4 w-4" />
            <span>Browse Expert Advisors</span>
          </Button>

          <Button
            variant="outline"
            size="lg"
            onClick={() => onNavigate('signals')}
            className="gap-2 text-sm font-bold"
          >
            <Terminal className="h-4 w-4 text-[#00D878]" />
            <span>View Signal Feed</span>
          </Button>
        </div>

        {/* Value Proposition Points */}
        <div className="flex flex-wrap items-center justify-center gap-6 pt-4 text-xs text-[#A6ADB9]">
          <div className="flex items-center gap-1.5">
            <Check className="h-4 w-4 text-[#00D878] stroke-[2.5]" />
            <span className="text-[#E7E9EF] font-medium">MT4 & MT5 Compatible</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Check className="h-4 w-4 text-[#00D878] stroke-[2.5]" />
            <span className="text-[#E7E9EF] font-medium">Hard Stop-Loss On Every Trade</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Check className="h-4 w-4 text-[#00D878] stroke-[2.5]" />
            <span className="text-[#E7E9EF] font-medium">One-Time USDT Payment</span>
          </div>
        </div>
      </section>

      {/* 2. BOTS SHOWCASE — Official Brand Surface Cards */}
      <section className="space-y-6" data-ui="bots">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Trading Bots Catalog
          </h2>
          <p className="text-xs sm:text-sm text-[#A6ADB9]">
            Perpetual license keys bound cryptographically to your MetaTrader account number.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {BOTS.map((bot) => (
            <Card
              key={bot.id}
              className={`flex flex-col justify-between transition-all bg-[#10141B] border hover:border-[#F3C653]/50 ${
                bot.popular 
                  ? 'border-[#F3C653] shadow-lg shadow-[#F3C653]/10 ring-1 ring-[#F3C653]/30' 
                  : 'border-white/10'
              }`}
            >
              <div>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <Badge variant={bot.popular ? 'gold' : 'secondary'}>
                      {bot.platform}
                    </Badge>
                    <span className="text-xs text-[#A6ADB9] font-medium font-mono">
                      {bot.target}
                    </span>
                  </div>

                  <CardTitle className="mt-3 text-lg font-bold text-white">
                    {bot.name}
                  </CardTitle>

                  <CardDescription className="mt-1 text-xs text-[#A6ADB9]">
                    {bot.description}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-2.5 pt-2">
                  <div className="text-[10px] font-bold text-[#A6ADB9] uppercase tracking-wider mb-2">
                    Key Specifications
                  </div>
                  {bot.features.map((feature, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-[#E7E9EF]">
                      <Check className="h-4 w-4 text-[#00D878] shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </CardContent>
              </div>

              <CardFooter className="flex-col items-stretch pt-4 border-t border-white/10 mt-4">
                <div className="flex items-baseline justify-between mb-4">
                  <div>
                    <span className="text-2xl font-black text-white tabular-nums">${bot.price}</span>
                    <span className="text-xs text-[#F3C653] ml-1 font-bold">USDT</span>
                  </div>
                  <span className="text-xs text-[#A6ADB9]">Perpetual License</span>
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

      {/* 3. SIGNAL MEMBERSHIP — 2-Tier Surface Cards */}
      <section className="space-y-6" data-ui="pricing">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Signal Subscriptions
          </h2>
          <p className="text-xs sm:text-sm text-[#A6ADB9]">
            Real-time trade setups with pre-calculated entry, stop-loss, and take-profit coordinates.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {/* SR Box */}
          <Card className="flex flex-col justify-between bg-[#10141B] border border-white/10 hover:border-white/20 transition-all">
            <div>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <Badge variant="secondary">Standard</Badge>
                  <span className="text-xs text-[#A6ADB9]">Manual 30-day renewal</span>
                </div>
                <CardTitle className="mt-3 text-xl text-white">SR Signal Box</CardTitle>
                <div className="mt-3">
                  <span className="text-3xl font-black text-white tabular-nums">$10</span>
                  <span className="text-xs text-[#A6ADB9] ml-1">USDT / 30 days</span>
                </div>
              </CardHeader>

              <CardContent className="space-y-2.5">
                <div className="flex items-center gap-2 text-xs text-[#E7E9EF]">
                  <Check className="h-4 w-4 text-[#00D878] shrink-0" />
                  <span>Currency pairs (EUR/USD, GBP/USD)</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-[#E7E9EF]">
                  <Check className="h-4 w-4 text-[#00D878] shrink-0" />
                  <span>Pre-calculated Entry, Stop Loss & Take Profit</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-[#E7E9EF]">
                  <Check className="h-4 w-4 text-[#00D878] shrink-0" />
                  <span>Real-time web browser alerts</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-[#E7E9EF]">
                  <Check className="h-4 w-4 text-[#00D878] shrink-0" />
                  <span>30-day signal archive access</span>
                </div>
              </CardContent>
            </div>

            <CardFooter className="pt-4 border-t border-white/10">
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
          <Card className="flex flex-col justify-between bg-[#10141B] border border-[#F3C653] ring-1 ring-[#F3C653]/30 shadow-lg shadow-[#F3C653]/10">
            <div>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <Badge variant="gold">Institutional VIP</Badge>
                  <span className="text-xs text-[#A6ADB9]">Manual 30-day renewal</span>
                </div>
                <CardTitle className="mt-3 text-xl text-white">Perfect Signal Box</CardTitle>
                <div className="mt-3">
                  <span className="text-3xl font-black text-white tabular-nums">$20</span>
                  <span className="text-xs text-[#F3C653] ml-1 font-bold">USDT / 30 days</span>
                </div>
              </CardHeader>

              <CardContent className="space-y-2.5">
                <div className="flex items-center gap-2 text-xs text-[#E7E9EF]">
                  <Check className="h-4 w-4 text-[#00D878] shrink-0" />
                  <span>High-volatility assets: Gold (XAUUSD), BTC & Indices</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-[#E7E9EF]">
                  <Check className="h-4 w-4 text-[#00D878] shrink-0" />
                  <span>Multi-tier Take Profit & trailing invalidation zones</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-[#E7E9EF]">
                  <Check className="h-4 w-4 text-[#00D878] shrink-0" />
                  <span>Direct access to all bot presets & MT4/MT5 templates</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-[#E7E9EF]">
                  <Check className="h-4 w-4 text-[#00D878] shrink-0" />
                  <span>Priority admin execution directives</span>
                </div>
              </CardContent>
            </div>

            <CardFooter className="pt-4 border-t border-white/10">
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

      {/* 4. HOW IT WORKS — 3 Step Brand Cards */}
      <section className="space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            How It Works
          </h2>
          <p className="text-xs sm:text-sm text-[#A6ADB9]">
            Three steps to deploy institutional algorithms.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <Card className="p-6 space-y-3 bg-[#10141B] border border-white/10">
            <div className="h-8 w-8 rounded-lg bg-[#F3C653]/15 text-[#F3C653] border border-[#F3C653]/30 flex items-center justify-center font-black text-sm">
              1
            </div>
            <div className="text-base font-bold text-white">Select Your Bot</div>
            <p className="text-xs text-[#A6ADB9] leading-relaxed">
              Choose the Expert Advisor tailored to your preferred currency pair, timeframe, and MT4 or MT5 platform.
            </p>
          </Card>

          <Card className="p-6 space-y-3 bg-[#10141B] border border-white/10">
            <div className="h-8 w-8 rounded-lg bg-[#F3C653]/15 text-[#F3C653] border border-[#F3C653]/30 flex items-center justify-center font-black text-sm">
              2
            </div>
            <div className="text-base font-bold text-white">Settle Once with USDT</div>
            <p className="text-xs text-[#A6ADB9] leading-relaxed">
              Transfer USDT using TRC-20, BEP-20, or ERC-20 network. Zero recurring credit card charges or hidden fees.
            </p>
          </Card>

          <Card className="p-6 space-y-3 bg-[#10141B] border border-white/10">
            <div className="h-8 w-8 rounded-lg bg-[#F3C653]/15 text-[#F3C653] border border-[#F3C653]/30 flex items-center justify-center font-black text-sm">
              3
            </div>
            <div className="text-base font-bold text-white">Activate on Chart</div>
            <p className="text-xs text-[#A6ADB9] leading-relaxed">
              Download your .ex4 or .ex5 file, paste your account license key in the EA inputs, and start trading.
            </p>
          </Card>
        </div>
      </section>

      {/* 5. FAQ — Radix Accordion on Brand Surface */}
      <section className="space-y-6 max-w-3xl mx-auto">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Frequently Asked Questions
          </h2>
          <p className="text-xs sm:text-sm text-[#A6ADB9]">
            Key details on licenses, platforms, and risk management.
          </p>
        </div>

        <Card className="p-6 bg-[#10141B] border border-white/10">
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

      {/* 6. CALL TO ACTION — Web Kit Surface with Signal Gold Accent */}
      <section className="rounded-3xl border border-[#F3C653]/30 bg-gradient-to-b from-[#10141B] to-[#07090D] p-8 sm:p-12 text-center space-y-5 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-1/4 w-48 h-48 bg-[#F3C653]/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-48 h-48 bg-[#00D878]/5 rounded-full blur-3xl pointer-events-none" />

        <img 
          src="/assets/logos/akg-algo-symbol-transparent.png" 
          alt="AKG ALGO" 
          className="h-14 w-auto mx-auto mb-2 object-contain relative z-10 opacity-95"
        />

        <h2 className="text-2xl sm:text-3xl font-extrabold text-white relative z-10">
          Ready to automate your trading execution?
        </h2>
        <p className="text-xs sm:text-sm text-[#A6ADB9] max-w-md mx-auto leading-relaxed relative z-10">
          Select an Expert Advisor license or view live setups directly inside the web terminal.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2 relative z-10">
          <Button
            size="lg"
            variant="default"
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
