import Link from "next/link";
import { notFound } from "next/navigation";
import { CustomerNotes } from "@/components/admin/CustomerNotes";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { formatDate, formatDay, whatsappLink } from "@/lib/admin";
import { formatPrice } from "@/lib/catalog";
import { paymentLabel } from "@/lib/checkout";
import { isCounted } from "@/lib/reports";
import { supabaseServer } from "@/lib/supabase/server";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const metadata = { title: "Customer" };

type OrderWithItems = {
  id: string;
  number: number;
  status: string;
  payment_status: string;
  payment_method: string;
  total: number;
  delivery_fee: number;
  created_at: string;
  customer_email: string | null;
  ship_name: string;
  ship_line1: string;
  ship_line2: string;
  ship_city: string;
  ship_state: string;
  ship_pincode: string;
  courier_name: string | null;
  awb_code: string | null;
  order_items: {
    product_name: string;
    colour: string;
    size: string;
    qty: number;
    unit_price: number;
    gift_wrap: boolean;
    card_message: string;
    photo_path: string | null;
  }[];
};

export default async function CustomerPage({ params }: PageProps<"/admin/customers/[id]">) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();

  const db = await supabaseServer();
  const [{ data: customer }, { data: orderRows }, { data: addresses }, { data: noteRow }] = await Promise.all([
    db.from("customers").select("id, phone, name, created_at").eq("id", id).maybeSingle(),
    db
      .from("orders")
      .select(
        "id, number, status, payment_status, payment_method, total, delivery_fee, created_at, customer_email, ship_name, ship_line1, ship_line2, ship_city, ship_state, ship_pincode, courier_name, awb_code, order_items(product_name, colour, size, qty, unit_price, gift_wrap, card_message, photo_path)",
      )
      .eq("customer_id", id)
      .order("created_at", { ascending: false }),
    db.from("addresses").select("id, full_name, line1, line2, city, state, pincode").eq("customer_id", id).order("created_at", { ascending: false }),
    db.from("customer_notes").select("notes, tags").eq("customer_id", id).maybeSingle(),
  ]);
  if (!customer) notFound();

  const orders = (orderRows ?? []) as OrderWithItems[];
  const counted = orders.filter((o) => isCounted(o.status));
  const spent = counted.reduce((n, o) => n + o.total, 0);
  const emails = [...new Set(orders.map((o) => (o.customer_email ?? "").toLowerCase()).filter(Boolean))];
  const name = orders[0]?.ship_name || customer.name || "No name";

  // what they buy most, across counted orders
  const favourites = new Map<string, number>();
  for (const o of counted) for (const i of o.order_items) favourites.set(i.product_name, (favourites.get(i.product_name) ?? 0) + i.qty);
  const top = [...favourites.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);

  const stats = [
    { label: "Orders", value: String(counted.length) },
    { label: "Total spent", value: formatPrice(spent) },
    { label: "Average order", value: counted.length ? formatPrice(Math.round(spent / counted.length)) : "-" },
    { label: "Customer since", value: formatDay(customer.created_at) },
  ];

  return (
    <div className="max-w-5xl">
      <Link href="/admin/customers" className="text-sm text-faint underline underline-offset-4 hover:text-cream">
        ← All customers
      </Link>

      <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-5xl">{name}</h1>
          <p className="mt-2 text-mist">
            {customer.phone}
            {emails.length > 0 && ` · ${emails.join(", ")}`}
          </p>
        </div>
        <a
          href={whatsappLink(customer.phone, `Hi ${name.split(" ")[0] || "there"}, this is KALO Gifts. `)}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-outline"
        >
          Message on WhatsApp
        </a>
      </div>

      <dl className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl border border-hair bg-pine p-5">
            <dt className="text-xs uppercase tracking-[0.18em] text-faint">{s.label}</dt>
            <dd className="mt-2 font-serif text-3xl tabular-nums">{s.value}</dd>
          </div>
        ))}
      </dl>
      {orders.length !== counted.length && (
        <p className="mt-2 text-xs text-faint">{orders.length - counted.length} cancelled or returned order(s) are not counted in these totals.</p>
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <section aria-labelledby="orders-title" className="space-y-4">
          <h2 id="orders-title" className="text-3xl">
            Order <em>history</em>
          </h2>
          {orders.length === 0 && <p className="rounded-2xl border border-dashed border-hair-2 p-8 text-center text-mist">No orders yet.</p>}
          {orders.map((o) => (
            <article key={o.id} className="rounded-2xl border border-hair bg-pine p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <Link href={`/admin/orders/${o.id}`} className="font-serif text-2xl underline-offset-4 hover:underline">
                  Order #{o.number}
                </Link>
                <StatusBadge status={o.status} />
              </div>
              <p className="mt-1 text-sm text-faint">
                {formatDate(o.created_at)} · {paymentLabel(o.payment_method)} · Payment: {o.payment_status}
              </p>
              <ul className="mt-4 space-y-2 text-mist">
                {o.order_items.map((i, n) => (
                  <li key={n} className="flex justify-between gap-4">
                    <span>
                      {i.product_name} × {i.qty}
                      <span className="text-faint"> {[i.colour, i.size].filter(Boolean).join(" · ")}</span>
                      {i.gift_wrap && <span className="block text-sm text-faint">Gift wrapped</span>}
                      {i.card_message && <span className="block text-sm text-faint">Card: “{i.card_message}”</span>}
                      {i.photo_path && <span className="block text-sm text-faint">Customer photo uploaded</span>}
                    </span>
                    <span className="shrink-0 tabular-nums">{formatPrice(i.unit_price * i.qty)}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-sm text-faint">
                {[o.ship_name, o.ship_line1, o.ship_line2, o.ship_city, o.ship_state, o.ship_pincode].filter(Boolean).join(", ")}
              </p>
              {o.awb_code && (
                <p className="mt-1 text-sm text-faint">
                  {o.courier_name ? `${o.courier_name} · ` : ""}Tracking {o.awb_code}
                </p>
              )}
              <p className="mt-3 text-right font-serif text-2xl text-gold-light">{formatPrice(o.total)}</p>
            </article>
          ))}
        </section>

        <div className="space-y-6">
          <section aria-labelledby="notes-title" className="rounded-2xl border border-hair bg-pine p-6">
            <h2 id="notes-title" className="text-2xl">
              Notes and <em>tags</em>
            </h2>
            <div className="mt-5">
              <CustomerNotes customerId={customer.id} notes={noteRow?.notes ?? ""} tags={noteRow?.tags ?? []} />
            </div>
          </section>

          {top.length > 0 && (
            <section aria-labelledby="top-title" className="rounded-2xl border border-hair bg-pine p-6">
              <h2 id="top-title" className="text-2xl">
                Orders <em>most</em>
              </h2>
              <ul className="mt-4 space-y-2 text-mist">
                {top.map(([product, qty]) => (
                  <li key={product} className="flex justify-between gap-4">
                    <span>{product}</span>
                    <span className="tabular-nums text-faint">× {qty}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {(addresses?.length ?? 0) > 0 && (
            <section aria-labelledby="addr-title" className="rounded-2xl border border-hair bg-pine p-6">
              <h2 id="addr-title" className="text-2xl">
                Saved <em>addresses</em>
              </h2>
              <ul className="mt-4 space-y-4 text-sm text-mist">
                {addresses!.map((a) => (
                  <li key={a.id}>
                    <span className="block text-cream">{a.full_name}</span>
                    {a.line1}
                    {a.line2 ? `, ${a.line2}` : ""}
                    <br />
                    {a.city}, {a.state} {a.pincode}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
