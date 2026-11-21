"use client";

import { useState, useTransition } from "react";
import { markPaymentReceived } from "@/app/admin/actions";
import { formatPrice } from "@/lib/catalog";

/**
 * On a UPI order: the reference the customer sent, and a button to mark the money received once it
 * shows in the bank (check the amount and the note "KALO order N" there first).
 */
export function UpiPaymentPanel({ id, number, total, reference, status }: { id: string; number: number; total: number; reference: string | null; status: string }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState("");
  const [confirming, setConfirming] = useState(false);
  const paid = status === "paid";

  return (
    <section aria-labelledby="upi-title" className={`rounded-2xl border p-6 ${paid ? "border-hair bg-pine" : "border-gold/50 bg-pine"}`}>
      <h2 id="upi-title" className="text-2xl">
        UPI <em>payment</em>
      </h2>
      <dl className="mt-4 space-y-2 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-faint">Amount</dt>
          <dd className="tabular-nums text-cream">{formatPrice(total)}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-faint">Note on the payment</dt>
          <dd className="text-cream">KALO order {number}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-faint">UPI reference</dt>
          <dd className="font-mono text-cream">{reference || <span className="font-sans text-faint">Not sent yet</span>}</dd>
        </div>
      </dl>
      {paid ? (
        <p className="mt-5 text-sm text-gold-light">Payment received.</p>
      ) : status !== "pending" ? (
        <p className="mt-5 text-sm text-mist">Payment: {status}</p>
      ) : confirming ? (
        <div className="mt-5 space-y-3">
          <p className="text-sm text-mist">
            Have you seen <strong className="text-cream">{formatPrice(total)}</strong> arrive in the bank{reference ? <> with reference <span className="font-mono text-cream">{reference}</span></> : null}?
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={pending}
              onClick={() =>
                start(async () => {
                  setError("");
                  const r = await markPaymentReceived(id);
                  if (!r.ok) setError(r.error);
                  else setConfirming(false);
                })
              }
              className="btn btn-gold disabled:opacity-60"
            >
              {pending ? "Saving…" : "Yes, received"}
            </button>
            <button type="button" onClick={() => setConfirming(false)} className="btn btn-outline">
              Not yet
            </button>
          </div>
        </div>
      ) : (
        <>
          <p className="mt-5 text-sm text-mist">Check the bank or your UPI business app for this amount before packing.</p>
          <button type="button" onClick={() => setConfirming(true)} className="btn btn-gold mt-3">
            Mark payment received
          </button>
        </>
      )}
      {error && (
        <p role="alert" className="mt-3 text-sm text-berry-light">
          {error}
        </p>
      )}
    </section>
  );
}
