"use client";

import { useEffect, useRef, useState } from "react";
import { verses } from "@/lib/verses";
import "./hero-gift.css";

const baubles = [
  { x: "6%", y: "10%", k: 0.36, c: "#c23a36", d: "#5c1012", depth: 26, t: "7s", delay: "0s" },
  { x: "78%", y: "4%", k: 0.26, c: "#d4b373", d: "#6e5220", depth: -18, t: "6s", delay: "-2s" },
  { x: "84%", y: "58%", k: 0.2, c: "#2c6b55", d: "#0b1d16", depth: 34, t: "8s", delay: "-4s" },
  { x: "10%", y: "66%", k: 0.22, c: "#d4b373", d: "#6e5220", depth: -30, t: "7.5s", delay: "-1s" },
  { x: "46%", y: "0%", k: 0.14, c: "#c23a36", d: "#5c1012", depth: 14, t: "5.5s", delay: "-3s" },
];

/**
 * The gift in the hero. It leans toward the pointer, and opening it lifts the
 * lid and shows a short verse on a card. Faith is offered here, never pushed:
 * the visitor chooses to open it.
 */
export function HeroGift() {
  const stage = useRef<HTMLDivElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const [verse, setVerse] = useState(0);

  // Lean toward the pointer, eased so it never snaps.
  useEffect(() => {
    const el = stage.current;
    if (!el || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let frame = 0;
    let tx = 0;
    let ty = 0;
    let x = 0;
    let y = 0;
    const step = () => {
      x += (tx - x) * 0.07;
      y += (ty - y) * 0.07;
      el.style.setProperty("--px", x.toFixed(3));
      el.style.setProperty("--py", y.toFixed(3));
      frame = Math.abs(tx - x) + Math.abs(ty - y) > 0.002 ? requestAnimationFrame(step) : 0;
    };
    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      const box = el.getBoundingClientRect();
      tx = Math.max(-1, Math.min(1, (e.clientX - (box.left + box.width / 2)) / (window.innerWidth / 2)));
      ty = Math.max(-1, Math.min(1, (e.clientY - (box.top + box.height / 2)) / (window.innerHeight / 2)));
      if (!frame) frame = requestAnimationFrame(step);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", onMove);
    };
  }, []);

  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const openGift = () => {
    if (open) return;
    setOpen(true);
    // let the lid lift before the card arrives
    timer.current = window.setTimeout(() => dialog.current?.showModal(), 700);
  };
  const another = () => setVerse((v) => (v + 1) % verses.length);
  const onClose = () => {
    setOpen(false);
    another(); // a different verse next time
  };

  const current = verses[verse];

  return (
    <div className="flex flex-col items-center gap-2">
      <div ref={stage} className="gift-stage" data-open={open}>
        {baubles.map((b, i) => (
          <span
            key={i}
            aria-hidden="true"
            className="bauble"
            style={
              {
                "--x": b.x,
                "--y": b.y,
                "--k": b.k,
                "--c": b.c,
                "--d": b.d,
                "--depth": b.depth,
                "--t": b.t,
                "--delay": b.delay,
              } as React.CSSProperties
            }
          />
        ))}
        <span aria-hidden="true" className="gift-shadow" />
        <span aria-hidden="true" className="gift-light" />
        <div className="gift-float">
          <button
            type="button"
            className="gift"
            data-open={open}
            onClick={openGift}
            aria-label="Open the gift for a surprise"
          >
            <span className="body">
              <span className="face back" />
              <span className="face left" />
              <span className="face right" />
              <span className="face mouth" />
              <span className="face front" />
            </span>
            <span className="lid">
              <span className="face under" />
              <span className="face back" />
              <span className="face left" />
              <span className="face right" />
              <span className="face front" />
              <span className="face top" />
              <span className="bow">
                <i />
                <i />
              </span>
              <span className="bow cross">
                <i />
                <i />
              </span>
            </span>
          </button>
        </div>
      </div>

      <button type="button" className="gift-hint" onClick={openGift}>
        <span aria-hidden="true">✦</span>
        Tap the gift for a surprise
      </button>

      <dialog ref={dialog} className="verse-dialog" onClose={onClose} aria-labelledby="verse-title">
        <div className="verse-card">
          <p id="verse-title" className="text-[0.6875rem] uppercase tracking-[0.24em] text-gold-deep">
            A little something for you
          </p>
          <div key={verse} className="verse-swap">
            <blockquote className="mt-4 font-serif text-[clamp(1.55rem,3.4vw,2.1rem)] leading-tight tracking-[-0.01em]">
              “{current.text}”
            </blockquote>
            <p className="mt-4 font-serif italic text-gold-deep">{current.ref}</p>
          </div>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={another}
              className="rounded-full border border-ink/25 px-5 py-2.5 text-[0.6875rem] font-semibold uppercase tracking-[0.16em] transition-[transform,background-color] duration-500 ease-bounce hover:-translate-y-0.5 hover:bg-ink/5 active:scale-95"
            >
              Another one
            </button>
            <button
              type="button"
              onClick={() => dialog.current?.close()}
              className="rounded-full bg-ink px-5 py-2.5 text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-cream transition-transform duration-500 ease-bounce hover:-translate-y-0.5 active:scale-95"
            >
              Close
            </button>
          </div>
        </div>
      </dialog>
    </div>
  );
}
