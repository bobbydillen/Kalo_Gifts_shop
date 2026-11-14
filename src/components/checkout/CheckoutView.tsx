"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition, type FormEvent } from "react";
import { lookupPincodeAction, placeOrder } from "@/app/(site)/checkout/actions";
import { useBag } from "@/components/bag/BagProvider";
import { useCatalog } from "@/components/catalog/CatalogProvider";
import { ProductArt } from "@/components/product/ProductArt";
import { useSettings } from "@/components/settings/SettingsProvider";
import { formatPrice } from "@/lib/catalog";
import { INDIAN_STATES, validateDetails } from "@/lib/checkout";
import type { PincodeResult } from "@/lib/pincode";
import { describePart } from "@/lib/hamper";
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
  const [area, setArea] = useState(""); // the local area chosen from the pincode's own list

  // The pincode decides the city, state and local areas, so they cannot be made up.
  type Lookup = { status: "idle" } | { status: "loading" } | PincodeResult;
  const [looked, setLooked] = useState<{ pin: string; result: PincodeResult } | null>(null);
  const validPin = /^[1-9]\d{5}$/.test(pincode);
  const lookup: Lookup = !validPin ? { status: "idle" } : looked?.pin === pincode ? looked.result : { status: "loading" };
  const found = lookup.status === "found" ? lookup.info : null;
  const resolvedCity = found ? found.city : city;
  const resolvedState = found?.stateKnown ? found.state : state;

  // A signed-in customer: use their verified email or phone, and the details from their latest order.
  const customer = useCustomer();
  const [prefilled, setPrefilled] = useState(false);

  useEffect(() => {
    if (!validPin) return;
    let live = true;
    lookupPincodeAction(pincode)
      .then((result) => {
        if (!live) return;
        setLooked({ pin: pincode, result });
        if (result.status !== "found") return;
        // an address saved from an earlier order starts with its area: pick it again
        const match = result.info.areas.find((a) => line2.toLowerCase().startsWith(a.toLowerCase()));
        if (match && !area) {
          setArea(match);
          setLine2(line2.slice(match.length).replace(/^[,\s]+/, ""));
        }
      })
      .catch(() => live && setLooked({ pin: pincode, result: { status: "unavailable" } }));
    return () => {
      live = false;
    };
    // line2 and area are read once when the lookup finishes; they should not restart the lookup
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pincode, validPin]);
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
  // a hamper weighs its box plus everything inside it, the same as the database counts it
  const weightG = lines.reduce((sum, l) => {
    if (l.parts) {
      return sum + l.product.weightG + l.parts.reduce((n, p) => n + (catalog.productBySlug(p.slug)?.weightG ?? 300) * p.qty, 0);
    }
    return sum + (catalog.productBySlug(l.slug)?.weightG ?? 300) * l.qty;
  }, 0);
  const delivery = resolvedState ? shippingFee(settings.shippingRates, settings.freeShippingOver, resolvedState, weightG, subtotal) : null;
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

    if (lookup.status === "loading") {
      setError("Checking your pincode. One moment, then try again.");
      return;
    }
    if (lookup.status === "not-found") {
      setError("We could not find that pincode. Please check it. If it is right, message us on WhatsApp and we will help.");
      return;
    }
    if (found && found.areas.length > 0 && !area) {
      setError("Choose your area from the list.");
      return;
    }
    const fullLine2 = [area, line2.trim()].filter(Boolean).join(", ");
    const details = validateDetails(
      { phone, email, name, line1, line2: fullLine2, city: resolvedCity, state: resolvedState, pincode, note },
      { trustedPlace: lookup.status === "found" },
    );
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
          photo: l.photo?.path,
          parts: l.parts?.map((p) => ({ slug: p.slug, colour: p.colour, size: p.size, qty: p.qty, photo: p.photo?.path })),
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
                aria-describedby="pincode-status"
              />
            </label>
            <div className="text-sm text-mist" id="pincode-status" aria-live="polite">
              <span className="block">City and state</span>
              <div className="mt-2 flex min-h-[3.125rem] items-center rounded-xl border border-hair bg-night/40 px-4 py-3">
                {lookup.status === "found" ? (
                  <span className="text-cream">
                    {found!.city}, {resolvedState}
                  </span>
                ) : lookup.status === "loading" ? (
                  <span className="text-faint">Checking your pincode…</span>
                ) : lookup.status === "not-found" ? (
                  <span className="text-berry-light">We could not find this pincode. Please check it.</span>
                ) : lookup.status === "unavailable" ? (
                  <span className="text-faint">Fill these in below</span>
                ) : (
                  <span className="text-faint">Filled in from your pincode</span>
                )}
              </div>
            </div>

            {lookup.status === "unavailable" && (
              <>
                <label className="block text-sm text-mist">
                  City or town
                  <input required autoComplete="address-level2" maxLength={80} value={city} onChange={(e) => setCity(e.target.value)} className={field} />
                </label>
                <label className="block text-sm text-mist">
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
                <p className="text-xs text-faint sm:col-span-2">We could not check your pincode just now, so please type your city and choose your state.</p>
              </>
            )}

            {found && found.areas.length > 0 && (
              <label className="block text-sm text-mist sm:col-span-2">
                Area
                <select required value={area} onChange={(e) => setArea(e.target.value)} className={field}>
                  <option value="">Choose your area</option>
                  {found.areas.map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                </select>
              </label>
            )}

            <label className="block text-sm text-mist sm:col-span-2">
              House or flat number and street
              <input required autoComplete="address-line1" maxLength={200} value={line1} onChange={(e) => setLine1(e.target.value)} placeholder="For example: Flat 502, Akshaya The Belvedere, NH 4" className={field} />
            </label>
            <label className="block text-sm text-mist sm:col-span-2">
              Landmark <span className="text-faint">(optional)</span>
              <input autoComplete="address-line2" maxLength={150} value={line2} onChange={(e) => setLine2(e.target.value)} placeholder="Near the temple, opposite the bus stop" className={field} />
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
                  {line.photo ? (
                    // eslint-disable-next-line @next/next/no-img-element -- a small saved preview of the customer's photo
                    <img src={line.photo.thumb} alt="Your photo" className="size-full rounded-xl object-cover" />
                  ) : (
                    <ProductArt category={line.product.category} className="w-8 text-gold-light" />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-serif text-lg leading-tight">
                    {line.product.name} <span className="font-sans text-sm text-mist">× {line.qty}</span>
                  </span>
                  <span className="block text-sm text-faint">
                    {[line.colour, line.size].filter(Boolean).join(" · ")}
                    {line.wrap ? " · gift wrap" : ""}
                    {line.note ? " · handwritten card" : ""}
                    {line.photo ? " · your photo" : ""}
                  </span>
                  {line.parts && (
                    <span className="mt-1 block space-y-0.5 text-sm text-mist">
                      {line.parts.map((part, i) => (
                        <span key={i} className="block">
                          {describePart(part, catalog.productBySlug)}
                          {part.photo ? " · your photo" : ""}
                        </span>
                      ))}
                    </span>
                  )}
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
          <p className="mt-3 text-xs text-faint">
            By placing your order you agree to our{" "}
            <Link href="/policies/terms" className="underline underline-offset-4 hover:text-cream">terms</Link>,{" "}
            <Link href="/policies/privacy" className="underline underline-offset-4 hover:text-cream">privacy policy</Link>,{" "}
            <Link href="/policies/shipping" className="underline underline-offset-4 hover:text-cream">shipping</Link> and{" "}
            <Link href="/policies/returns" className="underline underline-offset-4 hover:text-cream">returns</Link> policies.
          </p>
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
