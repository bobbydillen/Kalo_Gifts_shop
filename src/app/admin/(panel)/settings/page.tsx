import { SettingsForm } from "@/components/admin/SettingsForm";
import { parseSettings } from "@/lib/settings";
import { supabaseServer } from "@/lib/supabase/server";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const supabase = await supabaseServer();
  const { data, error } = await supabase.from("site_settings").select("key, value");

  return (
    <div className="max-w-3xl">
      <h1 className="text-5xl">
        Sett<em>ings</em>
      </h1>
      {error ? (
        <p className="mt-8 rounded-2xl border border-berry-light/50 bg-berry/20 p-5">
          The settings could not be loaded. Try refreshing the page.
        </p>
      ) : (
        <div className="mt-8">
          <SettingsForm initial={parseSettings(data ?? [])} />
        </div>
      )}
    </div>
  );
}
