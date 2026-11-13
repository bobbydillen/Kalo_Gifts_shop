"use client";

import { useState } from "react";
import { CARD_OCCASIONS } from "@/lib/card-ideas";

/**
 * Tap an occasion to fill the card message with a ready-made one; tap again for the next.
 * It never overwrites something the customer typed: once they write their own words the
 * chips wait until the box is cleared.
 */
export function MessageIdeas({
  value,
  max,
  onPick,
}: {
  value: string;
  max: number;
  onPick: (message: string) => void;
}) {
  const [last, setLast] = useState<{ occasion: string; index: number; text: string } | null>(null);

  const showing = last && value === last.text ? last : null;
  const ownWords = value.trim() !== "" && !showing;

  function pick(id: string, ideas: string[]) {
    if (ownWords) return;
    const index = showing?.occasion === id ? (showing.index + 1) % ideas.length : 0;
    const text = ideas[index];
    setLast({ occasion: id, index, text });
    onPick(text);
  }

  const occasions = CARD_OCCASIONS.map((o) => ({ ...o, ideas: o.ideas.filter((i) => i.length <= max) })).filter(
    (o) => o.ideas.length > 0,
  );
  if (!occasions.length) return null;

  return (
    <div className="mt-3">
      <p className="text-xs text-faint">
        {ownWords ? "Clear the box to see ideas again." : "Not sure what to write? Tap an idea, then change it however you like."}
      </p>
      <ul className="mt-2 flex flex-wrap gap-2">
        {occasions.map((o) => (
          <li key={o.id}>
            <button
              type="button"
              disabled={ownWords}
              aria-pressed={showing?.occasion === o.id}
              onClick={() => pick(o.id, o.ideas)}
              className="rounded-full border border-hair-2 px-3 py-1.5 text-xs text-mist transition-[border-color,background-color,transform] duration-500 ease-bounce enabled:hover:border-gold enabled:active:scale-95 disabled:opacity-40 aria-pressed:border-gold aria-pressed:bg-gold/10 aria-pressed:text-cream"
            >
              {o.label}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
