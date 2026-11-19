"use client";

import Image from "next/image";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useBag } from "@/components/bag/BagProvider";
import { useCatalog } from "@/components/catalog/CatalogProvider";
import { useSettings } from "@/components/settings/SettingsProvider";
import { chatLink } from "@/lib/contact";
import { gsap } from "@/lib/gsap";
import { garmentSides, inr, type WearPiece } from "@/lib/wear";
import { GarmentFace } from "./Hanger";

/**
 * A piece lifted off the rail: turn it around (button or drag), pick a size and add it to the bag.
 * Pieces that are not shop products yet offer a WhatsApp pre-order instead.
 */
export function PieceView({ piece, onClose }: { piece: WearPiece; onClose: () => void }) {
  const backdrop = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);
  const closing = useRef(false);
  const { productBySlug } = useCatalog();
  const { add } = useBag();
  const settings = useSettings();

  const sides = garmentSides(piece);
  const canTurn = sides.length === 2;
  const [angle, setAngle] = useState(0);
  const worn = [piece.back, piece.front].filter(Boolean) as string[];
  const [dragging, setDragging] = useState(false);
  const drag = useRef<{ x: number; start: number } | null>(null);
  const [size, setSize] = useState<string | null>(null);
  const [needSize, setNeedSize] = useState(false);

  const product = piece.slug ? productBySlug(piece.slug) : undefined;
  const facing = sides[((Math.round(angle / 180) % 2) + 2) % 2]?.side ?? piece.show;

  const close = () => {
    if (closing.current) return;
    closing.current = true;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return onClose();
    gsap.to(panel.current, { y: 50, scale: 0.94, opacity: 0, duration: 0.35, ease: "power2.in" });
    gsap.to(backdrop.current, { opacity: 0, duration: 0.35, onComplete: onClose });
  };

  useLayoutEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!reduce) {
      gsap.fromTo(backdrop.current, { opacity: 0 }, { opacity: 1, duration: 0.4 });
      gsap.fromTo(panel.current, { y: 80, scale: 0.9, opacity: 0 }, { y: 0, scale: 1, opacity: 1, duration: 0.7, ease: "expo.out" });
    }
    const html = document.documentElement;
    const before = html.style.overflow;
    html.style.overflow = "hidden";
    closeBtn.current?.focus();
    return () => {
      html.style.overflow = before;
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft" && canTurn) setAngle((a) => a - 180);
      if (e.key === "ArrowRight" && canTurn) setAngle((a) => a + 180);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canTurn]);

  const onPointerDown = (e: React.PointerEvent) => {
    if (!canTurn) return;
    drag.current = { x: e.clientX, start: angle };
    setDragging(true);
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag.current) return;
    setAngle(drag.current.start + (e.clientX - drag.current.x) * 0.6);
  };
  const onPointerUp = () => {
    if (!drag.current) return;
    drag.current = null;
    setDragging(false);
    setAngle((a) => Math.round(a / 180) * 180);
  };

  const addToBag = () => {
    if (!size) return setNeedSize(true);
    if (!product) return;
    add({ slug: product.slug, size });
    close();
  };

  const preorder = chatLink(
    settings,
    `Hi KALO Gifts, I would like to pre-order the ${piece.name} ${piece.kind.toLowerCase()} (${piece.colour}) in size ${size ?? "?"}.`,
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="dialog" aria-modal="true" aria-label={piece.name}>
      <div ref={backdrop} className="absolute inset-0 bg-night/85 backdrop-blur-md" onClick={close} />
      <div
        ref={panel}
        className="relative grid max-h-[100svh] w-full max-w-5xl overflow-y-auto rounded-t-3xl border border-hair bg-pine sm:max-h-[92svh] sm:rounded-3xl md:grid-cols-[1.1fr_1fr]"
      >
        <button
          ref={closeBtn}
          type="button"
          onClick={close}
          aria-label="Close"
          className="absolute right-3 top-3 z-20 grid size-11 place-items-center rounded-full bg-night/60 text-cream backdrop-blur transition-colors hover:text-gold-light"
        >
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
            <path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" />
          </svg>
        </button>

        {/* the garment on its hanger, which turns around */}
        <div
          className="relative bg-[radial-gradient(ellipse_70%_60%_at_50%_40%,rgba(212,179,115,0.16),transparent_70%)] p-5 pt-14 sm:p-8 sm:pt-16"
          style={{ perspective: "1600px" }}
        >
          <div
            className={`relative mx-auto aspect-[1000/1150] w-full max-w-[24rem] touch-pan-y select-none ${canTurn ? "cursor-grab active:cursor-grabbing" : ""}`}
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
              <GarmentFace key={s.side} src={s.src} alt={`${piece.name}, ${s.side}`} sizes="(min-width: 768px) 384px, 90vw" turned={k === 1} />
            ))}
          </div>
          {canTurn && (
            <div className="mt-4 flex items-center justify-center gap-3 text-sm text-mist">
              <button
                type="button"
                onClick={() => setAngle((a) => a + 180)}
                className="flex items-center gap-2 rounded-full border border-hair-2 px-4 py-2 transition-colors hover:border-gold hover:text-gold-light"
              >
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
                  <path d="M4 12a8 8 0 0 1 14-5.3M20 12a8 8 0 0 1-14 5.3M18 3v4h-4M6 21v-4h4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Turn around
              </button>
              <span className="text-faint">Showing the {facing}</span>
            </div>
          )}
          {worn.length > 0 && (
            <div className="mt-6 flex items-center justify-center gap-3">
              <span className="text-xs uppercase tracking-[0.22em] text-faint">Worn</span>
              {worn.map((src) => (
                <span key={src} className="relative size-16 overflow-hidden rounded-lg ring-1 ring-hair">
                  <Image src={src} alt={`${piece.name}, worn`} fill sizes="64px" className="object-cover" />
                </span>
              ))}
            </div>
          )}
        </div>

        {/* details */}
        <div className="flex flex-col p-6 sm:p-8">
          <p className="text-xs uppercase tracking-[0.28em] text-faint">
            {piece.kind}
            {piece.christmas && " · Christmas"}
          </p>
          <h2 className="mt-3 text-[clamp(2.25rem,5vw,3.25rem)]">{piece.name}</h2>
          <p className="mt-3 text-2xl">{inr(piece.price)}</p>
          {piece.plainFront && <p className="mt-1 text-sm text-faint">Plain front, print on the back.</p>}
          <p className="mt-5 text-mist">{piece.line}</p>
          {piece.verse && <p className="mt-2 text-xs uppercase tracking-[0.22em] text-gold">{piece.verse}</p>}

          <dl className="mt-6 grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 border-t border-hair pt-5 text-sm">
            <dt className="text-faint">Colour</dt>
            <dd className="flex items-center gap-2">
              <span className="size-3 rounded-full ring-1 ring-hair-2" style={{ background: piece.swatch }} />
              {piece.colour}
            </dd>
            <dt className="text-faint">Fabric</dt>
            <dd>{piece.fabric}</dd>
            <dt className="text-faint">Fit</dt>
            <dd>{piece.fit}</dd>
          </dl>

          <fieldset className="mt-6">
            <legend className={`text-sm ${needSize && !size ? "text-berry-light" : "text-mist"}`}>
              {needSize && !size ? "Pick a size first" : "Size"}
            </legend>
            <div className="mt-3 flex flex-wrap gap-2">
              {piece.sizes.map((s) => (
                <button
                  key={s}
                  type="button"
                  aria-pressed={size === s}
                  onClick={() => setSize(s)}
                  className={`min-w-12 rounded-full border px-4 py-2 text-sm transition-colors duration-200 ${
                    size === s ? "border-gold bg-gold text-night" : "border-hair-2 text-cream hover:border-gold"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </fieldset>

          <div className="mt-8 md:mt-auto md:pt-8">
            {product ? (
              <button
                type="button"
                onClick={addToBag}
                className="w-full rounded-full bg-gold px-6 py-4 text-sm font-semibold text-night transition-colors duration-300 hover:bg-gold-light"
              >
                Add to bag
              </button>
            ) : preorder ? (
              <>
                <a
                  href={size ? preorder : undefined}
                  onClick={(e) => {
                    if (!size) {
                      e.preventDefault();
                      setNeedSize(true);
                    }
                  }}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full rounded-full bg-gold px-6 py-4 text-center text-sm font-semibold text-night transition-colors duration-300 hover:bg-gold-light"
                >
                  Pre-order on WhatsApp
                </a>
                <p className="mt-3 text-center text-xs text-faint">Coming soon to the shop. Pre-order now and we will confirm on WhatsApp.</p>
              </>
            ) : (
              <p className="rounded-full border border-hair-2 px-6 py-4 text-center text-sm text-mist">Coming soon</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
