/**
 * The catalogue.
 *
 * SAMPLE DATA: every product below is a placeholder until KALO's real products
 * are entered. Pages never read `products` directly; they go through the
 * functions at the bottom of this file, so moving to the database later only
 * changes this file.
 */

export type Category = "tshirt" | "hoodie" | "cap" | "keychain" | "tote" | "bottle" | "hamper";

export type Colour = { name: string; hex: string };

export type Product = {
  slug: string; // used in the address: /product/<slug>
  name: string;
  category: Category;
  price: number; // rupees
  line: string; // one-line hook under the name
  description: string;
  message?: { text: string; ref?: string }; // the verse or words on the piece
  details: string[]; // short facts: fabric, capacity, care
  colours: Colour[]; // empty when the product has one look
  sizes: string[]; // empty when the product has no sizes
  /** Units in stock per variant, keyed "Colour/Size". A missing key means in stock. */
  stock: Record<string, number>;
  images: string[]; // photo paths; empty shows the line drawing instead
  tint: string; // glow colour behind the product
  tag?: string;
  christmas: boolean; // part of the Christmas edit
  contains?: string[]; // hampers: slugs of the products inside
};

export const categories: { id: Category; label: string; slug: string; intro: string }[] = [
  { id: "tshirt", label: "T-shirts", slug: "t-shirts", intro: "Oversized tees with a quiet word on them." },
  { id: "hoodie", label: "Hoodies", slug: "hoodies", intro: "Heavy, soft layers for slow mornings." },
  { id: "cap", label: "Caps", slug: "caps", intro: "A small reminder, worn every day." },
  { id: "tote", label: "Tote bags", slug: "tote-bags", intro: "Sturdy canvas for the daily round." },
  { id: "bottle", label: "Bottles", slug: "bottles", intro: "A verse to sip by, all day long." },
  { id: "keychain", label: "Keychains", slug: "keychains", intro: "Little keepsakes that travel with you." },
  { id: "hamper", label: "Hampers", slug: "hampers", intro: "Chosen, wrapped and ready to give." },
];

export const categoryLabels = Object.fromEntries(categories.map((c) => [c.id, c.label])) as Record<
  Category,
  string
>;

const SIZES = ["XS", "S", "M", "L", "XL", "XXL"];
const cream: Colour = { name: "Cream", hex: "#F3ECDF" };
const pine: Colour = { name: "Pine", hex: "#1B4436" };
const berry: Colour = { name: "Berry", hex: "#A3282A" };
const ink: Colour = { name: "Ink", hex: "#16130F" };

const products: Product[] = [
  {
    slug: "grace-tee",
    name: "Grace Tee",
    category: "tshirt",
    price: 799,
    line: "Soft cotton, a quiet word on the chest.",
    description:
      "An oversized everyday tee with a single word set small on the chest. Easy to wear, easy to give.",
    message: { text: "My grace is sufficient for you.", ref: "2 Corinthians 12:9" },
    details: ["Oversized fit", "100% cotton", "Machine wash cold, inside out"],
    colours: [cream, pine, ink],
    sizes: SIZES,
    stock: { "Cream/XS": 0, "Ink/XXL": 2 },
    images: [],
    tint: "#1B4436",
    tag: "Christmas edit",
    christmas: true,
  },
  {
    slug: "be-still-hoodie",
    name: "Be Still Hoodie",
    category: "hoodie",
    price: 1499,
    line: "Heavy fleece for slow winter mornings.",
    description:
      "A heavyweight fleece hoodie with a calm line across the chest. Made for cold mornings and long evenings.",
    message: { text: "Be still, and know that I am God.", ref: "Psalm 46:10" },
    details: ["Relaxed fit", "Brushed fleece inside", "Machine wash cold, inside out"],
    colours: [pine, berry, ink],
    sizes: SIZES,
    stock: { "Berry/XS": 0, "Berry/S": 0 },
    images: [],
    tint: "#A3282A",
    tag: "Christmas edit",
    christmas: true,
  },
  {
    slug: "light-cap",
    name: "Light Cap",
    category: "cap",
    price: 499,
    line: "Six panels, one small reminder.",
    description: "A soft six-panel cap with a small embroidered mark on the front.",
    message: { text: "You are the light of the world.", ref: "Matthew 5:14" },
    details: ["One size, adjustable strap", "Cotton twill"],
    colours: [cream, pine],
    sizes: [],
    stock: {},
    images: [],
    tint: "#A8823F",
    christmas: false,
  },
  {
    slug: "anchor-keychain",
    name: "Anchor Keychain",
    category: "keychain",
    price: 199,
    line: "Hope that travels with your keys.",
    description: "A small metal keychain with a single line engraved on the tag.",
    message: { text: "This hope we have as an anchor of the soul.", ref: "Hebrews 6:19" },
    details: ["Metal tag and ring"],
    colours: [],
    sizes: [],
    stock: {},
    images: [],
    tint: "#A8823F",
    christmas: false,
  },
  {
    slug: "carry-tote",
    name: "Carry Tote",
    category: "tote",
    price: 449,
    line: "Sturdy canvas for the everyday.",
    description: "A roomy canvas tote with long handles and a printed line on the front.",
    message: { text: "Carry each other’s burdens.", ref: "Galatians 6:2" },
    details: ["Heavy cotton canvas", "Long shoulder handles"],
    colours: [cream, ink],
    sizes: [],
    stock: {},
    images: [],
    tint: "#1B4436",
    christmas: false,
  },
  {
    slug: "wellspring-bottle",
    name: "Wellspring Bottle",
    category: "bottle",
    price: 699,
    line: "A verse to sip by, all day long.",
    description: "A steel water bottle with a verse printed down the side.",
    message: { text: "With joy you will draw water out of the wells of salvation.", ref: "Isaiah 12:3" },
    details: ["Stainless steel", "Hand wash"],
    colours: [cream, pine, berry],
    sizes: [],
    stock: { Berry: 0 },
    images: [],
    tint: "#C23A36",
    tag: "Christmas edit",
    christmas: true,
  },
  {
    slug: "joy-hamper",
    name: "The Joy Hamper",
    category: "hamper",
    price: 2199,
    line: "A hoodie, a bottle and a keychain, wrapped and ready.",
    description:
      "Three of our favourite pieces, packed together and ready to hand over. Choose the hoodie size when you add it.",
    details: ["Packed in a gift box"],
    colours: [],
    sizes: SIZES,
    stock: {},
    images: [],
    tint: "#A3282A",
    tag: "Hamper",
    christmas: true,
    contains: ["be-still-hoodie", "wellspring-bottle", "anchor-keychain"],
  },
  {
    slug: "everyday-hamper",
    name: "The Everyday Hamper",
    category: "hamper",
    price: 1699,
    line: "A tee, a tote and a cap for the daily round.",
    description:
      "An easy set for someone you see every day. Choose the tee size when you add it.",
    details: ["Packed in a gift box"],
    colours: [],
    sizes: SIZES,
    stock: {},
    images: [],
    tint: "#A8823F",
    tag: "Hamper",
    christmas: true,
    contains: ["grace-tee", "carry-tote", "light-cap"],
  },
];

// ---- reading the catalogue -------------------------------------------------

export const allProducts = () => products;
export const productBySlug = (slug: string) => products.find((p) => p.slug === slug);
export const productsIn = (category: Category) => products.filter((p) => p.category === category);
export const christmasProducts = () => products.filter((p) => p.christmas);
export const hampers = () => productsIn("hamper");
export const categoryBySlug = (slug: string) => categories.find((c) => c.slug === slug);
export const categoryOf = (product: Product) => categories.find((c) => c.id === product.category)!;

/** Products inside a hamper, in order. */
export const hamperContents = (hamper: Product) =>
  (hamper.contains ?? []).map(productBySlug).filter((p): p is Product => Boolean(p));

/** Other products to suggest on a product page: same category first, then the rest. */
export function relatedTo(product: Product, count = 4) {
  const others = products.filter((p) => p.slug !== product.slug);
  return [
    ...others.filter((p) => p.category === product.category),
    ...others.filter((p) => p.category !== product.category),
  ].slice(0, count);
}

// ---- variants and stock ----------------------------------------------------

/** Key for one variant in `stock`: "Colour/Size", or just the part that exists. */
export const variantKey = (colour?: string, size?: string) =>
  [colour, size].filter(Boolean).join("/");

/**
 * Units available for a variant. Variants not listed in `stock` count as available.
 * A hamper has no stock of its own: it is limited by the scarcest item inside it.
 * For an item with sizes, the hamper's chosen size is the one that counts.
 */
export function stockFor(product: Product, colour?: string, size?: string): number {
  if (!product.contains) return product.stock[variantKey(colour, size)] ?? Infinity;

  return Math.min(
    ...hamperContents(product).map((item) => {
      const itemSize = item.sizes.length ? size : undefined;
      if (item.sizes.length && !size) return Infinity; // nothing to check until a size is chosen
      const looks = item.colours.length ? item.colours.map((c) => c.name) : [undefined];
      return looks.reduce((sum, look) => sum + stockFor(item, look, itemSize), 0);
    }),
  );
}

export const formatPrice = (rupees: number) => `₹${rupees.toLocaleString("en-IN")}`;
