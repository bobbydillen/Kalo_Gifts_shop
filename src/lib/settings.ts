/**
 * Site settings: the Christmas switches and dates, and the gift option prices.
 * They live in the database (table site_settings) and are edited in the admin.
 * This file holds the shape, the defaults used when a row is missing, and the checks.
 * It does not talk to the database.
 */

export type SiteSettings = {
  snowfall: boolean;
  countdown: boolean;
  christmasHero: boolean; // Christmas page, home section and menu link
  orderByBanner: boolean;
  orderByDate: string; // ISO date-time: last moment to order for Christmas delivery
  christmasDate: string; // ISO date-time the countdown runs to
  giftWrapPrice: number; // rupees per piece
  giftCardPrice: number; // rupees per piece
  giftCardMaxChars: number;
  checkoutOpen: boolean; // customers can place orders
  deliveryFee: number; // flat rupees added to every order
  customerLogin: boolean; // sign-in by text message and the Account page
};

export const DEFAULT_SETTINGS: SiteSettings = {
  snowfall: true,
  countdown: true,
  christmasHero: true,
  orderByBanner: true,
  orderByDate: "2026-12-18T23:59:00+05:30",
  christmasDate: "2026-12-25T00:00:00+05:30",
  giftWrapPrice: 50,
  giftCardPrice: 50,
  giftCardMaxChars: 250,
  checkoutOpen: false, // stays off until payments or another way to pay are ready
  deliveryFee: 0,
  customerLogin: false, // off until the SMS provider is set up and tested
};

/** Database key for each setting. */
export const SETTING_KEYS: Record<keyof SiteSettings, string> = {
  snowfall: "snowfall",
  countdown: "countdown",
  christmasHero: "christmas_hero",
  orderByBanner: "order_by_banner",
  orderByDate: "order_by_date",
  christmasDate: "christmas_date",
  giftWrapPrice: "gift_wrap_price",
  giftCardPrice: "gift_card_price",
  giftCardMaxChars: "gift_card_max_chars",
  checkoutOpen: "checkout_open",
  deliveryFee: "delivery_fee",
  customerLogin: "customer_login",
};

const isDate = (v: unknown): v is string => typeof v === "string" && !Number.isNaN(Date.parse(v));

/** Turns database rows into settings, falling back to the default for anything missing or malformed. */
export function parseSettings(rows: { key: string; value: unknown }[]): SiteSettings {
  const byKey = new Map(rows.map((r) => [r.key, r.value]));
  const out: SiteSettings = { ...DEFAULT_SETTINGS };

  for (const name of Object.keys(DEFAULT_SETTINGS) as (keyof SiteSettings)[]) {
    const value = byKey.get(SETTING_KEYS[name]);
    const fallback = DEFAULT_SETTINGS[name];
    if (typeof fallback === "boolean" && typeof value === "boolean") (out[name] as boolean) = value;
    else if (typeof fallback === "number" && typeof value === "number" && Number.isFinite(value)) (out[name] as number) = value;
    else if (name === "orderByDate" || name === "christmasDate") {
      if (isDate(value)) out[name] = value;
    }
  }
  return out;
}

export const settingsToRows = (s: SiteSettings) =>
  (Object.keys(SETTING_KEYS) as (keyof SiteSettings)[]).map((name) => ({
    key: SETTING_KEYS[name],
    value: s[name],
  }));

/** Checks settings before they are saved. Never trusts its input. */
export function validateSettings(
  raw: SiteSettings,
): { ok: true; value: SiteSettings } | { ok: false; error: string } {
  const fail = (error: string) => ({ ok: false as const, error });

  for (const name of ["snowfall", "countdown", "christmasHero", "orderByBanner", "checkoutOpen", "customerLogin"] as const) {
    if (typeof raw?.[name] !== "boolean") return fail("A switch has an invalid value.");
  }
  for (const name of ["orderByDate", "christmasDate"] as const) {
    const v = raw?.[name];
    if (!isDate(v)) return fail("Enter a valid date and time.");
    const year = new Date(v).getUTCFullYear();
    if (year < 2024 || year > 2100) return fail("That date looks wrong. Check the year.");
  }
  const whole = (v: unknown, min: number, max: number) => Number.isInteger(v) && (v as number) >= min && (v as number) <= max;
  if (!whole(raw.giftWrapPrice, 0, 5000)) return fail("Gift wrap price must be a whole number of rupees, 0 to 5000.");
  if (!whole(raw.giftCardPrice, 0, 5000)) return fail("Handwritten card price must be a whole number of rupees, 0 to 5000.");
  if (!whole(raw.deliveryFee, 0, 5000)) return fail("The delivery fee must be a whole number of rupees, 0 to 5000.");
  if (!whole(raw.giftCardMaxChars, 20, 1000)) return fail("The card message limit must be between 20 and 1000 characters.");

  return { ok: true, value: { ...raw } };
}

// ---- dates are entered and shown in Indian time -----------------------------

/** "2026-12-18T23:59:00+05:30" -> "2026-12-18T23:59", for a date-time input. */
export function toIstInput(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(+d)) return "";
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(d);
  const get = (type: string) => parts.find((p) => p.type === type)!.value;
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
}

/** "2026-12-18T23:59" -> "2026-12-18T23:59:00+05:30". Returns "" if the text is not a date-time. */
export const fromIstInput = (local: string) =>
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(local) ? `${local}:00+05:30` : "";
