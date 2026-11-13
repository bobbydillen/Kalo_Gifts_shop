"use client";

import { useId, useState } from "react";
import { CardPhoto } from "@/components/bag/CardPhoto";
import { CardPreview } from "@/components/bag/CardPreview";
import { formatPrice, type Product } from "@/lib/catalog";
import { useSettings } from "@/components/settings/SettingsProvider";
import { canGiftWrap } from "@/lib/gifting";

type Gift = { wrap: boolean; note: string };

function Option({
  on,
  onToggle,
  title,
  hint,
  price,
}: {
  on: boolean;
  onToggle: () => void;
  title: string;
  hint: string;
  price: number;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={onToggle}
      className="group flex w-full items-center gap-4 rounded-2xl border border-hair-2 px-4 py-3 text-left transition-[border-color,background-color,transform] duration-500 ease-bounce hover:border-gold active:scale-[0.98] aria-checked:border-gold aria-checked:bg-gold/10"
    >
      <span
        aria-hidden="true"
        className="relative h-6 w-10 shrink-0 rounded-full bg-hair-2 transition-colors duration-500 group-aria-checked:bg-gold"
      >
        <span className="absolute left-1 top-1 size-4 rounded-full bg-cream transition-transform duration-500 ease-bounce group-aria-checked:translate-x-4 group-aria-checked:bg-night" />
      </span>
      <span className="flex-1">
        <span className="block text-sm">{title}</span>
        <span className="block text-xs text-faint">{hint}</span>
      </span>
      <span className="text-sm text-gold-light">+{formatPrice(price)}</span>
    </button>
  );
}

/**
 * Gift wrap and handwritten card choices. Used on the product page and for each
 * line in the bag. The card opens a box for the message, up to the limit set in the admin.
 */
export function GiftOptions({
  product,
  wrap,
  note,
  onChange,
}: {
  product: Product;
  wrap: boolean;
  note: string;
  onChange: (gift: Gift) => void;
}) {
  const noteId = useId();
  const { giftWrapPrice, giftCardPrice, giftCardMaxChars } = useSettings();
  const [cardOpen, setCardOpen] = useState(note.length > 0);

  return (
    <div className="space-y-2.5">
      {canGiftWrap(product) && (
        <Option
          on={wrap}
          onToggle={() => onChange({ wrap: !wrap, note })}
          title="Gift wrap"
          hint="Wrapped and ready to hand over"
          price={giftWrapPrice}
        />
      )}

      <Option
        on={cardOpen}
        onToggle={() => {
          if (cardOpen) {
            setCardOpen(false);
            onChange({ wrap, note: "" });
          } else {
            setCardOpen(true);
          }
        }}
        title="Handwritten card"
        hint="We write your message by hand and tuck it inside"
        price={giftCardPrice}
      />

      {!cardOpen && <CardPhoto />}

      {cardOpen && (
        <div className="rounded-2xl border border-hair-2 bg-night/40 p-4">
          <label htmlFor={noteId} className="text-xs uppercase tracking-[0.18em] text-faint">
            Your message
          </label>
          <textarea
            id={noteId}
            rows={4}
            maxLength={giftCardMaxChars}
            value={note}
            onChange={(e) => onChange({ wrap, note: e.target.value.slice(0, giftCardMaxChars) })}
            placeholder="Write a few lines for them. For example: Thinking of you this Christmas."
            className="mt-2 block w-full resize-none rounded-xl border border-hair-2 bg-transparent p-3 font-serif text-lg italic leading-snug text-cream placeholder:text-faint focus:border-gold focus:outline-none"
          />
          <p className="mt-2 flex justify-between text-xs text-faint">
            <span>{note.trim() ? "" : `The card is added once you write a message.`}</span>
            <span aria-live="polite" className="tabular-nums">
              {note.length}/{giftCardMaxChars}
            </span>
          </p>
          <div className="mt-3">
            <CardPreview message={note} />
          </div>
          <div className="mt-3">
            <CardPhoto />
          </div>
        </div>
      )}
    </div>
  );
}
