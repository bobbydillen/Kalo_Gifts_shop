"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { gsap } from "@/lib/gsap";

type Layer = { src: string; key: number; pour: boolean };

/**
 * A cut-out bottle standing on its base. When the colour changes, the new bottle "pours" in: it fills
 * from the bottom up behind a band of the new colour, shaped like the bottle, then the old one goes.
 */
export function BottleFigure({ src, swatch, alt, priority, className = "" }: { src: string; swatch: string; alt: string; priority?: boolean; className?: string }) {
  const [layers, setLayers] = useState<Layer[]>([{ src, key: 0, pour: false }]);
  const last = useRef(src);

  useEffect(() => {
    if (src === last.current) return;
    last.current = src;
     
    setLayers((l) => [l[l.length - 1], { src, key: Date.now(), pour: true }]);
  }, [src]);

  return (
    <span className={`relative block aspect-[600/900] ${className}`}>
      {/* a soft shadow where the bottle meets the shelf */}
      <span aria-hidden="true" className="absolute inset-x-[22%] bottom-[0.6%] h-[3%] rounded-[50%] bg-black/60 blur-[6px]" />
      {layers.map((layer, i) => (
        <PourLayer
          key={layer.key}
          src={layer.src}
          swatch={swatch}
          pour={layer.pour}
          alt={i === layers.length - 1 ? alt : ""}
          priority={priority}
          onDone={() => setLayers((l) => (l.length > 1 ? [l[l.length - 1]] : l))}
        />
      ))}
    </span>
  );
}

function PourLayer({ src, swatch, pour, alt, priority, onDone }: { src: string; swatch: string; pour: boolean; alt: string; priority?: boolean; onDone: () => void }) {
  const img = useRef<HTMLImageElement>(null);
  const liquid = useRef<HTMLSpanElement>(null);
  const done = useRef(onDone);
  useEffect(() => {
    done.current = onDone;
  });

  useLayoutEffect(() => {
    if (!pour) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      done.current();
      return;
    }
    const tl = gsap.timeline({ onComplete: () => done.current() });
    tl.fromTo(img.current, { clipPath: "inset(100% 0% 0% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 0.85, ease: "power2.inOut" }, 0);
    tl.fromTo(liquid.current, { yPercent: 100, opacity: 1 }, { yPercent: -18, duration: 0.85, ease: "power2.inOut" }, 0);
    tl.to(liquid.current, { opacity: 0, duration: 0.3 }, 0.7);
    return () => {
      tl.kill();
    };
  }, [pour]);

  const mask = { WebkitMaskImage: `url(${src})`, maskImage: `url(${src})`, WebkitMaskSize: "100% 100%", maskSize: "100% 100%" };
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element -- already sized cut-outs */}
      <img
        ref={img}
        src={src}
        alt={alt}
        aria-hidden={alt ? undefined : true}
        draggable={false}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        className="absolute inset-0 size-full select-none object-contain drop-shadow-[0_18px_18px_rgba(0,0,0,0.45)]"
      />
      {pour && (
        <span aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden" style={mask}>
          <span
            ref={liquid}
            className="absolute inset-x-0 top-0 block h-[22%]"
            style={{
              background: `linear-gradient(180deg, transparent, color-mix(in srgb, ${swatch} 85%, white) 35%, ${swatch} 60%, transparent)`,
              transform: "translateY(100%)",
            }}
          />
        </span>
      )}
    </>
  );
}
