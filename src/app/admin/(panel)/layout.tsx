import { redirect } from "next/navigation";
import { Suspense, type ReactNode } from "react";
import { signOut } from "@/app/admin/actions";
import { Shell } from "@/components/admin/Shell";
import { supabaseServer } from "@/lib/supabase/server";

/**
 * Everything under /admin except the sign-in page. Only signed-in admins get past this.
 * Reading who is signed in is request-time work, so it sits inside Suspense.
 */
export default function PanelLayout({ children }: LayoutProps<"/admin">) {
  return (
    <Suspense fallback={<p className="p-8 text-faint">Loading…</p>}>
      <Gate>{children}</Gate>
    </Suspense>
  );
}

async function Gate({ children }: { children: ReactNode }) {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");

  // Only admins can read their own row in `admins`; everyone else gets nothing back.
  const { data: admin } = await supabase.from("admins").select("user_id").eq("user_id", user.id).maybeSingle();

  if (!admin) {
    return (
      <div className="grid flex-1 place-items-center px-4 py-16 text-center">
        <div className="max-w-md">
          <p className="kicker">Almost there</p>
          <h1 className="mt-4 text-4xl">
            Waiting for <em>approval</em>
          </h1>
          <p className="mt-5 text-mist">
            You are signed in as <span className="text-cream">{user.email}</span>, but this account has not been approved
            as an admin yet. Ask an existing admin to approve it.
          </p>
          <form action={signOut} className="mt-8">
            <button className="btn btn-outline">Sign out</button>
          </form>
        </div>
      </div>
    );
  }

  return <Shell email={user.email ?? ""}>{children}</Shell>;
}
