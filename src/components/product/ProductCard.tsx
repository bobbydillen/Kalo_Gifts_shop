"use client";

import { useBag } from "@/components/bag/BagProvider";
import { ProductArt } from "@/components/product/ProductArt";
import { formatPrice, type Product } from "@/lib/catalog";

/** Product tile for grids. The drawing stands in for a photo until phase 3. */
export function ProductCard({ product }: { product: Product }) {
  const { add } = useBag();

  return (
    <article className="group">
      <div
        className="relative grid aspect-[4/5] place-items-center overflow-hidden rounded-md border border-hair transition-[border-radius,border-color] duration-700 ease-glide group-hover:rounded-[22px] group-hover:border-gold/40"
        style={{
          background: `radial-gradient(circle at 50% 42%, color-mix(in srgb, ${product.tint} 60%, transparent), var(--color-pine-2) 72%)`,
        }}
      >
        {product.tag && (
          <span className="absolute left-3 top-3 rounded-full border border-hair-2 bg-night/50 px-3 py-1.5 text-[0.625rem] uppercase tracking-[0.2em] text-gold-light backdrop-blur sm:left-4 sm:top-4">
            {product.tag}
          </span>
        )}
        <ProductArt
          category={product.category}
          className="w-[52%] text-gold-light transition-transform duration-700 ease-bounce group-hover:-translate-y-2 group-hover:scale-110"
        />
        <button
          type="button"
          onClick={() => add(product.name)}
          aria-label={`Add ${product.name} to bag`}
          className="absolute bottom-3 right-3 grid size-11 place-items-center rounded-full bg-cream text-2xl font-light leading-none text-night shadow-lg transition-[transform,background-color] duration-500 ease-bounce hover:scale-110 hover:bg-gold-light active:scale-90 sm:bottom-4 sm:right-4 sm:size-12"
        >
          +
        </button>
      </div>

      <div className="mt-4 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h3 className="text-xl leading-tight tracking-[-0.01em] sm:text-2xl">{product.name}</h3>
        <p className="shrink-0 text-gold-light">{formatPrice(product.price)}</p>
      </div>
      <p className="mt-1.5 text-sm text-mist">{product.line}</p>
      {product.colours && (
        <ul className="mt-3 flex gap-2" aria-label="Colours">
          {product.colours.map((c) => (
            <li
              key={c.name}
              title={c.name}
              className="size-4 rounded-full ring-1 ring-hair-2"
              style={{ background: c.hex }}
            >
              <span className="sr-only">{c.name}</span>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}
