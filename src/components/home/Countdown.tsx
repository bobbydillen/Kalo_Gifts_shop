"use client";

import { useSettings } from "@/components/settings/SettingsProvider";
import { timeLeft, useNow } from "@/lib/use-now";

/** One digit that rolls to its new value like an odometer wheel. */
function Digit({ value }: { value: number }) {
  return (
    <span className="inline-block h-[1em] overflow-hidden leading-none">
      <span
        className="flex flex-col transition-transform duration-700 ease-bounce"
        style={{ transform: `translateY(-${value * 10}%)` }}
      >
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
          <span key={n} className="h-[1em]">
            {n}
          </span>
        ))}
      </span>
    </span>
  );
}

function Unit({ value, label }: { value: number; label: string }) {
  const text = String(value).padStart(2, "0");
  return (
    <div className="border-l border-hair px-2 py-5 text-center first:border-l-0">
      <b
        aria-hidden="true"
        className="block font-serif text-[clamp(2rem,3.6vw,3.25rem)] font-normal tabular-nums lining-nums"
      >
        {text.split("").map((d, i) => (
          <Digit key={text.length - i} value={Number(d)} />
        ))}
      </b>
      <span className="mt-2 block text-[0.625rem] uppercase tracking-[0.24em] text-faint">{label}</span>
    </div>
  );
}

/**
 * Counts down to Christmas morning.
 * Hidden when the countdown switch is off or Christmas has passed.
 */
export function Countdown() {
  const now = useNow();
  const settings = useSettings();
  if (!settings.countdown) return null;

  const t = timeLeft(now, settings.christmasDate);
  if (t.over) return null;

  const note = "until Christmas morning";

  return (
    <div className="w-full max-w-md">
      <div
        role="timer"
        aria-label={`${t.days} days, ${t.hours} hours and ${t.mins} minutes ${note}`}
        className="grid grid-cols-4 rounded-[18px] border border-hair-2 bg-night/35 backdrop-blur-md"
      >
        <Unit value={t.days} label="Days" />
        <Unit value={t.hours} label="Hours" />
        <Unit value={t.mins} label="Min" />
        <Unit value={t.secs} label="Sec" />
      </div>
      <p className="mt-3 text-center font-serif italic text-mist">{note}</p>
    </div>
  );
}
