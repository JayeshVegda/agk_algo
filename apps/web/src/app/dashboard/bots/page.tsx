import { requireUser } from "@/lib/guards";
import { getDb, bots, botLicenses, paymentNetworks } from "@akg/db";
import { eq, desc } from "drizzle-orm";
import BotsViewClient from "./bots-view";

export const dynamic = "force-dynamic";

export default async function BotStorePage() {
  const ctx = await requireUser();
  const db = getDb();

  const allBots = await db.select().from(bots).where(eq(bots.active, true));

  const userLicenses = await db
    .select({
      licenseId: botLicenses.id,
      licenseKey: botLicenses.licenseKey,
      boundAccountNumber: botLicenses.boundAccountNumber,
      rebindCount: botLicenses.rebindCount,
      status: botLicenses.status,
      botName: bots.name,
      platform: bots.platform,
      createdAt: botLicenses.createdAt,
    })
    .from(botLicenses)
    .innerJoin(bots, eq(bots.id, botLicenses.botId))
    .where(eq(botLicenses.userId, ctx.user.id))
    .orderBy(desc(botLicenses.createdAt));

  const networks = await db
    .select()
    .from(paymentNetworks)
    .where(eq(paymentNetworks.enabled, true));

  return (
    <div className="space-y-8">
      <div className="border-b border-border/40 pb-5">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-blue-400 border border-blue-500/20">
          <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-pulse" />
          Validated Algorithmic Systems
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground mt-1">
          MT4 & MT5 Expert Advisors
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Acquire compiled expert advisor binaries with cryptographic license keys, hardware/account bindings, and signed downloads.
        </p>
      </div>

      <BotsViewClient bots={allBots} myLicenses={userLicenses} networks={networks} />
    </div>
  );
}
