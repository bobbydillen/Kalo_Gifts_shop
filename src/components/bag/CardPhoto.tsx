"use client";

import { useRef } from "react";

/**
 * A small photo of a real handwritten card. Tapping it opens the full photo in a window,
 * so customers see exactly what they are paying for.
 */
export function CardPhoto({ label = "See a real handwritten card" }: { label?: string }) {
  const dialog = useRef<HTMLDialogElement>(null);

  return (
    <>
      <button
        type="button"
        onClick={() => dialog.current?.showModal()}
        className="group flex w-full items-center gap-3 rounded-2xl border border-dashed border-hair-2 p-2 pr-4 text-left transition-[border-color,transform] duration-500 ease-bounce hover:border-gold active:scale-[0.98]"
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- small fixed thumbnail */}
        <img
          src="/gifting/handwritten-card-thumb.webp"
          alt=""
          width={56}
          height={56}
          className="size-14 shrink-0 rounded-xl object-cover"
        />
        <span className="flex-1 text-sm text-mist group-hover:text-cream">{label}</span>
        <span aria-hidden="true" className="text-gold-light">
          →
        </span>
      </button>

      <dialog
        ref={dialog}
        aria-label="A handwritten card"
        onClick={(e) => e.target === dialog.current && dialog.current?.close()}
        className="m-auto w-[min(92vw,56rem)] max-w-none overflow-hidden rounded-3xl border border-hair-2 bg-pine p-0 text-cream backdrop:bg-night/80 backdrop:backdrop-blur-sm"
      >
        <div className="relative">
          {/* eslint-disable-next-line @next/next/no-img-element -- one large photo shown on demand */}
          <img
            src="/gifting/handwritten-card.webp"
            alt="A red envelope and a black card with a message written by hand in white ink"
            className="max-h-[70vh] w-full object-cover"
          />
          <button
            type="button"
            onClick={() => dialog.current?.close()}
            aria-label="Close"
            className="absolute right-3 top-3 grid size-10 place-items-center rounded-full border border-hair-2 bg-night/60 text-xl backdrop-blur"
          >
            ×
          </button>
        </div>
        <div className="p-5 sm:p-6">
          <p className="font-serif text-2xl">
            Written by <em>hand</em>
          </p>
          <p className="mt-2 text-mist">
            Every card is written by hand with your message and tucked in with your gift. This is what it looks like.
          </p>
        </div>
      </dialog>
    </>
  );
}
