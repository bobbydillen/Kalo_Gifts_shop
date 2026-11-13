import writeXlsxFile, { type Cell, type Sheet, type SheetData } from "write-excel-file/node";
import { categoryLabels, type Category } from "@/lib/catalog";
import {
  isCounted,
  toIst,
  type CustomerReport,
  type ProductReport,
} from "@/lib/reports";

/** Builders for the two Excel downloads. Each returns the finished .xlsx file as bytes. */

const MONEY = '"₹"#,##0';
const WHEN = "dd mmm yyyy hh:mm";
const DAYONLY = "dd mmm yyyy";

const head = (title: string): Cell => ({
  value: title,
  fontWeight: "bold",
  backgroundColor: "#1B4436",
  textColor: "#F3ECDF",
});
const text = (v: string | null | undefined): Cell => (v ? v : null);
const num = (v: number | null | undefined): Cell => (typeof v === "number" ? v : null);
const money = (v: number | null | undefined): Cell => (typeof v === "number" ? { value: v, format: MONEY } : null);
const when = (iso: string | null, format = WHEN): Cell => (iso ? { value: toIst(iso), format } : null);
const yesNo = (v: boolean): Cell => (v ? "Yes" : "No");

function sheet(name: string, columns: { title: string; width: number }[], rows: Cell[][]): Sheet<Buffer> {
  const data: SheetData = [columns.map((c) => head(c.title)), ...rows];
  return {
    sheet: name,
    data,
    columns: columns.map((c) => ({ width: c.width })),
    stickyRowsCount: 1,
  } as Sheet<Buffer>;
}

const build = (sheets: Sheet<Buffer>[]) => writeXlsxFile(sheets).toBuffer();

const statusText = (s: string) => s.replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase());

/** Customers, their orders and every item they ordered. */
export function customersWorkbook(report: CustomerReport) {
  const { customers, orders, items } = report;
  const customerBy = new Map(customers.map((c) => [c.id, c]));
  const orderBy = new Map(orders.map((o) => [o.id, o]));
  const itemsOf = new Map<string, typeof items>();
  for (const i of items) itemsOf.set(i.order_id, [...(itemsOf.get(i.order_id) ?? []), i]);

  const customerSheet = sheet(
    "Customers",
    [
      { title: "Name", width: 24 },
      { title: "Phone", width: 16 },
      { title: "Email", width: 30 },
      { title: "City", width: 16 },
      { title: "State", width: 18 },
      { title: "Pincode", width: 10 },
      { title: "Orders", width: 9 },
      { title: "Total spent", width: 13 },
      { title: "Average order", width: 14 },
      { title: "First order", width: 18 },
      { title: "Last order", width: 18 },
      { title: "Last order status", width: 16 },
      { title: "Cancelled or returned orders", width: 16 },
      { title: "Tags", width: 22 },
      { title: "Notes", width: 40 },
    ],
    [...customers]
      .sort((a, b) => b.spent - a.spent)
      .map((c) => [
        text(c.name),
        text(c.phone),
        text(c.emails.join(", ")),
        text(c.city),
        text(c.state),
        text(c.pincode),
        num(c.orders),
        money(c.spent),
        money(c.average),
        when(c.firstOrderAt),
        when(c.lastOrderAt),
        text(c.lastStatus ? statusText(c.lastStatus) : ""),
        num(c.allOrders - c.orders),
        text(c.tags.join(", ")),
        text(c.notes),
      ]),
  );

  const orderSheet = sheet(
    "Orders",
    [
      { title: "Order #", width: 9 },
      { title: "Date", width: 18 },
      { title: "Customer", width: 24 },
      { title: "Phone", width: 16 },
      { title: "Email", width: 30 },
      { title: "Status", width: 16 },
      { title: "Payment", width: 12 },
      { title: "Paid by", width: 12 },
      { title: "What they ordered", width: 50 },
      { title: "Items total", width: 13 },
      { title: "Delivery", width: 11 },
      { title: "Order total", width: 13 },
      { title: "City", width: 16 },
      { title: "State", width: 18 },
      { title: "Pincode", width: 10 },
      { title: "Courier", width: 18 },
      { title: "Tracking number", width: 20 },
      { title: "Customer note", width: 30 },
      { title: "Counted in totals", width: 12 },
    ],
    orders.map((o) => [
      num(o.number),
      when(o.created_at),
      text(o.ship_name),
      text(o.ship_phone),
      text(o.customer_email),
      text(statusText(o.status)),
      text(statusText(o.payment_status)),
      text(o.payment_method === "cod" ? "Cash on delivery" : "Prepaid"),
      text((itemsOf.get(o.id) ?? []).map((i) => `${i.product_name} × ${i.qty}${[i.colour, i.size].filter(Boolean).length ? ` (${[i.colour, i.size].filter(Boolean).join(", ")})` : ""}`).join("; ")),
      money(o.subtotal),
      money(o.delivery_fee),
      money(o.total),
      text(o.ship_city),
      text(o.ship_state),
      text(o.ship_pincode),
      text(o.courier_name),
      text(o.awb_code),
      text(o.customer_note),
      yesNo(isCounted(o.status)),
    ]),
  );

  const itemSheet = sheet(
    "Items",
    [
      { title: "Order #", width: 9 },
      { title: "Date", width: 18 },
      { title: "Customer", width: 24 },
      { title: "Phone", width: 16 },
      { title: "Product", width: 28 },
      { title: "Colour", width: 14 },
      { title: "Size", width: 8 },
      { title: "Qty", width: 6 },
      { title: "Price each", width: 12 },
      { title: "Line total", width: 12 },
      { title: "Gift wrap", width: 10 },
      { title: "Card message", width: 40 },
      { title: "Customer photo", width: 14 },
      { title: "Order status", width: 16 },
      { title: "Counted in totals", width: 12 },
    ],
    items.flatMap((i) => {
      const o = orderBy.get(i.order_id);
      if (!o) return [];
      const c = customerBy.get(o.customer_id);
      return [
        [
          num(o.number),
          when(o.created_at),
          text(o.ship_name || c?.name),
          text(o.ship_phone),
          text(i.product_name),
          text(i.colour),
          text(i.size),
          num(i.qty),
          money(i.unit_price),
          money(i.qty * i.unit_price),
          yesNo(i.gift_wrap),
          text(i.card_message),
          i.photo_path ? "Yes" : null,
          text(statusText(o.status)),
          yesNo(isCounted(o.status)),
        ] as Cell[],
      ];
    }).sort((a, b) => Number((b[0] as number) ?? 0) - Number((a[0] as number) ?? 0)),
  );

  return build([customerSheet, orderSheet, itemSheet]);
}

/** Products with stock and sales, stock by colour and size, and sales by month. */
export function productsWorkbook(report: ProductReport) {
  const productSheet = sheet(
    "Products",
    [
      { title: "Product", width: 30 },
      { title: "Category", width: 14 },
      { title: "On sale", width: 9 },
      { title: "Price", width: 10 },
      { title: "In stock", width: 12 },
      { title: "Stock note", width: 18 },
      { title: "Sold, last 7 days", width: 12 },
      { title: "Sold, last 30 days", width: 12 },
      { title: "Sold, all time", width: 12 },
      { title: "Item sales, all time", width: 15 },
      { title: "Last sold", width: 18 },
      { title: "Days of stock left", width: 12 },
    ],
    report.products.map((p) => [
      text(p.name),
      text(categoryLabels[p.category as Category] ?? p.category),
      yesNo(p.active),
      money(p.price),
      p.followsContents ? null : p.tracked ? num(p.stock) : null,
      text(
        p.followsContents
          ? "Follows contents"
          : !p.tracked
            ? "Not tracked"
            : p.soldOut
              ? "Some sold out"
              : p.lowStock
                ? "Low"
                : "OK",
      ),
      num(p.sold7),
      num(p.sold30),
      num(p.soldAll),
      money(p.revenueAll),
      when(p.lastSoldAt, DAYONLY),
      num(p.daysLeft),
    ]),
  );

  const variantSheet = sheet(
    "Stock by colour and size",
    [
      { title: "Product", width: 30 },
      { title: "Colour", width: 16 },
      { title: "Size", width: 8 },
      { title: "In stock", width: 10 },
      { title: "Status", width: 13 },
      { title: "Sold, last 30 days", width: 12 },
      { title: "Sold, all time", width: 12 },
    ],
    report.variants.map((v) => [text(v.product), text(v.colour), text(v.size), num(v.inStock), text(v.status), num(v.sold30), num(v.soldAll)]),
  );

  const monthSheet = sheet(
    "Sales by month",
    [
      { title: "Month", width: 12 },
      { title: "Orders", width: 9 },
      { title: "Units", width: 9 },
      { title: "Item sales", width: 13 },
      { title: "Delivery charged", width: 15 },
      { title: "Order total", width: 13 },
    ],
    report.months.map((m) => [text(m.month), num(m.orders), num(m.units), money(m.itemSales), money(m.delivery), money(m.total)]),
  );

  return build([productSheet, variantSheet, monthSheet]);
}

