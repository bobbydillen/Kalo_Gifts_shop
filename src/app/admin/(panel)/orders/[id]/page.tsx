import Link from "next/link";
import { notFound } from "next/navigation";
import { OrderControls } from "@/components/admin/OrderControls";
import { PrintButton } from "@/components/admin/PrintButton";
import { StatusBadge } from "@/components/admin/StatusBadge";
import {
  formatDate,
  statusLabel,
  statusMessage,
  whatsappLink,
  type OrderEventRow,
  type OrderItemRow,
  type OrderRow,
} from "@/lib/admin";
import { formatPrice } from "@/lib/catalog";
import { GIFT_NOTE_PRICE, GIFT_WRAP_PRICE } from "@/lib/gifting";
import { supabaseServer } from "@/lib/supabase/server";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function generateMetadata({ params }: PageProps<"/admin/orders/[id]">) {
  void params;
  return { title: "Order" };
}

export default async function OrderPage({ params }: PageProps<"/admin/orders/[id]">) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();

  const supabase = await supabaseServer();
  const { data } = await supabase
    .from("orders")
    .select("*, order_items(*), order_events(*)")
    .eq("id", id)
    .maybeSingle();
  if (!data) notFound();

  const order = data as OrderRow & { order_items: OrderItemRow[]; order_events: OrderEventRow[] };
  const items = order.order_items;
  const events = [...order.order_events].sort((a, b) => a.created_at.localeCompare(b.created_at));
  const cards = items.filter((i) => i.card_message.trim());
  const address = [order.ship_line1, order.ship_line2, `${order.ship_city}, ${order.ship_state} ${order.ship_pincode}`]
    .filter(Boolean)
    .join("\n");

  return (
    <div className="max-w-5xl">
      <Link href="/admin/orders" className="text-sm text-faint underline underline-offset-4 hover:text-cream">
        ← All orders
      </Link>

      <div className="mt-4 flex flex-wrap items-center gap-4">
        <h1 className="text-5xl">Order #{order.number}</h1>
        <StatusBadge status={order.status} />
      </div>
      <p className="mt-2 text-sm text-faint">
        Placed {formatDate(order.created_at)} · Payment: {order.payment_status}
      </p>

      <div className="mt-10 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6">
          <section aria-labelledby="items-title" className="rounded-2xl border border-hair bg-pine p-6">
            <h2 id="items-title" className="text-2xl">
              What to <em>pack</em>
            </h2>
            <ul className="mt-5 divide-y divide-hair">
              {items.map((item) => (
                <li key={item.id} className="py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-serif text-xl leading-tight">
                        {item.product_name} <span className="font-sans text-base text-mist">× {item.qty}</span>
                      </p>
                      <p className="mt-1 text-sm text-faint">
                        {[item.colour, item.size].filter(Boolean).join(" · ") || "No colour or size"}
                      </p>
                      <p className="mt-2 flex flex-wrap gap-2 text-xs">
                        {item.gift_wrap && (
                          <span className="rounded-full border border-gold/50 px-3 py-1 text-gold-light">
                            Gift wrap (+{formatPrice(GIFT_WRAP_PRICE)} each)
                          </span>
                        )}
                        {item.card_message.trim() && (
                          <span className="rounded-full border border-gold/50 px-3 py-1 text-gold-light">
                            Handwritten card (+{formatPrice(GIFT_NOTE_PRICE)} each)
                          </span>
                        )}
                      </p>
                    </div>
                    <p className="tabular-nums text-gold-light">{formatPrice(item.unit_price * item.qty)}</p>
                  </div>
                </li>
              ))}
            </ul>
            <dl className="mt-5 space-y-2 border-t border-hair pt-5 text-sm">
              <div className="flex justify-between text-mist">
                <dt>Subtotal</dt>
                <dd className="tabular-nums">{formatPrice(order.subtotal)}</dd>
              </div>
              <div className="flex justify-between text-mist">
                <dt>Delivery</dt>
                <dd className="tabular-nums">{formatPrice(order.delivery_fee)}</dd>
              </div>
              <div className="flex justify-between font-serif text-2xl">
                <dt>Total</dt>
                <dd className="tabular-nums">{formatPrice(order.total)}</dd>
              </div>
            </dl>
          </section>

          <section aria-labelledby="cards-title" className="rounded-2xl border border-hair bg-pine p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <h2 id="cards-title" className="text-2xl">
                Cards to <em>write</em>
              </h2>
              {cards.length > 0 && <PrintButton label="Print cards" />}
            </div>
            {cards.length === 0 ? (
              <p className="mt-4 text-mist">No handwritten cards on this order.</p>
            ) : (
              <div data-print-area className="mt-5 space-y-4">
                {cards.flatMap((item) =>
                  Array.from({ length: item.qty }, (_, copy) => (
                    <figure
                      key={`${item.id}-${copy}`}
                      className="break-inside-avoid rounded-xl border border-hair-2 p-5"
                    >
                      <figcaption className="text-xs uppercase tracking-[0.18em] text-faint">
                        Order #{order.number} · {item.product_name}
                        {item.qty > 1 ? ` · card ${copy + 1} of ${item.qty}` : ""}
                      </figcaption>
                      <blockquote className="mt-3 whitespace-pre-wrap font-serif text-2xl italic leading-snug">
                        {item.card_message}
                      </blockquote>
                    </figure>
                  )),
                )}
              </div>
            )}
          </section>

          <section aria-labelledby="history-title" className="rounded-2xl border border-hair bg-pine p-6">
            <h2 id="history-title" className="text-2xl">
              Order <em>history</em>
            </h2>
            {events.length ? (
              <ol className="mt-5 space-y-4">
                {events.map((event) => (
                  <li key={event.id} className="flex gap-4">
                    <span aria-hidden="true" className="mt-2 size-2 shrink-0 rounded-full bg-gold" />
                    <div>
                      <p>
                        {statusLabel(event.status)}
                        <span className="ml-3 text-sm text-faint">{formatDate(event.created_at)}</span>
                      </p>
                      {event.note && <p className="text-sm text-mist">{event.note}</p>}
                    </div>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="mt-4 text-mist">No changes yet.</p>
            )}
          </section>
        </div>

        <div className="space-y-6">
          <section aria-labelledby="ship-title" className="rounded-2xl border border-hair bg-pine p-6">
            <h2 id="ship-title" className="text-2xl">
              Deliver <em>to</em>
            </h2>
            <p className="mt-4 text-lg">{order.ship_name}</p>
            <p className="mt-1 whitespace-pre-line text-mist">{address}</p>
            <p className="mt-3 text-mist">{order.ship_phone}</p>
            {order.customer_note && (
              <p className="mt-4 rounded-xl border border-hair-2 p-4 text-sm text-mist">
                <span className="block text-xs uppercase tracking-[0.18em] text-faint">Note from the customer</span>
                {order.customer_note}
              </p>
            )}
            <a
              href={whatsappLink(order.ship_phone, statusMessage(order, order.status))}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-outline mt-5 w-full"
            >
              Message on WhatsApp
            </a>
            <p className="mt-2 text-xs text-faint">Opens WhatsApp with a message ready for you to check and send.</p>
          </section>

          <section aria-labelledby="update-title" className="rounded-2xl border border-hair bg-pine p-6">
            <h2 id="update-title" className="text-2xl">
              Update <em>order</em>
            </h2>
            <div className="mt-5">
              <OrderControls id={order.id} status={order.status} trackingNote={order.tracking_note} />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
