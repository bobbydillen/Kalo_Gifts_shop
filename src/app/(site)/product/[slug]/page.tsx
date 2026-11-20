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
import { ViewContent } from "@/components/analytics/PixelEvents";
import { JsonLd } from "@/components/site/JsonLd";
import { productKey } from "@/lib/seo";
import { seoFor } from "@/lib/seo-data";
import { site } from "@/lib/site";
import { garmentPhotos, isGarment } from "@/lib/garment";
import { bottleStyle, isBottle } from "@/lib/bottles";
import { BottleGallery } from "@/components/bottles/BottleGallery";
import { FrameGallery } from "@/components/frames/FrameGallery";
import { isVerseFrame } from "@/lib/frames";
import { BottleFacts } from "@/components/bottles/BottleFacts";
import { BottleMore } from "@/components/bottles/BottleMore";
import { chatLink } from "@/lib/contact";
import { getSettings } from "@/lib/settings-data";
import { GarmentGallery } from "@/components/wear/GarmentGallery";
import { StickyBuyBar } from "@/components/wear/StickyBuyBar";

export async function generateStaticParams() {
  const products = await getProducts();
  // an empty list is not allowed here, so a shop with no products still builds
  return products.length ? products.map((p) => ({ slug: p.slug })) : [{ slug: "none" }];
}

export async function generateMetadata({ params }: PageProps<"/product/[slug]">): Promise<Metadata> {
  const product = createCatalog(await getProducts()).productBySlug((await params).slug);
  if (!product) return {};
  const image = product.images[0];
  const seo = await seoFor(productKey(product.slug), { title: product.name, description: product.description });
  return {
    title: seo.title,
    description: seo.description,
    alternates: { canonical: `/product/${product.slug}` },
    openGraph: {
      type: "website",
      title: `${seo.title} · ${site.name}`,
      description: seo.description,
      url: `/product/${product.slug}`,
      ...(image ? { images: [{ url: image, alt: product.name }] } : {}),
    },
    twitter: { card: image ? "summary_large_image" : "summary", title: seo.title, description: seo.description, ...(image ? { images: [image] } : {}) },
  };
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

  const tracked = Object.values(product.stock);
  const inStock = tracked.length === 0 || tracked.some((n) => n > 0);
  const garment = isGarment(product);
  const bottle = isBottle(product);
  const style = bottle ? bottleStyle(product.designGroup) : undefined;
  const otherColour = bottle ? chatLink(await getSettings(), `Hi KALO Gifts, could I get the "${product.name}" design on a different bottle colour or style?`) : null;

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Product",
          name: product.name,
          description: product.description,
          category: category.label,
          brand: { "@type": "Brand", name: site.name },
          ...(product.images.length ? { image: product.images.map((i) => (i.startsWith("/") ? `${site.url}${i}` : i)) } : {}),
          url: `${site.url}/product/${product.slug}`,
          offers: {
            "@type": "Offer",
            priceCurrency: "INR",
            price: fromPrice(product).price,
            availability: inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
            url: `${site.url}/product/${product.slug}`,
          },
        }}
      />
      {(garment || bottle) && <StickyBuyBar name={product.name} price={formatPrice(fromPrice(product).price)} target="buy" />}
      <ViewContent slug={product.slug} name={product.name} category={category.label} price={fromPrice(product).price} />
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
        <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:gap-16">
          {/* Picture. Stays in view on wide screens while the details scroll. */}
          {garment ? (
            // no rise-in here: the garment arrives from the rail instead
            <div className="lg:sticky lg:top-28 lg:self-start">
              <GarmentGallery slug={product.slug} name={product.name} tint={product.tint} tag={product.tag} photos={garmentPhotos(product)} />
            </div>
          ) : bottle ? (
            <div className="lg:sticky lg:top-28 lg:self-start">
              <BottleGallery product={product} />
            </div>
          ) : isVerseFrame(product) ? (
            <div className="lg:sticky lg:top-28 lg:self-start">
              <FrameGallery product={product} />
            </div>
          ) : (
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
          )}

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

            <Rise delay={180} className="mt-9 scroll-mt-28 border-t border-hair pt-8" id="buy">
              {!bottle && <DesignPicker current={product} others={designs} />}
              <ProductBuy product={product} />
              {otherColour && (
                <a href={otherColour} target="_blank" rel="noopener noreferrer" className="mt-4 inline-block text-sm text-gold-light underline-offset-4 hover:underline">
                  Want this design on another colour or bottle? Ask us on WhatsApp
                </a>
              )}
              {bottle && (
                <div className="mt-8">
                  <BottleMore product={product} all={catalog.products} />
                </div>
              )}
            </Rise>

            <Rise delay={270} className="mt-8 space-y-8">
              <p className="text-mist">{product.description}</p>
              {style && <BottleFacts style={style} />}

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
