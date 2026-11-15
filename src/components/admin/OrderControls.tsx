"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import { updateOrder } from "@/app/admin/actions";
import { ORDER_STATUSES, statusMessage, whatsappLink, type OrderStatus } from "@/lib/admin";

const field =
  "mt-2 block w-full rounded-xl border border-hair-2 bg-night/60 px-4 py-3 text-cream placeholder:text-faint focus:border-gold focus:outline-none";

/**
 * Status, courier note and a note for the order history, saved together. The fields keep what you
 * typed after saving, and the WhatsApp button follows the status chosen here.
 */
export function OrderControls({
  id,
  status: savedStatus,
  trackingNote: savedTracking,
  number,
  name,
  phone,
  confirmation,
}: {
  id: string;
  status: OrderStatus;
  trackingNote: string;
  number: number;
  name: string;
  phone: string;
  /** The full order confirmation and thank-you text, used when the status is "New". */
  confirmation: string;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [status, setStatus] = useState<OrderStatus>(savedStatus);
  const [tracking, setTracking] = useState(savedTracking);
  const [note, setNote] = useState("");
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);

  const message =
    status === "new" ? confirmation : statusMessage({ number, ship_name: name, tracking_note: tracking }, status);
  const label = ORDER_STATUSES.find((s) => s.id === status)?.label ?? status;

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData();
    data.set("id", id);
    data.set("status", status);
    data.set("tracking_note", tracking);
    data.set("note", note);
    start(async () => {
      setResult(null);
      const res = await updateOrder(data);
      if (res.ok) {
        setNote("");
        setResult({ ok: true, text: "Saved." });
        router.refresh();
      } else setResult({ ok: false, text: res.error });
    });
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <label className="block text-sm text-mist">
        Status
        <select name="status" value={status} onChange={(e) => setStatus(e.target.value as OrderStatus)} className={field}>
          {ORDER_STATUSES.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
      </label>

      <label className="block text-sm text-mist">
        Courier and tracking number
        <input
          name="tracking_note"
          value={tracking}
          onChange={(e) => setTracking(e.target.value)}
          maxLength={500}
          placeholder="For example: DTDC, tracking 1234567"
          className={field}
        />
      </label>

      <label className="block text-sm text-mist">
        Note for the history <span className="text-faint">(optional)</span>
        <input name="note" value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} placeholder="Only you see this" className={field} />
      </label>

      <div className="flex flex-wrap items-center gap-4">
        <button type="submit" disabled={pending} className="btn btn-gold disabled:opacity-60">
          {pending ? "Saving…" : "Save changes"}
        </button>
        <a href={whatsappLink(phone, message)} target="_blank" rel="noopener noreferrer" className="btn btn-outline">
          {status === "new" ? "Send confirmation on WhatsApp" : `Send "${label}" on WhatsApp`}
        </a>
        {result && (
          <p role="status" className={result.ok ? "text-sm text-gold-light" : "text-sm text-berry-light"}>
            {result.text}
          </p>
        )}
      </div>
      <p className="text-xs text-faint">
        The WhatsApp button opens a ready message for the status chosen above. Save first, then send, so the customer hears what you saved.
      </p>
    </form>
  );
}
