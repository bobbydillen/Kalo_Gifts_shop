"use client";

import { useState, type ReactNode } from "react";
import { ProductCard } from "@/components/product/ProductCard";
import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { categoryLabels, type Category, type Product } from "@/lib/catalog";

type Filter = "all" | Category;
const order: Category[] = ["tshirt", "hoodie", "cap", "tote", "bottle", "keychain", "hamper"];

/** Product grid with category chips. Chips are offered only for categories present. */
export function Collection({
  index,
  label,
  title,
  items,
}: {
  index: number;
  label: string;
  title: ReactNode;
  items: Product[];
}) {
  const [filter, setFilter] = useState<Filter>("all");
  const filters: Filter[] = ["all", ...order.filter((c) => items.some((p) => p.category === c))];
  const shown = items.filter((p) => filter === "all" || p.category === filter);

  return (
    <section id="gifts" className="border-t border-hair bg-pine/60">
      <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:py-32">
        <Reveal>
          <p className="kicker">
            (0{index}) — {label}
          </p>
          <h2 className="mt-5 max-w-3xl text-[clamp(2.25rem,5.5vw,4.5rem)]">{title}</h2>
        </Reveal>

        <Reveal delay={100}>
          <div className="no-scrollbar -mx-4 mt-10 flex gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:flex-wrap sm:px-0">
            {filters.map((f) => (
              <button
                key={f}
                type="button"
                className="chip shrink-0"
                aria-pressed={filter === f}
                onClick={() => setFilter(f)}
              >
                {f === "all" ? "All gifts" : categoryLabels[f]}
              </button>
            ))}
          </div>
        </Reveal>

        <div className="mt-12 grid grid-cols-2 gap-x-4 gap-y-12 sm:gap-x-6 lg:grid-cols-4">
          {shown.map((product, i) => (
            <Reveal key={`${filter}-${product.slug}`} delay={(i % 4) * 80}>
              <ProductCard product={product} />
            </Reveal>
          ))}
        </div>

        <Reveal className="mt-14 text-center">
          <Button href="/gifts" variant="outline" arrow>
            View all gifts
          </Button>
        </Reveal>
      </div>
    </section>
  );
}
