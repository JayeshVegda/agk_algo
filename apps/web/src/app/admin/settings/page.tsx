import { requireAdmin } from "@/lib/guards";
import { getSetting } from "@/lib/settings";
import SettingsFormClient from "./settings-form";

export default async function AdminSettingsPage() {
  await requireAdmin();

  const businessTimezone = await getSetting("business_timezone");
  const allowMidCycleJoin = await getSetting("allow_mid_cycle_join");
  const archiveVisibleWhenInactive = await getSetting("archive_visible_when_inactive");
  const pausedBannerText = await getSetting("paused_banner_text");

  return (
    <div className="max-w-3xl mx-auto space-y-8 font-mono">
      <div>
        <div className="text-xs uppercase text-primary tracking-widest">Platform Parameters</div>
        <h1 className="text-2xl font-bold mt-1">System & Business Settings</h1>
        <p className="text-xs text-muted-foreground mt-1">
          Control operational timezone calculations, mid-cycle enrollment rules, and paused banner messages.
        </p>
      </div>

      <SettingsFormClient
        initialSettings={{
          business_timezone: businessTimezone,
          allow_mid_cycle_join: allowMidCycleJoin,
          archive_visible_when_inactive: archiveVisibleWhenInactive,
          paused_banner_text: pausedBannerText,
        }}
      />
    </div>
  );
}
