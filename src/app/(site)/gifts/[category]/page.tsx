import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { CataloguePage } from "@/components/product/CataloguePage";
import { categories, categoryBySlug, createCatalog } from "@/lib/catalog";
import { getProducts } from "@/lib/catalog-data";
import { isGarment } from "@/lib/garment";
import { isBottle } from "@/lib/bottles";
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
  // a category with nothing on sale yet is a "coming soon" page, kept out of search results
  const empty = !(await getProducts()).some((p) => p.category === category.id);
  return {
    title: seo.title,
    description: seo.description,
    alternates: { canonical: `/gifts/${category.slug}` },
    ...(empty ? { robots: { index: false, follow: true } } : {}),
  };
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
  if (productsIn(category.id).length === 0) {
    return (
      <section className="mx-auto max-w-2xl px-4 py-28 text-center sm:px-6 lg:py-40">
        <p className="kicker">Coming soon</p>
        <h1 className="mt-6 text-[clamp(2.75rem,7vw,5rem)]">{category.label}</h1>
        <p className="mx-auto mt-6 max-w-md text-lg text-mist">
          We are still making these. For now, have a look at our T-shirts, hoodies, bottles, frames and hampers.
        </p>
        <Link href="/gifts" className="btn btn-gold mt-10">
          See all gifts
        </Link>
      </section>
    );
  }
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
      bottles={category.id === "bottle" ? products.filter(isBottle) : undefined}
      frames={category.id === "frame"}
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
