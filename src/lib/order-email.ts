import nodemailer from "nodemailer";
import { getProducts } from "@/lib/catalog-data";
import { formatPrice } from "@/lib/catalog";
import type { CheckoutDetails, OrderLineInput } from "@/lib/checkout";

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/**
 * Emails the shop owner when an order is placed. Needs three environment variables:
 *   ORDER_NOTIFY_EMAIL   where the alert goes
 *   SMTP_USER            the Gmail address that sends it
 *   SMTP_APP_PASSWORD    that account's 16-letter app password
 * If any is missing, nothing is sent. A failure here never affects the order, which is
 * already saved in the database and visible in the admin.
 */
export async function sendOrderAlert(order: { number: number; total: number }, details: CheckoutDetails, items: OrderLineInput[]) {
  const to = process.env.ORDER_NOTIFY_EMAIL;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_APP_PASSWORD;
  if (!to || !user || !pass) return;

  try {
    const products = await getProducts();
    const names = new Map(products.map((p) => [p.slug, p.name]));

    const lines = items.map((i) => {
      const options = [i.colour, i.size].filter(Boolean).join(", ");
      const extras = [i.wrap ? "gift wrap" : "", i.note ? `card: "${i.note}"` : ""].filter(Boolean).join("; ");
      return `${names.get(i.slug) ?? i.slug} x ${i.qty}${options ? ` (${options})` : ""}${extras ? ` - ${extras}` : ""}`;
    });

    const address = [details.line1, details.line2, `${details.city}, ${details.state} ${details.pincode}`]
      .filter(Boolean)
      .join(", ");

    const text = [
      `New order #${order.number} - ${formatPrice(order.total)}`,
      "",
      ...lines,
      "",
      `Deliver to: ${details.name}`,
      address,
      `Phone: ${details.phone}`,
      `Email: ${details.email}`,
      details.note ? `Delivery note: ${details.note}` : "",
      "",
      "Open the admin Orders page to confirm it and update its status.",
    ]
      .filter((l, idx, all) => l !== "" || all[idx - 1] !== "")
      .join("\n");

    const html = `<div style="font-family:Arial,sans-serif;max-width:520px">
<h2 style="margin:0 0 4px">New order #${order.number}</h2>
<p style="margin:0 0 16px;font-size:20px"><strong>${esc(formatPrice(order.total))}</strong></p>
<ul style="padding-left:18px">${lines.map((l) => `<li>${esc(l)}</li>`).join("")}</ul>
<p><strong>${esc(details.name)}</strong><br>${esc(address)}<br>${esc(details.phone)}<br>${esc(details.email)}</p>
${details.note ? `<p>Delivery note: ${esc(details.note)}</p>` : ""}
<p style="color:#666">Open the admin Orders page to confirm it and update its status.</p></div>`;

    const transport = nodemailer.createTransport({ host: "smtp.gmail.com", port: 465, secure: true, auth: { user, pass } });
    await transport.sendMail({
      from: `"KALO Gifts orders" <${user}>`,
      to,
      replyTo: details.email,
      subject: `New order #${order.number} - ${formatPrice(order.total)}`,
      text,
      html,
    });
  } catch (err) {
    console.error("Order alert email failed", err instanceof Error ? err.message : err);
  }
}
