import { requireAdmin } from "@/lib/guards";
import { getDb, bots, botLicenses, users } from "@akg/db";
import { eq, desc } from "drizzle-orm";
import AdminBotsClient from "./bots-admin";

export default async function AdminBotsPage() {
  await requireAdmin();
  const db = getDb();

  const allBots = await db.select().from(bots).orderBy(desc(bots.createdAt));

  const allLicenses = await db
    .select({
      id: botLicenses.id,
      licenseKey: botLicenses.licenseKey,
      boundAccountNumber: botLicenses.boundAccountNumber,
      rebindCount: botLicenses.rebindCount,
      status: botLicenses.status,
      botName: bots.name,
      userEmail: users.email,
      createdAt: botLicenses.createdAt,
    })
    .from(botLicenses)
    .innerJoin(bots, eq(bots.id, botLicenses.botId))
    .innerJoin(users, eq(users.id, botLicenses.userId))
    .orderBy(desc(botLicenses.createdAt));

  return (
    <div className="space-y-8 font-mono">
      <div>
        <div className="text-xs uppercase text-primary tracking-widest">Algorithmic Products</div>
        <h1 className="text-2xl font-bold mt-1">Bots & License Keys</h1>
        <p className="text-xs text-muted-foreground mt-1">
          Create Expert Advisors, set one-time prices, inspect generated licenses, and manage account bindings.
        </p>
      </div>

      <AdminBotsClient bots={allBots} licenses={allLicenses} />
    </div>
  );
}
