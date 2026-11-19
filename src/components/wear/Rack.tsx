"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { garmentSides, inr, type WearPiece } from "@/lib/wear";
import { GarmentFace } from "./Hanger";

const pad = (n: number) => String(n).padStart(2, "0");
const smooth = (t: number) => t * t * (3 - 2 * t);

/** The scroll is cut into steps: turning the piece in front around, then moving along the rail. */
type Step = { kind: "turn" | "move"; piece: number };

/**
 * The hero: a clothing rail running into the distance. The garment in front faces you on its hanger;
 * the rest hang side-on behind it. Scrolling first turns the front garment round to show its other
 * side, then moves along the rail to the next one (the section stays pinned meanwhile). The details
 * of the piece in front sit beside it. With reduced motion the arrows do the moving instead.
 */
export function Rack({ pieces, onOpen }: { pieces: WearPiece[]; onOpen: (index: number) => void }) {
  const root = useRef<HTMLElement>(null);
  const rail = useRef<HTMLDivElement>(null);
  const cards = useRef<(HTMLButtonElement | null)[]>([]);
  const turners = useRef<(HTMLSpanElement | null)[]>([]);
  const shades = useRef<(HTMLSpanElement | null)[][]>([]);
  const details = useRef<HTMLDivElement>(null);
  const trigger = useRef<ScrollTrigger | null>(null);
  const pos = useRef(0);
  const [active, setActive] = useState(0);
  const [facing, setFacing] = useState<"front" | "back">(pieces[0]?.show ?? "back");
  const activeRef = useRef(0);
  const facingRef = useRef(facing);
  const n = pieces.length;

  const sides = useMemo(() => pieces.map(garmentSides), [pieces]);
  const steps = useMemo(() => {
    const list: Step[] = [];
    sides.forEach((s, i) => {
      if (s.length === 2) list.push({ kind: "turn", piece: i });
      if (i < n - 1) list.push({ kind: "move", piece: i });
    });
    return list;
  }, [sides, n]);
  const total = Math.max(1, steps.length);
  /** Where on the scroll each piece first arrives in front, before it turns. */
  const arrive = useMemo(
    () =>
      pieces.map((_, i) => {
        const k = steps.findIndex((s) => s.piece === i);
        return i === 0 ? 0 : k < 0 ? total : k;
      }),
    [pieces, steps, total],
  );

  /** Puts every garment where it belongs at scroll position u (in steps). */
  const place = useCallback(
    (u: number) => {
      pos.current = u;
      const k = Math.min(total - 1, Math.max(0, Math.floor(u)));
      const f = Math.min(1, Math.max(0, u - k));
      const step = steps[k];
      // rail position (0 = first piece in front) and how far each piece has turned round
      let p = 0;
      const turned: number[] = pieces.map((_, i) => (i < (step?.piece ?? 0) ? 1 : 0));
      if (step) {
        if (step.kind === "turn") {
          p = step.piece;
          turned[step.piece] = smooth(f);
        } else {
          p = step.piece + f;
          turned[step.piece] = sides[step.piece].length === 2 ? 1 : 0;
        }
      }
      if (u >= total && n > 0) {
        p = n - 1;
        turned[n - 1] = sides[n - 1].length === 2 ? 1 : 0;
      }

      const w = window.innerWidth;
      const small = w < 1024;
      const gap = small ? Math.max(70, w * 0.17) : 190; // sideways step between pieces
      const depth = small ? 300 : 340; // step into the distance
      const turnAway = 72; // how far the pieces behind are turned side-on

      if (rail.current) {
        const angle = (Math.atan2(depth, gap) * 180) / Math.PI;
        rail.current.style.transform = `rotateY(${angle}deg)`;
      }

      cards.current.forEach((el, i) => {
        if (!el) return;
        const d = i - p;
        let x: number, y = 0, z: number, ry: number, o = 1;
        if (d >= 0) {
          x = d * gap;
          z = -d * depth;
          ry = -Math.min(d, 1) * turnAway;
          if (d > 5) o = Math.max(0, 6 - d);
        } else {
          // the piece that was in front lifts away to the left
          const t = Math.min(1, -d);
          x = -t * w * (small ? 0.6 : 0.32);
          y = -t * 40;
          z = t * 160;
          ry = t * 16;
          o = Math.max(0, 1 - t * 1.8); // gone before it reaches the text beside the rack
        }
        el.style.transform = `translate3d(${x}px, ${y}px, ${z}px) rotateY(${ry}deg)`;
        el.style.opacity = String(o);
        el.style.pointerEvents = o < 0.2 ? "none" : "auto";
        const turner = turners.current[i];
        if (turner) turner.style.transform = `rotateY(${180 * turned[i]}deg)`;
        const dim = String(d > 0 ? Math.min(0.72, d * 0.24) : 0);
        shades.current[i]?.forEach((s) => s && (s.style.opacity = dim));
      });

      const now = Math.max(0, Math.min(n - 1, Math.round(p)));
      if (now !== activeRef.current) {
        activeRef.current = now;
        setActive(now);
      }
      const order = sides[now];
      const side = order.length === 2 && turned[now] > 0.5 ? order[1].side : (order[0]?.side ?? "back");
      if (side !== facingRef.current) {
        facingRef.current = side;
        setFacing(side);
      }
    },
    [n, pieces, sides, steps, total],
  );

  useLayoutEffect(() => {
    place(0);
    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const state = { u: 0 };
      const tween = gsap.to(state, {
        u: total,
        ease: "none",
        onUpdate: () => place(state.u),
        scrollTrigger: {
          trigger: root.current,
          start: "top top",
          end: () => `+=${total * window.innerHeight * 0.7}`,
          pin: true,
          scrub: 0.7,
          snap: { snapTo: 1 / total, duration: { min: 0.25, max: 0.7 }, ease: "power2.inOut", delay: 0.08 },
          invalidateOnRefresh: true,
        },
      });
      trigger.current = tween.scrollTrigger ?? null;
      return () => {
        trigger.current = null;
      };
    });
    const onResize = () => place(pos.current);
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      mm.revert();
    };
  }, [place, total]);

  // the details beside the rack change with a short rise
  useEffect(() => {
    const el = details.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    gsap.fromTo(el.children, { y: 14, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, stagger: 0.04, ease: "power3.out" });
  }, [active]);

  /** Scroll to a step position (or animate there when motion is reduced). */
  const scrollToStep = (u: number) => {
    const st = trigger.current;
    if (st) {
      window.scrollTo({ top: st.start + ((st.end - st.start) * u) / total, behavior: "smooth" });
    } else {
      gsap.to(pos, { current: u, duration: 0.7, ease: "power2.inOut", onUpdate: () => place(pos.current) });
    }
  };
  const goTo = (i: number) => scrollToStep(arrive[Math.max(0, Math.min(n - 1, i))]);
  /** Turn the piece in front round without moving on. */
  const turn = () => {
    const i = activeRef.current;
    if (sides[i].length < 2) return;
    const start = arrive[i];
    scrollToStep(facingRef.current === sides[i][0].side ? start + 1 : start);
  };

  const piece = pieces[active];
  const canTurn = sides[active].length === 2;

  return (
    <section ref={root} aria-label="The KALO rack" className="relative h-[100svh] overflow-hidden bg-night">
      {/* soft light behind the rail */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_55%_at_62%_38%,rgba(212,179,115,0.13),transparent_70%)]"
      />
      <div className="relative mx-auto flex h-full max-w-7xl flex-col px-4 pb-6 pt-20 sm:px-6 lg:flex-row lg:items-center lg:gap-10 lg:pt-24">
        {/* the rail */}
        <div
          className="relative order-1 h-[55%] w-full shrink-0 lg:order-2 lg:h-full lg:flex-1"
          style={{ perspective: "1400px", perspectiveOrigin: "50% 22%" }}
        >
          <div className="absolute inset-0" style={{ transformStyle: "preserve-3d" }}>
            <div
              ref={rail}
              aria-hidden="true"
              className="absolute left-1/2 top-[8%] -ml-[120px] h-[3px] w-[3600px] rounded-full bg-gradient-to-r from-gold/0 via-gold to-gold-deep/0 shadow-[0_0_18px_rgba(212,179,115,0.45)] lg:top-[12%]"
              style={{ transformOrigin: "120px 50%" }}
            />
            {pieces.map((p, i) => (
              <button
                key={p.id}
                ref={(el) => {
                  cards.current[i] = el;
                }}
                type="button"
                onClick={() => (i === activeRef.current ? onOpen(i) : goTo(i))}
                aria-label={i === active ? `Open ${p.name}` : `Bring ${p.name} to the front`}
                tabIndex={i === active ? 0 : -1}
                className="group absolute left-1/2 top-[8%] -ml-[min(32vw,15svh)] w-[min(64vw,30svh)] cursor-pointer will-change-transform lg:top-[12%] lg:-ml-[min(13vw,180px,24svh)] lg:w-[min(26vw,360px,48svh)]"
                style={{ transformOrigin: "50% 0%", transformStyle: "preserve-3d" }}
              >
                {/* hangs from the rail: the hook tip sits on the rail line */}
                <span
                  ref={(el) => {
                    turners.current[i] = el;
                  }}
                  className="relative mt-[6%] block aspect-[1000/1150] transition-[translate] duration-500 ease-glide group-hover:-translate-y-1"
                  style={{ transformStyle: "preserve-3d" }}
                >
                  {sides[i].map((s, k) => (
                    <GarmentFace
                      key={s.side}
                      src={s.src}
                      alt={`${p.name} ${p.kind.toLowerCase()}, ${s.side}`}
                      sizes="(min-width: 1024px) 360px, 64vw"
                      priority={i < 2}
                      turned={k === 1}
                      shadeRef={(el) => {
                        (shades.current[i] ??= [])[k] = el;
                      }}
                    />
                  ))}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* details of the piece in front */}
        <div className="order-2 flex min-h-0 flex-1 flex-col justify-start lg:order-1 lg:w-[22rem] lg:flex-none lg:justify-center">
          <p className="kicker hidden lg:block">KALO Wear</p>
          <h1 className="mt-4 hidden text-[clamp(2.5rem,4.4vw,4rem)] lg:block">
            Wear the <em>Word</em>
          </h1>

          <div ref={details} className="lg:mt-10" aria-live="polite">
            <p className="text-xs uppercase tracking-[0.28em] text-faint">
              {pad(active + 1)} / {pad(n)} · {piece.kind}
            </p>
            <h2 className="mt-2 text-[clamp(2rem,7vw,3rem)]">{piece.name}</h2>
            <p className="mt-2 flex items-center gap-2 text-sm text-mist">
              <span className="size-3 rounded-full ring-1 ring-hair-2" style={{ background: piece.swatch }} />
              {piece.colour}
              <span className="text-faint">·</span>
              <span className="text-cream">{inr(piece.price)}</span>
            </p>
            <p className="mt-3 hidden max-w-sm text-mist sm:block">{piece.line}</p>
            {piece.verse && <p className="mt-2 hidden text-xs uppercase tracking-[0.22em] text-gold sm:block">{piece.verse}</p>}
            <p className="mt-3 hidden text-sm text-faint lg:block">
              {piece.fabric}. {piece.fit}.
            </p>
            <ul className="mt-4 hidden gap-1.5 lg:flex" aria-label="Sizes">
              {piece.sizes.map((s) => (
                <li key={s} className="rounded-full border border-hair-2 px-3 py-1 text-xs text-mist">
                  {s}
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => onOpen(active)}
              className="rounded-full bg-gold px-6 py-3 text-sm font-semibold text-night transition-colors duration-300 hover:bg-gold-light"
            >
              View piece
            </button>
            {canTurn && (
              <button
                type="button"
                onClick={turn}
                className="flex items-center gap-2 rounded-full border border-hair-2 px-4 py-3 text-sm text-cream transition-colors duration-300 hover:border-gold hover:text-gold-light"
              >
                <TurnIcon />
                {facing === "back" ? "See the front" : "See the back"}
              </button>
            )}
            <div className="ml-auto flex gap-2 lg:ml-0">
              <ArrowButton label="Previous piece" disabled={active === 0} onClick={() => goTo(active - 1)} flip />
              <ArrowButton label="Next piece" disabled={active === n - 1} onClick={() => goTo(active + 1)} />
            </div>
          </div>
          <p className="mt-4 hidden text-xs text-faint lg:block">Scroll to turn each piece round, then move along the rail.</p>
        </div>
      </div>
    </section>
  );
}

function TurnIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <path d="M4 12a8 8 0 0 1 14-5.3M20 12a8 8 0 0 1-14 5.3M18 3v4h-4M6 21v-4h4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ArrowButton({ label, onClick, disabled, flip }: { label: string; onClick: () => void; disabled?: boolean; flip?: boolean }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className="grid size-11 place-items-center rounded-full border border-hair-2 text-cream transition-colors duration-300 hover:border-gold hover:text-gold-light disabled:opacity-30"
    >
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true" className={flip ? "rotate-180" : ""}>
        <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}
