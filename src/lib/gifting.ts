import { priceFor, type Product } from "@/lib/catalog";
import type { SiteSettings } from "@/lib/settings";

/** The gift option prices and limit come from the site settings (edited in the admin). */
export type GiftPrices = Pick<SiteSettings, "giftWrapPrice" | "giftCardPrice">;

/** Hampers arrive already packed in a gift box, so they are not offered gift wrap. */
export const canGiftWrap = (product: Product) => product.category !== "hamper";

/** Price of one piece with its gift options. A card with no words costs nothing. */
export function unitPrice(product: Product, gift: { wrap: boolean; note: string }, prices: GiftPrices, size?: string) {
  return (
    priceFor(product, size) +
    (gift.wrap && canGiftWrap(product) ? prices.giftWrapPrice : 0) +
    (gift.note.trim() ? prices.giftCardPrice : 0)
  );
}
