"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/admin", label: "Overview", exact: true },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/settings", label: "Settings", soon: true },
];

export function AdminNav() {
  const path = usePathname();
  return (
    <nav aria-label="Admin" className="flex gap-1 overflow-x-auto lg:flex-col">
      {items.map((item) => {
        const active = item.exact ? path === item.href : path.startsWith(item.href);
        const cls = `flex shrink-0 items-center justify-between gap-3 rounded-xl px-4 py-2.5 text-sm transition-colors ${
          active ? "bg-cream text-night" : "text-mist hover:bg-pine-2 hover:text-cream"
        }`;
        return item.soon ? (
          <span key={item.href} aria-disabled="true" className={`${cls} cursor-not-allowed opacity-50`}>
            {item.label}
            <span className="text-[0.625rem] uppercase tracking-[0.18em]">Soon</span>
          </span>
        ) : (
          <Link key={item.href} href={item.href} aria-current={active ? "page" : undefined} className={cls}>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
