"use client";

import { useState } from "react";
import { useProductColour } from "@/components/product/ProductColour";
import type { Product } from "@/lib/catalog";
import { frameArt, mouldingShare } from "@/lib/frames";
import { FramedPrint } from "./FramedPrint";
import { studioBackground } from "@/lib/studio";

/**
 * A verse frame on its product page: hanging on a lit wall in the colour picked (here or in the buy
 * box), or "in a room" next to a sofa, sized to scale, so the print's real size is easy to picture.
 */
export function FrameGallery({ product }: { product: Product }) {
  const { colour, setColour } = useProductColour();
  const [view, setView] = useState<"wall" | "room">("wall");
  const art = frameArt(product) ?? product.images[0];
  const share = mouldingShare(product);
  const big = share < 0.2; // A4 and up
  const alt = `${product.name} in a ${colour?.toLowerCase() ?? ""} frame`;

  return (
    <div>
      <div
        className={`relative aspect-[4/5] ${view === "room" ? "overflow-hidden rounded-[28px] border border-hair" : ""}`}
        style={view === "room" ? { background: studioBackground() } : undefined}
      >
        {view === "wall" ? (
          <>
            {/* the framed print on its own, with a soft warm light behind it (no box) */}
            <div aria-hidden="true" className="pointer-events-none absolute -inset-y-[8%] inset-x-0 bg-[radial-gradient(ellipse_50%_46%_at_50%_48%,rgba(255,236,200,0.16),rgba(255,236,200,0.05)_45%,transparent_70%)]" />
            <div className="absolute inset-x-[10%] top-[4%]">
              <span className="relative block animate-[frame-settle_2.4s_ease-out]" style={{ transformOrigin: "50% 0%" }}>
                <FramedPrint art={art} colour={colour} share={share} alt={alt} eager />
              </span>
            </div>
          </>
        ) : (
          <Room art={art} colour={colour} share={share} big={big} alt={alt} />
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <div className="flex rounded-full border border-hair-2 p-1 text-xs" role="radiogroup" aria-label="View">
          {(
            [
              ["wall", "The frame"],
              ["room", "In a room"],
            ] as const
          ).map(([v, label]) => (
            <button
              key={v}
              type="button"
              role="radio"
              aria-checked={view === v}
              onClick={() => setView(v)}
              className="rounded-full px-3.5 py-1.5 text-mist transition-colors aria-checked:bg-cream aria-checked:text-night"
            >
              {label}
            </button>
          ))}
        </div>
        {product.colours.length > 1 && (
          <div className="ml-auto flex gap-2" role="group" aria-label="Frame colour">
            {product.colours.map((c) => (
              <button
                key={c.name}
                type="button"
                title={c.name}
                aria-label={`${c.name} frame`}
                aria-pressed={c.name === colour}
                onClick={() => setColour(c.name)}
                className="size-7 rounded-full ring-1 ring-hair-2 transition-transform aria-pressed:scale-110 aria-pressed:ring-2 aria-pressed:ring-gold-light"
                style={{ background: c.hex }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/** A simple living-room wall with a sofa, so the frame is seen at its real size. */
function Room({ art, colour, share, big, alt }: { art: string; colour: string | undefined; share: number; big: boolean; alt: string }) {
  return (
    <div className="absolute inset-0 bg-[linear-gradient(180deg,#e9e1d2,#ddd2bf_68%,#b99a72_68%,#9c7d58)]">
      <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(ellipse_50%_45%_at_50%_20%,rgba(255,255,255,0.5),transparent_70%)]" />
      {/* the frame, to scale: a sofa back is about 85 cm high and 200 cm wide */}
      <div className={`absolute left-1/2 -translate-x-1/2 ${big ? "top-[22%] w-[11.5%]" : "top-[27%] w-[7%]"}`}>
        <FramedPrint art={art} colour={colour} share={share} alt={alt} />
      </div>
      <svg aria-hidden="true" viewBox="0 0 400 140" className="absolute bottom-[26%] left-1/2 w-[86%] -translate-x-1/2">
        <rect x="18" y="20" width="364" height="70" rx="18" fill="#4f6b5c" />
        <rect x="0" y="54" width="54" height="70" rx="16" fill="#46604f" />
        <rect x="346" y="54" width="54" height="70" rx="16" fill="#46604f" />
        <rect x="40" y="72" width="320" height="44" rx="10" fill="#5a786a" />
        <rect x="40" y="114" width="8" height="22" fill="#3a2a1a" />
        <rect x="352" y="114" width="8" height="22" fill="#3a2a1a" />
        <ellipse cx="110" cy="62" rx="34" ry="20" fill="#d8b97f" />
        <ellipse cx="290" cy="62" rx="34" ry="20" fill="#c7a0a0" />
      </svg>
      <p className="absolute inset-x-0 bottom-4 text-center text-xs text-[#5a4a35]">Shown to scale above a three-seater sofa</p>
    </div>
  );
}
