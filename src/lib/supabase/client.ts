import { createBrowserClient } from "@supabase/ssr";

/** Supabase client for the browser. Uses the publishable key, which is meant to be public. */
export const supabaseBrowser = () =>
  createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
