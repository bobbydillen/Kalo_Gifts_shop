import Link from "next/link";
import { ProductForm } from "@/components/admin/ProductForm";
import { supabaseServer } from "@/lib/supabase/server";

export const metadata = { title: "New product" };

export default async function NewProductPage() {
  const supabase = await supabaseServer();
  const { data: others } = await supabase.from("products").select("slug, name").neq("category", "hamper").order("name");

  return (
    <div className="max-w-3xl">
      <Link href="/admin/products" className="text-sm text-faint underline underline-offset-4 hover:text-cream">
        ← All products
      </Link>
      <h1 className="mb-8 mt-4 text-5xl">
        New <em>product</em>
      </h1>
      <ProductForm others={others ?? []} images={[]} />
    </div>
  );
}
