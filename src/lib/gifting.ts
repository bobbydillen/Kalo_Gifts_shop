import type { Product } from "@/lib/catalog";

/** Gift options offered on every item (decided 2026-11-12). */
export const GIFT_WRAP_PRICE = 50; // rupees, per piece
export const GIFT_NOTE_PRICE = 50; // rupees, per piece
export const GIFT_NOTE_MAX = 250; // characters in the handwritten card

/** Hampers arrive already packed in a gift box, so they are not offered gift wrap. */
export const canGiftWrap = (product: Product) => product.category !== "hamper";

/** Price of one piece with its gift options. A card with no words costs nothing. */
export function unitPrice(product: Product, gift: { wrap: boolean; note: string }) {
  return (
    product.price +
    (gift.wrap && canGiftWrap(product) ? GIFT_WRAP_PRICE : 0) +
    (gift.note.trim() ? GIFT_NOTE_PRICE : 0)
  );
}
