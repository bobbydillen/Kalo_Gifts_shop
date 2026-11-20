import { photoKind } from "@/lib/photo-kind";

/**
 * The bottle styles: what each one is, from the KALO bottle catalogue. Bottle products belong to a
 * style through their design group (for example "mood-mug"). Capacities left at 0 are not known yet,
 * and hours left at 0 mean the catalogue gives no number ("for hours").
 */

export type BottleStyle = {
  id: string;
  name: string;
  capacityMl: number; // 0 when not known
  coldHours: number; // 0 when not known
  hotHours: number;
  intro: string;
  features: [string, string][];
};

export const BOTTLE_STYLES: BottleStyle[] = [
  {
    id: "mood-mug",
    name: "Mood Mug",
    capacityMl: 750,
    coldHours: 12,
    hotHours: 6,
    intro: "Meet the 750 ml travel cup that keeps up with every vibe. Its double-wall insulation keeps iced coffee cold for up to 12 hours and tea hot for up to 6. The leakproof lid and straw let you sip on the move, and the chunky loop handle makes it easy to grab and go. Use it for coffee, tea, fruit water or anything else, at home, in the car or on the way out.",
    features: [
      ["Double-wall insulation", "keeps drinks cold up to 12 hours and hot up to 6 hours"],
      ["Dual sip lid", "sip through the straw or the spout"],
      ["Leakproof stopper", "seals the straw opening so it won’t spill in your bag"],
      ["Tea & fruit infuser", "for loose tea, lemon water or fruit infusions"],
      ["Ergonomic loop handle", "comfortable grip, easy to carry"],
      ["304 stainless steel", "rust-proof, durable and food grade"],
      ["BPA free", "safe for everyday use"],
      ["Reusable straw", "an easy swap for single-use plastic"],
      ["Wide mouth", "easy to fill, pour and clean"],
      ["Car cup holder friendly", "fits most standard cup holders"],
      ["Anti-slip base", "stays steady on your desk"],
      ["Easy to clean", "the lid parts come apart for a deep clean"],
      ["Gift ready", "gift wrapping and a personal note can be added at checkout"],
    ],
  },
  {
    id: "flowstate",
    name: "FlowState Tumbler",
    capacityMl: 800,
    coldHours: 0,
    hotHours: 0,
    intro: "Stay hydrated your way with the FlowState Tumbler. It has a double-wall stainless steel body and our FlowState™ 3-position lid, so it fits your commute, your workout and your desk. Drinks stay cold or hot for hours, the lid won't splash, and the slim base fits your car's cup holder. Capacity: 800 ml (27 oz).",
    features: [
      ["Car cup holder compatible", ""],
      ["18/8 stainless steel", ""],
      ["BPA free", ""],
      ["Splash proof", ""],
      ["Reusable straw", ""],
      ["Dishwasher safe", ""],
      ["Gift ready", "gift wrapping and a personal note can be added at checkout"],
    ],
  },
  {
    id: "thirst-crusher",
    name: "Thirst Crusher",
    capacityMl: 0,
    coldHours: 0,
    hotHours: 0,
    intro: "Thirst Crusher goes wherever you go: the gym, the office, college or a weekend trek. It has an insulated stainless steel body to keep drinks at the right temperature, a sturdy carry loop to clip it on or grab it, and a protective silicone base that takes the knocks. Every sip hits the spot.",
    features: [
      ["304 food-grade stainless steel", "safe, durable and rust-resistant"],
      ["BPA free", "safe for everyday use"],
      ["Vacuum insulation", "double-wall design for hot and cold drinks"],
      ["Leakproof screw-on lid", "throw it in your bag without worry"],
      ["Carry loop", "easy to grab, hang or clip onto your bag"],
      ["Protective silicone base", "absorbs bumps, prevents dents and stops slipping"],
      ["Dishwasher safe", "quick, easy cleaning"],
      ["Matte finish", "smooth, comfortable grip"],
      ["Classic design", "simple, timeless shape that suits every day"],
      ["Perfect for", "gym, sports, travel, office and school"],
      ["Gift ready", "gift wrapping and a personal note can be added at checkout"],
    ],
  },
  {
    id: "slim-sip",
    name: "Slim Sip",
    capacityMl: 0,
    coldHours: 0,
    hotHours: 0,
    intro: "Slim Sip is the sleek, everyday flask that slides easily into your bag, car door or desk drawer. Its double-wall stainless steel body keeps drinks cold or hot for hours. The cap doubles as a cup, and a one-touch pour spout opens and closes with a simple press of your finger. Glossy, colourful and tough enough for daily life, it’s good for work, college, travel or a day out.",
    features: [
      ["Double-wall stainless steel", "304 stainless steel inside, 201 stainless steel outside"],
      ["Keeps drinks cold or hot for hours", "vacuum insulation keeps your drinks at the right temperature"],
      ["One-touch pour spout", "opens and closes with a single press of your finger"],
      ["Screw-on lid doubles as a cup", "pour and share on the go"],
      ["Hermetic seal", "locks tight, so no leaks in your bag"],
      ["Silicone base and non-slip grip", "steady on the table, secure in your hand"],
      ["Drop-shock resistant", "built to handle everyday bumps and knocks"],
      ["Light and easy to carry", "slim shape with a handy carry loop on the cap"],
      ["BPA free", "safe for everyday use"],
      ["Gift ready", "gift wrapping and a personal note can be added at checkout"],
    ],
  },
  {
    id: "midnight-fury",
    name: "Midnight Fury",
    capacityMl: 0,
    coldHours: 0,
    hotHours: 0,
    intro: "Midnight Fury is a sleek black bottle, part of the Christmas edition.",
    features: [["Gift ready", "gift wrapping and a personal note can be added at checkout"]],
  },
];

export const bottleStyle = (id: string) => BOTTLE_STYLES.find((s) => s.id === id);

/** A bottle product: a design on one bottle style, in one or more colours. */
export const isBottle = (p: { category: string; designGroup: string }) =>
  p.category === "bottle" && BOTTLE_STYLES.some((s) => s.id === p.designGroup);

/** The cut-out bottle and the product photo for one colour (or the first colour). */
export function bottleShots(p: { images: string[]; imageColours: string[]; colours: { name: string }[] }, colour?: string) {
  const name = colour ?? p.colours[0]?.name ?? "";
  const own = p.images.filter((_, i) => !p.imageColours[i] || p.imageColours[i] === name);
  const list = own.length ? own : p.images;
  return {
    cut: list.find((s) => photoKind(s) === "cut") ?? list[0] ?? "",
    photo: list.find((s) => photoKind(s) === "photo") ?? "",
  };
}

/** The design's name without the bottle style ("He Left the 99 · Mood Mug" -> "He Left the 99"). */
export const designName = (p: { name: string; designLabel: string }) => p.designLabel.trim() || p.name.replace(/ · .*$/, "").trim();

/** Used to find the same design on other bottles: products with the same design name match. */
export const designKey = (p: { name: string; designLabel: string }) => designName(p).toLowerCase();
