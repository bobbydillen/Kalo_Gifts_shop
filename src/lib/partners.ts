import { supabaseServer } from "@/lib/supabase/server";

export type EntryKind = "put_in" | "paid_bank" | "paid_personally" | "taken_out" | "money_in";

export const KINDS: { id: EntryKind; label: string; help: string; needsPartner: boolean; partnerLabel?: string }[] = [
  { id: "put_in", label: "Put into bank", help: "A partner deposits money into the business account.", needsPartner: true, partnerLabel: "Who put it in" },
  { id: "paid_bank", label: "Paid from bank", help: "Paid from the business account (stock, fuel, ads…).", needsPartner: false },
  { id: "paid_personally", label: "Paid personally", help: "A partner paid a shop or bill from their own account.", needsPartner: true, partnerLabel: "Who paid" },
  { id: "taken_out", label: "Taken out", help: "A partner withdraws money, or is repaid for a personal payment.", needsPartner: true, partnerLabel: "Who took it" },
  { id: "money_in", label: "Money in", help: "Sales money arrives in the account (payouts, payments).", needsPartner: false },
];

export const CATEGORIES = ["Wholesale stock", "Fuel", "Packaging", "Courier", "Ads", "Software", "Sales", "Correction", "Other"];

export const kindLabel = (k: string) => KINDS.find((x) => x.id === k)?.label ?? k;

export type Partner = { user_id: string; username: string; display_name: string; username_changed: boolean };

export type Entry = {
  id: string;
  entry_date: string;
  kind: EntryKind;
  partner_id: string | null;
  amount: number;
  category: string;
  note: string;
  bill_path: string | null;
  entered_by: string;
  created_at: string;
  voided_at: string | null;
  void_reason: string | null;
};

export type MonthCheck = { month: string; real_balance: number; app_balance: number; started_by: string; confirmed: string[] };

export type Summary = {
  bank: number;
  capital: Map<string, number>;
  expenses: number;
};

/** Bank balance, each partner's capital and total expenses, ignoring voided entries. */
export function summarise(entries: Entry[], partners: Partner[]): Summary {
  let bank = 0;
  let expenses = 0;
  const capital = new Map(partners.map((p) => [p.user_id, 0]));
  for (const e of entries) {
    if (e.voided_at) continue;
    const amount = Number(e.amount);
    if (e.kind === "put_in") {
      bank += amount;
      capital.set(e.partner_id!, (capital.get(e.partner_id!) ?? 0) + amount);
    } else if (e.kind === "money_in") bank += amount;
    else if (e.kind === "paid_bank") {
      bank -= amount;
      expenses += amount;
    } else if (e.kind === "paid_personally") {
      capital.set(e.partner_id!, (capital.get(e.partner_id!) ?? 0) + amount);
      expenses += amount;
    } else if (e.kind === "taken_out") {
      bank -= amount;
      capital.set(e.partner_id!, (capital.get(e.partner_id!) ?? 0) - amount);
    }
  }
  return { bank, capital, expenses };
}

/** Who is ahead and what evens it up (shares are equal). */
export function evenUp(summary: Summary, partners: Partner[]) {
  if (partners.length !== 2) return null;
  const [a, b] = partners;
  const diff = (summary.capital.get(a.user_id) ?? 0) - (summary.capital.get(b.user_id) ?? 0);
  if (Math.abs(diff) < 0.005) return { text: "You are exactly even. Nothing to settle." };
  const ahead = diff > 0 ? a : b;
  const behind = diff > 0 ? b : a;
  const half = Math.abs(diff) / 2;
  return {
    text: `${ahead.display_name} is ahead by ₹${Math.abs(diff).toLocaleString("en-IN")}. To be equal, ${behind.display_name} can put ₹${half.toLocaleString("en-IN")} into the bank, or ${ahead.display_name} can take back ₹${half.toLocaleString("en-IN")}.`,
  };
}

/** The signed-in partner and the database client, or null for anyone who is not a partner. */
export async function partnerContext() {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from("partners").select("user_id, username, display_name, username_changed").order("created_at");
  const partners = (data ?? []) as Partner[];
  const me = partners.find((p) => p.user_id === user.id);
  return me ? { supabase, me, partners } : null;
}

export async function loadEntries(supabase: Awaited<ReturnType<typeof supabaseServer>>): Promise<Entry[]> {
  const { data } = await supabase
    .from("ledger_entries")
    .select("id, entry_date, kind, partner_id, amount, category, note, bill_path, entered_by, created_at, voided_at, void_reason")
    .order("entry_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(5000);
  return (data ?? []).map((e) => ({ ...e, amount: Number(e.amount) })) as Entry[];
}

export async function loadChecks(supabase: Awaited<ReturnType<typeof supabaseServer>>): Promise<MonthCheck[]> {
  const [{ data: checks }, { data: confirms }] = await Promise.all([
    supabase.from("month_checks").select("month, real_balance, app_balance, started_by").order("month", { ascending: false }),
    supabase.from("month_confirms").select("month, partner_id"),
  ]);
  return (checks ?? []).map((c) => ({
    month: c.month,
    real_balance: Number(c.real_balance),
    app_balance: Number(c.app_balance),
    started_by: c.started_by,
    confirmed: (confirms ?? []).filter((f) => f.month === c.month).map((f) => f.partner_id),
  }));
}

export const inr = (n: number) => `${n < 0 ? "−" : ""}₹${Math.abs(n).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

export const todayIst = () => new Date(Date.now() + 5.5 * 60 * 60 * 1000).toISOString().slice(0, 10);
