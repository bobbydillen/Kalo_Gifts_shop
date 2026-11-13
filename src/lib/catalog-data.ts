import { createClient } from "@supabase/supabase-js";
import { cacheLife, cacheTag } from "next/cache";
import { variantKey, type Category, type Product } from "@/lib/catalog";

type Row = {
  slug: string;
  name: string;
  category: Category;
  price: number;
  line: string;
  description: string;
  message_text: string | null;
  message_ref: string | null;
  details: string[];
  sizes: string[];
  tint: string;
  tag: string | null;
  christmas: boolean;
  contains: string[];
  weight_g: number;
  product_colours: { name: string; hex: string; position: number }[];
  stock: { colour: string; size: string; qty: number }[];
  product_images: { path: string; position: number; colour: string }[];
};

/**
 * Every active product, read from the database. The result is cached and shared by all
 * visitors; saving a product in the admin expires the "catalog" tag so changes show
 * straight away, and it refreshes on its own every five minutes regardless.
 */
export async function getProducts(): Promise<Product[]> {
  "use cache";
  cacheTag("catalog");
  cacheLife({ stale: 30, revalidate: 300, expire: 86400 });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabase = createClient(url, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
    auth: { persistSession: false },
  });

  const { data, error } = await supabase
    .from("products")
    .select("*, product_colours(name, hex, position), stock(colour, size, qty), product_images(path, position, colour)")
    .eq("active", true)
    .order("sort")
    .order("name")
    .overrideTypes<Row[], { merge: false }>();
  if (error) throw new Error(`Could not load the catalogue: ${error.message}`);

  const photos = `${url}/storage/v1/object/public/product-images/`;

  return data.map((row) => ({
    slug: row.slug,
    name: row.name,
    category: row.category,
    price: row.price,
    line: row.line,
    description: row.description,
    message: row.message_text ? { text: row.message_text, ref: row.message_ref ?? undefined } : undefined,
    details: row.details,
    colours: [...row.product_colours]
      .sort((a, b) => a.position - b.position)
      .map(({ name, hex }) => ({ name, hex })),
    sizes: row.sizes,
    stock: Object.fromEntries(
      row.stock.map((s) => [variantKey(s.colour || undefined, s.size || undefined), s.qty]),
    ),
    images: [...row.product_images].sort((a, b) => a.position - b.position).map((i) => photos + i.path),
    // a photo tagged with a colour the product no longer has counts as shared
    imageColours: [...row.product_images]
      .sort((a, b) => a.position - b.position)
      .map((i) => (row.product_colours.some((c) => c.name === i.colour) ? i.colour : "")),
    tint: row.tint,
    tag: row.tag ?? undefined,
    christmas: row.christmas,
    contains: row.category === "hamper" ? row.contains : undefined,
    weightG: row.weight_g,
  }));
}
