import { requireUser } from "@/lib/guards";
import { getDb, brokerLinks } from "@akg/db";
import { eq, asc } from "drizzle-orm";

export default async function BrokerLinksPage() {
  await requireUser();
  const db = getDb();

  const brokers = await db
    .select()
    .from(brokerLinks)
    .where(eq(brokerLinks.active, true))
    .orderBy(asc(brokerLinks.sortOrder));

  return (
    <div className="space-y-6 font-mono">
      <div>
        <div className="text-xs uppercase text-primary tracking-widest">Recommended Infrastructure</div>
        <h1 className="text-2xl font-bold mt-1">Trading Accounts & Brokers</h1>
        <p className="text-xs text-muted-foreground mt-1">
          Vetted foreign exchange and CFD brokers with low spreads, raw execution, and VPS compatibility.
        </p>
      </div>

      {brokers.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center text-xs text-muted-foreground">
          Broker account opening links will appear here once configured by the admin team.
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {brokers.map((broker) => (
            <div
              key={broker.id}
              className="rounded-xl border border-border bg-card p-6 flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2">
                <h3 className="font-bold text-lg">{broker.name}</h3>
                {broker.description && (
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {broker.description}
                  </p>
                )}
              </div>
              <a
                href={broker.url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full text-center rounded bg-primary py-2.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Open Trading Account ↗
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
