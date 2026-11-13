"use client";

import { useEffect, useId, useRef, useState } from "react";
import { CardPreview } from "@/components/bag/CardPreview";
import { useSettings } from "@/components/settings/SettingsProvider";
import { formatPrice } from "@/lib/catalog";

/**
 * A friendly window offered when someone adds an item to the bag without a handwritten card.
 * It shows a real card, lets them write the message with a live preview, and either adds the
 * card or carries on without it. Closing the window (Esc or ×) adds nothing.
 */
export function CardPrompt({
  open,
  onClose,
  onChoose,
}: {
  open: boolean;
  onClose: () => void;
  /** Called with the message to add a card, or "" to carry on without one. */
  onChoose: (message: string) => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const noteId = useId();
  const { giftCardPrice, giftCardMaxChars } = useSettings();
  const [message, setMessage] = useState("");

  useEffect(() => {
    const el = dialog.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  return (
    <dialog
      ref={dialog}
      aria-labelledby={`${noteId}-title`}
      onClose={onClose}
      onClick={(e) => e.target === dialog.current && onClose()}
      className="m-auto max-h-[92dvh] w-[min(94vw,34rem)] max-w-none overflow-y-auto rounded-3xl border border-hair-2 bg-pine p-0 text-cream backdrop:bg-night/80 backdrop:backdrop-blur-sm"
    >
      <div className="relative">
        {/* eslint-disable-next-line @next/next/no-img-element -- one photo shown on demand */}
        <img
          src="/gifting/handwritten-card.webp"
          alt="A red envelope and a black card with a message written by hand in white ink"
          className="h-36 w-full object-cover sm:h-48"
        />
        <button
          type="button"
          onClick={onClose}
          aria-label="Close without adding"
          className="absolute right-3 top-3 grid size-10 place-items-center rounded-full border border-hair-2 bg-night/60 text-xl backdrop-blur"
        >
          ×
        </button>
      </div>

      <div className="p-5 sm:p-6">
        <p className="kicker">Make it personal</p>
        <h2 id={`${noteId}-title`} className="mt-2 text-3xl">
          Add a <em>handwritten</em> card?
        </h2>
        <p className="mt-2 text-mist">
          We write your message by hand and tuck it in with your gift, just like this one. It is {formatPrice(giftCardPrice)}.
        </p>

        <label htmlFor={noteId} className="mt-5 block text-xs uppercase tracking-[0.18em] text-faint">
          Your message
        </label>
        <textarea
          id={noteId}
          rows={3}
          maxLength={giftCardMaxChars}
          value={message}
          onChange={(e) => setMessage(e.target.value.slice(0, giftCardMaxChars))}
          placeholder="For example: Thinking of you this Christmas."
          className="mt-2 block w-full resize-none rounded-xl border border-hair-2 bg-transparent p-3 font-serif text-lg italic leading-snug text-cream placeholder:text-faint focus:border-gold focus:outline-none"
        />
        <p className="mt-1 text-right text-xs tabular-nums text-faint" aria-live="polite">
          {message.length}/{giftCardMaxChars}
        </p>

        <div className="mt-3">
          <CardPreview message={message} />
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            disabled={!message.trim()}
            onClick={() => onChoose(message.trim())}
            className="btn btn-gold disabled:pointer-events-none disabled:opacity-50"
          >
            Add card · {formatPrice(giftCardPrice)}
          </button>
          <button type="button" onClick={() => onChoose("")} className="btn btn-outline">
            No thanks, just add
          </button>
        </div>
      </div>
    </dialog>
  );
}
