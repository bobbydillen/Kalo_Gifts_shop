"use client";

import { useEffect, useRef } from "react";

/**
 * Gentle snowfall over the whole page. Draws on one canvas, stops while the
 * tab is hidden, and never runs for visitors who prefer reduced motion.
 */
export function Snowfall() {
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const el = canvas.current;
    const ctx = el?.getContext("2d");
    if (!el || !ctx || matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let width = 0;
    let height = 0;
    let frame = 0;
    let last = performance.now();
    type Flake = { x: number; y: number; r: number; speed: number; drift: number; phase: number; alpha: number };
    let flakes: Flake[] = [];

    const make = (anywhere: boolean): Flake => {
      const depth = Math.random(); // 0 far, 1 near
      return {
        x: Math.random() * width,
        y: anywhere ? Math.random() * height : -8,
        r: 0.6 + depth * 2,
        speed: 14 + depth * 34,
        drift: 6 + depth * 14,
        phase: Math.random() * Math.PI * 2,
        alpha: 0.25 + depth * 0.5,
      };
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      el.width = width * dpr;
      el.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.round(Math.min(90, (width * height) / 16000));
      flakes = Array.from({ length: count }, () => make(true));
    };

    const draw = (time: number) => {
      const dt = Math.min(0.05, (time - last) / 1000);
      last = time;
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = "#F3ECDF";
      for (let i = 0; i < flakes.length; i++) {
        const f = flakes[i];
        f.y += f.speed * dt;
        f.phase += dt;
        const x = f.x + Math.sin(f.phase) * f.drift;
        if (f.y > height + 8) flakes[i] = make(false);
        ctx.globalAlpha = f.alpha;
        ctx.beginPath();
        ctx.arc(x, f.y, f.r, 0, Math.PI * 2);
        ctx.fill();
      }
      frame = requestAnimationFrame(draw);
    };

    const onVisibility = () => {
      cancelAnimationFrame(frame);
      if (!document.hidden) {
        last = performance.now();
        frame = requestAnimationFrame(draw);
      }
    };

    resize();
    onVisibility();
    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return <canvas ref={canvas} aria-hidden="true" className="pointer-events-none fixed inset-0 z-20 size-full" />;
}
