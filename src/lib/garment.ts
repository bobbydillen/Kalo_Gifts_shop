import type { Product } from "@/lib/catalog";

/**
 * Wear (tees and hoodies) is shown as a garment on a hanger when it has cut-out photos: files named
 * cut-back / cut-front (a transparent picture of the garment alone) next to worn-* photos of people
 * wearing it. These helpers sort a product's photos into those roles.
 */
export type GarmentPhotos = {
  sides: { side: "back" | "front"; src: string }[]; // cut-outs, the printed side first
  worn: string[]; // photos of the piece being worn
};

const isCut = (src: string) => /\/cut-(back|front)\.[a-z]+$/.test(src);
export const isCutout = isCut;

export function garmentPhotos(product: Pick<Product, "images">): GarmentPhotos {
  const back = product.images.find((s) => /\/cut-back\./.test(s));
  const front = product.images.find((s) => /\/cut-front\./.test(s));
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
