import Link from "next/link";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { formatDate, ORDER_STATUSES } from "@/lib/admin";
import { formatPrice } from "@/lib/catalog";
import { supabaseServer } from "@/lib/supabase/server";

export const metadata = { title: "Overview" };

export default async function OverviewPage() {
  const supabase = await supabaseServer();

  const [{ data: all }, { data: recent }] = await Promise.all([
    supabase.from("orders").select("status").limit(5000),
    supabase
      .from("orders")
      .select("id, number, status, total, ship_name, created_at")
      .order("created_at", { ascending: false })
      .limit(6),
  ]);

  const counts = Object.fromEntries(ORDER_STATUSES.map((s) => [s.id, 0])) as Record<string, number>;
  for (const row of all ?? []) counts[row.status] = (counts[row.status] ?? 0) + 1;

  const attention = [
    { id: "new", label: "New orders", hint: "Waiting for you to confirm" },
    { id: "confirmed", label: "Confirmed", hint: "Ready to pack" },
    { id: "packing", label: "Packing", hint: "Being packed now" },
    { id: "shipped", label: "On the way", hint: "Shipped, not delivered yet" },
  ];

  return (
    <div className="max-w-5xl">
      <h1 className="text-5xl">
        Over<em>view</em>
      </h1>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {attention.map((card) => (
          <Link
            key={card.id}
            href={`/admin/orders?status=${card.id}`}
            className="rounded-2xl border border-hair bg-pine p-5 transition-[border-color,transform] duration-500 ease-bounce hover:-translate-y-1 hover:border-gold/50"
          >
            <p className="text-xs uppercase tracking-[0.18em] text-faint">{card.label}</p>
            <p className="mt-3 font-serif text-5xl tabular-nums">{counts[card.id]}</p>
            <p className="mt-2 text-sm text-mist">{card.hint}</p>
          </Link>
        ))}
      </div>

      <section className="mt-12" aria-labelledby="recent-title">
        <div className="flex items-baseline justify-between">
          <h2 id="recent-title" className="text-3xl">
            Latest <em>orders</em>
          </h2>
          <Link href="/admin/orders" className="text-sm text-gold-light underline underline-offset-4">
            See all
          </Link>
        </div>

        {recent?.length ? (
          <ul className="mt-5 divide-y divide-hair rounded-2xl border border-hair bg-pine">
            {recent.map((order) => (
              <li key={order.id}>
                <Link
                  href={`/admin/orders/${order.id}`}
                  className="flex flex-wrap items-center gap-x-6 gap-y-2 px-5 py-4 transition-colors hover:bg-pine-2"
                >
                  <span className="w-20 font-serif text-xl">#{order.number}</span>
                  <span className="min-w-0 flex-1 truncate">{order.ship_name}</span>
                  <span className="text-sm text-faint">{formatDate(order.created_at)}</span>
                  <span className="tabular-nums text-gold-light">{formatPrice(order.total)}</span>
                  <StatusBadge status={order.status} />
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-5 rounded-2xl border border-dashed border-hair-2 p-8 text-center text-mist">
            No orders yet. They will appear here as soon as customers check out.
          </p>
        )}
      </section>
    </div>
  );
}
