import Link from "next/link";
import { requireUser } from "@/lib/guards";
import { getDb, cycles, enrolments, signals, plans } from "@akg/db";
import { eq, desc } from "drizzle-orm";
import { hasSignalAccess } from "@akg/core";
import { getSetting } from "@/lib/settings";

export default async function DashboardPage() {
  const ctx = await requireUser();
  const db = getDb();
  const businessTimezone = await getSetting("business_timezone");
  const _pausedBannerText = await getSetting("paused_banner_text");

  // 1. Fetch active cycles
  const activeCycles = await db
    .select()
    .from(cycles)
    .orderBy(desc(cycles.startsOn))
    .limit(1);

  const currentCycle = activeCycles[0] || null;

  // 2. Fetch user's active paid enrolments
  const userEnrolments = await db
    .select({
      enrolmentId: enrolments.id,
      status: enrolments.status,
      planCode: plans.code,
      cycleId: cycles.id,
      startsOn: cycles.startsOn,
      endsOn: cycles.endsOn,
      cycleStatus: cycles.status,
    })
    .from(enrolments)
    .innerJoin(plans, eq(plans.id, enrolments.planId))
    .innerJoin(cycles, eq(cycles.id, enrolments.cycleId))
    .where(eq(enrolments.userId, ctx.user.id));

  const userAccessContext = {
    id: ctx.user.id,
    enrolments: userEnrolments.map((e) => ({
      id: e.enrolmentId,
      userId: ctx.user.id,
      cycleId: e.cycleId,
      planTier: e.planCode as "SR_SIGNAL_BOX" | "PERFECT_SIGNAL_BOX",
      status: e.status as "pending" | "paid" | "refunded" | "expired",
      cycle: {
        id: e.cycleId,
        startsOn: e.startsOn,
        endsOn: e.endsOn,
        status: e.cycleStatus as "draft" | "renewal_open" | "running" | "closed",
      },
    })),
  };

  const isAdmin = ctx.role === "admin";
  const hasSR =
    isAdmin ||
    hasSignalAccess(userAccessContext, "SR_SIGNAL_BOX", {
      now: new Date(),
      businessTimezone,
    });
  const hasPerfect =
    isAdmin ||
    hasSignalAccess(userAccessContext, "PERFECT_SIGNAL_BOX", {
      now: new Date(),
      businessTimezone,
    });

  // 3. Fetch signals
  let todaySignals: (typeof signals.$inferSelect)[] = [];
  if (hasSR || hasPerfect) {
    todaySignals = await db
      .select()
      .from(signals)
      .where(eq(signals.status, "published"))
      .orderBy(desc(signals.publishedAt))
      .limit(12);

    if (!isAdmin) {
      todaySignals = todaySignals.filter((s) => {
        if (s.planTier === "SR_SIGNAL_BOX" && hasSR) return true;
        if (s.planTier === "PERFECT_SIGNAL_BOX" && hasPerfect) return true;
        return false;
      });
    }
  }

  return (
    <div className="space-y-8">
      {/* Top Banner & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-5">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-blue-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-blue-400 border border-blue-500/20">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-pulse" />
            Live Execution Stream
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground mt-1">
            Trading Dashboard
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Algorithmic signal feed synchronized to active London & New York market sessions
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/dashboard/charts"
            className="rounded-lg border border-border/80 bg-secondary/60 px-3.5 py-2 text-xs font-semibold text-foreground hover:bg-secondary transition-colors"
          >
            📈 Live Charts
          </Link>
          <Link
            href="/dashboard/subscribe"
            className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-blue-600/30 hover:bg-blue-500 transition-all"
          >
            Manage Subscription →
          </Link>
        </div>
      </div>

      {/* Cycle & Membership Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-border/80 bg-card/80 p-5 space-y-1">
          <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
            Active Cycle
          </div>
          <div className="text-lg font-bold text-foreground">
            {currentCycle?.name || "Cycle 2 (Active)"}
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-medium">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Running · Enrolment Active</span>
          </div>
        </div>

        <div className="rounded-2xl border border-border/80 bg-card/80 p-5 space-y-1">
          <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
            Entitlement Tier
          </div>
          <div className="text-lg font-bold text-blue-400">
            {hasPerfect && hasSR
              ? "SR & Perfect Tiers"
              : hasPerfect
                ? "Perfect Tier"
                : hasSR
                  ? "SR Signal Box"
                  : "Unsubscribed"}
          </div>
          <div className="text-[11px] text-muted-foreground">
            {isAdmin ? "Institutional Staff Access" : "Full Access Granted"}
          </div>
        </div>

        <div className="rounded-2xl border border-border/80 bg-card/80 p-5 space-y-1">
          <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
            Signals Today
          </div>
          <div className="text-2xl font-bold font-mono text-foreground tabular-nums">
            {todaySignals.length}
          </div>
          <div className="text-[11px] text-muted-foreground">Active algorithmic setups</div>
        </div>

        <div className="rounded-2xl border border-border/80 bg-card/80 p-5 space-y-1">
          <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
            Cycle Performance
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-400 tabular-nums">
            +485 Pips
          </div>
          <div className="text-[11px] text-muted-foreground">Net locked across Target 1 & 2</div>
        </div>
      </div>

      {/* Signals Feed Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-foreground">
              Today's Algorithmic Signals
            </h2>
            <p className="text-xs text-muted-foreground">
              Direct entries calculated by institutional support/resistance and order-block algorithms
            </p>
          </div>
          <Link
            href="/dashboard/archive"
            className="text-xs text-blue-400 hover:text-blue-300 font-semibold"
          >
            View Monthly Performance Archive →
          </Link>
        </div>

        {!hasSR && !hasPerfect ? (
          <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-8 text-center space-y-4">
            <div className="text-base font-bold text-foreground">
              Active Cycle Subscription Required
            </div>
            <p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
              Live algorithmic signals are delivered exclusively to verified members during running
              market cycles. Subscribe to unlock SR and Perfect tier signals.
            </p>
            <Link
              href="/dashboard/subscribe"
              className="inline-block rounded-lg bg-blue-600 px-5 py-2.5 text-xs font-semibold text-white shadow-md shadow-blue-600/30 hover:bg-blue-500 transition-all"
            >
              Select Cycle Plan →
            </Link>
          </div>
        ) : todaySignals.length === 0 ? (
          <div className="rounded-2xl border border-border/80 bg-card/40 p-12 text-center text-xs text-muted-foreground">
            No signals published yet today. The algorithms are monitoring active market sessions.
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-5">
            {todaySignals.map((signal) => {
              const isBuy = signal.direction === "BUY";
              return (
                <div
                  key={signal.id}
                  className="rounded-2xl border border-border/80 bg-card/90 backdrop-blur p-6 space-y-4 hover:border-blue-500/30 transition-all shadow-lg"
                >
                  {/* Signal Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/80 border border-border font-mono font-bold text-sm text-foreground">
                        {signal.symbol.slice(0, 3)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-base font-bold text-foreground">
                            {signal.symbol}
                          </span>
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider font-mono ${
                              isBuy
                                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                : "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                            }`}
                          >
                            {signal.direction}
                          </span>
                        </div>
                        <span className="text-[11px] text-muted-foreground font-mono">
                          {signal.planTier === "SR_SIGNAL_BOX"
                            ? "SR Signal Box"
                            : "Perfect Signal Box"}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-500/10 px-2.5 py-1 text-[11px] font-bold text-emerald-400 border border-emerald-500/20 font-mono">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        ACTIVE
                      </span>
                    </div>
                  </div>

                  {/* Pricing Matrix */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1 font-mono">
                    <div className="rounded-xl border border-border/60 bg-background/60 p-3">
                      <div className="text-[10px] font-semibold text-muted-foreground uppercase">
                        Entry
                      </div>
                      <div className="text-sm font-bold text-foreground tabular-nums mt-0.5">
                        {signal.entry}
                      </div>
                    </div>

                    <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-3">
                      <div className="text-[10px] font-semibold text-rose-400 uppercase">
                        Stop Loss
                      </div>
                      <div className="text-sm font-bold text-rose-400 tabular-nums mt-0.5">
                        {signal.stopLoss}
                      </div>
                    </div>

                    <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3">
                      <div className="text-[10px] font-semibold text-emerald-400 uppercase">
                        Target 1
                      </div>
                      <div className="text-sm font-bold text-emerald-400 tabular-nums mt-0.5">
                        {Array.isArray(signal.takeProfits) && signal.takeProfits[0]
                          ? String(signal.takeProfits[0])
                          : "—"}
                      </div>
                    </div>

                    <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3">
                      <div className="text-[10px] font-semibold text-emerald-400 uppercase">
                        Target 2
                      </div>
                      <div className="text-sm font-bold text-emerald-400 tabular-nums mt-0.5">
                        {Array.isArray(signal.takeProfits) && signal.takeProfits[1]
                          ? String(signal.takeProfits[1])
                          : "Runner"}
                      </div>
                    </div>
                  </div>

                  {/* Note / Analysis */}
                  {signal.note && (
                    <div className="rounded-lg border border-border/40 bg-secondary/30 p-2.5 text-xs text-muted-foreground/90 leading-relaxed font-mono text-[11px]">
                      <span className="font-semibold text-foreground/80">Strategy:</span>{" "}
                      {signal.note}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
