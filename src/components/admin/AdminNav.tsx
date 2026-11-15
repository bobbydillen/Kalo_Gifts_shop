"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const base = [
  { href: "/admin", label: "Overview", exact: true },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/customers", label: "Customers" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/seo", label: "Search (SEO)" },
  { href: "/admin/settings", label: "Settings" },
];

export function AdminNav({ partner = false }: { partner?: boolean }) {
  const path = usePathname();
  const items = partner ? [...base.slice(0, 4), { href: "/admin/partners", label: "Accounts" }, ...base.slice(4)] : base;
  return (
    <nav aria-label="Admin" className="flex gap-1 overflow-x-auto lg:flex-col">
      {items.map((item) => {
        const active = "exact" in item ? path === item.href : path.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`flex shrink-0 items-center rounded-xl px-4 py-2.5 text-sm transition-colors ${
              active ? "bg-cream text-night" : "text-mist hover:bg-pine-2 hover:text-cream"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
