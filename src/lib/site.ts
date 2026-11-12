/**
 * Fixed site-wide content. The Christmas switches, dates and gift prices are not here:
 * they are settings in the database, edited in the admin (see lib/settings.ts).
 */

export const site = {
  name: "KALO Gifts",
  tagline: "Artisanal gifts, made with heart.",
  description:
    "Faith-inspired gifts and everyday pieces, thoughtfully designed and made to be shared.",
};

const baseLinks = [
  { label: "Gifts", href: "/gifts" },
  { label: "Loved ones", href: "/#loved-ones" },
  { label: "Hampers", href: "/gifts/hampers" },
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

export type NavLink = { label: string; href: string; seasonal?: boolean };

/** The Christmas link appears only while Christmas is switched on (a setting in the admin). */
const christmasLink: NavLink = { label: "Christmas", href: "/christmas", seasonal: true };

export const navLinksFor = (christmasOn: boolean, accountOn: boolean): NavLink[] => [
  ...(christmasOn ? [christmasLink] : []),
  ...baseLinks,
  ...(accountOn ? [{ label: "Account", href: "/account" }] : []),
];

export const footerLinksFor = (christmasOn: boolean, accountOn: boolean): NavLink[] => [
  ...navLinksFor(christmasOn, accountOn),
  { label: "Our story", href: "/#story" },
];
