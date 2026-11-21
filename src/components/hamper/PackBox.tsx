"use client";

import { useEffect, useRef, type Ref } from "react";
import { FramedPrint } from "@/components/frames/FramedPrint";
import { ProductArt } from "@/components/product/ProductArt";
import { bottleShots } from "@/lib/bottles";
import { frameArt, mouldingShare } from "@/lib/frames";
import { photosFor, type Product } from "@/lib/catalog";
import { isCutout, photoKind } from "@/lib/photo-kind";

/** What one gift looks like inside the box: a cut-out photo, a framed print, the customer's photo or a drawing. */
export type BoxPicture =
  | { kind: "img"; src: string; cut: boolean }
  | { kind: "frame"; art: string; colour: string | undefined; share: number }
  | { kind: "art"; category: Product["category"] };

export function boxPicture(product: Product, colour?: string, photoThumb?: string): BoxPicture {
  if (product.category === "frame") {
    const art = frameArt(product);
    if (art) return { kind: "frame", art, colour, share: mouldingShare(product) };
    if (photoThumb) return { kind: "img", src: photoThumb, cut: false };
  }
  if (product.category === "bottle") {
    const { cut } = bottleShots(product, colour);
    if (cut) return { kind: "img", src: cut, cut: isCutout(cut) };
  }
  if (product.category === "tshirt" || product.category === "hoodie") {
    const front = product.images.find((s) => photoKind(s) === "cut-front") ?? product.images.find((s) => photoKind(s) === "cut-back");
    if (front) return { kind: "img", src: front, cut: true };
  }
  const own = photosFor(product, colour);
  const pick = own.find(isCutout) ?? own[0];
  return pick ? { kind: "img", src: pick, cut: isCutout(pick) } : { kind: "art", category: product.category };
}

export type BoxItem = { key: string; picture: BoxPicture; label: string };

/** Where each gift stands: one row for a few, two rows (the back row higher and smaller) for more. */
function layout(n: number) {
  const rows = n > 4 ? [Math.ceil(n / 2), Math.floor(n / 2)] : [n];
  const width = n <= 2 ? 36 : n === 3 ? 31 : n === 4 ? 27 : 23;
  const spots: { left: number; width: number; bottom: number; z: number; tilt: number }[] = [];
  rows.forEach((count, r) => {
    const back = rows.length === 2 && r === 0;
    const w = back ? width * 0.88 : width;
    const from = 9 + w / 2;
    const to = 91 - w / 2;
    for (let i = 0; i < count; i++) {
      const center = count === 1 ? 50 : from + ((to - from) * i) / (count - 1);
      spots.push({
        left: center - w / 2,
        width: w,
        bottom: back ? 52 : 44,
        z: back ? 1 : 2,
        tilt: (i % 2 === 0 ? -1 : 1) * (3 + ((i * 7) % 4)),
      });
    }
  });
  return spots;
}

function Picture({ picture, label }: { picture: BoxPicture; label: string }) {
  if (picture.kind === "frame") {
    return (
      <span className="block w-[86%]">
        <FramedPrint art={picture.art} colour={picture.colour} share={picture.share} alt={label} />
      </span>
    );
  }
  if (picture.kind === "art") return <ProductArt category={picture.category} className="w-2/3 text-gold-light" />;
  return (
    // eslint-disable-next-line @next/next/no-img-element -- small product pictures already sized
    <img
      src={picture.src}
      alt={label}
      draggable={false}
      className={`block max-h-full w-full select-none object-contain object-bottom ${picture.cut ? "drop-shadow-[0_10px_12px_rgba(0,0,0,0.45)]" : "rounded-md shadow-[0_10px_18px_-6px_rgba(0,0,0,0.6)]"}`}
    />
  );
}

/**
 * The open gift box on the "Build your own hamper" page. Gifts drop in and settle in the tissue as
 * they are added; `closing` lowers the lid and ties the bow. Drawn with plain boxes and gradients so
 * it scales from the small box in the phone's top bar to the large one beside the list.
 */
export function PackBox({ items, closing, small, boxRef }: { items: BoxItem[]; closing?: boolean; small?: boolean; boxRef?: Ref<HTMLDivElement> }) {
  const body = useRef<HTMLDivElement>(null);
  const count = items.length;
  const last = useRef(count);

  // a little bump when a gift lands (after it has flown across)
  useEffect(() => {
    const grew = count > last.current;
    last.current = count;
    if (!grew || !body.current || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    body.current.animate(
      [{ transform: "scale(1)" }, { transform: "scale(1.035, 0.97)" }, { transform: "scale(0.99, 1.01)" }, { transform: "scale(1)" }],
      { duration: 450, delay: 560, easing: "ease-out" },
    );
  }, [count]);

  const spots = layout(Math.min(count, 8));
  const shown = items.slice(0, 8);

  return (
    <div ref={boxRef} className="relative aspect-[5/4] w-full select-none" aria-hidden={small ? true : undefined}>
      {/* soft light under the box */}
      <div className="absolute inset-x-[2%] bottom-[-4%] h-[14%] rounded-[50%] bg-black/50 blur-md" />

      <div ref={body} className="absolute inset-0 origin-bottom">
        {/* the far wall, seen through the open top */}
        <div className="absolute inset-x-[8%] top-[30%] h-[16%] rounded-t-[6%] bg-gradient-to-b from-[#0a1d16] to-[#123528]" />
        {/* tissue paper puffing over the rim */}
        <svg
          viewBox="0 0 100 20"
          preserveAspectRatio="none"
          className={`absolute inset-x-[6%] top-[33%] h-[13%] w-[88%] transition-opacity duration-300 ${closing ? "opacity-0" : ""}`}
        >
          <path d="M0 20 L0 11 Q6 2 13 9 Q19 0 27 8 Q34 1 41 9 Q48 0 56 8 Q63 2 70 9 Q77 1 85 8 Q92 2 100 10 L100 20 Z" fill="#efe4cf" opacity="0.92" />
          <path d="M0 20 L0 14 Q8 8 16 13 Q24 6 33 12 Q42 7 50 13 Q58 6 67 12 Q75 7 84 13 Q92 8 100 14 L100 20 Z" fill="#d9c7a6" opacity="0.9" />
        </svg>

        {/* the gifts */}
        {shown.map((item, i) => {
          const s = spots[i];
          return (
            <div
              key={item.key}
              className={`absolute flex aspect-[3/4] items-end justify-center transition-[left,width,bottom,transform,opacity] duration-700 ease-glide ${
                closing ? "translate-y-[35%] opacity-0" : ""
              }`}
              style={{ left: `${s.left}%`, width: `${s.width}%`, bottom: `${s.bottom}%`, zIndex: s.z }}
            >
              <div
                className="flex size-full items-end justify-center motion-safe:animate-[box-drop_0.65s_var(--ease-glide)_0.5s_both]"
                style={{ ["--tilt" as string]: `${s.tilt}deg`, transform: `rotate(${s.tilt}deg)` }}
              >
                <Picture picture={item.picture} label={item.label} />
              </div>
            </div>
          );
        })}
        {count > 8 && (
          <span className="absolute right-[9%] top-[30%] z-[3] rounded-full bg-gold px-2 py-0.5 text-[0.65rem] font-medium text-night">+{count - 8}</span>
        )}

        {/* the front of the box, with the ribbon and a tag */}
        <div className="absolute inset-x-[6%] bottom-0 top-[44%] z-[4] overflow-hidden rounded-b-[5%] rounded-t-[2%] border border-gold/25 bg-gradient-to-b from-[#1f5240] via-[#17402f] to-[#0f2c21] shadow-[inset_0_10px_18px_-10px_rgba(0,0,0,0.6)]">
          <div className="absolute inset-y-0 left-1/2 w-[9%] -translate-x-1/2 bg-gradient-to-r from-[#a8823f] via-[#e8cf92] to-[#a8823f] opacity-95" />
          {!small && (
            <span className="absolute bottom-[14%] left-[60%] rotate-[-6deg] rounded-sm bg-cream px-[0.6em] py-[0.25em] font-serif text-sm italic text-night shadow-md">
              KALO
            </span>
          )}
        </div>

        {/* the lid: lifted and leaning while open, lowered on the box when packing */}
        <div
          className={`absolute inset-x-[3.5%] top-[37%] h-[11%] origin-bottom-left rounded-[4%] border border-gold/30 bg-gradient-to-b from-[#2a6650] to-[#1a4535] shadow-[0_8px_16px_-6px_rgba(0,0,0,0.7)] transition-transform duration-700 ${
            closing ? "z-[5] translate-x-0 translate-y-0 rotate-0 ease-bounce" : "z-0 -translate-x-[4%] -translate-y-[175%] -rotate-[7deg] ease-glide"
          } ${small && !closing ? "opacity-0" : ""}`}
        >
          <div className="absolute inset-y-0 left-1/2 w-[9%] -translate-x-1/2 bg-gradient-to-r from-[#a8823f] via-[#e8cf92] to-[#a8823f]" />
          {closing && (
            <svg viewBox="0 0 60 30" className="absolute bottom-[55%] left-1/2 w-[30%] origin-bottom animate-[bow-pop_0.55s_var(--ease-bounce)_0.55s_both]">
              <path d="M30 22 C18 4 2 6 6 18 C9 26 22 24 30 22 Z" fill="#d9b56a" stroke="#a8823f" strokeWidth="1.2" />
              <path d="M30 22 C42 4 58 6 54 18 C51 26 38 24 30 22 Z" fill="#d9b56a" stroke="#a8823f" strokeWidth="1.2" />
              <path d="M27 22 L22 30 M33 22 L38 30" stroke="#c39a4f" strokeWidth="3" strokeLinecap="round" />
              <circle cx="30" cy="21" r="4" fill="#e8cf92" stroke="#a8823f" strokeWidth="1" />
            </svg>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Flies a copy of a gift's picture from where it was tapped into the box, along a small arc.
 * Skipped for visitors who prefer less motion.
 */
export function flyToBox(from: DOMRect | null, to: HTMLElement | null, src: string | null) {
  if (!from || !to || !src || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const target = to.getBoundingClientRect();
  if (target.width === 0) return;
  const size = Math.min(from.width, from.height, 220);
  const img = document.createElement("img");
  img.src = src;
  img.alt = "";
  img.style.cssText = `position:fixed;left:${from.left + (from.width - size) / 2}px;top:${from.top + (from.height - size) / 2}px;width:${size}px;height:${size}px;object-fit:contain;z-index:60;pointer-events:none;filter:drop-shadow(0 14px 18px rgba(0,0,0,.5))`;
  document.body.appendChild(img);
  const sx = from.left + from.width / 2;
  const sy = from.top + from.height / 2;
  const tx = target.left + target.width / 2 - sx;
  const ty = target.top + target.height * 0.42 - sy;
  const end = Math.max(0.12, (target.width * 0.3) / size);
  const lift = Math.min(160, Math.abs(tx) * 0.35 + 60);
  img
    .animate(
      [
        { transform: "translate(0,0) scale(1) rotate(0deg)", opacity: 1 },
        { transform: `translate(${tx * 0.5}px, ${ty * 0.5 - lift}px) scale(${(1 + end) / 2}) rotate(-8deg)`, opacity: 1, offset: 0.55 },
        { transform: `translate(${tx}px, ${ty}px) scale(${end}) rotate(4deg)`, opacity: 0.2 },
      ],
      { duration: 650, easing: "cubic-bezier(0.45, 0, 0.25, 1)" },
    )
    .finished.finally(() => img.remove());
}
