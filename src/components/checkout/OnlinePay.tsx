"use client";

import { useEffect, useState, useTransition } from "react";
import { retryOnlinePayment } from "@/app/(site)/checkout/actions";
import { useSettings } from "@/components/settings/SettingsProvider";
import { formatPrice } from "@/lib/catalog";
import { ONLINE_PAY_KEY, openCashfree, type OnlinePayNote } from "@/lib/cashfree-checkout";
import { chatLink } from "@/lib/contact";

/**
 * The order page after paying online. The server has already asked Cashfree about the payment:
 * "paid" thanks the customer; otherwise they can open the payment page again.
 */
export function OnlinePay({ number, state }: { number: number; state: "paid" | "pending" | "unknown" }) {
  const { whatsappNumber } = useSettings();
  const [note, setNote] = useState<OnlinePayNote | null>(null);
  const [error, setError] = useState("");
  const [paidNow, setPaidNow] = useState(false);
  const [pending, start] = useTransition();

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(ONLINE_PAY_KEY);
      const saved = raw ? (JSON.parse(raw) as OnlinePayNote) : null;
      if (state === "paid") sessionStorage.removeItem(ONLINE_PAY_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- read once from this browser tab after loading
      else if (saved?.number === number) setNote(saved);
    } catch {
      // nothing saved: WhatsApp is offered instead
    }
  }, [number, state]);

  if (state === "paid" || paidNow) {
    return (
      <div className="mx-auto mt-8 max-w-md">
        <p className="text-lg text-gold-light">Payment received. Thank you!</p>
        <p className="mt-3 text-mist">We will pack your order with care and message you on WhatsApp with the tracking details once it ships.</p>
      </div>
    );
  }

  const pay = () => {
    if (!note) return;
    setError("");
    start(async () => {
      const result = await retryOnlinePayment(note.number, note.phone);
      if (!result.ok) {
        if (result.paid) setPaidNow(true);
        else setError(result.error);
        return;
      }
      try {
        await openCashfree(result.session);
      } catch {
        setError("The payment page could not load. Check your connection and try again.");
      }
    });
  };

  const whatsapp = chatLink({ whatsappNumber }, `Hi KALO Gifts, I need help paying for order #${number}.`);

  return (
    <div className="mx-auto mt-8 max-w-md rounded-[24px] border border-gold/40 bg-pine p-6 text-left">
      <p className="kicker">{state === "unknown" ? "Checking your payment" : "Payment not completed"}</p>
      <p className="mt-3 text-mist">
        {state === "unknown"
          ? "We could not confirm your payment just yet. If money left your account, it will show here within a few minutes, and we will message you on WhatsApp. Please do not pay twice."
          : "Your order is saved, but the payment did not go through. No money was taken. You can try again."}
      </p>
      {note && (
        <button type="button" onClick={pay} disabled={pending} className="btn btn-gold mt-5 w-full disabled:opacity-60">
          {pending ? "Opening…" : state === "unknown" ? "Check again or pay" : `Pay ${formatPrice(note.total)} now`}
        </button>
      )}
      {error && (
        <p role="alert" className="mt-3 text-sm text-berry-light">
          {error}
        </p>
      )}
      {whatsapp && (
        <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="mt-4 inline-block text-sm text-gold-light underline underline-offset-4">
          Need help? Message us on WhatsApp
        </a>
      )}
    </div>
  );
}
