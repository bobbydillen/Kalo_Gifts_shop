import { verifyCashfreeSignature } from "@/lib/cashfree";
import { confirmPayment } from "@/lib/online-payment";

/**
 * Cashfree's notice that a payment happened. The signature proves it came from Cashfree; even then
 * the order is marked paid only after asking Cashfree for the order directly (confirmPayment).
 * Set this address in Cashfree > Developers > Webhooks: https://kalogifts.com/api/cashfree/webhook
 */
export async function POST(request: Request) {
  const raw = await request.text();
  if (!verifyCashfreeSignature(raw, request.headers.get("x-webhook-timestamp"), request.headers.get("x-webhook-signature"))) {
    return new Response("bad signature", { status: 401 });
  }
  let body: { type?: string; data?: { order?: { order_id?: string } } };
  try {
    body = JSON.parse(raw);
  } catch {
    return new Response("ok");
  }
  const id = body.data?.order?.order_id;
  if (body.type === "PAYMENT_SUCCESS_WEBHOOK" && typeof id === "string") {
    const state = await confirmPayment(id);
    // "unknown": Cashfree or the database could not be reached, so let Cashfree send it again later
    if (state === "unknown") return new Response("retry", { status: 503 });
  }
  return new Response("ok");
}
