"use client";

import { useLayoutEffect, useRef, useState, ViewTransition } from "react";
import type { GarmentPhotos } from "@/lib/garment";
import { garmentTransitionName } from "@/lib/garment";
import { gsap } from "@/lib/gsap";
import { GarmentSide } from "./Garment";

/**
 * The product picture for wear: the garment hanging on a short brass rail, which you turn round by
 * dragging or with the Front / Back buttons, then the photos of it being worn. The garment shares
 * its name with the one on the rail, so it travels here when a piece is opened from the rail.
 */
export function GarmentGallery({ slug, name, tag, photos }: { slug: string; name: string; tint?: string; tag?: string; photos: GarmentPhotos }) {
  const { sides, worn } = photos;
  const canTurn = sides.length === 2;
  const [angle, setAngle] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [photo, setPhoto] = useState<string | null>(null); // a worn photo in place of the garment
  const drag = useRef<{ x: number; start: number } | null>(null);
  const swing = useRef<HTMLDivElement>(null);
  const facingIndex = ((Math.round(angle / 180) % 2) + 2) % 2;

  // a small sway as the garment settles on its hanger
  useLayoutEffect(() => {
    if (!swing.current || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    gsap.fromTo(swing.current, { rotate: 4 }, { rotate: 0, duration: 2.4, ease: "elastic.out(1, 0.25)" });
  }, []);

  const show = (k: number) => {
    setPhoto(null);
    if (k === facingIndex) return;
    setAngle((a) => a + (k > facingIndex ? 180 : -180));
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (!canTurn || photo) return;
    drag.current = { x: e.clientX, start: angle };
    setDragging(true);
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (drag.current) setAngle(drag.current.start + (e.clientX - drag.current.x) * 0.6);
  };
  const onPointerUp = () => {
    if (!drag.current) return;
    drag.current = null;
    setDragging(false);
    setAngle((a) => Math.round(a / 180) * 180);
  };

  return (
    <div>
      <div className="relative aspect-[4/5]">
        {/* a soft warm light behind the garment, fading into the page (no box) */}
        <div aria-hidden="true" className="pointer-events-none absolute -inset-y-[8%] inset-x-0 bg-[radial-gradient(ellipse_50%_46%_at_50%_48%,rgba(255,236,200,0.16),rgba(255,236,200,0.05)_45%,transparent_70%)]" />
        {tag && (
          <span className="absolute left-0 top-2 z-20 rounded-full border border-hair-2 bg-night/50 px-3 py-1.5 text-[0.625rem] uppercase tracking-[0.2em] text-gold-light backdrop-blur">
            {tag}
          </span>
        )}

        <div
          ref={swing}
          className={`absolute inset-x-[4%] top-[5%] transition-[opacity,transform] duration-500 ${photo ? "scale-95 opacity-0" : "opacity-100"}`}
          style={{ transformOrigin: "50% 0%", perspective: "1400px" }}
        >
          <ViewTransition name={garmentTransitionName(slug)} share="morph" default="none">
            <span
              className={`relative mt-[7%] block aspect-[1000/1150] touch-pan-y select-none ${canTurn ? "cursor-grab active:cursor-grabbing" : ""}`}
              style={{
                transformStyle: "preserve-3d",
                transform: `rotateY(${angle}deg)`,
                transition: dragging ? "none" : "transform 0.9s cubic-bezier(0.16, 1, 0.3, 1)",
              }}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
            >
              {sides.map((s, k) => (
                <GarmentSide key={s.side} src={s.src} alt={`${name}, ${s.side}`} turned={k === 1} priority />
              ))}
            </span>
          </ViewTransition>
        </div>

        {photo && (
          // eslint-disable-next-line @next/next/no-img-element -- already sized photos
          <img src={photo} alt={`${name}, worn`} className="absolute inset-0 size-full animate-[fade-in_0.5s_ease] rounded-[28px] object-cover" />
        )}

        {canTurn && !photo && (
          <p className="pointer-events-none absolute inset-x-0 bottom-4 text-center text-xs text-faint">Drag to turn it round</p>
        )}
      </div>

      <div className="mt-4 flex gap-3 overflow-x-auto pb-1 no-scrollbar" role="group" aria-label="Views">
        {sides.map((s, k) => {
          const on = !photo && facingIndex === k;
          return (
            <button
              key={s.side}
              type="button"
              onClick={() => show(k)}
              aria-pressed={on}
              className="group relative size-20 shrink-0 overflow-hidden rounded-xl border border-hair bg-[#efe7da] transition-colors aria-pressed:border-gold"
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- small cut-out */}
              <img src={s.src} alt="" className="size-full object-contain p-1.5" />
              <span className="absolute inset-x-0 bottom-0 bg-night/70 py-0.5 text-[0.625rem] uppercase tracking-[0.18em] text-cream">{s.side}</span>
            </button>
          );
        })}
        {worn.map((src) => (
          <button
            key={src}
            type="button"
            onClick={() => setPhoto(src)}
            aria-pressed={photo === src}
            className="relative size-20 shrink-0 overflow-hidden rounded-xl border border-hair transition-colors aria-pressed:border-gold"
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- small photo */}
            <img src={src} alt="" className="size-full object-cover" />
            <span className="absolute inset-x-0 bottom-0 bg-night/70 py-0.5 text-[0.625rem] uppercase tracking-[0.18em] text-cream">Worn</span>
          </button>
        ))}
      </div>
    </div>
  );
}
