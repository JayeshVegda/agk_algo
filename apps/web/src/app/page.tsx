import { strings } from "@/lib/strings";

export default function HomePage() {
  return (
    <div className="py-12 sm:py-20">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 space-y-16">
        {/* Hero */}
        <section className="text-center space-y-6 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-mono text-primary">
            <span className="inline-block h-2 w-2 rounded-full bg-primary animate-pulse" />
            Institutional Algorithmic Trading Systems
          </div>
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight font-mono">
            Direct High-Probability Trading Intelligence
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Access structured cycle-based algorithmic signals, validated MT4/MT5 expert advisors,
            and our proprietary automated execution demo.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <a
              href="/pricing"
              className="rounded-md bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-all font-mono"
            >
              Explore Plans & Cycles
            </a>
            <a
              href="/register"
              className="rounded-md border border-border bg-card px-6 py-3 text-sm font-semibold text-foreground hover:bg-accent transition-all font-mono"
            >
              Get Started
            </a>
          </div>
        </section>

        {/* What's Offered */}
        <section className="grid md:grid-cols-3 gap-6">
          <div className="rounded-lg border border-border bg-card p-6 space-y-3">
            <div className="text-xs font-mono uppercase text-primary tracking-wider">01. Signals</div>
            <h3 className="text-xl font-bold font-mono">Cycle-Based Signals</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Precision SR and Perfect tier signals delivered directly to your dashboard. Includes
              entry, stop-loss, and multi-target exits with monthly verifiable outcomes.
            </p>
          </div>

          <div className="rounded-lg border border-border bg-card p-6 space-y-3">
            <div className="text-xs font-mono uppercase text-primary tracking-wider">02. Bots</div>
            <h3 className="text-xl font-bold font-mono">MT4 / MT5 Algorithmic Bots</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Tested Expert Advisors for MetaTrader platforms. Delivered with unique license keys,
              account binding security, and signed file downloads.
            </p>
          </div>

          <div className="rounded-lg border border-border bg-card p-6 space-y-3">
            <div className="text-xs font-mono uppercase text-primary tracking-wider">03. Demo</div>
            <h3 className="text-xl font-bold font-mono">Connector Demo</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Simulated demonstration interface for algorithmic automated routing. Safely explore
              how parameter signals synchronize with broker execution environments.
            </p>
          </div>
        </section>

        {/* Risk Notice Banner */}
        <section className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 sm:p-6 text-xs text-muted-foreground space-y-2 font-mono">
          <div className="font-bold text-destructive flex items-center gap-2">
            <span>⚠ RISK DISCLOSURE & TRANSPARENCY NOTICE</span>
          </div>
          <p>{strings.common.riskDisclaimer}</p>
        </section>
      </div>
    </div>
  );
}
