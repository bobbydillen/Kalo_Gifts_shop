"use client";

import { useState } from "react";
import { MAX_QTY, useBag } from "@/components/bag/BagProvider";
import { GiftOptions } from "@/components/bag/GiftOptions";
import { SizeGuide } from "@/components/product/SizeGuide";
import { useCatalog } from "@/components/catalog/CatalogProvider";
import { useProductColour } from "@/components/product/ProductColour";
import { useSettings } from "@/components/settings/SettingsProvider";
import { formatPrice, type Product } from "@/lib/catalog";
import { unitPrice } from "@/lib/gifting";

const LOW_STOCK = 3; // at or below this, show how many are left

/** Colour, size, gift options and quantity choices, and the add-to-bag button. */
export function ProductBuy({ product }: { product: Product }) {
  const { add } = useBag();
  const { stockFor } = useCatalog();
  const settings = useSettings();
  const { colour, setColour } = useProductColour();
  const [size, setSize] = useState<string>();
  const [qty, setQty] = useState(1);
  const [gift, setGift] = useState({ wrap: false, note: "" });

  const needsSize = product.sizes.length > 0;
  const left = stockFor(product, colour, size);
  const soldOut = (!needsSize || size !== undefined) && left <= 0;
  const maxQty = Math.min(MAX_QTY, left);
  const total = unitPrice(product, gift, settings) * qty;

  const pickColour = (name: string) => {
    setColour(name);
    // drop a size that is not available in the new colour
    if (size && stockFor(product, name, size) <= 0) setSize(undefined);
    setQty(1);
  };

  const label =
    needsSize && !size ? "Choose a size" : soldOut ? "Sold out" : `Add to bag · ${formatPrice(total)}`;

  return (
    <div className="space-y-7">
      {product.colours.length > 0 && (
        <fieldset>
          <legend className="text-sm text-mist">
            Colour: <span className="text-cream">{colour}</span>
          </legend>
          <div className="mt-3 flex flex-wrap gap-3">
            {product.colours.map((c) => (
              <button
                key={c.name}
                type="button"
                aria-pressed={colour === c.name}
                aria-label={c.name}
                title={c.name}
                onClick={() => pickColour(c.name)}
                className="grid size-11 place-items-center rounded-full border border-transparent transition-[transform,border-color] duration-500 ease-bounce hover:scale-110 active:scale-90 aria-pressed:border-gold-light"
              >
                <span className="size-8 rounded-full ring-1 ring-hair-2" style={{ background: c.hex }} />
              </button>
            ))}
          </div>
        </fieldset>
      )}

      {needsSize && (
        <fieldset>
          <div className="flex items-baseline justify-between gap-4">
            <legend className="float-left text-sm text-mist">
              Size{size && <span className="text-cream">: {size}</span>}
            </legend>
            <SizeGuide />
          </div>
          <div className="mt-3 flex flex-wrap gap-2.5">
            {product.sizes.map((s) => {
              const gone = stockFor(product, colour, s) <= 0;
              return (
                <button
                  key={s}
                  type="button"
                  disabled={gone}
                  aria-pressed={size === s}
                  aria-label={gone ? `${s}, sold out` : s}
                  onClick={() => {
                    setSize(s);
                    setQty(1);
                  }}
                  className="min-w-14 rounded-full border border-hair-2 px-4 py-2.5 text-sm transition-[transform,background-color,border-color,color] duration-500 ease-bounce hover:border-gold enabled:active:scale-90 disabled:cursor-not-allowed disabled:border-hair disabled:text-faint disabled:line-through aria-pressed:border-cream aria-pressed:bg-cream aria-pressed:text-night"
                >
                  {s}
                </button>
              );
            })}
          </div>
        </fieldset>
      )}

      <section aria-labelledby="gift-options-title">
        <h2 id="gift-options-title" className="mb-3 font-sans text-sm text-mist">
          Make it a gift
        </h2>
        <GiftOptions product={product} wrap={gift.wrap} note={gift.note} onChange={setGift} />
      </section>

      <div className="flex flex-wrap items-center gap-4">
        <div className="flex h-14 items-center rounded-full border border-hair-2" role="group" aria-label="Quantity">
          <button
            type="button"
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            disabled={qty <= 1}
            aria-label="One fewer"
            className="grid h-full w-12 place-items-center text-xl transition-transform duration-300 ease-bounce enabled:active:scale-75 disabled:text-faint"
          >
            −
          </button>
          <span aria-live="polite" className="w-7 text-center tabular-nums">
            {qty}
          </span>
          <button
            type="button"
            onClick={() => setQty((q) => Math.min(maxQty, q + 1))}
            disabled={qty >= maxQty}
            aria-label="One more"
            className="grid h-full w-12 place-items-center text-xl transition-transform duration-300 ease-bounce enabled:active:scale-75 disabled:text-faint"
          >
            +
          </button>
        </div>

        <button
          type="button"
          disabled={(needsSize && !size) || soldOut}
          onClick={() => add({ slug: product.slug, colour, size, qty, wrap: gift.wrap, note: gift.note })}
          className="btn btn-gold h-14 flex-1 disabled:pointer-events-none disabled:opacity-55 disabled:saturate-50"
        >
          {label}
        </button>
      </div>

      <p aria-live="polite" className="min-h-5 text-sm text-gold-light">
        {!soldOut && left <= LOW_STOCK && (!needsSize || size) ? `Only ${left} left` : ""}
      </p>
    </div>
  );
}
