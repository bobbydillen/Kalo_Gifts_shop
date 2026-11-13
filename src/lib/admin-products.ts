import { categories, STANDARD_SIZES, type Category } from "@/lib/catalog";

/** What the product editor sends to be saved. Used by the form and checked again on the server. */
export type ProductInput = {
  id?: string; // missing when creating
  slug: string; // fixed once created
  name: string;
  category: Category;
  price: number; // whole rupees
  weight_g: number; // parcel weight in grams (for shipping)
  length_cm: number;
  breadth_cm: number;
  height_cm: number;
  line: string;
  description: string;
  message_text: string;
  message_ref: string;
  details: string[];
  sizes: string[];
  tint: string;
  tag: string;
  christmas: boolean;
  contains: string[]; // hampers: slugs
  active: boolean;
  sort: number;
  colours: { name: string; hex: string }[];
  /** One entry per tracked variant. Variants left out are not tracked (always available). */
  stock: { colour: string; size: string; qty: number }[];
};

export type AdminImage = { id: string; path: string; position: number; colour: string };

export const slugify = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

export const photoUrl = (path: string) =>
  `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/product-images/${path}`;

const HEX = /^#[0-9a-fA-F]{6}$/;
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const text = (value: unknown, max: number) => (typeof value === "string" ? value.trim().slice(0, max) : "");
const list = (value: unknown) => (Array.isArray(value) ? value : []);

/**
 * Checks and cleans a product before it is saved. It never trusts its input: the server
 * runs it on whatever arrives, and the form runs it first for quick feedback.
 */
export function validateProduct(
  raw: ProductInput,
  creating: boolean,
): { ok: true; value: ProductInput } | { ok: false; error: string } {
  const fail = (error: string) => ({ ok: false as const, error });

  const name = text(raw.name, 120);
  if (!name) return fail("Give the product a name.");

  const slug = text(raw.slug, 80);
  if (creating && !SLUG.test(slug)) {
    return fail("The web address can only use lowercase letters, numbers and single dashes.");
  }

  if (!categories.some((c) => c.id === raw.category)) return fail("Choose a category.");

  const price = raw.price;
  if (!Number.isInteger(price) || price < 0 || price > 1_000_000) return fail("Enter the price in whole rupees.");

  const parcel = {
    weight_g: raw.weight_g,
    length_cm: raw.length_cm,
    breadth_cm: raw.breadth_cm,
    height_cm: raw.height_cm,
  };
  if (!Number.isInteger(parcel.weight_g) || parcel.weight_g < 1 || parcel.weight_g > 50000) {
    return fail("Enter the parcel weight in grams, for example 300.");
  }
  for (const side of [parcel.length_cm, parcel.breadth_cm, parcel.height_cm]) {
    if (!Number.isInteger(side) || side < 1 || side > 200) return fail("Enter the parcel size in whole centimetres.");
  }

  const sizes = list(raw.sizes).filter((s): s is string => STANDARD_SIZES.includes(s as string));
  if (new Set(sizes).size !== sizes.length) return fail("A size is listed twice.");

  const colours: ProductInput["colours"] = [];
  for (const c of list(raw.colours)) {
    const colourName = text(c?.name, 40);
    const hex = typeof c?.hex === "string" ? c.hex : "";
    if (!colourName) return fail("Every colour needs a name.");
    if (!HEX.test(hex)) return fail(`Pick a valid colour for ${colourName}.`);
    if (colours.some((x) => x.name.toLowerCase() === colourName.toLowerCase())) {
      return fail(`The colour ${colourName} is listed twice.`);
    }
    colours.push({ name: colourName, hex: hex.toUpperCase() });
  }

  const stock: ProductInput["stock"] = [];
  for (const s of list(raw.stock)) {
    const colour = typeof s?.colour === "string" ? s.colour : "";
    const size = typeof s?.size === "string" ? s.size : "";
    const qty = s?.qty;
    if (colour && !colours.some((c) => c.name === colour)) continue; // colour was removed
    if (size && !sizes.includes(size)) continue; // size was removed
    if (!Number.isInteger(qty) || qty < 0 || qty > 100_000) return fail("Stock must be a whole number, 0 or more.");
    if (stock.some((x) => x.colour === colour && x.size === size)) return fail("A stock entry is repeated.");
    stock.push({ colour, size, qty });
  }

  const tint = typeof raw.tint === "string" && HEX.test(raw.tint) ? raw.tint.toUpperCase() : "#1B4436";

  return {
    ok: true,
    value: {
      id: typeof raw.id === "string" && raw.id ? raw.id : undefined,
      slug,
      name,
      category: raw.category,
      price,
      ...parcel,
      line: text(raw.line, 200),
      description: text(raw.description, 2000),
      message_text: text(raw.message_text, 400),
      message_ref: text(raw.message_ref, 80),
      details: list(raw.details)
        .map((d) => text(d, 200))
        .filter(Boolean)
        .slice(0, 12),
      sizes,
      tint,
      tag: text(raw.tag, 40),
      christmas: Boolean(raw.christmas),
      contains: raw.category === "hamper" ? list(raw.contains).map((s) => text(s, 80)).filter(Boolean).slice(0, 20) : [],
      active: Boolean(raw.active),
      sort: Number.isInteger(raw.sort) ? raw.sort : 0,
      colours,
      stock: raw.category === "hamper" ? [] : stock, // a hamper's stock follows what is inside it
    },
  };
}
