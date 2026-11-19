import Image from "next/image";
import type { Ref } from "react";

/** A thin gold coat hanger. The hook's tip sits at the top centre of the box. */
export function Hanger({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 64" fill="none" aria-hidden="true" className={className}>
      <path
        d="M100 30 V22 c0-4 3-6 6-8 c4-2 6-5 6-8.5 C112 1.5 107 -1 101.5 1 C97 2.5 95 6 96 9"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M100 30 L16 58 c-6 2-5 5 1 5 H183 c6 0 7-3 1-5 Z"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * One side of a garment hanging on its hanger: the hanger behind, the cut-out garment over it.
 * The box is the garment canvas (1000 x 1150); the hook pokes out above the box. `shadeRef` points
 * at a dark layer shaped like the garment, used to dim pieces further down the rail.
 */
export function GarmentFace({
  src,
  alt,
  sizes,
  priority,
  turned,
  shadeRef,
  className = "",
}: {
  src: string;
  alt: string;
  sizes: string;
  priority?: boolean;
  turned?: boolean; // the side that starts facing away (pre-turned half a circle)
  shadeRef?: Ref<HTMLSpanElement>;
  className?: string;
}) {
  const mask = { WebkitMaskImage: `url(${src})`, maskImage: `url(${src})`, WebkitMaskSize: "100% 100%", maskSize: "100% 100%" };
  return (
    <span
      className={`absolute inset-0 ${className}`}
      style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden", transform: turned ? "rotateY(180deg)" : undefined }}
    >
      <Hanger className="absolute left-[19%] top-[-5%] w-[62%] text-gold-light" />
      <Image
        src={src}
        alt={alt}
        fill
        unoptimized
        sizes={sizes}
        priority={priority}
        draggable={false}
        className="pointer-events-none select-none object-contain drop-shadow-[0_28px_30px_rgba(0,0,0,0.55)]"
      />
      {shadeRef && <span ref={shadeRef} aria-hidden="true" className="absolute inset-0 bg-night" style={{ ...mask, opacity: 0 }} />}
    </span>
  );
}
