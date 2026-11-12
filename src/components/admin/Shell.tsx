import Link from "next/link";
import type { ReactNode } from "react";
import { signOut } from "@/app/admin/actions";
import { AdminNav } from "@/components/admin/AdminNav";

/** Frame around every signed-in admin screen. */
export function Shell({ email, children }: { email: string; children: ReactNode }) {
  return (
    <div className="flex flex-1 flex-col lg:flex-row">
      <aside className="border-b border-hair bg-pine px-4 py-4 lg:w-64 lg:shrink-0 lg:border-b-0 lg:border-r lg:py-8">
        <div className="mb-4 flex items-center justify-between gap-4 lg:mb-8 lg:block">
          <Link href="/admin" className="font-serif text-2xl tracking-[0.18em]">
            KALO <span className="text-xs tracking-[0.2em] text-gold">ADMIN</span>
          </Link>
          <form action={signOut} className="lg:hidden">
            <button className="text-sm text-faint underline underline-offset-4 hover:text-cream">Sign out</button>
          </form>
        </div>
        <AdminNav />
        <div className="mt-10 hidden border-t border-hair pt-5 text-sm text-faint lg:block">
          <p className="truncate" title={email}>
            {email}
          </p>
          <form action={signOut} className="mt-2">
            <button className="underline underline-offset-4 hover:text-cream">Sign out</button>
          </form>
          <Link href="/" className="mt-4 block underline underline-offset-4 hover:text-cream">
            View the shop
          </Link>
        </div>
      </aside>

      <div className="min-w-0 flex-1 px-4 py-8 sm:px-8 lg:py-10">{children}</div>
    </div>
  );
}
