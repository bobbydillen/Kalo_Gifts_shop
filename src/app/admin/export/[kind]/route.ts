import { adminClient } from "@/lib/admin-auth";
import { customersWorkbook, ledgerWorkbook, productsWorkbook } from "@/lib/excel";
import { loadEntries, partnerContext, summarise } from "@/lib/partners";
import { loadCustomerReport, loadProductReport } from "@/lib/reports";

const XLSX = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

/**
 * Excel downloads for the admin: /admin/export/customers and /admin/export/products.
 * Only a signed-in admin gets a file; anyone else gets a plain "not allowed".
 */
export async function GET(request: Request, { params }: RouteContext<"/admin/export/[kind]">) {
  const { kind } = await params;
  if (kind === "ledger") return ledgerDownload(request);
  const db = await adminClient();
  if (!db) return new Response("Not allowed", { status: 403 });

  const today = new Date(Date.now() + 5.5 * 60 * 60 * 1000).toISOString().slice(0, 10);
  let file: Buffer;
  try {
    if (kind === "customers") file = await customersWorkbook(await loadCustomerReport(db));
    else if (kind === "products") file = await productsWorkbook(await loadProductReport(db));
    else return new Response("Not found", { status: 404 });
  } catch {
    return new Response("The report could not be built. Try again.", { status: 500 });
  }

  return new Response(new Uint8Array(file), {
    headers: {
      "Content-Type": XLSX,
      "Content-Disposition": `attachment; filename="kalo-${kind}-${today}.xlsx"`,
      "Cache-Control": "no-store",
    },
  });
}

/** The partner ledger, with the same filters as the screen. Partners only. */
async function ledgerDownload(request: Request) {
  const ctx = await partnerContext();
  if (!ctx) return new Response("Not allowed", { status: 403 });
  const q = new URL(request.url).searchParams;
  const entries = await loadEntries(ctx.supabase);
  const summary = summarise(entries, ctx.partners);
  const month = q.get("m") ?? "";
  const shown = entries.filter(
    (e) =>
      (q.get("v") === "1" || !e.voided_at) &&
      (!month || e.entry_date.startsWith(month)) &&
      (!q.get("c") || e.category === q.get("c")) &&
      (!q.get("k") || e.kind === q.get("k")) &&
      (!q.get("p") || e.partner_id === q.get("p") || e.entered_by === q.get("p")),
  );
  const file = await ledgerWorkbook(shown, ctx.partners, summary);
  const today = new Date(Date.now() + 5.5 * 60 * 60 * 1000).toISOString().slice(0, 10);
  return new Response(new Uint8Array(file), {
    headers: {
      "Content-Type": XLSX,
      "Content-Disposition": `attachment; filename="kalo-ledger-${today}.xlsx"`,
      "Cache-Control": "no-store",
    },
  });
}
