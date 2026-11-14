import type { Metadata } from "next";
import { HamperBuilder } from "@/components/hamper/HamperBuilder";

export const metadata: Metadata = {
  title: "Build your own hamper",
  description: "Choose three or more gifts, pick their colours and sizes, and we pack them together with care.",
};

export default function BuildHamperPage() {
  return <HamperBuilder />;
}
