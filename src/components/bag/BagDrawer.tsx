"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { MAX_QTY, useBag } from "@/components/bag/BagProvider";
import { GiftOptions } from "@/components/bag/GiftOptions";
import { useCatalog } from "@/components/catalog/CatalogProvider";
import { ProductArt } from "@/components/product/ProductArt";
import { useSettings } from "@/components/settings/SettingsProvider";
import { formatPrice } from "@/lib/catalog";
import { describePart } from "@/lib/hamper";

/** Slide-in bag. Opens when something is added or the Bag button is pressed. */
export function BagDrawer() {
  const { lines, count, subtotal, isOpen, setOpen, setQty, remove, setGift } = useBag();
  const dialog = useRef<HTMLDialogElement>(null);
  const settings = useSettings();
  const { productBySlug } = useCatalog();

  useEffect(() => {
    const el = dialog.current;
    if (!el) return;
    if (isOpen && !el.open) el.showModal();
    if (!isOpen && el.open) el.close();
  }, [isOpen]);

  const unavailable = lines.some((l) => l.left <= 0);

  return (
    <dialog
      ref={dialog}
      aria-labelledby="bag-title"
      className="drawer-dialog"
      onClose={() => setOpen(false)}
      onClick={(e) => e.target === dialog.current && setOpen(false)}
    >
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between border-b border-hair px-5 py-5 sm:px-7">
          <h2 id="bag-title" className="text-3xl">
            Your <em>bag</em>
            {count > 0 && <span className="ml-3 font-sans text-sm text-faint">({count})</span>}
          </h2>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close bag"
            className="grid size-11 place-items-center rounded-full border border-hair-2 text-xl transition-[transform,border-color] duration-500 ease-bounce hover:border-gold active:scale-90"
          >
            ×
          </button>
        </div>

        {lines.length === 0 ? (
          <div className="grid flex-1 place-items-center px-8 text-center">
            <div>
              <p className="font-serif text-3xl">Nothing here yet</p>
              <p className="mt-3 text-mist">Someone is waiting for the right gift.</p>
              <Link href="/gifts" onClick={() => setOpen(false)} className="btn btn-gold mt-8">
                Browse gifts
              </Link>
            </div>
          </div>
        ) : (
          <ul className="flex-1 divide-y divide-hair overflow-y-auto px-5 sm:px-7">
            {lines.map((line) => {
              const href = line.parts ? "/hampers/build" : `/product/${line.slug}`;
              const variant = [line.colour, line.size].filter(Boolean).join(" · ");
              return (
                <li key={line.id} className="py-6">
                  <div className="flex gap-4">
                    <Link
                      href={href}
                      onClick={() => setOpen(false)}
                      aria-hidden="true"
                      tabIndex={-1}
                      className="grid size-20 shrink-0 place-items-center rounded-2xl"
                      style={{
                        background: `radial-gradient(circle at 50% 42%, color-mix(in srgb, ${line.product.tint} 60%, transparent), var(--color-pine-2) 80%)`,
                      }}
                    >
                      {line.photo ? (
                        // eslint-disable-next-line @next/next/no-img-element -- a small saved preview of the customer's photo
                        <img src={line.photo.thumb} alt="Your photo" className="size-full rounded-2xl object-cover" />
                      ) : (
                        <ProductArt category={line.product.category} className="w-10 text-gold-light" />
                      )}
                    </Link>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <Link
                          href={href}
                          onClick={() => setOpen(false)}
                          className="font-serif text-xl leading-tight transition-colors hover:text-gold-light"
                        >
                          {line.product.name}
                        </Link>
                        <button
                          type="button"
                          onClick={() => remove(line.id)}
                          aria-label={`Remove ${line.product.name}`}
                          className="-mr-2 -mt-1 grid size-9 shrink-0 place-items-center rounded-full text-lg text-faint transition-[transform,color] duration-300 ease-bounce hover:text-cream active:scale-90"
                        >
                          ×
                        </button>
                      </div>
                      {variant && <p className="mt-0.5 text-sm text-faint">{variant}</p>}
                      {line.parts && (
                        <ul className="mt-2 space-y-1 text-sm text-mist">
                          {line.parts.map((part, i) => (
                            <li key={i}>
                              {describePart(part, productBySlug)}
                              {part.photo && <span className="text-faint"> · your photo</span>}
                            </li>
                          ))}
                        </ul>
                      )}

                      <div className="mt-3 flex items-center justify-between gap-3">
                        {line.parts ? (
                          <span className="text-sm text-faint">1 hamper</span>
                        ) : (
                        <div
                          className="flex h-10 items-center rounded-full border border-hair-2"
                          role="group"
                          aria-label={`Quantity of ${line.product.name}`}
                        >
                          <button
                            type="button"
                            onClick={() => setQty(line.id, line.qty - 1)}
                            disabled={line.qty <= 1}
                            aria-label="One fewer"
                            className="grid h-full w-10 place-items-center transition-transform duration-300 ease-bounce enabled:active:scale-75 disabled:text-faint"
                          >
                            −
                          </button>
                          <span className="w-6 text-center text-sm tabular-nums">{line.qty}</span>
                          <button
                            type="button"
                            onClick={() => setQty(line.id, line.qty + 1)}
                            disabled={line.qty >= Math.min(MAX_QTY, line.left)}
                            aria-label="One more"
                            className="grid h-full w-10 place-items-center transition-transform duration-300 ease-bounce enabled:active:scale-75 disabled:text-faint"
                          >
                            +
                          </button>
                        </div>
                        )}
                        <p className="text-gold-light tabular-nums">{formatPrice(line.total)}</p>
                      </div>
                    </div>
                  </div>

                  {line.left <= 0 && (
                    <p className="mt-4 rounded-xl border border-berry-light/50 bg-berry/20 px-4 py-3 text-sm">
                      This one is sold out now. Remove it to continue.
                    </p>
                  )}

                  <details className="group mt-4" open={line.wrap || line.note.length > 0}>
                    <summary className="flex cursor-pointer list-none items-center justify-between text-sm text-mist transition-colors hover:text-cream [&::-webkit-details-marker]:hidden">
                      <span>
                        {line.wrap || line.note ? "Gift options" : "Make it a gift"}
                        {(line.wrap || line.note) && (
                          <span className="ml-2 text-xs text-gold-light">
                            {[line.wrap && "wrapped", line.note && "handwritten card"]
                              .filter(Boolean)
                              .join(" + ")}
                          </span>
                        )}
                      </span>
                      <span
                        aria-hidden="true"
                        className="text-xl font-light text-gold transition-transform duration-500 ease-bounce group-open:rotate-45"
                      >
                        +
                      </span>
                    </summary>
                    <div className="mt-3">
                      <GiftOptions
                        product={line.product}
                        wrap={line.wrap}
                        note={line.note}
                        onChange={(gift) => setGift(line.id, gift)}
                      />
                    </div>
                  </details>
                </li>
              );
            })}
          </ul>
        )}

        {lines.length > 0 && (
          <div className="border-t border-hair bg-night/60 px-5 py-6 sm:px-7">
            <p className="flex items-baseline justify-between">
              <span className="text-mist">Subtotal</span>
              <span className="font-serif text-3xl tabular-nums">{formatPrice(subtotal)}</span>
            </p>
            <p className="mt-1 text-sm text-faint">
              {subtotal >= settings.freeShippingOver
                ? "Delivery is free on this order."
                : `Add ${formatPrice(settings.freeShippingOver - subtotal)} more for free delivery. Otherwise delivery is worked out at checkout.`}
            </p>
            {settings.checkoutOpen && !unavailable ? (
              <Link href="/checkout" onClick={() => setOpen(false)} className="btn btn-gold mt-5 w-full">
                Checkout
              </Link>
            ) : (
              <button
                type="button"
                disabled
                className="btn btn-gold mt-5 w-full disabled:pointer-events-none disabled:opacity-55 disabled:saturate-50"
              >
                {unavailable ? "Remove sold-out items" : "Checkout opens soon"}
              </button>
            )}
          </div>
        )}
      </div>
    </dialog>
  );
}
