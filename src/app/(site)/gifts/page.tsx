import type { Metadata } from "next";
import { CataloguePage } from "@/components/product/CataloguePage";
import { getProducts } from "@/lib/catalog-data";
import { STATIC_PAGES } from "@/lib/seo";
import { seoFor } from "@/lib/seo-data";

export async function generateMetadata(): Promise<Metadata> {
  const page = STATIC_PAGES.find((p) => p.key === "gifts")!;
  const seo = await seoFor(page.key, page.defaults);
  return { title: seo.title, description: seo.description, alternates: { canonical: page.path } };
}

export default async function GiftsPage() {
  return (
    <CataloguePage
      kicker="The collection"
      title={
        <>
          All <em>gifts</em>
        </>
      }
      intro="Everyday pieces with something to say, for the people who come to mind."
      items={await getProducts()}
      active={null}
      showrooms
    />
  );
}
