import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { chatLink, returnMessage } from "@/lib/contact";
import { getPolicy, LAST_UPDATED, POLICY_LINKS, sellerLines } from "@/lib/policies";
import { getSettings } from "@/lib/settings-data";

export function generateStaticParams() {
  return POLICY_LINKS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<"/policies/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const policy = getPolicy(slug, await getSettings());
  return policy ? { title: policy.title, description: policy.intro } : {};
}

export default async function PolicyPage({ params }: PageProps<"/policies/[slug]">) {
  const { slug } = await params;
  const settings = await getSettings();
  const policy = getPolicy(slug, settings);
  if (!policy) notFound();
  const chat = slug === "returns" ? chatLink(settings, returnMessage()) : null;
  const seller = sellerLines(settings);

  return (
    <div className="mx-auto max-w-3xl px-4 pb-24 pt-12 sm:px-6 lg:pb-32 lg:pt-16">
      <p className="kicker">Policies</p>
      <h1 className="mt-4 text-[clamp(2.5rem,6vw,4.5rem)]">
        {policy.heading[0]} <em>{policy.heading[1]}</em>
      </h1>
      <p className="mt-5 text-lg text-mist">{policy.intro}</p>
      <p className="mt-2 text-sm text-faint">Last updated {LAST_UPDATED}</p>

      {chat && (
        <div className="mt-8 rounded-2xl border border-gold/40 bg-pine p-6">
          <p className="font-serif text-2xl">
            Start a <em>return</em> by chatting with us
          </p>
          <p className="mt-2 text-mist">Tell us your order number and what went wrong. We will arrange the rest by hand.</p>
          <a href={chat} target="_blank" rel="noopener noreferrer" className="btn btn-gold mt-5">
            Chat with us on WhatsApp
          </a>
        </div>
      )}

      <div className="mt-12 space-y-10">
        {policy.sections.map((section) => (
          <section key={section.title} aria-labelledby={`h-${section.title}`}>
            <h2 id={`h-${section.title}`} className="text-3xl">
              {section.title}
            </h2>
            <div className="mt-4 space-y-4 text-mist">
              {section.body.map((block, i) =>
                typeof block === "string" ? (
                  <p key={i}>{block}</p>
                ) : (
                  <ul key={i} className="list-disc space-y-2 pl-5 marker:text-gold">
                    {block.list.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                ),
              )}
            </div>
          </section>
        ))}
      </div>

      <div className="mt-14 border-t border-hair pt-8 text-sm text-faint">
        <p className="text-mist">{seller[0]}</p>
        {seller.slice(1).map((l) => (
          <p key={l}>{l}</p>
        ))}
      </div>

      <nav aria-label="Other policies" className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm">
        {POLICY_LINKS.filter((p) => p.slug !== slug).map((p) => (
          <Link key={p.slug} href={`/policies/${p.slug}`} className="text-gold-light underline underline-offset-4">
            {p.label}
          </Link>
        ))}
        <Link href="/contact" className="text-gold-light underline underline-offset-4">
          Contact us
        </Link>
      </nav>
    </div>
  );
}
