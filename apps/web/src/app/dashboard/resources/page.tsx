import { requireUser } from "@/lib/guards";
import { getDb, resources } from "@akg/db";
import { asc } from "drizzle-orm";

export default async function ResourcesPage() {
  await requireUser();
  const db = getDb();

  const allResources = await db
    .select()
    .from(resources)
    .orderBy(asc(resources.sortOrder));

  return (
    <div className="space-y-6 font-mono">
      <div>
        <div className="text-xs uppercase text-primary tracking-widest">Documentation & Media</div>
        <h1 className="text-2xl font-bold mt-1">Trading Resources</h1>
        <p className="text-xs text-muted-foreground mt-1">
          Trading Bot PDF manuals, installation walkthrough videos, and technical documentation.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Core Trading Bot PDF Card */}
        <div className="rounded-xl border border-border bg-card p-6 flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <span className="text-[10px] text-primary border border-primary/30 rounded px-2 py-0.5">
              DOCUMENTATION (PDF)
            </span>
            <h3 className="font-bold text-lg">Institutional Trading Bot Manual</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Comprehensive setup guide covering MetaTrader terminal configuration, DLL imports,
              lot sizing calculations, and automated VPS management.
            </p>
          </div>
          <button className="w-full text-center rounded bg-primary py-2.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors">
            Download PDF Manual
          </button>
        </div>

        {/* Core Trading Bot Video Card */}
        <div className="rounded-xl border border-border bg-card p-6 flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <span className="text-[10px] text-primary border border-primary/30 rounded px-2 py-0.5">
              TRAINING (VIDEO)
            </span>
            <h3 className="font-bold text-lg">Bot Installation Walkthrough</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Step-by-step video demonstration of compiling, installing indicators, applying
              template presets, and validating license connectivity.
            </p>
          </div>
          <button className="w-full text-center rounded bg-accent py-2.5 text-xs font-semibold text-foreground hover:bg-accent/80 transition-colors">
            Watch Walkthrough Video
          </button>
        </div>

        {/* Dynamic Resources */}
        {allResources.map((res) => (
          <div
            key={res.id}
            className="rounded-xl border border-border bg-card p-6 flex flex-col justify-between space-y-4"
          >
            <div className="space-y-2">
              <span className="text-[10px] text-primary border border-primary/30 rounded px-2 py-0.5 uppercase">
                {res.kind}
              </span>
              <h3 className="font-bold text-lg">{res.title}</h3>
            </div>
            <a
              href={res.urlOrFileId}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full text-center rounded bg-accent py-2.5 text-xs font-semibold text-foreground hover:bg-accent/80 transition-colors"
            >
              Access Resource ↗
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
