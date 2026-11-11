"use client";

import Link from "next/link";
import { useRef } from "react";
import { ProductArt } from "@/components/product/ProductArt";
import { Reveal } from "@/components/ui/Reveal";
import type { Category } from "@/lib/catalog";

const cards: { title: string; line: string; pill: string; glow: string; art: Category }[] = [
  { title: "Family", line: "For the people who feel like home.", pill: "Matching sets", glow: "#a3282a", art: "hoodie" },
  { title: "Friends", line: "For the ones who always show up.", pill: "Little thank-yous", glow: "#a8823f", art: "tshirt" },
  { title: "Church", line: "For the community that carries you.", pill: "Give together", glow: "#1b4436", art: "tote" },
  { title: "Secret Santa", line: "For a small surprise, well chosen.", pill: "Easy on the pocket", glow: "#c23a36", art: "keychain" },
];

/** "Gifts for every loved one": a row of large cards that scrolls sideways. */
export function LovedOnes({ index }: { index: number }) {
  const row = useRef<HTMLDivElement>(null);
  const scroll = (direction: 1 | -1) => {
    const el = row.current;
    if (el) el.scrollBy({ left: direction * Math.min(el.clientWidth * 0.8, 560), behavior: "smooth" });
  };

  return (
    <section id="loved-ones" className="overflow-hidden border-t border-hair py-24 lg:py-32">
      <div className="mx-auto flex max-w-7xl flex-wrap items-end justify-between gap-6 px-4 sm:px-6">
        <Reveal>
          <p className="kicker">(0{index}) — Gifts for every loved one</p>
          <h2 className="mt-5 max-w-3xl text-[clamp(2.25rem,5.5vw,4.5rem)]">
            Someone came to <em>mind</em>. Start there.
          </h2>
        </Reveal>
        <div className="flex gap-3">
          {([-1, 1] as const).map((direction) => (
            <button
              key={direction}
              type="button"
              onClick={() => scroll(direction)}
              aria-label={direction === 1 ? "Next" : "Previous"}
              className="grid size-12 place-items-center rounded-full border border-hair-2 text-lg transition-[transform,border-color,color] duration-500 ease-bounce hover:border-gold hover:text-gold-light active:scale-90"
            >
              {direction === 1 ? "→" : "←"}
            </button>
          ))}
        </div>
      </div>

      <Reveal delay={120}>
        <div
          ref={row}
          className="no-scrollbar mt-12 flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-px-4 px-4 pb-4 sm:scroll-px-6 sm:px-6 lg:scroll-px-[max(1.5rem,calc((100vw-80rem)/2+1.5rem))] lg:px-[max(1.5rem,calc((100vw-80rem)/2+1.5rem))]"
        >
          {cards.map((card, i) => (
            <Link
              key={card.title}
              href="#gifts"
              className="group relative flex h-[min(66vh,34rem)] w-[min(78vw,26rem)] shrink-0 snap-start flex-col justify-between overflow-hidden rounded-[26px] border border-hair bg-pine p-7 transition-[transform,border-color] duration-700 ease-bounce hover:-translate-y-2 hover:border-gold/50 active:scale-[0.98]"
            >
              <span
                aria-hidden="true"
                className="absolute inset-0 opacity-70 transition-[opacity,transform] duration-1000 ease-glide group-hover:scale-125 group-hover:opacity-100"
                style={{ background: `radial-gradient(circle at 50% 42%, ${card.glow}, transparent 60%)` }}
              />
              <span className="relative flex items-start justify-between">
                <span className="rounded-full border border-hair-2 bg-night/40 px-3 py-1.5 text-[0.6875rem] uppercase tracking-[0.2em] text-gold-light backdrop-blur">
                  {card.pill}
                </span>
                <span className="text-xs tracking-[0.2em] text-faint">0{i + 1}</span>
              </span>

              <ProductArt
                category={card.art}
                className="relative mx-auto w-[46%] text-gold-light transition-transform duration-700 ease-bounce group-hover:-translate-y-2 group-hover:rotate-[-4deg] group-hover:scale-110"
              />

              <span className="relative">
                <span className="block font-serif text-[clamp(2.25rem,4vw,3.25rem)] leading-none">
                  {card.title}
                </span>
                <span className="mt-3 block text-mist">{card.line}</span>
                <span className="mt-5 flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-gold-light">
                  Explore
                  <span
                    aria-hidden="true"
                    className="transition-transform duration-500 ease-bounce group-hover:translate-x-1.5"
                  >
                    →
                  </span>
                </span>
              </span>
            </Link>
          ))}
        </div>
      </Reveal>
    </section>
  );
}
