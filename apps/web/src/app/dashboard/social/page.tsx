import { requireUser } from "@/lib/guards";
import { getDb, socialLinks, socialPosts } from "@akg/db";
import { eq, desc } from "drizzle-orm";

export default async function SocialPage() {
  await requireUser();
  const db = getDb();

  const _links = await db.select().from(socialLinks).where(eq(socialLinks.active, true));
  const posts = await db
    .select()
    .from(socialPosts)
    .orderBy(desc(socialPosts.publishedAt))
    .limit(6);

  const defaultProfiles = [
    { platform: "Telegram Channel", url: "https://t.me", desc: "Real-time alerts and broadcast updates" },
    { platform: "YouTube Channel", url: "https://youtube.com", desc: "Weekly market reviews and algo backtests" },
    { platform: "Instagram", url: "https://instagram.com", desc: "Trading setups and daily performance recaps" },
    { platform: "WhatsApp Support", url: "https://whatsapp.com", desc: "Client communications channel" },
  ];

  return (
    <div className="space-y-8 font-mono">
      <div>
        <div className="text-xs uppercase text-primary tracking-widest">Community & Outlets</div>
        <h1 className="text-2xl font-bold mt-1">Official Social Media</h1>
        <p className="text-xs text-muted-foreground mt-1">
          Follow verified channels for technical breakdowns, community updates, and release logs.
        </p>
      </div>

      {/* Social Outlets */}
      <div className="grid md:grid-cols-2 gap-4">
        {defaultProfiles.map((p) => (
          <a
            key={p.platform}
            href={p.url}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-xl border border-border bg-card p-5 flex items-center justify-between hover:bg-accent/30 transition-colors group"
          >
            <div>
              <div className="font-bold text-sm group-hover:text-primary transition-colors">
                {p.platform} ↗
              </div>
              <div className="text-[11px] text-muted-foreground mt-0.5">{p.desc}</div>
            </div>
            <span className="text-xs text-primary font-bold">Join</span>
          </a>
        ))}
      </div>

      {/* Admin Curated Latest Social Posts */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold">Recent Social Posts</h2>
        {posts.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-8 text-center text-xs text-muted-foreground">
            No recent social highlights posted yet.
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-4">
            {posts.map((post) => (
              <div key={post.id} className="rounded-xl border border-border bg-card p-5 space-y-3 text-xs">
                <div className="text-[10px] text-primary uppercase font-bold">{post.platform}</div>
                <h4 className="font-bold text-sm text-foreground">{post.title}</h4>
                <a
                  href={post.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline block pt-2"
                >
                  View Original Post ↗
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
