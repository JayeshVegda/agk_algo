import Link from "next/link";
import { strings } from "@/lib/strings";

export const dynamic = "force-dynamic";

export default async function PricingPage() {
  return (
    <div className="py-12 sm:py-20">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 space-y-16">
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-400 border border-blue-500/20">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-pulse" />
            Transparent Cycle Pricing
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground">
            Cycle Memberships & Signal Tiers
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Transparent pricing per 30-day trading cycle. No recurring auto-debit surprises or hidden fees.
            Pay easily with USDT on Tron or Ethereum.
          </p>
        </div>

        {/* Signal Plans */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* SR Signal Box */}
          <div className="rounded-2xl border border-border/80 bg-card/90 backdrop-blur p-8 flex flex-col justify-between space-y-6 hover:border-blue-500/40 transition-all shadow-xl">
            <div className="space-y-4">
              <div className="inline-block rounded-full bg-blue-500/10 border border-blue-500/20 px-3 py-0.5 text-xs font-semibold text-blue-400">
                Tier 1 Entry
              </div>
              <h2 className="text-2xl font-bold text-foreground">{strings.plans.srSignalBox}</h2>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {strings.plans.srDescription}
              </p>
              <div className="pt-2">
                <span className="text-4xl font-extrabold text-foreground font-mono tabular-nums">
                  $10
                </span>
                <span className="text-xs text-muted-foreground ml-2">/ active cycle (30 days)</span>
              </div>
              <ul className="text-xs space-y-2.5 text-muted-foreground pt-4 border-t border-border/40">
                <li className="flex items-center gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span>Daily Support & Resistance algorithmic setups</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span>Precise Entry, Stop Loss, and Exit Targets</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span>Verifiable monthly performance archive</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span>Real-time admin broadcast alerts</span>
                </li>
              </ul>
            </div>
            <Link
              href="/dashboard/subscribe?tier=SR_SIGNAL_BOX"
              className="w-full text-center rounded-xl bg-secondary border border-border/80 py-3 text-xs font-semibold text-foreground hover:bg-secondary/80 transition-colors"
            >
              Subscribe to SR Box →
            </Link>
          </div>

          {/* Perfect Signal Box */}
          <div className="rounded-2xl border-2 border-blue-500/60 bg-card/90 backdrop-blur p-8 flex flex-col justify-between space-y-6 relative overflow-hidden shadow-2xl shadow-blue-500/10">
            <div className="absolute top-0 right-0 bg-blue-600 text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg uppercase tracking-wider">
              MOST POPULAR
            </div>
            <div className="space-y-4">
              <div className="inline-block rounded-full bg-blue-500/20 border border-blue-500/40 px-3 py-0.5 text-xs font-semibold text-blue-300">
                Institutional Grade
              </div>
              <h2 className="text-2xl font-bold text-foreground">{strings.plans.perfectSignalBox}</h2>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {strings.plans.perfectDescription}
              </p>
              <div className="pt-2">
                <span className="text-4xl font-extrabold text-foreground font-mono tabular-nums">
                  $20
                </span>
                <span className="text-xs text-muted-foreground ml-2">/ active cycle (30 days)</span>
              </div>
              <ul className="text-xs space-y-2.5 text-muted-foreground pt-4 border-t border-border/40">
                <li className="flex items-center gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span>Everything in SR Signal Box included</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span>High-probability momentum breakout models</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span>Strict 1:2 to 1:3 Risk-to-Reward profiles</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span>Exclusive strategy parameters and guidance</span>
                </li>
              </ul>
            </div>
            <Link
              href="/dashboard/subscribe?tier=PERFECT_SIGNAL_BOX"
              className="w-full text-center rounded-xl bg-blue-600 py-3 text-xs font-semibold text-white shadow-lg shadow-blue-600/30 hover:bg-blue-500 transition-all"
            >
              Subscribe to Perfect Box →
            </Link>
          </div>
        </div>

        {/* Risk Disclaimer */}
        <div className="max-w-4xl mx-auto rounded-2xl border border-border/40 bg-card/60 p-5 text-xs text-muted-foreground font-mono leading-relaxed">
          <span className="text-amber-400 font-bold mr-1">DISCLAIMER:</span>
          {strings.common.riskDisclaimer}
        </div>
      </div>
    </div>
  );
}
