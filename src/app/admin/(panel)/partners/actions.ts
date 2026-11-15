"use server";

import { revalidatePath } from "next/cache";
import { CATEGORIES, KINDS } from "@/lib/partner-data";
import { partnerContext } from "@/lib/partners";

export type PartnerResult = { ok: true } | { ok: false; error: string };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ERRORS: Record<string, string> = {
  MONTH_LOCKED: "That month is locked: both partners confirmed it.",
  REASON_REQUIRED: "Write a short reason.",
  NOT_FOUND: "That entry could not be found or is already voided.",
  MONTH_NOT_OVER: "A month can be checked only after it ends.",
  NO_CHECK: "Enter the real bank balance first.",
  BAD_USERNAME: "Use 3 to 20 letters or numbers, then @kalo (for example bobby@kalo).",
  ALREADY_CHANGED: "You have already used your one username change.",
  TAKEN: "That username is taken.",
};
const friendly = (message: string | undefined) => {
  const code = Object.keys(ERRORS).find((c) => message?.includes(c));
  return code ? ERRORS[code] : "That could not be saved. Try again.";
};

export async function addEntry(formData: FormData): Promise<PartnerResult> {
  const ctx = await partnerContext();
  if (!ctx) return { ok: false, error: "Partners only." };

  const kind = KINDS.find((k) => k.id === String(formData.get("kind")));
  if (!kind) return { ok: false, error: "Choose what happened." };
  const amount = Math.round(Number(formData.get("amount")) * 100) / 100;
  if (!(amount > 0) || amount > 100000000) return { ok: false, error: "Enter an amount above zero." };
  const date = String(formData.get("date") ?? "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return { ok: false, error: "Choose the date." };
  const partnerId = String(formData.get("partner") ?? "");
  if (kind.needsPartner && !ctx.partners.some((p) => p.user_id === partnerId)) return { ok: false, error: "Choose which partner." };
  const category = CATEGORIES.includes(String(formData.get("category"))) ? String(formData.get("category")) : "Other";
  const note = String(formData.get("note") ?? "").trim().slice(0, 500);

  let billPath: string | null = null;
  const bill = formData.get("bill");
  if (bill instanceof File && bill.size > 0) {
    if (!bill.type.startsWith("image/") && bill.type !== "application/pdf") return { ok: false, error: "The bill must be a photo or a PDF." };
    if (bill.size > 8 * 1024 * 1024) return { ok: false, error: "The bill file is over 8 MB." };
    const ext = bill.type === "application/pdf" ? "pdf" : (bill.type.split("/")[1] || "jpg").replace(/[^a-z0-9]/gi, "").slice(0, 5);
    billPath = `${ctx.me.user_id}/${crypto.randomUUID()}.${ext}`;
    const { error } = await ctx.supabase.storage.from("bills").upload(billPath, bill, { contentType: bill.type });
    if (error) return { ok: false, error: "The bill photo could not be uploaded. Try again." };
  }

  const { error } = await ctx.supabase.from("ledger_entries").insert({
    entry_date: date,
    kind: kind.id,
    partner_id: kind.needsPartner ? partnerId : null,
    amount,
    category,
    note,
    bill_path: billPath,
    entered_by: ctx.me.user_id,
  });
  if (error) return { ok: false, error: friendly(error.message) };
  revalidatePath("/admin/partners", "layout");
  return { ok: true };
}

export async function voidEntry(formData: FormData): Promise<PartnerResult> {
  const ctx = await partnerContext();
  if (!ctx) return { ok: false, error: "Partners only." };
  const id = String(formData.get("id") ?? "");
  if (!UUID.test(id)) return { ok: false, error: "That entry could not be found." };
  const { error } = await ctx.supabase.rpc("void_entry", { p_id: id, p_reason: String(formData.get("reason") ?? "") });
  if (error) return { ok: false, error: friendly(error.message) };
  revalidatePath("/admin/partners", "layout");
  return { ok: true };
}

export async function startMonthCheck(formData: FormData): Promise<PartnerResult> {
  const ctx = await partnerContext();
  if (!ctx) return { ok: false, error: "Partners only." };
  const month = String(formData.get("month") ?? "");
  const real = Number(formData.get("real"));
  if (!/^\d{4}-\d{2}-01$/.test(month) || !Number.isFinite(real)) return { ok: false, error: "Enter the real bank balance." };
  const { error } = await ctx.supabase.rpc("start_month_check", { p_month: month, p_real: real });
  if (error) return { ok: false, error: friendly(error.message) };
  revalidatePath("/admin/partners", "layout");
  return { ok: true };
}

export async function confirmMonth(formData: FormData): Promise<PartnerResult> {
  const ctx = await partnerContext();
  if (!ctx) return { ok: false, error: "Partners only." };
  const { error } = await ctx.supabase.rpc("confirm_month", { p_month: String(formData.get("month") ?? "") });
  if (error) return { ok: false, error: friendly(error.message) };
  revalidatePath("/admin/partners", "layout");
  return { ok: true };
}

export async function changeUsername(formData: FormData): Promise<PartnerResult> {
  const ctx = await partnerContext();
  if (!ctx) return { ok: false, error: "Partners only." };
  const { error } = await ctx.supabase.rpc("change_username", { p_username: String(formData.get("username") ?? "") });
  if (error) return { ok: false, error: friendly(error.message) };
  revalidatePath("/admin", "layout");
  return { ok: true };
}

/** A short-lived link to view a bill. Partners only. */
export async function billLink(path: string): Promise<string | null> {
  const ctx = await partnerContext();
  if (!ctx || !/^[0-9a-f-]{36}\/[0-9a-f-]{36}\.[a-z0-9]{2,5}$/i.test(path)) return null;
  const { data } = await ctx.supabase.storage.from("bills").createSignedUrl(path, 120);
  return data?.signedUrl ?? null;
}
