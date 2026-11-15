import type { Metadata } from "next";
import { HamperBuilder } from "@/components/hamper/HamperBuilder";
import { STATIC_PAGES } from "@/lib/seo";
import { seoFor } from "@/lib/seo-data";

export async function generateMetadata(): Promise<Metadata> {
  const page = STATIC_PAGES.find((p) => p.key === "hamper-builder")!;
  const seo = await seoFor(page.key, page.defaults);
  return { title: seo.title, description: seo.description, alternates: { canonical: page.path } };
}

export default function BuildHamperPage() {
  return <HamperBuilder />;
}
