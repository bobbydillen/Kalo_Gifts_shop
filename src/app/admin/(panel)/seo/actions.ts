"use server";

import { revalidatePath, updateTag } from "next/cache";
import { getProducts } from "@/lib/catalog-data";
import { CATEGORY_PAGES, STATIC_PAGES } from "@/lib/seo";
import { supabaseServer } from "@/lib/supabase/server";

export type SeoResult = { ok: true; reset?: boolean } | { ok: false; error: string };

/**
 * Saves the title and description for one page. Leaving both empty puts the page back to its default.
 * The database only lets admins write; for anyone else nothing is saved.
 */
export async function saveSeo(formData: FormData): Promise<SeoResult> {
  const key = String(formData.get("key") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  if (title.length > 120) return { ok: false, error: "The title is too long (120 characters at most)." };
  if (description.length > 320) return { ok: false, error: "The description is too long (320 characters at most)." };

  const fixed = new Set([...STATIC_PAGES, ...CATEGORY_PAGES].map((p) => p.key));
  if (!fixed.has(key)) {
    const slug = key.startsWith("product:") ? key.slice(8) : "";
    const known = slug && (await getProducts()).some((p) => p.slug === slug);
    if (!known) return { ok: false, error: "That page could not be found." };
  }

  const supabase = await supabaseServer();
  if (!title && !description) {
    const { error } = await supabase.from("seo_pages").delete().eq("key", key);
    if (error) return { ok: false, error: "That could not be reset. Check you are still signed in." };
    updateTag("seo");
    revalidatePath("/admin/seo");
    return { ok: true, reset: true };
  }

  const { data, error } = await supabase
    .from("seo_pages")
    .upsert({ key, title, description, updated_at: new Date().toISOString() }, { onConflict: "key" })
    .select("key");
  if (error || !data?.length) return { ok: false, error: "That could not be saved. Check you are still signed in and try again." };

  updateTag("seo");
  revalidatePath("/admin/seo");
  return { ok: true };
}
