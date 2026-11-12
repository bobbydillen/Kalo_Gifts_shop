import nodemailer from "nodemailer";
import { getProducts } from "@/lib/catalog-data";
import { formatPrice } from "@/lib/catalog";
import type { CheckoutDetails, OrderLineInput } from "@/lib/checkout";

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/**
 * Emails about a new order: an alert to the shop owner and a confirmation to the customer.
 * Environment variables:
 *   SMTP_USER            the Gmail address that sends them
 *   SMTP_APP_PASSWORD    that account's 16-letter app password
 *   ORDER_NOTIFY_EMAIL   where the owner's alert goes (the customer email needs only the two above)
 * A missing variable skips that email. Any failure is only logged: the order is already saved
 * in the database and visible in the admin, so it is never affected.
 */
export async function sendOrderEmails(order: { number: number; total: number }, details: CheckoutDetails, items: OrderLineInput[]) {
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_APP_PASSWORD;
  if (!user || !pass) return;
  const owner = process.env.ORDER_NOTIFY_EMAIL;

  let lines: string[];
  try {
    const products = await getProducts();
    const names = new Map(products.map((p) => [p.slug, p.name]));
    lines = items.map((i) => {
      const options = [i.colour, i.size].filter(Boolean).join(", ");
      const extras = [i.wrap ? "gift wrap" : "", i.note ? `card: "${i.note}"` : ""].filter(Boolean).join("; ");
      return `${names.get(i.slug) ?? i.slug} x ${i.qty}${options ? ` (${options})` : ""}${extras ? ` - ${extras}` : ""}`;
    });
  } catch (err) {
    console.error("Order email could not read products", err instanceof Error ? err.message : err);
    lines = items.map((i) => `${i.slug} x ${i.qty}`);
  }

  const address = [details.line1, details.line2, `${details.city}, ${details.state} ${details.pincode}`]
    .filter(Boolean)
    .join(", ");
  const total = formatPrice(order.total);
  const list = `<ul style="padding-left:18px">${lines.map((l) => `<li>${esc(l)}</li>`).join("")}</ul>`;
  const transport = nodemailer.createTransport({ host: "smtp.gmail.com", port: 465, secure: true, auth: { user, pass } });

  if (owner) {
    try {
      await transport.sendMail({
        from: `"KALO Gifts orders" <${user}>`,
        to: owner,
        replyTo: details.email,
        subject: `New order #${order.number} - ${total}`,
        text: [
          `New order #${order.number} - ${total}`,
          "",
          ...lines,
          "",
          `Deliver to: ${details.name}`,
          address,
          `Phone: ${details.phone}`,
          `Email: ${details.email}`,
          ...(details.note ? [`Delivery note: ${details.note}`] : []),
          "",
          "Open the admin Orders page to confirm it and update its status.",
        ].join("\n"),
        html: `<div style="font-family:Arial,sans-serif;max-width:520px">
<h2 style="margin:0 0 4px">New order #${order.number}</h2>
<p style="margin:0 0 16px;font-size:20px"><strong>${esc(total)}</strong></p>
${list}
<p><strong>${esc(details.name)}</strong><br>${esc(address)}<br>${esc(details.phone)}<br>${esc(details.email)}</p>
${details.note ? `<p>Delivery note: ${esc(details.note)}</p>` : ""}
<p style="color:#666">Open the admin Orders page to confirm it and update its status.</p></div>`,
      });
    } catch (err) {
      console.error("Order alert email failed", err instanceof Error ? err.message : err);
    }
  }

  try {
    await transport.sendMail({
      from: `"KALO Gifts" <${user}>`,
      to: details.email,
      subject: `Your KALO Gifts order #${order.number}`,
      text: [
        `Hi ${details.name},`,
        "",
        `Thank you for your order. It is #${order.number}, total ${total}.`,
        "",
        ...lines,
        "",
        `Delivering to: ${address}`,
        "",
        "We will message you on WhatsApp to confirm your order and share how to pay.",
        "You can see this order any time by signing in on the Account page of our website with this email address.",
        "",
        "With love,",
        "KALO Gifts",
      ].join("\n"),
      html: `<div style="font-family:Arial,sans-serif;max-width:520px;color:#222">
<h2 style="margin:0 0 4px">Thank you, ${esc(details.name)}</h2>
<p style="margin:0 0 16px">Your order <strong>#${order.number}</strong> is received. Total <strong>${esc(total)}</strong>.</p>
${list}
<p><strong>Delivering to</strong><br>${esc(details.name)}<br>${esc(address)}</p>
<p>We will message you on WhatsApp to confirm your order and share how to pay.</p>
<p style="color:#666">You can see this order any time by signing in on the Account page of our website with this email address.</p>
<p style="margin-top:24px">With love,<br>KALO Gifts</p></div>`,
    });
  } catch (err) {
    console.error("Customer order email failed", err instanceof Error ? err.message : err);
  }
}
