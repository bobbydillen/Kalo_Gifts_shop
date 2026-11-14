"use client";

import { useState } from "react";
import { ProductArt } from "@/components/product/ProductArt";
import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { useCatalog } from "@/components/catalog/CatalogProvider";
import { formatPrice } from "@/lib/catalog";

/** Featured hampers: the hamper on one side, what is inside it on the other. */
export function Hampers({ index }: { index: number }) {
  const catalog = useCatalog();
  const hampers = catalog.hampers();
  const [active, setActive] = useState(0);
  const hamper = hampers[active] ?? hampers[0];
  if (!hamper) return null; // no hampers in the catalogue
  const inside = catalog.hamperContents(hamper);
  const separately = inside.reduce((sum, p) => sum + p.price, 0);

  return (
    <section id="hampers" className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:py-32">
      <Reveal>
        <p className="kicker">(0{index}) — Gift hampers</p>
        <h2 className="mt-5 max-w-3xl text-[clamp(2.25rem,5.5vw,4.5rem)]">
          Chosen, wrapped and <em>ready</em> to give
        </h2>
      </Reveal>

      <Reveal delay={100}>
        <div className="mt-10 flex flex-wrap gap-3">
          {hampers.map((h, i) => (
            <button
              key={h.slug}
              type="button"
              className="chip"
              aria-pressed={active === i}
              onClick={() => setActive(i)}
            >
              {h.name}
            </button>
          ))}
        </div>
      </Reveal>

      <Reveal delay={130}>
        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-gold/40 bg-pine px-6 py-5">
          <p className="font-serif text-2xl">
            Rather <em>choose</em> your own?
          </p>
          <Button href="/hampers/build" arrow>
            Build your own hamper
          </Button>
        </div>
      </Reveal>

      <Reveal delay={160}>
        <div className="mt-8 grid gap-5 lg:grid-cols-[1.1fr_1fr]">
          <div
            key={hamper.slug}
            className="toast-pop relative grid min-h-[20rem] place-items-center overflow-hidden rounded-[28px] border border-hair p-8 lg:min-h-[32rem]"
            style={{
              background: `radial-gradient(circle at 50% 45%, color-mix(in srgb, ${hamper.tint} 70%, transparent), var(--color-pine) 70%)`,
            }}
          >
            <span className="absolute left-6 top-6 rounded-full border border-hair-2 bg-night/50 px-3 py-1.5 text-[0.625rem] uppercase tracking-[0.2em] text-gold-light backdrop-blur">
              {inside.length} gifts inside
            </span>
            <ProductArt category="hamper" className="w-[min(60%,18rem)] text-gold-light" />
          </div>

          <div className="flex flex-col rounded-[28px] border border-hair bg-pine p-7 sm:p-9">
            <h3 className="text-[clamp(2rem,3.4vw,3rem)]">{hamper.name}</h3>
            <p className="mt-3 text-mist">{hamper.line}</p>

            <ul key={hamper.slug} className="mt-7 flex-1 divide-y divide-hair border-y border-hair">
              {inside.map((item, i) => (
                <li
                  key={item.slug}
                  className="toast-pop flex items-center gap-4 py-4"
                  style={{ animationDelay: `${i * 90}ms` }}
                >
                  <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-pine-2">
                    <ProductArt category={item.category} className="w-8 text-gold-light" />
                  </span>
                  <span className="flex-1">
                    <span className="block font-serif text-xl leading-tight">{item.name}</span>
                    <span className="block text-sm text-faint">{item.line}</span>
                  </span>
                  <span className="text-sm text-mist">{formatPrice(item.price)}</span>
                </li>
              ))}
            </ul>

            <div className="mt-7 flex flex-wrap items-end justify-between gap-5">
              <p>
                <span className="block font-serif text-4xl text-gold-light">
                  {formatPrice(hamper.price)}
                </span>
                {separately > hamper.price && (
                  <span className="text-sm text-faint">
                    {formatPrice(separately)} if bought one by one
                  </span>
                )}
              </p>
              <Button arrow href={`/product/${hamper.slug}`}>
                View hamper
              </Button>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
