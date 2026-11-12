import type { Metadata } from "next";
import { CataloguePage } from "@/components/product/CataloguePage";
import { allProducts } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "All gifts",
  description: "Every piece from KALO Gifts: tees, hoodies, caps, totes, bottles, keychains and hampers.",
};

export default function GiftsPage() {
  return (
    <CataloguePage
      kicker="The collection"
      title={
        <>
          All <em>gifts</em>
        </>
      }
      intro="Everyday pieces with something to say, for the people who come to mind."
      items={allProducts()}
      active={null}
    />
  );
}
