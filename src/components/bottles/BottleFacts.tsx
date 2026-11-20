"use client";

import { useEffect, useRef, useState } from "react";
import type { BottleStyle } from "@/lib/bottles";

/**
 * "Good to know" for a bottle style: a bottle outline that fills with water when it comes into view
 * (showing the capacity), hot and cold times with a little steam and frost, and the feature list.
 */
export function BottleFacts({ style }: { style: BottleStyle }) {
  const box = useRef<HTMLDivElement>(null);
  const [seen, setSeen] = useState(false);
  const insulated = style.coldHours > 0 || style.features.some(([a, b]) => /insulat|cold|hot/i.test(`${a} ${b}`));

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setSeen(true), { threshold: 0.4 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section aria-labelledby="bottle-facts" className="rounded-[22px] border border-hair bg-pine/60 p-6 sm:p-8">
      <h2 id="bottle-facts" className="text-2xl">
        About the <em>{style.name}</em>
      </h2>
      <p className="mt-3 text-sm text-mist">{style.intro}</p>

      <div ref={box} className="mt-6 grid grid-cols-[auto_1fr] items-center gap-6">
        {/* the bottle fills up */}
        <svg viewBox="0 0 60 120" className="h-32 w-16" aria-hidden="true">
          <defs>
            <clipPath id="bottle-shape">
              <path d="M22 4h16v10c0 3 10 6 10 16v80c0 4-3 6-6 6H18c-3 0-6-2-6-6V30c0-10 10-13 10-16z" />
            </clipPath>
          </defs>
          <g clipPath="url(#bottle-shape)">
            <rect x="0" y="0" width="60" height="120" fill="rgba(243,236,223,0.06)" />
            <g
              style={{
                transform: `translateY(${seen ? 30 : 120}px)`,
                transition: "transform 2.2s cubic-bezier(0.16, 1, 0.3, 1)",
              }}
            >
              <path d="M0 6 Q 7.5 0 15 6 T 30 6 T 45 6 T 60 6 T 75 6 V 120 H 0 Z" fill="#6fb6d6" opacity="0.85" className="motion-safe:animate-[bottle-wave_2.6s_ease-in-out_infinite]" />
            </g>
          </g>
          <path d="M22 4h16v10c0 3 10 6 10 16v80c0 4-3 6-6 6H18c-3 0-6-2-6-6V30c0-10 10-13 10-16z" fill="none" stroke="#d4b373" strokeWidth="1.6" />
        </svg>
        <div>
          {style.capacityMl > 0 && (
            <p className="font-serif text-4xl text-gold-light">
              {style.capacityMl} <span className="font-sans text-base text-mist">ml</span>
            </p>
          )}
          {insulated && (
          <ul className="mt-3 flex flex-wrap gap-3 text-sm">
            <li className="flex items-center gap-2 rounded-full border border-hair-2 px-3 py-1.5">
              <span aria-hidden="true" className="text-[#9fd3ec] motion-safe:animate-pulse">❄</span>
              {style.coldHours ? `Cold up to ${style.coldHours} hours` : "Keeps drinks cold"}
            </li>
            <li className="flex items-center gap-2 rounded-full border border-hair-2 px-3 py-1.5">
              <span aria-hidden="true" className="relative text-[#f0a46a]">
                ♨
              </span>
              {style.hotHours ? `Hot up to ${style.hotHours} hours` : "Keeps drinks hot"}
            </li>
          </ul>
          )}
        </div>
      </div>

      <ul className="mt-6 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
        {style.features.map(([title, text]) => (
          <li key={title} className="flex gap-2">
            <span aria-hidden="true" className="text-gold">✦</span>
            <span>
              <span className="text-cream">{title}</span>
              {text && <span className="text-mist">: {text}</span>}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
