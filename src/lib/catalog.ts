/**
 * The shop's view of the catalogue: types, categories, and a small toolkit
 * (`createCatalog`) for finding things in a list of products.
 *
 * The products themselves live in the database. Server code gets the list from
 * getProducts() in catalog-data.ts; browser code gets it from the CatalogProvider.
 * Both then wrap it with createCatalog(). Nothing here talks to the database.
 */

export type Category = "tshirt" | "hoodie" | "cap" | "keychain" | "tote" | "bottle" | "hamper" | "frame";

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
  imageColours: string[]; // the colour each photo shows, same order as images; "" belongs to every colour
  tint: string; // glow colour behind the product
  tag?: string;
  christmas: boolean; // part of the Christmas edit
  contains?: string[]; // hampers: slugs of the products inside
  designGroup: string; // products sharing a group are different prints of the same item; "" means none
  designLabel: string; // short name on the design picker; empty falls back to the product name
  buildYourOwn: boolean; // the single "Build your own hamper" product; its page is the hamper builder
  customPhoto: boolean; // the customer uploads a photo for this item (a photo frame, or a hamper holding one)
  photoSize: FrameSizeId; // frame size when the item has no size choice, for example a hamper
  sizePrices: Record<string, number>; // price per size; a size not listed uses `price`
  weightG: number; // packed parcel weight in grams, for the delivery cost
};

export type CategoryInfo = {
  id: Category;
  label: string;
  slug: string;
  intro: string;
  /** For the browser tab and search results. Written around what people type into Google. */
  seoTitle: string;
  seoDescription: string;
  /** A short paragraph under the products, for visitors and search engines. */
  about: string;
};

export const categories: CategoryInfo[] = [
  {
    id: "tshirt",
    label: "T-shirts",
    slug: "t-shirts",
    intro: "Oversized tees with a quiet word on them.",
    seoTitle: "Christian T-shirts: printed Christian tees with Bible verses",
    seoDescription: "Printed Christian T-shirts: oversized tees with Bible verses and faith-inspired words. Made to wear and to gift, delivered across India.",
    about: "Our printed Christian T-shirts carry a Bible verse or a short line of faith, printed in designs made to be worn every day rather than only on Sundays. Pick a colour and size, add a handwritten card if it is a gift, and we pack it with care and deliver across India. A Bible verse tee is an easy gift for a friend, a youth group, a birthday or Christmas.",
  },
  {
    id: "hoodie",
    label: "Hoodies",
    slug: "hoodies",
    intro: "Heavy, soft layers for slow mornings.",
    seoTitle: "Christian hoodies with Bible verses",
    seoDescription: "Warm Christian hoodies with Bible verses and faith-inspired designs. A thoughtful gift for Christmas and the cold season, delivered across India.",
    about: "These Christian hoodies are heavy and soft, with a Bible verse or faith-inspired design you will want to wear all winter. They make a lasting Christmas gift for family, friends or your church group. Choose your colour and size, add gift wrap and a handwritten card, and we deliver across India.",
  },
  {
    id: "cap",
    label: "Caps",
    slug: "caps",
    intro: "A small reminder, worn every day.",
    seoTitle: "Christian caps with faith-inspired designs",
    seoDescription: "Christian caps with a small Bible verse or faith design. An easy, thoughtful gift, delivered across India.",
    about: "A cap is a small way to carry your faith through the day. Our Christian caps feature simple faith-inspired designs, and they make an easy gift for a friend, a youth group or a stocking at Christmas. Delivered across India.",
  },
  {
    id: "tote",
    label: "Tote bags",
    slug: "tote-bags",
    intro: "Sturdy canvas for the daily round.",
    seoTitle: "Christian tote bags with Bible verses",
    seoDescription: "Sturdy canvas Christian tote bags printed with Bible verses. A practical faith-inspired gift, delivered across India.",
    about: "Our canvas tote bags are printed with Bible verses and faith-inspired designs, strong enough for church, college, work or the market. A practical Christian gift that people use again and again. Delivered across India.",
  },
  {
    id: "bottle",
    label: "Bottles",
    slug: "bottles",
    intro: "A verse to sip by, all day long.",
    seoTitle: "Bible verse water bottles and Christian printed bottles",
    seoDescription: "Christian water bottles printed with Bible verses. A verse to sip by all day, and an everyday gift for church, school and work. Delivered across India.",
    about: "A Bible verse water bottle keeps a promise within reach all day. Our Christian bottles are printed with verses and faith-inspired designs, and they are a practical gift for church, school, college or the office. Gift wrap and a handwritten card are available, and we deliver across India.",
  },
  {
    id: "keychain",
    label: "Keychains",
    slug: "keychains",
    intro: "Little keepsakes that travel with you.",
    seoTitle: "Christian keychains with Bible verses",
    seoDescription: "Small Christian keychains with Bible verses and faith-inspired designs. Easy gifts and keepsakes, delivered across India.",
    about: "Small keepsakes that travel with you. Our Christian keychains carry a Bible verse or a short blessing, and they work well as a thank-you gift, a Sunday school prize, or a small addition to a Christmas hamper. Delivered across India.",
  },
  {
    id: "hamper",
    label: "Hampers",
    slug: "hampers",
    intro: "Chosen, wrapped and ready to give.",
    seoTitle: "Christian gift hampers and Christmas hampers",
    seoDescription: "Christian gift hampers and Christmas hampers, ready to give. Or build your own hamper with your choice of tees, bottles and keepsakes. Delivered across India.",
    about: "Our Christian gift hampers bring several faith-inspired pieces together, wrapped and ready to give. They suit Christmas, birthdays, baptisms, anniversaries and thank-you gifts. If you would rather choose each piece yourself, build your own hamper: pick the items, colours and sizes, and we pack them together with care and deliver across India.",
  },
  {
    id: "frame",
    label: "Photo frames",
    slug: "photo-frames",
    intro: "Your favourite moment, printed and framed.",
    seoTitle: "Personalised photo frames and custom photo gifts",
    seoDescription: "Personalised photo frames: upload your favourite photo and we print and frame it. A custom gift for family, anniversaries and Christmas, delivered across India.",
    about: "Upload your favourite photo and we print and frame it for you. A custom photo frame is a gift that means more than something off the shelf: a family portrait, a wedding or anniversary memory, a first year of a child. Choose your frame size, and we deliver across India.",
  },
];

export const categoryLabels = Object.fromEntries(categories.map((c) => [c.id, c.label])) as Record<
  Category,
  string
>;

export const categoryBySlug = (slug: string) => categories.find((c) => c.slug === slug);
export const categoryOf = (product: Product) => categories.find((c) => c.id === product.category)!;

/** The standard clothing sizes, shared by every size-based product. */
export const STANDARD_SIZES = ["XS", "S", "M", "L", "XL", "XXL"];

/**
 * Photo frame sizes. All A sizes share one shape (the long side is 1.414 times the short side),
 * so a photo cropped for A4 is also the right shape for A3 or A5. `mm` is width by height, upright.
 */
export type FrameSizeId = "A5" | "A4" | "A3";
export const FRAME_SIZES: { id: FrameSizeId; label: string; mm: [number, number] }[] = [
  { id: "A5", label: "A5 · half of A4", mm: [148, 210] },
  { id: "A4", label: "A4", mm: [210, 297] },
  { id: "A3", label: "A3", mm: [297, 420] },
];
export const frameSizeIds: string[] = FRAME_SIZES.map((f) => f.id);
export const frameSpec = (size: string | undefined) => FRAME_SIZES.find((f) => f.id === size);

/** The price of one piece in a given size. A size with no price of its own uses the product price. */
export const priceFor = (product: Pick<Product, "price" | "sizePrices">, size?: string) =>
  (size && product.sizePrices[size]) || product.price;

/** The lowest price a product is sold at, and whether the price varies by size ("From ₹799"). */
export function fromPrice(product: Pick<Product, "price" | "sizePrices">) {
  const all = [product.price, ...Object.values(product.sizePrices)].filter((n) => n > 0);
  const low = Math.min(...all);
  return { price: low, from: all.some((n) => n !== low) };
}

/** Key for one variant in `stock`: "Colour/Size", or just the part that exists. */
export const variantKey = (colour?: string, size?: string) =>
  [colour, size].filter(Boolean).join("/");

export const formatPrice = (rupees: number) => `₹${rupees.toLocaleString("en-IN")}`;

export type Catalog = ReturnType<typeof createCatalog>;

/**
 * The photos to show for a chosen colour: that colour's own photos first, then the ones shared
 * by every colour. If no photo is tagged with a colour, or none matches, every photo is shown.
 */
export function photosFor(product: Pick<Product, "images" | "imageColours">, colour: string | undefined): string[] {
  const { images, imageColours } = product;
  if (!colour || !imageColours.some((c) => c)) return images;
  const own = images.filter((_, i) => imageColours[i] === colour);
  const shared = images.filter((_, i) => !imageColours[i]);
  const picked = [...own, ...shared];
  return picked.length ? picked : images;
}

export function createCatalog(products: Product[]) {
  const bySlug = new Map(products.map((p) => [p.slug, p]));

  const productBySlug = (slug: string) => bySlug.get(slug);
  const productsIn = (category: Category) => products.filter((p) => p.category === category);
  const christmasProducts = () => products.filter((p) => p.christmas);
  // fixed hampers only; the build-your-own hamper has its own page
  const hampers = () => productsIn("hamper").filter((p) => !p.buildYourOwn);
  const builderProduct = () => products.find((p) => p.buildYourOwn && p.category === "hamper");
  /** What can go inside a build-your-own hamper: every product except hampers. */
  const buildableProducts = () => products.filter((p) => p.category !== "hamper" && !p.buildYourOwn);

  /** Products inside a hamper, in order. */
  const hamperContents = (hamper: Product) =>
    (hamper.contains ?? []).map((slug) => bySlug.get(slug)).filter((p): p is Product => Boolean(p));

  /** The other prints of the same item (products in the same design group), in shop order. */
  const designsOf = (product: Product) =>
    product.designGroup ? products.filter((p) => p.designGroup === product.designGroup && p.slug !== product.slug) : [];

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
    builderProduct,
    buildableProducts,
    hamperContents,
    designsOf,
    relatedTo,
    stockFor,
  };
}
