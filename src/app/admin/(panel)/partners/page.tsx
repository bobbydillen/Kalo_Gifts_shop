import Link from "next/link";
import { PartnersOnly } from "@/components/admin/PartnersOnly";
import { BillButton, EditForm, EntryForm, VoidForm } from "@/components/admin/PartnerForms";
import { CATEGORIES, KINDS, evenUp, inr, kindLabel, summarise, todayIst } from "@/lib/partner-data";
import { loadEntries, partnerContext } from "@/lib/partners";

export const metadata = { title: "Accounts" };

export default async function PartnersPage({ searchParams }: PageProps<"/admin/partners">) {
  const ctx = await partnerContext();
  if (!ctx) return <PartnersOnly />;
  const sp = await searchParams;
  const month = typeof sp.m === "string" && /^\d{4}-\d{2}$/.test(sp.m) ? sp.m : "";
  const category = typeof sp.c === "string" && CATEGORIES.includes(sp.c) ? sp.c : "";
  const who = typeof sp.p === "string" && ctx.partners.some((p) => p.user_id === sp.p) ? sp.p : "";
  const kind = typeof sp.k === "string" && KINDS.some((k) => k.id === sp.k) ? sp.k : "";
  const showVoided = sp.v === "1";

  const entries = await loadEntries(ctx.supabase);
  const summary = summarise(entries, ctx.partners);
  const settle = evenUp(summary, ctx.partners);
  const name = (id: string | null) => ctx.partners.find((p) => p.user_id === id)?.display_name ?? "";

  const shown = entries.filter(
    (e) =>
      (showVoided || !e.voided_at) &&
      (!month || e.entry_date.startsWith(month)) &&
      (!category || e.category === category) &&
      (!who || e.partner_id === who || e.entered_by === who) &&
      (!kind || e.kind === kind),
  );

  const params = { m: month, c: category, p: who, k: kind, v: showVoided ? "1" : "" };
  const exportQuery = new URLSearchParams(Object.entries(params).filter(([, v]) => v)).toString();
  const months = [...new Set(entries.map((e) => e.entry_date.slice(0, 7)))];
  const selectClass = "rounded-xl border border-hair-2 bg-pine px-3 py-2 text-sm text-cream";

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-4xl">
          <em>Accounts</em>
        </h1>
        <nav className="flex gap-4 text-sm">
          <Link href="/admin/partners/month" className="underline underline-offset-4 hover:text-gold">
            Month-end check
          </Link>
          <Link href="/admin/account" className="underline underline-offset-4 hover:text-gold">
            My account
          </Link>
        </nav>
      </div>

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-hair bg-pine p-5">
          <p className="text-sm text-mist">Bank balance now</p>
          <p className="mt-2 font-serif text-3xl">{inr(summary.bank)}</p>
        </div>
        {ctx.partners.map((p) => (
          <div key={p.user_id} className="rounded-2xl border border-hair bg-pine p-5">
            <p className="text-sm text-mist">{p.display_name} has put in</p>
            <p className="mt-2 font-serif text-3xl">{inr(summary.capital.get(p.user_id) ?? 0)}</p>
          </div>
        ))}
      </section>
      <p className="rounded-2xl border border-gold/40 bg-gold/10 px-5 py-4 text-sm">
        <strong>Evening up: </strong>
        {ctx.partners.length < 2 ? "Waiting for the second person to join." : settle?.text}{" "}
        <span className="text-mist">Total expenses so far: {inr(summary.expenses)}.</span>
      </p>

      <EntryForm partners={ctx.partners} me={ctx.me.user_id} today={todayIst()} />

      <section>
        <h2 className="text-2xl">Ledger</h2>
        <form className="mt-4 flex flex-wrap items-center gap-2" method="get">
          <select name="m" defaultValue={month} className={selectClass} aria-label="Month">
            <option value="">All months</option>
            {months.map((m) => (
              <option key={m}>{m}</option>
            ))}
          </select>
          <select name="k" defaultValue={kind} className={selectClass} aria-label="Type">
            <option value="">All types</option>
            {KINDS.map((k) => (
              <option key={k.id} value={k.id}>
                {k.label}
              </option>
            ))}
          </select>
          <select name="c" defaultValue={category} className={selectClass} aria-label="Category">
            <option value="">All categories</option>
            {CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
          <select name="p" defaultValue={who} className={selectClass} aria-label="Who paid">
            <option value="">Everyone</option>
            {ctx.partners.map((p) => (
              <option key={p.user_id} value={p.user_id}>
                {p.display_name}
              </option>
            ))}
          </select>
          <label className="flex items-center gap-1.5 text-sm text-mist">
            <input type="checkbox" name="v" value="1" defaultChecked={showVoided} /> Show voided
          </label>
          <button className="chip">Filter</button>
          <a href={`/admin/export/ledger${exportQuery ? `?${exportQuery}` : ""}`} className="chip">
            Download Excel
          </a>
        </form>

        <div className="mt-4 overflow-x-auto rounded-2xl border border-hair">
          <table className="w-full min-w-[44rem] text-left text-sm">
            <thead className="bg-pine text-mist">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">What</th>
                <th className="px-4 py-3">Who paid</th>
                <th className="px-4 py-3">Category / note</th>
                <th className="px-4 py-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {shown.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-faint">
                    Nothing here yet.
                  </td>
                </tr>
              )}
              {shown.map((e) => {
                const plus = e.kind === "put_in" || e.kind === "money_in";
                return (
                  <tr key={e.id} className={`border-t border-hair align-top ${e.voided_at ? "opacity-50" : ""}`}>
                    <td className="whitespace-nowrap px-4 py-3">{e.entry_date}</td>
                    <td className="px-4 py-3">
                      <span className={e.voided_at ? "line-through" : ""}>{kindLabel(e.kind)}</span>
                    </td>
                    <td className="px-4 py-3">
                      {name(e.partner_id) || "Bank"}
                      {e.entered_by !== e.partner_id && (
                        <span className="block text-xs text-faint">entered by {name(e.entered_by)}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {e.category}
                      {e.note && <span className="block text-xs text-mist">{e.note}</span>}
                      {e.voided_at && <span className="block text-xs text-berry-light">{e.void_reason === "Edited" ? "Replaced by an edited entry" : `Voided: ${e.void_reason}`}</span>}
                      {e.replaces && !e.voided_at && <span className="block text-xs text-faint">Edited</span>}
                      <div className="mt-1 flex gap-3">
                        {e.bill_path && <BillButton path={e.bill_path} />}
                        {!e.voided_at && <EditForm entry={e} partners={ctx.partners} />}
                        {!e.voided_at && <VoidForm id={e.id} />}
                      </div>
                    </td>
                    <td className={`whitespace-nowrap px-4 py-3 text-right ${e.voided_at ? "line-through" : plus ? "text-gold" : ""}`}>
                      {plus ? "+" : "−"}
                      {inr(e.amount).replace("−", "")}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-faint">
          Entries are never deleted. Editing keeps the old version in the history (struck through); voiding removes a wrong entry with a reason. &ldquo;Paid personally&rdquo; counts
          towards the payer&rsquo;s share but does not change the bank balance.
        </p>
      </section>
    </div>
  );
}
