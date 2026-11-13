"use client";

import { useRef, useState } from "react";
import { MAX_QTY, useBag } from "@/components/bag/BagProvider";
import { CardPrompt } from "@/components/bag/CardPrompt";
import { GiftOptions } from "@/components/bag/GiftOptions";
import { PhotoDesigner, type PhotoHandle } from "@/components/product/PhotoDesigner";
import { SizeGuide } from "@/components/product/SizeGuide";
import { useCatalog } from "@/components/catalog/CatalogProvider";
import { useProductColour } from "@/components/product/ProductColour";
import { useSettings } from "@/components/settings/SettingsProvider";
import { formatPrice, frameSizeIds, type Product } from "@/lib/catalog";
import { unitPrice } from "@/lib/gifting";
import { supabaseBrowser } from "@/lib/supabase/client";

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
  const [promptOpen, setPromptOpen] = useState(false);

  // the card offer appears once per visit, and only when no card has been written yet
  // photo frames: the customer's cropped photo is uploaded when they add the item
  const designer = useRef<PhotoHandle>(null);
  const [photoReady, setPhotoReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [photoMessage, setPhotoMessage] = useState<string | null>(null);

  const addToBag = async (note: string) => {
    let photo;
    if (product.customPhoto) {
      setBusy(true);
      setPhotoMessage(null);
      const result = await designer.current?.exportPhoto();
      if (!result) {
        setBusy(false);
        setPhotoMessage("Please add your photo first.");
        return;
      }
      const path = `uploads/${crypto.randomUUID()}.${result.ext}`;
      const { error } = await supabaseBrowser()
        .storage.from("customer-photos")
        .upload(path, result.blob, { contentType: result.blob.type, upsert: false });
      setBusy(false);
      if (error) {
        setPhotoMessage("We could not save your photo. Check your connection and try again.");
        return;
      }
      photo = { path, thumb: result.thumb, orient: result.orient };
    }
    add({ slug: product.slug, colour, size, qty, wrap: gift.wrap, note, photo });
    setGift((g) => ({ ...g, note }));
  };
  const tryAdd = () => {
    if (product.customPhoto && !photoReady) {
      setPhotoMessage("Please add your photo first.");
      return;
    }
    let seen = false;
    try {
      seen = sessionStorage.getItem("kalo-card-prompt") === "1";
      sessionStorage.setItem("kalo-card-prompt", "1");
    } catch {
      seen = true; // storage unavailable: never nag
    }
    if (!gift.note.trim() && !seen) setPromptOpen(true);
    else addToBag(gift.note);
  };

  const needsSize = product.sizes.length > 0;
  const left = stockFor(product, colour, size);
  const soldOut = (!needsSize || size !== undefined) && left <= 0;
  const maxQty = Math.min(MAX_QTY, left);
  const total = unitPrice(product, gift, settings, size) * qty;

  const pickColour = (name: string) => {
    setColour(name);
    // drop a size that is not available in the new colour
    if (size && stockFor(product, name, size) <= 0) setSize(undefined);
    setQty(1);
  };

  const frameSize = size && frameSizeIds.includes(size) ? size : (product.sizes.find((s) => frameSizeIds.includes(s)) ?? product.photoSize);
  const frameColour = product.colours.find((c) => c.name === colour)?.hex ?? "#1b1b1b";
  const hasClothingSizes = product.sizes.some((s) => !frameSizeIds.includes(s));

  const label =
    needsSize && !size
      ? "Choose a size"
      : soldOut
        ? "Sold out"
        : busy
          ? "Saving your photo…"
          : product.customPhoto && !photoReady
            ? "Add your photo first"
            : `Add to bag · ${formatPrice(total)}`;

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
            {hasClothingSizes && <SizeGuide />}
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

      {product.customPhoto && (
        <section aria-labelledby="your-photo-title">
          <h2 id="your-photo-title" className="mb-3 font-sans text-sm text-mist">
            Your photo
          </h2>
          <PhotoDesigner ref={designer} size={frameSize} frameColour={frameColour} onReady={setPhotoReady} />
          {photoMessage && (
            <p role="alert" className="mt-3 rounded-xl border border-berry-light/50 bg-berry/20 px-4 py-3 text-sm">
              {photoMessage}
            </p>
          )}
        </section>
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
          disabled={(needsSize && !size) || soldOut || busy}
          onClick={tryAdd}
          className="btn btn-gold h-14 flex-1 disabled:pointer-events-none disabled:opacity-55 disabled:saturate-50"
        >
          {label}
        </button>
      </div>

      <CardPrompt
        open={promptOpen}
        onClose={() => setPromptOpen(false)}
        onChoose={(message) => {
          setPromptOpen(false);
          addToBag(message);
        }}
      />

      <p aria-live="polite" className="min-h-5 text-sm text-gold-light">
        {!soldOut && left <= LOW_STOCK && (!needsSize || size) ? `Only ${left} left` : ""}
      </p>
    </div>
  );
}
