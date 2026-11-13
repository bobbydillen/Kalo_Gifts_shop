import { adminClient } from "@/lib/admin-auth";
import { customersWorkbook, productsWorkbook } from "@/lib/excel";
import { loadCustomerReport, loadProductReport } from "@/lib/reports";

const XLSX = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

/**
 * Excel downloads for the admin: /admin/export/customers and /admin/export/products.
 * Only a signed-in admin gets a file; anyone else gets a plain "not allowed".
 */
export async function GET(_request: Request, { params }: RouteContext<"/admin/export/[kind]">) {
  const { kind } = await params;
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
