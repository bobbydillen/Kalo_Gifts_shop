import Link from "next/link";

/** The "page not found" page: a short note and the ways back into the shop. */
export function NotFoundView() {
  return (
    <section className="mx-auto max-w-2xl px-4 py-28 text-center sm:px-6 lg:py-40">
      <p className="kicker">Page not found</p>
      <h1 className="mt-6 text-[clamp(2.75rem,7vw,5rem)]">
        This one got <em>away</em>
      </h1>
      <p className="mx-auto mt-6 max-w-md text-lg text-mist">
        The page may have moved, or the gift is no longer in the shop. Everything we have is a tap away.
      </p>
      <div className="mt-10 flex flex-wrap justify-center gap-3">
        <Link href="/gifts" className="btn btn-gold">
          See all gifts
        </Link>
        <Link href="/" className="btn btn-outline">
          Home
        </Link>
      </div>
    </section>
  );
}
