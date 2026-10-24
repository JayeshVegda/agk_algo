import { requireUser } from "@/lib/guards";
import { getDb, newsPosts } from "@akg/db";
import { desc } from "drizzle-orm";

export default async function ChartsAndNewsPage() {
  await requireUser();
  const db = getDb();
  const posts = await db
    .select()
    .from(newsPosts)
    .orderBy(desc(newsPosts.publishedAt))
    .limit(5);

  return (
    <div className="space-y-8 font-mono">
      <div>
        <div className="text-xs uppercase text-primary tracking-widest">Market Intelligence</div>
        <h1 className="text-2xl font-bold mt-1">Live Charts & Economic News</h1>
        <p className="text-xs text-muted-foreground mt-1">
          TradingView terminal widgets, economic event calendar, and broker announcements.
        </p>
      </div>

      {/* External Link-Out Cards */}
      <div className="grid md:grid-cols-2 gap-4">
        <a
          href="https://www.forexfactory.com/calendar"
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-xl border border-border bg-card p-5 flex items-center justify-between hover:bg-accent/40 transition-colors group"
        >
          <div>
            <div className="font-bold text-sm group-hover:text-primary transition-colors">
              Forex Factory Economic Calendar ↗
            </div>
            <div className="text-[11px] text-muted-foreground mt-1">
              High-impact macroeconomic releases, central bank interest rates, and NFP data.
            </div>
          </div>
          <span className="text-xs text-primary">External Link</span>
        </a>

        <a
          href="https://www.tradingview.com"
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-xl border border-border bg-card p-5 flex items-center justify-between hover:bg-accent/40 transition-colors group"
        >
          <div>
            <div className="font-bold text-sm group-hover:text-primary transition-colors">
              TradingView Advanced Screener ↗
            </div>
            <div className="text-[11px] text-muted-foreground mt-1">
              Multi-timeframe technical indicator scanner and heatmaps.
            </div>
          </div>
          <span className="text-xs text-primary">External Link</span>
        </a>
      </div>

      {/* Embedded Chart Area */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <div className="flex justify-between items-center pb-3 border-b border-border/20">
          <span className="font-bold text-sm">Interactive Market Chart</span>
          <span className="text-[11px] text-muted-foreground">Symbol: EURUSD / XAUUSD</span>
        </div>
        <div className="w-full h-96 bg-background/80 rounded border border-border/40 flex items-center justify-center text-center p-6 text-xs text-muted-foreground">
          <div className="space-y-2">
            <div className="text-primary font-bold text-base">TradingView Chart Viewport</div>
            <p className="max-w-md">
              Embeddable TradingView widget renders real-time financial candlestick data and volume profiles.
            </p>
          </div>
        </div>
      </div>

      {/* Latest Market News */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold">Latest Algo & Market Bulletins</h2>
        {posts.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-6 text-xs text-muted-foreground">
            No market bulletins published at this time.
          </div>
        ) : (
          <div className="space-y-3">
            {posts.map((post) => (
              <div key={post.id} className="rounded-xl border border-border bg-card p-5 space-y-2 text-xs">
                <div className="flex justify-between items-start">
                  <h3 className="font-bold text-sm text-foreground">{post.title}</h3>
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(post.publishedAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">{post.body}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
