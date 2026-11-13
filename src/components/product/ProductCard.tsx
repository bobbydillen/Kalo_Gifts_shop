"use client";

import Link from "next/link";
import { useBag } from "@/components/bag/BagProvider";
import { ProductArt } from "@/components/product/ProductArt";
import { formatPrice, fromPrice, type Product } from "@/lib/catalog";

/**
 * Product tile for grids. The whole tile opens the product page.
 * The round button adds straight to the bag when there is nothing to choose;
 * when the product has sizes or colours it goes to the product page instead.
 */
export function ProductCard({ product }: { product: Product }) {
  const { add } = useBag();
  const href = `/product/${product.slug}`;
  const hasOptions = product.sizes.length > 0 || product.colours.length > 0;
  const round =
    "absolute bottom-3 right-3 z-10 grid size-11 place-items-center rounded-full bg-cream text-2xl font-light leading-none text-night shadow-lg transition-[transform,background-color] duration-500 ease-bounce hover:scale-110 hover:bg-gold-light active:scale-90 sm:bottom-4 sm:right-4 sm:size-12";

  return (
    <article className="group relative">
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
        {product.images[0] ? (
          // eslint-disable-next-line @next/next/no-img-element -- photo sizes are not known until real photos arrive
          <img
            src={product.images[0]}
            alt=""
            loading="lazy"
            className="size-full object-cover transition-transform duration-1000 ease-glide group-hover:scale-105"
          />
        ) : (
          <ProductArt
            category={product.category}
            className="w-[52%] text-gold-light transition-transform duration-700 ease-bounce group-hover:-translate-y-2 group-hover:scale-110"
          />
        )}
        {hasOptions ? (
          <Link href={href} aria-label={`Choose options for ${product.name}`} className={`${round} text-lg`}>
            →
          </Link>
        ) : (
          <button
            type="button"
            onClick={() => add({ slug: product.slug })}
            aria-label={`Add ${product.name} to bag`}
            className={round}
          >
            +
          </button>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h3 className="text-xl leading-tight tracking-[-0.01em] sm:text-2xl">
          {/* the link's ::after covers the tile, so the whole tile is clickable */}
          <Link href={href} className="after:absolute after:inset-0 hover:text-gold-light">
            {product.name}
          </Link>
        </h3>
        <p className="shrink-0 text-gold-light">
          {fromPrice(product).from && <span className="mr-1 text-xs text-faint">From</span>}
          {formatPrice(fromPrice(product).price)}
        </p>
      </div>
      <p className="mt-1.5 text-sm text-mist">{product.line}</p>
      {product.colours.length > 0 && (
        <ul className="mt-3 flex gap-2" aria-label="Colours">
          {product.colours.map((c) => (
            <li key={c.name} className="size-4 rounded-full ring-1 ring-hair-2" style={{ background: c.hex }}>
              <span className="sr-only">{c.name}</span>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}
