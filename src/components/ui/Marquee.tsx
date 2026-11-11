import type { ReactNode } from "react";

/**
 * Endless horizontal ticker. The content is rendered several times so the
 * loop has no visible seam; copies after the first are hidden from screen readers.
 */
export function Marquee({
  children,
  seconds = 40,
  className = "",
}: {
  children: ReactNode;
  seconds?: number;
  className?: string;
}) {
  return (
    <div className={`overflow-hidden ${className}`}>
      <div
        className="flex w-max animate-marquee whitespace-nowrap hover:[animation-play-state:paused]"
        style={{ "--marquee-time": `${seconds}s` } as React.CSSProperties}
      >
        {[0, 1, 2, 3].map((copy) => (
          <div key={copy} className="flex shrink-0 items-center" aria-hidden={copy > 0}>
            {children}
          </div>
        ))}
      </div>
    </div>
  );
}
