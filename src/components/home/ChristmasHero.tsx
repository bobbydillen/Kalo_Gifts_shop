import type { ReactNode } from "react";
import { Countdown } from "@/components/home/Countdown";
import { HeroGift } from "@/components/home/HeroGift";
import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { Rise } from "@/components/ui/Rise";

const madeFor = ["your family", "a dear friend", "your church", "Secret Santa"];

type EnterProps = { top: boolean; delay?: number; className?: string; children: ReactNode };

/** On load at the top of a page, on scroll when used lower down. */
function Enter({ top, delay, className, children }: EnterProps) {
  return top ? (
    <Rise delay={delay} className={className}>
      {children}
    </Rise>
  ) : (
    <Reveal delay={delay} className={className}>
      {children}
    </Reveal>
  );
}

/**
 * The Christmas block: big greeting, the gift, and the countdown.
 *
 * placement "page-top"  opens the /christmas page (main heading, animates on load)
 * placement "section"   sits lower on the home page (animates when scrolled to)
 */
export function ChristmasHero({ placement }: { placement: "page-top" | "section" }) {
  const top = placement === "page-top";
  const Heading = top ? "h1" : "h2";
  return (
    <section id="christmas" className="relative overflow-hidden">
      <div
        aria-hidden="true"
        className="absolute left-1/2 top-[62%] size-[110vmin] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgb(27_68_54/0.7),transparent_62%)] lg:left-[70%] lg:top-1/2"
      />

      <div className="relative mx-auto grid max-w-7xl items-center gap-x-8 gap-y-6 px-4 pb-16 pt-14 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:pb-24 lg:pt-20">
        <div>
          <Enter top={top}>
            <p className="kicker">The Christmas edit · 2026</p>
          </Enter>

          <Enter top={top} delay={90}>
            <Heading className="mt-6 text-[clamp(3.5rem,11vw,9rem)] leading-[0.86]">
              Merry
              <em className="block pl-[0.5em]">Christmas</em>
              <span className="mt-4 block pl-[0.15em] text-[0.22em] italic leading-none tracking-normal text-mist">
                from <span className="not-italic tracking-[0.2em] text-cream">KALO</span> Gifts
              </span>
            </Heading>
          </Enter>

          <Enter top={top} delay={180}>
            <p className="mt-8 flex flex-wrap gap-x-[0.35em] font-serif text-[clamp(1.4rem,2.4vw,2rem)] leading-tight">
              Made for
              <span className="rotator italic text-gold-light">
                <span>
                  {[...madeFor, madeFor[0]].map((who, i) => (
                    <span key={i} aria-hidden={i === madeFor.length}>
                      {who}
                    </span>
                  ))}
                </span>
              </span>
            </p>
            <p className="mt-4 max-w-md text-lg text-mist">
              Hampers, cosy layers and small keepsakes, wrapped and ready for the people you love.
            </p>
          </Enter>

          <Enter top={top} delay={270}>
            <div className="mt-9 flex flex-wrap gap-4">
              <Button href={top ? "/christmas#gifts" : "/christmas"} arrow>
                {top ? "Shop the edit" : "Shop Christmas gifts"}
              </Button>
              <Button href={top ? "/christmas#loved-ones" : "/#loved-ones"} variant="outline">
                Find a gift
              </Button>
            </div>
          </Enter>

          <Enter top={top} delay={360} className="mt-10">
            <Countdown />
          </Enter>
        </div>

        <Enter top={top} delay={200} className="justify-self-center">
          <HeroGift />
        </Enter>
      </div>
    </section>
  );
}
