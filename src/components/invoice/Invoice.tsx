import type { OrderItemRow } from "@/lib/admin";
import { formatPrice } from "@/lib/catalog";
import { paymentLabel } from "@/lib/checkout";
import type { SiteSettings } from "@/lib/settings";

export type InvoiceOrder = {
  number: number;
  created_at: string;
  status: string;
  payment_status: string;
  payment_method: string;
  subtotal: number;
  delivery_fee: number;
  total: number;
  ship_name: string;
  ship_phone: string;
  ship_line1: string;
  ship_line2: string;
  ship_city: string;
  ship_state: string;
  ship_pincode: string;
  customer_email: string | null;
  order_items: OrderItemRow[];
};

const dateFormat = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Kolkata" });

export const invoiceNumber = (n: number) => `KALO-${n}`;

/** What the customer still owes, or how it was paid, in a short line for the bottom of the bill. */
function paymentLine(order: InvoiceOrder) {
  if (order.payment_status === "paid") return "Paid in full. Thank you!";
  if (order.payment_status === "refunded") return "Refunded.";
  if (order.payment_method === "cod") return `Cash on delivery. Please pay ${formatPrice(order.total)} to the courier when your order arrives.`;
  if (order.payment_method === "test") return "Test order. No payment was taken.";
  if (order.payment_method === "upi") return `UPI payment of ${formatPrice(order.total)} being checked.`;
  return "Payment pending.";
}

/**
 * A printable bill for one order, on white paper. The shop is not registered for GST, so no tax is
 * broken out; if a GSTIN is added in the admin settings it is shown and prices are marked as inclusive.
 * The print styles in globals.css print only this block.
 */
export function Invoice({ order, settings }: { order: InvoiceOrder; settings: SiteSettings }) {
  const seller = settings.businessName || "KALO Gifts";
  const address = [order.ship_line1, order.ship_line2, `${order.ship_city}, ${order.ship_state} ${order.ship_pincode}`].filter(Boolean).join(", ");
  const isTest = order.payment_method === "test";

  return (
    <article data-print-area className="mx-auto max-w-3xl rounded-xl bg-white p-8 text-[15px] leading-relaxed text-neutral-900 shadow-xl sm:p-12">
      {isTest && (
        <p className="mb-6 rounded border border-neutral-400 px-4 py-2 text-center text-sm font-semibold uppercase tracking-widest text-neutral-600">
          Test order · not a valid invoice
        </p>
      )}

      <header className="flex flex-wrap items-start justify-between gap-6 border-b border-neutral-300 pb-6">
        <div>
          <p className="font-serif text-3xl font-semibold tracking-wide">{seller}</p>
          {settings.businessAddress && <p className="mt-1 max-w-xs whitespace-pre-line text-neutral-600">{settings.businessAddress}</p>}
          {settings.contactEmail && <p className="text-neutral-600">{settings.contactEmail}</p>}
          <p className="mt-1 text-neutral-600">{settings.gstin ? `GSTIN: ${settings.gstin}` : "Not registered under GST. No tax charged."}</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-neutral-500">Invoice</p>
          <p className="mt-1 text-2xl font-semibold">{invoiceNumber(order.number)}</p>
          <p className="text-neutral-600">{dateFormat.format(new Date(order.created_at))}</p>
        </div>
      </header>

      <section className="mt-6 grid gap-6 sm:grid-cols-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">Billed and delivered to</p>
          <p className="mt-1 font-semibold">{order.ship_name}</p>
          <p className="text-neutral-700">{address}</p>
          <p className="text-neutral-700">{order.ship_phone}</p>
          {order.customer_email && <p className="text-neutral-700">{order.customer_email}</p>}
        </div>
        <div className="sm:text-right">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">Payment</p>
          <p className="mt-1 font-semibold">{paymentLabel(order.payment_method)}</p>
        </div>
      </section>

      <table className="mt-8 w-full border-collapse text-left">
        <thead>
          <tr className="border-b border-neutral-400 text-xs uppercase tracking-[0.15em] text-neutral-500">
            <th className="py-2 pr-3 font-semibold">Item</th>
            <th className="px-3 py-2 text-right font-semibold">Qty</th>
            <th className="px-3 py-2 text-right font-semibold">Price</th>
            <th className="py-2 pl-3 text-right font-semibold">Amount</th>
          </tr>
        </thead>
        <tbody>
          {order.order_items.map((item) => {
            const options = [item.colour, item.size].filter(Boolean).join(" · ");
            const extras = [item.gift_wrap ? "gift wrap" : "", item.card_message.trim() ? "handwritten card" : "", item.photo_path ? "your photo, printed" : ""]
              .filter(Boolean)
              .join(", ");
            return (
              <tr key={item.id} className="border-b border-neutral-200 align-top">
                <td className="py-3 pr-3">
                  <span className="font-semibold">{item.product_name}</span>
                  {options && <span className="block text-sm text-neutral-600">{options}</span>}
                  {extras && <span className="block text-sm text-neutral-600">Includes {extras}</span>}
                  {item.parts && item.parts.length > 0 && (
                    <span className="mt-1 block text-sm text-neutral-600">
                      Inside:{" "}
                      {item.parts.map((p) => `${p.name} × ${p.qty}${[p.colour, p.size].filter(Boolean).length ? ` (${[p.colour, p.size].filter(Boolean).join(", ")})` : ""}`).join("; ")}
                    </span>
                  )}
                </td>
                <td className="px-3 py-3 text-right tabular-nums">{item.qty}</td>
                <td className="px-3 py-3 text-right tabular-nums">{formatPrice(item.unit_price)}</td>
                <td className="py-3 pl-3 text-right tabular-nums">{formatPrice(item.unit_price * item.qty)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <dl className="ml-auto mt-6 w-full max-w-xs space-y-1.5">
        <div className="flex justify-between text-neutral-700">
          <dt>Subtotal</dt>
          <dd className="tabular-nums">{formatPrice(order.subtotal)}</dd>
        </div>
        <div className="flex justify-between text-neutral-700">
          <dt>Delivery</dt>
          <dd className="tabular-nums">{order.delivery_fee > 0 ? formatPrice(order.delivery_fee) : "Free"}</dd>
        </div>
        <div className="flex justify-between border-t border-neutral-400 pt-2 text-xl font-semibold">
          <dt>Total</dt>
          <dd className="tabular-nums">{formatPrice(order.total)}</dd>
        </div>
        {settings.gstin && <p className="text-right text-xs text-neutral-500">Prices include all applicable taxes.</p>}
      </dl>

      <p className="mt-8 rounded border border-neutral-300 px-4 py-3 text-sm">{paymentLine(order)}</p>

      <footer className="mt-8 border-t border-neutral-300 pt-4 text-center text-sm text-neutral-600">
        <p>Thank you for choosing {seller}. This is a computer-generated invoice and needs no signature.</p>
        {settings.contactEmail && (
          <p>
            Questions about your order? Write to {settings.contactEmail}
            {settings.grievanceOfficer ? ` (${settings.grievanceOfficer})` : ""}.
          </p>
        )}
      </footer>
    </article>
  );
}
