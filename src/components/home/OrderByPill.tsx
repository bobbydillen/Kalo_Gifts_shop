"use client";

import Link from "next/link";
import { seasonal } from "@/lib/site";
import { timeLeft, useNow } from "@/lib/use-now";

const orderByLabel = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  timeZone: "Asia/Kolkata",
}).format(new Date(seasonal.orderByDate));

/**
 * Sticky reminder of the last day to order for Christmas delivery.
 * Shows only while the switch is on and the date is still ahead.
 */
export function OrderByPill() {
  const now = useNow();
  const t = timeLeft(now, seasonal.orderByDate);
  if (!seasonal.orderByBanner || !t.ready || t.over) return null;

  const left = t.days > 0 ? `${t.days}d ${t.hours}h left` : `${t.hours}h ${t.mins}m left`;

  return (
    <Link
      href="/#gifts"
      className="toast-pop fixed inset-x-3 bottom-3 z-30 flex items-center justify-between gap-5 rounded-full border border-hair-2 bg-pine/85 py-2.5 pl-5 pr-2.5 text-sm shadow-[0_20px_40px_-14px_rgba(0,0,0,0.8)] backdrop-blur-md transition-[transform,border-color] duration-500 ease-bounce hover:-translate-y-1 hover:border-gold active:scale-[0.97] sm:inset-x-auto sm:bottom-5 sm:right-5"
    >
      <span className="leading-tight">
        <span className="block text-[0.6875rem] uppercase tracking-[0.18em] text-gold-light">
          Order by {orderByLabel}
        </span>
        <span className="text-mist">for delivery before Christmas</span>
      </span>
      <span className="rounded-full bg-gold-light px-3.5 py-1.5 text-xs font-semibold tabular-nums text-night">
        {left}
      </span>
    </Link>
  );
}
