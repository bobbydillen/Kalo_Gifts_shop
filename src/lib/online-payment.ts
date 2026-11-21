import { headers } from "next/headers";
import {
  cashfreeConfig,
  cashfreeOrderId,
  createCashfreeOrder,
  getCashfreeOrder,
  getCashfreePayments,
  orderNumberFromCashfreeId,
  type CashfreeMode,
} from "@/lib/cashfree";
import type { CheckoutDetails, OrderLineInput } from "@/lib/checkout";
import { sendOrderEmails } from "@/lib/order-email";
import { site } from "@/lib/site";
import { supabaseSecret } from "@/lib/supabase/secret";

/**
 * Paying for an order online through Cashfree. The order is placed first (payment_method "prepaid",
 * payment pending); this opens a Cashfree checkout for the amount the database worked out, and later
 * marks the order paid once Cashfree itself says the money arrived. Prices never come from the browser.
 */

export { onlinePaymentReady } from "@/lib/cashfree";

async function origin() {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  if (!host) return site.url;
  const local = host.startsWith("localhost") || host.startsWith("127.");
  const proto = h.get("x-forwarded-proto") ?? (local ? "http" : "https");
  return `${proto}://${host}`;
}

type OrderForPayment = {
  id: string;
  number: number;
  total: number;
  payment_method: string;
  payment_status: string;
  ship_phone: string;
  ship_name: string;
  customer_email: string | null;
  created_at: string;
};

export type PaymentSession = { sessionId: string; mode: CashfreeMode };

export type StartPaymentResult = { ok: true; session: PaymentSession } | { ok: false; error: string; paid?: boolean };

const last10 = (p: string) => p.replace(/\D/g, "").slice(-10);

/**
 * Opens (or reopens) Cashfree's checkout for an order. The phone number must match the order's, the
 * order must be an online order still unpaid, and placed in the last three days.
 */
export async function startPayment(number: number, phone: string): Promise<StartPaymentResult> {
  const cfg = cashfreeConfig();
  const db = supabaseSecret();
  if (!cfg || !db) return { ok: false, error: "Online payment is not available right now. Please message us on WhatsApp." };
  if (!Number.isInteger(number) || number <= 0) return { ok: false, error: "That order could not be found." };

  const { data } = await db
    .from("orders")
    .select("id, number, total, payment_method, payment_status, ship_phone, ship_name, customer_email, created_at")
    .eq("number", number)
    .maybeSingle<OrderForPayment>();
  if (!data || data.payment_method !== "prepaid" || last10(phone).length !== 10 || last10(data.ship_phone) !== last10(phone)) {
    return { ok: false, error: "That order could not be found." };
  }
  if (data.payment_status === "paid") return { ok: false, error: "This order is already paid. Thank you!", paid: true };
  if (data.payment_status !== "pending" || Date.now() - new Date(data.created_at).getTime() > 3 * 24 * 3600 * 1000) {
    return { ok: false, error: "This order can no longer be paid online. Please message us on WhatsApp." };
  }

  // reuse the open checkout for this order if there is one
  const first = cashfreeOrderId(number);
  const existing = await getCashfreeOrder(first);
  if (existing.ok) {
    if (existing.data.order_status === "PAID") {
      await confirmPayment(first);
      return { ok: false, error: "This order is already paid. Thank you!", paid: true };
    }
    if (existing.data.order_status === "ACTIVE" && existing.data.payment_session_id && Number(existing.data.order_amount) === data.total) {
      return { ok: true, session: { sessionId: existing.data.payment_session_id, mode: cfg.mode } };
    }
  }

  const id = existing.ok ? cashfreeOrderId(number, Date.now().toString(36)) : first;
  const from = await origin();
  const created = await createCashfreeOrder({
    id,
    amount: data.total,
    customer: { phone: data.ship_phone, name: data.ship_name, email: data.customer_email ?? "" },
    returnUrl: `${from}/order-placed?n=${number}&pay=online&cf=${id}`,
    notifyUrl: `${from.startsWith("https://") ? from : site.url}/api/cashfree/webhook`,
    note: `KALO order ${number}`,
  });
  if (!created.ok || !created.data.payment_session_id) {
    console.error("Cashfree create order failed", number, created.ok ? "no session" : created.message);
    return { ok: false, error: "We could not open the payment page. Please try again in a minute, or message us on WhatsApp." };
  }
  return { ok: true, session: { sessionId: created.data.payment_session_id, mode: cfg.mode } };
}

/**
 * Asks Cashfree whether a checkout was paid and, if it was (for the full amount of the order), marks
 * the order paid. Safe to call many times: only the first call changes the order and sends the emails.
 * Returns the order's payment state afterwards.
 */
export async function confirmPayment(cashfreeId: string): Promise<"paid" | "pending" | "unknown"> {
  const number = orderNumberFromCashfreeId(cashfreeId);
  const db = supabaseSecret();
  if (number === null || !db || !cashfreeConfig()) return "unknown";

  const { data: order } = await db
    .from("orders")
    .select("id, number, total, payment_method, payment_status")
    .eq("number", number)
    .maybeSingle<Pick<OrderForPayment, "id" | "number" | "total" | "payment_method" | "payment_status">>();
  if (!order || order.payment_method !== "prepaid") return "unknown";
  if (order.payment_status === "paid") return "paid";

  const cf = await getCashfreeOrder(cashfreeId);
  if (!cf.ok) return "unknown";
  if (cf.data.order_status !== "PAID") return "pending";
  if (Number(cf.data.order_amount) !== order.total || cf.data.order_currency !== "INR") {
    console.error("Cashfree amount does not match the order", number, cf.data.order_amount, order.total);
    return "pending";
  }

  const payments = await getCashfreePayments(cashfreeId);
  const success = payments.ok && Array.isArray(payments.data) ? payments.data.find((p) => p.payment_status === "SUCCESS") : undefined;
  const ref = success ? String(success.cf_payment_id) : cashfreeId;

  const { data: updated } = await db
    .from("orders")
    .update({ payment_status: "paid", payment_ref: ref })
    .eq("id", order.id)
    .eq("payment_status", "pending")
    .select("status");
  if (!updated?.length) return "paid"; // another call got there first
  await db.from("order_events").insert({ order_id: order.id, status: updated[0].status, note: `Paid online (Cashfree payment ${ref})` });
  await emailPaidOrder(db, order.id);
  return "paid";
}

type ItemRow = { product_slug: string; colour: string; size: string; qty: number; gift_wrap: boolean; card_message: string; photo_path: string | null };

/** The new-order emails for an online order go out only once it is paid. */
async function emailPaidOrder(db: NonNullable<ReturnType<typeof supabaseSecret>>, id: string) {
  const { data } = await db
    .from("orders")
    .select(
      "number, total, ship_phone, customer_email, ship_name, ship_line1, ship_line2, ship_city, ship_state, ship_pincode, customer_note, order_items(product_slug, colour, size, qty, gift_wrap, card_message, photo_path)",
    )
    .eq("id", id)
    .maybeSingle();
  if (!data) return;
  const details: CheckoutDetails = {
    phone: data.ship_phone,
    email: data.customer_email ?? "",
    name: data.ship_name,
    line1: data.ship_line1,
    line2: data.ship_line2,
    city: data.ship_city,
    state: data.ship_state,
    pincode: data.ship_pincode,
    note: data.customer_note,
  };
  const items: OrderLineInput[] = ((data.order_items ?? []) as ItemRow[]).map((i) => ({
    slug: i.product_slug,
    colour: i.colour || undefined,
    size: i.size || undefined,
    qty: i.qty,
    wrap: i.gift_wrap,
    note: i.card_message,
    photo: i.photo_path ?? undefined,
  }));
  await sendOrderEmails({ number: data.number, total: data.total }, details, items, "online");
}
