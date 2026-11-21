import { createClient } from "@supabase/supabase-js";

/**
 * A database client with the server-only secret key (SUPABASE_SECRET_KEY, from Supabase > Project
 * Settings > API keys > Secret keys). It skips the row rules, so it is used only for the few things
 * the server must do on its own, such as marking an order paid when the payment gateway confirms it.
 * Never import this into anything that runs in the browser.
 */
export function supabaseSecret() {
  const key = process.env.SUPABASE_SECRET_KEY?.trim();
  if (!key) return null;
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
