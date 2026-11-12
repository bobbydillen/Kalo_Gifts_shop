"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { useSettings } from "@/components/settings/SettingsProvider";
import { formatPrice } from "@/lib/catalog";
import { isEmail } from "@/lib/checkout";
import { supabaseBrowser } from "@/lib/supabase/client";
import { useCustomer } from "@/lib/use-customer";

const field =
  "mt-2 block w-full rounded-xl border border-hair-2 bg-pine px-4 py-3 text-cream placeholder:text-faint focus:border-gold focus:outline-none";

const customerStatus: Record<string, string> = {
  new: "Order received",
  confirmed: "Confirmed",
  packing: "Being packed",
  shipped: "On the way",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

const dateFormat = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" });

/** The account page: sign in with an emailed code, then see your orders and delivery addresses. */
export function AccountView() {
  const settings = useSettings();
  const customer = useCustomer();

  if (!settings.customerLogin) {
    return (
      <Panel
        title={
          <>
            Accounts open <em>soon</em>
          </>
        }
        text="Soon you will be able to sign in with your email to see your orders. You never need an account to order."
      />
    );
  }
  if (!customer.ready) return <p className="py-16 text-center text-faint">One moment…</p>;
  const who = customer.email ?? customer.phone;
  return who ? <Orders who={who} /> : <SignIn />;
}

function Panel({ title, text }: { title: ReactNode; text: string }) {
  return (
    <div className="mx-auto max-w-xl py-12 text-center">
      <h1 className="text-[clamp(2.5rem,6vw,4.5rem)]">{title}</h1>
      <p className="mt-6 text-lg text-mist">{text}</p>
      <Link href="/gifts" className="btn btn-gold mt-10">
        Browse gifts
      </Link>
    </div>
  );
}

// ---------------------------------------------------------------- signing in

function SignIn() {
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [wait, setWait] = useState(0); // seconds until another code may be requested

  useEffect(() => {
    if (wait <= 0) return;
    const id = window.setTimeout(() => setWait((w) => w - 1), 1000);
    return () => window.clearTimeout(id);
  }, [wait]);

  const address = email.trim().toLowerCase();

  async function send(e?: FormEvent) {
    e?.preventDefault();
    if (!isEmail(address)) {
      setMessage("Enter a valid email address.");
      return;
    }
    setBusy(true);
    setMessage(null);
    const { error } = await supabaseBrowser().auth.signInWithOtp({
      email: address,
      options: { shouldCreateUser: true },
    });
    setBusy(false);
    if (error) {
      setMessage(
        error.status === 429
          ? "Too many tries. Please wait a minute and try again."
          : "We could not send the code. Check the address and try again.",
      );
      return;
    }
    setStep("code");
    setCode("");
    setWait(60);
  }

  async function verify(e: FormEvent) {
    e.preventDefault();
    if (!/^\d{6,10}$/.test(code.trim())) {
      setMessage("Enter the code from the email.");
      return;
    }
    setBusy(true);
    setMessage(null);
    const { error } = await supabaseBrowser().auth.verifyOtp({ email: address, token: code.trim(), type: "email" });
    setBusy(false);
    if (error) setMessage("That code is wrong or has expired. Check it, or ask for a new one.");
    // on success the sign-in is picked up automatically and the orders appear
  }

  return (
    <div className="mx-auto max-w-md py-10">
      <p className="kicker">Welcome back</p>
      <h1 className="mt-4 text-[clamp(2.5rem,6vw,4.5rem)]">
        Your <em>account</em>
      </h1>
      <p className="mt-5 text-mist">
        See your orders. We email you a code, so there is no password to remember. You will see the orders you
        placed with this email address.
      </p>

      {step === "email" ? (
        <form onSubmit={send} className="mt-8 space-y-5">
          <label className="block text-sm text-mist">
            Email address
            <input
              required
              type="email"
              autoComplete="email"
              maxLength={200}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={field}
            />
          </label>
          <Feedback message={message} />
          <button type="submit" disabled={busy} className="btn btn-gold w-full disabled:opacity-60">
            {busy ? "Sending…" : "Email me a code"}
          </button>
        </form>
      ) : (
        <form onSubmit={verify} className="mt-8 space-y-5">
          <label className="block text-sm text-mist">
            Code sent to {address}
            <input
              required
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={10}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              className={`${field} text-center font-serif text-3xl tracking-[0.3em]`}
            />
            <span className="mt-1 block text-xs text-faint">Check your spam folder if it does not arrive within a minute.</span>
          </label>
          <Feedback message={message} />
          <button type="submit" disabled={busy} className="btn btn-gold w-full disabled:opacity-60">
            {busy ? "Checking…" : "Sign in"}
          </button>
          <p className="flex justify-between text-sm text-faint">
            <button type="button" onClick={() => { setStep("email"); setMessage(null); }} className="underline underline-offset-4 hover:text-cream">
              Change email
            </button>
            <button
              type="button"
              disabled={wait > 0 || busy}
              onClick={() => send()}
              className="underline underline-offset-4 hover:text-cream disabled:no-underline disabled:opacity-50"
            >
              {wait > 0 ? `Send again in ${wait}s` : "Send again"}
            </button>
          </p>
        </form>
      )}
    </div>
  );
}

function Feedback({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p role="alert" className="rounded-xl border border-berry-light/50 bg-berry/20 px-4 py-3 text-sm">
      {message}
    </p>
  );
}

// ---------------------------------------------------------------- signed in

type OrderRow = {
  id: string;
  number: number;
  status: string;
  total: number;
  created_at: string;
  tracking_note: string;
  subtotal: number;
  delivery_fee: number;
  customer_note: string;
  ship_phone: string;
  ship_name: string;
  ship_line1: string;
  ship_line2: string;
  ship_city: string;
  ship_state: string;
  ship_pincode: string;
  order_items: {
    product_name: string;
    colour: string;
    size: string;
    qty: number;
    unit_price: number;
    gift_wrap: boolean;
    card_message: string;
  }[];
  order_events: { status: string; note: string; created_at: string }[];
};

function Orders({ who }: { who: string }) {
  const [orders, setOrders] = useState<OrderRow[] | "error" | null>(null);

  useEffect(() => {
    let live = true;
    (async () => {
      const { data, error } = await supabaseBrowser()
        .from("orders")
        .select(
          "id, number, status, total, created_at, tracking_note, subtotal, delivery_fee, customer_note, ship_phone, ship_name, ship_line1, ship_line2, ship_city, ship_state, ship_pincode, order_items(product_name, colour, size, qty, unit_price, gift_wrap, card_message), order_events(status, note, created_at)",
        )
        .order("created_at", { ascending: false });
      if (live) setOrders(error ? "error" : (data as OrderRow[]));
    })();
    return () => {
      live = false;
    };
  }, []);

  // delivery addresses are the ones on the customer's own orders, newest first, without repeats
  const addresses = Array.isArray(orders)
    ? orders.filter((o, i, all) => all.findIndex((x) => x.ship_line1 === o.ship_line1 && x.ship_pincode === o.ship_pincode) === i)
    : [];

  return (
    <div className="mx-auto max-w-3xl py-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="kicker">Signed in as {who}</p>
          <h1 className="mt-4 text-[clamp(2.5rem,6vw,4.5rem)]">
            Your <em>orders</em>
          </h1>
        </div>
        <button
          type="button"
          onClick={() => supabaseBrowser().auth.signOut()}
          className="text-sm text-mist underline underline-offset-4 hover:text-cream"
        >
          Sign out
        </button>
      </div>

      {orders === null && <p className="mt-10 text-faint">Loading your orders…</p>}
      {orders === "error" && (
        <p className="mt-10 rounded-2xl border border-berry-light/50 bg-berry/20 p-5">
          We could not load your orders. Try refreshing the page.
        </p>
      )}
      {Array.isArray(orders) && (
        <>
          {orders.length === 0 ? (
            <p className="mt-10 rounded-2xl border border-dashed border-hair-2 p-10 text-center text-mist">
              No orders found for this email yet. Orders appear here when you give this email address at checkout.
            </p>
          ) : (
            <ul className="mt-10 space-y-4">
              {orders.map((order) => (
                <li key={order.id} className="rounded-2xl border border-hair bg-pine p-6">
                  <div className="flex flex-wrap items-baseline justify-between gap-3">
                    <p className="font-serif text-2xl">Order #{order.number}</p>
                    <span className="rounded-full border border-gold/50 px-3 py-1 text-xs uppercase tracking-[0.14em] text-gold-light">
                      {customerStatus[order.status] ?? order.status}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-faint">{dateFormat.format(new Date(order.created_at))}</p>
                  <ul className="mt-4 space-y-3 text-mist">
                    {order.order_items.map((item, i) => (
                      <li key={i} className="flex justify-between gap-4">
                        <span>
                          {item.product_name} × {item.qty}
                          <span className="text-faint"> {[item.colour, item.size].filter(Boolean).join(" · ")}</span>
                          {item.gift_wrap && <span className="block text-sm text-faint">Gift wrapped</span>}
                          {item.card_message && <span className="block text-sm text-faint">Card: “{item.card_message}”</span>}
                        </span>
                        <span className="shrink-0">{formatPrice(item.unit_price * item.qty)}</span>
                      </li>
                    ))}
                  </ul>
                  <dl className="mt-4 space-y-1 border-t border-hair pt-4 text-sm text-mist">
                    <div className="flex justify-between"><dt>Items</dt><dd>{formatPrice(order.subtotal)}</dd></div>
                    {order.delivery_fee > 0 && (
                      <div className="flex justify-between"><dt>Delivery</dt><dd>{formatPrice(order.delivery_fee)}</dd></div>
                    )}
                  </dl>
                  <p className="mt-4 text-sm text-mist">
                    <span className="text-faint">Delivering to </span>
                    {order.ship_name}, {order.ship_line1}
                    {order.ship_line2 ? `, ${order.ship_line2}` : ""}, {order.ship_city}, {order.ship_state} {order.ship_pincode}
                    <span className="text-faint"> · {order.ship_phone}</span>
                  </p>
                  {order.customer_note && <p className="mt-2 text-sm text-faint">Your note: {order.customer_note}</p>}
                  {order.order_events.length > 0 && (
                    <ol className="mt-4 space-y-1 border-l border-hair-2 pl-4 text-sm text-faint">
                      {[...order.order_events]
                        .sort((a, b) => a.created_at.localeCompare(b.created_at))
                        .map((ev, i) => (
                          <li key={i}>
                            <span className="text-mist">{customerStatus[ev.status] ?? ev.status}</span>
                            {" · "}
                            {dateFormat.format(new Date(ev.created_at))}
                          </li>
                        ))}
                    </ol>
                  )}
                  {order.tracking_note && (
                    <p className="mt-4 rounded-xl border border-hair-2 px-4 py-3 text-sm text-mist">{order.tracking_note}</p>
                  )}
                  <p className="mt-4 text-right font-serif text-2xl text-gold-light">{formatPrice(order.total)}</p>
                </li>
              ))}
            </ul>
          )}

          {addresses.length > 0 && (
            <section className="mt-14" aria-labelledby="addresses-title">
              <h2 id="addresses-title" className="text-3xl">
                Delivery <em>addresses</em>
              </h2>
              <ul className="mt-5 grid gap-4 sm:grid-cols-2">
                {addresses.map((a) => (
                  <li key={a.id} className="rounded-2xl border border-hair bg-pine p-5 text-mist">
                    <p className="text-cream">{a.ship_name}</p>
                    <p>{a.ship_line1}</p>
                    {a.ship_line2 && <p>{a.ship_line2}</p>}
                    <p>
                      {a.ship_city}, {a.ship_state} {a.ship_pincode}
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </div>
  );
}
