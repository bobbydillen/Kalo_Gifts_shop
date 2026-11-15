/**
 * Small helpers for the Meta (Facebook and Instagram) Pixel. Nothing happens unless a Pixel ID is set
 * in the admin settings, because the Pixel script is only added to the page then. The product ids
 * sent here are the same ids as in the catalog feed (/feed/meta.csv), which is how Meta matches
 * a visitor's activity to the right products.
 */

type Fbq = (...args: unknown[]) => void;
declare global {
  interface Window {
    fbq?: Fbq;
  }
}

/** A Pixel ID is a long number. Anything else is treated as "not set". */
export const validPixelId = (id: string) => /^\d{10,20}$/.test(id);

export function track(event: string, params?: Record<string, unknown>, eventId?: string) {
  if (typeof window === "undefined" || typeof window.fbq !== "function") return;
  try {
    if (eventId) window.fbq("track", event, params ?? {}, { eventID: eventId });
    else window.fbq("track", event, params ?? {});
  } catch {
    // tracking must never break the shop
  }
}

type Item = { slug: string; name: string; category: string };

export const contentFor = (item: Item, value: number, qty = 1) => ({
  content_ids: [item.slug],
  content_type: "product",
  content_name: item.name,
  content_category: item.category,
  value,
  currency: "INR",
  num_items: qty,
});

/** Remembered between checkout and the "order placed" page so the Purchase event can be sent once. */
export const PURCHASE_KEY = "kalo-purchase-v1";
export type PurchaseNote = { number: number; value: number; ids: string[]; count: number };
