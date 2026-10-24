import { requireAdmin } from "@/lib/guards";
import { getDb, connectorRequests, users } from "@akg/db";
import { eq, desc } from "drizzle-orm";
import AdminConnectorClient from "./connector-admin";

export default async function AdminConnectorPage() {
  await requireAdmin();
  const db = getDb();

  const requests = await db
    .select({
      id: connectorRequests.id,
      platform: connectorRequests.platform,
      accountNumber: connectorRequests.accountNumber,
      server: connectorRequests.server,
      status: connectorRequests.status,
      createdAt: connectorRequests.createdAt,
      userEmail: users.email,
    })
    .from(connectorRequests)
    .innerJoin(users, eq(users.id, connectorRequests.userId))
    .orderBy(desc(connectorRequests.createdAt));

  return (
    <div className="space-y-8 font-mono">
      <div>
        <div className="text-xs uppercase text-primary tracking-widest">Demo Sandbox Bridge</div>
        <h1 className="text-2xl font-bold mt-1">Connector Demo Requests</h1>
        <p className="text-xs text-muted-foreground mt-1">
          Review simulated trading accounts. Credential decryption is strictly audit-logged.
        </p>
      </div>

      <AdminConnectorClient requests={requests} />
    </div>
  );
}
