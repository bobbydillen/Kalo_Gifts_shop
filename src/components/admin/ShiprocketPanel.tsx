"use client";

import { useState, useTransition } from "react";
import { refreshShiprocket, sendToShiprocket, type ShipResult } from "@/app/admin/orders/shiprocket-actions";

type Props = {
  id: string;
  sent: boolean;
  paymentMethod: string;
  shiprocketOrderId: string | null;
  courier: string | null;
  awb: string | null;
  trackingUrl: string | null;
  status: string | null;
};

const field =
  "mt-2 block w-full rounded-xl border border-hair-2 bg-pine px-4 py-3 text-cream focus:border-gold focus:outline-none";

export function ShiprocketPanel(props: Props) {
  const [pending, start] = useTransition();
  const [payment, setPayment] = useState(props.paymentMethod === "cod" ? "cod" : "prepaid");
  const [result, setResult] = useState<ShipResult | null>(null);
  const [confirming, setConfirming] = useState(false);

  const run = (job: () => Promise<ShipResult>) => {
    setResult(null);
    start(async () => setResult(await job()));
  };

  return (
    <div>
      {props.sent ? (
        <>
          <dl className="space-y-2 text-sm text-mist">
            <div className="flex justify-between gap-4">
              <dt>Shiprocket order</dt>
              <dd className="text-cream">{props.shiprocketOrderId}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt>Payment</dt>
              <dd className="text-cream">{props.paymentMethod === "cod" ? "Cash on delivery" : "Prepaid"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt>Courier</dt>
              <dd className="text-cream">{props.courier ?? "Not booked yet"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt>Tracking number</dt>
              <dd className="text-cream">{props.awb ?? "Not yet"}</dd>
            </div>
            {props.status && (
              <div className="flex justify-between gap-4">
                <dt>Status</dt>
                <dd className="text-cream">{props.status}</dd>
              </div>
            )}
          </dl>
          {props.trackingUrl && (
            <a href={props.trackingUrl} target="_blank" rel="noopener noreferrer" className="mt-3 inline-block text-sm text-gold-light underline underline-offset-4">
              Open tracking page
            </a>
          )}
          <button type="button" disabled={pending} onClick={() => run(() => refreshShiprocket(props.id))} className="btn btn-outline mt-5 w-full disabled:opacity-60">
            {pending ? "Checking…" : "Refresh from Shiprocket"}
          </button>
          <p className="mt-2 text-xs text-faint">Choose and book the courier in Shiprocket, then press this to bring the tracking number here.</p>
        </>
      ) : (
        <>
          <label className="block text-sm text-mist">
            Payment for this order
            <select value={payment} onChange={(e) => setPayment(e.target.value)} className={field}>
              <option value="prepaid">Prepaid (already paid)</option>
              <option value="cod">Cash on delivery</option>
            </select>
          </label>
          {confirming ? (
            <div className="mt-5 rounded-xl border border-gold/40 p-4">
              <p className="text-sm text-mist">
                Send this order to Shiprocket as <strong className="text-cream">{payment === "cod" ? "Cash on delivery" : "Prepaid"}</strong>? It
                cannot be undone from here.
              </p>
              <div className="mt-4 flex gap-3">
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => {
                    setConfirming(false);
                    run(() => sendToShiprocket(props.id, payment));
                  }}
                  className="btn btn-gold flex-1 disabled:opacity-60"
                >
                  Yes, send it
                </button>
                <button type="button" onClick={() => setConfirming(false)} className="btn btn-outline flex-1">
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button type="button" disabled={pending} onClick={() => setConfirming(true)} className="btn btn-gold mt-5 w-full disabled:opacity-60">
              {pending ? "Sending…" : "Send to Shiprocket"}
            </button>
          )}
          <p className="mt-2 text-xs text-faint">Creates the order in Shiprocket with the address, items and parcel size.</p>
        </>
      )}

      {result && (
        <p
          role="status"
          className={`mt-4 rounded-xl border px-4 py-3 text-sm ${result.ok ? "border-gold/40 bg-gold/10 text-gold-light" : "border-berry-light/50 bg-berry/20"}`}
        >
          {result.ok ? result.message : result.error}
        </p>
      )}
    </div>
  );
}
