import type { Metadata } from "next";
import { HamperBuilder } from "@/components/hamper/HamperBuilder";

export const metadata: Metadata = {
  title: "Build your own gift hamper: customised Christmas hampers",
  description:
    "Build a customised gift hamper: choose three or more gifts, pick their colours and sizes, add a handwritten card, and we pack it with care. Perfect for Christmas. Delivered across India.",
  alternates: { canonical: "/hampers/build" },
};

export default function BuildHamperPage() {
  return <HamperBuilder />;
}
