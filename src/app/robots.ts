import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

/** Search engines may read the shop, but not the admin, checkout, accounts, bills or order pages. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/checkout", "/account", "/invoice", "/order-placed"] },
    sitemap: `${site.url}/sitemap.xml`,
  };
}
