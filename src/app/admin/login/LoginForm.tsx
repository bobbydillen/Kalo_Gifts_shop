"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";

const field =
  "mt-2 block w-full rounded-xl border border-hair-2 bg-pine px-4 py-3 text-cream placeholder:text-faint focus:border-gold focus:outline-none";

/** Admin sign-in only. New admins are added from the Supabase dashboard, not from this page. */
export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const supabase = supabaseBrowser();
    let loginEmail = email.trim();
    // A partner username (bobby@kalo, or just bobby) is turned into that account's email.
    if (!/@.+\..+/.test(loginEmail)) {
      const username = loginEmail.toLowerCase().replace(/@kalo$/, "") + "@kalo";
      const { data } = await supabase.rpc("partner_login_email", { p_username: username });
      loginEmail = typeof data === "string" ? data : "";
    }
    const { error: failed } = loginEmail
      ? await supabase.auth.signInWithPassword({ email: loginEmail, password })
      : { error: new Error("no such user") };
    if (failed) {
      setError("That username or email and password do not match.");
      setBusy(false);
      return;
    }
    router.replace("/admin");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="mt-10 space-y-5">
      <label className="block text-sm text-mist">
        Username or email
        <input
          type="text"
          required
          autoComplete="username"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={field}
        />
      </label>
      <label className="block text-sm text-mist">
        Password
        <input
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={field}
        />
      </label>

      {error && (
        <p role="status" className="rounded-xl border border-berry-light/50 bg-berry/20 px-4 py-3 text-sm">
          {error}
        </p>
      )}

      <button type="submit" disabled={busy} className="btn btn-gold w-full disabled:opacity-60">
        {busy ? "One moment…" : "Sign in"}
      </button>
    </form>
  );
}
