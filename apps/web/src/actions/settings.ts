"use server";

import { requireAdmin } from "@/lib/guards";
import { setSetting, type SystemSettings } from "@/lib/settings";
import { writeAudit } from "@/lib/audit";

export async function saveSettingsAction(settings: Partial<SystemSettings>) {
  const adminCtx = await requireAdmin();

  if (settings.business_timezone !== undefined) {
    await setSetting("business_timezone", settings.business_timezone);
  }
  if (settings.allow_mid_cycle_join !== undefined) {
    await setSetting("allow_mid_cycle_join", settings.allow_mid_cycle_join);
  }
  if (settings.archive_visible_when_inactive !== undefined) {
    await setSetting("archive_visible_when_inactive", settings.archive_visible_when_inactive);
  }
  if (settings.paused_banner_text !== undefined) {
    await setSetting("paused_banner_text", settings.paused_banner_text);
  }

  await writeAudit({
    actorId: adminCtx.user.id,
    action: "settings.update",
    entityType: "settings",
    diff: settings as Record<string, unknown>,
  });

  return { success: true };
}
