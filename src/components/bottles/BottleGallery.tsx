"use client";

import { useState } from "react";
import { useProductColour } from "@/components/product/ProductColour";
import { bottleShots } from "@/lib/bottles";
import type { Product } from "@/lib/catalog";
import { BottleFigure } from "./BottleFigure";

/**
 * The bottle on its own lit shelf. Picking a colour (here or in the buy box) pours the new colour in.
 * The small buttons switch between the bottle and the product photo.
 */
export function BottleGallery({ product }: { product: Product }) {
  const { colour, setColour } = useProductColour();
  const [view, setView] = useState<"bottle" | "photo">("bottle");
  const shot = bottleShots(product, colour);
  const swatch = product.colours.find((c) => c.name === colour)?.hex ?? product.tint;

  return (
    <div>
      <div className="relative aspect-[4/5]">
        {/* a soft warm light behind the product, fading into the page (no box) */}
        <div aria-hidden="true" className="pointer-events-none absolute -inset-y-[8%] inset-x-0 bg-[radial-gradient(ellipse_50%_46%_at_50%_48%,rgba(255,236,200,0.16),rgba(255,236,200,0.05)_45%,transparent_70%)]" />
        {product.tag && (
          <span className="absolute left-0 top-2 z-20 rounded-full border border-hair-2 bg-night/50 px-3 py-1.5 text-[0.625rem] uppercase tracking-[0.2em] text-gold-light backdrop-blur">
            {product.tag}
          </span>
        )}
        <div className={`absolute inset-x-[14%] bottom-[2%] transition-[opacity,transform] duration-500 ${view === "bottle" ? "opacity-100" : "scale-95 opacity-0"}`}>
          <BottleFigure src={shot.cut} swatch={swatch} alt={`${product.name}${colour ? ` in ${colour}` : ""}`} priority />
        </div>
        {view === "photo" && shot.photo && (
          // eslint-disable-next-line @next/next/no-img-element -- already sized photo
          <img src={shot.photo} alt={`${product.name}, photo`} className="absolute inset-0 size-full animate-[fade-in_0.5s_ease] rounded-[28px] object-cover" />
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <div className="flex gap-3" role="group" aria-label="Views">
          {(["bottle", "photo"] as const)
            .filter((v) => v === "bottle" || shot.photo)
            .map((v) => (
              <button
                key={v}
                type="button"
                aria-pressed={view === v}
                onClick={() => setView(v)}
                className="relative size-20 overflow-hidden rounded-xl border border-hair bg-[#efe7da] transition-colors aria-pressed:border-gold"
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- small preview */}
                <img src={v === "bottle" ? shot.cut : shot.photo} alt="" className={`size-full ${v === "bottle" ? "object-contain p-1" : "object-cover"}`} />
                <span className="absolute inset-x-0 bottom-0 bg-night/70 py-0.5 text-[0.625rem] uppercase tracking-[0.18em] text-cream">{v}</span>
              </button>
            ))}
        </div>
        {product.colours.length > 1 && (
          <div className="ml-auto flex gap-2" role="group" aria-label="Colour">
            {product.colours.map((c) => (
              <button
                key={c.name}
                type="button"
                title={c.name}
                aria-label={c.name}
                aria-pressed={c.name === colour}
                onClick={() => {
                  setColour(c.name);
                  setView("bottle");
                }}
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
