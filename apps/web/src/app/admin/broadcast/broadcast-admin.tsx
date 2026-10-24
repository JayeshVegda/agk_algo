"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { sendBroadcastAction } from "@/actions/broadcast";

interface MessageItem {
  id: string;
  body: string;
  audienceType: string;
  pinned: boolean;
  requiresAck: boolean;
  createdAt: Date | string;
}

export default function AdminBroadcastClient({ messages }: { messages: MessageItem[] }) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [audienceType, setAudienceType] = useState<
    "all" | "active_subscribers" | "cycle" | "plan_tier" | "single_user"
  >("all");
  const [pinned, setPinned] = useState(false);
  const [requiresAck, setRequiresAck] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await sendBroadcastAction({
        body,
        audienceType,
        pinned,
        requiresAck,
      });

      setBody("");
      setPinned(false);
      setRequiresAck(false);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to dispatch broadcast");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Broadcast Composer */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <h3 className="font-bold text-sm">Compose Announcement ("Chat Box")</h3>

        {error && (
          <div className="rounded border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">
            {error}
          </div>
        )}

        <form onSubmit={handleSend} className="space-y-4 text-xs">
          <div>
            <label className="text-muted-foreground block mb-1">Target Audience</label>
            <select
              value={audienceType}
              onChange={(e) =>
                setAudienceType(
                  e.target.value as "all" | "active_subscribers" | "cycle" | "plan_tier" | "single_user",
                )
              }
              className="w-full rounded border border-border bg-background px-3 py-2 text-foreground"
            >
              <option value="all">All Registered Users</option>
              <option value="active_subscribers">Active Paid Subscribers Only</option>
              <option value="plan_tier">Specific Plan Tier</option>
            </select>
          </div>

          <div>
            <label className="text-muted-foreground block mb-1">Message Content (Max 4,000 Chars)</label>
            <textarea
              required
              rows={4}
              maxLength={4000}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="e.g. Scheduled broker maintenance tomorrow during Asian session. Signals resume at London open."
              className="w-full rounded border border-border bg-background px-3 py-2 text-foreground focus:border-primary focus:outline-none"
            />
            <div className="text-[10px] text-muted-foreground text-right mt-1">
              {body.length} / 4000 characters
            </div>
          </div>

          <div className="flex flex-wrap gap-6 pt-1">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="pin"
                checked={pinned}
                onChange={(e) => setPinned(e.target.checked)}
                className="rounded border-border"
              />
              <label htmlFor="pin" className="text-muted-foreground">
                Pin to top of user feed
              </label>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="ack"
                checked={requiresAck}
                onChange={(e) => setRequiresAck(e.target.checked)}
                className="rounded border-border"
              />
              <label htmlFor="ack" className="text-muted-foreground">
                Require "Got it" user acknowledgment
              </label>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded bg-primary py-2.5 font-semibold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {loading ? "Transmitting..." : "Send Announcement"}
          </button>
        </form>
      </div>

      {/* Sent Log */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="p-4 border-b border-border/40 font-bold text-sm">Dispatched Broadcasts</div>
        {messages.length === 0 ? (
          <div className="p-8 text-center text-xs text-muted-foreground">
            No broadcast messages sent yet.
          </div>
        ) : (
          <div className="divide-y divide-border/20 text-xs">
            {messages.map((m) => (
              <div key={m.id} className="p-5 space-y-2 hover:bg-accent/10">
                <div className="flex justify-between items-start text-[11px] text-muted-foreground">
                  <div className="flex items-center gap-2">
                    {m.pinned && (
                      <span className="bg-primary/20 text-primary px-2 py-0.5 rounded text-[10px] font-bold">
                        PINNED
                      </span>
                    )}
                    <span className="uppercase text-[10px] font-bold text-foreground">
                      Audience: {m.audienceType}
                    </span>
                    {m.requiresAck && (
                      <span className="bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded text-[10px]">
                        Requires Ack
                      </span>
                    )}
                  </div>
                  <span>{new Date(m.createdAt).toLocaleString()}</span>
                </div>
                <p className="text-foreground whitespace-pre-wrap leading-relaxed">{m.body}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
