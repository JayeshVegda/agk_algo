import { strings } from "@/lib/strings";

export const dynamic = "force-dynamic";

export default async function PricingPage() {

  return (
    <div className="py-12 sm:py-16">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 space-y-12">
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <div className="text-xs font-mono uppercase text-primary tracking-widest">
            Institutional Memberships
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold font-mono tracking-tight">
            Cycle Subscriptions & Bot Licenses
          </h1>
          <p className="text-sm text-muted-foreground">
            Clear, transparent pricing per trading cycle. No recurring auto-debit surprises. Pay via
            verified USDT blockchain transfer.
          </p>
        </div>

        {/* Signal Plans */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* SR Signal Box */}
          <div className="rounded-xl border border-border bg-card p-8 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="inline-block rounded bg-primary/10 border border-primary/20 px-3 py-1 font-mono text-xs text-primary">
                Tier 1
              </div>
              <h2 className="text-2xl font-bold font-mono">{strings.plans.srSignalBox}</h2>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {strings.plans.srDescription}
              </p>
              <div className="pt-4 font-mono">
                <span className="text-4xl font-extrabold text-foreground">$10</span>
                <span className="text-xs text-muted-foreground ml-2">/ active cycle</span>
              </div>
              <ul className="text-xs space-y-2 text-muted-foreground pt-4 border-t border-border/40 font-mono">
                <li>✓ Daily Support & Resistance algorithmic setups</li>
                <li>✓ Precise Entry, Stop Loss, and Exit Targets</li>
                <li>✓ Verifiable monthly performance archive</li>
                <li>✓ Real-time admin broadcast alerts</li>
              </ul>
            </div>
            <a
              href="/dashboard/subscribe?tier=SR_SIGNAL_BOX"
              className="w-full text-center rounded bg-primary py-2.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors font-mono"
            >
              Subscribe to SR Box
            </a>
          </div>

          {/* Perfect Signal Box */}
          <div className="rounded-xl border border-primary/50 bg-card p-8 flex flex-col justify-between space-y-6 relative overflow-hidden shadow-lg shadow-primary/5">
            <div className="absolute top-0 right-0 bg-primary text-primary-foreground font-mono text-[10px] font-bold px-3 py-1 rounded-bl">
              RECOMMENDED
            </div>
            <div className="space-y-4">
              <div className="inline-block rounded bg-primary/20 border border-primary/40 px-3 py-1 font-mono text-xs text-primary">
                Tier 2
              </div>
              <h2 className="text-2xl font-bold font-mono">{strings.plans.perfectSignalBox}</h2>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {strings.plans.perfectDescription}
              </p>
              <div className="pt-4 font-mono">
                <span className="text-4xl font-extrabold text-foreground">$20</span>
                <span className="text-xs text-muted-foreground ml-2">/ active cycle</span>
              </div>
              <ul className="text-xs space-y-2 text-muted-foreground pt-4 border-t border-border/40 font-mono">
                <li>✓ Everything in Perfect institutional tier</li>
                <li>✓ High-probability momentum breakouts</li>
                <li>✓ Strict 1:2 to 1:3 Risk-to-Reward profiles</li>
                <li>✓ Exclusive strategy parameters and guidance</li>
              </ul>
            </div>
            <a
              href="/dashboard/subscribe?tier=PERFECT_SIGNAL_BOX"
              className="w-full text-center rounded bg-primary py-2.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors font-mono"
            >
              Subscribe to Perfect Box
            </a>
          </div>
        </div>

        {/* Risk Disclaimer */}
        <div className="max-w-4xl mx-auto rounded border border-border/40 bg-card/60 p-4 text-xs font-mono text-muted-foreground">
          {strings.common.riskDisclaimer}
        </div>
      </div>
    </div>
  );
}
