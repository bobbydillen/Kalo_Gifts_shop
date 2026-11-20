"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useSettings } from "@/components/settings/SettingsProvider";
import { formatPrice, type Product } from "@/lib/catalog";
import { BOTTLE_STYLES, bottleShots, designKey, designName } from "@/lib/bottles";
import { BottleFigure } from "./BottleFigure";
import { CurvedShelf } from "./CurvedShelf";

type Mode = "bottle" | "verse" | "grid";
const MODE_KEY = "kalo-bottle-view";

const designOf = designName;

/**
 * The Bottle Bar: bottles standing on lit wooden shelves instead of a product grid.
 * - By bottle: one shelf per bottle style (and a Christmas shelf in season); each bottle's colour dots
 *   pour the new colour in.
 * - By verse: pick a design and every bottle that carries it lines up on one shelf.
 * - Grid: the plain product grid.
 */
export function BottleBar({ products, grid }: { products: Product[]; grid: ReactNode }) {
  const [mode, setMode] = useState<Mode>("bottle");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(MODE_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- restoring a saved preference after hydration
      if (saved === "bottle" || saved === "verse" || saved === "grid") setMode(saved);
    } catch {
      // storage unavailable
    }
  }, []);
  const choose = (m: Mode) => {
    setMode(m);
    try {
      localStorage.setItem(MODE_KEY, m);
    } catch {
      // not remembered
    }
  };

  return (
    <section aria-label="The Bottle Bar">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-xs uppercase tracking-[0.28em] text-faint">
          The Bottle Bar <span className="text-gold">·</span> {products.length} designs
        </p>
        <div role="radiogroup" aria-label="How to browse" className="flex rounded-full border border-hair-2 p-1 text-xs">
          {(
            [
              ["bottle", "By bottle"],
              ["verse", "By verse"],
              ["grid", "Grid"],
            ] as const
          ).map(([m, label]) => (
            <button
              key={m}
              type="button"
              role="radio"
              aria-checked={mode === m}
              onClick={() => choose(m)}
              className="rounded-full px-3.5 py-1.5 text-mist transition-colors duration-300 aria-checked:bg-cream aria-checked:text-night"
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      {mode === "bottle" && <ByBottle products={products} />}
      {mode === "verse" && <ByVerse products={products} />}
      {mode === "grid" && <div className="mt-8">{grid}</div>}
    </section>
  );
}

function ByBottle({ products }: { products: Product[] }) {
  const { christmasHero } = useSettings();
  const [style, setStyle] = useState<string | null>(null);
  const styles = BOTTLE_STYLES.filter((s) => products.some((p) => p.designGroup === s.id && !p.christmas));
  const christmas = christmasHero ? products.filter((p) => p.christmas) : [];
  const shown = styles.filter((s) => !style || s.id === style);
  const itemsOf = (id: string) => products.filter((p) => p.designGroup === id && !p.christmas).map((p) => ({ product: p }));
  const noteOf = (s: (typeof BOTTLE_STYLES)[number]) =>
    [s.capacityMl ? `${s.capacityMl} ml` : "", s.coldHours ? `cold ${s.coldHours} h · hot ${s.hotHours} h` : "", `${itemsOf(s.id).length} designs`].filter(Boolean).join(" · ");

  // curved shelves, or straight ones for people who switch animations off
  const [view, setView] = useState<"shelf" | "curved">("curved");
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- the setting is only known in the browser
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) setView("shelf");
  }, []);

  return (
    <div className="mt-8">
      <nav aria-label="Bottle styles" className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
        <button type="button" className="chip shrink-0" aria-pressed={style === null} onClick={() => setStyle(null)}>
          All bottles
        </button>
        {styles.map((s) => (
          <button key={s.id} type="button" className="chip shrink-0" aria-pressed={style === s.id} onClick={() => setStyle(s.id)}>
            {s.name}
          </button>
        ))}
      </nav>

      {view === "shelf" ? (
        <>
          {!style && christmas.length > 0 && (
            <Shelf title="Christmas Edition 2026" note="Limited edition · this year only" ribbon snow items={christmas.map((p) => ({ product: p }))} />
          )}
          {shown.map((s) => (
            <Shelf key={s.id} title={s.name} note={noteOf(s)} intro={s.intro} items={itemsOf(s.id)} />
          ))}
        </>
      ) : (
        <>
          {!style && christmas.length > 0 && (
            <CurvedSection title="Christmas Edition 2026" note="Limited edition · this year only" ribbon snow items={christmas.map((p) => ({ product: p }))} />
          )}
          {shown.map((s) => (
            <CurvedSection key={s.id} title={s.name} note={noteOf(s)} intro={s.intro} items={itemsOf(s.id)} />
          ))}
        </>
      )}
    </div>
  );
}

function ByVerse({ products }: { products: Product[] }) {
  const designs = useMemo(() => {
    const map = new Map<string, { label: string; items: Product[] }>();
    for (const p of products) {
      const key = designKey(p);
      const entry = map.get(key) ?? { label: designOf(p), items: [] };
      entry.items.push(p);
      map.set(key, entry);
    }
    // designs on more bottles first, then A to Z
    return [...map.entries()].sort((a, b) => b[1].items.length - a[1].items.length || a[1].label.localeCompare(b[1].label));
  }, [products]);
  const [query, setQuery] = useState("");
  const [picked, setPicked] = useState(designs[0]?.[0] ?? "");
  const shown = designs.filter(([, d]) => d.label.toLowerCase().includes(query.trim().toLowerCase()));
  const current = designs.find(([k]) => k === picked)?.[1];

  // every colour of every bottle with this design stands on the shelf
  const items = (current?.items ?? []).flatMap((p) => (p.colours.length ? p.colours.map((c) => ({ product: p, colour: c.name })) : [{ product: p }]));

  return (
    <div className="mt-8">
      <label className="block max-w-md">
        <span className="sr-only">Find a verse or design</span>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Find a verse or a word: hope, Psalm 91, light…"
          className="w-full rounded-full border border-hair-2 bg-pine-2/60 px-5 py-3 text-sm text-cream placeholder:text-faint focus:border-gold focus:outline-none"
        />
      </label>
      <div className="no-scrollbar -mx-4 mt-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:max-h-36 sm:flex-wrap sm:overflow-y-auto sm:px-0">
        {shown.map(([k, d]) => (
          <button key={k} type="button" className="chip shrink-0" aria-pressed={k === picked} onClick={() => setPicked(k)}>
            {d.label}
            {d.items.length > 1 && <span className="ml-1.5 text-gold">· {d.items.length} bottles</span>}
          </button>
        ))}
        {shown.length === 0 && <p className="text-sm text-faint">No design matches that yet.</p>}
      </div>
      {current && (
        <Shelf
          key={picked}
          title={current.label}
          note={`On ${current.items.length} ${current.items.length === 1 ? "bottle" : "bottles"} · ${items.length} ${items.length === 1 ? "colour" : "colours"}`}
          items={items}
          showStyle
        />
      )}
    </div>
  );
}

type ShelfItem = { product: Product; colour?: string };

function CurvedSection({ title, note, intro, items, ribbon, snow }: { title: string; note?: string; intro?: string; items: ShelfItem[]; ribbon?: boolean; snow?: boolean }) {
  return (
    <section className="relative mt-14" aria-label={title}>
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-1">
        <h3 className="text-[clamp(1.75rem,4vw,2.5rem)]">
          {title}
          {ribbon && <span className="ml-3 rounded-full bg-berry px-2.5 py-1 align-middle font-sans text-[0.625rem] uppercase tracking-[0.2em] text-cream">★ Limited</span>}
        </h3>
        {note && <p className="text-xs uppercase tracking-[0.2em] text-faint">{note}</p>}
      </div>
      {intro && <p className="mt-2 hidden max-w-2xl text-sm text-mist sm:block">{intro.split(". ")[0]}.</p>}
      <div className="relative -mx-4 mt-2 overflow-hidden sm:-mx-6">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_55%_60%_at_50%_35%,rgba(242,222,174,0.14),transparent_70%)]" />
        {snow && <Snow />}
        <CurvedShelf items={items} />
      </div>
    </section>
  );
}

function Shelf({
  title,
  note,
  intro,
  items,
  ribbon,
  snow,
  showStyle,
}: {
  title: string;
  note?: string;
  intro?: string;
  items: ShelfItem[];
  ribbon?: boolean;
  snow?: boolean;
  showStyle?: boolean;
}) {
  return (
    <section className="relative mt-12" aria-label={title}>
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-1">
        <h3 className="text-[clamp(1.75rem,4vw,2.5rem)]">
          {title}
          {ribbon && <span className="ml-3 rounded-full bg-berry px-2.5 py-1 align-middle font-sans text-[0.625rem] uppercase tracking-[0.2em] text-cream">★ Limited</span>}
        </h3>
        {note && <p className="text-xs uppercase tracking-[0.2em] text-faint">{note}</p>}
      </div>
      {intro && <p className="mt-2 hidden max-w-2xl text-sm text-mist sm:block">{intro.split(". ")[0]}.</p>}

      <div className="relative -mx-4 mt-4 sm:-mx-6">
        {/* warm light from above */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-full bg-[radial-gradient(ellipse_70%_60%_at_50%_0%,rgba(242,222,174,0.12),transparent_70%)]" />
        {snow && <Snow />}
        <div className="no-scrollbar relative flex snap-x overflow-x-auto px-4 pt-6 sm:px-6">
          {items.map(({ product, colour }, i) => (
            <ShelfBottle key={`${product.slug}-${colour ?? ""}`} product={product} startColour={colour} priority={i < 4} showStyle={showStyle} />
          ))}
        </div>
      </div>
    </section>
  );
}

function ShelfBottle({ product, startColour, priority, showStyle }: { product: Product; startColour?: string; priority?: boolean; showStyle?: boolean }) {
  const [colour, setColour] = useState(startColour ?? product.colours[0]?.name);
  const shot = bottleShots(product, colour);
  const swatch = product.colours.find((c) => c.name === colour)?.hex ?? product.tint;
  const style = BOTTLE_STYLES.find((s) => s.id === product.designGroup);

  return (
    <div className="group relative w-[calc(40vw+0.75rem)] shrink-0 snap-start px-1.5 sm:w-[13rem] sm:px-2.5">
      <Link href={`/product/${product.slug}`} aria-label={`${product.name}${colour ? `, ${colour}` : ""}, ${formatPrice(product.price)}`} className="relative z-10 block">
        <BottleFigure
          src={shot.cut}
          swatch={swatch}
          alt={`${product.name}${colour ? ` in ${colour}` : ""}`}
          priority={priority}
          className="transition-transform duration-500 ease-glide group-hover:-translate-y-2"
        />
      </Link>
      {/* this bottle's piece of the wooden shelf; the pieces meet edge to edge */}
      <div aria-hidden="true" className="relative -mx-1.5 -mt-[1.2%] h-[18px] sm:-mx-2.5">
        <div className="absolute inset-x-0 top-0 h-[10px] bg-[linear-gradient(180deg,#b88b57,#8a6236_60%,#6b4a27)] shadow-[0_14px_22px_-8px_rgba(0,0,0,0.9)]" />
        <div className="absolute inset-x-0 top-[10px] h-[8px] bg-[linear-gradient(180deg,#5a3d1f,#3a2712)]" />
      </div>
      <div className="h-[5.5rem] pt-3">
        {product.colours.length > 1 && !startColour && (
          <div className="flex justify-center gap-1.5" role="group" aria-label="Colours">
            {product.colours.map((c) => (
              <button
                key={c.name}
                type="button"
                title={c.name}
                aria-label={c.name}
                aria-pressed={c.name === colour}
                onClick={() => setColour(c.name)}
                className="size-4 rounded-full ring-1 ring-hair-2 transition-transform aria-pressed:scale-125 aria-pressed:ring-2 aria-pressed:ring-gold-light"
                style={{ background: c.hex }}
              />
            ))}
          </div>
        )}
        <Link href={`/product/${product.slug}`} className="mt-2 block text-center">
          <span className="line-clamp-2 text-[0.8125rem] leading-snug text-cream">{designOf(product)}</span>
          <span className="mt-0.5 block text-xs text-faint">
            {showStyle && style ? `${style.name} · ` : ""}
            {startColour ? `${startColour} · ` : ""}
            {formatPrice(product.price)}
          </span>
        </Link>
      </div>
    </div>
  );
}

function Snow() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden motion-reduce:hidden">
      {Array.from({ length: 18 }, (_, i) => (
        <span
          key={i}
          className="absolute top-[-10px] block size-1.5 rounded-full bg-cream/70 animate-[bottle-snow_linear_infinite]"
          style={{ left: `${(i * 37) % 100}%`, animationDuration: `${7 + (i % 5) * 1.6}s`, animationDelay: `${-(i * 0.9)}s`, opacity: 0.35 + (i % 3) * 0.2 }}
        />
      ))}
    </div>
  );
}
