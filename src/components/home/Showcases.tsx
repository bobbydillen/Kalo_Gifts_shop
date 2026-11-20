import { CurvedShelf } from "@/components/bottles/CurvedShelf";
import { FrameWall } from "@/components/frames/FrameWall";
import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { BOTTLE_STYLES } from "@/lib/bottles";
import type { Product } from "@/lib/catalog";
import type { ReactNode } from "react";

/** Takes products from each group in turn (one of each, then the next of each…), up to `max`. */
function interleave(groups: Product[][], max: number): Product[] {
  const out: Product[] = [];
  for (let i = 0; out.length < max && groups.some((g) => g[i]); i++) {
    for (const g of groups) if (g[i] && out.length < max) out.push(g[i]);
  }
  return out;
}

function Heading({ index, kicker, title, href, cta }: { index: number; kicker: string; title: ReactNode; href: string; cta: string }) {
  return (
    <Reveal>
      <p className="kicker">
        (0{index}) — {kicker}
      </p>
      <div className="mt-5 flex flex-wrap items-end justify-between gap-6">
        <h2 className="max-w-3xl text-[clamp(2.25rem,5.5vw,4.5rem)]">{title}</h2>
        <Button href={href} variant="outline" arrow>
          {cta}
        </Button>
      </div>
    </Reveal>
  );
}

/** The bottles on the home page: one curved shelf with a mix of every bottle style. */
export function BottleShowcase({ index, items }: { index: number; items: Product[] }) {
  const mix = interleave(
    BOTTLE_STYLES.map((s) => items.filter((p) => p.designGroup === s.id && !p.christmas)),
    14,
  );
  if (mix.length === 0) return null;
  return (
    <section id="bottles" className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:py-32">
      <Heading index={index} kicker="The Bottle Bar" title={<>A verse to <em>sip</em> by</>} href="/gifts/bottles" cta="See all bottles" />
      <div className="relative -mx-4 mt-6 overflow-hidden sm:-mx-6">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_55%_60%_at_50%_35%,rgba(242,222,174,0.14),transparent_70%)]" />
        <CurvedShelf items={mix.map((product) => ({ product }))} />
      </div>
    </section>
  );
}

/** The verse frames on the home page: the gallery wall. */
export function FrameShowcase({ index, items }: { index: number; items: Product[] }) {
  if (items.length === 0) return null;
  return (
    <section id="frames" className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:py-32">
      <Heading index={index} kicker="The gallery wall" title={<>Words to <em>hang</em> at home</>} href="/gifts/photo-frames" cta="See all frames" />
      <div className="relative -mx-4 mt-8 overflow-hidden bg-[linear-gradient(180deg,#0f241c,#0b1d16_70%)] py-6 sm:-mx-6 lg:rounded-[28px]">
        <FrameWall items={items} />
      </div>
    </section>
  );
}
