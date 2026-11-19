"use client";

import Image from "next/image";
import { useLayoutEffect, useRef, useState } from "react";
import { gsap } from "@/lib/gsap";
import { garmentSides, inr, LETTER_PHOTO, OUTFITS, type WearPiece } from "@/lib/wear";
import { GarmentFace } from "./Hanger";

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

/** A loose grid of photos that drift at slightly different speeds. */
export function Lookbook({ pieces, onOpen }: { pieces: WearPiece[]; onOpen: (i: number) => void }) {
  const root = useRef<HTMLElement>(null);
  const shots = [
    { i: 0, src: pieces[0]?.back, span: "lg:col-span-5", ratio: "aspect-[4/5]", speed: -50 },
    { i: 2, src: pieces[2]?.front, span: "lg:col-span-4 lg:col-start-7 lg:mt-32", ratio: "aspect-[4/5]", speed: 40 },
    { i: 3, src: pieces[3]?.back, span: "lg:col-span-3 lg:col-start-2", ratio: "aspect-[5/6]", speed: -20 },
    { i: 1, src: pieces[1]?.front, span: "lg:col-span-4 lg:col-start-6 lg:-mt-24", ratio: "aspect-[4/5]", speed: 60 },
    { i: 4, src: pieces[4]?.back, span: "lg:col-span-2 lg:mt-24", ratio: "aspect-[4/5]", speed: -40 },
  ].filter((s) => s.src);

  useLayoutEffect(() => {
    const mm = gsap.matchMedia();
    mm.add(`${MOTION} and (min-width: 1024px)`, () => {
      root.current?.querySelectorAll<HTMLElement>("[data-speed]").forEach((el) => {
        gsap.fromTo(
          el,
          { y: -Number(el.dataset.speed) },
          { y: Number(el.dataset.speed), ease: "none", scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: true } },
        );
      });
    });
    return () => mm.revert();
  }, []);

  return (
    <section ref={root} aria-labelledby="lookbook-title" className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:py-36">
      <div className="max-w-xl">
        <p className="kicker">Lookbook</p>
        <h2 id="lookbook-title" className="mt-4 text-[clamp(2.25rem,5vw,4rem)]">
          Worn, not <em>preached</em>
        </h2>
      </div>
      <div className="mt-14 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-12 lg:gap-8">
        {shots.map((s, k) => (
          <button
            key={k}
            type="button"
            data-speed={s.speed}
            onClick={() => onOpen(s.i)}
            className={`group relative block self-start overflow-hidden rounded-xl text-left ${s.span} ${k === 0 ? "col-span-2" : ""}`}
          >
            <span className={`relative block ${s.ratio}`}>
              <Image
                src={s.src!}
                alt={pieces[s.i].name}
                fill
                sizes="(min-width: 1024px) 40vw, 50vw"
                className="object-cover transition-transform duration-700 ease-glide group-hover:scale-105"
              />
            </span>
            <span className="absolute inset-x-0 bottom-0 flex items-end justify-between bg-gradient-to-t from-night/85 to-transparent p-4 pt-12 text-sm">
              <span>{pieces[s.i].name}</span>
              <span className="text-mist">{inr(pieces[s.i].price)}</span>
            </span>
          </button>
        ))}
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

/** A sideways strip of photos that slides past as you scroll down. */
export function PhotoStrip({ pieces, onOpen }: { pieces: WearPiece[]; onOpen: (i: number) => void }) {
  const root = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const shots = pieces.flatMap((p, i) =>
    [p.back, p.front].filter(Boolean).map((src) => ({ src: src!, i, side: src === p.back ? "Back" : "Front" })),
  );

  useLayoutEffect(() => {
    const mm = gsap.matchMedia();
    mm.add(MOTION, () => {
      const el = track.current!;
      const distance = () => Math.max(0, el.scrollWidth - window.innerWidth);
      gsap.to(el, {
        x: () => -distance(),
        ease: "none",
        scrollTrigger: { trigger: root.current, start: "top top", end: () => `+=${distance()}`, pin: true, scrub: 0.5, invalidateOnRefresh: true },
      });
    });
    return () => mm.revert();
  }, []);

  return (
    <section ref={root} aria-label="Every piece" className="relative flex h-[100svh] flex-col justify-center overflow-hidden bg-pine py-20 motion-reduce:h-auto">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
        <p className="kicker">The full run</p>
      </div>
      <div
        ref={track}
        className="mt-8 flex w-max gap-4 px-4 will-change-transform sm:gap-6 sm:px-6 lg:px-[max(1.5rem,calc((100vw-80rem)/2+1.5rem))] motion-reduce:w-auto motion-reduce:overflow-x-auto"
      >
        {shots.map((s) => (
          <button key={s.src} type="button" onClick={() => onOpen(s.i)} className="group w-[68vw] shrink-0 text-left sm:w-[40vw] lg:w-[24rem]">
            <span className="relative block aspect-[4/5] overflow-hidden rounded-xl">
              <Image
                src={s.src}
                alt={`${pieces[s.i].name}, ${s.side.toLowerCase()}`}
                fill
                sizes="(min-width: 1024px) 384px, 68vw"
                className="object-cover transition-transform duration-700 ease-glide group-hover:scale-105"
              />
            </span>
            <span className="mt-3 flex justify-between text-sm">
              <span>{pieces[s.i].name}</span>
              <span className="text-faint">{s.side}</span>
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}

/** The last rail: every piece hanging and gently swaying, one tap from its view. */
export function RailFooter({ pieces, onOpen }: { pieces: WearPiece[]; onOpen: (i: number) => void }) {
  return (
    <section aria-labelledby="rail-title" className="relative overflow-hidden py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-4 text-center sm:px-6">
        <h2 id="rail-title" className="text-[clamp(2.25rem,5vw,4rem)]">
          Back on the <em>rail</em>
        </h2>
        <p className="mx-auto mt-4 max-w-md text-mist">Pick one off the rail and turn it around.</p>
      </div>
      <div className="relative mt-16">
        <div aria-hidden="true" className="absolute inset-x-0 top-[6px] h-[3px] bg-gradient-to-r from-transparent via-gold to-transparent" />
        <div className="flex gap-4 overflow-x-auto px-4 pb-4 sm:justify-center sm:gap-6 sm:px-6 [scrollbar-width:none]">
          {pieces.map((p, i) => (
            <button
              key={p.id}
              type="button"
              onClick={() => onOpen(i)}
              className="group w-[40vw] shrink-0 motion-safe:animate-sway sm:w-44 lg:w-52"
              style={{ transformOrigin: "50% 0%", animationDelay: `${-i * 1.3}s` }}
            >
              <span className="relative mt-[6%] block aspect-[1000/1150] transition-transform duration-500 ease-glide group-hover:-translate-y-2">
                <GarmentFace src={garmentSides(p)[0]?.src ?? ""} alt={p.name} sizes="208px" />
              </span>
              <span className="mt-3 block text-sm">{p.name}</span>
              <span className="block text-xs text-faint">{inr(p.price)}</span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
