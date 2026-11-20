"use client";

import Link from "next/link";
import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { PriceTag } from "@/components/wear/Garment";
import { formatPrice, type Product } from "@/lib/catalog";
import { frameArt, mouldingShare } from "@/lib/frames";
import { FramedPrint } from "./FramedPrint";

const pad = (n: number) => String(n).padStart(2, "0");
const STEP = 12; // degrees round the (gently curved) wall from one frame to the next
const GROW = 0.15; // how much bigger the frame in the middle is

const around = (i: number, p: number, n: number) => {
  let d = (i - p) % n;
  if (d >= n / 2) d -= n;
  if (d < -n / 2) d += n;
  return d;
};

/**
 * The gallery wall: verse frames hanging from brass nails on thin wires along a softly lit wall that
 * goes round and round. Drag or swipe to move along; the frames glide, swing a little on their nails
 * and settle with one in the middle under a spotlight. Its colour dots re-frame the print in pink,
 * white or blue. Tapping a side frame brings it to the middle; tapping the middle one opens it.
 */
export function FrameWall({ items }: { items: Product[] }) {
  const n = items.length;
  const start = Math.floor((n - 1) / 2);

  const cells = useRef<(HTMLDivElement | null)[]>([]);
  const frames = useRef<(HTMLSpanElement | null)[]>([]);
  const m = useRef({ p: start, v: 0, target: null as number | null, dragging: false, wheelAt: 0 });
  const swing = useRef(items.map(() => ({ a: 0, v: 0 })));
  const frame = useRef(0);
  const reduce = useRef(false);
  const [center, setCenter] = useState(start);
  const centerRef = useRef(start);
  const [colours, setColours] = useState<Record<string, string | undefined>>({});

  const draw = useCallback(() => {
    const { p } = m.current;
    const w = cells.current[0]?.offsetWidth ?? 1;
    const r = (w * 1.2) / ((STEP * Math.PI) / 180); // a little space between frames
    cells.current.forEach((cell, i) => {
      if (!cell) return;
      const d = around(i, p, n);
      const ad = Math.abs(d);
      const edge = Math.max(0, Math.min(1, (n / 2 - ad) / 0.7));
      const o = Math.max(0, Math.min(1, 1.55 - ad * 0.3)) * edge;
      if (o < 0.01 || ad > 6) {
        cell.style.visibility = "hidden";
        return;
      }
      cell.style.visibility = "visible";
      const theta = (d * STEP * Math.PI) / 180;
      cell.style.transform = `translate3d(${(r * Math.sin(theta)).toFixed(1)}px, 0, ${(r * Math.cos(theta) - r).toFixed(1)}px) rotateY(${(d * STEP).toFixed(2)}deg) scale(${(1 + GROW * Math.max(0, 1 - ad)).toFixed(3)})`;
      cell.style.opacity = o.toFixed(3);
      cell.style.zIndex = String(100 - Math.round(ad * 10));
      cell.style.filter = `brightness(${(1 - Math.min(0.45, ad * 0.16)).toFixed(3)})`;
    });
    const now = ((Math.round(p) % n) + n) % n;
    if (now !== centerRef.current) {
      centerRef.current = now;
      setCenter(now);
    }
  }, [n]);

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
          s.p += (s.target - s.p) * (1 - Math.exp(-dt * 9));
          s.v = (s.p - before) / Math.max(dt, 1e-3);
          if (Math.abs(s.target - s.p) < 0.0015) {
            s.p = s.target;
            s.target = null;
            s.v = 0;
          }
        } else if (Math.abs(s.v) > 0.05 && now - s.wheelAt > 140) {
          s.p += s.v * dt;
          s.v *= Math.exp(-dt * 3.2);
          if (Math.abs(s.v) < 1.1) s.target = Math.round(s.p + s.v * 0.12);
        } else if (now - s.wheelAt > 140 && Math.abs(s.p - Math.round(s.p)) > 0.0015) {
          s.target = Math.round(s.p);
        }
      }
      // frames swing on their nails as the wall moves
      const moved = s.p - before;
      let swinging = false;
      swing.current.forEach((t, i) => {
        t.v += (-22 * t.a - 2.2 * t.v) * dt + moved * 90;
        t.a += t.v * dt;
        if (Math.abs(t.a) + Math.abs(t.v) * 0.05 > 0.02) swinging = true;
        const el = frames.current[i];
        if (el) el.style.transform = `rotate(${Math.max(-9, Math.min(9, t.a)).toFixed(2)}deg)`;
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

  const glide = (target: number) => {
    const s = m.current;
    s.target = target;
    s.v = 0;
    if (reduce.current) {
      s.p = target;
      s.target = null;
      draw();
      return;
    }
    run();
  };
  const goTo = (i: number) => glide((m.current.target ?? m.current.p) + around(i, m.current.target ?? m.current.p, n));
  const nudge = (dir: 1 | -1) => glide(Math.round(m.current.target ?? m.current.p) + dir);

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
        drag.current = null;
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
    m.current.v = m.current.v * 0.6 + (-(e.clientX - d.lastX) / w / (Math.max(1, now - d.t) / 1000)) * 0.4;
    d.lastX = e.clientX;
    d.t = now;
    m.current.p = d.p - dx / w;
  };
  const onPointerUp = () => {
    if (drag.current?.moved) {
      m.current.dragging = false;
      m.current.v = Math.max(-14, Math.min(14, m.current.v));
      run();
    }
    setTimeout(() => (drag.current = null), 0);
  };
  const onWheel = (e: React.WheelEvent) => {
    if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
    const s = m.current;
    s.target = null;
    s.p += e.deltaX / (cells.current[0]?.offsetWidth ?? 1);
    s.v = 0;
    s.wheelAt = performance.now();
    run();
  };

  // frames take turns in their colours along the wall (pink, white, blue, pink…) until one is picked
  const colourOf = (p: Product, i: number) => colours[p.slug] ?? p.colours[i % Math.max(1, p.colours.length)]?.name;
  const current = items[center];

  return (
    <div>
      <div
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onWheel={onWheel}
        className="relative h-[calc(56vw*1.95+3rem)] touch-pan-y select-none overflow-hidden sm:h-[calc(230px*1.95+3rem)] lg:h-[calc(260px*1.95+3rem)]"
        style={{ perspective: "1600px", perspectiveOrigin: "50% 30%" }}
      >
        {/* the spotlight on the middle of the wall */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_32%_70%_at_50%_0%,rgba(255,236,190,0.22),transparent_75%)]" />
        {items.map((p, i) => {
          const colour = colourOf(p, i);
          const art = frameArt(p) ?? p.images[0];
          return (
            <div
              key={p.slug}
              ref={(el) => {
                cells.current[i] = el;
              }}
              className="absolute left-1/2 top-3 -ml-[28vw] w-[56vw] will-change-transform sm:-ml-[115px] sm:w-[230px] lg:-ml-[130px] lg:w-[260px]"
              style={{ transformOrigin: "50% 0%" }}
            >
              {/* the nail */}
              <span aria-hidden="true" className="absolute left-1/2 top-0 z-20 -ml-[7px] block size-[14px] rounded-full bg-[radial-gradient(circle_at_35%_35%,#fff1c9,#c9a052_45%,#6e5328)] shadow-[0_2px_4px_rgba(0,0,0,0.6)]" />
              <span
                ref={(el) => {
                  frames.current[i] = el;
                }}
                className="relative block pt-[18%]"
                style={{ transformOrigin: "50% 7px" }}
              >
                {/* the wire from the nail to the back of the frame */}
                <svg aria-hidden="true" viewBox="0 0 100 20" preserveAspectRatio="none" className="absolute inset-x-[14%] top-[7px] h-[calc(18%-4px)] w-[72%] overflow-visible">
                  <path d="M50 0 L0 20 M50 0 L100 20" stroke="rgba(243,236,223,0.55)" strokeWidth="0.8" vectorEffect="non-scaling-stroke" fill="none" />
                </svg>
                <Link
                  href={`/product/${p.slug}`}
                  aria-label={`${p.name}${colour ? `, ${colour} frame` : ""}, ${formatPrice(p.price)}`}
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
                  className="relative block"
                >
                  <FramedPrint art={art} colour={colour} share={mouldingShare(p)} alt={`${p.name} in a ${colour?.toLowerCase() ?? ""} frame`} eager={Math.abs(around(i, start, n)) < 3} />
                </Link>
                {/* the price tag, tied to the wire */}
                <span className="pointer-events-none absolute -right-[9%] top-[12%] z-20 block origin-top scale-[0.8] rotate-[5deg]">
                  <PriceTag number={`${pad(i + 1)} / ${pad(n)}`} name="Verse frame" price={formatPrice(p.price)} />
                </span>
              </span>
            </div>
          );
        })}
      </div>

      {current && (
        <div className="relative z-10 mt-3 flex items-center justify-center gap-3 px-2">
          <WallArrow label="Previous frame" onClick={() => nudge(-1)} flip />
          <div className="min-w-0 max-w-sm flex-1 text-center" aria-live="polite">
            <Link href={`/product/${current.slug}`} className="block">
              <span className="line-clamp-2 font-serif text-xl leading-tight text-cream sm:text-2xl">{current.name.replace(/ Frame$/, "")}</span>
              <span className="mt-1 block text-xs text-faint">
                {current.message?.ref ? `${current.message.ref} · ` : ""}
                {formatPrice(current.price)}
              </span>
            </Link>
            {current.colours.length > 1 && (
              <div className="mt-2.5 flex items-center justify-center gap-2" role="group" aria-label="Frame colour">
                {current.colours.map((c) => (
                  <button
                    key={c.name}
                    type="button"
                    title={c.name}
                    aria-label={`${c.name} frame`}
                    aria-pressed={c.name === colourOf(current, center)}
                    onClick={() => setColours((cs) => ({ ...cs, [current.slug]: c.name }))}
                    className="size-6 rounded-full ring-1 ring-hair-2 transition-transform aria-pressed:scale-125 aria-pressed:ring-2 aria-pressed:ring-gold-light"
                    style={{ background: c.hex }}
                  />
                ))}
              </div>
            )}
          </div>
          <WallArrow label="Next frame" onClick={() => nudge(1)} />
        </div>
      )}
    </div>
  );
}

function WallArrow({ label, onClick, flip }: { label: string; onClick: () => void; flip?: boolean }) {
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
