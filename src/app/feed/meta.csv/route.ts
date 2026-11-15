import { categoryLabels, fromPrice } from "@/lib/catalog";
import { getProducts } from "@/lib/catalog-data";
import { site } from "@/lib/site";

/**
 * The product list for a Meta (Facebook and Instagram) catalog. Meta fetches this address on a
 * schedule, so price, photo and stock changes made in the admin reach the ads by themselves.
 * One row per product; the id is the product's address name, the same id the Pixel sends.
 * Photos go through /feed/image so Meta always receives a square JPEG.
 */
const COLUMNS = [
  "id",
  "title",
  "description",
  "availability",
  "condition",
  "price",
  "link",
  "image_link",
  "additional_image_link",
  "brand",
  "product_type",
  "custom_label_0",
] as const;

const cell = (v: string) => `"${v.replace(/\r?\n/g, " ").replace(/"/g, '""')}"`;

const photo = (src: string) => `${site.url}/feed/image?src=${encodeURIComponent(src)}`;

export async function GET() {
  const products = (await getProducts()).filter((p) => !p.buildYourOwn && p.images.length > 0);

  const rows = products.map((p) => {
    const tracked = Object.values(p.stock);
    const inStock = p.contains?.length ? true : tracked.length === 0 || tracked.some((n) => n > 0);
    const colours = p.colours.map((c) => c.name).filter(Boolean);
    const sizes = p.sizes.filter(Boolean);
    const extras = [
      colours.length ? `Colours: ${colours.join(", ")}.` : "",
      sizes.length ? `Sizes: ${sizes.join(", ")}.` : "",
      p.message?.text ? `Printed with: ${p.message.text}${p.message.ref ? ` (${p.message.ref})` : ""}.` : "",
    ]
      .filter(Boolean)
      .join(" ");
    const [first, ...others] = p.images;
    return [
      p.slug,
      p.name,
      [p.description.trim(), extras].filter(Boolean).join(" ").slice(0, 4900),
      inStock ? "in stock" : "out of stock",
      "new",
      `${fromPrice(p).price.toFixed(2)} INR`,
      `${site.url}/product/${p.slug}`,
      photo(first),
      others.slice(0, 9).map(photo).join(","),
      site.name,
      categoryLabels[p.category],
      p.christmas ? "christmas" : "everyday",
    ];
  });

  const csv = [COLUMNS.join(","), ...rows.map((r) => r.map((v) => cell(String(v))).join(","))].join("\r\n") + "\r\n";
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Cache-Control": "public, max-age=900, s-maxage=900",
    },
  });
}
