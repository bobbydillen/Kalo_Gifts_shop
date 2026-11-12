"use client";

import type { Session } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";

/** "919876543210" or "+919876543210" -> "+919876543210". */
const withPlus = (phone: string) => (phone.startsWith("+") ? phone : `+${phone}`);

/**
 * The email of a customer who signed in with an emailed code, or null.
 * A password sign-in does not count (the database refuses to show orders to it), so an admin
 * signed in by email and password is not treated as a customer here either. The sign-in method
 * is read from the token's "amr" list, which only the server can set.
 */
function codeSignInEmail(session: Session | null): string | null {
  const email = session?.user?.email;
  if (!email || !session) return null;
  try {
    const payload = JSON.parse(atob(session.access_token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    const amr: { method?: string }[] = Array.isArray(payload.amr) ? payload.amr : [];
    if (amr.length > 0 && !amr.some((a) => a.method === "password")) return email.toLowerCase();
  } catch {
    // unreadable token: treat as not signed in
  }
  return null;
}

export type Customer = { ready: boolean; phone: string | null; email: string | null };

/** Who is signed in as a customer, by emailed code or (later) by phone code. `ready` is false until checked. */
export function useCustomer(): Customer {
  const [state, setState] = useState<Customer>({ ready: false, phone: null, email: null });

  useEffect(() => {
    const supabase = supabaseBrowser();
    let live = true;
    const read = (session: Session | null): Customer => ({
      ready: true,
      phone: session?.user?.phone ? withPlus(session.user.phone) : null,
      email: codeSignInEmail(session),
    });

    supabase.auth.getSession().then(({ data }) => {
      if (live) setState(read(data.session));
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => setState(read(session)));

    return () => {
      live = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return state;
}
