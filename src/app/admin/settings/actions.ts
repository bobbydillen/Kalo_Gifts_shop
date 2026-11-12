"use server";

import { revalidatePath, updateTag } from "next/cache";
import { settingsToRows, validateSettings, type SiteSettings } from "@/lib/settings";
import { supabaseServer } from "@/lib/supabase/server";

export type SettingsResult = { ok: true } | { ok: false; error: string };

/**
 * Saves the site settings. The database's rules refuse the write unless the caller is an
 * admin. The shop is told to refresh straight away so changes show without waiting.
 */
export async function saveSettings(input: SiteSettings): Promise<SettingsResult> {
  const checked = validateSettings(input);
  if (!checked.ok) return checked;

  const rows = settingsToRows(checked.value);
  const supabase = await supabaseServer();
  const { data, error } = await supabase
    .from("site_settings")
    .upsert(rows, { onConflict: "key" })
    .select("key");

  if (error || (data?.length ?? 0) !== rows.length) {
    return { ok: false, error: "The settings could not be saved. Check you are still signed in and try again." };
  }

  updateTag("settings");
  revalidatePath("/admin", "layout");
  return { ok: true };
}
