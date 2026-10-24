"use client";

import { useState, useEffect } from "react";
import { acknowledgeBroadcastAction, markBroadcastSeenAction } from "@/actions/broadcast";

interface BroadcastMessage {
  id: string;
  body: string;
  pinned: boolean;
  requiresAck: boolean;
  createdAt: Date | string;
  seenAt: Date | string | null;
  acknowledgedAt: Date | string | null;
}

export default function MessagesFeedClient({
  initialMessages,
}: {
  initialMessages: BroadcastMessage[];
}) {
  const [items, setItems] = useState<BroadcastMessage[]>(initialMessages);

  useEffect(() => {
    // Mark unseen messages as seen
    for (const msg of items) {
      if (!msg.seenAt) {
        markBroadcastSeenAction(msg.id).catch(() => {});
      }
    }
  }, [items]);

  const handleAck = async (messageId: string) => {
    try {
      await acknowledgeBroadcastAction(messageId);
      setItems((prev) =>
        prev.map((m) =>
          m.id === messageId ? { ...m, acknowledgedAt: new Date().toISOString() } : m,
        ),
      );
    } catch (err) {
      console.error("Failed to acknowledge message:", err);
    }
  };

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 text-center text-xs text-muted-foreground">
        No announcements posted yet.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {items.map((msg) => (
        <div
          key={msg.id}
          className={`rounded-xl border p-6 space-y-4 transition-colors ${
            msg.pinned
              ? "border-primary/40 bg-primary/5"
              : "border-border bg-card"
          }`}
        >
          <div className="flex items-center justify-between text-[11px] text-muted-foreground pb-2 border-b border-border/20">
            <div className="flex items-center gap-2">
              {msg.pinned && (
                <span className="bg-primary/20 text-primary px-2 py-0.5 rounded text-[10px] font-bold">
                  PINNED
                </span>
              )}
              <span>System Announcement</span>
            </div>
            <span>{new Date(msg.createdAt).toLocaleString()}</span>
          </div>

          <div className="text-xs text-foreground/90 whitespace-pre-wrap leading-relaxed">
            {msg.body}
          </div>

          {msg.requiresAck && (
            <div className="pt-2 border-t border-border/20 flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground">
                Acknowledgment required by administration
              </span>
              {msg.acknowledgedAt ? (
                <span className="text-green-400 font-bold text-xs flex items-center gap-1">
                  ✓ Acknowledged
                </span>
              ) : (
                <button
                  onClick={() => handleAck(msg.id)}
                  className="rounded bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
                >
                  Got it
                </button>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
