import type { Metadata } from "next";
import { CheckoutView } from "@/components/checkout/CheckoutView";

export const metadata: Metadata = {
  title: "Checkout",
  robots: { index: false, follow: false },
};

export default function CheckoutPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 pb-24 pt-12 sm:px-6 lg:pb-32 lg:pt-16">
      <p className="kicker">Almost yours</p>
      <h1 className="mb-12 mt-4 text-[clamp(2.75rem,6vw,5rem)]">
        Check<em>out</em>
      </h1>
      <CheckoutView />
    </div>
  );
}
