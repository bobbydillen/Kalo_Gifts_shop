"use client";

import { useEffect, useState } from "react";

/**
 * On phones, a bar fixed to the bottom of the screen with the price and a button that brings the
 * size and "Add to bag" choices into view. It hides while those choices are already on screen.
 */
export function StickyBuyBar({ name, price, target }: { name: string; price: string; target: string }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const el = document.getElementById(target);
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setShow(!entry.isIntersecting), { rootMargin: "0px 0px -10% 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, [target]);

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-30 border-t border-hair bg-night/90 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-xl transition-transform duration-500 ease-glide lg:hidden print:hidden ${
        show ? "translate-y-0" : "translate-y-full"
      }`}
      aria-hidden={!show}
    >
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate font-serif text-lg leading-tight">{name}</p>
          <p className="text-sm text-gold-light">{price}</p>
        </div>
        <button
          type="button"
          tabIndex={show ? 0 : -1}
          onClick={() => document.getElementById(target)?.scrollIntoView({ behavior: "smooth", block: "center" })}
          className="rounded-full bg-gold px-5 py-3 text-sm font-semibold text-night transition-colors hover:bg-gold-light"
        >
          Choose size
        </button>
      </div>
    </div>
  );
}
