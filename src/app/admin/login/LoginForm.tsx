"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";

type Message = { kind: "error" | "info"; text: string };

const field =
  "mt-2 block w-full rounded-xl border border-hair-2 bg-pine px-4 py-3 text-cream placeholder:text-faint focus:border-gold focus:outline-none";

export function LoginForm() {
  const router = useRouter();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<Message | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setMessage(null);

    if (mode === "up" && password.length < 10) {
      setMessage({ kind: "error", text: "Use at least 10 characters for the password." });
      return;
    }

    setBusy(true);
    const supabase = supabaseBrowser();

    if (mode === "in") {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error) {
        setMessage({
          kind: "error",
          text: "That email and password do not match, or the account is not confirmed yet.",
        });
      } else {
        router.replace("/admin");
        router.refresh();
        return;
      }
    } else {
      const { error } = await supabase.auth.signUp({ email: email.trim(), password });
      setMessage(
        error
          ? { kind: "error", text: error.message }
          : {
              kind: "info",
              text: "Account created. An existing admin must approve it before you can sign in.",
            },
      );
      if (!error) setMode("in");
    }
    setBusy(false);
  }

  return (
    <form onSubmit={submit} className="mt-10 space-y-5">
      <label className="block text-sm text-mist">
        Email
        <input
          type="email"
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
          autoComplete={mode === "in" ? "current-password" : "new-password"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={field}
        />
      </label>

      {message && (
        <p
          role="status"
          className={`rounded-xl border px-4 py-3 text-sm ${
            message.kind === "error"
              ? "border-berry-light/50 bg-berry/20"
              : "border-gold/40 bg-gold/10 text-gold-light"
          }`}
        >
          {message.text}
        </p>
      )}

      <button type="submit" disabled={busy} className="btn btn-gold w-full disabled:opacity-60">
        {busy ? "One moment…" : mode === "in" ? "Sign in" : "Create account"}
      </button>

      <p className="text-center text-sm text-faint">
        {mode === "in" ? "First time here? " : "Already have an account? "}
        <button
          type="button"
          onClick={() => {
            setMode(mode === "in" ? "up" : "in");
            setMessage(null);
          }}
          className="text-gold-light underline decoration-gold/40 underline-offset-4"
        >
          {mode === "in" ? "Create an account" : "Sign in"}
        </button>
      </p>
    </form>
  );
}
