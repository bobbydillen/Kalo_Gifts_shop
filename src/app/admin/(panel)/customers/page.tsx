import Link from "next/link";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { formatDay } from "@/lib/admin";
import { formatPrice } from "@/lib/catalog";
import {
  CUSTOMER_FILTERS,
  loadCustomerReport,
  selectCustomers,
  type CustomerFilter,
  type CustomerSort,
  type CustomerReport,
} from "@/lib/reports";
import { supabaseServer } from "@/lib/supabase/server";

export const metadata = { title: "Customers" };

const SORTS: { id: CustomerSort; label: string }[] = [
  { id: "last", label: "Latest order" },
  { id: "spent", label: "Most spent" },
  { id: "orders", label: "Most orders" },
  { id: "name", label: "Name" },
];

const SHOWN = 300;

export default async function CustomersPage({ searchParams }: PageProps<"/admin/customers">) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.slice(0, 80) : "";
  const filter: CustomerFilter = CUSTOMER_FILTERS.some((f) => f.id === sp.filter) ? (sp.filter as CustomerFilter) : "all";
  const sort: CustomerSort = SORTS.some((s) => s.id === sp.sort) ? (sp.sort as CustomerSort) : "last";

  let report: CustomerReport | null = null;
  try {
    report = await loadCustomerReport(await supabaseServer());
  } catch {
    report = null;
  }

  const link = (next: Partial<{ q: string; filter: string; sort: string }>) => {
    const params = new URLSearchParams();
    const merged = { q, filter, sort, ...next };
    if (merged.q) params.set("q", merged.q);
    if (merged.filter !== "all") params.set("filter", merged.filter);
    if (merged.sort !== "last") params.set("sort", merged.sort);
    const query = params.toString();
    return `/admin/customers${query ? `?${query}` : ""}`;
  };
  const chip = (active: boolean) => `chip shrink-0 ${active ? "!border-cream !bg-cream !text-night" : ""}`;

  const all = report?.customers ?? [];
  const { shown, totals } = selectCustomers(all, { q, filter, sort });

  const stats = [
    { label: "Customers", value: String(totals.customers) },
    { label: "Repeat customers", value: String(totals.repeat) },
    { label: "New, last 30 days", value: String(totals.newLast30) },
    { label: "Total sales", value: formatPrice(totals.sales) },
  ];

  return (
    <div className="max-w-6xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-5xl">
          Custom<em>ers</em>
        </h1>
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- a file download, not a page */}
        <a href="/admin/export/customers" className="btn btn-gold">
          Download Excel
        </a>
      </div>
      <p className="mt-3 text-sm text-faint">
        Totals leave out cancelled and returned orders. The Excel file has three sheets: Customers, Orders and Items.
      </p>

      {!report ? (
        <p className="mt-8 rounded-2xl border border-berry-light/50 bg-berry/20 p-5">
          The customers could not be loaded. Try refreshing the page.
        </p>
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

          <form action="/admin/customers" method="get" className="mt-8 flex flex-wrap gap-3">
            <input type="hidden" name="filter" value={filter} />
            <input type="hidden" name="sort" value={sort} />
            <label className="sr-only" htmlFor="customer-search">
              Search customers
            </label>
            <input
              id="customer-search"
              name="q"
              defaultValue={q}
              placeholder="Search by name, phone, email, city or tag"
              className="min-w-0 flex-1 rounded-xl border border-hair-2 bg-pine px-4 py-3 text-cream placeholder:text-faint focus:border-gold focus:outline-none"
            />
            <button type="submit" className="btn btn-outline">
              Search
            </button>
            {q && (
              <Link href={link({ q: "" })} className="btn btn-outline">
                Clear
              </Link>
            )}
          </form>

          <nav aria-label="Filter customers" className="no-scrollbar mt-4 flex gap-3 overflow-x-auto pb-2">
            {CUSTOMER_FILTERS.map((f) => (
              <Link key={f.id} href={link({ filter: f.id })} className={chip(filter === f.id)}>
                {f.label}
              </Link>
            ))}
          </nav>
          <nav aria-label="Sort customers" className="no-scrollbar flex items-center gap-3 overflow-x-auto pb-2 text-sm">
            <span className="text-faint">Sort by</span>
            {SORTS.map((s) => (
              <Link key={s.id} href={link({ sort: s.id })} className={chip(sort === s.id)}>
                {s.label}
              </Link>
            ))}
          </nav>

          {shown.length ? (
            <div className="mt-4 overflow-x-auto rounded-2xl border border-hair bg-pine">
              <table className="w-full min-w-[46rem] text-left">
                <thead>
                  <tr className="border-b border-hair text-[0.6875rem] uppercase tracking-[0.18em] text-faint">
                    <th className="px-5 py-4 font-normal">Customer</th>
                    <th className="px-3 py-4 font-normal">City</th>
                    <th className="px-3 py-4 text-right font-normal">Orders</th>
                    <th className="px-3 py-4 text-right font-normal">Spent</th>
                    <th className="px-3 py-4 font-normal">Latest order</th>
                    <th className="px-5 py-4 font-normal">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {shown.slice(0, SHOWN).map((c) => (
                    <tr key={c.id} className="relative border-b border-hair last:border-0 hover:bg-pine-2">
                      <td className="px-5 py-4">
                        <Link href={`/admin/customers/${c.id}`} className="font-serif text-xl after:absolute after:inset-0">
                          {c.name || "No name"}
                        </Link>
                        <span className="block text-sm text-faint">
                          {c.phone}
                          {c.emails[0] ? ` · ${c.emails[0]}` : ""}
                        </span>
                        {c.tags.length > 0 && (
                          <span className="mt-1 flex flex-wrap gap-1.5">
                            {c.tags.map((t) => (
                              <span key={t} className="rounded-full border border-gold/40 px-2 py-0.5 text-[0.6875rem] text-gold-light">
                                {t}
                              </span>
                            ))}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-4 text-sm text-mist">{[c.city, c.state].filter(Boolean).join(", ") || "-"}</td>
                      <td className="px-3 py-4 text-right tabular-nums">
                        {c.orders}
                        {c.allOrders !== c.orders && <span className="block text-xs text-faint">{c.allOrders - c.orders} out</span>}
                      </td>
                      <td className="px-3 py-4 text-right tabular-nums text-gold-light">{formatPrice(c.spent)}</td>
                      <td className="px-3 py-4 text-sm text-mist">{c.lastOrderAt ? formatDay(c.lastOrderAt) : "-"}</td>
                      <td className="px-5 py-4">{c.lastStatus ? <StatusBadge status={c.lastStatus} /> : <span className="text-sm text-faint">No orders</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="mt-4 rounded-2xl border border-dashed border-hair-2 p-10 text-center text-mist">
              {all.length ? "No customers match this search." : "No customers yet. They appear here after their first order."}
            </p>
          )}
          {shown.length > SHOWN && (
            <p className="mt-3 text-sm text-faint">
              Showing the first {SHOWN} of {shown.length}. Use the search, or download the Excel file for everyone.
            </p>
          )}
        </>
      )}
    </div>
  );
}
