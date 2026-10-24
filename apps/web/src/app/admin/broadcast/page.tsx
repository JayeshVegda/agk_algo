import { requireAdmin } from "@/lib/guards";
import { getDb, messages } from "@akg/db";
import { desc, isNull } from "drizzle-orm";
import AdminBroadcastClient from "./broadcast-admin";

export default async function AdminBroadcastPage() {
  await requireAdmin();
  const db = getDb();

  const sentMessages = await db
    .select()
    .from(messages)
    .where(isNull(messages.deletedAt))
    .orderBy(desc(messages.createdAt));

  return (
    <div className="space-y-8 font-mono">
      <div>
        <div className="text-xs uppercase text-primary tracking-widest">Global Announcements</div>
        <h1 className="text-2xl font-bold mt-1">Broadcast Composer</h1>
        <p className="text-xs text-muted-foreground mt-1">
          Send one-way targeted announcements, cycle alerts, and mandatory acknowledgments.
        </p>
      </div>

      <AdminBroadcastClient messages={sentMessages} />
    </div>
  );
}
