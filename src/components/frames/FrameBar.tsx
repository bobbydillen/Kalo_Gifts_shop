"use client";

import { useEffect, useState, type ReactNode } from "react";
import type { Product } from "@/lib/catalog";
import { FrameWall } from "./FrameWall";

type Mode = "wall" | "grid";
const MODE_KEY = "kalo-frame-view";

/** The verse frames on the gallery wall, with a switch to the plain product grid. */
export function FrameBar({ frames, grid, extra }: { frames: Product[]; grid: ReactNode; extra?: ReactNode }) {
  const [mode, setMode] = useState<Mode>("wall");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(MODE_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- restoring a saved preference after hydration
      if (saved === "wall" || saved === "grid") setMode(saved);
    } catch {
      // storage unavailable
    }
  }, []);
  const choose = (m: Mode) => {
    setMode(m);
    try {
      localStorage.setItem(MODE_KEY, m);
    } catch {
      // not remembered
    }
  };

  return (
    <section aria-label="The gallery wall">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-xs uppercase tracking-[0.28em] text-faint">
          The gallery wall <span className="text-gold">·</span> {frames.length} verse prints
        </p>
        <div role="radiogroup" aria-label="How to browse" className="flex rounded-full border border-hair-2 p-1 text-xs">
          {(
            [
              ["wall", "Wall"],
              ["grid", "Grid"],
            ] as const
          ).map(([m, label]) => (
            <button
              key={m}
              type="button"
              role="radio"
              aria-checked={mode === m}
              onClick={() => choose(m)}
              className="rounded-full px-3.5 py-1.5 text-mist transition-colors duration-300 aria-checked:bg-cream aria-checked:text-night"
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      {mode === "wall" ? (
        <>
          <div className="relative -mx-4 mt-8 overflow-hidden rounded-none bg-[linear-gradient(180deg,#0f241c,#0b1d16_70%)] py-6 sm:-mx-6 lg:rounded-[28px]">
            <FrameWall items={frames} />
          </div>
          {extra}
        </>
      ) : (
        <div className="mt-8">{grid}</div>
      )}
    </section>
  );
}
