import { NotFoundView } from "@/components/layout/NotFoundView";

export const metadata = { title: "Page not found" };

/** Addresses that match no page at all (the shop's header and footer are not around these). */
export default function NotFound() {
  return (
    <main className="min-h-dvh bg-night text-cream">
      <NotFoundView />
    </main>
  );
}
