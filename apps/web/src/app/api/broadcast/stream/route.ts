import { NextRequest } from "next/server";
import { getDb, messages } from "@akg/db";
import { desc, isNull } from "drizzle-orm";

export async function GET(_req: NextRequest) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      // Send initial ping
      controller.enqueue(encoder.encode(": connected\n\n"));

      try {
        const db = getDb();
        const recentMessages = await db
          .select()
          .from(messages)
          .where(isNull(messages.deletedAt))
          .orderBy(desc(messages.createdAt))
          .limit(10);

        controller.enqueue(
          encoder.encode(`event: initial\ndata: ${JSON.stringify(recentMessages)}\n\n`),
        );
      } catch (err) {
        controller.enqueue(encoder.encode(`event: error\ndata: ${JSON.stringify(err)}\n\n`));
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
