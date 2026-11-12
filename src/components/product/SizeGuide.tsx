"use client";

import { useRef, useState } from "react";
import { sizeChart, sizeTolerance } from "@/lib/size-charts";

/** "Size guide" link that opens the measurement table, in inches or centimetres. */
export function SizeGuide() {
  const dialog = useRef<HTMLDialogElement>(null);
  const [unit, setUnit] = useState<"in" | "cm">("in");

  return (
    <>
      <button
        type="button"
        onClick={() => dialog.current?.showModal()}
        className="text-sm text-gold-light underline decoration-gold/40 underline-offset-4 transition-colors hover:decoration-gold-light"
      >
        Size guide
      </button>

      <dialog
        ref={dialog}
        aria-labelledby="size-guide-title"
        onClick={(e) => e.target === dialog.current && dialog.current?.close()}
        className="sheet-dialog"
      >
        <div className="rounded-[24px] border border-hair-2 bg-pine p-6 sm:p-9">
          <div className="flex items-start justify-between gap-6">
            <div>
              <p className="kicker">Find your fit</p>
              <h2 id="size-guide-title" className="mt-3 text-4xl">
                Size <em>guide</em>
              </h2>
            </div>
            <button
              type="button"
              onClick={() => dialog.current?.close()}
              aria-label="Close size guide"
              className="grid size-11 shrink-0 place-items-center rounded-full border border-hair-2 text-xl transition-[transform,border-color] duration-500 ease-bounce hover:border-gold active:scale-90"
            >
              ×
            </button>
          </div>

          <div className="mt-6 inline-flex rounded-full border border-hair-2 p-1" role="group" aria-label="Units">
            {(["in", "cm"] as const).map((u) => (
              <button
                key={u}
                type="button"
                aria-pressed={unit === u}
                onClick={() => setUnit(u)}
                className="rounded-full px-5 py-1.5 text-sm transition-colors aria-pressed:bg-cream aria-pressed:text-night"
              >
                {u === "in" ? "Inches" : "Centimetres"}
              </button>
            ))}
          </div>

          <table className="mt-6 w-full text-left tabular-nums">
            <thead>
              <tr className="border-b border-hair-2 text-[0.6875rem] uppercase tracking-[0.2em] text-faint">
                <th scope="col" className="py-3 font-normal">
                  Size
                </th>
                <th scope="col" className="py-3 font-normal">
                  Chest
                </th>
                <th scope="col" className="py-3 font-normal">
                  Length
                </th>
              </tr>
            </thead>
            <tbody>
              {sizeChart.map((row) => (
                <tr key={row.size} className="border-b border-hair">
                  <th scope="row" className="py-3.5 font-serif text-xl font-normal">
                    {row.size}
                  </th>
                  <td className="py-3.5">{unit === "in" ? row.chestIn : row.chestCm}</td>
                  <td className="py-3.5">{unit === "in" ? row.lengthIn : row.lengthCm}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <p className="mt-5 text-sm text-mist">
            Chest is measured all the way around the garment at chest level. Length runs from the
            highest point of the shoulder to the hem. {sizeTolerance}
          </p>
          <p className="mt-2 text-sm text-mist">
            Tip: lay a piece you already own flat and compare its measurements.
          </p>
        </div>
      </dialog>
    </>
  );
}
