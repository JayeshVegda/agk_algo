import { getDb, termsVersions } from "@akg/db";
import { desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export default async function TermsPage() {
  let currentTerms = {
    version: "1.0",
    body: "Risk Disclosure and Terms of Service: Algorithmic trading and foreign exchange investments involve substantial financial risk.",
    publishedAt: new Date(),
  };

  try {
    const db = getDb();
    const versions = await db
      .select()
      .from(termsVersions)
      .orderBy(desc(termsVersions.publishedAt))
      .limit(1);

    if (versions.length > 0) {
      currentTerms = versions[0];
    }
  } catch {
    // Graceful fallback if database is not reachable at build time
  }

  return (
    <div className="py-12 sm:py-16">
      <div className="container mx-auto max-w-4xl px-4 sm:px-6 space-y-8 font-mono">
        <div className="border-b border-border/40 pb-4">
          <div className="text-xs uppercase text-primary">Legal & Risk Agreement</div>
          <h1 className="text-3xl font-bold mt-1">Terms of Service — v{currentTerms.version}</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Last Updated: {new Date(currentTerms.publishedAt).toLocaleDateString()}
          </p>
        </div>

        <div className="prose prose-invert max-w-none text-xs sm:text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap rounded-lg border border-border bg-card p-6">
          {currentTerms.body}
        </div>
      </div>
    </div>
  );
}
