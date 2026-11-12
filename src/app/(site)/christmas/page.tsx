import type { Metadata } from "next";
import { ChristmasHero } from "@/components/home/ChristmasHero";
import { Collection } from "@/components/home/Collection";
import { Hampers } from "@/components/home/Hampers";
import { LovedOnes } from "@/components/home/LovedOnes";
import { OrderByPill } from "@/components/home/OrderByPill";
import { ClosingCta, Gifting } from "@/components/home/Sections";
import { WordTicker } from "@/components/home/WordTicker";
import { Button } from "@/components/ui/Button";
import { Rise } from "@/components/ui/Rise";
import { createCatalog } from "@/lib/catalog";
import { getProducts } from "@/lib/catalog-data";
import { seasonal } from "@/lib/site";

export const metadata: Metadata = {
  title: "Christmas gifts",
  description:
    "Christmas gifts and hampers from KALO Gifts. Thoughtful, faith-inspired pieces, gift wrapped with a personal note.",
};


/**
 * The page Christmas searches, ads and social links land on.
 * Out of season the address stays alive with a short holding message, so it
 * keeps its place in search results for next year.
 */
export default async function ChristmasPage() {
  if (!seasonal.christmasHero) return <OutOfSeason />;
  const { christmasProducts } = createCatalog(await getProducts());

  return (
    <>
      <ChristmasHero placement="page-top" />
      <WordTicker />
      <Hampers index={1} />
      <Collection
        index={2}
        label="Christmas gifts"
        items={christmasProducts()}
        title={
          <>
            The Christmas <em>edit</em>
          </>
        }
      />
      <LovedOnes index={3} />
      <Gifting index={4} />
      <ClosingCta />
      <OrderByPill />
    </>
  );
}

function OutOfSeason() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-32 text-center sm:px-6 lg:py-44">
      <Rise>
        <p className="kicker">The Christmas edit</p>
        <h1 className="mt-6 text-[clamp(2.75rem,8vw,6rem)]">
          Back next <em>season</em>
        </h1>
        <p className="mx-auto mt-8 max-w-md text-lg text-mist">
          Our Christmas gifts and hampers return later in the year. Until then, the everyday
          collection is here whenever someone comes to mind.
        </p>
        <div className="mt-10">
          <Button href="/#gifts" arrow>
            Shop gifts
          </Button>
        </div>
      </Rise>
    </section>
  );
}
