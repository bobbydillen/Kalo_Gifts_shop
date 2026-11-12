import Link from "next/link";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { formatDate, isOrderStatus, ORDER_STATUSES } from "@/lib/admin";
import { formatPrice } from "@/lib/catalog";
import { supabaseServer } from "@/lib/supabase/server";

export const metadata = { title: "Orders" };

export default async function OrdersPage({ searchParams }: PageProps<"/admin/orders">) {
  const raw = (await searchParams).status;
  const filter = typeof raw === "string" && isOrderStatus(raw) ? raw : null;

  const supabase = await supabaseServer();
  let query = supabase
    .from("orders")
    .select("id, number, status, payment_status, total, ship_name, ship_phone, created_at, order_items(qty)")
    .order("created_at", { ascending: false })
    .limit(200);
  if (filter) query = query.eq("status", filter);

  const [{ data: orders, error }, { data: all }] = await Promise.all([
    query,
    supabase.from("orders").select("status").limit(5000),
  ]);

  const counts: Record<string, number> = {};
  for (const row of all ?? []) counts[row.status] = (counts[row.status] ?? 0) + 1;

  const chip = (active: boolean) =>
    `chip shrink-0 ${active ? "!border-cream !bg-cream !text-night" : ""}`;

  return (
    <div className="max-w-6xl">
      <h1 className="text-5xl">
        Or<em>ders</em>
      </h1>

      <nav aria-label="Filter by status" className="no-scrollbar mt-8 flex gap-3 overflow-x-auto pb-2">
        <Link href="/admin/orders" className={chip(!filter)}>
          All ({all?.length ?? 0})
        </Link>
        {ORDER_STATUSES.map((s) => (
          <Link key={s.id} href={`/admin/orders?status=${s.id}`} className={chip(filter === s.id)}>
            {s.label} ({counts[s.id] ?? 0})
          </Link>
        ))}
      </nav>

      {error ? (
        <p className="mt-8 rounded-2xl border border-berry-light/50 bg-berry/20 p-5">
          The orders could not be loaded. Try refreshing the page.
        </p>
      ) : orders?.length ? (
        <div className="mt-6 overflow-x-auto rounded-2xl border border-hair bg-pine">
          <table className="w-full min-w-[36rem] text-left">
            <thead>
              <tr className="border-b border-hair text-[0.6875rem] uppercase tracking-[0.18em] text-faint">
                <th className="px-5 py-4 font-normal">Order</th>
                <th className="px-3 py-4 font-normal">Placed</th>
                <th className="px-3 py-4 font-normal">Customer</th>
                <th className="px-3 py-4 font-normal">Items</th>
                <th className="px-3 py-4 text-right font-normal">Total</th>
                <th className="px-5 py-4 font-normal">Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => {
                const items = order.order_items.reduce((n: number, i: { qty: number }) => n + i.qty, 0);
                return (
                  <tr key={order.id} className="border-b border-hair last:border-0 hover:bg-pine-2">
                    <td className="px-5 py-4 font-serif text-xl">
                      <Link href={`/admin/orders/${order.id}`} className="after:absolute after:inset-0">
                        #{order.number}
                      </Link>
                    </td>
                    <td className="px-3 py-4 text-sm text-mist">{formatDate(order.created_at)}</td>
                    <td className="px-3 py-4">
                      {order.ship_name}
                      <span className="block text-sm text-faint">{order.ship_phone}</span>
                    </td>
                    <td className="px-3 py-4 tabular-nums">{items}</td>
                    <td className="px-3 py-4 text-right tabular-nums text-gold-light">{formatPrice(order.total)}</td>
                    <td className="px-5 py-4">
                      <StatusBadge status={order.status} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="mt-6 rounded-2xl border border-dashed border-hair-2 p-10 text-center text-mist">
          {filter ? "No orders with this status." : "No orders yet. They will appear here as soon as customers check out."}
        </p>
      )}
    </div>
  );
}
