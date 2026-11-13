import { supabaseServer } from "@/lib/supabase/server";

/**
 * The database client for a signed-in admin, or null for anyone else.
 * Used by downloads and actions that sit outside the admin panel's own sign-in check. Only admins
 * can read their own row in `admins`, so finding it proves the caller is one.
 */
export async function adminClient() {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from("admins").select("user_id").eq("user_id", user.id).maybeSingle();
  return data ? supabase : null;
}
