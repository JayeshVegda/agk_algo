import { requireUser } from "@/lib/guards";
import { getDb, messages, messageReads } from "@akg/db";
import { eq, desc, isNull } from "drizzle-orm";
import MessagesFeedClient from "./messages-feed";

export default async function BroadcastFeedPage() {
  await requireUser();
  const db = getDb();

  const allMessages = await db
    .select({
      id: messages.id,
      body: messages.body,
      pinned: messages.pinned,
      requiresAck: messages.requiresAck,
      createdAt: messages.createdAt,
      seenAt: messageReads.seenAt,
      acknowledgedAt: messageReads.acknowledgedAt,
    })
    .from(messages)
    .leftJoin(
      messageReads,
      eq(messages.id, messageReads.messageId),
    )
    .where(isNull(messages.deletedAt))
    .orderBy(desc(messages.pinned), desc(messages.createdAt));

  return (
    <div className="max-w-3xl mx-auto space-y-6 font-mono">
      <div>
        <div className="text-xs uppercase text-primary tracking-widest">Official Channel</div>
        <h1 className="text-2xl font-bold mt-1">Admin Broadcast Feed</h1>
        <p className="text-xs text-muted-foreground mt-1">
          Direct institutional updates, cycle schedules, and priority algorithmic advisories.
        </p>
      </div>

      <MessagesFeedClient initialMessages={allMessages} />
    </div>
  );
}
