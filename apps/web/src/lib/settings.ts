import { getDb, settings } from "@akg/db";
import { eq } from "drizzle-orm";

export interface SystemSettings {
  business_timezone: string;
  allow_mid_cycle_join: boolean;
  archive_visible_when_inactive: boolean;
  reminder_days: number[];
  paused_banner_text: string;
}

export const defaultSettings: SystemSettings = {
  business_timezone: "UTC",
  allow_mid_cycle_join: false,
  archive_visible_when_inactive: true,
  reminder_days: [7, 3, 1],
  paused_banner_text: "The current cycle has concluded. The next trading cycle opens soon.",
};

export async function getSetting<K extends keyof SystemSettings>(
  key: K,
): Promise<SystemSettings[K]> {
  try {
    const db = getDb();
    const rows = await db.select().from(settings).where(eq(settings.key, key)).limit(1);

    if (rows.length === 0 || rows[0].value === null || rows[0].value === undefined) {
      return defaultSettings[key];
    }

    return rows[0].value as SystemSettings[K];
  } catch {
    return defaultSettings[key];
  }
}

export async function setSetting<K extends keyof SystemSettings>(
  key: K,
  value: SystemSettings[K],
): Promise<void> {
  const db = getDb();
  await db
    .insert(settings)
    .values({
      key,
      value: value as unknown as Record<string, unknown>,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: settings.key,
      set: {
        value: value as unknown as Record<string, unknown>,
        updatedAt: new Date(),
      },
    });
}
