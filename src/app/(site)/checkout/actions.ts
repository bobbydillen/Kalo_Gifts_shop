"use server";

import { createClient } from "@supabase/supabase-js";
import { after } from "next/server";
import { cleanPhone, describeOrderError, validateDetails, type PlaceOrderInput } from "@/lib/checkout";
import { lookupPincode, type PincodeResult } from "@/lib/pincode";
import { onlinePaymentReady, startPayment, type PaymentSession, type StartPaymentResult } from "@/lib/online-payment";
import { sendOrderEmails } from "@/lib/order-email";
import { getSettings } from "@/lib/settings-data";
import { supabaseServer } from "@/lib/supabase/server";

/** Called by the checkout form as soon as a 6-digit pincode is typed. */
export async function lookupPincodeAction(pin: string): Promise<PincodeResult> {
  return lookupPincode(typeof pin === "string" ? pin.trim() : "");
}

export type PlaceOrderResult =
  | { ok: true; number: number; total: number; session?: PaymentSession; payError?: string }
  | { ok: false; error: string; refresh?: boolean };

/**
 * Places an order. The checking that matters (prices, stock, options) happens inside the
 * database function place_order, which recomputes every price itself. This only tidies the
 * input and passes it on, so a tampered request cannot change what the order costs.
 */
export async function placeOrder(input: PlaceOrderInput): Promise<PlaceOrderResult> {
  // The city and state come from the pincode's own records, not from what the form sent, so they
  // cannot be made up. If the lookup service is down the typed values are used (still checked).
  const pin = typeof input?.pincode === "string" ? input.pincode.trim() : "";
  const place = await lookupPincode(pin);
  if (place.status === "not-found") return { ok: false, error: "We could not find that pincode. Please check it. If it is right, message us on WhatsApp and we will help." };
  const checked =
    place.status === "found"
      ? { ...input, city: place.info.city, state: place.info.stateKnown ? place.info.state : input.state }
      : input;

  const details = validateDetails(checked, { trustedPlace: place.status === "found" });
  if (!details.ok) return { ok: false, error: details.error };

  // A customer who has proved their phone number with a code orders under that number,
  // whatever the form says, so nobody can place orders in a verified customer's name.
  const {
    data: { user },
  } = await (await supabaseServer()).auth.getUser();
  const verified = user?.phone ? cleanPhone(user.phone) : "";
  const phone = verified || details.value.phone;

  const items = Array.isArray(input.items) ? input.items.slice(0, 30) : [];
  if (!items.length) return { ok: false, error: "Your bag is empty." };

  const online = input.payment === "online";
  if (online && (!(await getSettings()).onlinePayments || !onlinePaymentReady())) {
    return { ok: false, error: "Online payment is not available just now. Please choose another way to pay, or message us on WhatsApp.", refresh: true };
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { auth: { persistSession: false } },
  );

  const { data, error } = await supabase.rpc("place_order", {
    p: {
      ...details.value,
      phone,
      expected_total: Number.isInteger(input.expectedTotal) ? input.expectedTotal : null,
      payment: online ? "prepaid" : input.payment === "cod" || input.payment === "test" || input.payment === "upi" ? input.payment : "",
      items: items.map((i) => ({
        slug: String(i.slug ?? ""),
        colour: i.colour ? String(i.colour) : "",
        size: i.size ? String(i.size) : "",
        qty: Number(i.qty),
        wrap: Boolean(i.wrap),
        note: typeof i.note === "string" ? i.note.slice(0, 1000) : "",
        photo: typeof i.photo === "string" ? i.photo.slice(0, 120) : "",
        // present only for a build-your-own hamper; the database treats the key itself as the signal
        ...(Array.isArray(i.parts)
          ? {
              parts: i.parts.slice(0, 15).map((p) => ({
                slug: String(p?.slug ?? ""),
                colour: p?.colour ? String(p.colour) : "",
                size: p?.size ? String(p.size) : "",
                qty: Number(p?.qty),
                photo: typeof p?.photo === "string" ? p.photo.slice(0, 120) : "",
              })),
            }
          : {}),
      })),
    },
  });

  if (error) {
    const friendly = describeOrderError(error.message);
    return { ok: false, error: friendly.text, refresh: friendly.refresh };
  }

  const result = data as { number: number; total: number };

  // online: open Cashfree's checkout now; the order emails go out once the payment is confirmed
  if (online) {
    const pay = await startPayment(result.number, phone);
    return pay.ok
      ? { ok: true, number: result.number, total: result.total, session: pay.session }
      : { ok: true, number: result.number, total: result.total, payError: pay.error };
  }
  // email the shop owner and the customer after the response, so the customer never waits for it
  after(() => sendOrderEmails(result, { ...details.value, phone }, items, input.payment === "cod" || input.payment === "upi" ? input.payment : "test"));
  return { ok: true, number: result.number, total: result.total };
}

/**
 * After paying by UPI the customer sends the UPI reference (UTR). The database only accepts it for
 * a UPI order still waiting for payment, placed in the last three days, under the same phone number.
 */
export async function submitPaymentRef(number: number, phone: string, ref: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const clean = typeof ref === "string" ? ref.replace(/\s/g, "").toUpperCase() : "";
  if (!/^[A-Z0-9]{6,35}$/.test(clean)) return { ok: false, error: "Enter the UPI reference exactly as your UPI app shows it (usually 12 digits)." };
  if (!Number.isInteger(number) || number <= 0) return { ok: false, error: "That order could not be found." };
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, { auth: { persistSession: false } });
  const { data, error } = await supabase.rpc("submit_payment_ref", { p_number: number, p_phone: String(phone ?? ""), p_ref: clean });
  if (error || data !== true) return { ok: false, error: "We could not attach that reference to your order. Please send it to us on WhatsApp instead." };
  return { ok: true };
}

/** Opens Cashfree's checkout again for an unpaid online order (after a failed or abandoned payment). */
export async function retryOnlinePayment(number: number, phone: string): Promise<StartPaymentResult> {
  return startPayment(Number(number), typeof phone === "string" ? phone : "");
}
