"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isOrderStatus } from "@/lib/admin";
import { supabaseServer } from "@/lib/supabase/server";

export async function signOut() {
  const supabase = await supabaseServer();
  await supabase.auth.signOut();
  redirect("/admin/login");
}

export type ActionResult = { ok: true } | { ok: false; error: string };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Changes an order's status, records it in the order's history, and saves the
 * courier or tracking note. The database's rules only let an admin do this: for anyone
 * else the update touches no rows and this returns an error.
 */
export async function updateOrder(formData: FormData): Promise<ActionResult> {
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  const trackingNote = String(formData.get("tracking_note") ?? "").trim().slice(0, 500);
  const historyNote = String(formData.get("note") ?? "").trim().slice(0, 500);

  if (!UUID.test(id)) return { ok: false, error: "That order could not be found." };
  if (!isOrderStatus(status)) return { ok: false, error: "Choose a valid status." };

  const supabase = await supabaseServer();

  const { data: before } = await supabase.from("orders").select("status").eq("id", id).maybeSingle();
  if (!before) return { ok: false, error: "You do not have access to this order." };

  const { data: updated, error } = await supabase
    .from("orders")
    .update({ status, tracking_note: trackingNote })
    .eq("id", id)
    .select("id");
  if (error || !updated?.length) return { ok: false, error: "The order could not be saved. Try again." };

  if (before.status !== status || historyNote) {
    await supabase.from("order_events").insert({ order_id: id, status, note: historyNote });
  }

  revalidatePath("/admin", "layout");
  return { ok: true };
}
