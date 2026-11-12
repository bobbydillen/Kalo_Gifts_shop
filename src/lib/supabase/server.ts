import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { connection } from "next/server";

/**
 * Supabase client for server components and server actions. It acts as whoever is
 * signed in (through their cookies), so the database's row level security rules decide
 * what it may see: an admin sees everything, anyone else only the public shop.
 */
export async function supabaseServer() {
  // Who is signed in is only known per request, so never prepare this ahead of time.
  await connection();
  const store = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => store.getAll(),
        setAll(list) {
          try {
            list.forEach(({ name, value, options }) => store.set(name, value, options));
          } catch {
            // called from a server component, which cannot set cookies; proxy.ts refreshes them
          }
        },
      },
    },
  );
}
