import type { CSSProperties, ReactNode } from "react";

/**
 * Entrance for content that is on screen when the page loads. It is pure CSS
 * (see .rise in globals.css), so it does not wait for JavaScript.
 */
export function Rise({
  children,
  delay = 0,
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <div className={`rise ${className}`} style={{ "--rise-delay": `${delay}ms` } as CSSProperties}>
      {children}
    </div>
  );
}
