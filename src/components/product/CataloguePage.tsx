import Link from "next/link";
import type { ReactNode } from "react";
import { ProductCard } from "@/components/product/ProductCard";
import { Reveal } from "@/components/ui/Reveal";
import { Rise } from "@/components/ui/Rise";
import { categories, createCatalog, type Product } from "@/lib/catalog";
import { getProducts } from "@/lib/catalog-data";
import { DropRail } from "@/components/wear/DropRail";
import { BottleBar } from "@/components/bottles/BottleBar";
import { FrameBar } from "@/components/frames/FrameBar";
import { isVerseFrame } from "@/lib/frames";
import { isGarment } from "@/lib/garment";
import { isBottle } from "@/lib/bottles";

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
  about,
  rail,
  bottles,
  frames,
  showrooms,
}: {
  kicker: string;
  title: ReactNode;
  intro: string;
  items: Product[];
  active: string | null; // category slug, or null for "all"
  /** Optional paragraph under the products. */
  about?: { heading: string; text: string };
  /** Wear shown hanging on the rail (with a switch to the plain grid). */
  rail?: Product[];
  /** Bottles shown on the shelves of the Bottle Bar (with a switch to the plain grid). */
  bottles?: Product[];
  /** Frames shown on the gallery wall (verse prints), with the rest in a grid under it. */
  frames?: boolean;
  /** All gifts: the wear rail first, then the bottle shelves, the gallery wall, and everything else. */
  showrooms?: boolean;
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

      {showrooms ? (
        <Showrooms items={items} />
      ) : frames && items.some(isVerseFrame) ? (
        <div className="mt-12">
          <FrameBar
            frames={items.filter(isVerseFrame)}
            grid={
              <div className="grid grid-cols-2 gap-x-4 gap-y-12 sm:gap-x-6 lg:grid-cols-4">
                {items.map((product, i) => (
                  <Reveal key={product.slug} delay={(i % 4) * 80}>
                    <ProductCard product={product} />
                  </Reveal>
                ))}
              </div>
            }
            extra={
              items.some((p) => !isVerseFrame(p)) && (
                <div className="mt-16">
                  <h2 className="text-[clamp(1.75rem,4vw,2.5rem)]">
                    Frame your own <em>photo</em>
                  </h2>
                  <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-12 sm:gap-x-6 lg:grid-cols-4">
                    {items
                      .filter((p) => !isVerseFrame(p))
                      .map((product) => (
                        <ProductCard key={product.slug} product={product} />
                      ))}
                  </div>
                </div>
              )
            }
          />
        </div>
      ) : bottles && bottles.length > 0 ? (
        <div className="mt-12">
          <BottleBar
            products={bottles}
            grid={
              <div className="grid grid-cols-2 gap-x-4 gap-y-12 sm:gap-x-6 lg:grid-cols-4">
                {bottles.map((product, i) => (
                  <Reveal key={product.slug} delay={(i % 4) * 80}>
                    <ProductCard product={product} />
                  </Reveal>
                ))}
              </div>
            }
          />
        </div>
      ) : rail && rail.length > 0 ? (
        <div className="mt-12">
          <DropRail
            products={rail}
            grid={
      <div className="grid grid-cols-2 gap-x-4 gap-y-12 sm:gap-x-6 lg:grid-cols-4">
        {items.map((product, i) => (
          <Reveal key={product.slug} delay={(i % 4) * 80}>
            <ProductCard product={product} />
          </Reveal>
        ))}
      </div>

            }
          />
        </div>
      ) : (
        <>
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

        </>
      )}

      {about && (
        <section className="mt-20 max-w-3xl border-t border-hair pt-10">
          <h2 className="text-2xl">{about.heading}</h2>
          <p className="mt-4 text-mist">{about.text}</p>
        </section>
      )}
    </div>
  );
}

const cardGrid = (list: Product[]) => (
  <div className="grid grid-cols-2 gap-x-4 gap-y-12 sm:gap-x-6 lg:grid-cols-4">
    {list.map((product, i) => (
      <Reveal key={product.slug} delay={(i % 4) * 80}>
        <ProductCard product={product} />
      </Reveal>
    ))}
  </div>
);

/** The All gifts page: each kind of product in its own showroom, one after another. */
function Showrooms({ items }: { items: Product[] }) {
  const wear = items.filter(isGarment);
  const bottles = items.filter(isBottle);
  const verseFrames = items.filter(isVerseFrame);
  const shown = new Set([...wear, ...bottles, ...verseFrames].map((p) => p.slug));
  const rest = items.filter((p) => !shown.has(p.slug));

  return (
    <div className="mt-12 space-y-24 lg:space-y-32">
      {wear.length > 0 && (
        <ShowroomSection index={1} title={<>T-shirts and <em>hoodies</em></>} href="/gifts/t-shirts">
          <DropRail products={wear} grid={cardGrid(wear)} />
        </ShowroomSection>
      )}
      {bottles.length > 0 && (
        <ShowroomSection index={2} title={<>Bottles and <em>mugs</em></>} href="/gifts/bottles">
          <BottleBar products={bottles} grid={cardGrid(bottles)} />
        </ShowroomSection>
      )}
      {verseFrames.length > 0 && (
        <ShowroomSection index={3} title={<>Verse <em>frames</em></>} href="/gifts/photo-frames">
          <FrameBar frames={verseFrames} grid={cardGrid(verseFrames)} />
        </ShowroomSection>
      )}
      {rest.length > 0 && (
        <ShowroomSection index={4} title={<>More <em>gifts</em></>}>
          {cardGrid(rest)}
        </ShowroomSection>
      )}
    </div>
  );
}

function ShowroomSection({ index, title, href, children }: { index: number; title: ReactNode; href?: string; children: ReactNode }) {
  return (
    <section>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4 border-t border-hair pt-10">
        <div>
          <p className="kicker">(0{index})</p>
          <h2 className="mt-3 text-[clamp(2rem,4.5vw,3.5rem)]">{title}</h2>
        </div>
        {href && (
          <Link href={href} className="text-sm text-gold-light underline-offset-4 hover:underline">
            See all →
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}
