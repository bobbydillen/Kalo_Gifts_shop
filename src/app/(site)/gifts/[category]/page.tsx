import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { CataloguePage } from "@/components/product/CataloguePage";
import { categories, categoryBySlug, createCatalog } from "@/lib/catalog";
import { getProducts } from "@/lib/catalog-data";

export function generateStaticParams() {
  return categories.map((c) => ({ category: c.slug }));
}

export async function generateMetadata({ params }: PageProps<"/gifts/[category]">): Promise<Metadata> {
  const category = categoryBySlug((await params).category);
  return category ? { title: category.label, description: category.intro } : {};
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
  const { productsIn } = createCatalog(await getProducts());

  return (
    <CataloguePage
      kicker="The collection"
      title={category.label}
      intro={category.intro}
      items={productsIn(category.id)}
      active={category.slug}
    />
  );
}
