import type { Metadata } from "next";
import { WearPage } from "@/components/wear/WearPage";

// Kept out of search results while the pieces, prices and photos are still being finalised.
export const metadata: Metadata = {
  title: "KALO Wear: oversized Christian T-shirts and hoodies",
  description: "Oversized Christian T-shirts and hoodies with Bible verse prints, from KALO Gifts.",
  alternates: { canonical: "/wear" },
  robots: { index: false, follow: true },
};

export default function Page() {
  return <WearPage />;
}
