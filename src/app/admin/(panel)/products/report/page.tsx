import Link from "next/link";
import { formatDay } from "@/lib/admin";
import { categoryLabels, formatPrice, type Category } from "@/lib/catalog";
import { LOW_STOCK, loadProductReport, type ProductReport } from "@/lib/reports";
import { supabaseServer } from "@/lib/supabase/server";

export const metadata = { title: "Stock and sales" };

const statusTone: Record<string, string> = {
  "Sold out": "border-berry-light/50 bg-berry/20 text-cream",
  Low: "border-gold bg-gold/15 text-gold-light",
  OK: "border-hair-2 text-mist",
  "Not tracked": "border-hair-2 text-faint",
};

export default async function ProductReportPage() {
  let report: ProductReport | null = null;
  try {
    report = await loadProductReport(await supabaseServer());
  } catch {
    report = null;
  }

  const attention = report?.products.filter((p) => p.active && (p.soldOut || p.lowStock)) ?? [];
  const month = report?.months[0];
  const stats = report
    ? [
        { label: "Units sold, all time", value: String(report.totals.units) },
        { label: "Item sales, all time", value: formatPrice(report.totals.itemSales) },
        { label: "Orders counted", value: String(report.totals.orders) },
        { label: "Needs attention", value: String(attention.length) },
      ]
    : [];

  return (
    <div className="max-w-6xl">
      <Link href="/admin/products" className="text-sm text-faint underline underline-offset-4 hover:text-cream">
        ← All products
      </Link>
      <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-5xl">
          Stock and <em>sales</em>
        </h1>
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- a file download, not a page */}
        <a href="/admin/export/products" className="btn btn-gold">
          Download Excel
        </a>
      </div>
      <p className="mt-3 text-sm text-faint">
        Sales leave out cancelled and returned orders, and do not include delivery. A product with no stock numbers is{" "}
        <em>not tracked</em>: the shop treats it as always available. “Low” means {LOW_STOCK} or fewer left in a colour or size.
      </p>

      {!report ? (
        <p className="mt-8 rounded-2xl border border-berry-light/50 bg-berry/20 p-5">The report could not be loaded. Try refreshing the page.</p>
      ) : (
        <>
          <dl className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label} className="rounded-2xl border border-hair bg-pine p-5">
                <dt className="text-xs uppercase tracking-[0.18em] text-faint">{s.label}</dt>
                <dd className="mt-2 font-serif text-3xl tabular-nums">{s.value}</dd>
              </div>
            ))}
          </dl>

          {attention.length > 0 && (
            <section aria-labelledby="attention-title" className="mt-8 rounded-2xl border border-gold/40 bg-pine p-6">
              <h2 id="attention-title" className="text-2xl">
                Needs <em>attention</em>
              </h2>
              <ul className="mt-4 flex flex-wrap gap-2">
                {attention.map((p) => (
                  <li key={p.slug}>
                    <Link
                      href={`/admin/products?q=${encodeURIComponent(p.name)}`}
                      className="rounded-full border border-hair-2 px-3 py-1.5 text-sm text-mist hover:border-gold hover:text-cream"
                    >
                      {p.name} · {p.soldOut ? "some sold out" : "low"}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <h2 className="mt-12 text-3xl">
            Every <em>product</em>
          </h2>
          <div className="mt-4 overflow-x-auto rounded-2xl border border-hair bg-pine">
            <table className="w-full min-w-[56rem] text-left">
              <thead>
                <tr className="border-b border-hair text-[0.6875rem] uppercase tracking-[0.18em] text-faint">
                  <th className="px-5 py-4 font-normal">Product</th>
                  <th className="px-3 py-4 text-right font-normal">Price</th>
                  <th className="px-3 py-4 text-right font-normal">In stock</th>
                  <th className="px-3 py-4 text-right font-normal">Sold 7d</th>
                  <th className="px-3 py-4 text-right font-normal">Sold 30d</th>
                  <th className="px-3 py-4 text-right font-normal">Sold all</th>
                  <th className="px-3 py-4 text-right font-normal">Item sales</th>
                  <th className="px-3 py-4 font-normal">Last sold</th>
                  <th className="px-5 py-4 text-right font-normal">Days left</th>
                </tr>
              </thead>
              <tbody>
                {[...report.products]
                  .sort((a, b) => b.soldAll - a.soldAll || a.name.localeCompare(b.name))
                  .map((p) => (
                    <tr key={p.slug} className="border-b border-hair last:border-0 hover:bg-pine-2">
                      <td className="px-5 py-4">
                        <span className="font-serif text-xl">{p.name}</span>
                        <span className="block text-xs text-faint">
                          {categoryLabels[p.category as Category] ?? p.category}
                          {!p.active && " · switched off"}
                        </span>
                      </td>
                      <td className="px-3 py-4 text-right tabular-nums text-mist">{formatPrice(p.price)}</td>
                      <td className="px-3 py-4 text-right tabular-nums">
                        {p.followsContents ? (
                          <span className="text-xs text-faint">Follows contents</span>
                        ) : p.tracked ? (
                          <span className={p.soldOut ? "text-berry-light" : p.lowStock ? "text-gold-light" : ""}>{p.stock}</span>
                        ) : (
                          <span className="text-xs text-faint">Not tracked</span>
                        )}
                      </td>
                      <td className="px-3 py-4 text-right tabular-nums text-mist">{p.sold7}</td>
                      <td className="px-3 py-4 text-right tabular-nums text-mist">{p.sold30}</td>
                      <td className="px-3 py-4 text-right tabular-nums">{p.soldAll}</td>
                      <td className="px-3 py-4 text-right tabular-nums text-gold-light">{formatPrice(p.revenueAll)}</td>
                      <td className="px-3 py-4 text-sm text-mist">{p.lastSoldAt ? formatDay(p.lastSoldAt) : "-"}</td>
                      <td className="px-5 py-4 text-right tabular-nums text-mist">{p.daysLeft ?? "-"}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          <h2 className="mt-12 text-3xl">
            Stock by colour and <em>size</em>
          </h2>
          {report.variants.length ? (
            <div className="mt-4 overflow-x-auto rounded-2xl border border-hair bg-pine">
              <table className="w-full min-w-[36rem] text-left">
                <thead>
                  <tr className="border-b border-hair text-[0.6875rem] uppercase tracking-[0.18em] text-faint">
                    <th className="px-5 py-4 font-normal">Product</th>
                    <th className="px-3 py-4 font-normal">Colour</th>
                    <th className="px-3 py-4 font-normal">Size</th>
                    <th className="px-3 py-4 text-right font-normal">In stock</th>
                    <th className="px-3 py-4 text-right font-normal">Sold 30d</th>
                    <th className="px-3 py-4 text-right font-normal">Sold all</th>
                    <th className="px-5 py-4 font-normal">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {report.variants.map((v, n) => (
                    <tr key={`${v.slug}-${v.colour}-${v.size}-${n}`} className="border-b border-hair last:border-0">
                      <td className="px-5 py-3">{v.product}</td>
                      <td className="px-3 py-3 text-mist">{v.colour || "-"}</td>
                      <td className="px-3 py-3 text-mist">{v.size || "-"}</td>
                      <td className="px-3 py-3 text-right tabular-nums">{v.inStock ?? "-"}</td>
                      <td className="px-3 py-3 text-right tabular-nums text-mist">{v.sold30}</td>
                      <td className="px-3 py-3 text-right tabular-nums text-mist">{v.soldAll}</td>
                      <td className="px-5 py-3">
                        <span className={`inline-block whitespace-nowrap rounded-full border px-3 py-1 text-[0.6875rem] uppercase tracking-[0.14em] ${statusTone[v.status]}`}>
                          {v.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="mt-4 rounded-2xl border border-dashed border-hair-2 p-8 text-center text-mist">
              No stock numbers entered yet. Add them on each product&apos;s page to see them here.
            </p>
          )}

          <h2 className="mt-12 text-3xl">
            Sales by <em>month</em>
          </h2>
          {report.months.length ? (
            <div className="mt-4 overflow-x-auto rounded-2xl border border-hair bg-pine">
              <table className="w-full min-w-[30rem] text-left">
                <thead>
                  <tr className="border-b border-hair text-[0.6875rem] uppercase tracking-[0.18em] text-faint">
                    <th className="px-5 py-4 font-normal">Month</th>
                    <th className="px-3 py-4 text-right font-normal">Orders</th>
                    <th className="px-3 py-4 text-right font-normal">Units</th>
                    <th className="px-3 py-4 text-right font-normal">Item sales</th>
                    <th className="px-3 py-4 text-right font-normal">Delivery</th>
                    <th className="px-5 py-4 text-right font-normal">Order total</th>
                  </tr>
                </thead>
                <tbody>
                  {report.months.map((m) => (
                    <tr key={m.month} className="border-b border-hair last:border-0">
                      <td className="px-5 py-3">{m.month}</td>
                      <td className="px-3 py-3 text-right tabular-nums">{m.orders}</td>
                      <td className="px-3 py-3 text-right tabular-nums">{m.units}</td>
                      <td className="px-3 py-3 text-right tabular-nums">{formatPrice(m.itemSales)}</td>
                      <td className="px-3 py-3 text-right tabular-nums text-mist">{formatPrice(m.delivery)}</td>
                      <td className="px-5 py-3 text-right tabular-nums text-gold-light">{formatPrice(m.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="mt-4 rounded-2xl border border-dashed border-hair-2 p-8 text-center text-mist">No sales yet.</p>
          )}
          {month && <p className="mt-3 text-xs text-faint">Latest month shown: {month.month}.</p>}
        </>
      )}
    </div>
  );
}
