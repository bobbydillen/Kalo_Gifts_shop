/** Checkout: the details a customer enters, how they are checked, and how errors are worded. */

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
};

export type PlaceOrderInput = CheckoutDetails & { items: OrderLineInput[]; expectedTotal: number };

const text = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

/** A plain check that something looks like an email address. */
export const isEmail = (v: string) => v.length <= 200 && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v);

/** The 10 digits of an Indian mobile number, or "" if it is not one. Accepts +91 and spaces. */
export function cleanPhone(raw: string) {
  let digits = raw.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) digits = digits.slice(2);
  return /^[6-9]\d{9}$/.test(digits) ? digits : "";
}

/** Checks and cleans the details. Used by the form for quick feedback and again on the server. */
export function validateDetails(
  raw: CheckoutDetails,
): { ok: true; value: CheckoutDetails } | { ok: false; error: string } {
  const fail = (error: string) => ({ ok: false as const, error });

  const phone = cleanPhone(typeof raw?.phone === "string" ? raw.phone : "");
  if (!phone) return fail("Enter a 10-digit Indian mobile number.");

  const email = text(raw.email, 200).toLowerCase();
  if (!isEmail(email)) return fail("Enter a valid email address. We use it to send your order details and let you see your orders.");

  const name = text(raw.name, 80);
  if (name.length < 2) return fail("Enter your name.");

  const line1 = text(raw.line1, 200);
  if (line1.length < 3) return fail("Enter your address.");

  const city = text(raw.city, 80);
  if (city.length < 2) return fail("Enter your city or town.");

  const state = text(raw.state, 60);
  if (!INDIAN_STATES.includes(state)) return fail("Choose your state.");

  const pincode = text(raw.pincode, 6);
  if (!/^[1-9]\d{5}$/.test(pincode)) return fail("Enter a valid 6-digit pincode.");

  return {
    ok: true,
    value: { phone, email, name, line1, line2: text(raw.line2, 200), city, state, pincode, note: text(raw.note, 300) },
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
    case "PHOTO_REQUIRED":
      return { text: `Your photo for ${detail || "an item"} was not saved. Remove it from your bag and add it again with your photo.` };
    case "CARD_TOO_LONG":
      return { text: "A card message is too long. Shorten it in your bag." };
    case "PRICE_CHANGED":
      return { text: "Some prices have just changed. Reload the page to see the new total, then place your order again.", refresh: true };
    case "BUSY":
    case "TOO_MANY":
      return { text: "We are getting a lot of orders right now. Please try again in a little while." };
    default:
      return { text: "The order could not be placed. Please try again." };
  }
}
