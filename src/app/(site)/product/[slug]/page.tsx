import { ProductGallery } from "@/components/product/ProductGallery";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { ProductArt } from "@/components/product/ProductArt";
import { ProductBuy } from "@/components/product/ProductBuy";
import { DesignPicker } from "@/components/product/DesignPicker";
import { ProductColourProvider } from "@/components/product/ProductColour";
import { ProductCard } from "@/components/product/ProductCard";
import { Reveal } from "@/components/ui/Reveal";
import { Rise } from "@/components/ui/Rise";
import { categoryOf, createCatalog, formatPrice, fromPrice } from "@/lib/catalog";
import { getProducts } from "@/lib/catalog-data";

export async function generateStaticParams() {
  const products = await getProducts();
  // an empty list is not allowed here, so a shop with no products still builds
  return products.length ? products.map((p) => ({ slug: p.slug })) : [{ slug: "none" }];
}

export async function generateMetadata({ params }: PageProps<"/product/[slug]">): Promise<Metadata> {
  const product = createCatalog(await getProducts()).productBySlug((await params).slug);
  return product ? { title: product.name, description: product.description } : {};
}

/** The address is read inside Suspense so moving between pages stays instant. */
export default function ProductPage({ params }: PageProps<"/product/[slug]">) {
  return (
    <Suspense>
      <ProductPageContent params={params} />
    </Suspense>
  );
}

async function ProductPageContent({ params }: Pick<PageProps<"/product/[slug]">, "params">) {
  const catalog = createCatalog(await getProducts());
  const product = catalog.productBySlug((await params).slug);
  if (!product) notFound();
  if (product.buildYourOwn) redirect("/hampers/build"); // this product is the builder, not a page of its own

  const category = categoryOf(product);
  const inside = catalog.hamperContents(product);
  const related = catalog.relatedTo(product);
  const designs = catalog.designsOf(product);

  return (
    <>
      <div className="mx-auto max-w-7xl px-4 pb-20 pt-8 sm:px-6 lg:pb-28 lg:pt-12">
        <nav aria-label="Breadcrumb" className="text-sm text-faint">
          <ol className="flex flex-wrap items-center gap-2">
            <li>
              <Link href="/gifts" className="transition-colors hover:text-gold-light">
                Gifts
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li>
              <Link href={`/gifts/${category.slug}`} className="transition-colors hover:text-gold-light">
                {category.label}
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li aria-current="page" className="text-mist">
              {product.name}
            </li>
          </ol>
        </nav>

        <ProductColourProvider first={product.colours[0]?.name}>
        <div className="mt-8 grid gap-10 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
          {/* Picture. Stays in view on wide screens while the details scroll. */}
          <Rise className="lg:sticky lg:top-28 lg:self-start">
            <ProductGallery
              images={product.images}
              imageColours={product.imageColours}
              name={product.name}
              tint={product.tint}
              tag={product.tag}
              fallback={<ProductArt category={product.category} className="w-[48%] text-gold-light" />}
            />
          </Rise>

          <div>
            <Rise delay={90}>
              <p className="kicker">{category.label}</p>
              <h1 className="mt-4 text-[clamp(2.5rem,5.5vw,4.5rem)]">{product.name}</h1>
              <p className="mt-4 text-lg text-mist">{product.line}</p>
              <p className="mt-6 font-serif text-4xl text-gold-light">
                {fromPrice(product).from && <span className="mr-2 font-sans text-base text-faint">From</span>}
                {formatPrice(fromPrice(product).price)}
              </p>
            </Rise>

            <Rise delay={180} className="mt-9 border-t border-hair pt-8">
              <DesignPicker current={product} others={designs} />
              <ProductBuy product={product} />
            </Rise>

            <Rise delay={270} className="mt-8 space-y-8">
              <p className="text-mist">{product.description}</p>

              {inside.length > 0 && (
                <section aria-labelledby="inside-title">
                  <h2 id="inside-title" className="text-2xl">
                    What is <em>inside</em>
                  </h2>
                  <ul className="mt-4 divide-y divide-hair border-y border-hair">
                    {inside.map((item) => (
                      <li key={item.slug}>
                        <Link
                          href={`/product/${item.slug}`}
                          className="group flex items-center gap-4 py-4 transition-colors hover:text-gold-light"
                        >
                          <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-pine-2">
                            <ProductArt
                              category={item.category}
                              className="w-8 text-gold-light transition-transform duration-500 ease-bounce group-hover:scale-110"
                            />
                          </span>
                          <span className="flex-1">
                            <span className="block font-serif text-xl leading-tight">{item.name}</span>
                            <span className="block text-sm text-faint">{item.line}</span>
                          </span>
                          <span className="text-sm text-mist">{formatPrice(item.price)}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {product.message && (
                <figure className="relative rounded-[22px] bg-[linear-gradient(170deg,#f6efe2,#eadfc9)] p-8 text-ink">
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-2.5 rounded-[15px] border border-gold-deep/45"
                  />
                  <p className="text-[0.6875rem] uppercase tracking-[0.24em] text-gold-deep">
                    The words on it
                  </p>
                  <blockquote className="mt-4 font-serif text-[1.6rem] leading-snug">
                    “{product.message.text}”
                  </blockquote>
                  {product.message.ref && (
                    <figcaption className="mt-3 font-serif italic text-gold-deep">
                      {product.message.ref}
                    </figcaption>
                  )}
                </figure>
              )}

              {product.details.length > 0 && (
                <section aria-labelledby="details-title">
                  <h2 id="details-title" className="text-2xl">
                    Good to <em>know</em>
                  </h2>
                  <ul className="mt-4 space-y-3 text-mist">
                    {product.details.map((detail) => (
                      <li key={detail} className="flex gap-4">
                        <span aria-hidden="true" className="text-gold">
                          ✦
                        </span>
                        {detail}
                      </li>
                    ))}
                    <li className="flex gap-4">
                      <span aria-hidden="true" className="text-gold">
                        ✦
                      </span>
                      Gift wrapping and a personal note can be added at checkout
                    </li>
                  </ul>
                </section>
              )}
            </Rise>
          </div>
        </div>
        </ProductColourProvider>
      </div>

      <section className="border-t border-hair bg-pine/60">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:py-28">
          <Reveal>
            <p className="kicker">Keep looking</p>
            <h2 className="mt-5 text-[clamp(2rem,4.5vw,3.5rem)]">
              You may also <em>like</em>
            </h2>
          </Reveal>
          <div className="mt-10 grid grid-cols-2 gap-x-4 gap-y-12 sm:gap-x-6 lg:grid-cols-4">
            {related.map((item, i) => (
              <Reveal key={item.slug} delay={i * 80}>
                <ProductCard product={item} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
