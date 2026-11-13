"use client";

import { useState, useTransition } from "react";
import { saveCustomerNotes } from "@/app/admin/customers/actions";

const field =
  "mt-2 block w-full rounded-xl border border-hair-2 bg-night/60 px-4 py-3 text-cream placeholder:text-faint focus:border-gold focus:outline-none";

const SUGGESTIONS = ["VIP", "Repeat", "Gift buyer", "Wants custom frame", "Needs follow-up", "Wholesale"];

/** Private notes and tags for one customer. Only admins ever see these. */
export function CustomerNotes({ customerId, notes: initialNotes, tags: initialTags }: { customerId: string; notes: string; tags: string[] }) {
  const [pending, start] = useTransition();
  const [notes, setNotes] = useState(initialNotes);
  const [tags, setTags] = useState(initialTags.join(", "));
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);

  const current = tags
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
  const addTag = (tag: string) => {
    if (current.some((t) => t.toLowerCase() === tag.toLowerCase())) return;
    setTags([...current, tag].join(", "));
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setResult(null);
        start(async () => {
          const res = await saveCustomerNotes(customerId, notes, tags);
          setResult(res.ok ? { ok: true, text: "Saved." } : { ok: false, text: res.error });
        });
      }}
      className="space-y-5"
    >
      <label className="block text-sm text-mist">
        Tags <span className="text-faint">(separate with commas)</span>
        <input value={tags} maxLength={300} onChange={(e) => setTags(e.target.value)} placeholder="VIP, Gift buyer" className={field} />
      </label>
      <div className="flex flex-wrap gap-2" aria-label="Tag ideas">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => addTag(s)}
            className="rounded-full border border-hair-2 px-3 py-1 text-xs text-mist transition-colors hover:border-gold hover:text-cream"
          >
            + {s}
          </button>
        ))}
      </div>

      <label className="block text-sm text-mist">
        Private notes
        <textarea
          rows={5}
          maxLength={2000}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="For example: prefers WhatsApp, ordered the frame for her mother's birthday."
          className={field}
        />
        <span className="mt-1 block text-xs text-faint">Only you and other admins see this. The customer never does.</span>
      </label>

      <div className="flex flex-wrap items-center gap-4">
        <button type="submit" disabled={pending} className="btn btn-gold disabled:opacity-60">
          {pending ? "Saving…" : "Save notes"}
        </button>
        {result && (
          <p role="status" className={`text-sm ${result.ok ? "text-gold-light" : "text-berry-light"}`}>
            {result.text}
          </p>
        )}
      </div>
    </form>
  );
}
