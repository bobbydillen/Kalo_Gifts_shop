import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductForm } from "@/components/admin/ProductForm";
import type { AdminImage, ProductInput } from "@/lib/admin-products";
import type { Category } from "@/lib/catalog";
import { supabaseServer } from "@/lib/supabase/server";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const metadata = { title: "Edit product" };

export default async function EditProductPage({ params, searchParams }: PageProps<"/admin/products/[id]">) {
  const { id } = await params;
  const justCreated = (await searchParams).created === "1";
  if (!UUID.test(id)) notFound();

  const supabase = await supabaseServer();
  const [{ data: product }, { data: others }] = await Promise.all([
    supabase
      .from("products")
      .select("*, product_colours(name, hex, position), stock(colour, size, qty), product_images(id, path, position)")
      .eq("id", id)
      .maybeSingle(),
    supabase.from("products").select("slug, name").neq("category", "hamper").neq("id", id).order("name"),
  ]);
  if (!product) notFound();

  const initial: ProductInput & { id: string } = {
    id: product.id,
    slug: product.slug,
    name: product.name,
    category: product.category as Category,
    price: product.price,
    weight_g: product.weight_g,
    length_cm: product.length_cm,
    breadth_cm: product.breadth_cm,
    height_cm: product.height_cm,
    line: product.line,
    description: product.description,
    message_text: product.message_text ?? "",
    message_ref: product.message_ref ?? "",
    details: product.details,
    sizes: product.sizes,
    tint: product.tint,
    tag: product.tag ?? "",
    christmas: product.christmas,
    contains: product.contains,
    active: product.active,
    sort: product.sort,
    colours: [...product.product_colours]
      .sort((a: { position: number }, b: { position: number }) => a.position - b.position)
      .map(({ name, hex }: { name: string; hex: string }) => ({ name, hex })),
    stock: product.stock,
  };
  const images: AdminImage[] = product.product_images;

  return (
    <div className="max-w-3xl">
      <Link href="/admin/products" className="text-sm text-faint underline underline-offset-4 hover:text-cream">
        ← All products
      </Link>
      <div className="mb-8 mt-4 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-5xl">{product.name}</h1>
        {product.active && (
          <Link href={`/product/${product.slug}`} target="_blank" className="text-sm text-gold-light underline underline-offset-4">
            View in the shop
          </Link>
        )}
      </div>
      {justCreated && (
        <p role="status" className="mb-6 rounded-xl border border-gold/40 bg-gold/10 px-4 py-3 text-sm text-gold-light">
          Product created. You can add photos below.
        </p>
      )}
      <ProductForm key={product.id} initial={initial} others={others ?? []} images={images} />
    </div>
  );
}
