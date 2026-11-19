import { useId, type Ref } from "react";

/**
 * A polished brass coat hanger, drawn so it reads on a phone. The hook's tip sits at the top centre
 * of the box; the shoulders sit behind the garment.
 */
export function BrassHanger({ className = "" }: { className?: string }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg viewBox="0 0 200 70" fill="none" aria-hidden="true" className={className}>
      <defs>
        <linearGradient id={`brass-${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff1c9" />
          <stop offset="0.35" stopColor="#e2c27e" />
          <stop offset="0.7" stopColor="#a8823f" />
          <stop offset="1" stopColor="#f2deae" />
        </linearGradient>
      </defs>
      {/* hook */}
      <path
        d="M100 33 V24 c0-4.5 3.2-6.6 6.4-8.6 c4-2.5 6.6-5.4 6.6-9.2 C113 1.6 107.5 -1.2 101.6 0.9 C96.8 2.6 94.6 6.4 95.6 9.8"
        stroke={`url(#brass-${id})`}
        strokeWidth="4.5"
        strokeLinecap="round"
      />
      {/* neck collar */}
      <rect x="95.5" y="29" width="9" height="7" rx="2" fill={`url(#brass-${id})`} />
      {/* shoulders and bar */}
      <path
        d="M100 34 L14 61 c-7 2.2-6 6.5 1.5 6.5 H184.5 c7.5 0 8.5-4.3 1.5-6.5 Z"
        stroke={`url(#brass-${id})`}
        strokeWidth="5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * One side of a garment on its hanger. The box is the garment canvas (1000 x 1150); the hook pokes
 * out above the box. `turned` pre-turns the side that starts facing away. `shadeRef` points at a dark
 * layer shaped like the garment, for dimming.
 */
export function GarmentSide({
  src,
  alt,
  turned,
  priority,
  shadeRef,
}: {
  src: string;
  alt: string;
  turned?: boolean;
  priority?: boolean;
  shadeRef?: Ref<HTMLSpanElement>;
}) {
  const mask = { WebkitMaskImage: `url(${src})`, maskImage: `url(${src})`, WebkitMaskSize: "100% 100%", maskSize: "100% 100%" };
  return (
    <span
      className="absolute inset-0"
      style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden", transform: turned ? "rotateY(180deg)" : undefined }}
    >
      <BrassHanger className="absolute left-[17%] top-[-6.5%] w-[66%] drop-shadow-[0_2px_3px_rgba(0,0,0,0.6)]" />
      {/* eslint-disable-next-line @next/next/no-img-element -- already sized and compressed cut-outs */}
      <img
        src={src}
        alt={alt}
        draggable={false}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        className="pointer-events-none absolute inset-0 size-full select-none object-contain drop-shadow-[0_26px_28px_rgba(0,0,0,0.55)]"
      />
      {shadeRef && <span ref={shadeRef} aria-hidden="true" className="absolute inset-0 bg-night" style={{ ...mask, opacity: 0 }} />}
    </span>
  );
}

/** A kraft-paper price tag on a string. The string's top end is the top centre of the box. */
export function PriceTag({ number, name, price, className = "" }: { number: string; name: string; price: string; className?: string }) {
  return (
    <span className={`flex flex-col items-center ${className}`} aria-hidden="true">
      <span className="h-10 w-px bg-gradient-to-b from-cream/80 to-cream/50" />
      <span
        className="relative -mt-px block w-[5.25rem] rounded-[5px] px-2 pb-2 pt-3.5 text-center text-ink shadow-[0_8px_16px_-6px_rgba(0,0,0,0.7)]"
        style={{
          background: "linear-gradient(160deg, #e2c9a0, #c9a874 60%, #b8935c)",
          clipPath: "polygon(22% 0, 78% 0, 100% 16%, 100% 100%, 0 100%, 0 16%)",
        }}
      >
        <span className="absolute left-1/2 top-[5px] size-2 -translate-x-1/2 rounded-full bg-night/85 ring-1 ring-[#8a6a3a]" />
        <span className="block text-[0.5625rem] font-semibold tracking-[0.18em] text-[#5a4122]">{number}</span>
        <span className="mt-0.5 block font-serif text-[0.8125rem] leading-tight">{name}</span>
        <span className="mt-1 block text-[0.75rem] font-bold">{price}</span>
      </span>
    </span>
  );
}
