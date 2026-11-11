import { HeroLogo } from "@/components/home/HeroLogo";
import { Button } from "@/components/ui/Button";
import { Rise } from "@/components/ui/Rise";
import { seasonal } from "@/lib/site";

/**
 * Top of the home page, all year: the KALO logo and the brand line.
 * The logo plays its intro here on every load, except right after the loading
 * screen has played it (see HeroLogo).
 */
export function LogoHero() {
  return (
    <section className="relative overflow-hidden">
      <div
        aria-hidden="true"
        className="absolute left-1/2 top-[68%] size-[100vmin] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgb(27_68_54/0.75),transparent_62%)] lg:left-[72%] lg:top-1/2"
      />

      <div className="relative mx-auto grid max-w-7xl items-center gap-x-10 gap-y-12 px-4 pb-20 pt-14 sm:px-6 lg:grid-cols-[1.1fr_1fr] lg:pb-28 lg:pt-24">
        <div>
          <Rise>
            <p className="kicker">Artisanal gifts · Made with heart</p>
          </Rise>
          <Rise delay={90}>
            <h1 className="mt-6 text-[clamp(3rem,8.4vw,7.25rem)]">
              Gifts that carry <em>meaning</em>
            </h1>
          </Rise>
          <Rise delay={180}>
            <p className="mt-8 max-w-md text-lg text-mist">
              Thoughtful pieces to wear, carry and share. Each one holds a message worth passing
              on.
            </p>
          </Rise>
          <Rise delay={270}>
            <div className="mt-10 flex flex-wrap gap-4">
              <Button href="/#gifts" arrow>
                Shop gifts
              </Button>
              {seasonal.christmasHero ? (
                <Button href="/christmas" variant="outline">
                  Christmas gifts
                </Button>
              ) : (
                <Button href="/#loved-ones" variant="outline">
                  Find a gift
                </Button>
              )}
            </div>
          </Rise>
        </div>

        <Rise delay={200} className="justify-self-center">
          <HeroLogo />
        </Rise>
      </div>
    </section>
  );
}
