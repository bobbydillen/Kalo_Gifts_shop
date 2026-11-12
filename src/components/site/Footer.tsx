import Image from "next/image";
import Link from "next/link";
import { getSettings } from "@/lib/settings-data";
import { footerLinksFor, site } from "@/lib/site";

export async function Footer() {
  const settings = await getSettings();
  const footerLinks = footerLinksFor(settings.christmasHero, settings.customerLogin);

  return (
    <footer className="border-t border-hair bg-pine">
      <div className="mx-auto grid max-w-7xl gap-12 px-4 py-16 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr] lg:py-20">
        <div>
          <div className="flex items-center gap-4">
            <Image
              src="/logo/kalo-badge-192.webp"
              alt=""
              width={72}
              height={72}
              className="size-[72px] rounded-full ring-1 ring-gold/40"
            />
            <div>
              <p className="pl-[0.2em] font-serif text-3xl leading-none tracking-[0.2em]">KALO</p>
              <p className="mt-1 font-serif text-lg italic text-gold-light">Gifts</p>
            </div>
          </div>
          <p className="mt-6 max-w-sm text-mist">{site.description}</p>
        </div>

        <nav aria-label="Footer">
          <p className="kicker mb-5">Explore</p>
          <ul className="space-y-3">
            {footerLinks.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="text-mist transition-colors hover:text-gold-light">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <p className="kicker mb-5">Made with heart</p>
          <p className="font-serif text-2xl leading-snug">
            Every piece carries a message worth <em className="text-gold-light">sharing</em>.
          </p>
        </div>
      </div>

      <div className="border-t border-hair">
        <p className="mx-auto max-w-7xl px-4 py-6 text-xs tracking-wide text-faint sm:px-6">
          © {site.name}. {site.tagline}
        </p>
      </div>
    </footer>
  );
}
