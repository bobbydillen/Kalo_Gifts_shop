import { cacheLife } from "next/cache";
import { INDIAN_STATES } from "@/lib/checkout";

/**
 * Looks a pincode up in India Post's public records (api.postalpincode.in) to get its state, its
 * city and the local areas it covers. Results are remembered for a month, so each pincode is looked
 * up once. If the service is down the checkout falls back to typing the city and state by hand, so
 * a customer is never stuck.
 */

export type PincodeInfo = {
  pincode: string;
  state: string; // one of INDIAN_STATES when known, otherwise as India Post names it
  stateKnown: boolean;
  city: string;
  areas: string[]; // local areas (post offices) the pincode covers
};

export type PincodeResult =
  | { status: "found"; info: PincodeInfo }
  | { status: "not-found" }
  | { status: "unavailable" };

type PostOffice = { Name: string; District: string; Block: string; State: string };
type Reply = { Status: string; PostOffice: PostOffice[] | null }[];

const clean = (s: string) => s.replace(/\s+/g, " ").replace(/[;,.]+$/, "").trim();
const key = (s: string) => s.toLowerCase().replace(/&/g, "and").replace(/[^a-z]/g, "");

const ALIASES: Record<string, string> = {
  pondicherry: "Puducherry",
  orissa: "Odisha",
  uttaranchal: "Uttarakhand",
  dadraandnagarhaveli: "Dadra and Nagar Haveli and Daman and Diu",
  damananddiu: "Dadra and Nagar Haveli and Daman and Diu",
};

/** India Post's spelling of a state, matched to the names the checkout uses. */
export function canonicalState(apiState: string): string | null {
  const k = key(apiState);
  return INDIAN_STATES.find((s) => key(s) === k) ?? ALIASES[k] ?? null;
}

/** Fetches one pincode. Throws if the service cannot be reached, so a failure is never remembered. */
async function fetchPincode(pin: string): Promise<PincodeResult> {
  "use cache";
  cacheLife({ stale: 3600, revalidate: 60 * 60 * 24 * 30, expire: 60 * 60 * 24 * 90 });

  const res = await fetch(`https://api.postalpincode.in/pincode/${pin}`, { signal: AbortSignal.timeout(6000) });
  if (!res.ok) throw new Error(`pincode service replied ${res.status}`);
  const body = (await res.json()) as Reply;
  const first = body?.[0];
  if (!first) throw new Error("pincode service sent nothing");
  if (first.Status !== "Success" || !first.PostOffice?.length) return { status: "not-found" };

  const offices = first.PostOffice;
  const head = offices[0];
  const block = clean(head.Block ?? "");
  const state = canonicalState(head.State ?? "");
  return {
    status: "found",
    info: {
      pincode: pin,
      state: state ?? clean(head.State ?? ""),
      stateKnown: state !== null,
      // the block is usually the town; it can be "NA", then the district is used
      city: block && block.toUpperCase() !== "NA" ? block : clean(head.District ?? ""),
      areas: [...new Set(offices.map((o) => clean(o.Name)).filter(Boolean))].sort((a, b) => a.localeCompare(b)),
    },
  };
}

export async function lookupPincode(pin: string): Promise<PincodeResult> {
  if (!/^[1-9]\d{5}$/.test(pin)) return { status: "not-found" };
  try {
    return await fetchPincode(pin);
  } catch {
    return { status: "unavailable" };
  }
}
