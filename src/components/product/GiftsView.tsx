"use client";

import { useEffect, useState, type ReactNode } from "react";

type View = "all" | "showroom";
const KEY = "kalo-gifts-view";

/**
 * The All gifts page: a fast grid of every product, or the showrooms (rail, bottle shelves, gallery
 * wall). A first visit opens on the grid, with an invitation to try the showroom; after that the page
 * opens on whichever the visitor chose last.
 */
export function GiftsView({ all, showroom }: { all: ReactNode; showroom: ReactNode }) {
  const [view, setView] = useState<View>("all");

  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- restoring the visitor's last choice after hydration
      if (localStorage.getItem(KEY) === "showroom") setView("showroom");
    } catch {
      // storage unavailable: stay on the grid
    }
  }, []);

  const choose = (v: View) => {
    setView(v);
    try {
      localStorage.setItem(KEY, v);
    } catch {
      // not remembered
    }
    window.scrollTo({ top: Math.min(window.scrollY, 260), behavior: "smooth" });
  };

  return (
    <div className="mt-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div role="radiogroup" aria-label="How to see the gifts" className="flex rounded-full border border-hair-2 p-1 text-sm">
          {(
            [
              ["all", "All products"],
              ["showroom", "Showroom"],
            ] as const
          ).map(([v, label]) => (
            <button
              key={v}
              type="button"
              role="radio"
              aria-checked={view === v}
              onClick={() => choose(v)}
              className="rounded-full px-4 py-2 text-mist transition-colors duration-300 aria-checked:bg-cream aria-checked:text-night"
            >
              {label}
            </button>
          ))}
        </div>
        {view === "all" && (
          <button
            type="button"
            onClick={() => choose("showroom")}
            className="group flex items-center gap-3 rounded-full border border-gold/50 bg-pine/70 py-2 pl-4 pr-2 text-sm text-gold-light transition-colors hover:border-gold"
          >
            Try the showroom: tees on a rail, bottles on shelves, frames on a wall
            <span className="grid size-8 place-items-center rounded-full bg-gold text-night transition-transform duration-300 group-hover:translate-x-0.5">→</span>
          </button>
        )}
      </div>
      <div key={view} className="animate-[fade-in_0.5s_ease]">
        {view === "all" ? <div className="mt-10">{all}</div> : showroom}
      </div>
    </div>
  );
}
