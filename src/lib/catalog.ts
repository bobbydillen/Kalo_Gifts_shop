/**
 * SAMPLE CATALOGUE. Every name, price and colour here is a placeholder so the
 * home page can be designed. Phase 3 replaces this file with the database.
 */

export type Category = "tshirt" | "hoodie" | "cap" | "keychain" | "tote" | "bottle" | "hamper";

export type Product = {
  id: string;
  name: string;
  category: Category;
  price: number; // rupees
  line: string; // one-line hook under the name
  colours?: { name: string; hex: string }[];
  sizes?: string[];
  tint: string; // glow colour behind the placeholder art
  tag?: string;
  contains?: string[]; // hampers: ids of the products inside
};

export const categoryLabels: Record<Category, string> = {
  tshirt: "T-shirts",
  hoodie: "Hoodies",
  cap: "Caps",
  keychain: "Keychains",
  tote: "Tote bags",
  bottle: "Bottles",
  hamper: "Hampers",
};

const SIZES = ["S", "M", "L", "XL", "XXL"];
const cream = { name: "Cream", hex: "#F3ECDF" };
const pine = { name: "Pine", hex: "#1B4436" };
const berry = { name: "Berry", hex: "#A3282A" };
const ink = { name: "Ink", hex: "#16130F" };

export const products: Product[] = [
  {
    id: "grace-tee",
    name: "Grace Tee",
    category: "tshirt",
    price: 799,
    line: "Soft cotton, a quiet word on the chest.",
    colours: [cream, pine, ink],
    sizes: SIZES,
    tint: "#1B4436",
    tag: "Christmas edit",
  },
  {
    id: "still-hoodie",
    name: "Be Still Hoodie",
    category: "hoodie",
    price: 1499,
    line: "Heavy fleece for slow winter mornings.",
    colours: [pine, berry, ink],
    sizes: SIZES,
    tint: "#A3282A",
    tag: "Christmas edit",
  },
  {
    id: "light-cap",
    name: "Light Cap",
    category: "cap",
    price: 499,
    line: "Six panels, one small reminder.",
    colours: [cream, pine],
    tint: "#A8823F",
  },
  {
    id: "anchor-keychain",
    name: "Anchor Keychain",
    category: "keychain",
    price: 199,
    line: "Hope that travels with your keys.",
    tint: "#A8823F",
  },
  {
    id: "carry-tote",
    name: "Carry Tote",
    category: "tote",
    price: 449,
    line: "Sturdy canvas for the everyday.",
    colours: [cream, ink],
    tint: "#1B4436",
  },
  {
    id: "wellspring-bottle",
    name: "Wellspring Bottle",
    category: "bottle",
    price: 699,
    line: "A verse to sip by, all day long.",
    colours: [cream, pine, berry],
    tint: "#C23A36",
    tag: "Christmas edit",
  },
  {
    id: "joy-hamper",
    name: "The Joy Hamper",
    category: "hamper",
    price: 2199,
    line: "A hoodie, a bottle and a keychain, wrapped and ready.",
    tint: "#A3282A",
    tag: "Hamper",
    contains: ["still-hoodie", "wellspring-bottle", "anchor-keychain"],
  },
  {
    id: "everyday-hamper",
    name: "The Everyday Hamper",
    category: "hamper",
    price: 1699,
    line: "A tee, a tote and a cap for the daily round.",
    tint: "#A8823F",
    tag: "Hamper",
    contains: ["grace-tee", "carry-tote", "light-cap"],
  },
];

export const byId = (id: string) => products.find((p) => p.id === id)!;
export const hampers = products.filter((p) => p.category === "hamper");

export const formatPrice = (rupees: number) => `₹${rupees.toLocaleString("en-IN")}`;
