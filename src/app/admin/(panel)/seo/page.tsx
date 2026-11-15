import { SeoRow } from "@/components/admin/SeoRow";
import { getProducts } from "@/lib/catalog-data";
import { CATEGORY_PAGES, STATIC_PAGES, productKey } from "@/lib/seo";
import { supabaseServer } from "@/lib/supabase/server";

export const metadata = { title: "Search (SEO)" };

export default async function SeoPage() {
  const supabase = await supabaseServer();
  const [{ data }, products] = await Promise.all([supabase.from("seo_pages").select("key, title, description"), getProducts()]);
  const saved = new Map((data ?? []).map((r) => [r.key as string, { title: r.title as string, description: r.description as string }]));

  return (
    <div className="max-w-3xl space-y-10">
      <div>
        <h1 className="text-5xl">
          Search <em>(SEO)</em>
        </h1>
        <p className="mt-4 text-mist">
          The title and description Google shows for each page. Leave a box empty to keep the default. Keep titles to about 60
          characters and descriptions to about 160, and use the words people type when they look for your gifts, for example
          &ldquo;Christian T-shirts&rdquo;. Google can take days or weeks to show a change.
        </p>
      </div>

      <section className="space-y-4">
        <h2 className="text-2xl">Pages</h2>
        {STATIC_PAGES.map((p) => (
          <SeoRow
            key={p.key}
            seoKey={p.key}
            label={p.label}
            path={p.path}
            suffix={p.key === "home" ? "" : " · KALO Gifts"}
            defaults={p.defaults}
            saved={saved.get(p.key) ?? null}
          />
        ))}
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl">Collections</h2>
        {CATEGORY_PAGES.map((p) => (
          <SeoRow key={p.key} seoKey={p.key} label={p.label} path={p.path} suffix=" · KALO Gifts" defaults={p.defaults} saved={saved.get(p.key) ?? null} />
        ))}
      </section>

      <section>
        <details className="group">
          <summary className="cursor-pointer text-2xl">Products ({products.filter((p) => !p.buildYourOwn).length})</summary>
          <div className="mt-4 space-y-4">
            {products
              .filter((p) => !p.buildYourOwn)
              .map((p) => (
                <SeoRow
                  key={p.slug}
                  seoKey={productKey(p.slug)}
                  label={p.name}
                  path={`/product/${p.slug}`}
                  suffix=" · KALO Gifts"
                  defaults={{ title: p.name, description: p.description }}
                  saved={saved.get(productKey(p.slug)) ?? null}
                />
              ))}
          </div>
        </details>
      </section>
    </div>
  );
}
