"use server";

import { revalidatePath, updateTag } from "next/cache";
import { validateProduct, type ProductInput } from "@/lib/admin-products";
import { productKey } from "@/lib/seo";
import { supabaseServer } from "@/lib/supabase/server";

export type SaveResult = { ok: true; id: string } | { ok: false; error: string };
export type PlainResult = { ok: true } | { ok: false; error: string };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Makes the shop pick up changes straight away instead of on its next five-minute refresh. */
function refreshShop() {
  updateTag("catalog");
  revalidatePath("/admin", "layout");
}

/**
 * Saves a product with its colours and stock in one step (the database function does it all
 * or nothing). The database's rules refuse the write unless the caller is an admin.
 */
export async function saveProduct(input: ProductInput): Promise<SaveResult> {
  const checked = validateProduct(input, !input?.id);
  if (!checked.ok) return checked;
  if (checked.value.id && !UUID.test(checked.value.id)) return { ok: false, error: "That product could not be found." };

  const supabase = await supabaseServer();
  const { data, error } = await supabase.rpc("save_product", { p: checked.value });

  if (error) {
    if (error.code === "23505") {
      return { ok: false, error: "Another product already uses that web address. Change the name a little." };
    }
    return { ok: false, error: "The product could not be saved. Check you are still signed in and try again." };
  }

  // parcel size and design group are saved separately so the save_product database function stays unchanged
  const { weight_g, length_cm, breadth_cm, height_cm, design_group, design_label, custom_photo, photo_size, size_prices } = checked.value;
  const { error: parcelError } = await supabase
    .from("products")
    .update({ weight_g, length_cm, breadth_cm, height_cm, design_group, design_label, custom_photo, photo_size, size_prices })
    .eq("id", data as string);
  if (parcelError) return { ok: false, error: "The product saved, but some details (parcel size, design group) did not. Save again." };

  refreshShop();
  return { ok: true, id: data as string };
}

/**
 * Saves the product's Google title and description (see lib/seo.ts). Both empty means "use the
 * product's own name and description", so the saved row is removed.
 */
export async function saveProductSeo(productId: string, title: string, description: string): Promise<PlainResult> {
  if (!UUID.test(productId)) return { ok: false, error: "That product could not be found." };
  const t = String(title ?? "").trim();
  const d = String(description ?? "").trim();
  if (t.length > 120) return { ok: false, error: "The title is too long (120 characters at most)." };
  if (d.length > 320) return { ok: false, error: "The description is too long (320 characters at most)." };

  const supabase = await supabaseServer();
  const { data: product } = await supabase.from("products").select("slug").eq("id", productId).maybeSingle();
  if (!product) return { ok: false, error: "That product could not be found." };
  const key = productKey(product.slug);

  if (!t && !d) {
    const { error } = await supabase.from("seo_pages").delete().eq("key", key);
    if (error) return { ok: false, error: "The Google text could not be reset." };
  } else {
    const { data, error } = await supabase
      .from("seo_pages")
      .upsert({ key, title: t, description: d, updated_at: new Date().toISOString() }, { onConflict: "key" })
      .select("key");
    if (error || !data?.length) return { ok: false, error: "The Google text could not be saved." };
  }
  updateTag("seo");
  return { ok: true };
}

/** Deletes a product, its photos and its stock. Orders that already include it keep their own copy of the details. */
export async function deleteProduct(id: string): Promise<PlainResult> {
  if (!UUID.test(id)) return { ok: false, error: "That product could not be found." };
  const supabase = await supabaseServer();

  const { data: slugRow } = await supabase.from("products").select("slug").eq("id", id).maybeSingle();
  const { data: photos } = await supabase.from("product_images").select("path").eq("product_id", id);
  if (photos?.length) await supabase.storage.from("product-images").remove(photos.map((p) => p.path));

  const { data, error } = await supabase.from("products").delete().eq("id", id).select("id");
  if (error || !data?.length) return { ok: false, error: "The product could not be deleted." };
  if (slugRow) await supabase.from("seo_pages").delete().eq("key", productKey(slugRow.slug));

  refreshShop();
  return { ok: true };
}

/** Called after photos change, so the shop shows them straight away. */
export async function refreshCatalog(): Promise<void> {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  refreshShop();
}
