import { PlatformSettings } from "@/src/models/PlatformSettings";
import {
  PLATFORM_SETTINGS_KEYS,
  DEFAULT_PLATFORM_SETTINGS,
  type PlatformSettingsKey,
} from "@/src/constants/platform-settings";

export type SettingsObject = Record<PlatformSettingsKey, unknown>;

export async function getPlatformSettings(): Promise<SettingsObject> {
  const records = await PlatformSettings.find().lean();
  const map = new Map<string, unknown>();

  for (const rec of records) {
    map.set(rec.key as string, (rec as Record<string, unknown>).value);
  }

  const settings = {} as SettingsObject;

  for (const key of PLATFORM_SETTINGS_KEYS) {
    settings[key] = map.has(key) ? map.get(key) : DEFAULT_PLATFORM_SETTINGS[key];
  }

  return settings;
}

export async function updatePlatformSettings(
  updates: Partial<Record<PlatformSettingsKey, unknown>>,
  updatedBy?: string,
): Promise<SettingsObject> {
  const ops = Object.entries(updates).map(([key, value]) =>
    PlatformSettings.updateOne(
      { key },
      { $set: { value, updatedBy: updatedBy ?? "" } },
      { upsert: true },
    ),
  );

  await Promise.all(ops);

  return getPlatformSettings();
}

export async function ensureDefaultPlatformSettings(): Promise<{
  created: string[];
  skipped: string[];
}> {
  const created: string[] = [];
  const skipped: string[] = [];

  for (const key of PLATFORM_SETTINGS_KEYS) {
    const exists = await PlatformSettings.findOne({ key }).lean();

    if (exists) {
      skipped.push(key);
    } else {
      await PlatformSettings.create({
        key,
        value: DEFAULT_PLATFORM_SETTINGS[key],
        updatedBy: "system",
      });
      created.push(key);
    }
  }

  return { created, skipped };
}
