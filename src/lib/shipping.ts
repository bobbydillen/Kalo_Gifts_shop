/**
 * Delivery cost. These rules are repeated inside the database (private.shipping_fee, called by
 * place_order), which is the one that counts when an order is placed. This copy lets checkout
 * show the fee beforehand, so keep the two in step.
 *
 * Three regions, four numbers each: the charge up to 500 g, up to 1 kg, up to 2 kg, and the
 * extra for every further 1 kg or part of it. Orders at or above the free-shipping limit ship free.
 */

export type Zone = "tn" | "south" | "india";
export type ZoneRates = [upTo500g: number, upTo1kg: number, upTo2kg: number, perExtraKg: number];
export type ShippingRates = Record<Zone, ZoneRates>;

export const ZONES: { id: Zone; label: string; states: string }[] = [
  { id: "tn", label: "Tamil Nadu", states: "Tamil Nadu" },
  { id: "south", label: "Rest of South India", states: "Kerala, Karnataka, Andhra Pradesh, Telangana, Puducherry" },
  { id: "india", label: "Rest of India", states: "Everywhere else" },
];

export const RATE_COLUMNS = ["Up to 500 g", "Up to 1 kg", "Up to 2 kg", "Each extra 1 kg"] as const;

export const DEFAULT_SHIPPING_RATES: ShippingRates = {
  tn: [50, 70, 100, 40],
  south: [60, 80, 120, 50],
  india: [70, 100, 150, 60],
};

const SOUTH = ["kerala", "karnataka", "andhra pradesh", "telangana", "puducherry"];

export function zoneFor(state: string): Zone {
  const s = state.trim().toLowerCase();
  if (s === "tamil nadu") return "tn";
  return SOUTH.includes(s) ? "south" : "india";
}

/** Checks a rates object that came from the database or a form. Returns null if it is not valid. */
export function parseRates(value: unknown): ShippingRates | null {
  if (!value || typeof value !== "object") return null;
  const out = {} as ShippingRates;
  for (const { id } of ZONES) {
    const row = (value as Record<string, unknown>)[id];
    if (!Array.isArray(row) || row.length !== 4) return null;
    if (!row.every((n) => Number.isInteger(n) && n >= 0 && n <= 5000)) return null;
    out[id] = row as ZoneRates;
  }
  return out;
}

export function shippingFee(
  rates: ShippingRates,
  freeOver: number,
  state: string,
  weightG: number,
  subtotal: number,
): number {
  if (subtotal >= freeOver) return 0;
  const row = rates[zoneFor(state)];
  const weight = Math.max(weightG, 1);
  if (weight <= 500) return row[0];
  if (weight <= 1000) return row[1];
  if (weight <= 2000) return row[2];
  return row[2] + Math.ceil((weight - 2000) / 1000) * row[3];
}
