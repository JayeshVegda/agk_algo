import { requireUser } from "@/lib/guards";
import { getDb, connectorRequests } from "@akg/db";
import { eq, desc } from "drizzle-orm";
import { strings } from "@/lib/strings";
import ConnectorDemoClient from "./connector-client";

export default async function ConnectorDemoPage() {
  const ctx = await requireUser();
  const db = getDb();

  const requests = await db
    .select({
      id: connectorRequests.id,
      platform: connectorRequests.platform,
      accountNumber: connectorRequests.accountNumber,
      server: connectorRequests.server,
      status: connectorRequests.status,
      createdAt: connectorRequests.createdAt,
    })
    .from(connectorRequests)
    .where(eq(connectorRequests.userId, ctx.user.id))
    .orderBy(desc(connectorRequests.createdAt));

  return (
    <div className="max-w-3xl mx-auto space-y-6 font-mono">
      <div>
        <div className="text-xs uppercase text-primary tracking-widest">Automated Simulation</div>
        <h1 className="text-2xl font-bold mt-1">Connector Demo</h1>
        <p className="text-xs text-muted-foreground mt-1">
          Simulated institutional paper-trading execution bridge for MetaTrader accounts.
        </p>
      </div>

      {/* Prominent Warning Banner */}
      <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-5 text-xs text-muted-foreground space-y-2">
        <div className="font-bold text-destructive flex items-center gap-2">
          <span>⚠ DEMO ACCOUNT NOTICE & HARD CODED SAFEGUARD</span>
        </div>
        <p>{strings.connector.warning}</p>
        <p className="text-[11px] text-muted-foreground/80">
          Under no circumstances enter credentials for a live, real-money funded broker account.
          Our backend executes strictly on mock sandbox engines.
        </p>
      </div>

      <ConnectorDemoClient existingRequests={requests} />
    </div>
  );
}
