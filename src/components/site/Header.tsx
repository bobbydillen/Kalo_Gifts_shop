"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useBag } from "@/components/bag/BagProvider";
import { Marquee } from "@/components/ui/Marquee";
import { ScrollRibbon } from "@/components/ui/ScrollRibbon";
import { useSettings } from "@/components/settings/SettingsProvider";
import { announcements, navLinksFor } from "@/lib/site";

export function Header() {
  const [open, setOpen] = useState(false);
  const { count, setOpen: openBag } = useBag();
  const settings = useSettings();
  const navLinks = navLinksFor(settings.christmasHero, settings.customerLogin);

  // Close the phone menu with Escape, and stop the page scrolling behind it.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <div className="border-b border-hair bg-night py-2 text-[0.6875rem] uppercase tracking-[0.24em] text-gold-light">
        <Marquee seconds={45}>
          {announcements.map((text) => (
            <span key={text} className="flex items-center gap-10 pr-10">
              {text}
              <span aria-hidden="true" className="text-gold">
                ✦
              </span>
            </span>
          ))}
        </Marquee>
      </div>

      <header className="sticky top-0 z-40 border-b border-hair bg-night/70 backdrop-blur-xl backdrop-saturate-150">
        <div className="mx-auto grid h-16 max-w-7xl grid-cols-[1fr_auto_1fr] items-center gap-4 px-4 sm:px-6 lg:h-20">
          <nav aria-label="Main" className="hidden items-center gap-8 lg:flex">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`group relative py-2 text-sm transition-colors duration-300 hover:text-cream ${link.seasonal ? "text-gold-light" : "text-mist"}`}
              >
                {link.label}
                <span className="absolute inset-x-0 bottom-0 h-px origin-left scale-x-0 bg-gold transition-transform duration-500 ease-glide group-hover:scale-x-100" />
              </Link>
            ))}
          </nav>

          <button
            type="button"
            aria-expanded={open}
            aria-controls="phone-menu"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((v) => !v)}
            className="-ml-2 grid size-11 place-items-center justify-self-start rounded-full transition-transform duration-300 ease-bounce active:scale-90 lg:hidden"
          >
            <span className="relative block h-3 w-6">
              <span
                className={`absolute inset-x-0 top-0 h-px bg-cream transition-transform duration-500 ease-glide ${open ? "translate-y-[6px] rotate-45" : ""}`}
              />
              <span
                className={`absolute inset-x-0 bottom-0 h-px bg-cream transition-transform duration-500 ease-glide ${open ? "-translate-y-[5px] -rotate-45" : ""}`}
              />
            </span>
          </button>

          <Link
            href="/"
            aria-label="KALO Gifts home"
            className="group flex items-center gap-3 justify-self-center"
          >
            <Image
              src="/logo/kalo-badge-96.webp"
              alt=""
              width={44}
              height={44}
              priority
              className="size-10 rounded-full ring-1 ring-gold/40 transition-transform duration-700 ease-bounce group-hover:rotate-[-8deg] group-hover:scale-110 lg:size-11"
            />
            <span className="pl-[0.2em] font-serif text-2xl leading-none tracking-[0.2em] lg:text-3xl">
              KALO
            </span>
          </Link>

          <button
            type="button"
            aria-label={`Bag, ${count} ${count === 1 ? "item" : "items"}`}
            aria-haspopup="dialog"
            onClick={() => openBag(true)}
            className="flex items-center gap-2.5 justify-self-end rounded-full border border-hair-2 py-1.5 pl-4 pr-1.5 text-[0.8125rem] tracking-[0.06em] transition-[transform,border-color] duration-500 ease-bounce hover:border-gold active:scale-95"
          >
            Bag
            <span
              key={count}
              className={`grid size-7 place-items-center rounded-full bg-gold-light text-xs font-semibold text-night ${count ? "bump" : ""}`}
            >
              {count}
            </span>
          </button>
        </div>
        <ScrollRibbon />
      </header>

      {/* Phone menu */}
      <div
        id="phone-menu"
        inert={!open}
        className={`fixed inset-0 z-30 bg-night/95 backdrop-blur-xl transition-[opacity,visibility] duration-500 lg:hidden ${
          open ? "visible opacity-100" : "invisible opacity-0"
        }`}
      >
        <nav
          aria-label="Main"
          className="flex h-full flex-col justify-center gap-2 px-8 pt-24"
        >
          {navLinks.map((link, i) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              style={{ transitionDelay: open ? `${120 + i * 70}ms` : "0ms" }}
              className={`border-b border-hair py-5 font-serif text-4xl transition-[opacity,transform] duration-700 ease-glide ${
                open ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </>
  );
}
