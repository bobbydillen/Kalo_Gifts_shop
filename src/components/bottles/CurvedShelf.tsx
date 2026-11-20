"use client";

import Link from "next/link";
import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { bottleShots, bottleStyle, designName } from "@/lib/bottles";
import { formatPrice, type Product } from "@/lib/catalog";
import { PriceTag } from "@/components/wear/Garment";
import { BottleFigure } from "./BottleFigure";

export type ShelfItem = { product: Product; colour?: string };

const designOf = designName;
const pad = (n: number) => String(n).padStart(2, "0");
const STEP = 17; // degrees round the curve from one bottle to the next
const GROW = 0.2; // how much bigger the bottle in the middle is

/** Distance from position p to bottle i, the short way round a circle of n bottles. */
const around = (i: number, p: number, n: number) => {
  let d = (i - p) % n;
  if (d >= n / 2) d -= n;
  if (d < -n / 2) d += n;
  return d;
};

/**
 * A curved shelf of bottles that goes round and round, with its own smooth movement (no page
 * scrolling): drag or swipe and the bottles glide, keep going a little, then ease to a stop with one
 * bottle in the middle. The middle bottle is the biggest and faces you; the others step back and turn.
 * Each bottle wears a kraft price tag that swings as the shelf moves. Tapping a side bottle brings it
 * round to the middle; tapping the middle one opens it.
 */
export function CurvedShelf({ items }: { items: ShelfItem[] }) {
  const n = items.length;
  const start = Math.floor((n - 1) / 2);

  const stage = useRef<HTMLDivElement>(null);
  const cells = useRef<(HTMLDivElement | null)[]>([]);
  const bottles = useRef<(HTMLSpanElement | null)[]>([]);
  const shades = useRef<(HTMLSpanElement | null)[]>([]);
  const tags = useRef<(HTMLSpanElement | null)[]>([]);

  // motion: position (in bottles), velocity (bottles per second), and where it is easing to
  const m = useRef({ p: start, v: 0, target: null as number | null, dragging: false, wheelAt: 0 });
  const swing = useRef(items.map(() => ({ a: 0, v: 0 })));
  const frame = useRef(0);
  const reduce = useRef(false);
  const [center, setCenter] = useState(start);
  const centerRef = useRef(start);
  const [colours, setColours] = useState<Record<string, string | undefined>>({});

  /** Places every bottle on the curve for the current position. */
  const draw = useCallback(() => {
    const { p } = m.current;
    const w = cells.current[0]?.offsetWidth ?? 1;
    const r = w / ((STEP * Math.PI) / 180);
    cells.current.forEach((cell, i) => {
      if (!cell) return;
      const d = around(i, p, n);
      const ad = Math.abs(d);
      // bottles near the far side of a short circle fade out instead of jumping across
      const edge = Math.max(0, Math.min(1, (n / 2 - ad) / 0.7));
      const o = Math.max(0, Math.min(1, 1.6 - ad * 0.28)) * edge;
      if (o < 0.01 || ad > 6.5) {
        cell.style.visibility = "hidden";
        return;
      }
      cell.style.visibility = "visible";
      const theta = (d * STEP * Math.PI) / 180;
      const x = r * Math.sin(theta);
      const z = r * Math.cos(theta) - r;
      cell.style.transform = `translate3d(${x.toFixed(1)}px, 0, ${z.toFixed(1)}px) rotateY(${(d * STEP).toFixed(2)}deg)`;
      cell.style.opacity = o.toFixed(3);
      cell.style.zIndex = String(100 - Math.round(ad * 10));
      const bottle = bottles.current[i];
      if (bottle) bottle.style.transform = `scale(${(1 + GROW * Math.max(0, 1 - ad)).toFixed(3)})`;
      const shade = shades.current[i];
      if (shade) shade.style.opacity = Math.min(0.62, ad * 0.2).toFixed(3);
    });
    const now = ((Math.round(p) % n) + n) % n;
    if (now !== centerRef.current) {
      centerRef.current = now;
      setCenter(now);
    }
  }, [n]);

  /** One animation loop for the shelf and the swinging tags. It stops itself when all is still. */
  const run = useCallback(() => {
    if (frame.current) return;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const s = m.current;
      const before = s.p;

      if (!s.dragging) {
        if (s.target !== null) {
          // ease towards a chosen bottle
          const k = 1 - Math.exp(-dt * 9);
          s.p += (s.target - s.p) * k;
          s.v = (s.p - before) / Math.max(dt, 1e-3);
          if (Math.abs(s.target - s.p) < 0.0015) {
            s.p = s.target;
            s.target = null;
            s.v = 0;
          }
        } else if (Math.abs(s.v) > 0.05 && now - s.wheelAt > 140) {
          // glide on after a flick, slowing down
          s.p += s.v * dt;
          s.v *= Math.exp(-dt * 3.2);
          if (Math.abs(s.v) < 1.1) s.target = Math.round(s.p + s.v * 0.12);
        } else if (now - s.wheelAt > 140 && Math.abs(s.p - Math.round(s.p)) > 0.0015) {
          s.target = Math.round(s.p);
        }
      }

      // the tags swing with the movement
      const moved = s.p - before;
      let swinging = false;
      swing.current.forEach((t, i) => {
        t.v += (-30 * t.a - 2.6 * t.v) * dt + moved * 220;
        t.a += t.v * dt;
        if (Math.abs(t.a) + Math.abs(t.v) * 0.05 > 0.03) swinging = true;
        const tag = tags.current[i];
        if (tag) tag.style.transform = `rotate(${Math.max(-28, Math.min(28, t.a)).toFixed(2)}deg)`;
      });

      draw();
      const busy = s.dragging || s.target !== null || Math.abs(s.v) > 0.05 || now - s.wheelAt < 200 || swinging;
      frame.current = busy ? requestAnimationFrame(tick) : 0;
    };
    frame.current = requestAnimationFrame(tick);
  }, [draw]);

  useLayoutEffect(() => {
    reduce.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    swing.current = items.map(() => ({ a: 0, v: 0 }));
    draw();
    const onResize = () => draw();
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(frame.current);
      frame.current = 0;
    };
  }, [draw, items]);

  /** Glide round to bottle i, the short way. */
  const goTo = (i: number) => {
    const s = m.current;
    s.target = (s.target ?? s.p) + around(i, s.target ?? s.p, n);
    s.v = 0;
    if (reduce.current) {
      s.p = s.target;
      s.target = null;
      draw();
      return;
    }
    run();
  };
  const nudge = (dir: 1 | -1) => {
    const s = m.current;
    s.target = Math.round(s.target ?? s.p) + dir;
    s.v = 0;
    if (reduce.current) {
      s.p = s.target;
      s.target = null;
      draw();
      return;
    }
    run();
  };

  // drag with a finger or the mouse; the page still scrolls up and down as normal
  const drag = useRef<{ x: number; y: number; p: number; t: number; lastX: number; moved: boolean; decided: boolean } | null>(null);
  const onPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    drag.current = { x: e.clientX, y: e.clientY, p: m.current.p, t: performance.now(), lastX: e.clientX, moved: false, decided: false };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;
    if (!d.decided) {
      if (Math.hypot(dx, dy) < 6) return;
      d.decided = true;
      if (Math.abs(dy) > Math.abs(dx)) {
        drag.current = null; // a vertical swipe: leave it to the page
        return;
      }
      d.moved = true;
      (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
      m.current.dragging = true;
      m.current.target = null;
      run();
    }
    const w = cells.current[0]?.offsetWidth ?? 1;
    const now = performance.now();
    const step = (e.clientX - d.lastX) / w;
    const dt = Math.max(1, now - d.t) / 1000;
    m.current.v = m.current.v * 0.6 + (-step / dt) * 0.4;
    d.lastX = e.clientX;
    d.t = now;
    m.current.p = d.p - dx / w;
  };
  const onPointerUp = () => {
    const d = drag.current;
    if (d?.moved) {
      m.current.dragging = false;
      m.current.v = Math.max(-14, Math.min(14, m.current.v));
      run();
    }
    setTimeout(() => (drag.current = null), 0);
  };
  const onWheel = (e: React.WheelEvent) => {
    if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return; // vertical wheel scrolls the page
    const w = cells.current[0]?.offsetWidth ?? 1;
    const s = m.current;
    s.target = null;
    s.p += e.deltaX / w;
    s.v = 0;
    s.wheelAt = performance.now();
    run();
  };

  const colourOf = (it: ShelfItem) => colours[it.product.slug] ?? it.colour ?? it.product.colours[0]?.name;
  const current = items[center];

  return (
    <div>
      <div
        ref={stage}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onWheel={onWheel}
        className="relative h-[calc(62vw*1.82+2.5rem)] touch-pan-y select-none overflow-hidden sm:h-[calc(240px*1.82+2.5rem)] lg:h-[calc(270px*1.82+2.5rem)]"
        style={{ perspective: "1500px", perspectiveOrigin: "50% 92%" }}
      >
        {items.map((it, i) => {
          const colour = colourOf(it);
          const shot = bottleShots(it.product, colour).cut;
          const swatch = it.product.colours.find((c) => c.name === colour)?.hex ?? it.product.tint;
          return (
            <div
              key={`${it.product.slug}-${it.colour ?? ""}`}
              ref={(el) => {
                cells.current[i] = el;
              }}
              className="absolute bottom-0 left-1/2 -ml-[31vw] w-[62vw] will-change-transform sm:-ml-[120px] sm:w-[240px] lg:-ml-[135px] lg:w-[270px]"
              style={{ transformOrigin: "50% 100%" }}
            >
              <span
                ref={(el) => {
                  bottles.current[i] = el;
                }}
                className="relative z-10 block will-change-transform"
                style={{ transformOrigin: "50% 100%" }}
              >
                <Link
                  href={`/product/${it.product.slug}`}
                  aria-label={`${it.product.name}${colour ? `, ${colour}` : ""}, ${formatPrice(it.product.price)}`}
                  tabIndex={i === center ? 0 : -1}
                  draggable={false}
                  onClick={(e) => {
                    if (drag.current?.moved) {
                      e.preventDefault();
                      return;
                    }
                    if (i !== centerRef.current) {
                      e.preventDefault();
                      goTo(i);
                    }
                  }}
                  className="relative block px-[6%]"
                >
                  <BottleFigure src={shot} swatch={swatch} alt={`${it.product.name}${colour ? ` in ${colour}` : ""}`} priority={Math.abs(around(i, start, n)) < 3} />
                  <span
                    ref={(el) => {
                      shades.current[i] = el;
                    }}
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-y-0 left-[6%] right-[6%] bg-night"
                    style={{ opacity: 0, WebkitMaskImage: `url(${shot})`, maskImage: `url(${shot})`, WebkitMaskSize: "100% 100%", maskSize: "100% 100%" }}
                  />
                </Link>
                {/* the price tag, tied on near the top of the bottle */}
                <span
                  ref={(el) => {
                    tags.current[i] = el;
                  }}
                  className="pointer-events-none absolute right-[4%] top-[2%] z-20 block origin-top"
                >
                  <PriceTag number={`${pad(i + 1)} / ${pad(n)}`} name={bottleStyle(it.product.designGroup)?.name ?? "Bottle"} price={formatPrice(it.product.price)} />
                </span>
              </span>
              {/* this bottle's piece of the curved wooden shelf */}
              <div aria-hidden="true" className="relative -mx-px -mt-[1%] h-[20px]">
                <div className="absolute inset-x-0 top-0 h-[11px] bg-[linear-gradient(180deg,#c39663,#8a6236_60%,#6b4a27)] shadow-[0_16px_24px_-8px_rgba(0,0,0,0.9)]" />
                <div className="absolute inset-x-0 top-[11px] h-[9px] bg-[linear-gradient(180deg,#5a3d1f,#3a2712)]" />
              </div>
            </div>
          );
        })}
      </div>

      {current && (
        <div className="relative z-10 mt-3 flex items-center justify-center gap-3 px-2">
          <ShelfArrow label="Previous bottle" onClick={() => nudge(-1)} flip />
          <div className="min-w-0 max-w-sm flex-1 text-center" aria-live="polite">
            <Link href={`/product/${current.product.slug}`} className="block">
              <span className="line-clamp-2 font-serif text-xl leading-tight text-cream sm:text-2xl">{designOf(current.product)}</span>
              <span className="mt-1 block text-xs text-faint">
                {center + 1} / {n}
                {current.colour ? ` · ${current.colour}` : ""} · {formatPrice(current.product.price)}
              </span>
            </Link>
            {current.product.colours.length > 1 && !current.colour && (
              <div className="mt-2.5 flex justify-center gap-2" role="group" aria-label="Colours">
                {current.product.colours.map((c) => (
                  <button
                    key={c.name}
                    type="button"
                    title={c.name}
                    aria-label={c.name}
                    aria-pressed={c.name === colourOf(current)}
                    onClick={() => setColours((cs) => ({ ...cs, [current.product.slug]: c.name }))}
                    className="size-6 rounded-full ring-1 ring-hair-2 transition-transform aria-pressed:scale-125 aria-pressed:ring-2 aria-pressed:ring-gold-light"
                    style={{ background: c.hex }}
                  />
                ))}
              </div>
            )}
          </div>
          <ShelfArrow label="Next bottle" onClick={() => nudge(1)} />
        </div>
      )}
    </div>
  );
}

function ShelfArrow({ label, onClick, flip }: { label: string; onClick: () => void; flip?: boolean }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="grid size-11 shrink-0 place-items-center rounded-full border border-hair-2 text-cream transition-colors hover:border-gold hover:text-gold-light"
    >
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true" className={flip ? "rotate-180" : ""}>
        <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}
