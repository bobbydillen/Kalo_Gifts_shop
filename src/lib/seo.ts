import { categories } from "@/lib/catalog";
import { site } from "@/lib/site";

/**
 * The search-engine title and description of each page. These are the defaults; the admin can
 * override any of them (saved in the database, see lib/seo-data.ts). Safe to import anywhere.
 */
export type SeoText = { title: string; description: string };
export type SeoPage = { key: string; label: string; path: string; defaults: SeoText };

export const HOME_TITLE = "Christian T-Shirts and Printed Christian Gifts | KALO Gifts";

export const categoryKey = (slug: string) => `category:${slug}`;
export const productKey = (slug: string) => `product:${slug}`;

export const STATIC_PAGES: SeoPage[] = [
  { key: "home", label: "Home page", path: "/", defaults: { title: HOME_TITLE, description: site.description } },
  {
    key: "gifts",
    label: "All gifts",
    path: "/gifts",
    defaults: {
      title: "Christian gifts: Bible verse tees, bottles, hampers and more",
      description:
        "Shop Christian gifts online in India: Bible verse T-shirts and hoodies, printed water bottles, keychains, personalised photo frames and gift hampers for Christmas and every occasion.",
    },
  },
  {
    key: "christmas",
    label: "Christmas gifts",
    path: "/christmas",
    defaults: {
      title: "Christian Christmas gifts and hampers",
      description:
        "Christian Christmas gifts and Christmas hampers: Bible verse tees, bottles and keepsakes, gift wrapped with a handwritten card. Build your own Christmas hamper. Delivered across India.",
    },
  },
  {
    key: "hamper-builder",
    label: "Build your own hamper",
    path: "/hampers/build",
    defaults: {
      title: "Build your own gift hamper: customised Christmas hampers",
      description:
        "Build a customised gift hamper: choose three or more gifts, pick their colours and sizes, add a handwritten card, and we pack it with care. Perfect for Christmas. Delivered across India.",
    },
  },
];

export const CATEGORY_PAGES: SeoPage[] = categories.map((c) => ({
  key: categoryKey(c.slug),
  label: c.label,
  path: `/gifts/${c.slug}`,
  defaults: { title: c.seoTitle, description: c.seoDescription },
}));

/** The saved text if there is any, otherwise the default. Blank saved fields fall back too. */
export function mergeSeo(defaults: SeoText, saved?: Partial<SeoText>): SeoText {
  return { title: saved?.title?.trim() || defaults.title, description: saved?.description?.trim() || defaults.description };
}
