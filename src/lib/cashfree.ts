import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Cashfree Payment Gateway, server side only (the secret key must never reach the browser).
 * Environment variables (set in Netlify, and in .env.local for testing; never in the code):
 *   CASHFREE_APP_ID       the App ID from Cashfree > Developers > API keys
 *   CASHFREE_SECRET_KEY   the Secret Key from the same page
 *   CASHFREE_ENV          "production" for real payments; anything else (or unset) uses the sandbox
 */

const API_VERSION = "2026-01-01";

export type CashfreeMode = "sandbox" | "production";

export function cashfreeConfig(): { appId: string; secret: string; mode: CashfreeMode } | null {
  const appId = process.env.CASHFREE_APP_ID?.trim();
  const secret = process.env.CASHFREE_SECRET_KEY?.trim();
  if (!appId || !secret) return null;
  return { appId, secret, mode: process.env.CASHFREE_ENV?.trim() === "production" ? "production" : "sandbox" };
}

/** True when the server has everything online payment needs (Cashfree keys and the database secret key). */
export const onlinePaymentReady = () => Boolean(cashfreeConfig() && process.env.SUPABASE_SECRET_KEY?.trim());

const base = (mode: CashfreeMode) => (mode === "production" ? "https://api.cashfree.com/pg" : "https://sandbox.cashfree.com/pg");

async function call<T>(method: "GET" | "POST", path: string, body?: unknown): Promise<{ ok: true; data: T } | { ok: false; status: number; message: string }> {
  const cfg = cashfreeConfig();
  if (!cfg) return { ok: false, status: 0, message: "Cashfree keys are not set" };
  try {
    const res = await fetch(base(cfg.mode) + path, {
      method,
      headers: {
        "x-client-id": cfg.appId,
        "x-client-secret": cfg.secret,
        "x-api-version": API_VERSION,
        "content-type": "application/json",
        accept: "application/json",
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      cache: "no-store",
      signal: AbortSignal.timeout(15000),
    });
    const json = (await res.json().catch(() => ({}))) as T & { message?: string };
    if (!res.ok) return { ok: false, status: res.status, message: json?.message ?? `HTTP ${res.status}` };
    return { ok: true, data: json };
  } catch (e) {
    return { ok: false, status: 0, message: e instanceof Error ? e.message : "network error" };
  }
}

export type CashfreeOrder = {
  order_id: string;
  order_amount: number;
  order_currency: string;
  order_status: "ACTIVE" | "PAID" | "EXPIRED" | "TERMINATED" | "TERMINATION_REQUESTED";
  payment_session_id: string;
};

export type CashfreePayment = { cf_payment_id: string | number; payment_status: string; payment_amount: number };

/** Our Cashfree order ids: "kalo-<order number>", plus "-<suffix>" for a fresh attempt after one expired. */
export const cashfreeOrderId = (number: number, suffix?: string) => `kalo-${number}${suffix ? `-${suffix}` : ""}`;

export function orderNumberFromCashfreeId(id: string): number | null {
  const m = /^kalo-(\d{1,9})(?:-[a-z0-9]{1,12})?$/.exec(id);
  return m ? Number(m[1]) : null;
}

export const getCashfreeOrder = (id: string) => call<CashfreeOrder>("GET", `/orders/${encodeURIComponent(id)}`);

export const getCashfreePayments = (id: string) => call<CashfreePayment[]>("GET", `/orders/${encodeURIComponent(id)}/payments`);

export function createCashfreeOrder(o: {
  id: string;
  amount: number;
  customer: { phone: string; name: string; email: string };
  returnUrl: string;
  notifyUrl: string;
  note: string;
}) {
  const phone = o.customer.phone.replace(/\D/g, "").slice(-10);
  return call<CashfreeOrder>("POST", "/orders", {
    order_id: o.id,
    order_amount: o.amount,
    order_currency: "INR",
    customer_details: {
      customer_id: `c${phone}`,
      customer_phone: phone,
      ...(o.customer.name.trim().length >= 3 ? { customer_name: o.customer.name.trim().slice(0, 100) } : {}),
      ...(o.customer.email ? { customer_email: o.customer.email.slice(0, 100) } : {}),
    },
    order_meta: { return_url: o.returnUrl, notify_url: o.notifyUrl },
    order_note: o.note,
    // an unpaid checkout closes after a day; paying later starts a fresh one
    order_expiry_time: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
  });
}

/** Checks a webhook really came from Cashfree: base64(HMAC-SHA256(timestamp + raw body, secret key)). */
export function verifyCashfreeSignature(rawBody: string, timestamp: string | null, signature: string | null): boolean {
  const cfg = cashfreeConfig();
  if (!cfg || !timestamp || !signature) return false;
  const expected = createHmac("sha256", cfg.secret).update(timestamp + rawBody).digest();
  let given: Buffer;
  try {
    given = Buffer.from(signature, "base64");
  } catch {
    return false;
  }
  return given.length === expected.length && timingSafeEqual(given, expected);
}
