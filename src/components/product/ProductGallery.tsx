"use client";

import { useState, type ReactNode } from "react";

/**
 * The product pictures: one large photo with a row of small ones underneath to switch between.
 * With a single photo (or none) it shows just the large picture; `fallback` is the line drawing.
 */
export function ProductGallery({
  images,
  name,
  tint,
  tag,
  fallback,
}: {
  images: string[];
  name: string;
  tint: string;
  tag?: string;
  fallback: ReactNode;
}) {
  const [index, setIndex] = useState(0);
  const current = Math.min(index, Math.max(images.length - 1, 0));
  const go = (n: number) => setIndex((n + images.length) % images.length);

  return (
    <div>
      <div
        className="relative grid aspect-[4/5] place-items-center overflow-hidden rounded-[28px] border border-hair"
        style={{
          background: `radial-gradient(circle at 50% 42%, color-mix(in srgb, ${tint} 65%, transparent), var(--color-pine-2) 72%)`,
        }}
      >
        {tag && (
          <span className="absolute left-5 top-5 z-10 rounded-full border border-hair-2 bg-night/50 px-3 py-1.5 text-[0.625rem] uppercase tracking-[0.2em] text-gold-light backdrop-blur">
            {tag}
          </span>
        )}
        {images.length > 0 ? (
          // eslint-disable-next-line @next/next/no-img-element -- photo sizes are not known until real photos arrive
          <img src={images[current]} alt={`${name}, photo ${current + 1} of ${images.length}`} className="size-full object-cover" />
        ) : (
          fallback
        )}

        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => go(current - 1)}
              aria-label="Previous photo"
              className="absolute left-3 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-full border border-hair-2 bg-night/50 text-cream backdrop-blur transition-colors hover:border-gold"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={() => go(current + 1)}
              aria-label="Next photo"
              className="absolute right-3 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-full border border-hair-2 bg-night/50 text-cream backdrop-blur transition-colors hover:border-gold"
            >
              ›
            </button>
          </>
        )}
      </div>

      {images.length > 1 && (
        <ul className="mt-4 grid grid-cols-5 gap-3">
          {images.map((src, i) => (
            <li key={src}>
              <button
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Show photo ${i + 1}`}
                aria-current={i === current}
                className={`block aspect-square w-full overflow-hidden rounded-xl border transition-colors ${
                  i === current ? "border-gold" : "border-hair opacity-70 hover:opacity-100"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- see above */}
                <img src={src} alt="" className="size-full object-cover" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
