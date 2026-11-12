import { createClient } from "@supabase/supabase-js";
import { cacheLife, cacheTag } from "next/cache";
import { parseSettings, type SiteSettings } from "@/lib/settings";

/**
 * The site settings, read from the database. Cached and shared by all visitors; saving in the
 * admin expires the "settings" tag so changes show straight away, and it refreshes by itself
 * every five minutes regardless. If a setting is missing, its default is used.
 */
export async function getSettings(): Promise<SiteSettings> {
  "use cache";
  cacheTag("settings");
  cacheLife({ stale: 30, revalidate: 300, expire: 86400 });

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { auth: { persistSession: false } },
  );
  const { data, error } = await supabase.from("site_settings").select("key, value");
  if (error) throw new Error(`Could not load the settings: ${error.message}`);
  return parseSettings(data);
}
