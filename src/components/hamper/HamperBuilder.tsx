"use client";

import Link from "next/link";
import { useState } from "react";
import { useBag } from "@/components/bag/BagProvider";
import { GiftOptions } from "@/components/bag/GiftOptions";
import { useCatalog } from "@/components/catalog/CatalogProvider";
import { HamperPartDialog, type Draft } from "@/components/hamper/HamperPartDialog";
import { ProductArt } from "@/components/product/ProductArt";
import { useSettings } from "@/components/settings/SettingsProvider";
import { categories, formatPrice, fromPrice, type Category, type Product } from "@/lib/catalog";
import { describePart, hamperPrice, MAX_HAMPER_PRODUCTS, MAX_PART_QTY, MIN_HAMPER_PRODUCTS, type HamperPart } from "@/lib/hamper";
import { supabaseBrowser } from "@/lib/supabase/client";

/**
 * The "Build your own hamper" page. The customer picks at least three different products, sets each
 * one's colour, size and (for a photo frame) photo, writes an optional card, and adds the whole
 * hamper to the bag as one item. Photos are uploaded only at that last step.
 */
export function HamperBuilder() {
  const catalog = useCatalog();
  const settings = useSettings();
  const { add } = useBag();
  const builder = catalog.builderProduct();
  const buildable = catalog.buildableProducts();

  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [configuring, setConfiguring] = useState<Product | null>(null);
  const [filter, setFilter] = useState<Category | "all">("all");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [round, setRound] = useState(0); // changes after each hamper is added, so the card box starts fresh

  if (!builder) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <h1 className="text-[clamp(2.5rem,6vw,4.5rem)]">
          Build your own <em>hamper</em>
        </h1>
        <p className="mt-6 text-lg text-mist">The hamper builder is not open just yet. Have a look at our ready-made hampers in the meantime.</p>
        <Link href="/gifts/hampers" className="btn btn-gold mt-10">
          See hampers
        </Link>
      </div>
    );
  }

  const price = hamperPrice(drafts, catalog.productBySlug, settings);
  const cardCost = note.trim() ? settings.giftCardPrice : 0;
  const ready = price.distinct >= MIN_HAMPER_PRODUCTS;
  const missing = Math.max(0, MIN_HAMPER_PRODUCTS - price.distinct);

  const filters = categories.filter((c) => c.id !== "hamper" && buildable.some((p) => p.category === c.id));
  const shown = buildable.filter((p) => filter === "all" || p.category === filter);
  const inHamper = (slug: string) => drafts.filter((d) => d.slug === slug).reduce((n, d) => n + d.qty, 0);
  const plain = (p: Product) => p.colours.length === 0 && p.sizes.length === 0 && !p.customPhoto;

  function addDraft(draft: Draft) {
    setMessage(null);
    const isNew = !drafts.some((d) => d.slug === draft.slug);
    if (isNew && price.distinct >= MAX_HAMPER_PRODUCTS) {
      setMessage(`A hamper can hold up to ${MAX_HAMPER_PRODUCTS} different products.`);
      return;
    }
    setDrafts((current) => {
      const same = current.find((d) => !d.photo && !draft.photo && d.slug === draft.slug && d.colour === draft.colour && d.size === draft.size);
      if (same) return current.map((d) => (d === same ? { ...d, qty: Math.min(MAX_PART_QTY, d.qty + draft.qty) } : d));
      return [...current, draft];
    });
  }

  // every product opens its details first, so the customer can see the pictures and description before adding it
  function choose(product: Product) {
    setConfiguring(product);
  }

  async function addHamper() {
    if (!ready || !builder) return;
    setBusy(true);
    setMessage(null);
    const supabase = supabaseBrowser();
    const parts: HamperPart[] = [];
    for (const d of drafts) {
      let photo: HamperPart["photo"];
      if (d.photo) {
        const path = `uploads/${crypto.randomUUID()}.${d.photo.ext}`;
        const { error } = await supabase.storage.from("customer-photos").upload(path, d.photo.blob, { contentType: d.photo.blob.type, upsert: false });
        if (error) {
          setBusy(false);
          setMessage("We could not save your photo. Check your connection and try again.");
          return;
        }
        photo = { path, thumb: d.photo.thumb, orient: d.photo.orient };
      }
      parts.push({ slug: d.slug, colour: d.colour, size: d.size, qty: d.qty, photo });
    }
    add({ slug: builder.slug, parts, note });
    setDrafts([]);
    setNote("");
    setRound((r) => r + 1);
    setBusy(false);
  }

  return (
    <div className="mx-auto max-w-7xl px-4 pb-24 pt-12 sm:px-6 lg:pb-32 lg:pt-16">
      <p className="kicker">Hampers</p>
      <h1 className="mt-4 max-w-4xl text-[clamp(2.5rem,6.5vw,5.5rem)]">
        Build your own <em>hamper</em>
      </h1>
      <p className="mt-5 max-w-2xl text-lg text-mist">
        Choose at least {MIN_HAMPER_PRODUCTS} different gifts, pick their colours and sizes, and we will pack them together with care.
        {settings.hamperDiscountPercent > 0 && ` You save ${settings.hamperDiscountPercent}% on the items.`}
      </p>

      <a
        href="#your-hamper"
        className="sticky top-[4.25rem] z-20 mt-6 flex items-center justify-between rounded-full border border-hair-2 bg-pine/90 px-5 py-3 text-sm backdrop-blur lg:hidden"
      >
        <span>
          {price.distinct} of {MIN_HAMPER_PRODUCTS}+ chosen
        </span>
        <span className="text-gold-light">{formatPrice(price.total)} ↓</span>
      </a>

      <div className="mt-10 grid gap-10 lg:grid-cols-[1.5fr_1fr] lg:gap-14">
        <section aria-labelledby="pick-title">
          <h2 id="pick-title" className="text-3xl">
            Pick your <em>gifts</em>
          </h2>
          <nav aria-label="Categories" className="no-scrollbar -mx-4 mt-5 flex gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:flex-wrap sm:px-0">
            {[{ id: "all" as const, label: "Everything" }, ...filters.map((c) => ({ id: c.id, label: c.label }))].map((c) => (
              <button
                key={c.id}
                type="button"
                aria-pressed={filter === c.id}
                onClick={() => setFilter(c.id)}
                className="chip shrink-0 aria-pressed:border-cream aria-pressed:bg-cream aria-pressed:text-night"
              >
                {c.label}
              </button>
            ))}
          </nav>

          {shown.length === 0 ? (
            <p className="mt-6 rounded-2xl border border-dashed border-hair-2 p-10 text-center text-mist">No gifts to choose from yet.</p>
          ) : (
            <ul className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
              {shown.map((p) => {
                const count = inHamper(p.slug);
                const price = fromPrice(p);
                return (
                  <li key={p.slug}>
                    <button
                      type="button"
                      onClick={() => choose(p)}
                      aria-label={`See ${p.name} and add it to your hamper`}
                      className={`group relative block w-full overflow-hidden rounded-2xl border bg-pine text-left transition-[border-color,transform] duration-500 ease-bounce hover:-translate-y-0.5 ${
                        count ? "border-gold" : "border-hair hover:border-gold"
                      }`}
                    >
                      <span
                        className="grid aspect-square place-items-center overflow-hidden"
                        style={{ background: `radial-gradient(circle at 50% 42%, color-mix(in srgb, ${p.tint} 65%, transparent), var(--color-pine-2) 75%)` }}
                      >
                        {p.images[0] ? (
                          // eslint-disable-next-line @next/next/no-img-element -- photo sizes are not known until real photos arrive
                          <img src={p.images[0]} alt="" className="size-full object-cover" />
                        ) : (
                          <ProductArt category={p.category} className="w-1/3 text-gold-light" />
                        )}
                      </span>
                      {count > 0 && (
                        <span className="absolute right-2 top-2 rounded-full bg-gold px-2.5 py-1 text-xs font-medium text-night">In hamper × {count}</span>
                      )}
                      <span className="block p-3">
                        <span className="block font-serif text-lg leading-tight">{p.name}</span>
                        <span className="mt-1 flex items-center justify-between gap-2 text-sm">
                          <span className="text-gold-light">
                            {price.from && <span className="mr-1 text-xs text-faint">From</span>}
                            {formatPrice(price.price)}
                          </span>
                          <span className="text-xs uppercase tracking-[0.14em] text-mist group-hover:text-cream">{plain(p) ? "View + add" : "View + choose"}</span>
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <aside id="your-hamper" className="scroll-mt-28 lg:sticky lg:top-28 lg:self-start" aria-labelledby="hamper-title">
          <div className="rounded-[24px] border border-hair bg-pine p-6">
            <h2 id="hamper-title" className="font-serif text-3xl">
              Your <em>hamper</em>
            </h2>

            <p className={`mt-3 rounded-xl border px-4 py-2.5 text-sm ${ready ? "border-gold/40 bg-gold/10 text-gold-light" : "border-hair-2 text-mist"}`}>
              {ready
                ? `${price.distinct} different gifts. Nice choice.`
                : `${price.distinct} of ${MIN_HAMPER_PRODUCTS} different gifts. Add ${missing} more to continue.`}
            </p>

            {drafts.length === 0 ? (
              <p className="mt-5 text-mist">Nothing here yet. Tap a gift to see its details and add it.</p>
            ) : (
              <ul className="mt-5 divide-y divide-hair">
                {drafts.map((d) => {
                  const product = catalog.productBySlug(d.slug);
                  if (!product) return null;
                  return (
                    <li key={d.key} className="flex items-start gap-3 py-3">
                      {d.photo ? (
                        // eslint-disable-next-line @next/next/no-img-element -- a small preview of the customer's own photo
                        <img src={d.photo.thumb} alt="Your photo" className="size-12 shrink-0 rounded-lg object-cover" />
                      ) : (
                        <span className="grid size-12 shrink-0 place-items-center rounded-lg bg-pine-2">
                          <ProductArt category={product.category} className="w-6 text-gold-light" />
                        </span>
                      )}
                      <span className="min-w-0 flex-1">
                        <span className="block leading-tight">{describePart(d, catalog.productBySlug)}</span>
                        {d.photo && <span className="block text-xs text-faint">With your photo</span>}
                      </span>
                      <span className="tabular-nums text-mist">{formatPrice(hamperPrice([d], catalog.productBySlug, { hamperBoxFee: 0, hamperDiscountPercent: 0 }).total)}</span>
                      <button
                        type="button"
                        onClick={() => setDrafts((current) => current.filter((x) => x.key !== d.key))}
                        aria-label={`Remove ${product.name}`}
                        className="grid size-7 shrink-0 place-items-center rounded-full border border-hair-2 text-sm text-mist hover:border-berry-light hover:text-cream"
                      >
                        ×
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}

            <div className="mt-5">
              <GiftOptions key={round} product={builder} wrap={false} note={note} onChange={(g) => setNote(g.note)} />
            </div>

            {drafts.length > 0 && (
            <dl className="mt-5 space-y-2 border-t border-hair pt-4 text-sm">
              <div className="flex justify-between text-mist">
                <dt>Gifts</dt>
                <dd className="tabular-nums">{formatPrice(price.itemsTotal)}</dd>
              </div>
              {price.discount > 0 && (
                <div className="flex justify-between text-gold-light">
                  <dt>Bundle discount ({settings.hamperDiscountPercent}%)</dt>
                  <dd className="tabular-nums">−{formatPrice(price.discount)}</dd>
                </div>
              )}
              <div className="flex justify-between text-mist">
                <dt>Gift box and packing</dt>
                <dd className="tabular-nums">{price.boxFee > 0 ? formatPrice(price.boxFee) : "Free"}</dd>
              </div>
              {cardCost > 0 && (
                <div className="flex justify-between text-mist">
                  <dt>Handwritten card</dt>
                  <dd className="tabular-nums">{formatPrice(cardCost)}</dd>
                </div>
              )}
              <div className="flex justify-between pt-2 font-serif text-3xl">
                <dt>Total</dt>
                <dd className="tabular-nums">{formatPrice(price.total + cardCost)}</dd>
              </div>
            </dl>
            )}

            {message && (
              <p role="alert" className="mt-4 rounded-xl border border-berry-light/50 bg-berry/20 px-4 py-3 text-sm">
                {message}
              </p>
            )}

            <button type="button" onClick={addHamper} disabled={!ready || busy} className="btn btn-gold mt-5 w-full disabled:pointer-events-none disabled:opacity-55">
              {busy ? "Saving your photos…" : ready ? `Add hamper to bag · ${formatPrice(price.total + cardCost)}` : `Choose ${missing} more gift${missing === 1 ? "" : "s"}`}
            </button>
            <p className="mt-3 text-xs text-faint">Delivery is worked out at checkout, and is free on orders of {formatPrice(settings.freeShippingOver)} or more.</p>
          </div>
        </aside>
      </div>

      {configuring && (
        <HamperPartDialog
          key={configuring.slug}
          product={configuring}
          onClose={() => setConfiguring(null)}
          onAdd={(draft) => {
            addDraft(draft);
            setConfiguring(null);
          }}
        />
      )}
    </div>
  );
}
