import { ChristmasHero } from "@/components/home/ChristmasHero";
import { Collection } from "@/components/home/Collection";
import { Hampers } from "@/components/home/Hampers";
import { LogoHero } from "@/components/home/LogoHero";
import { LovedOnes } from "@/components/home/LovedOnes";
import { OrderByPill } from "@/components/home/OrderByPill";
import { ClosingCta, Faq, Gifting, Story } from "@/components/home/Sections";
import { WordTicker } from "@/components/home/WordTicker";
import { WearShowcase } from "@/components/home/WearShowcase";
import { BottleShowcase, FrameShowcase } from "@/components/home/Showcases";
import { isBottle } from "@/lib/bottles";
import { isVerseFrame } from "@/lib/frames";
import { isGarment } from "@/lib/garment";
import { getProducts } from "@/lib/catalog-data";
import type { Metadata } from "next";
import { STATIC_PAGES } from "@/lib/seo";
import { seoFor } from "@/lib/seo-data";
import { getSettings } from "@/lib/settings-data";

export async function generateMetadata(): Promise<Metadata> {
  const page = STATIC_PAGES.find((p) => p.key === "home")!;
  const seo = await seoFor(page.key, page.defaults);
  return { title: { absolute: seo.title }, description: seo.description, alternates: { canonical: "/" } };
}

/**
 * Home page. The logo hero is always first. While the Christmas switch is on,
 * the Christmas block follows as the second section; switching it off removes
 * it and the page closes up.
 */
export default async function Home() {
  const [products, settings] = await Promise.all([getProducts(), getSettings()]);

  return (
    <>
      <LogoHero christmas={settings.christmasHero} />
      <WordTicker />
      {settings.christmasHero && <ChristmasHero placement="section" />}

      <WearShowcase index={1} items={products.filter(isGarment)} />
      <BottleShowcase index={2} items={products.filter(isBottle)} />
      <FrameShowcase index={3} items={products.filter(isVerseFrame)} />
      <Hampers index={4} />
      <LovedOnes index={5} />
      <Collection
        index={6}
        label="The collection"
        items={products}
        title={
          <>
            Everyday pieces with something to <em>say</em>
          </>
        }
      />
      <Story index={7} />
      <Gifting index={8} />
      <Faq index={9} />
      <ClosingCta />

      <OrderByPill />
    </>
  );
}
