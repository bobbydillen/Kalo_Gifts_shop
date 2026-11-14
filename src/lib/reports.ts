import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Numbers for the admin Customers and Products reports, and for their Excel downloads.
 * Everything is worked out here from the orders, so the pages and the files always agree.
 *
 * Cancelled and returned orders are kept in the lists but left out of totals ("counted" below):
 * they do not add to what a customer spent or to units sold.
 */

export const OUT_STATUSES = ["cancelled", "returned"];
export const isCounted = (status: string) => !OUT_STATUSES.includes(status);
export const LOW_STOCK = 3;

const DAY = 24 * 60 * 60 * 1000;
const IST = 5.5 * 60 * 60 * 1000;

/** Excel shows a date exactly as stored, so shift to Indian time before writing it. */
export const toIst = (iso: string) => new Date(new Date(iso).getTime() + IST);
export const monthKey = (iso: string) => toIst(iso).toISOString().slice(0, 7);

// ---------------------------------------------------------------- loading

type Page = (from: number, to: number) => PromiseLike<{ data: unknown[] | null; error: { message: string } | null }>;

/** The database returns at most 1000 rows a request, so read everything page by page. */
async function fetchAll<T>(page: Page): Promise<T[]> {
  const out: T[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await page(from, from + 999);
    if (error) throw new Error(error.message);
    out.push(...((data ?? []) as T[]));
    if (!data || data.length < 1000) break;
  }
  return out;
}

export type OrderRow = {
  id: string;
  number: number;
  status: string;
  payment_status: string;
  payment_method: string;
  subtotal: number;
  delivery_fee: number;
  total: number;
  created_at: string;
  customer_id: string;
  customer_email: string | null;
  customer_note: string;
  ship_name: string;
  ship_phone: string;
  ship_city: string;
  ship_state: string;
  ship_pincode: string;
  courier_name: string | null;
  awb_code: string | null;
};

export type ItemRow = {
  order_id: string;
  product_slug: string;
  product_name: string;
  colour: string;
  size: string;
  qty: number;
  unit_price: number;
  gift_wrap: boolean;
  card_message: string;
  photo_path: string | null;
  parts: { slug: string; name: string; colour: string; size: string; qty: number; unit: number; photo: string | null }[] | null;
};

type CustomerRow = { id: string; phone: string; name: string; created_at: string };
type NoteRow = { customer_id: string; notes: string; tags: string[] };

const ORDER_COLUMNS =
  "id, number, status, payment_status, payment_method, subtotal, delivery_fee, total, created_at, customer_id, customer_email, customer_note, ship_name, ship_phone, ship_city, ship_state, ship_pincode, courier_name, awb_code";
const ITEM_COLUMNS = "order_id, product_slug, product_name, colour, size, qty, unit_price, gift_wrap, card_message, photo_path, parts";

export const loadOrders = (db: SupabaseClient) =>
  fetchAll<OrderRow>((a, b) =>
    db.from("orders").select(ORDER_COLUMNS).order("created_at", { ascending: false }).order("id").range(a, b),
  );

export const loadItems = (db: SupabaseClient) =>
  fetchAll<ItemRow>((a, b) => db.from("order_items").select(ITEM_COLUMNS).order("order_id").order("id").range(a, b));

// ---------------------------------------------------------------- customers

export type CustomerSummary = {
  id: string;
  name: string;
  phone: string;
  emails: string[];
  city: string;
  state: string;
  pincode: string;
  orders: number; // counted orders
  allOrders: number; // including cancelled and returned
  spent: number; // counted orders only, delivery included
  average: number;
  firstOrderAt: string | null;
  lastOrderAt: string | null;
  lastStatus: string | null;
  joinedAt: string;
  tags: string[];
  notes: string;
};

export type CustomerReport = {
  customers: CustomerSummary[];
  orders: OrderRow[];
  items: ItemRow[];
};

export async function loadCustomerReport(db: SupabaseClient): Promise<CustomerReport> {
  const [customers, orders, items, notes] = await Promise.all([
    fetchAll<CustomerRow>((a, b) => db.from("customers").select("id, phone, name, created_at").order("created_at").order("id").range(a, b)),
    loadOrders(db),
    loadItems(db),
    fetchAll<NoteRow>((a, b) => db.from("customer_notes").select("customer_id, notes, tags").order("customer_id").range(a, b)),
  ]);

  const noteBy = new Map(notes.map((n) => [n.customer_id, n]));
  const ordersBy = new Map<string, OrderRow[]>();
  for (const o of orders) ordersBy.set(o.customer_id, [...(ordersBy.get(o.customer_id) ?? []), o]); // newest first

  const summaries = customers.map<CustomerSummary>((c) => {
    const mine = ordersBy.get(c.id) ?? [];
    const counted = mine.filter((o) => isCounted(o.status));
    const spent = counted.reduce((sum, o) => sum + o.total, 0);
    const latest = mine[0];
    const emails = [...new Set(mine.map((o) => (o.customer_email ?? "").toLowerCase()).filter(Boolean))];
    const note = noteBy.get(c.id);
    return {
      id: c.id,
      name: latest?.ship_name || c.name,
      phone: c.phone,
      emails,
      city: latest?.ship_city ?? "",
      state: latest?.ship_state ?? "",
      pincode: latest?.ship_pincode ?? "",
      orders: counted.length,
      allOrders: mine.length,
      spent,
      average: counted.length ? Math.round(spent / counted.length) : 0,
      firstOrderAt: mine.length ? mine[mine.length - 1].created_at : null,
      lastOrderAt: latest?.created_at ?? null,
      lastStatus: latest?.status ?? null,
      joinedAt: c.created_at,
      tags: note?.tags ?? [],
      notes: note?.notes ?? "",
    };
  });

  return { customers: summaries, orders, items };
}

export type CustomerFilter = "all" | "repeat" | "new" | "dormant";
export const CUSTOMER_FILTERS: { id: CustomerFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "repeat", label: "Repeat customers" },
  { id: "new", label: "New, last 30 days" },
  { id: "dormant", label: "Not ordered in 60 days" },
];

export function matchesFilter(c: CustomerSummary, filter: CustomerFilter, now = Date.now()) {
  switch (filter) {
    case "repeat":
      return c.orders >= 2;
    case "new":
      return now - new Date(c.joinedAt).getTime() <= 30 * DAY;
    case "dormant":
      return c.lastOrderAt !== null && now - new Date(c.lastOrderAt).getTime() > 60 * DAY;
    default:
      return true;
  }
}

export type CustomerSort = "last" | "spent" | "orders" | "name";

/** The customers to show for a search, filter and sort, plus the headline numbers for the whole list. */
export function selectCustomers(all: CustomerSummary[], opts: { q: string; filter: CustomerFilter; sort: CustomerSort }) {
  const now = Date.now();
  const shown = all
    .filter((c) => matchesFilter(c, opts.filter, now) && matchesSearch(c, opts.q))
    .sort((a, b) => {
      if (opts.sort === "spent") return b.spent - a.spent;
      if (opts.sort === "orders") return b.orders - a.orders;
      if (opts.sort === "name") return a.name.localeCompare(b.name);
      return (b.lastOrderAt ?? "").localeCompare(a.lastOrderAt ?? "");
    });
  return {
    shown,
    totals: {
      customers: all.length,
      repeat: all.filter((c) => c.orders >= 2).length,
      newLast30: all.filter((c) => matchesFilter(c, "new", now)).length,
      sales: all.reduce((n, c) => n + c.spent, 0),
    },
  };
}

export function matchesSearch(c: CustomerSummary, q: string) {
  const needle = q.trim().toLowerCase();
  if (!needle) return true;
  const hay = [c.name, c.phone, ...c.emails, c.city, c.state, c.pincode, ...c.tags].join(" ").toLowerCase();
  const digits = needle.replace(/\D/g, "");
  return hay.includes(needle) || (digits.length >= 4 && c.phone.replace(/\D/g, "").includes(digits));
}

// ---------------------------------------------------------------- products

type ProductRow = {
  id: string;
  slug: string;
  name: string;
  category: string;
  price: number;
  active: boolean;
  sizes: string[];
  product_colours: { name: string; position: number }[];
  stock: { colour: string; size: string; qty: number }[];
};

export type ProductSummary = {
  slug: string;
  name: string;
  category: string;
  active: boolean;
  price: number;
  tracked: boolean; // has stock numbers
  followsContents: boolean; // a hamper
  stock: number; // total over tracked variants
  soldAll: number;
  sold7: number;
  sold30: number;
  revenueAll: number; // item sales, without delivery
  lastSoldAt: string | null;
  lowStock: boolean;
  soldOut: boolean;
  daysLeft: number | null; // at the last 30 days' pace
};

export type VariantRow = {
  product: string;
  slug: string;
  colour: string;
  size: string;
  inStock: number | null; // null: not tracked, always available
  soldAll: number;
  sold30: number;
  status: "Sold out" | "Low" | "OK" | "Not tracked";
};

export type MonthRow = { month: string; orders: number; units: number; itemSales: number; delivery: number; total: number };

export type ProductReport = {
  products: ProductSummary[];
  variants: VariantRow[];
  months: MonthRow[];
  totals: { units: number; itemSales: number; orders: number };
};

export async function loadProductReport(db: SupabaseClient, now = Date.now()): Promise<ProductReport> {
  const [products, orders, items] = await Promise.all([
    fetchAll<ProductRow>((a, b) =>
      db
        .from("products")
        .select("id, slug, name, category, price, active, sizes, product_colours(name, position), stock(colour, size, qty)")
        .order("name")
        .order("id")
        .range(a, b),
    ),
    loadOrders(db),
    loadItems(db),
  ]);

  const orderBy = new Map(orders.map((o) => [o.id, o]));

  type Sale = { qty: number; at: string; revenue: number; colour: string; size: string; slug: string };
  const sales: Sale[] = [];
  for (const i of items) {
    const o = orderBy.get(i.order_id);
    if (!o || !isCounted(o.status)) continue;
    if (i.parts?.length) {
      // a build-your-own hamper: each product inside it counts as sold, at its own price (before the bundle discount)
      for (const part of i.parts) sales.push({ qty: part.qty, at: o.created_at, revenue: part.qty * part.unit, colour: part.colour, size: part.size, slug: part.slug });
      continue;
    }
    sales.push({ qty: i.qty, at: o.created_at, revenue: i.qty * i.unit_price, colour: i.colour, size: i.size, slug: i.product_slug });
  }

  const within = (s: Sale, days: number) => now - new Date(s.at).getTime() <= days * DAY;

  const summaries = products.map<ProductSummary>((p) => {
    const mine = sales.filter((s) => s.slug === p.slug);
    const tracked = p.stock.length > 0;
    const stock = p.stock.reduce((n, s) => n + s.qty, 0);
    const sold30 = mine.filter((s) => within(s, 30)).reduce((n, s) => n + s.qty, 0);
    const followsContents = p.category === "hamper";
    const lastSoldAt = mine.reduce<string | null>((latest, s) => (!latest || s.at > latest ? s.at : latest), null);
    return {
      slug: p.slug,
      name: p.name,
      category: p.category,
      active: p.active,
      price: p.price,
      tracked,
      followsContents,
      stock,
      soldAll: mine.reduce((n, s) => n + s.qty, 0),
      sold7: mine.filter((s) => within(s, 7)).reduce((n, s) => n + s.qty, 0),
      sold30,
      revenueAll: mine.reduce((n, s) => n + s.revenue, 0),
      lastSoldAt,
      lowStock: tracked && p.stock.some((s) => s.qty > 0 && s.qty <= LOW_STOCK),
      soldOut: tracked && p.stock.some((s) => s.qty === 0),
      daysLeft: tracked && sold30 > 0 ? Math.floor(stock / (sold30 / 30)) : null,
    };
  });

  // one row per tracked variant, plus any variant that was sold but is not tracked
  const variants: VariantRow[] = [];
  for (const p of products) {
    const seen = new Set<string>();
    const sold = (colour: string, size: string) => sales.filter((s) => s.slug === p.slug && s.colour === colour && s.size === size);
    for (const s of p.stock) {
      seen.add(`${s.colour}/${s.size}`);
      const mine = sold(s.colour, s.size);
      variants.push({
        product: p.name,
        slug: p.slug,
        colour: s.colour,
        size: s.size,
        inStock: s.qty,
        soldAll: mine.reduce((n, x) => n + x.qty, 0),
        sold30: mine.filter((x) => within(x, 30)).reduce((n, x) => n + x.qty, 0),
        status: s.qty === 0 ? "Sold out" : s.qty <= LOW_STOCK ? "Low" : "OK",
      });
    }
    for (const s of sales.filter((x) => x.slug === p.slug)) {
      const key = `${s.colour}/${s.size}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const mine = sold(s.colour, s.size);
      variants.push({
        product: p.name,
        slug: p.slug,
        colour: s.colour,
        size: s.size,
        inStock: null,
        soldAll: mine.reduce((n, x) => n + x.qty, 0),
        sold30: mine.filter((x) => within(x, 30)).reduce((n, x) => n + x.qty, 0),
        status: "Not tracked",
      });
    }
  }

  // sales by month (Indian time), newest first
  const byMonth = new Map<string, MonthRow>();
  for (const o of orders.filter((o) => isCounted(o.status))) {
    const key = monthKey(o.created_at);
    const row = byMonth.get(key) ?? { month: key, orders: 0, units: 0, itemSales: 0, delivery: 0, total: 0 };
    row.orders += 1;
    row.delivery += o.delivery_fee;
    row.total += o.total;
    byMonth.set(key, row);
  }
  for (const i of items) {
    const o = orderBy.get(i.order_id);
    if (!o || !isCounted(o.status)) continue;
    const row = byMonth.get(monthKey(o.created_at));
    if (!row) continue;
    row.units += i.qty;
    row.itemSales += i.qty * i.unit_price;
  }

  return {
    products: summaries,
    variants,
    months: [...byMonth.values()].sort((a, b) => b.month.localeCompare(a.month)),
    totals: {
      units: sales.reduce((n, s) => n + s.qty, 0),
      itemSales: sales.reduce((n, s) => n + s.revenue, 0),
      orders: orders.filter((o) => isCounted(o.status)).length,
    },
  };
}
