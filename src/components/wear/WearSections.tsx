"use client";

import Image from "next/image";
import { useLayoutEffect, useRef, useState } from "react";
import { gsap } from "@/lib/gsap";
import { LETTER_PHOTO, OUTFITS } from "@/lib/wear";

const MOTION = "(prefers-reduced-motion: no-preference)";

/** A model changes outfits as you scroll: each photo wipes up over the last while the section is pinned. */
export function OutfitChange() {
  const root = useRef<HTMLElement>(null);
  const frames = useRef<(HTMLDivElement | null)[]>([]);
  const [at, setAt] = useState(0);

  useLayoutEffect(() => {
    const mm = gsap.matchMedia();
    mm.add(MOTION, () => {
      const list = frames.current.filter(Boolean) as HTMLDivElement[];
      gsap.set(list.slice(1), { clipPath: "inset(100% 0% 0% 0%)" });
      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: root.current,
          start: "top top",
          end: () => `+=${(list.length - 1) * window.innerHeight * 0.8}`,
          pin: true,
          scrub: 0.6,
          onUpdate: (self) => setAt(Math.round(self.progress * (list.length - 1))),
        },
      });
      list.slice(1).forEach((el, i) => {
        tl.to(el, { clipPath: "inset(0% 0% 0% 0%)", duration: 1 }, i);
        tl.fromTo(el.querySelector("img"), { scale: 1.18 }, { scale: 1, duration: 1 }, i);
        tl.to(list[i], { scale: 0.94, opacity: 0.4, duration: 1 }, i);
      });
    });
    return () => mm.revert();
  }, []);

  const now = OUTFITS[at];

  return (
    <section ref={root} aria-label="One wardrobe, many days" className="relative h-[100svh] overflow-hidden bg-pine">
      <div className="mx-auto grid h-full max-w-7xl items-center gap-6 px-4 pb-8 pt-20 sm:px-6 lg:grid-cols-[1fr_1.1fr] lg:gap-16 lg:pt-24">
        <div className="order-2 lg:order-1">
          <p className="kicker">Change of clothes</p>
          <h2 className="mt-4 text-[clamp(2.25rem,6vw,4.75rem)]">
            Same faith, <em>new</em> day
          </h2>
          <p className="mt-5 hidden max-w-md text-mist sm:block">
            Heavy cotton, an easy oversized cut and a print that says something. Wear it to church, to college or
            round the fire.
          </p>
          <p className="mt-6 flex items-baseline gap-3 text-sm" aria-live="polite">
            <span className="font-serif text-3xl text-gold-light">{String(at + 1).padStart(2, "0")}</span>
            <span className="text-mist">
              {now.piece} <span className="text-faint">· {now.side}</span>
            </span>
          </p>
        </div>
        <div className="relative order-1 mx-auto aspect-[4/5] h-[56svh] max-w-full overflow-hidden rounded-2xl ring-1 ring-hair lg:order-2 lg:h-[76svh]">
          {OUTFITS.map((o, i) => (
            <div
              key={o.src}
              ref={(el) => {
                frames.current[i] = el;
              }}
              className="absolute inset-0 overflow-hidden"
              style={{ zIndex: i }}
            >
              <Image src={o.src} alt={`${o.piece}, ${o.side.toLowerCase()}`} fill sizes="(min-width: 1024px) 620px, 90vw" className="object-cover" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/** A full-screen photo seen through the letters KALO, which open up until the photo fills the screen. */
export function LetterWindow() {
  const root = useRef<HTMLElement>(null);
  const word = useRef<HTMLDivElement>(null);
  const photo = useRef<HTMLDivElement>(null);
  const caption = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const mm = gsap.matchMedia();
    mm.add(MOTION, () => {
      gsap.set(photo.current, { opacity: 0 });
      gsap.set(caption.current, { opacity: 0, y: 30 });
      const tl = gsap.timeline({
        scrollTrigger: { trigger: root.current, start: "top top", end: "+=180%", pin: true, scrub: 0.6 },
      });
      tl.to(word.current, { scale: 9, ease: "power2.in", duration: 1 }, 0)
        .to(photo.current, { opacity: 1, ease: "power1.in", duration: 0.35 }, 0.62)
        .to(word.current, { opacity: 0, duration: 0.1 }, 0.95)
        .to(caption.current, { opacity: 1, y: 0, duration: 0.25 }, 1)
        .to({}, { duration: 0.2 });
    });
    return () => mm.revert();
  }, []);

  return (
    <section ref={root} aria-label="KALO" className="relative grid h-[100svh] place-items-center overflow-hidden bg-night">
      <div ref={photo} className="absolute inset-0 opacity-0 motion-reduce:opacity-100">
        <Image src={LETTER_PHOTO} alt="Gracias Cristo tee worn at a lakeside camp" fill sizes="100vw" className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-night/80 via-night/10 to-night/30" />
      </div>
      <div
        ref={word}
        aria-hidden="true"
        className="relative select-none bg-cover bg-center bg-clip-text font-sans text-[34vw] font-extrabold leading-none tracking-[-0.06em] text-transparent will-change-transform motion-reduce:hidden"
        style={{ backgroundImage: `url(${LETTER_PHOTO})`, WebkitBackgroundClip: "text" }}
      >
        KALO
      </div>
      <div ref={caption} className="absolute inset-x-0 bottom-0 mx-auto max-w-7xl px-4 pb-14 sm:px-6 lg:pb-20">
        <p className="kicker">Gracias Cristo · Olive</p>
        <h2 className="mt-4 max-w-3xl text-[clamp(2.25rem,6vw,5rem)]">
          Made to be worn, written to be <em>read</em>
        </h2>
      </div>
    </section>
  );
}
