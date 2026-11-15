import Link from "next/link";
import { ConfirmButton, MonthStartForm } from "@/components/admin/PartnerForms";
import { inr, todayIst } from "@/lib/partner-data";
import { loadChecks, partnerContext } from "@/lib/partners";
import { PartnersOnly } from "@/components/admin/PartnersOnly";

export const metadata = { title: "Month-end check" };

/** Month starts (YYYY-MM-01) of the last six finished months, newest first. */
function finishedMonths() {
  const [y, m] = todayIst().split("-").map(Number);
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(Date.UTC(y, m - 2 - i, 1));
    return d.toISOString().slice(0, 8) + "01";
  });
}

export default async function MonthPage() {
  const ctx = await partnerContext();
  if (!ctx) return <PartnersOnly />;
  const checks = await loadChecks(ctx.supabase);
  const name = (id: string) => ctx.partners.find((p) => p.user_id === id)?.display_name ?? "";

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <Link href="/admin/partners" className="text-sm text-mist underline underline-offset-4">
          ← Accounts
        </Link>
        <h1 className="mt-3 text-4xl">
          Month-end <em>check</em>
        </h1>
        <ol className="mt-4 list-decimal space-y-1 pl-5 text-sm text-mist">
          <li>On the 1st, open your bank statement and note the balance on the last day of the month.</li>
          <li>Type it below. The app shows whether it matches its own balance.</li>
          <li>If it differs, add the missing entries (a &ldquo;Correction&rdquo; category helps) and check again.</li>
          <li>When the numbers match, you both tap Confirm. The month is then locked.</li>
        </ol>
      </div>

      {finishedMonths().map((month) => {
        const check = checks.find((c) => c.month === month);
        const locked = !!check && check.confirmed.length >= 2;
        const diff = check ? check.real_balance - check.app_balance : 0;
        const mine = !!check && check.confirmed.includes(ctx.me.user_id);
        return (
          <section key={month} className="rounded-2xl border border-hair bg-pine p-5">
            <h2 className="text-xl">
              {new Date(month + "T00:00:00Z").toLocaleDateString("en-IN", { month: "long", year: "numeric", timeZone: "UTC" })}
              {locked && <span className="ml-3 rounded-full bg-gold px-3 py-0.5 text-xs text-night">Locked</span>}
            </h2>
            {check && (
              <div className="mt-3 space-y-1 text-sm">
                <p>Bank statement: {inr(check.real_balance)}</p>
                <p>App balance: {inr(check.app_balance)}</p>
                <p className={Math.abs(diff) < 0.005 ? "text-gold" : "text-berry-light"}>
                  {Math.abs(diff) < 0.005 ? "They match." : `Difference: ${inr(diff)}. Find the missing entries before confirming.`}
                </p>
                <p className="text-mist">
                  Confirmed by: {check.confirmed.length ? check.confirmed.map(name).join(", ") : "nobody yet"}
                </p>
              </div>
            )}
            {!locked && (
              <div className="mt-4 space-y-4">
                <MonthStartForm month={month} />
                {check && !mine && <ConfirmButton month={month} />}
                {check && mine && <p className="text-sm text-mist">You confirmed. Waiting for the other person.</p>}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
