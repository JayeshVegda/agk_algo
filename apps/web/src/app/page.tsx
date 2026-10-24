import Link from "next/link";
import { strings } from "@/lib/strings";

export default function HomePage() {
  return (
    <div className="relative overflow-hidden pb-20">
      {/* Ambient gradient glow in background */}
      <div className="pointer-events-none absolute inset-0 -z-10 flex items-center justify-center opacity-30">
        <div className="h-[500px] w-[800px] rounded-full bg-gradient-to-tr from-blue-600/30 to-emerald-500/20 blur-[140px]" />
      </div>

      <div className="container mx-auto max-w-7xl px-4 sm:px-6 pt-12 sm:pt-20 space-y-20">
        {/* Hero Section */}
        <section className="text-center space-y-6 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-3.5 py-1 text-xs font-semibold text-blue-400 backdrop-blur">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
            Cycle 2 Active · Algorithmic Signals & Expert Advisors
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-foreground leading-[1.15]">
            Institutional Precision. <br />
            <span className="bg-gradient-to-r from-blue-400 via-cyan-300 to-emerald-400 bg-clip-text text-transparent">
              Disciplined Execution.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
            Cycle-based algorithmic signals, verified MT4/MT5 Expert Advisors, and our proprietary
            execution demo for serious traders. Zero hype, verifiable monthly archives.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
            <Link
              href="/dashboard"
              className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/30 hover:bg-blue-500 transition-all"
            >
              Enter Trading Terminal →
            </Link>
            <Link
              href="/pricing"
              className="rounded-xl border border-border/80 bg-card/80 px-6 py-3 text-sm font-semibold text-foreground hover:bg-secondary transition-all"
            >
              Explore Plans & Cycles
            </Link>
            <Link
              href="/login"
              className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-6 py-3 text-sm font-semibold text-amber-300 hover:bg-amber-500/20 transition-all"
            >
              Demo Quick Login
            </Link>
          </div>
        </section>

        {/* Live Signal Preview Card */}
        <section className="max-w-4xl mx-auto">
          <div className="rounded-2xl border border-border/80 bg-card/90 backdrop-blur p-6 sm:p-8 shadow-2xl relative overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-border/40 gap-4">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold text-lg font-mono">
                  AU
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-foreground font-mono">XAU/USD</span>
                    <span className="rounded-full bg-blue-500/20 text-blue-400 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                      Perfect Tier
                    </span>
                    <span className="rounded-full bg-emerald-500/20 text-emerald-400 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                      BUY LIMIT
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground font-mono">
                    Timeframe: M15 · London/NY Session Overlap
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400 border border-emerald-500/30 font-mono">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  STATUS: TP1 HIT (+95 PIPS)
                </span>
              </div>
            </div>

            {/* Signal Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 font-mono">
              <div className="rounded-xl border border-border/60 bg-background/60 p-4">
                <div className="text-[10px] font-semibold text-muted-foreground uppercase">
                  Entry Order
                </div>
                <div className="text-xl font-extrabold text-foreground mt-1 tabular-nums">
                  2,738.50
                </div>
                <div className="text-[10px] text-muted-foreground mt-0.5">Limit Execution</div>
              </div>

              <div className="rounded-xl border border-border/60 bg-background/60 p-4">
                <div className="text-[10px] font-semibold text-muted-foreground uppercase">
                  Stop Loss (SL)
                </div>
                <div className="text-xl font-extrabold text-rose-400 mt-1 tabular-nums">
                  2,729.00
                </div>
                <div className="text-[10px] text-rose-400/80 mt-0.5">-95 Pips Risk</div>
              </div>

              <div className="rounded-xl border border-border/60 bg-background/60 p-4">
                <div className="text-[10px] font-semibold text-muted-foreground uppercase">
                  Target 1 (TP1)
                </div>
                <div className="text-xl font-extrabold text-emerald-400 mt-1 tabular-nums">
                  2,748.00
                </div>
                <div className="text-[10px] text-emerald-400/80 mt-0.5">+95 Pips (1:1 R:R)</div>
              </div>

              <div className="rounded-xl border border-border/60 bg-background/60 p-4">
                <div className="text-[10px] font-semibold text-muted-foreground uppercase">
                  Target 2 (TP2)
                </div>
                <div className="text-xl font-extrabold text-emerald-400 mt-1 tabular-nums">
                  2,762.00
                </div>
                <div className="text-[10px] text-emerald-400/80 mt-0.5">+235 Pips (1:2.5 R:R)</div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-border/30 flex flex-col sm:flex-row justify-between items-center text-xs text-muted-foreground gap-2">
              <span className="font-mono text-[11px]">
                Algorithm Rationale: Key H4 Liquidity Sweep + Daily Support Bounce Confirmation
              </span>
              <Link
                href="/dashboard"
                className="text-blue-400 hover:text-blue-300 font-semibold inline-flex items-center gap-1"
              >
                View Live Feed →
              </Link>
            </div>
          </div>
        </section>

        {/* Feature Grid */}
        <section className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="rounded-2xl border border-border/80 bg-card/60 p-6 space-y-3 hover:border-blue-500/40 transition-colors">
            <div className="h-10 w-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
              01
            </div>
            <h3 className="text-lg font-bold text-foreground">Cycle Subscriptions</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Structured 30-day membership cycles with strict renewal windows. No perpetual churn,
              full transparency.
            </p>
          </div>

          <div className="rounded-2xl border border-border/80 bg-card/60 p-6 space-y-3 hover:border-blue-500/40 transition-colors">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
              02
            </div>
            <h3 className="text-lg font-bold text-foreground">MT4 / MT5 Expert Bots</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Validated algorithmic Expert Advisors delivered with cryptographically signed files
              and trading account bindings.
            </p>
          </div>

          <div className="rounded-2xl border border-border/80 bg-card/60 p-6 space-y-3 hover:border-blue-500/40 transition-colors">
            <div className="h-10 w-10 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center font-bold">
              03
            </div>
            <h3 className="text-lg font-bold text-foreground">Connector Demo</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Simulated demonstration interface for signal routing. AES-256-GCM encrypted
              parameters with zero live broker risk.
            </p>
          </div>

          <div className="rounded-2xl border border-border/80 bg-card/60 p-6 space-y-3 hover:border-blue-500/40 transition-colors">
            <div className="h-10 w-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
              04
            </div>
            <h3 className="text-lg font-bold text-foreground">Live Broadcast Stream</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Server-Sent Events (SSE) stream delivering real-time flash announcements, market notes,
              and cycle status.
            </p>
          </div>
        </section>

        {/* Risk Disclaimer */}
        <section className="rounded-2xl border border-rose-500/30 bg-rose-500/5 p-6 text-xs text-muted-foreground space-y-2">
          <div className="font-bold text-rose-400 flex items-center gap-2 text-sm">
            <span>⚠ RISK DISCLOSURE & REGULATORY COMPLIANCE</span>
          </div>
          <p className="leading-relaxed">{strings.common.riskDisclaimer}</p>
        </section>
      </div>
    </div>
  );
}
