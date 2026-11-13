import type { Category } from "@/lib/catalog";

/**
 * Line drawings that stand in for product photos until real ones are added.
 * Drawn on a 120-unit square and coloured by the parent's text colour.
 */
const art: Record<Category, React.ReactNode> = {
  tshirt: (
    <path d="M42 22 24 32 12 52l14 8 8-10v48h52V50l8 10 14-8-12-20-18-10c-4 8-32 8-36 0Z" />
  ),
  hoodie: (
    <>
      <path d="M40 30 20 42l-8 42 14 4 6-26v38h56V62l6 26 14-4-8-42-20-12" />
      <path d="M40 30c0-20 40-20 40 0-6 10-34 10-40 0Z" />
      <path d="M44 78h32l4 16H40ZM54 38v16M66 38v16" />
    </>
  ),
  cap: (
    <>
      <path d="M24 72c-2-28 18-44 38-44s34 16 34 40" />
      <path d="M24 72c16-8 56-10 72-4 8 2 16 8 14 14-18-6-60-8-86-10ZM62 28v-5" />
    </>
  ),
  keychain: (
    <>
      <circle cx="60" cy="30" r="14" />
      <path d="M60 44v12" />
      <rect x="40" y="56" width="40" height="48" rx="8" />
      <circle cx="60" cy="67" r="3" />
      <path d="M60 78v14M53 85h14" />
    </>
  ),
  tote: (
    <>
      <path d="M26 44h68l6 60H20Z" />
      <path d="M44 44c0-30 32-30 32 0" />
      <path d="M60 64v20M52 72h16" />
    </>
  ),
  bottle: (
    <>
      <path d="M50 14h20v12H50Z" />
      <path d="M52 26v8c-8 4-10 10-10 16v50c0 4 4 6 8 6h20c4 0 8-2 8-6V50c0-6-2-12-10-16v-8" />
      <path d="M42 62h36M42 84h36" />
    </>
  ),
  frame: (
    <>
      <rect x="22" y="14" width="76" height="92" rx="3" />
      <rect x="32" y="24" width="56" height="72" />
      <path d="M32 82l16-18 12 12 10-8 18 16M70 42a6 6 0 1 0 .01 0" />
    </>
  ),
  hamper: (
    <>
      <path d="M20 56h80v46H20ZM14 42h92v14H14ZM60 42v60" />
      <path d="M60 42c-16-22-30-8 0 0 30-8 16-22 0 0Z" />
    </>
  ),
};

export function ProductArt({ category, className = "" }: { category: Category; className?: string }) {
  return (
    <svg
      viewBox="0 0 120 120"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      {art[category]}
    </svg>
  );
}
