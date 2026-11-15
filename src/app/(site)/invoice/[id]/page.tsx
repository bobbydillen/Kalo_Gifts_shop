import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PrintButton } from "@/components/admin/PrintButton";
import { Invoice, invoiceNumber, type InvoiceOrder } from "@/components/invoice/Invoice";
import { getSettings } from "@/lib/settings-data";
import { supabaseServer } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Invoice",
  robots: { index: false, follow: false },
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * The bill for one order. It reads the order as whoever is signed in, so the database only returns it
 * to the customer who placed it (signed in with their email) or to the shop's admins. Anyone else sees "not found".
 */
export default function InvoicePage({ params }: PageProps<"/invoice/[id]">) {
  return (
    <Suspense>
      <InvoiceContent params={params} />
    </Suspense>
  );
}

async function InvoiceContent({ params }: Pick<PageProps<"/invoice/[id]">, "params">) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();

  const supabase = await supabaseServer();
  const { data } = await supabase
    .from("orders")
    .select(
      "number, created_at, status, payment_status, payment_method, subtotal, delivery_fee, total, ship_name, ship_phone, ship_line1, ship_line2, ship_city, ship_state, ship_pincode, customer_email, order_items(id, product_slug, product_name, colour, size, qty, unit_price, gift_wrap, card_message, photo_path, parts)",
    )
    .eq("id", id)
    .maybeSingle();
  if (!data) notFound();

  const order = data as unknown as InvoiceOrder;
  const settings = await getSettings();

  return (
    <div className="mx-auto max-w-3xl px-4 pb-24 pt-10 sm:px-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <Link href="/account" className="text-sm text-faint underline underline-offset-4 hover:text-cream">
          ← Back
        </Link>
        <PrintButton label={`Print or save invoice ${invoiceNumber(order.number)} as PDF`} />
      </div>
      <Invoice order={order} settings={settings} />
    </div>
  );
}
