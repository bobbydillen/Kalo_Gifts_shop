import Link from "next/link";
import type { ReactNode } from "react";
import { ProductCard } from "@/components/product/ProductCard";
import { Reveal } from "@/components/ui/Reveal";
import { Rise } from "@/components/ui/Rise";
import { categories, createCatalog, type Product } from "@/lib/catalog";
import { getProducts } from "@/lib/catalog-data";

/**
 * Shared layout for /gifts and /gifts/<category>: a heading, category chips
 * that link between the pages, and the product grid.
 */
export async function CataloguePage({
  kicker,
  title,
  intro,
  items,
  active,
}: {
  kicker: string;
  title: ReactNode;
  intro: string;
  items: Product[];
  active: string | null; // category slug, or null for "all"
}) {
  const { productsIn } = createCatalog(await getProducts());
  const chips = [
    { label: "All gifts", href: "/gifts", slug: null as string | null },
    ...categories
      .filter((c) => productsIn(c.id).length > 0)
      .map((c) => ({ label: c.label, href: `/gifts/${c.slug}`, slug: c.slug as string | null })),
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 pb-24 pt-14 sm:px-6 lg:pb-32 lg:pt-20">
      <Rise>
        <p className="kicker">{kicker}</p>
        <h1 className="mt-5 max-w-4xl text-[clamp(2.75rem,7vw,6rem)]">{title}</h1>
        <p className="mt-6 max-w-xl text-lg text-mist">{intro}</p>
      </Rise>

      <Rise delay={120}>
        <nav
          aria-label="Categories"
          className="no-scrollbar -mx-4 mt-10 flex gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:flex-wrap sm:px-0"
        >
          {chips.map((chip) => (
            <Link
              key={chip.href}
              href={chip.href}
              aria-current={chip.slug === active ? "page" : undefined}
              className="chip shrink-0 aria-[current=page]:border-cream aria-[current=page]:bg-cream aria-[current=page]:text-night"
            >
              {chip.label}
            </Link>
          ))}
        </nav>
      </Rise>

      <p className="mt-10 text-sm text-faint">
        {items.length} {items.length === 1 ? "piece" : "pieces"}
      </p>

      {items.length === 0 && (
        <div className="mt-6 rounded-2xl border border-dashed border-hair-2 px-6 py-14 text-center">
          <p className="font-serif text-3xl">
            Coming <em>soon</em>
          </p>
          <p className="mx-auto mt-3 max-w-md text-mist">We are getting this collection ready. Have a look at everything else in the meantime.</p>
          <Link href="/gifts" className="btn btn-outline mt-6">
            See all gifts
          </Link>
        </div>
      )}

      <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-12 sm:gap-x-6 lg:grid-cols-4">
        {items.map((product, i) => (
          <Reveal key={product.slug} delay={(i % 4) * 80}>
            <ProductCard product={product} />
          </Reveal>
        ))}
      </div>
    </div>
  );
}
