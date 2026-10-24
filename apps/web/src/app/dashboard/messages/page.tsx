import { requireUser } from "@/lib/guards";
import { getDb, messages, messageReads } from "@akg/db";
import { eq, desc, isNull } from "drizzle-orm";
import MessagesFeedClient from "./messages-feed";

export const dynamic = "force-dynamic";

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
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="border-b border-border/40 pb-5">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-blue-400 border border-blue-500/20">
          <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-pulse" />
          Live SSE Feed
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground mt-1">
          Official Broadcast Stream
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Real-time institutional announcements, cycle schedules, and priority risk advisories pushed via Server-Sent Events
        </p>
      </div>

      <MessagesFeedClient initialMessages={allMessages} />
    </div>
  );
}
