import { requireUser } from "@/lib/guards";
import { getDb, bots, botLicenses, paymentNetworks } from "@akg/db";
import { eq, desc } from "drizzle-orm";
import BotsViewClient from "./bots-view";

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
    <div className="space-y-8 font-mono">
      <div>
        <div className="text-xs uppercase text-primary tracking-widest">Algorithmic Systems</div>
        <h1 className="text-2xl font-bold mt-1">MT4 / MT5 Expert Advisors</h1>
        <p className="text-xs text-muted-foreground mt-1">
          Purchase compiled expert advisors with encrypted licenses and signed authentic downloads.
        </p>
      </div>

      <BotsViewClient bots={allBots} myLicenses={userLicenses} networks={networks} />
    </div>
  );
}
