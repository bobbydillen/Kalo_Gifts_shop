"use client";

import { useEffect, useRef, useState } from "react";
import { useCatalog } from "@/components/catalog/CatalogProvider";
import { PhotoDesigner, type PhotoHandle, type PhotoResult } from "@/components/product/PhotoDesigner";
import { formatPrice, frameSizeIds, photosFor, priceFor, type Product } from "@/lib/catalog";
import { MAX_PART_QTY } from "@/lib/hamper";

/** One chosen product while the hamper is being built. A photo is kept here until the hamper is added to the bag. */
export type Draft = {
  key: string;
  slug: string;
  colour?: string;
  size?: string;
  qty: number;
  photo?: PhotoResult;
};

/**
 * The window where a customer sets up one product for their hamper: colour, size, how many and,
 * for a custom photo frame, their photo. Closing it adds nothing.
 */
export function HamperPartDialog({
  product,
  onClose,
  onAdd,
}: {
  product: Product;
  onClose: () => void;
  onAdd: (draft: Draft) => void;
}) {
  const { stockFor } = useCatalog();
  const dialog = useRef<HTMLDialogElement>(null);
  const designer = useRef<PhotoHandle>(null);

  const [colour, setColour] = useState<string | undefined>(product.colours[0]?.name);
  const [size, setSize] = useState<string>();
  const [qty, setQty] = useState(1);
  const [photoReady, setPhotoReady] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [shot, setShot] = useState(0); // which picture is showing; goes back to the first when the colour changes
  const photos = photosFor(product, colour);
  const shown = photos[Math.min(shot, Math.max(photos.length - 1, 0))];

  useEffect(() => {
    const el = dialog.current;
    if (el && !el.open) el.showModal();
  }, []);

  const needsSize = product.sizes.length > 0;
  const left = stockFor(product, colour, size);
  const soldOut = (!needsSize || size !== undefined) && left <= 0;
  const maxQty = product.customPhoto ? 1 : Math.min(MAX_PART_QTY, left);
  const frameSize = size && frameSizeIds.includes(size) ? size : (product.sizes.find((s) => frameSizeIds.includes(s)) ?? product.photoSize);
  const frameColour = product.colours.find((c) => c.name === colour)?.hex ?? "#1b1b1b";

  async function add() {
    setMessage(null);
    if (needsSize && !size) return setMessage("Choose a size.");
    if (soldOut) return setMessage("That one has just sold out.");
    let photo: PhotoResult | undefined;
    if (product.customPhoto) {
      if (!photoReady) return setMessage("Add your photo first.");
      setBusy(true);
      const result = await designer.current?.exportPhoto();
      setBusy(false);
      if (!result) return setMessage("We could not prepare your photo. Try another one.");
      photo = result;
    }
    onAdd({ key: crypto.randomUUID(), slug: product.slug, colour, size, qty: Math.min(qty, Math.max(maxQty, 1)), photo });
  }

  return (
    <dialog
      ref={dialog}
      aria-label={`Add ${product.name} to your hamper`}
      onClose={onClose}
      onClick={(e) => e.target === dialog.current && onClose()}
      className="m-auto max-h-[92dvh] w-[min(94vw,40rem)] max-w-none overflow-y-auto rounded-3xl border border-hair-2 bg-pine p-0 text-cream backdrop:bg-night/80 backdrop:backdrop-blur-sm"
    >
      <div className="p-5 sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="kicker">Add to your hamper</p>
            <h2 className="mt-2 text-3xl">{product.name}</h2>
            <p className="mt-1 text-gold-light">{formatPrice(priceFor(product, size))}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close without adding"
            className="grid size-10 shrink-0 place-items-center rounded-full border border-hair-2 text-xl"
          >
            ×
          </button>
        </div>

        {shown && (
          <div className="mt-5">
            {/* eslint-disable-next-line @next/next/no-img-element -- photo sizes are not known until real photos arrive */}
            <img src={shown} alt={product.name} className="mx-auto max-h-[46dvh] w-auto max-w-full rounded-2xl object-contain" />
            {photos.length > 1 && (
              <ul className="mt-3 flex justify-center gap-2 overflow-x-auto" aria-label="More pictures">
                {photos.map((src, i) => (
                  <li key={src}>
                    <button
                      type="button"
                      onClick={() => setShot(i)}
                      aria-label={`Picture ${i + 1} of ${photos.length}`}
                      aria-current={src === shown}
                      className="block size-14 overflow-hidden rounded-lg border border-hair-2 aria-[current=true]:border-gold-light"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element -- small preview */}
                      <img src={src} alt="" className="size-full object-cover" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <div className="mt-5 space-y-3 text-sm text-mist">
          {product.line && <p className="text-base text-cream">{product.line}</p>}
          <p>{product.description}</p>
          {product.message && (
            <p className="rounded-xl border border-hair-2 px-4 py-3">
              <span className="text-xs uppercase tracking-[0.14em] text-faint">The words on it</span>
              <span className="mt-1 block font-serif text-lg italic text-cream">“{product.message.text}”</span>
              {product.message.ref && <span className="block text-xs text-faint">{product.message.ref}</span>}
            </p>
          )}
          {product.details.length > 0 && (
            <ul className="list-disc space-y-1 pl-5 marker:text-gold-light">
              {product.details.map((d) => (
                <li key={d}>{d}</li>
              ))}
            </ul>
          )}
          <a href={`/product/${product.slug}`} target="_blank" rel="noopener" className="inline-block underline underline-offset-4 hover:text-cream">
            Open the full product page in a new tab
          </a>
        </div>

        <div className="mt-6 space-y-6 border-t border-hair pt-6">
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
                    onClick={() => {
                      setColour(c.name);
                      setShot(0);
                      if (size && stockFor(product, c.name, size) <= 0) setSize(undefined);
                      setQty(1);
                    }}
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
              <legend className="text-sm text-mist">
                Size{size && <span className="text-cream">: {size}</span>}
              </legend>
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
            <section aria-labelledby="part-photo-title">
              <h3 id="part-photo-title" className="mb-3 font-sans text-sm text-mist">
                Your photo for this frame
              </h3>
              <PhotoDesigner ref={designer} size={frameSize} frameColour={frameColour} onReady={setPhotoReady} />
            </section>
          )}

          {!product.customPhoto && (
            <div className="flex items-center gap-4">
              <span className="text-sm text-mist">How many</span>
              <div className="flex h-12 items-center rounded-full border border-hair-2" role="group" aria-label="Quantity">
                <button
                  type="button"
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  disabled={qty <= 1}
                  aria-label="One fewer"
                  className="grid h-full w-11 place-items-center text-xl disabled:text-faint"
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
                  className="grid h-full w-11 place-items-center text-xl disabled:text-faint"
                >
                  +
                </button>
              </div>
              {Number.isFinite(left) && left <= 3 && !soldOut && (!needsSize || size) && <span className="text-sm text-gold-light">Only {left} left</span>}
            </div>
          )}

          {message && (
            <p role="alert" className="rounded-xl border border-berry-light/50 bg-berry/20 px-4 py-3 text-sm">
              {message}
            </p>
          )}

          <button
            type="button"
            onClick={add}
            disabled={busy || soldOut}
            className="btn btn-gold w-full disabled:pointer-events-none disabled:opacity-55"
          >
            {soldOut ? "Sold out" : busy ? "Preparing your photo…" : "Add to my hamper"}
          </button>
        </div>
      </div>
    </dialog>
  );
}
