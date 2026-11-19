import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { CataloguePage } from "@/components/product/CataloguePage";
import { categories, categoryBySlug, createCatalog } from "@/lib/catalog";
import { getProducts } from "@/lib/catalog-data";
import { isGarment } from "@/lib/garment";
import { LetterWindow, OutfitChange } from "@/components/wear/WearSections";
import { categoryKey } from "@/lib/seo";
import { seoFor } from "@/lib/seo-data";

export function generateStaticParams() {
  return categories.map((c) => ({ category: c.slug }));
}

export async function generateMetadata({ params }: PageProps<"/gifts/[category]">): Promise<Metadata> {
  const category = categoryBySlug((await params).category);
  if (!category) return {};
  const seo = await seoFor(categoryKey(category.slug), { title: category.seoTitle, description: category.seoDescription });
  return { title: seo.title, description: seo.description, alternates: { canonical: `/gifts/${category.slug}` } };
}

/** The address is read inside Suspense so moving between pages stays instant. */
export default function CategoryPage({ params }: PageProps<"/gifts/[category]">) {
  return (
    <Suspense>
      <CategoryPageContent params={params} />
    </Suspense>
  );
}

async function CategoryPageContent({ params }: Pick<PageProps<"/gifts/[category]">, "params">) {
  const category = categoryBySlug((await params).category);
  if (!category) notFound();
  const products = await getProducts();
  const { productsIn } = createCatalog(products);
  // tees and hoodies hang on one rail together, this page's own pieces first
  const wear = category.id === "tshirt" || category.id === "hoodie" ? products.filter(isGarment) : [];
  const rail = [...wear.filter((p) => p.category === category.id), ...wear.filter((p) => p.category !== category.id)];

  return (
    <>
    <CataloguePage
      kicker="The collection"
      title={category.label}
      intro={category.intro}
      items={productsIn(category.id)}
      active={category.slug}
      about={{ heading: category.seoTitle, text: category.about }}
      rail={rail}
    />
    {rail.length > 0 && (
      <>
        <OutfitChange />
        <LetterWindow />
      </>
    )}
    </>
  );
}
