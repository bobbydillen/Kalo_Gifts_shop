import type { Product } from "@/lib/catalog";
import { photoKind } from "@/lib/photo-kind";

/**
 * Verse frames: a print (a photo of kind "art", see photo-kind.ts) that the shop shows inside each
 * frame colour. The frames themselves are drawn from a mitred frame picture per finish, so any print
 * size fits. A frame colour named Pink, White or Blue uses that finish.
 */
export type FrameFinish = { name: string; texture: string };

export const FRAME_FINISHES: FrameFinish[] = [
  { name: "Pink", texture: "/catalog/frames/pink.webp" },
  { name: "White", texture: "/catalog/frames/white.webp" },
  { name: "Blue", texture: "/catalog/frames/blue.webp" },
];

/** In each finish picture the moulding is this share of the picture's width (160 of 1000 px). */
export const FRAME_SLICE = 160;

export const finishFor = (colour: string | undefined) =>
  FRAME_FINISHES.find((f) => f.name.toLowerCase() === (colour ?? "").trim().toLowerCase()) ?? FRAME_FINISHES[1];

/** The print on its own, if the product has one. */
export const frameArt = (p: Pick<Product, "images">) => p.images.find((s) => photoKind(s) === "art");

/** A ready-printed verse frame that the gallery wall can show. */
export const isVerseFrame = (p: Product) => p.category === "frame" && !p.customPhoto && Boolean(frameArt(p));

/** How wide the moulding looks next to the print: small prints get a chunkier frame. */
export const mouldingShare = (p: Pick<Product, "designGroup" | "line">) => (/a4|a3/i.test(p.designGroup) || /\bA[34]\b/.test(p.line) ? 0.13 : 0.24);
