"use client";

import { useEffect, useRef } from "react";

/** Thin gold ribbon under the header that fills as the page is scrolled. */
export function ScrollRibbon() {
  const bar = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const progress = max > 0 ? Math.min(1, window.scrollY / max) : 0;
      if (bar.current) bar.current.style.transform = `scaleX(${progress})`;
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <div aria-hidden="true" className="absolute inset-x-0 -bottom-px h-0.5">
      <div
        ref={bar}
        className="h-full origin-left scale-x-0 bg-gradient-to-r from-gold-deep via-gold to-gold-light"
      />
    </div>
  );
}
