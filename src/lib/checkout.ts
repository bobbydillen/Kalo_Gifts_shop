/** Checkout: the details a customer enters, how they are checked, and how errors are worded. */

import { checkAddressLine, checkName, checkOptionalLine, checkPlace, looksFakePhone } from "@/lib/address-check";

export const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana",
  "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur",
  "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana",
  "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal", "Andaman and Nicobar Islands", "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry",
];

export type CheckoutDetails = {
  phone: string;
  email: string;
  name: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  pincode: string;
  note: string;
};

export type OrderLineInput = {
  slug: string;
  colour?: string;
  size?: string;
  qty: number;
  wrap: boolean;
  note: string;
  photo?: string; // where the customer's photo was uploaded, for items that need one
  /** For a build-your-own hamper: the products inside it. */
  parts?: { slug: string; colour?: string; size?: string; qty: number; photo?: string }[];
};

/** "test" is a test order (no real payment); until the payment gateway is added it is the other way to order. */
export type PaymentChoice = "test" | "cod";

export type PlaceOrderInput = CheckoutDetails & { items: OrderLineInput[]; expectedTotal: number; payment: PaymentChoice };

/** How an order's payment method is shown in the admin, emails and reports. */
export const paymentLabel = (m: string | null | undefined) => (m === "cod" ? "Cash on delivery" : m === "test" ? "Test order" : "Prepaid");

/** Cash on delivery is only for plain orders up to this amount (the database checks it again). */
export const COD_MAX = 1500;

/**
 * Why cash on delivery is not offered for this bag, or null if it is. Gift wrap, a handwritten card and
 * anything made from the customer's own photo are not sent cash on delivery, and neither is a large order.
 */
export function codBlocker(
  lines: { wrap: boolean; note: string; photo?: unknown; parts?: { photo?: unknown }[] }[],
  total: number,
): string | null {
  const gift = lines.some((l) => l.wrap || l.note.trim() !== "" || l.photo || l.parts?.some((p) => p.photo));
  if (gift) return "Not available with gift wrap, a handwritten card or a custom photo.";
  if (total > COD_MAX) return `Not available for orders above ₹${COD_MAX.toLocaleString("en-IN")}.`;
  return null;
}

const text = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

/** A plain check that something looks like an email address. */
export const isEmail = (v: string) => v.length <= 200 && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v);

/** The 10 digits of an Indian mobile number, or "" if it is not one. Accepts +91 and spaces. */
export function cleanPhone(raw: string) {
  let digits = raw.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) digits = digits.slice(2);
  return /^[6-9]\d{9}$/.test(digits) ? digits : "";
}

/**
 * Checks and cleans the details. Used by the form for quick feedback and again on the server.
 * `trustedPlace` is true when the city and state came from the pincode lookup, so they are not
 * checked as hand-typed text.
 */
export function validateDetails(
  raw: CheckoutDetails,
  opts: { trustedPlace?: boolean } = {},
): { ok: true; value: CheckoutDetails } | { ok: false; error: string } {
  const fail = (error: string) => ({ ok: false as const, error });

  const phone = cleanPhone(typeof raw?.phone === "string" ? raw.phone : "");
  if (!phone) return fail("Enter a 10-digit Indian mobile number.");
  if (looksFakePhone(phone)) return fail("That mobile number does not look right. Please check it.");

  const email = text(raw.email, 200).toLowerCase();
  if (!isEmail(email)) return fail("Enter a valid email address. We use it to send your order details and let you see your orders.");

  const name = text(raw.name, 80).replace(/\s+/g, " ");
  const nameProblem = checkName(name);
  if (nameProblem) return fail(nameProblem);

  const line1 = text(raw.line1, 200).replace(/\s+/g, " ");
  const lineProblem = checkAddressLine(line1);
  if (lineProblem) return fail(lineProblem);

  const line2 = text(raw.line2, 200).replace(/\s+/g, " ");
  const line2Problem = checkOptionalLine(line2);
  if (line2Problem) return fail(line2Problem);

  const city = text(raw.city, 80).replace(/\s+/g, " ");
  if (city.length < 2) return fail("Enter your city or town.");
  if (!opts.trustedPlace) {
    const cityProblem = checkPlace(city);
    if (cityProblem) return fail(cityProblem);
  }

  const state = text(raw.state, 60);
  if (!INDIAN_STATES.includes(state)) return fail("Choose your state.");

  const pincode = text(raw.pincode, 6);
  if (!/^[1-9]\d{5}$/.test(pincode)) return fail("Enter a valid 6-digit pincode.");

  return {
    ok: true,
    value: { phone, email, name, line1, line2, city, state, pincode, note: text(raw.note, 300) },
  };
}

/** Turns the database's order errors into words a customer can act on. */
export function describeOrderError(message: string): { text: string; refresh?: boolean } {
  const colon = message.indexOf(":");
  const code = colon === -1 ? message : message.slice(0, colon);
  const detail = colon === -1 ? "" : message.slice(colon + 1);
  switch (code) {
    case "CHECKOUT_CLOSED":
      return { text: "We are not taking orders just yet. Please check back soon." };
    case "BAD_PHONE":
      return { text: "Enter a 10-digit Indian mobile number." };
    case "BAD_PINCODE":
      return { text: "Enter a valid 6-digit pincode." };
    case "PINCODE_UNKNOWN":
      return { text: "We could not find that pincode. Please check it. If it is right, message us on WhatsApp and we will help." };
    case "BAD_EMAIL":
      return { text: "Enter a valid email address." };
    case "BAD_NAME":
      return { text: "Enter your name." };
    case "BAD_ADDRESS":
      return { text: "Check your address details." };
    case "EMPTY_BAG":
      return { text: "Your bag is empty." };
    case "ITEM_UNAVAILABLE":
      return { text: "An item in your bag is no longer available. Remove it and try again.", refresh: true };
    case "BAD_OPTION":
      return { text: `${detail || "An item"} needs a colour or size that is no longer offered. Remove it and add it again.`, refresh: true };
    case "BAD_QTY":
      return { text: `Check the quantity of ${detail || "an item"}.` };
    case "OUT_OF_STOCK":
      return { text: `${detail || "An item"} has just sold out in that size or colour. Remove it or choose another.`, refresh: true };
    case "HAMPER_TOO_SMALL":
      return { text: "A build-your-own hamper needs at least three different gifts. Open your bag and add more to it." };
    case "HAMPER_UNAVAILABLE":
      return { text: "The hamper builder is not open just now. Please remove the hamper from your bag and try again later.", refresh: true };
    case "HAMPER_BAD":
      return { text: "Something is wrong with your hamper. Please remove it from your bag and build it again." };
    case "PHOTO_REQUIRED":
      return { text: `Your photo for ${detail || "an item"} was not saved. Remove it from your bag and add it again with your photo.` };
    case "CARD_TOO_LONG":
      return { text: "A card message is too long. Shorten it in your bag." };
    case "PRICE_CHANGED":
      return { text: "Some prices have just changed. Reload the page to see the new total, then place your order again.", refresh: true };
    case "BAD_PAYMENT":
      return { text: "Choose how you would like to order." };
    case "COD_NOT_AVAILABLE":
      return { text: "Cash on delivery is not available for this order. Choose the other option." };
    case "BUSY":
    case "TOO_MANY":
      return { text: "We are getting a lot of orders right now. Please try again in a little while." };
    default:
      return { text: "The order could not be placed. Please try again." };
  }
}
