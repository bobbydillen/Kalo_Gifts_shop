"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";

/**
 * Which logo file the hero shows, decided once per page load:
 *  - "idle"  when the loading screen is playing the intro right now (first
 *            visit of a session), so the intro is not shown twice
 *  - "intro" on every other load, so reloading the page replays the intro here
 */
let choice: "intro" | "idle" | undefined;
const pick = () =>
  (choice ??= document.documentElement.dataset.intro === "seen" ? "intro" : "idle");
const subscribe = () => () => {};

const files = { intro: "/logo/kalo-logo-animated.svg", idle: "/logo/kalo-logo-idle.svg" };

export function HeroLogo() {
  // null on the server: the choice depends on this browser's session
  const mode = useSyncExternalStore(subscribe, pick, () => null);
  const box = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  // The intro starts when the image loads, so hold the image back until the
  // logo is actually on screen. On phones it sits below the first screenful.
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.35 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const show = mode === "idle" || (mode === "intro" && inView);

  return (
    <div ref={box} className="size-[min(80vw,540px)]">
      {show && (
        // eslint-disable-next-line @next/next/no-img-element -- animated SVG must be a plain img
        <img
          src={files[mode]}
          alt="KALO Gifts. Artisanal gifts, made with heart."
          width={540}
          height={540}
          className="size-full drop-shadow-[0_50px_90px_rgba(0,0,0,0.65)]"
        />
      )}
    </div>
  );
}
