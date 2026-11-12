import Link from "next/link";
import { photoUrl } from "@/lib/admin-products";
import { categoryLabels, formatPrice, type Category } from "@/lib/catalog";
import { supabaseServer } from "@/lib/supabase/server";

export const metadata = { title: "Products" };

const LOW_STOCK = 3;

export default async function ProductsPage() {
  const supabase = await supabaseServer();
  const { data: products, error } = await supabase
    .from("products")
    .select("id, slug, name, category, price, active, christmas, tag, stock(qty), product_images(path, position)")
    .order("sort")
    .order("name");

  return (
    <div className="max-w-6xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-5xl">
          Prod<em>ucts</em>
        </h1>
        <Link href="/admin/products/new" className="btn btn-gold">
          + New product
        </Link>
      </div>

      {error ? (
        <p className="mt-8 rounded-2xl border border-berry-light/50 bg-berry/20 p-5">
          The products could not be loaded. Try refreshing the page.
        </p>
      ) : products?.length ? (
        <ul className="mt-8 divide-y divide-hair rounded-2xl border border-hair bg-pine">
          {products.map((p) => {
            const photos = [...p.product_images].sort((a, b) => a.position - b.position);
            const soldOut = p.stock.filter((s) => s.qty === 0).length;
            const low = p.stock.filter((s) => s.qty > 0 && s.qty <= LOW_STOCK).length;
            return (
              <li key={p.id} className="relative flex flex-wrap items-center gap-x-5 gap-y-2 px-5 py-4 transition-colors hover:bg-pine-2">
                {photos[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element -- small admin thumbnail
                  <img src={photoUrl(photos[0].path)} alt="" className="size-14 shrink-0 rounded-xl object-cover" />
                ) : (
                  <span aria-hidden="true" className="grid size-14 shrink-0 place-items-center rounded-xl bg-pine-3/50 text-xs text-faint">
                    No photo
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <Link href={`/admin/products/${p.id}`} className="font-serif text-xl leading-tight after:absolute after:inset-0">
                    {p.name}
                  </Link>
                  <p className="text-sm text-faint">
                    {categoryLabels[p.category as Category]} · /product/{p.slug}
                  </p>
                </div>
                <span className="tabular-nums text-gold-light">{formatPrice(p.price)}</span>
                <span className="flex flex-wrap gap-2 text-xs">
                  {!p.active && <span className="rounded-full border border-hair-2 px-3 py-1 text-faint">Hidden</span>}
                  {p.christmas && <span className="rounded-full border border-gold/50 px-3 py-1 text-gold-light">Christmas</span>}
                  {soldOut > 0 && (
                    <span className="rounded-full border border-berry-light/50 px-3 py-1">
                      {soldOut} sold out
                    </span>
                  )}
                  {low > 0 && <span className="rounded-full border border-gold-deep px-3 py-1 text-gold-light">{low} low</span>}
                  {p.category === "hamper" && <span className="rounded-full border border-hair-2 px-3 py-1 text-faint">Stock follows contents</span>}
                </span>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="mt-8 rounded-2xl border border-dashed border-hair-2 p-10 text-center text-mist">
          No products yet. Add your first one.
        </p>
      )}
    </div>
  );
}
