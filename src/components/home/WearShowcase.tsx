import { ProductCard } from "@/components/product/ProductCard";
import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { DropRail } from "@/components/wear/DropRail";
import type { Product } from "@/lib/catalog";

/** The wear drop on the home page: every tee and hoodie hanging on the brass rail. */
export function WearShowcase({ index, items }: { index: number; items: Product[] }) {
  if (items.length === 0) return null;
  return (
    <section id="wear" className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:py-32">
      <Reveal>
        <p className="kicker">(0{index}) — KALO Wear</p>
        <div className="mt-5 flex flex-wrap items-end justify-between gap-6">
          <h2 className="max-w-3xl text-[clamp(2.25rem,5.5vw,4.5rem)]">
            Wear the <em>Word</em>
          </h2>
          <Button href="/gifts/t-shirts" variant="outline" arrow>
            See all wear
          </Button>
        </div>
      </Reveal>
      <div className="mt-10">
        <DropRail
          products={items}
          grid={
            <div className="grid grid-cols-2 gap-x-4 gap-y-12 sm:gap-x-6 lg:grid-cols-4">
              {items.map((p) => (
                <ProductCard key={p.slug} product={p} />
              ))}
            </div>
          }
        />
      </div>
    </section>
  );
}
