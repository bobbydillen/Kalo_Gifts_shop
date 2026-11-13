import type { Metadata } from "next";
import Link from "next/link";
import { chatLink, returnMessage } from "@/lib/contact";
import { POLICY_LINKS, sellerLines } from "@/lib/policies";
import { getSettings } from "@/lib/settings-data";

export const metadata: Metadata = {
  title: "Contact us",
  description: "Chat with KALO Gifts on WhatsApp, ask about an order, or start a return.",
};

export default async function ContactPage() {
  const s = await getSettings();
  const hello = chatLink(s, "Hi KALO Gifts, ");
  const help = chatLink(s, returnMessage());
  const seller = sellerLines(s);

  return (
    <div className="mx-auto max-w-3xl px-4 pb-24 pt-12 sm:px-6 lg:pb-32 lg:pt-16">
      <p className="kicker">We are here</p>
      <h1 className="mt-4 text-[clamp(2.5rem,6vw,4.5rem)]">
        Talk to <em>us</em>
      </h1>
      <p className="mt-5 text-lg text-mist">
        Questions about a gift, an order, a return or an exchange? Chat with us and a real person will reply.
      </p>

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        <section className="rounded-2xl border border-hair bg-pine p-6">
          <h2 className="text-2xl">
            Chat on <em>WhatsApp</em>
          </h2>
          <p className="mt-2 text-mist">The quickest way to reach us.</p>
          {hello ? (
            <a href={hello} target="_blank" rel="noopener noreferrer" className="btn btn-gold mt-5">
              Start a chat
            </a>
          ) : (
            <p className="mt-4 text-sm text-faint">WhatsApp chat will be available soon.</p>
          )}
          {s.whatsappNumber && <p className="mt-3 text-sm text-faint">+91 {s.whatsappNumber}</p>}
        </section>

        <section className="rounded-2xl border border-hair bg-pine p-6">
          <h2 className="text-2xl">
            Returns and <em>exchanges</em>
          </h2>
          <p className="mt-2 text-mist">Chat with your order number. We arrange the return by hand.</p>
          {help && (
            <a href={help} target="_blank" rel="noopener noreferrer" className="btn btn-outline mt-5">
              Start a return
            </a>
          )}
          <p className="mt-3 text-sm">
            <Link href="/policies/returns" className="text-gold-light underline underline-offset-4">
              Read the returns policy
            </Link>
          </p>
        </section>
      </div>

      {s.contactEmail && (
        <p className="mt-8 text-mist">
          Prefer email? Write to{" "}
          <a href={`mailto:${s.contactEmail}`} className="text-gold-light underline underline-offset-4">
            {s.contactEmail}
          </a>
          .
        </p>
      )}

      <div className="mt-12 border-t border-hair pt-8 text-sm text-faint">
        <p className="kicker mb-3">The shop</p>
        <p className="text-mist">{seller[0]}</p>
        {seller.slice(1).map((l) => (
          <p key={l}>{l}</p>
        ))}
        {s.grievanceOfficer && <p className="mt-3">Complaints handled by {s.grievanceOfficer}, on the details above.</p>}
      </div>

      <nav aria-label="Policies" className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm">
        {POLICY_LINKS.map((p) => (
          <Link key={p.slug} href={`/policies/${p.slug}`} className="text-gold-light underline underline-offset-4">
            {p.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
