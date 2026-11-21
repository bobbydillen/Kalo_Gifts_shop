"use client";

import QRCode from "qrcode";
import { useEffect, useState, useTransition } from "react";
import { submitPaymentRef } from "@/app/(site)/checkout/actions";
import { useSettings } from "@/components/settings/SettingsProvider";
import { formatPrice } from "@/lib/catalog";
import { chatLink } from "@/lib/contact";
import { UPI_PAY_KEY, upiAppLinks, upiLink, type UpiPayNote } from "@/lib/upi";

/**
 * The pay screen after a UPI order: a button that opens the customer's UPI app with the amount filled
 * in (or a QR code to scan from a computer), the UPI ID to copy, and a box for the UPI reference.
 */
export function UpiPay({ number, amount }: { number: number; amount: number }) {
  const { upiId, whatsappNumber } = useSettings();
  const [note, setNote] = useState<UpiPayNote | null>(null);
  const [qr, setQr] = useState("");
  const [copied, setCopied] = useState(false);
  const [ref, setRef] = useState("");
  const [state, setState] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();

  const total = note?.number === number ? note.total : amount;
  const link = upiId ? upiLink(upiId, total, number) : "";

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(UPI_PAY_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- read once from this browser tab after loading
      if (raw) setNote(JSON.parse(raw) as UpiPayNote);
    } catch {
      // nothing saved: the reference can still be sent on WhatsApp
    }
  }, []);

  useEffect(() => {
    if (!link) return;
    QRCode.toString(link, { type: "svg", margin: 1, color: { dark: "#06120d", light: "#f3ecdf" } })
      .then(setQr)
      .catch(() => setQr(""));
  }, [link]);

  if (!upiId || !total) return null;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(upiId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // copying not allowed: the ID is on screen to type
    }
  };

  const send = () => {
    setState(null);
    if (!note || note.number !== number) {
      setState({ ok: false, text: "Please send the reference to us on WhatsApp, with your order number." });
      return;
    }
    start(async () => {
      const result = await submitPaymentRef(number, note.phone, ref);
      if (result.ok) {
        setState({ ok: true, text: "Thank you! We will check the payment and confirm your order on WhatsApp." });
        try {
          sessionStorage.removeItem(UPI_PAY_KEY);
        } catch {
          // fine
        }
      } else setState({ ok: false, text: result.error });
    });
  };

  const whatsapp = chatLink({ whatsappNumber }, `Hi KALO Gifts, I paid ${formatPrice(total)} by UPI for order #${number}. UPI reference: ${ref || "…"}`);

  return (
    <div className="mx-auto mt-10 max-w-xl rounded-[24px] border border-gold/40 bg-pine p-6 text-left sm:p-8">
      <p className="kicker">Step 2 of 2</p>
      <h2 className="mt-3 font-serif text-3xl">
        Pay <em>{formatPrice(total)}</em> by UPI
      </h2>
      <p className="mt-2 text-sm text-mist">To KALO Gifts. Your order is held for you while you pay.</p>

      {/* on a phone: open the UPI app straight away */}
      <div className="mt-6 sm:hidden">
        <a href={link} className="btn btn-gold w-full">
          Pay {formatPrice(total)} with a UPI app
        </a>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {upiAppLinks(upiId, total, number).map((app) => (
            <a key={app.name} href={app.href} className="rounded-full border border-hair-2 px-2 py-2 text-center text-xs text-cream transition-colors hover:border-gold">
              {app.name}
            </a>
          ))}
        </div>
      </div>

      {/* on a computer (and on a phone, further down): scan the code */}
      <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:items-start sm:gap-6">
        {qr && (
          <div
            role="img"
            aria-label={`UPI QR code to pay ${formatPrice(total)} to KALO Gifts`}
            className="size-44 shrink-0 overflow-hidden rounded-2xl bg-cream p-2 [&>svg]:size-full"
            dangerouslySetInnerHTML={{ __html: qr }}
          />
        )}
        <div className="text-sm text-mist">
          <p className="hidden sm:block">Scan with any UPI app on your phone. The amount and order number are filled in.</p>
          <p className="sm:hidden">Or pay from another phone by scanning this code.</p>
          <p className="mt-3 text-faint">UPI ID</p>
          <p className="flex items-center gap-2">
            <span className="font-mono text-cream">{upiId}</span>
            <button type="button" onClick={copy} className="rounded-full border border-hair-2 px-3 py-1 text-xs hover:border-gold">
              {copied ? "Copied" : "Copy"}
            </button>
          </p>
          <p className="mt-2 text-faint">
            Amount <span className="text-cream">{formatPrice(total)}</span> · note <span className="text-cream">KALO order {number}</span>
          </p>
        </div>
      </div>

      <div className="mt-8 border-t border-hair pt-6">
        <label className="block text-sm text-mist" htmlFor="upi-ref">
          After paying, enter the <span className="text-cream">UPI reference</span> (also called UTR or transaction ID, usually 12 digits)
        </label>
        <div className="mt-2 flex gap-2">
          <input
            id="upi-ref"
            value={ref}
            onChange={(e) => setRef(e.target.value.replace(/\s/g, "").toUpperCase().slice(0, 35))}
            inputMode="text"
            autoComplete="off"
            placeholder="For example 432112345678"
            disabled={state?.ok}
            className="min-w-0 flex-1 rounded-full border border-hair-2 bg-night/40 px-4 py-3 text-cream placeholder:text-faint focus:border-gold focus:outline-none"
          />
          <button type="button" onClick={send} disabled={pending || !ref || state?.ok} className="btn btn-gold shrink-0 disabled:opacity-60">
            {pending ? "Sending…" : "Send"}
          </button>
        </div>
        {state && (
          <p role="status" className={`mt-3 text-sm ${state.ok ? "text-gold-light" : "text-berry-light"}`}>
            {state.text}
          </p>
        )}
        {whatsapp && !state?.ok && (
          <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="mt-3 inline-block text-sm text-gold-light underline underline-offset-4">
            Or send the reference on WhatsApp
          </a>
        )}
      </div>
    </div>
  );
}
