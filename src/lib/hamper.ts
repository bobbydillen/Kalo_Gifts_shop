import { priceFor, type Catalog, type Product } from "@/lib/catalog";
import type { SiteSettings } from "@/lib/settings";

/**
 * Build-your-own hampers. A hamper is a list of parts, each one a product with its own colour,
 * size and (for a photo frame) photo. The price is the items, minus a percentage discount, plus a
 * box fee, both set in the admin. The database works the same sum out when the order is placed.
 */

export const MIN_HAMPER_PRODUCTS = 3; // different products
export const MAX_HAMPER_PRODUCTS = 10;
export const MAX_PART_QTY = 5;

export type HamperPart = {
  slug: string;
  colour?: string;
  size?: string;
  qty: number;
  /** For a custom photo frame: where the photo is stored, a small preview, and its direction. */
  photo?: { path: string; thumb: string; orient: "portrait" | "landscape" };
};

type Money = Pick<SiteSettings, "hamperBoxFee" | "hamperDiscountPercent">;

export function hamperPrice(parts: Pick<HamperPart, "slug" | "size" | "qty">[], productBySlug: (slug: string) => Product | undefined, settings: Money) {
  const itemsTotal = parts.reduce((sum, p) => {
    const product = productBySlug(p.slug);
    return product ? sum + priceFor(product, p.size) * p.qty : sum;
  }, 0);
  const discount = Math.round((itemsTotal * Math.min(Math.max(settings.hamperDiscountPercent, 0), 90)) / 100);
  const boxFee = settings.hamperBoxFee;
  return {
    itemsTotal,
    discount,
    boxFee,
    total: itemsTotal - discount + boxFee,
    distinct: new Set(parts.map((p) => p.slug)).size,
  };
}

/** True when every chosen product has enough stock for its quantity. */
export function hamperInStock(parts: HamperPart[], catalog: Pick<Catalog, "productBySlug" | "stockFor">): boolean {
  return parts.every((p) => {
    const product = catalog.productBySlug(p.slug);
    return product ? catalog.stockFor(product, p.colour, p.size) >= p.qty : false;
  });
}

/** One readable line per part, for summaries: "Mood Mug × 1 (Midnight Mood)". */
export function describePart(part: Pick<HamperPart, "slug" | "colour" | "size" | "qty">, productBySlug: (slug: string) => Product | undefined): string {
  const product = productBySlug(part.slug);
  const options = [part.colour, part.size].filter(Boolean).join(", ");
  return `${product?.name ?? part.slug} × ${part.qty}${options ? ` (${options})` : ""}`;
}
