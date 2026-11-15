"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import {
  addEntry,
  billLink,
  changeUsername,
  confirmMonth,
  startMonthCheck,
  voidEntry,
  type PartnerResult,
} from "@/app/admin/(panel)/partners/actions";
import { CATEGORIES, KINDS, type Partner } from "@/lib/partner-data";
import { supabaseBrowser } from "@/lib/supabase/client";

const field =
  "mt-1.5 block w-full rounded-xl border border-hair-2 bg-pine px-3 py-2.5 text-cream placeholder:text-faint focus:border-gold focus:outline-none";

function Message({ state }: { state: PartnerResult | null }) {
  if (!state) return null;
  return (
    <p role="status" className={`rounded-xl border px-4 py-2.5 text-sm ${state.ok ? "border-gold/50 bg-gold/10" : "border-berry-light/50 bg-berry/20"}`}>
      {state.ok ? "Saved." : state.error}
    </p>
  );
}

/** Runs a server action from a form, shows its answer and refreshes the page. */
function useAction(action: (f: FormData) => Promise<PartnerResult>, reset = false) {
  const router = useRouter();
  const [state, setState] = useState<PartnerResult | null>(null);
  const [busy, start] = useTransition();
  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    start(async () => {
      const result = await action(data);
      setState(result);
      if (result.ok) {
        if (reset) form.reset();
        router.refresh();
      }
    });
  }
  return { state, busy, submit };
}

export function EntryForm({ partners, me, today }: { partners: Partner[]; me: string; today: string }) {
  const { state, busy, submit } = useAction(addEntry, true);
  const [kind, setKind] = useState(KINDS[1].id);
  const current = KINDS.find((k) => k.id === kind)!;
  return (
    <form onSubmit={submit} className="space-y-4 rounded-2xl border border-hair bg-pine p-5">
      <h2 className="text-xl">Add an entry</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm text-mist sm:col-span-2">
          What happened
          <select name="kind" value={kind} onChange={(e) => setKind(e.target.value as typeof kind)} className={field}>
            {KINDS.map((k) => (
              <option key={k.id} value={k.id}>
                {k.label}
              </option>
            ))}
          </select>
          <span className="mt-1 block text-xs text-faint">{current.help}</span>
        </label>
        {current.needsPartner && (
          <label className="block text-sm text-mist">
            {current.partnerLabel}
            <select name="partner" defaultValue={me} className={field}>
              {partners.map((p) => (
                <option key={p.user_id} value={p.user_id}>
                  {p.display_name}
                </option>
              ))}
            </select>
          </label>
        )}
        <label className="block text-sm text-mist">
          Amount (₹)
          <input name="amount" type="number" step="0.01" min="0.01" required inputMode="decimal" className={field} />
        </label>
        <label className="block text-sm text-mist">
          Date
          <input name="date" type="date" required defaultValue={today} max={today} className={field} />
        </label>
        <label className="block text-sm text-mist">
          Category
          <select name="category" className={field}>
            {CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
        <label className="block text-sm text-mist sm:col-span-2">
          Note (shop name, what it was for)
          <input name="note" maxLength={500} className={field} />
        </label>
        <label className="block text-sm text-mist sm:col-span-2">
          Photo of the bill (optional, up to 8 MB)
          <input name="bill" type="file" accept="image/*,application/pdf" className={`${field} file:mr-3 file:rounded-full file:border-0 file:bg-cream file:px-3 file:py-1 file:text-night`} />
        </label>
      </div>
      <Message state={state} />
      <button disabled={busy} className="btn btn-gold disabled:opacity-60">
        {busy ? "Saving…" : "Save entry"}
      </button>
    </form>
  );
}

export function VoidForm({ id }: { id: string }) {
  const [open, setOpen] = useState(false);
  const { state, busy, submit } = useAction(voidEntry);
  if (!open)
    return (
      <button onClick={() => setOpen(true)} className="text-xs text-faint underline underline-offset-4 hover:text-cream">
        Void
      </button>
    );
  return (
    <form onSubmit={submit} className="mt-2 flex flex-wrap items-center gap-2">
      <input type="hidden" name="id" value={id} />
      <input name="reason" required minLength={3} maxLength={300} placeholder="Why is this wrong?" className="rounded-lg border border-hair-2 bg-night px-2 py-1 text-xs" />
      <button disabled={busy} className="chip">
        {busy ? "…" : "Void entry"}
      </button>
      {state && !state.ok && <span className="text-xs text-berry-light">{state.error}</span>}
    </form>
  );
}

export function BillButton({ path }: { path: string }) {
  const [busy, start] = useTransition();
  return (
    <button
      disabled={busy}
      onClick={() =>
        start(async () => {
          const url = await billLink(path);
          if (url) window.open(url, "_blank", "noopener");
        })
      }
      className="text-xs underline underline-offset-4 hover:text-gold"
    >
      {busy ? "…" : "View bill"}
    </button>
  );
}

export function MonthStartForm({ month }: { month: string }) {
  const { state, busy, submit } = useAction(startMonthCheck);
  return (
    <form onSubmit={submit} className="flex flex-wrap items-end gap-3">
      <input type="hidden" name="month" value={month} />
      <label className="block text-sm text-mist">
        Real bank balance on the last day (₹)
        <input name="real" type="number" step="0.01" required inputMode="decimal" className={field} />
      </label>
      <button disabled={busy} className="btn btn-outline disabled:opacity-60">
        {busy ? "Checking…" : "Compare with the app"}
      </button>
      <Message state={state} />
    </form>
  );
}

export function ConfirmButton({ month }: { month: string }) {
  const { state, busy, submit } = useAction(confirmMonth);
  return (
    <form onSubmit={submit} className="flex flex-wrap items-center gap-3">
      <input type="hidden" name="month" value={month} />
      <button disabled={busy} className="btn btn-gold disabled:opacity-60">
        {busy ? "…" : "Confirm this month"}
      </button>
      {state && !state.ok && <span className="text-sm text-berry-light">{state.error}</span>}
    </form>
  );
}

export function UsernameForm({ current, changed }: { current: string; changed: boolean }) {
  const { state, busy, submit } = useAction(changeUsername);
  const [value, setValue] = useState(current.replace(/@kalo$/, ""));
  return (
    <form onSubmit={submit} className="space-y-3">
      <label className="block text-sm text-mist">
        Username
        <div className="mt-1.5 flex items-center gap-2">
          <input
            value={value}
            onChange={(e) => setValue(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ""))}
            disabled={changed}
            maxLength={20}
            className={`${field} !mt-0 max-w-[12rem]`}
          />
          <span className="text-cream">@kalo</span>
        </div>
        <input type="hidden" name="username" value={`${value}@kalo`} />
      </label>
      <p className="text-xs text-faint">{changed ? "You have already used your one username change." : "You can change it once."}</p>
      <Message state={state} />
      {!changed && (
        <button disabled={busy || value === current.replace(/@kalo$/, "")} className="btn btn-outline disabled:opacity-60">
          {busy ? "Saving…" : "Change username"}
        </button>
      )}
    </form>
  );
}

export function PasswordForm({ email }: { email: string }) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [again, setAgain] = useState("");
  const [busy, setBusy] = useState(false);
  const [state, setState] = useState<PartnerResult | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setState(null);
    if (next.length < 8) return setState({ ok: false, error: "Use at least 8 characters." });
    if (next !== again) return setState({ ok: false, error: "The two new passwords do not match." });
    setBusy(true);
    const supabase = supabaseBrowser();
    const check = await supabase.auth.signInWithPassword({ email, password: current });
    if (check.error) {
      setBusy(false);
      return setState({ ok: false, error: "Your current password is not right." });
    }
    const { error } = await supabase.auth.updateUser({ password: next });
    setBusy(false);
    if (error) return setState({ ok: false, error: error.message });
    setCurrent("");
    setNext("");
    setAgain("");
    setState({ ok: true });
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <label className="block text-sm text-mist">
        Current password
        <input type="password" required autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} className={field} />
      </label>
      <label className="block text-sm text-mist">
        New password
        <input type="password" required autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} className={field} />
      </label>
      <label className="block text-sm text-mist">
        New password again
        <input type="password" required autoComplete="new-password" value={again} onChange={(e) => setAgain(e.target.value)} className={field} />
      </label>
      <Message state={state} />
      <button disabled={busy} className="btn btn-outline disabled:opacity-60">
        {busy ? "Saving…" : "Change password"}
      </button>
    </form>
  );
}
