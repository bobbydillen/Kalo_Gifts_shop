import type { SiteSettings } from "@/lib/settings";

/** A wa.me link that opens WhatsApp to the shop with a message ready to send, or null if no number is set. */
export function chatLink(settings: Pick<SiteSettings, "whatsappNumber">, text: string): string | null {
  const n = settings.whatsappNumber.replace(/\D/g, "").slice(-10);
  return n.length === 10 ? `https://wa.me/91${n}?text=${encodeURIComponent(text)}` : null;
}

/** The message that starts a return or help chat. The order number is filled in when known. */
export const returnMessage = (orderNumber?: number) =>
  orderNumber
    ? `Hi KALO Gifts, I would like help with my order #${orderNumber} (return, exchange or other). `
    : "Hi KALO Gifts, I would like help with an order (return, exchange or other). My order number is: ";
