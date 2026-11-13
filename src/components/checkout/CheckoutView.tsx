"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition, type FormEvent } from "react";
import { placeOrder } from "@/app/(site)/checkout/actions";
import { useBag } from "@/components/bag/BagProvider";
import { useCatalog } from "@/components/catalog/CatalogProvider";
import { ProductArt } from "@/components/product/ProductArt";
import { useSettings } from "@/components/settings/SettingsProvider";
import { formatPrice } from "@/lib/catalog";
import { INDIAN_STATES, validateDetails } from "@/lib/checkout";
import { shippingFee } from "@/lib/shipping";
import { supabaseBrowser } from "@/lib/supabase/client";
import { useCustomer } from "@/lib/use-customer";

const field =
  "mt-2 block w-full rounded-xl border border-hair-2 bg-pine px-4 py-3 text-cream placeholder:text-faint focus:border-gold focus:outline-none";

/** The checkout: contact and address on one side, the order summary on the other. */
export function CheckoutView() {
  const router = useRouter();
  const { lines, subtotal, clear } = useBag();
  const settings = useSettings();
  const catalog = useCatalog();
  const [pending, start] = useTransition();
  const [placed, setPlaced] = useState(false); // keeps the empty-bag message away once the order is in
  const [error, setError] = useState<string | null>(null);

  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [line1, setLine1] = useState("");
  const [line2, setLine2] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [pincode, setPincode] = useState("");
  const [note, setNote] = useState("");

  // A signed-in customer: use their verified email or phone, and the details from their latest order.
  const customer = useCustomer();
  const [prefilled, setPrefilled] = useState(false);
  useEffect(() => {
    if ((!customer.phone && !customer.email) || prefilled) return;
    let live = true;
    (async () => {
      const { data } = await supabaseBrowser()
        .from("orders")
        .select("ship_name, ship_phone, ship_line1, ship_line2, ship_city, ship_state, ship_pincode")
        .order("created_at", { ascending: false })
        .limit(1);
      if (!live) return;
      const last = data?.[0];
      if (customer.email) setEmail(customer.email);
      if (last) {
        setPhone((customer.phone ?? last.ship_phone).replace(/^\+91/, ""));
        setName(last.ship_name);
        setLine1(last.ship_line1);
        setLine2(last.ship_line2);
        setCity(last.ship_city);
        setState(last.ship_state);
        setPincode(last.ship_pincode);
      } else if (customer.phone) {
        setPhone(customer.phone.replace(/^\+91/, ""));
      }
      setPrefilled(true);
    })();
    return () => {
      live = false;
    };
  }, [customer.phone, customer.email, prefilled]);

  // delivery depends on the state, the parcel weight and the order value; the database works it out again
  const weightG = lines.reduce((sum, l) => sum + (catalog.productBySlug(l.slug)?.weightG ?? 300) * l.qty, 0);
  const delivery = state ? shippingFee(settings.shippingRates, settings.freeShippingOver, state, weightG, subtotal) : null;
  const total = subtotal + (delivery ?? 0);
  const unavailable = lines.some((l) => l.left <= 0);

  if (!settings.checkoutOpen && !placed) {
    return (
      <Notice
        title={
          <>
            Checkout opens <em>soon</em>
          </>
        }
        text="We are not taking orders just yet. Your bag is saved, so you can come back and finish."
      />
    );
  }
  if (!lines.length && !placed) {
    return (
      <Notice
        title={
          <>
            Your bag is <em>empty</em>
          </>
        }
        text="Add something you love, then come back to check out."
      />
    );
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const details = validateDetails({ phone, email, name, line1, line2, city, state, pincode, note });
    if (!details.ok) {
      setError(details.error);
      return;
    }
    if (unavailable) {
      setError("An item in your bag has sold out. Remove it to continue.");
      return;
    }

    start(async () => {
      const result = await placeOrder({
        ...details.value,
        expectedTotal: total,
        items: lines.map((l) => ({
          slug: l.slug,
          colour: l.colour,
          size: l.size,
          qty: l.qty,
          wrap: l.wrap,
          note: l.note,
        })),
      });
      if (!result.ok) {
        setError(result.error);
        if (result.refresh) router.refresh();
        return;
      }
      setPlaced(true);
      clear();
      router.push(`/order-placed?n=${result.number}`);
    });
  }

  return (
    <form onSubmit={submit} className="grid gap-10 lg:grid-cols-[1.15fr_1fr] lg:gap-14">
      <div className="space-y-8">
        <fieldset>
          <legend className="font-serif text-3xl">
            Your <em>details</em>
          </legend>
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <label className="block text-sm text-mist sm:col-span-2">
              Mobile number
              <div className="mt-2 flex items-center gap-2">
                <span className="rounded-xl border border-hair-2 bg-pine px-4 py-3 text-mist">+91</span>
                <input
                  required
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel-national"
                  maxLength={14}
                  value={phone}
                  readOnly={Boolean(customer.phone)}
                  onChange={(e) => setPhone(e.target.value)}
                  className={`${field} !mt-0 ${customer.phone ? "opacity-70" : ""}`}
                />
              </div>
              <span className="mt-1 block text-xs text-faint">
                {customer.phone
                  ? "Verified."
                  : "We will update you on WhatsApp about your order."}
              </span>
            </label>
            <label className="block text-sm text-mist sm:col-span-2">
              Email
              <input
                required
                type="email"
                autoComplete="email"
                maxLength={200}
                value={email}
                readOnly={Boolean(customer.email)}
                onChange={(e) => setEmail(e.target.value)}
                className={`${field} ${customer.email ? "opacity-70" : ""}`}
              />
              <span className="mt-1 block text-xs text-faint">
                {customer.email ? (
                  <>
                    Verified. Not you?{" "}
                    <button type="button" onClick={() => supabaseBrowser().auth.signOut()} className="underline underline-offset-4 hover:text-cream">
                      Sign out
                    </button>
                  </>
                ) : (
                  <>
                    We send your order details here. Use the same email later to sign in and see all your orders.
                    {settings.customerLogin && (
                      <>
                        {" "}
                        Ordered before?{" "}
                        <Link href="/account" className="underline underline-offset-4 hover:text-cream">
                          Sign in to reuse your last address
                        </Link>
                        .
                      </>
                    )}
                  </>
                )}
              </span>
            </label>
            <label className="block text-sm text-mist sm:col-span-2">
              Full name
              <input required autoComplete="name" maxLength={80} value={name} onChange={(e) => setName(e.target.value)} className={field} />
            </label>
          </div>
        </fieldset>

        <fieldset>
          <legend className="font-serif text-3xl">
            Delivery <em>address</em>
          </legend>
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <label className="block text-sm text-mist sm:col-span-2">
              Address
              <input required autoComplete="address-line1" maxLength={200} value={line1} onChange={(e) => setLine1(e.target.value)} placeholder="House or flat number, street" className={field} />
            </label>
            <label className="block text-sm text-mist sm:col-span-2">
              Area or landmark <span className="text-faint">(optional)</span>
              <input autoComplete="address-line2" maxLength={200} value={line2} onChange={(e) => setLine2(e.target.value)} className={field} />
            </label>
            <label className="block text-sm text-mist">
              City or town
              <input required autoComplete="address-level2" maxLength={80} value={city} onChange={(e) => setCity(e.target.value)} className={field} />
            </label>
            <label className="block text-sm text-mist">
              Pincode
              <input
                required
                inputMode="numeric"
                autoComplete="postal-code"
                maxLength={6}
                value={pincode}
                onChange={(e) => setPincode(e.target.value.replace(/\D/g, ""))}
                className={field}
              />
            </label>
            <label className="block text-sm text-mist sm:col-span-2">
              State
              <select required autoComplete="address-level1" value={state} onChange={(e) => setState(e.target.value)} className={field}>
                <option value="">Choose your state</option>
                {INDIAN_STATES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm text-mist sm:col-span-2">
              Note for delivery <span className="text-faint">(optional)</span>
              <textarea rows={2} maxLength={300} value={note} onChange={(e) => setNote(e.target.value)} className={field} />
            </label>
          </div>
        </fieldset>
      </div>

      <aside className="lg:sticky lg:top-28 lg:self-start">
        <div className="rounded-[24px] border border-hair bg-pine p-6">
          <h2 className="font-serif text-3xl">
            Your <em>order</em>
          </h2>
          <ul className="mt-5 divide-y divide-hair">
            {lines.map((line) => (
              <li key={line.id} className="flex gap-4 py-4">
                <span
                  className="grid size-16 shrink-0 place-items-center rounded-xl"
                  style={{ background: `radial-gradient(circle at 50% 42%, color-mix(in srgb, ${line.product.tint} 60%, transparent), var(--color-pine-2) 80%)` }}
                >
                  <ProductArt category={line.product.category} className="w-8 text-gold-light" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-serif text-lg leading-tight">
                    {line.product.name} <span className="font-sans text-sm text-mist">× {line.qty}</span>
                  </span>
                  <span className="block text-sm text-faint">
                    {[line.colour, line.size].filter(Boolean).join(" · ")}
                    {line.wrap ? " · gift wrap" : ""}
                    {line.note ? " · handwritten card" : ""}
                  </span>
                  {line.left <= 0 && <span className="block text-sm text-berry-light">Sold out. Remove it from your bag.</span>}
                </span>
                <span className="tabular-nums text-gold-light">{formatPrice(line.total)}</span>
              </li>
            ))}
          </ul>

          <dl className="mt-4 space-y-2 border-t border-hair pt-4 text-sm">
            <div className="flex justify-between text-mist">
              <dt>Subtotal</dt>
              <dd className="tabular-nums">{formatPrice(subtotal)}</dd>
            </div>
            <div className="flex justify-between text-mist">
              <dt>Delivery</dt>
              <dd className="tabular-nums">
                {delivery === null ? "Choose your state" : delivery === 0 ? "Free" : formatPrice(delivery)}
              </dd>
            </div>
            {delivery !== null && delivery > 0 && subtotal < settings.freeShippingOver && (
              <p className="text-xs text-faint">
                Add {formatPrice(settings.freeShippingOver - subtotal)} more for free delivery.
              </p>
            )}
            <div className="flex justify-between pt-2 font-serif text-3xl">
              <dt>Total</dt>
              <dd className="tabular-nums">{formatPrice(total)}</dd>
            </div>
          </dl>

          {error && (
            <p role="alert" className="mt-5 rounded-xl border border-berry-light/50 bg-berry/20 px-4 py-3 text-sm">
              {error}
            </p>
          )}

          <button type="submit" disabled={pending} className="btn btn-gold mt-6 w-full disabled:opacity-60">
            {pending ? "Placing your order…" : `Place order · ${formatPrice(total)}`}
          </button>
          <p className="mt-3 text-center text-xs text-faint">
            We will message you on WhatsApp to confirm your order and share how to pay.
          </p>
          <Link href="/gifts" className="mt-4 block text-center text-sm text-mist underline underline-offset-4 hover:text-cream">
            Keep shopping
          </Link>
        </div>
      </aside>
    </form>
  );
}

function Notice({ title, text }: { title: React.ReactNode; text: string }) {
  return (
    <div className="mx-auto max-w-xl py-16 text-center">
      <h1 className="text-[clamp(2.5rem,6vw,4.5rem)]">{title}</h1>
      <p className="mt-6 text-lg text-mist">{text}</p>
      <Link href="/gifts" className="btn btn-gold mt-10">
        Browse gifts
      </Link>
    </div>
  );
}
