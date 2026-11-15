import { createClient } from "@supabase/supabase-js";
import { cacheLife, cacheTag } from "next/cache";
import { mergeSeo, type SeoText } from "@/lib/seo";

/**
 * Titles and descriptions saved in the admin, keyed by page. Cached and shared; saving in the admin
 * expires the "seo" tag so changes show straight away. If the table cannot be read, the defaults are used.
 */
export async function getSeoOverrides(): Promise<Record<string, SeoText>> {
  "use cache";
  cacheTag("seo");
  cacheLife({ stale: 30, revalidate: 300, expire: 86400 });

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { auth: { persistSession: false } },
  );
  const { data } = await supabase.from("seo_pages").select("key, title, description");
  return Object.fromEntries((data ?? []).map((r) => [r.key, { title: r.title as string, description: r.description as string }]));
}

/** The title and description to use for a page: the admin's text, or the default. */
export async function seoFor(key: string, defaults: SeoText): Promise<SeoText> {
  const saved = (await getSeoOverrides())[key];
  return mergeSeo(defaults, saved);
}
