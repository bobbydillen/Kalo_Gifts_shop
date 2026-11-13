"use server";

import { revalidatePath } from "next/cache";
import { cleanPhone } from "@/lib/checkout";
import {
  createShiprocketOrder,
  fetchShiprocketOrder,
  ShiprocketError,
  type ShiprocketLinks,
} from "@/lib/shiprocket";
import { supabaseServer } from "@/lib/supabase/server";

export type ShipResult = { ok: true; message: string } | { ok: false; error: string };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Only a signed-in admin may use Shiprocket. A customer could otherwise read their own order here. */
async function adminClient() {
  const supabase = await supabaseServer();
  const { data } = await supabase.rpc("is_admin");
  return data === true ? supabase : null;
}

const failure = (err: unknown): ShipResult => ({
  ok: false,
  error: err instanceof ShiprocketError ? err.message : "Something went wrong talking to Shiprocket. Try again.",
});

async function save(supabase: NonNullable<Awaited<ReturnType<typeof adminClient>>>, id: string, links: ShiprocketLinks, extra: Record<string, unknown> = {}) {
  const { error } = await supabase
    .from("orders")
    .update({
      shiprocket_order_id: links.orderId,
      shiprocket_shipment_id: links.shipmentId,
      awb_code: links.awb,
      courier_name: links.courier,
      tracking_url: links.trackingUrl,
      shiprocket_status: links.status,
      ...extra,
    })
    .eq("id", id);
  return !error;
}

/** Creates the order in Shiprocket (once) and remembers its Shiprocket numbers. */
export async function sendToShiprocket(id: string, paymentMethod: string): Promise<ShipResult> {
  if (!UUID.test(id)) return { ok: false, error: "That order could not be found." };
  if (paymentMethod !== "prepaid" && paymentMethod !== "cod") return { ok: false, error: "Choose Prepaid or Cash on delivery." };

  const supabase = await adminClient();
  if (!supabase) return { ok: false, error: "You do not have access." };

  const { data: order } = await supabase.from("orders").select("*, order_items(*)").eq("id", id).maybeSingle();
  if (!order) return { ok: false, error: "That order could not be found." };
  if (order.shiprocket_order_id) return { ok: false, error: "This order was already sent to Shiprocket." };
  if (!order.customer_email) return { ok: false, error: "This order has no email address. Add one, or create it in Shiprocket by hand." };

  const phone = cleanPhone(order.ship_phone);
  if (!phone) return { ok: false, error: "The phone number on this order is not a valid Indian mobile number." };

  // parcel: weights add up, the longest and widest side are kept, heights stack
  const items = order.order_items as { product_slug: string; product_name: string; qty: number; unit_price: number }[];
  const { data: products } = await supabase
    .from("products")
    .select("slug, weight_g, length_cm, breadth_cm, height_cm")
    .in("slug", items.map((i) => i.product_slug));
  const bySlug = new Map((products ?? []).map((p) => [p.slug, p]));

  let weight = 0;
  let length = 1;
  let breadth = 1;
  let height = 0;
  for (const item of items) {
    const p = bySlug.get(item.product_slug) ?? { weight_g: 300, length_cm: 25, breadth_cm: 20, height_cm: 5 };
    weight += p.weight_g * item.qty;
    length = Math.max(length, p.length_cm);
    breadth = Math.max(breadth, p.breadth_cm);
    height += p.height_cm * item.qty;
  }

  try {
    const links = await createShiprocketOrder({
      number: order.number,
      createdAt: new Date(order.created_at),
      paymentMethod,
      name: order.ship_name,
      phone,
      email: order.customer_email,
      line1: order.ship_line1,
      line2: order.ship_line2,
      city: order.ship_city,
      state: order.ship_state,
      pincode: order.ship_pincode,
      subtotal: order.subtotal,
      deliveryFee: order.delivery_fee,
      total: order.total,
      items: items.map((i) => ({ name: i.product_name, sku: i.product_slug, units: i.qty, price: i.unit_price })),
      parcel: { weightKg: Math.max(weight, 1) / 1000, length, breadth, height: Math.max(height, 1) },
    });
    const saved = await save(supabase, id, links, { payment_method: paymentMethod, shiprocket_sent_at: new Date().toISOString() });
    revalidatePath("/admin", "layout");
    return saved
      ? { ok: true, message: "Sent to Shiprocket. Choose the courier there, then press Refresh here to bring back the tracking number." }
      : { ok: false, error: `Sent to Shiprocket (order ${links.orderId}) but it could not be saved here. Do not send again; tell me.` };
  } catch (err) {
    return failure(err);
  }
}

/** Brings the courier, tracking number and status back from Shiprocket. */
export async function refreshShiprocket(id: string): Promise<ShipResult> {
  if (!UUID.test(id)) return { ok: false, error: "That order could not be found." };
  const supabase = await adminClient();
  if (!supabase) return { ok: false, error: "You do not have access." };

  const { data: order } = await supabase.from("orders").select("shiprocket_order_id").eq("id", id).maybeSingle();
  if (!order?.shiprocket_order_id) return { ok: false, error: "This order has not been sent to Shiprocket yet." };

  try {
    const links = await fetchShiprocketOrder(order.shiprocket_order_id);
    if (!(await save(supabase, id, links))) return { ok: false, error: "Could not save the update. Try again." };
    revalidatePath("/admin", "layout");
    return {
      ok: true,
      message: links.awb
        ? `Updated. Courier: ${links.courier ?? "not shown"}, tracking number ${links.awb}.`
        : "Updated. No courier has been booked yet, so there is no tracking number.",
    };
  } catch (err) {
    return failure(err);
  }
}
