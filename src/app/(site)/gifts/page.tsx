import type { Metadata } from "next";
import { CataloguePage } from "@/components/product/CataloguePage";
import { getProducts } from "@/lib/catalog-data";

export const metadata: Metadata = {
  title: "Christian gifts: Bible verse tees, bottles, hampers and more",
  description:
    "Shop Christian gifts online in India: Bible verse T-shirts and hoodies, printed water bottles, keychains, personalised photo frames and gift hampers for Christmas and every occasion.",
  alternates: { canonical: "/gifts" },
};

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
    />
  );
}
