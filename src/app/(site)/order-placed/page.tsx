import type { Metadata } from "next";
import { Suspense } from "react";
import { PurchaseEvent } from "@/components/analytics/PixelEvents";
import { Button } from "@/components/ui/Button";
import { OnlinePay } from "@/components/checkout/OnlinePay";
import { UpiPay } from "@/components/checkout/UpiPay";
import { orderNumberFromCashfreeId } from "@/lib/cashfree";
import { confirmPayment } from "@/lib/online-payment";

export const metadata: Metadata = {
  title: "Order placed",
  robots: { index: false, follow: false },
};

/** The number comes from the address; it is shown as given and no personal details are looked up. */
export default function OrderPlacedPage({ searchParams }: PageProps<"/order-placed">) {
  return (
    <Suspense>
      <Confirmation searchParams={searchParams} />
    </Suspense>
  );
}

async function Confirmation({ searchParams }: Pick<PageProps<"/order-placed">, "searchParams">) {
  const params = await searchParams;
  const raw = params.n;
  const number = typeof raw === "string" && /^\d{1,9}$/.test(raw) ? raw : null;
  const upi = params.pay === "upi" && number !== null;
  const amount = typeof params.a === "string" && /^\d{1,7}$/.test(params.a) ? Number(params.a) : 0;

  // back from Cashfree: ask Cashfree whether it was paid (never trust the address alone)
  const online = params.pay === "online" && number !== null;
  const cf = typeof params.cf === "string" && orderNumberFromCashfreeId(params.cf) === Number(number) ? params.cf : null;
  const paid = online ? (cf ? await confirmPayment(cf) : "pending") : null;

  return (
    <section className="mx-auto max-w-2xl px-4 py-24 text-center sm:px-6 lg:py-36">
      {(!online || paid === "paid") && <PurchaseEvent />}
      <p className="kicker">Thank you</p>
      <h1 className="mt-6 text-[clamp(2.75rem,7vw,5.5rem)]">
        Order <em>received</em>
      </h1>
      {number && <p className="mt-6 font-serif text-3xl text-gold-light">#{number}</p>}
      {online ? (
        <OnlinePay number={Number(number)} state={paid ?? "pending"} />
      ) : upi ? (
        <UpiPay number={Number(number)} amount={amount} />
      ) : (
        <p className="mx-auto mt-8 max-w-md text-lg text-mist">
          We will message you on WhatsApp to confirm your order. Keep the order number
          handy in case you need to ask about it.
        </p>
      )}
      <div className="mt-10">
        <Button href="/gifts" arrow>
          Keep browsing
        </Button>
      </div>
    </section>
  );
}
