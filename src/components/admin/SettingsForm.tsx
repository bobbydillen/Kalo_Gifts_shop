"use client";

import Link from "next/link";
import { useState, useTransition, type ReactNode } from "react";
import { saveSettings } from "@/app/admin/settings/actions";
import { fromIstInput, toIstInput, validateSettings, type SiteSettings } from "@/lib/settings";
import { RATE_COLUMNS, ZONES, type Zone, type ZoneRates } from "@/lib/shipping";

const field =
  "mt-2 block w-full rounded-xl border border-hair-2 bg-night/60 px-4 py-3 text-cream placeholder:text-faint focus:border-gold focus:outline-none";

function Switch({
  on,
  onToggle,
  title,
  hint,
}: {
  on: boolean;
  onToggle: () => void;
  title: string;
  hint: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={onToggle}
      className="group flex w-full items-center gap-4 rounded-2xl border border-hair-2 px-4 py-4 text-left transition-[border-color,background-color] duration-300 hover:border-gold aria-checked:border-gold/60 aria-checked:bg-gold/10"
    >
      <span
        aria-hidden="true"
        className="relative h-7 w-12 shrink-0 rounded-full bg-hair-2 transition-colors duration-300 group-aria-checked:bg-gold"
      >
        <span className="absolute left-1 top-1 size-5 rounded-full bg-cream transition-transform duration-300 ease-bounce group-aria-checked:translate-x-5 group-aria-checked:bg-night" />
      </span>
      <span className="flex-1">
        <span className="block">{title}</span>
        <span className="block text-sm text-faint">{hint}</span>
      </span>
      <span className="text-xs uppercase tracking-[0.16em] text-faint group-aria-checked:text-gold-light">
        {on ? "On" : "Off"}
      </span>
    </button>
  );
}

function Section({ title, hint, children }: { title: ReactNode; hint?: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-hair bg-pine p-6">
      <h2 className="text-2xl">{title}</h2>
      {hint && <p className="mt-1 text-sm text-faint">{hint}</p>}
      <div className="mt-5 space-y-4">{children}</div>
    </section>
  );
}

/** Editor for the Christmas switches, dates and gift prices. */
export function SettingsForm({ initial }: { initial: SiteSettings }) {
  const [pending, start] = useTransition();
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);

  const [snowfall, setSnowfall] = useState(initial.snowfall);
  const [countdown, setCountdown] = useState(initial.countdown);
  const [christmasHero, setChristmasHero] = useState(initial.christmasHero);
  const [orderByBanner, setOrderByBanner] = useState(initial.orderByBanner);
  const [christmasDate, setChristmasDate] = useState(toIstInput(initial.christmasDate));
  const [orderByDate, setOrderByDate] = useState(toIstInput(initial.orderByDate));
  const [wrapPrice, setWrapPrice] = useState(String(initial.giftWrapPrice));
  const [cardPrice, setCardPrice] = useState(String(initial.giftCardPrice));
  const [maxChars, setMaxChars] = useState(String(initial.giftCardMaxChars));
  const [checkoutOpen, setCheckoutOpen] = useState(initial.checkoutOpen);
  const [customerLogin, setCustomerLogin] = useState(initial.customerLogin);
  const [freeOver, setFreeOver] = useState(String(initial.freeShippingOver));
  const [rates, setRates] = useState<Record<Zone, string[]>>(() => ({
    tn: initial.shippingRates.tn.map(String),
    south: initial.shippingRates.south.map(String),
    india: initial.shippingRates.india.map(String),
  }));
  const setRate = (zone: Zone, index: number, value: string) =>
    setRates((r) => ({ ...r, [zone]: r[zone].map((v, i) => (i === index ? value.replace(/\D/g, "") : v)) }));

  function submit() {
    setResult(null);
    if ([wrapPrice, cardPrice, maxChars, freeOver, ...Object.values(rates).flat()].some((v) => v.trim() === "")) {
      setResult({ ok: false, text: "Fill in every number box. Type 0 where something is free." });
      return;
    }
    const christmasIso = fromIstInput(christmasDate);
    const orderByIso = fromIstInput(orderByDate);
    if (!christmasIso || !orderByIso) {
      setResult({ ok: false, text: "Enter both dates and times." });
      return;
    }
    const checked = validateSettings({
      snowfall,
      countdown,
      christmasHero,
      orderByBanner,
      christmasDate: christmasIso,
      orderByDate: orderByIso,
      giftWrapPrice: Number(wrapPrice),
      giftCardPrice: Number(cardPrice),
      giftCardMaxChars: Number(maxChars),
      checkoutOpen,
      customerLogin,
      freeShippingOver: Number(freeOver),
      shippingRates: {
        tn: rates.tn.map(Number) as ZoneRates,
        south: rates.south.map(Number) as ZoneRates,
        india: rates.india.map(Number) as ZoneRates,
      },
    });
    if (!checked.ok) {
      setResult({ ok: false, text: checked.error });
      return;
    }
    start(async () => {
      const res = await saveSettings(checked.value);
      setResult(res.ok ? { ok: true, text: "Saved. The shop has been updated." } : { ok: false, text: res.error });
    });
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className="space-y-6"
    >
      <Section
        title={
          <>
            Christ<em>mas</em>
          </>
        }
        hint="Switch these off after the season. The site changes straight away; no code needed."
      >
        <Switch
          on={christmasHero}
          onToggle={() => setChristmasHero(!christmasHero)}
          title="Christmas on the site"
          hint="The Christmas section on the home page, the Christmas link in the menu and the Christmas page. When off, the Christmas page says “Back next season”."
        />
        <Switch on={snowfall} onToggle={() => setSnowfall(!snowfall)} title="Snowfall" hint="Gentle snow over every page of the shop." />
        <Switch
          on={countdown}
          onToggle={() => setCountdown(!countdown)}
          title="Countdown to Christmas"
          hint="Days, hours, minutes and seconds in the Christmas section."
        />
        <Switch
          on={orderByBanner}
          onToggle={() => setOrderByBanner(!orderByBanner)}
          title="Order-by banner"
          hint="The small floating note: “Order by 18 Dec for delivery before Christmas”, with time left."
        />

        <div className="grid gap-5 pt-2 sm:grid-cols-2">
          <label className="block text-sm text-mist">
            Christmas morning <span className="text-faint">(Indian time)</span>
            <input type="datetime-local" required value={christmasDate} onChange={(e) => setChristmasDate(e.target.value)} className={field} />
            <span className="mt-1 block text-xs text-faint">The countdown runs to this moment.</span>
          </label>
          <label className="block text-sm text-mist">
            Last moment to order <span className="text-faint">(Indian time)</span>
            <input type="datetime-local" required value={orderByDate} onChange={(e) => setOrderByDate(e.target.value)} className={field} />
            <span className="mt-1 block text-xs text-faint">After this, the order-by banner disappears by itself.</span>
          </label>
        </div>
      </Section>

      <Section
        title={
          <>
            Taking <em>orders</em>
          </>
        }
        hint="Leave this off until you are ready to take real orders. While it is off, the bag says “Checkout opens soon” and the database refuses orders."
      >
        <Switch
          on={checkoutOpen}
          onToggle={() => setCheckoutOpen(!checkoutOpen)}
          title="Accept orders"
          hint="Customers can check out with their phone number and address. Orders appear under Orders, unpaid, until payments are added."
        />
        <Switch
          on={customerLogin}
          onToggle={() => setCustomerLogin(!customerLogin)}
          title="Customer sign-in by email code"
          hint="Adds an Account link where customers enter a code emailed to them to see their orders. Turn on only after the email sending service and email templates are set up in Supabase and tested."
        />
      </Section>

      <Section
        title={
          <>
            <em>Delivery</em> charges
          </>
        }
        hint="Worked out from where the parcel goes and what it weighs, and added to the total at checkout. Set each product's weight on its Products page."
      >
        <label className="block max-w-xs text-sm text-mist">
          Free delivery when items total at least (₹)
          <input required inputMode="numeric" value={freeOver} onChange={(e) => setFreeOver(e.target.value.replace(/\D/g, ""))} className={field} />
          <span className="mt-1 block text-xs text-faint">Type 0 to make delivery always free.</span>
        </label>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[34rem] text-left text-sm">
            <thead className="text-xs uppercase tracking-[0.14em] text-faint">
              <tr>
                <th className="pb-2 pr-3 font-normal">Region (₹)</th>
                {RATE_COLUMNS.map((c) => (
                  <th key={c} className="pb-2 pr-3 font-normal">
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ZONES.map((z) => (
                <tr key={z.id} className="border-t border-hair align-top">
                  <th scope="row" className="py-3 pr-3 font-normal text-mist">
                    {z.label}
                    <span className="block text-xs text-faint">{z.states}</span>
                  </th>
                  {rates[z.id].map((value, i) => (
                    <td key={i} className="py-3 pr-3">
                      <input
                        required
                        inputMode="numeric"
                        aria-label={`${z.label}, ${RATE_COLUMNS[i]}`}
                        value={value}
                        onChange={(e) => setRate(z.id, i, e.target.value)}
                        className="w-24 rounded-xl border border-hair-2 bg-pine px-3 py-2 text-cream focus:border-gold focus:outline-none"
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-faint">
          The first three columns are the charge for the whole parcel. The last is added for every extra 1 kg (or part of it) beyond 2 kg.
          Heavy or far orders cost you more, so check these against what Shiprocket charges you.
        </p>
      </Section>

      <Section
        title={
          <>
            Gift <em>options</em>
          </>
        }
        hint="Offered on every item when a customer adds it to the bag. Hampers are not offered gift wrap, because they arrive packed."
      >
        <div className="grid gap-5 sm:grid-cols-3">
          <label className="block text-sm text-mist">
            Gift wrap price (₹)
            <input required inputMode="numeric" value={wrapPrice} onChange={(e) => setWrapPrice(e.target.value.replace(/\D/g, ""))} className={field} />
          </label>
          <label className="block text-sm text-mist">
            Handwritten card price (₹)
            <input required inputMode="numeric" value={cardPrice} onChange={(e) => setCardPrice(e.target.value.replace(/\D/g, ""))} className={field} />
          </label>
          <label className="block text-sm text-mist">
            Card message limit
            <input required inputMode="numeric" value={maxChars} onChange={(e) => setMaxChars(e.target.value.replace(/\D/g, ""))} className={field} />
            <span className="mt-1 block text-xs text-faint">Characters</span>
          </label>
        </div>
        <p className="text-sm text-faint">
          Prices are per piece. Bags that are already filled use the new prices the next time they are opened. Orders
          already placed keep the price they were placed at.
        </p>
      </Section>

      <div className="sticky bottom-0 -mx-4 flex flex-wrap items-center gap-4 border-t border-hair bg-night/90 px-4 py-4 backdrop-blur sm:-mx-8 sm:px-8">
        <button type="submit" disabled={pending} className="btn btn-gold disabled:opacity-60">
          {pending ? "Saving…" : "Save settings"}
        </button>
        <Link href="/christmas" target="_blank" className="text-sm text-gold-light underline underline-offset-4">
          View the Christmas page
        </Link>
        {result && (
          <p role="status" className={result.ok ? "text-sm text-gold-light" : "text-sm text-berry-light"}>
            {result.text}
          </p>
        )}
      </div>
    </form>
  );
}
