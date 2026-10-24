import { requireUser } from "@/lib/guards";
import { getDb, newsPosts } from "@akg/db";
import { desc } from "drizzle-orm";
import { TradingViewChart } from "@/components/TradingViewChart";

export const dynamic = "force-dynamic";

export default async function ChartsAndNewsPage() {
  await requireUser();
  const db = getDb();
  const posts = await db
    .select()
    .from(newsPosts)
    .orderBy(desc(newsPosts.publishedAt))
    .limit(5);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b border-border/40 pb-5">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-blue-400 border border-blue-500/20">
          <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-pulse" />
          Realtime Market Feed
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground mt-1">
          Interactive Charts & Market Intelligence
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Live institutional candlestick analysis, multi-timeframe overlays, and macroeconomic news
        </p>
      </div>

      {/* Embedded Live Chart */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground">Advanced TradingView Terminal</h2>
          <span className="text-xs text-muted-foreground font-mono">Real-time Stream · 15M Interval</span>
        </div>
        <TradingViewChart initialSymbol="OANDA:XAUUSD" />
      </div>

      {/* External Resources & Calendars */}
      <div className="grid md:grid-cols-2 gap-4 pt-2">
        <a
          href="https://www.forexfactory.com/calendar"
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-2xl border border-border/80 bg-card/80 p-6 flex flex-col justify-between hover:border-blue-500/40 hover:bg-card transition-all group shadow-sm"
        >
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-foreground group-hover:text-blue-400 transition-colors">
                Forex Factory Economic Calendar ↗
              </span>
              <span className="rounded bg-secondary px-2 py-0.5 text-[10px] font-bold text-muted-foreground uppercase">
                External Link
              </span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Track Tier 1 high-impact macroeconomic data releases, non-farm payrolls (NFP), FOMC rate decisions, and central bank commentary.
            </p>
          </div>
          <div className="text-xs font-semibold text-blue-400 pt-4 flex items-center gap-1">
            Open Economic Calendar →
          </div>
        </a>

        <a
          href="https://www.tradingview.com"
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-2xl border border-border/80 bg-card/80 p-6 flex flex-col justify-between hover:border-blue-500/40 hover:bg-card transition-all group shadow-sm"
        >
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-foreground group-hover:text-blue-400 transition-colors">
                TradingView Market Screener ↗
              </span>
              <span className="rounded bg-secondary px-2 py-0.5 text-[10px] font-bold text-muted-foreground uppercase">
                External Link
              </span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Scan forex pairs, indices, and precious metals across multi-timeframe volume profiles, RSI divergences, and moving averages.
            </p>
          </div>
          <div className="text-xs font-semibold text-blue-400 pt-4 flex items-center gap-1">
            Open Market Screener →
          </div>
        </a>
      </div>

      {/* Internal News Posts Feed */}
      <div className="space-y-4 pt-2">
        <h2 className="text-lg font-bold text-foreground">Desk Announcements & Macro Notes</h2>
        {posts.length === 0 ? (
          <div className="rounded-2xl border border-border/80 bg-card/40 p-8 text-center text-xs text-muted-foreground">
            No macroeconomic announcements logged today.
          </div>
        ) : (
          <div className="space-y-3">
            {posts.map((post) => (
              <div
                key={post.id}
                className="rounded-2xl border border-border/80 bg-card/80 p-5 space-y-2"
              >
                <div className="flex justify-between items-center text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground">{post.title}</span>
                  <span className="font-mono text-[10px]">
                    {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString() : ""}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{post.body}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
