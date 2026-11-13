import Link from "next/link";
import { ProductArt } from "@/components/product/ProductArt";
import { formatPrice, type Product } from "@/lib/catalog";

const labelOf = (p: Product) => p.designLabel || p.name;

/**
 * The other prints of the same item. Each design is its own product with its own photos, colours,
 * price and stock, so choosing one simply opens that product. Shows nothing for a one-design product.
 */
export function DesignPicker({ current, others }: { current: Product; others: Product[] }) {
  if (!others.length) return null;
  const designs = [current, ...others];

  return (
    <section aria-labelledby="designs-title" className="mb-8">
      <h2 id="designs-title" className="font-sans text-sm text-mist">
        Design: <span className="text-cream">{labelOf(current)}</span>
      </h2>
      <ul className="mt-3 flex flex-wrap gap-3">
        {designs.map((p) => {
          const active = p.slug === current.slug;
          return (
            <li key={p.slug}>
              <Link
                href={`/product/${p.slug}`}
                aria-current={active ? "page" : undefined}
                scroll={false}
                className={`group flex w-24 flex-col items-center gap-2 rounded-2xl border p-2 text-center transition-[border-color,transform] duration-500 ease-bounce hover:-translate-y-0.5 ${
                  active ? "border-gold-light" : "border-hair-2 hover:border-gold"
                }`}
              >
                <span
                  className="grid size-20 place-items-center overflow-hidden rounded-xl"
                  style={{ background: `color-mix(in srgb, ${p.tint} 65%, var(--color-pine-2))` }}
                >
                  {p.images[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element -- photo sizes are not known until real photos arrive
                    <img src={p.images[0]} alt="" className="size-full object-cover" />
                  ) : (
                    <ProductArt category={p.category} className="w-10 text-gold-light" />
                  )}
                </span>
                <span className="text-xs leading-tight text-mist group-aria-[current=page]:text-cream">{labelOf(p)}</span>
                <span className="text-[0.6875rem] text-faint">{formatPrice(p.price)}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
