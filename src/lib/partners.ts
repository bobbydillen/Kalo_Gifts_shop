import { supabaseServer } from "@/lib/supabase/server";
import type { Entry, MonthCheck, Partner } from "@/lib/partner-data";

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

