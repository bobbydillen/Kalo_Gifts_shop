/** Shared pieces for the admin screens. */

export const ORDER_STATUSES = [
  { id: "new", label: "New" },
  { id: "confirmed", label: "Confirmed" },
  { id: "packing", label: "Packing" },
  { id: "shipped", label: "Shipped" },
  { id: "delivered", label: "Delivered" },
  { id: "cancelled", label: "Cancelled" },
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number]["id"];

export const isOrderStatus = (value: string): value is OrderStatus =>
  ORDER_STATUSES.some((s) => s.id === value);

export const statusLabel = (id: string) => ORDER_STATUSES.find((s) => s.id === id)?.label ?? id;

export type OrderItemRow = {
  id: string;
  product_slug: string;
  product_name: string;
  colour: string;
  size: string;
  qty: number;
  unit_price: number;
  gift_wrap: boolean;
  card_message: string;
};

export type OrderEventRow = { id: string; status: string; note: string; created_at: string };

export type OrderRow = {
  id: string;
  number: number;
  status: OrderStatus;
  payment_status: "pending" | "paid" | "failed" | "refunded";
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
  customer_note: string;
  customer_email: string | null;
  tracking_note: string;
  created_at: string;
};

const dateFormat = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  hour: "numeric",
  minute: "2-digit",
  timeZone: "Asia/Kolkata",
});
export const formatDate = (iso: string) => dateFormat.format(new Date(iso));

/** A wa.me link that opens WhatsApp with a message ready to send. Indian numbers get +91. */
export function whatsappLink(phone: string, text: string) {
  const digits = phone.replace(/\D/g, "");
  const full = digits.length === 10 ? `91${digits}` : digits;
  return `https://wa.me/${full}?text=${encodeURIComponent(text)}`;
}

/** Message suggested for the customer when an order reaches a given status. */
export function statusMessage(order: Pick<OrderRow, "number" | "ship_name" | "tracking_note">, status: string) {
  const name = order.ship_name.split(" ")[0] || "there";
  const head = `Hi ${name}, this is KALO Gifts about your order #${order.number}.`;
  switch (status) {
    case "confirmed":
      return `${head} We have confirmed it and will start packing soon. Thank you!`;
    case "packing":
      return `${head} We are packing it now.`;
    case "shipped":
      return `${head} It has been shipped.${order.tracking_note ? ` ${order.tracking_note}` : ""}`;
    case "delivered":
      return `${head} It should have reached you. We hope you love it! Tell us how it went.`;
    case "cancelled":
      return `${head} It has been cancelled. Reply here if you have questions.`;
    default:
      return head;
  }
}
