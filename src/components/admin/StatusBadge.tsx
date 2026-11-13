import { statusLabel } from "@/lib/admin";

const tone: Record<string, string> = {
  new: "border-gold bg-gold/15 text-gold-light",
  confirmed: "border-cream/40 text-cream",
  packing: "border-pine-3 bg-pine-3/60 text-cream",
  shipped: "border-gold-deep bg-gold-deep/25 text-gold-light",
  delivered: "border-emerald-400/40 bg-emerald-400/10 text-emerald-200",
  cancelled: "border-berry-light/50 bg-berry/20 text-cream",
  return_arranged: "border-gold/60 text-gold-light",
  returned: "border-hair-2 bg-pine-3/40 text-mist",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-block whitespace-nowrap rounded-full border px-3 py-1 text-[0.6875rem] uppercase tracking-[0.14em] ${
        tone[status] ?? "border-hair-2 text-mist"
      }`}
    >
      {statusLabel(status)}
    </span>
  );
}
