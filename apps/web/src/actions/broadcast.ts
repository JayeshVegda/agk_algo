"use server";

import { getDb, messages, messageReads } from "@akg/db";
import { requireAdmin, requireUser } from "@/lib/guards";
import { writeAudit } from "@/lib/audit";

export async function sendBroadcastAction(params: {
  body: string;
  audienceType?: "all" | "active_subscribers" | "cycle" | "plan_tier" | "single_user";
  audienceRef?: string;
  pinned?: boolean;
  requiresAck?: boolean;
  attachmentFileId?: string;
}) {
  const adminCtx = await requireAdmin();
  const db = getDb();

  const body = params.body.trim();
  if (!body) {
    throw new Error("Message body cannot be empty");
  }
  if (body.length > 4000) {
    throw new Error("Message exceeds 4,000 character maximum");
  }

  const [message] = await db
    .insert(messages)
    .values({
      authorId: adminCtx.user.id,
      body,
      audienceType: params.audienceType || "all",
      audienceRef: params.audienceRef || null,
      pinned: !!params.pinned,
      requiresAck: !!params.requiresAck,
      attachmentFileId: params.attachmentFileId || null,
    })
    .returning();

  await writeAudit({
    actorId: adminCtx.user.id,
    action: "broadcast.send",
    entityType: "message",
    entityId: message.id,
    diff: {
      audienceType: message.audienceType,
      pinned: message.pinned,
      requiresAck: message.requiresAck,
    },
  });

  return message;
}

export async function acknowledgeBroadcastAction(messageId: string) {
  const ctx = await requireUser();
  const db = getDb();

  await db
    .insert(messageReads)
    .values({
      messageId,
      userId: ctx.user.id,
      seenAt: new Date(),
      acknowledgedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [messageReads.messageId, messageReads.userId],
      set: {
        acknowledgedAt: new Date(),
      },
    });

  return { success: true };
}

export async function markBroadcastSeenAction(messageId: string) {
  const ctx = await requireUser();
  const db = getDb();

  await db
    .insert(messageReads)
    .values({
      messageId,
      userId: ctx.user.id,
      seenAt: new Date(),
    })
    .onConflictDoNothing({
      target: [messageReads.messageId, messageReads.userId],
    });

  return { success: true };
}
