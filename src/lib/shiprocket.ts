
/**
 * A small client for Shiprocket's API. It logs in with the API user's email and password
 * (environment variables SHIPROCKET_EMAIL and SHIPROCKET_PASSWORD), keeps the login token in
 * memory until it is about to expire, and retries once if Shiprocket says the token is no good.
 * Optional: SHIPROCKET_PICKUP_LOCATION, the pickup address nickname. Without it the first
 * pickup address on the account is used.
 */

const BASE = "https://apiv2.shiprocket.in/v1/external";

let cached: { token: string; expires: number } | null = null;

export class ShiprocketError extends Error {}

async function login(): Promise<string> {
  const email = process.env.SHIPROCKET_EMAIL;
  const password = process.env.SHIPROCKET_PASSWORD;
  if (!email || !password) throw new ShiprocketError("Shiprocket is not set up: add SHIPROCKET_EMAIL and SHIPROCKET_PASSWORD in Vercel.");

  const res = await fetch(`${BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
    cache: "no-store",
  });
  const body = (await res.json().catch(() => ({}))) as { token?: string; message?: string };
  if (!res.ok || !body.token) {
    throw new ShiprocketError(`Shiprocket login failed: ${body.message ?? res.status}. Check the API user's email and password in Vercel.`);
  }
  // tokens last several days; refresh daily to stay well inside that
  cached = { token: body.token, expires: Date.now() + 24 * 60 * 60 * 1000 };
  return body.token;
}

async function request<T>(path: string, init?: { method?: string; body?: unknown }, retried = false): Promise<T> {
  const token = cached && cached.expires > Date.now() ? cached.token : await login();
  const res = await fetch(`${BASE}${path}`, {
    method: init?.method ?? "GET",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: init?.body ? JSON.stringify(init.body) : undefined,
    cache: "no-store",
  });
  if (res.status === 401 && !retried) {
    cached = null;
    return request<T>(path, init, true);
  }
  const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) throw new ShiprocketError(describe(body, res.status));
  return body as T;
}

/** Turns Shiprocket's error reply into one readable sentence. */
function describe(body: Record<string, unknown>, status: number): string {
  const parts: string[] = [];
  if (typeof body.message === "string") parts.push(body.message);
  const errors = body.errors;
  if (errors && typeof errors === "object") {
    for (const [field, value] of Object.entries(errors as Record<string, unknown>)) {
      parts.push(`${field}: ${Array.isArray(value) ? value.join(", ") : String(value)}`);
    }
  }
  return `Shiprocket said: ${parts.join(" · ") || `error ${status}`}`;
}

/** Finds the first value stored under any of these names, however deeply it is nested. */
function dig(value: unknown, names: string[]): unknown {
  if (!value || typeof value !== "object") return undefined;
  const object = value as Record<string, unknown>;
  for (const name of names) {
    const found = object[name];
    if (found !== undefined && found !== null && found !== "") return found;
  }
  for (const child of Object.values(object)) {
    const found = dig(child, names);
    if (found !== undefined) return found;
  }
  return undefined;
}

const str = (value: unknown) => (value === undefined || value === null ? null : String(value));

async function pickupLocation(): Promise<string> {
  const chosen = process.env.SHIPROCKET_PICKUP_LOCATION?.trim();
  if (chosen) return chosen;
  const body = await request<{ data?: { shipping_address?: { pickup_location?: string }[] } }>("/settings/company/pickup");
  const first = body.data?.shipping_address?.[0]?.pickup_location;
  if (!first) throw new ShiprocketError("No pickup address found in Shiprocket. Add one under Settings, then Pickup Addresses.");
  return first;
}

export type ShipmentOrder = {
  number: number;
  createdAt: Date;
  paymentMethod: "prepaid" | "cod";
  name: string;
  phone: string; // 10 digits
  email: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  pincode: string;
  subtotal: number;
  deliveryFee: number;
  total: number;
  items: { name: string; sku: string; units: number; price: number }[];
  parcel: { weightKg: number; length: number; breadth: number; height: number };
};

export type ShiprocketLinks = {
  orderId: string;
  shipmentId: string | null;
  awb: string | null;
  courier: string | null;
  status: string | null;
  trackingUrl: string | null;
};

const trackingUrl = (awb: string | null) => (awb ? `https://shiprocket.co/tracking/${encodeURIComponent(awb)}` : null);

/** Creates the order in Shiprocket. Courier choice and booking are done in the Shiprocket panel. */
export async function createShiprocketOrder(order: ShipmentOrder): Promise<ShiprocketLinks> {
  const pickup = await pickupLocation();
  const [first, ...rest] = order.name.trim().split(/\s+/);
  const date = order.createdAt.toLocaleString("sv-SE", { timeZone: "Asia/Kolkata" }).slice(0, 16); // 2026-11-13 14:05

  const body = await request<Record<string, unknown>>("/orders/create/adhoc", {
    method: "POST",
    body: {
      order_id: `KALO-${order.number}`,
      order_date: date,
      pickup_location: pickup,
      billing_customer_name: first,
      billing_last_name: rest.join(" "),
      billing_address: order.line1,
      billing_address_2: order.line2,
      billing_city: order.city,
      billing_pincode: order.pincode,
      billing_state: order.state,
      billing_country: "India",
      billing_email: order.email,
      billing_phone: order.phone,
      shipping_is_billing: true,
      order_items: order.items.map((i) => ({ name: i.name, sku: i.sku, units: i.units, selling_price: i.price })),
      payment_method: order.paymentMethod === "cod" ? "COD" : "Prepaid",
      shipping_charges: order.deliveryFee,
      sub_total: order.total,
      length: order.parcel.length,
      breadth: order.parcel.breadth,
      height: order.parcel.height,
      weight: order.parcel.weightKg,
    },
  });

  const orderId = str(body.order_id);
  if (!orderId) throw new ShiprocketError(describe(body, 200));
  const awb = str(body.awb_code) || null;
  return {
    orderId,
    shipmentId: str(body.shipment_id),
    awb,
    courier: str(body.courier_name) || null,
    status: str(body.status),
    trackingUrl: trackingUrl(awb),
  };
}

/** Reads an order back from Shiprocket to pick up the courier, tracking number and status. */
export async function fetchShiprocketOrder(orderId: string): Promise<ShiprocketLinks> {
  const body = await request<Record<string, unknown>>(`/orders/show/${encodeURIComponent(orderId)}`);
  const awb = str(dig(body, ["awb_code", "awb"]));
  return {
    orderId,
    shipmentId: str(dig(body, ["shipment_id"])),
    awb,
    courier: str(dig(body, ["courier_name", "courier"])),
    status: str(dig(body, ["status"])),
    trackingUrl: trackingUrl(awb),
  };
}
