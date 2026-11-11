/**
 * Site-wide content that the admin panel will manage later (phase 5).
 * Until then this file is the single place to edit it.
 */

export const site = {
  name: "KALO Gifts",
  tagline: "Artisanal gifts, made with heart.",
  description:
    "Faith-inspired gifts and everyday pieces, thoughtfully designed and made to be shared.",
};

const baseLinks = [
  { label: "Gifts", href: "/#gifts" },
  { label: "Loved ones", href: "/#loved-ones" },
  { label: "Hampers", href: "/#hampers" },
];

/** Thin strip above the header. */
export const announcements = [
  "Gifts that carry meaning",
  "Thoughtfully designed",
  "Packed with care",
  "Made with heart",
];

/** Large word ticker between sections. */
export const tickerWords = ["Faith", "Meaning", "Quality", "The joy of giving"];

/**
 * Seasonal features. Each one is a switch so the Christmas layer can be
 * turned off after the season without touching code elsewhere.
 * The admin panel (phase 5) will edit these; until then, edit them here.
 *
 * PLACEHOLDER DATE: orderByDate below is a stand-in so the banner can be seen
 * working. Replace it with the real last day to order for Christmas delivery.
 */
export const seasonal = {
  snowfall: true,
  countdown: true,
  christmasHero: true,
  orderByBanner: true,
  orderByDate: "2026-12-18T23:59:00+05:30", // placeholder
  christmasDate: "2026-12-25T00:00:00+05:30",
};

/** The Christmas link appears only while the Christmas switch is on. */
const christmasLink = { label: "Christmas", href: "/christmas", seasonal: true };
export const navLinks: { label: string; href: string; seasonal?: boolean }[] = seasonal.christmasHero
  ? [christmasLink, ...baseLinks]
  : baseLinks;
export const footerLinks = [...navLinks, { label: "Our story", href: "/#story" }];
