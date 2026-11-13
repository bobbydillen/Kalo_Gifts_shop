"use server";

import { revalidatePath } from "next/cache";
import { adminClient } from "@/lib/admin-auth";

export type NotesResult = { ok: true } | { ok: false; error: string };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Saves the private notes and tags for a customer. Tags come as one comma-separated line. */
export async function saveCustomerNotes(customerId: string, notes: string, tagsLine: string): Promise<NotesResult> {
  if (!UUID.test(customerId)) return { ok: false, error: "That customer could not be found." };

  const cleanNotes = String(notes ?? "").trim().slice(0, 2000);
  const tags = [
    ...new Set(
      String(tagsLine ?? "")
        .split(",")
        .map((t) => t.trim().replace(/\s+/g, " "))
        .filter(Boolean),
    ),
  ];
  if (tags.length > 12) return { ok: false, error: "Use at most 12 tags." };
  if (tags.some((t) => t.length > 24)) return { ok: false, error: "Each tag can be up to 24 characters." };

  const db = await adminClient();
  if (!db) return { ok: false, error: "You do not have access." };

  const { error } = await db
    .from("customer_notes")
    .upsert({ customer_id: customerId, notes: cleanNotes, tags, updated_at: new Date().toISOString() }, { onConflict: "customer_id" });
  if (error) return { ok: false, error: "The notes could not be saved. Try again." };

  revalidatePath("/admin", "layout");
  return { ok: true };
}
