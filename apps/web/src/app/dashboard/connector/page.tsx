import { requireUser } from "@/lib/guards";
import { getDb, connectorRequests } from "@akg/db";
import { eq, desc } from "drizzle-orm";
import { strings } from "@/lib/strings";
import ConnectorDemoClient from "./connector-client";

export const dynamic = "force-dynamic";

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
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="border-b border-border/40 pb-5">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-blue-400 border border-blue-500/20">
          <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-pulse" />
          Execution Bridge Sandbox
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground mt-1">
          Automated Connector Demo
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Simulated institutional paper-trading execution bridge for MetaTrader 4 & 5 accounts.
        </p>
      </div>

      {/* Prominent Warning Banner */}
      <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-6 text-xs text-muted-foreground space-y-2">
        <div className="font-bold text-amber-400 flex items-center gap-2 text-sm">
          <span>⚠ DEMO ACCOUNT SAFEGUARD & SIMULATION NOTICE</span>
        </div>
        <p className="leading-relaxed text-foreground/80">{strings.connector.warning}</p>
        <p className="text-[11px] text-muted-foreground/80 leading-relaxed">
          Do not enter credentials for live, real-money funded broker accounts. All requests are
          encrypted at rest with AES-256-GCM and executed strictly on simulated paper engines.
        </p>
      </div>

      <ConnectorDemoClient existingRequests={requests} />
    </div>
  );
}
