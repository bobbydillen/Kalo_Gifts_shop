"use client";

import { useEffect, useRef, useState } from "react";

const INTRO_MS = 3300; // length of the logo animation
const GIVE_UP_MS = 6000; // never hold the page longer than this

/**
 * Full-screen logo intro, shown once per browser session.
 * The inline script in the root layout sets data-intro="seen" on <html> for
 * repeat views, and the CSS below hides this before it ever paints.
 */
export function Loader() {
  const [phase, setPhase] = useState<"show" | "leave" | "gone">("show");
  const img = useRef<HTMLImageElement>(null);

  useEffect(() => {
    // Repeat views: the CSS on the wrapper already keeps it hidden.
    const root = document.documentElement;
    if (root.dataset.intro === "seen") return;
    root.style.overflow = "hidden"; // no scrolling behind the intro
    let done = false;
    const timers: number[] = [];
    const leave = () => {
      if (done) return;
      done = true;
      try {
        sessionStorage.setItem("kalo-intro", "1");
      } catch {}
      root.style.overflow = "";
      setPhase("leave");
      timers.push(
        window.setTimeout(() => {
          root.dataset.intro = "done"; // later pages animate in without the intro delay
          setPhase("gone");
        }, 900),
      );
    };
    const start = () => timers.push(window.setTimeout(leave, INTRO_MS));

    const el = img.current;
    if (el?.complete) start();
    else el?.addEventListener("load", start, { once: true });
    timers.push(window.setTimeout(leave, GIVE_UP_MS));

    return () => {
      timers.forEach(clearTimeout);
      el?.removeEventListener("load", start);
      root.style.overflow = "";
    };
  }, []);

  if (phase === "gone") return null;

  return (
    <div
      aria-hidden="true"
      className={`fixed inset-0 z-[200] grid place-items-center bg-[radial-gradient(60%_60%_at_50%_50%,#12302a,var(--color-night)_70%)] transition-[opacity,filter] duration-[900ms] ease-glide [html[data-intro=seen]_&]:hidden ${
        phase === "leave" ? "pointer-events-none opacity-0 blur-md" : ""
      }`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- animated SVG must be a plain img */}
      <img
        ref={img}
        src="/logo/kalo-logo-animated.svg"
        alt=""
        width={420}
        height={420}
        className="h-[min(62vw,420px)] w-[min(62vw,420px)] drop-shadow-[0_40px_80px_rgba(0,0,0,0.6)]"
      />
    </div>
  );
}
