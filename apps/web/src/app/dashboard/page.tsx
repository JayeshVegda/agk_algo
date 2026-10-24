import { requireUser } from "@/lib/guards";
import { getDb, cycles, enrolments, signals, plans } from "@akg/db";
import { eq, desc } from "drizzle-orm";
import { hasSignalAccess } from "@akg/core";
import { getSetting } from "@/lib/settings";

export default async function DashboardPage() {
  const ctx = await requireUser();
  const db = getDb();
  const businessTimezone = await getSetting("business_timezone");
  const pausedBannerText = await getSetting("paused_banner_text");

  // 1. Fetch current/upcoming cycles
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

  const hasSR = hasSignalAccess(userAccessContext, "SR_SIGNAL_BOX", {
    now: new Date(),
    businessTimezone,
  });
  const hasPerfect = hasSignalAccess(userAccessContext, "PERFECT_SIGNAL_BOX", {
    now: new Date(),
    businessTimezone,
  });

  // 3. Fetch today's signals if entitled
  let todaySignals: (typeof signals.$inferSelect)[] = [];
  if (hasSR || hasPerfect) {
    todaySignals = await db
      .select()
      .from(signals)
      .where(eq(signals.status, "published"))
      .orderBy(desc(signals.publishedAt))
      .limit(10);

    // Filter by entitlement
    todaySignals = todaySignals.filter((s) => {
      if (s.planTier === "SR_SIGNAL_BOX" && hasSR) return true;
      if (s.planTier === "PERFECT_SIGNAL_BOX" && hasPerfect) return true;
      return false;
    });
  }

  return (
    <div className="space-y-8 font-mono">
      <div>
        <div className="text-xs uppercase text-primary tracking-widest">Live Operations</div>
        <h1 className="text-2xl font-bold mt-1">Trading Dashboard</h1>
      </div>

      {/* Cycle Status Banner */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span
                className={`inline-block h-2.5 w-2.5 rounded-full ${
                  currentCycle?.status === "running"
                    ? "bg-green-500 animate-pulse"
                    : currentCycle?.status === "renewal_open"
                      ? "bg-yellow-500 animate-pulse"
                      : "bg-red-500"
                }`}
              />
              <span className="font-bold text-sm">
                {currentCycle
                  ? `Cycle: ${currentCycle.name} (${currentCycle.status.toUpperCase()})`
                  : "No Active Cycle"}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {currentCycle?.status === "running"
                ? `Running Period: ${currentCycle.startsOn} to ${currentCycle.endsOn} (${businessTimezone})`
                : currentCycle?.status === "renewal_open"
                  ? "Cycle renewals are currently open for enrollment."
                  : pausedBannerText}
            </p>
          </div>

          <a
            href="/dashboard/subscribe"
            className="rounded bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 text-center transition-colors"
          >
            {hasSR || hasPerfect ? "Extend / Upgrade Plan" : "Enroll in Cycle"}
          </a>
        </div>
      </div>

      {/* Signals Feed */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">Today's Signals</h2>
          <a href="/dashboard/archive" className="text-xs text-primary hover:underline">
            View Monthly Performance Archive →
          </a>
        </div>

        {!hasSR && !hasPerfect ? (
          <div className="rounded-xl border border-border bg-card/60 p-8 text-center space-y-4">
            <div className="text-sm font-semibold">Active Subscription Required</div>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              Live algorithmic signals are exclusive to enrolled members during running cycles.
              Subscribe to unlock SR and Perfect tier signals.
            </p>
            <a
              href="/dashboard/subscribe"
              className="inline-block rounded bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
            >
              Choose Plan
            </a>
          </div>
        ) : todaySignals.length === 0 ? (
          <div className="rounded-xl border border-border bg-card/40 p-8 text-center text-xs text-muted-foreground">
            No signals published yet today. The algorithms are monitoring active market sessions.
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {todaySignals.map((signal) => (
              <div
                key={signal.id}
                className="rounded-xl border border-border bg-card p-5 space-y-3"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-base font-bold">{signal.symbol}</span>
                    <span
                      className={`ml-2 px-2 py-0.5 rounded text-[10px] font-bold ${
                        signal.direction === "BUY"
                          ? "bg-green-500/20 text-green-400"
                          : "bg-red-500/20 text-red-400"
                      }`}
                    >
                      {signal.direction}
                    </span>
                  </div>
                  <span className="text-[10px] text-muted-foreground rounded bg-accent px-2 py-0.5">
                    {signal.planTier === "SR_SIGNAL_BOX" ? "SR Tier" : "Perfect Tier"}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs border-y border-border/30 py-2">
                  <div>
                    <span className="text-muted-foreground text-[10px] block">Entry</span>
                    <span className="font-semibold">{signal.entry}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-[10px] block">Stop Loss</span>
                    <span className="font-semibold text-destructive">{signal.stopLoss}</span>
                  </div>
                </div>

                <div className="text-xs">
                  <span className="text-muted-foreground text-[10px] block">Take Profits</span>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {Array.isArray(signal.takeProfits) &&
                      signal.takeProfits.map((tp, idx) => (
                        <span
                          key={idx}
                          className="bg-primary/10 border border-primary/20 text-primary px-2 py-0.5 rounded text-[11px]"
                        >
                          TP{idx + 1}: {String(tp)}
                        </span>
                      ))}
                  </div>
                </div>

                {signal.note && (
                  <p className="text-[11px] text-muted-foreground/90 italic pt-1 border-t border-border/20">
                    "{signal.note}"
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
