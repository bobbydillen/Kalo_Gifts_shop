import type { MetadataRoute } from "next";
import { categories } from "@/lib/catalog";
import { getProducts } from "@/lib/catalog-data";
import { POLICY_LINKS } from "@/lib/policies";
import { site } from "@/lib/site";

/** Every public page, so search engines find new products without waiting to crawl a link. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await getProducts();
  const page = (path: string, priority: number): MetadataRoute.Sitemap[number] => ({ url: `${site.url}${path}`, priority });
  return [
    page("/", 1),
    page("/gifts", 0.9),
    page("/christmas", 0.8),
    page("/hampers/build", 0.7),
    page("/contact", 0.4),
    ...categories.filter((c) => products.some((p) => p.category === c.id)).map((c) => page(`/gifts/${c.slug}`, 0.8)),
    ...products.filter((p) => !p.buildYourOwn).map((p) => page(`/product/${p.slug}`, 0.7)),
    ...POLICY_LINKS.map((p) => page(`/policies/${p.slug}`, 0.2)),
  ];
}
