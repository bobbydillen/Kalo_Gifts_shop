import type { Metadata } from "next";
import { Suspense } from "react";
import { Button } from "@/components/ui/Button";

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
  const raw = (await searchParams).n;
  const number = typeof raw === "string" && /^\d{1,9}$/.test(raw) ? raw : null;

  return (
    <section className="mx-auto max-w-2xl px-4 py-24 text-center sm:px-6 lg:py-36">
      <p className="kicker">Thank you</p>
      <h1 className="mt-6 text-[clamp(2.75rem,7vw,5.5rem)]">
        Order <em>received</em>
      </h1>
      {number && <p className="mt-6 font-serif text-3xl text-gold-light">#{number}</p>}
      <p className="mx-auto mt-8 max-w-md text-lg text-mist">
        We will message you on WhatsApp to confirm your order. Keep the order number
        handy in case you need to ask about it.
      </p>
      <div className="mt-10">
        <Button href="/gifts" arrow>
          Keep browsing
        </Button>
      </div>
    </section>
  );
}
