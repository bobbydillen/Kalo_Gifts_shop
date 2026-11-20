/**
 * The warm, light "studio" backdrop behind product pictures (product pages and cards). It is a soft
 * cream with light from above; light products (a bone tee, a white mug) get a deeper stone shade so
 * they still stand out.
 */

const luminance = (hex: string) => {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return 0.5;
  const n = parseInt(m[1], 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

/** CSS background for the studio, given the product's main colour (hex). */
export function studioBackground(productHex?: string): string {
  const light = productHex ? luminance(productHex) > 0.55 : false;
  return light
    ? "radial-gradient(ellipse 75% 60% at 50% 22%, #efe7da, #d9cdb9 62%, #c7b9a1)"
    : "radial-gradient(ellipse 75% 60% at 50% 22%, #fbf8f2, #efe7da 58%, #e2d6c3)";
}

/** A soft shadow under a product standing or lying in the studio. */
export const STUDIO_FLOOR = "radial-gradient(ellipse 50% 50% at 50% 50%, rgba(60,45,25,0.28), transparent 70%)";
