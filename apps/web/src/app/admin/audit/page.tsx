import { requireAdmin } from "@/lib/guards";
import { getDb, auditLog, users } from "@akg/db";
import { desc, eq } from "drizzle-orm";

export default async function AdminAuditPage() {
  await requireAdmin();
  const db = getDb();

  const logs = await db
    .select({
      id: auditLog.id,
      actorId: auditLog.actorId,
      action: auditLog.action,
      entityType: auditLog.entityType,
      entityId: auditLog.entityId,
      diff: auditLog.diff,
      ipHash: auditLog.ipHash,
      createdAt: auditLog.createdAt,
      actorEmail: users.email,
    })
    .from(auditLog)
    .leftJoin(users, eq(users.id, auditLog.actorId))
    .orderBy(desc(auditLog.createdAt))
    .limit(50);

  return (
    <div className="space-y-6 font-mono text-xs">
      <div>
        <div className="text-xs uppercase text-primary tracking-widest">Compliance & Traceability</div>
        <h1 className="text-2xl font-bold mt-1">Audit Log Trail</h1>
        <p className="text-xs text-muted-foreground mt-1">
          Immutable historical audit log of all administrative actions, status changes, and credential decryptions.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {logs.length === 0 ? (
          <div className="p-8 text-center text-xs text-muted-foreground">
            No audit log entries recorded yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-accent/40 text-muted-foreground uppercase text-[10px]">
                <tr>
                  <th className="p-3">Timestamp</th>
                  <th className="p-3">Action</th>
                  <th className="p-3">Actor</th>
                  <th className="p-3">Entity</th>
                  <th className="p-3">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-accent/20">
                    <td className="p-3 text-muted-foreground font-mono">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="p-3 font-bold text-primary">{log.action}</td>
                    <td className="p-3 font-semibold text-foreground">
                      {log.actorEmail || log.actorId || "System"}
                    </td>
                    <td className="p-3 uppercase text-[10px] text-muted-foreground">
                      {log.entityType} {log.entityId ? `(#${log.entityId.slice(0, 8)})` : ""}
                    </td>
                    <td className="p-3 font-mono text-[11px] text-muted-foreground max-w-xs truncate">
                      {log.diff ? JSON.stringify(log.diff) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
