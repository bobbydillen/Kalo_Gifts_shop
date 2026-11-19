"use client";

import Link from "next/link";
import { useCallback, useEffect, useLayoutEffect, useRef, useState, ViewTransition, type ReactNode } from "react";
import { formatPrice, fromPrice, type Product } from "@/lib/catalog";
import { garmentPhotos, garmentTransitionName } from "@/lib/garment";
import { gsap } from "@/lib/gsap";
import { GarmentSide, PriceTag } from "./Garment";

const VIEW_KEY = "kalo-wear-view";
const pad = (n: number) => String(n).padStart(2, "0");

type View = "rail" | "grid";

/**
 * The wear "drop": every garment hanging on one brass rail. They sway when you brush past them
 * (mouse) or swipe the rail (phone), each with a kraft price tag. On a computer a garment turns round
 * when you point at it; on a phone the small round button turns it. Tapping a garment opens its page,
 * and the garment travels there. A Rail / Grid switch shows a plain product grid instead.
 */
export function DropRail({ products, grid, label = "Drop 01" }: { products: Product[]; grid: ReactNode; label?: string }) {
  const [view, setView] = useState<View>("rail");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(VIEW_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- restoring a saved preference after hydration
      if (saved === "grid" || saved === "rail") setView(saved);
    } catch {
      // storage unavailable: keep the rail
    }
  }, []);

  const choose = (v: View) => {
    setView(v);
    try {
      localStorage.setItem(VIEW_KEY, v);
    } catch {
      // not remembered, which is fine
    }
  };

  return (
    <section aria-label={`${label}, ${products.length} pieces`}>
      <div className="flex items-center justify-between gap-4">
        <p className="text-xs uppercase tracking-[0.28em] text-faint">
          {label} <span className="text-gold">·</span> {products.length} pieces
        </p>
        <div role="radiogroup" aria-label="How to show the pieces" className="flex rounded-full border border-hair-2 p-1 text-xs">
          {(["rail", "grid"] as const).map((v) => (
            <button
              key={v}
              type="button"
              role="radio"
              aria-checked={view === v}
              onClick={() => choose(v)}
              className="flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-mist transition-colors duration-300 aria-checked:bg-cream aria-checked:text-night"
            >
              {v === "rail" ? <RailIcon /> : <GridIcon />}
              {v === "rail" ? "Rail" : "Grid"}
            </button>
          ))}
        </div>
      </div>
      {view === "rail" ? <Rail products={products} /> : <div className="mt-6">{grid}</div>}
    </section>
  );
}

function Rail({ products }: { products: Product[] }) {
  const wrap = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const swings = useRef<(HTMLDivElement | null)[]>([]);
  const tags = useRef<(HTMLSpanElement | null)[]>([]);
  const physics = useRef(products.map(() => ({ a: 0, v: 0, ta: 0, tv: 0 })));
  const frame = useRef(0);
  const reduce = useRef(false);
  const [turned, setTurned] = useState<boolean[]>(() => products.map(() => false));
  const [focus, setFocus] = useState(0);
  const sides = products.map((p) => garmentPhotos(p).sides);

  /** The swing loop: a damped spring per garment, and a looser one for its tag. Stops when still. */
  const run = useCallback(() => {
    if (frame.current || reduce.current) return;
    let last = performance.now();
    const step = (now: number) => {
      const dt = Math.min(0.04, (now - last) / 1000);
      last = now;
      let moving = false;
      physics.current.forEach((s, i) => {
        s.v += (-38 * s.a - 3.1 * s.v) * dt;
        s.a += s.v * dt;
        s.tv += (-26 * (s.ta - s.a * 0.6) - 2.2 * s.tv) * dt;
        s.ta += s.tv * dt;
        if (Math.abs(s.a) + Math.abs(s.v) * 0.05 + Math.abs(s.ta) + Math.abs(s.tv) * 0.05 > 0.02) moving = true;
        const el = swings.current[i];
        if (el) el.style.transform = `rotate(${s.a.toFixed(3)}deg)`;
        const tag = tags.current[i];
        if (tag) tag.style.transform = `rotate(${(s.ta - s.a).toFixed(3)}deg)`;
      });
      frame.current = moving ? requestAnimationFrame(step) : 0;
    };
    frame.current = requestAnimationFrame(step);
  }, []);

  const push = useCallback(
    (i: number, impulse: number) => {
      const s = physics.current[i];
      if (!s) return;
      s.v = Math.max(-140, Math.min(140, s.v + impulse));
      s.tv = Math.max(-200, Math.min(200, s.tv + impulse * 1.4));
      run();
    },
    [run],
  );

  // the garments drop onto the rail and settle
  useLayoutEffect(() => {
    reduce.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce.current) return;
    const els = swings.current.filter(Boolean) as HTMLDivElement[];
    gsap.fromTo(
      els.map((el) => el.parentElement),
      { y: -36, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.9, ease: "expo.out", stagger: 0.08, onStart: () => products.forEach((_, i) => push(i, (i % 2 ? 1 : -1) * (40 + i * 6))) },
    );
    const f = frame;
    return () => cancelAnimationFrame(f.current);
  }, [products, push]);

  // phone: swiping the rail swings everything, and the centred garment sets the colour
  useEffect(() => {
    const el = track.current;
    if (!el) return;
    let prev = el.scrollLeft;
    const onScroll = () => {
      const dx = el.scrollLeft - prev;
      prev = el.scrollLeft;
      if (Math.abs(dx) > 0.5) products.forEach((_, i) => push(i, -dx * 0.9));
      const mid = el.scrollLeft + el.clientWidth / 2;
      let best = 0;
      let bestD = Infinity;
      Array.from(el.children).forEach((child, i) => {
        const c = child as HTMLElement;
        const d = Math.abs(c.offsetLeft + c.offsetWidth / 2 - mid);
        if (d < bestD) {
          bestD = d;
          best = i;
        }
      });
      setFocus(best);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [products, push]);

  // computer: brushing the pointer past garments makes them sway
  const pointer = useRef({ x: 0, t: 0 });
  const onPointerMove = (e: React.PointerEvent) => {
    if (e.pointerType !== "mouse") return;
    const now = performance.now();
    const vx = (e.clientX - pointer.current.x) / Math.max(1, now - pointer.current.t); // px per ms
    pointer.current = { x: e.clientX, t: now };
    if (Math.abs(vx) > 5) return; // the first move after entering
    swings.current.forEach((el, i) => {
      if (!el) return;
      const r = el.getBoundingClientRect();
      const near = 1 - Math.min(1, Math.abs(e.clientX - (r.left + r.width / 2)) / (r.width * 0.75));
      if (near > 0) push(i, -vx * 34 * near);
    });
  };

  const setTurn = (i: number, value: boolean) => setTurned((t) => (t[i] === value ? t : t.map((x, k) => (k === i ? value : x))));

  const tint = products[focus]?.tint ?? "#1b4436";

  return (
    <div ref={wrap} className="relative -mx-4 mt-6 overflow-hidden sm:-mx-6">
      {/* the colour of the garment in front, as a soft light */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[85%] transition-[background-color] duration-1000"
        style={{
          backgroundColor: `color-mix(in srgb, ${tint} 55%, transparent)`,
          maskImage: "radial-gradient(ellipse 60% 55% at 50% 45%, black, transparent 75%)",
          WebkitMaskImage: "radial-gradient(ellipse 60% 55% at 50% 45%, black, transparent 75%)",
        }}
      />
      {/* the rail */}
      <div aria-hidden="true" className="absolute inset-x-0 top-[2.75rem] z-0 h-[7px]">
        <div className="h-full bg-[linear-gradient(180deg,#fff1c9_0%,#e2c27e_35%,#a8823f_75%,#6e5328_100%)] shadow-[0_6px_14px_-4px_rgba(0,0,0,0.8)]" />
      </div>

      <div
        ref={track}
        onPointerMove={onPointerMove}
        className="no-scrollbar relative flex snap-x snap-mandatory gap-[7vw] overflow-x-auto overscroll-x-contain px-[11vw] pb-12 pt-[2.75rem] sm:gap-[4vw] sm:px-[27vw] lg:snap-none lg:justify-center lg:gap-6 lg:px-6"
      >
        {products.map((p, i) => {
          const s = sides[i];
          const canTurn = s.length === 2;
          const price = formatPrice(fromPrice(p).price);
          return (
            <div key={p.slug} className="relative w-[78vw] shrink-0 snap-center sm:w-[46vw] lg:w-[min(17.5vw,265px)]">
              <div
                ref={(el) => {
                  swings.current[i] = el;
                }}
                className="relative z-10"
                style={{ transformOrigin: "50% 0%" }}
              >
                <Link
                  href={`/product/${p.slug}`}
                  aria-label={`${p.name}, ${price}`}
                  className="group block"
                  style={{ perspective: "1200px" }}
                  onPointerEnter={(e) => {
                    if (e.pointerType === "mouse") {
                      setFocus(i);
                      if (canTurn) setTurn(i, true);
                    }
                  }}
                  onPointerLeave={(e) => e.pointerType === "mouse" && canTurn && setTurn(i, false)}
                >
                  <ViewTransition name={garmentTransitionName(p.slug)} share="morph" default="none">
                    <span
                      className="relative mt-[7%] block aspect-[1000/1150] transition-transform duration-[900ms] ease-glide"
                      style={{ transformStyle: "preserve-3d", transform: `rotateY(${turned[i] ? 180 : 0}deg)` }}
                    >
                      {s.map((side, k) => (
                        <GarmentSide key={side.side} src={side.src} alt={`${p.name}, ${side.side}`} turned={k === 1} priority={i < 2} />
                      ))}
                    </span>
                  </ViewTransition>
                </Link>
                <span
                  ref={(el) => {
                    tags.current[i] = el;
                  }}
                  className="pointer-events-none absolute left-[72%] top-[-1%] z-20 block"
                  style={{ transformOrigin: "50% 0%" }}
                >
                  <PriceTag number={`${pad(i + 1)} / ${pad(products.length)}`} name={p.name.replace(/ (Tee|Hoodie)$/, "")} price={price} />
                </span>
              </div>

              {canTurn && (
                <button
                  type="button"
                  onClick={() => {
                    setTurn(i, !turned[i]);
                    push(i, turned[i] ? -50 : 50);
                  }}
                  aria-label={`Turn ${p.name} to see the ${turned[i] ? s[0].side : s[1].side}`}
                  className="absolute -bottom-9 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-hair-2 bg-night/60 px-3.5 py-2 text-xs text-cream backdrop-blur transition-colors hover:border-gold hover:text-gold-light lg:hidden"
                >
                  <TurnIcon />
                  {turned[i] ? `See ${s[0].side}` : `See ${s[1].side}`}
                </button>
              )}
            </div>
          );
        })}
      </div>
      <p className="pb-2 text-center text-xs text-faint lg:hidden">Swipe along the rail · tap a piece to open it</p>
      <p className="hidden pb-2 text-center text-xs text-faint lg:block">Point at a piece to turn it round · click to open it</p>
    </div>
  );
}

function TurnIcon() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
      <path d="M4 12a8 8 0 0 1 14-5.3M20 12a8 8 0 0 1-14 5.3M18 3v4h-4M6 21v-4h4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function RailIcon() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <path d="M3 5h18M7 5v2m5-2v2m5-2v2M5 9h4v10H5zM10 9h4v10h-4zM15 9h4v10h-4z" strokeLinejoin="round" />
    </svg>
  );
}

function GridIcon() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <rect x="4" y="4" width="7" height="7" rx="1.5" />
      <rect x="13" y="4" width="7" height="7" rx="1.5" />
      <rect x="4" y="13" width="7" height="7" rx="1.5" />
      <rect x="13" y="13" width="7" height="7" rx="1.5" />
    </svg>
  );
}
