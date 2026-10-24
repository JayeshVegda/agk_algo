"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { saveSettingsAction } from "@/actions/settings";

interface Props {
  initialSettings: {
    business_timezone: string;
    allow_mid_cycle_join: boolean;
    archive_visible_when_inactive: boolean;
    paused_banner_text: string;
  };
}

export default function SettingsFormClient({ initialSettings }: Props) {
  const router = useRouter();
  const [timezone, setTimezone] = useState(initialSettings.business_timezone);
  const [allowMidJoin, setAllowMidJoin] = useState(initialSettings.allow_mid_cycle_join);
  const [archiveVisible, setArchiveVisible] = useState(
    initialSettings.archive_visible_when_inactive,
  );
  const [pausedText, setPausedText] = useState(initialSettings.paused_banner_text);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSaved(false);

    try {
      await saveSettingsAction({
        business_timezone: timezone,
        allow_mid_cycle_join: allowMidJoin,
        archive_visible_when_inactive: archiveVisible,
        paused_banner_text: pausedText,
      });

      setSaved(true);
      router.refresh();
      setTimeout(() => setSaved(false), 2500);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to save settings");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-border bg-card p-6 space-y-6 text-xs">
      {saved && (
        <div className="rounded border border-green-500/40 bg-green-500/10 p-3 text-xs text-green-400 font-bold">
          ✓ System settings saved successfully.
        </div>
      )}

      <div>
        <label className="text-muted-foreground block mb-1">Business Timezone (IANA)</label>
        <input
          type="text"
          required
          value={timezone}
          onChange={(e) => setTimezone(e.target.value)}
          placeholder="UTC or America/New_York or Asia/Kolkata"
          className="w-full rounded border border-border bg-background px-3 py-2 text-foreground font-mono"
        />
        <span className="text-[10px] text-muted-foreground mt-1 block">
          Cycle start and end day cutoffs are evaluated according to this business timezone.
        </span>
      </div>

      <div>
        <label className="text-muted-foreground block mb-1">Paused Cycle Banner Text</label>
        <textarea
          rows={2}
          value={pausedText}
          onChange={(e) => setPausedText(e.target.value)}
          className="w-full rounded border border-border bg-background px-3 py-2 text-foreground"
        />
      </div>

      <div className="space-y-3 pt-2 border-t border-border/20">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="midJoin"
            checked={allowMidJoin}
            onChange={(e) => setAllowMidJoin(e.target.checked)}
            className="rounded border-border"
          />
          <label htmlFor="midJoin" className="text-muted-foreground">
            Allow Mid-Cycle Joins by Default (Charges full cycle price without proration)
          </label>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="archiveVis"
            checked={archiveVisible}
            onChange={(e) => setArchiveVisible(e.target.checked)}
            className="rounded border-border"
          />
          <label htmlFor="archiveVis" className="text-muted-foreground">
            Archive Visible When Inactive (Historical monthly summaries accessible to past members)
          </label>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded bg-primary py-2.5 font-semibold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
      >
        {loading ? "Saving Parameters..." : "Save Settings"}
      </button>
    </form>
  );
}
