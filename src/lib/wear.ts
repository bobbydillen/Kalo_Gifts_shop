/**
 * Everything the Wear page shows, in one place. The pieces here are not shop products yet: when a
 * piece is added in the admin, put its web name in `slug` and the page's "Add to bag" starts working
 * (until then it offers a WhatsApp pre-order). Prices, fabric and fit below are placeholders to confirm.
 */

export type WearPiece = {
  id: string;
  name: string;
  kind: "Oversized tee" | "Hoodie";
  colour: string;
  swatch: string; // the garment colour, for the plain side and small dots
  price: number; // ₹, placeholder until the piece is a real product
  line: string; // one sentence about the print
  verse?: string;
  fabric: string;
  fit: string;
  sizes: string[];
  front?: string; // photo of the front, worn
  back?: string; // photo of the back, worn
  cutFront?: string; // the garment alone, front (cut out, transparent, 1000 x 1150)
  cutBack?: string; // the garment alone, back
  plainFront?: boolean; // the front has no print
  show: "front" | "back"; // the side that faces you on the rack
  slug?: string; // shop product web name, once it exists
  christmas?: boolean;
};

const TEE_SIZES = ["S", "M", "L", "XL", "XXL"];
const TEE_FABRIC = "100% cotton, heavyweight";
const TEE_FIT = "Oversized, dropped shoulder";

export const WEAR: WearPiece[] = [
  {
    id: "for-his-glory",
    name: "For His Glory",
    kind: "Oversized tee",
    colour: "Washed black",
    swatch: "#1c1b1a",
    price: 899,
    line: "Whatever you do, do it all for the glory of God.",
    verse: "1 Corinthians 10:31",
    fabric: TEE_FABRIC,
    fit: TEE_FIT,
    sizes: TEE_SIZES,
    front: "/wear/glory-front.webp",
    back: "/wear/glory-back.webp",
    cutFront: "/wear/cut/glory-front.webp",
    cutBack: "/wear/cut/glory-back.webp",
    show: "back",
  },
  {
    id: "paid-in-full",
    name: "Paid in Full",
    kind: "Oversized tee",
    colour: "Bone",
    swatch: "#e8e1d1",
    price: 899,
    line: "A receipt from Calvary. Every debt, settled.",
    verse: "John 19:30",
    fabric: TEE_FABRIC,
    fit: TEE_FIT,
    sizes: TEE_SIZES,
    front: "/wear/receipt-front.webp",
    back: "/wear/receipt-back.webp",
    cutFront: "/wear/cut/receipt-front.webp",
    cutBack: "/wear/cut/receipt-back.webp",
    show: "back",
  },
  {
    id: "gracias-cristo",
    name: "Gracias Cristo",
    kind: "Oversized tee",
    colour: "Olive",
    swatch: "#5b6142",
    price: 899,
    line: "Dios lo hizo. God did it, from the manger on.",
    verse: "Luke 2:11",
    fabric: TEE_FABRIC,
    fit: TEE_FIT,
    sizes: TEE_SIZES,
    front: "/wear/gracias-cristo-front.webp",
    back: "/wear/gracias-cristo-back.webp",
    cutFront: "/wear/cut/gracias-cristo-front.webp",
    cutBack: "/wear/cut/gracias-cristo-back.webp",
    show: "back",
  },
  {
    id: "all-the-time",
    name: "All the Time",
    kind: "Hoodie",
    colour: "Black",
    swatch: "#121212",
    price: 1499,
    line: "God is good, all the time. Mountains, river and a rising sun.",
    verse: "Psalm 100:5",
    fabric: "Cotton fleece, brushed inside",
    fit: "Oversized, relaxed hood",
    sizes: TEE_SIZES,
    back: "/wear/all-the-time-back.webp",
    cutBack: "/wear/cut/all-the-time-back.webp",
    show: "back",
  },
  {
    id: "merry-christmas",
    name: "Merry Christmas",
    kind: "Oversized tee",
    colour: "Christmas red",
    swatch: "#a3232b",
    price: 899,
    line: "A cross, a star and a ribbon of gold: the reason for the season.",
    verse: "Isaiah 9:6",
    fabric: TEE_FABRIC,
    fit: TEE_FIT,
    sizes: TEE_SIZES,
    back: "/wear/merry-christmas-back.webp",
    cutFront: "/wear/cut/merry-christmas-front.webp",
    cutBack: "/wear/cut/merry-christmas-back.webp",
    plainFront: true,
    show: "back",
    christmas: true,
  },
];

/** Photos of people wearing the pieces, in the order the "changing outfits" section shows them. */
export const OUTFITS = [
  { src: "/wear/receipt-front.webp", piece: "Paid in Full", side: "Front" },
  { src: "/wear/receipt-back.webp", piece: "Paid in Full", side: "Back" },
  { src: "/wear/gracias-cristo-front.webp", piece: "Gracias Cristo", side: "Front" },
  { src: "/wear/gracias-cristo-back.webp", piece: "Gracias Cristo", side: "Back" },
  { src: "/wear/glory-back.webp", piece: "For His Glory", side: "Back" },
];

/** The photo seen through the letters of the brand name. */
export const LETTER_PHOTO = "/wear/gracias-cristo-back.webp";

export const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;

/** The photo that faces you on the rack. */
export const rackPhoto = (p: WearPiece) => (p.show === "front" ? p.front : p.back) ?? p.back ?? p.front ?? "";

/** The cut-out garment sides a piece has, the side that hangs facing you first. */
export function garmentSides(p: WearPiece): { side: "front" | "back"; src: string }[] {
  const sides = [
    p.cutBack ? { side: "back" as const, src: p.cutBack } : null,
    p.cutFront ? { side: "front" as const, src: p.cutFront } : null,
  ].filter((s): s is { side: "front" | "back"; src: string } => s !== null);
  return p.show === "front" ? sides.reverse() : sides;
}
