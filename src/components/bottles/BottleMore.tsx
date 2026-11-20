import Link from "next/link";
import { bottleShots, bottleStyle, designKey, designName } from "@/lib/bottles";
import { formatPrice, type Product } from "@/lib/catalog";
import { studioBackground } from "@/lib/studio";

const designOf = designName;

/**
 * Two small shelves under a bottle: the same design on other bottle styles ("Also comes on"), and the
 * other designs on this bottle style.
 */
export function BottleMore({ product, all }: { product: Product; all: Product[] }) {
  const bottles = all.filter((p) => p.slug !== product.slug && p.category === "bottle");
  const sameDesign = bottles.filter((p) => designKey(p) === designKey(product));
  const sameStyle = bottles.filter((p) => p.designGroup === product.designGroup && p.christmas === product.christmas);
  const style = bottleStyle(product.designGroup);

  return (
    <div className="space-y-10">
      {sameDesign.length > 0 && <Strip title="Also comes on" items={sameDesign} label={(p) => bottleStyle(p.designGroup)?.name ?? ""} />}
      {sameStyle.length > 0 && (
        <Strip title={`More designs on the ${style?.name ?? "bottle"}`} items={sameStyle} label={(p) => designOf(p)} />
      )}
    </div>
  );
}

function Strip({ title, items, label }: { title: string; items: Product[]; label: (p: Product) => string }) {
  return (
    <section aria-label={title}>
      <h2 className="font-sans text-sm text-mist">{title}</h2>
      <div className="no-scrollbar -mx-4 mt-3 flex gap-3 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        {items.map((p) => (
          <Link
            key={p.slug}
            href={`/product/${p.slug}`}
            scroll={false}
            className="group w-28 shrink-0 rounded-2xl border border-hair-2 p-2 text-center transition-colors hover:border-gold"
          >
            <span className="block aspect-[600/900] overflow-hidden rounded-xl" style={{ background: studioBackground(p.colours[0]?.hex) }}>
              {/* eslint-disable-next-line @next/next/no-img-element -- small cut-out */}
              <img src={bottleShots(p).cut} alt="" loading="lazy" className="size-full object-contain p-1 transition-transform duration-500 ease-glide group-hover:-translate-y-1" />
            </span>
            <span className="mt-2 line-clamp-2 block text-xs leading-snug text-cream">{label(p)}</span>
            <span className="block text-[0.6875rem] text-faint">{formatPrice(p.price)}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
