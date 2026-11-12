"use client";

import { useState, useTransition } from "react";
import { updateOrder } from "@/app/admin/actions";
import { ORDER_STATUSES, type OrderStatus } from "@/lib/admin";

const field =
  "mt-2 block w-full rounded-xl border border-hair-2 bg-night/60 px-4 py-3 text-cream placeholder:text-faint focus:border-gold focus:outline-none";

/** Status, courier note and a note for the order history, saved together. */
export function OrderControls({
  id,
  status,
  trackingNote,
}: {
  id: string;
  status: OrderStatus;
  trackingNote: string;
}) {
  const [pending, start] = useTransition();
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);

  return (
    <form
      action={(formData) =>
        start(async () => {
          setResult(null);
          const res = await updateOrder(formData);
          setResult(res.ok ? { ok: true, text: "Saved." } : { ok: false, text: res.error });
        })
      }
      className="space-y-5"
    >
      <input type="hidden" name="id" value={id} />

      <label className="block text-sm text-mist">
        Status
        <select name="status" defaultValue={status} className={field}>
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
          defaultValue={trackingNote}
          maxLength={500}
          placeholder="For example: DTDC, tracking 1234567"
          className={field}
        />
      </label>

      <label className="block text-sm text-mist">
        Note for the history <span className="text-faint">(optional)</span>
        <input name="note" maxLength={500} placeholder="Only you see this" className={field} />
      </label>

      <div className="flex items-center gap-4">
        <button type="submit" disabled={pending} className="btn btn-gold disabled:opacity-60">
          {pending ? "Saving…" : "Save changes"}
        </button>
        {result && (
          <p role="status" className={result.ok ? "text-sm text-gold-light" : "text-sm text-berry-light"}>
            {result.text}
          </p>
        )}
      </div>
    </form>
  );
}
