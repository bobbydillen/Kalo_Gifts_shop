import type { Product } from "@/lib/catalog";
import { isCutout as anyCutout, photoKind } from "@/lib/photo-kind";

/**
 * Wear (tees and hoodies) is shown as a garment on a hanger when it has cut-out photos (kinds
 * "cut-back" / "cut-front", see photo-kind.ts: a transparent picture of the garment alone) next to
 * photos of people wearing it. These helpers sort a product's photos into those roles.
 */
export type GarmentPhotos = {
  sides: { side: "back" | "front"; src: string }[]; // cut-outs, the printed side first
  worn: string[]; // photos of the piece being worn
};

const isCut = (src: string) => photoKind(src) === "cut-back" || photoKind(src) === "cut-front";
/** A transparent cut-out picture (a garment, or a bottle) rather than a photo. */
export const isCutout = anyCutout;

export function garmentPhotos(product: Pick<Product, "images">): GarmentPhotos {
  const back = product.images.find((s) => photoKind(s) === "cut-back");
  const front = product.images.find((s) => photoKind(s) === "cut-front");
  const sides = [back ? { side: "back" as const, src: back } : null, front ? { side: "front" as const, src: front } : null].filter(
    (s): s is { side: "back" | "front"; src: string } => s !== null,
  );
  return { sides, worn: product.images.filter((s) => !isCut(s)) };
}

/** A tee or hoodie with at least one cut-out photo. */
export const isGarment = (product: Product) =>
  (product.category === "tshirt" || product.category === "hoodie") && product.images.some(isCut);

/** A name for the shared-element transition between the rail and the product page. */
export const garmentTransitionName = (slug: string) => `garment-${slug}`;
