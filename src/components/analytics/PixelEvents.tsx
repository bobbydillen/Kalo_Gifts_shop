"use client";

import { useEffect } from "react";
import { contentFor, PURCHASE_KEY, track, type PurchaseNote } from "@/lib/meta-pixel";

/** Tells Meta a visitor looked at a product. Renders nothing. */
export function ViewContent({ slug, name, category, price }: { slug: string; name: string; category: string; price: number }) {
  useEffect(() => {
    track("ViewContent", contentFor({ slug, name, category }, price));
  }, [slug, name, category, price]);
  return null;
}

/** Tells Meta a visitor reached checkout with these items. Sent once per visit to the page. */
export function InitiateCheckout({ ids, value, count }: { ids: string[]; value: number; count: number }) {
  const key = ids.join(",");
  useEffect(() => {
    if (!ids.length) return;
    track("InitiateCheckout", { content_ids: ids, content_type: "product", value, currency: "INR", num_items: count });
    // only when the set of products changes, not on every price recalculation
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return null;
}

/** Sends the Purchase event on the "order placed" page, once, using what checkout remembered. */
export function PurchaseEvent() {
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(PURCHASE_KEY);
      if (!raw) return;
      sessionStorage.removeItem(PURCHASE_KEY);
      const note = JSON.parse(raw) as PurchaseNote;
      track(
        "Purchase",
        { content_ids: note.ids, content_type: "product", value: note.value, currency: "INR", num_items: note.count },
        `order-${note.number}`,
      );
    } catch {
      // nothing to send
    }
  }, []);
  return null;
}
