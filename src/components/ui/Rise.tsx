import type { CSSProperties, ReactNode } from "react";

/**
 * Entrance for content that is on screen when the page loads. It is pure CSS
 * (see .rise in globals.css), so it does not wait for JavaScript.
 */
export function Rise({
  children,
  delay = 0,
  className = "",
  id,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  id?: string;
}) {
  return (
    <div id={id} className={`rise ${className}`} style={{ "--rise-delay": `${delay}ms` } as CSSProperties}>
      {children}
    </div>
  );
}
