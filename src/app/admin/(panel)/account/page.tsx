import { PasswordForm, UsernameForm } from "@/components/admin/PartnerForms";
import { partnerContext } from "@/lib/partners";
import { supabaseServer } from "@/lib/supabase/server";

export const metadata = { title: "My account" };

export default async function AccountPage() {
  const ctx = await partnerContext();
  const supabase = ctx?.supabase ?? (await supabaseServer());
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="max-w-md space-y-10">
      <h1 className="text-4xl">
        My <em>account</em>
      </h1>
      <p className="text-sm text-mist">Signed in as {ctx ? `${ctx.me.display_name} (${ctx.me.username})` : user?.email}.</p>
      {ctx && (
        <section>
          <h2 className="mb-3 text-xl">Username</h2>
          <UsernameForm current={ctx.me.username} changed={ctx.me.username_changed} />
        </section>
      )}
      <section>
        <h2 className="mb-3 text-xl">Password</h2>
        <PasswordForm email={user?.email ?? ""} />
      </section>
    </div>
  );
}
