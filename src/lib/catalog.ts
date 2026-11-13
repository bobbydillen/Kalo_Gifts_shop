/**
 * The shop's view of the catalogue: types, categories, and a small toolkit
 * (`createCatalog`) for finding things in a list of products.
 *
 * The products themselves live in the database. Server code gets the list from
 * getProducts() in catalog-data.ts; browser code gets it from the CatalogProvider.
 * Both then wrap it with createCatalog(). Nothing here talks to the database.
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
  /**
   * Units in stock per variant, keyed "Colour/Size" (or just the part that exists).
   * A variant with no entry is not tracked and counts as always available.
   */
  stock: Record<string, number>;
  images: string[]; // photo addresses; empty shows the line drawing instead
  tint: string; // glow colour behind the product
  tag?: string;
  christmas: boolean; // part of the Christmas edit
  contains?: string[]; // hampers: slugs of the products inside
  weightG: number; // packed parcel weight in grams, for the delivery cost
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

export const categoryBySlug = (slug: string) => categories.find((c) => c.slug === slug);
export const categoryOf = (product: Product) => categories.find((c) => c.id === product.category)!;

/** The standard clothing sizes, shared by every size-based product. */
export const STANDARD_SIZES = ["XS", "S", "M", "L", "XL", "XXL"];

/** Key for one variant in `stock`: "Colour/Size", or just the part that exists. */
export const variantKey = (colour?: string, size?: string) =>
  [colour, size].filter(Boolean).join("/");

export const formatPrice = (rupees: number) => `₹${rupees.toLocaleString("en-IN")}`;

export type Catalog = ReturnType<typeof createCatalog>;

export function createCatalog(products: Product[]) {
  const bySlug = new Map(products.map((p) => [p.slug, p]));

  const productBySlug = (slug: string) => bySlug.get(slug);
  const productsIn = (category: Category) => products.filter((p) => p.category === category);
  const christmasProducts = () => products.filter((p) => p.christmas);
  const hampers = () => productsIn("hamper");

  /** Products inside a hamper, in order. */
  const hamperContents = (hamper: Product) =>
    (hamper.contains ?? []).map((slug) => bySlug.get(slug)).filter((p): p is Product => Boolean(p));

  /** Other products to suggest on a product page: same category first, then the rest. */
  function relatedTo(product: Product, count = 4) {
    const others = products.filter((p) => p.slug !== product.slug);
    return [
      ...others.filter((p) => p.category === product.category),
      ...others.filter((p) => p.category !== product.category),
    ].slice(0, count);
  }

  /**
   * Units available for a variant. Variants not listed in `stock` count as available.
   * A hamper has no stock of its own: it is limited by the scarcest item inside it.
   * For an item with sizes, the hamper's chosen size is the one that counts.
   */
  function stockFor(product: Product, colour?: string, size?: string): number {
    if (product.category !== "hamper") return product.stock[variantKey(colour, size)] ?? Infinity;

    return Math.min(
      ...hamperContents(product).map((item) => {
        if (item.sizes.length && !size) return Infinity; // nothing to check until a size is chosen
        const itemSize = item.sizes.length ? size : undefined;
        const looks = item.colours.length ? item.colours.map((c) => c.name) : [undefined];
        return looks.reduce((sum, look) => sum + stockFor(item, look, itemSize), 0);
      }),
    );
  }

  return {
    products,
    productBySlug,
    productsIn,
    christmasProducts,
    hampers,
    hamperContents,
    relatedTo,
    stockFor,
  };
}
