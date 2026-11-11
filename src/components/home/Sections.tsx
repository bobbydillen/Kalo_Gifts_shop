import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";

const values = [
  { name: "Faith", line: "Quietly present in every design, never shouted." },
  { name: "Meaning", line: "Each piece starts with a message worth carrying." },
  { name: "Quality", line: "Made to be worn, used and kept for years." },
  { name: "The joy of giving", line: "Built around the moment someone opens it." },
];

/** Brand statement and the four things KALO stands for. */
export function Story({ index }: { index: number }) {
  return (
    <section id="story" className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:py-36">
      <Reveal>
        <p className="kicker">(0{index}) — Made with heart</p>
        <p className="mt-8 max-w-5xl font-serif text-[clamp(2rem,5vw,4.5rem)] leading-[1.04] tracking-[-0.02em]">
          More than something to unwrap. A small reminder of what{" "}
          <em className="text-gold-light">matters</em>, made to be kept.
        </p>
      </Reveal>

      <div className="mt-16 grid gap-x-8 gap-y-10 border-t border-hair pt-10 sm:grid-cols-2 lg:grid-cols-4">
        {values.map((value, i) => (
          <Reveal key={value.name} delay={i * 90}>
            <p className="text-xs tracking-[0.2em] text-faint">0{i + 1}</p>
            <h3 className="mt-3 text-3xl">{value.name}</h3>
            <p className="mt-3 text-mist">{value.line}</p>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/** Gift wrap and personal note, shown with a sample note card. */
export function Gifting({ index }: { index: number }) {
  return (
    <section className="border-t border-hair bg-pine/60">
      <div className="mx-auto grid max-w-7xl items-center gap-14 px-4 py-24 sm:px-6 lg:grid-cols-2 lg:py-32">
        <Reveal>
          <p className="kicker">(0{index}) — Make it a gift</p>
          <h2 className="mt-5 text-[clamp(2.25rem,5.5vw,4.5rem)]">
            Wrapped, with a note in your <em>words</em>
          </h2>
          <p className="mt-6 max-w-md text-mist">
            Add gift wrapping at checkout and write a few lines. Your note travels with the gift,
            so it arrives ready to hand over.
          </p>
          <ul className="mt-8 space-y-4">
            {["Gift wrapping, chosen at checkout", "A personal note in your own words", "Ready to hand over when it arrives"].map(
              (item) => (
                <li key={item} className="flex items-center gap-4">
                  <span aria-hidden="true" className="text-gold">
                    ✦
                  </span>
                  {item}
                </li>
              ),
            )}
          </ul>
        </Reveal>

        <Reveal delay={150} className="justify-self-center">
          <div className="group relative w-[min(84vw,26rem)]">
            <div
              aria-hidden="true"
              className="absolute inset-0 rotate-6 rounded-[22px] bg-berry/70 transition-transform duration-700 ease-bounce group-hover:rotate-[10deg]"
            />
            <figure className="relative -rotate-3 rounded-[22px] bg-[linear-gradient(170deg,#f6efe2,#eadfc9)] p-9 text-ink shadow-[0_40px_80px_-30px_rgba(0,0,0,0.8)] transition-transform duration-700 ease-bounce group-hover:-rotate-1 group-hover:-translate-y-2">
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-2.5 rounded-[15px] border border-gold-deep/45"
              />
              <p className="text-[0.6875rem] uppercase tracking-[0.24em] text-gold-deep">A note for you</p>
              <blockquote className="mt-5 font-serif text-[1.7rem] italic leading-snug">
                Thinking of you this Christmas. Hope this little thing makes you smile.
              </blockquote>
              <figcaption className="mt-6 font-serif text-lg">With love, always</figcaption>
            </figure>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/** Answers grounded in what is already decided. More are added before launch. */
const faqs = [
  {
    q: "Do I need to create an account?",
    a: "No. You check out with your phone number, and your details and orders are kept against it for next time.",
  },
  {
    q: "Can you gift wrap my order?",
    a: "Yes. Choose gift wrapping at checkout and add a personal note. Your note is included with the gift.",
  },
  {
    q: "What is in a hamper?",
    a: "Each hamper is a set of our own pieces, chosen to go together and packed ready to give. The hamper page lists everything inside.",
  },
  {
    q: "How do I pick the right size?",
    a: "Every clothing page has a size guide with measurements, so you can compare against something you already own.",
  },
  {
    q: "Will it arrive before Christmas?",
    a: "The order-by date for Christmas delivery is shown on the site through the season. Orders placed before that date are sent in time for Christmas.",
  },
];

export function Faq({ index }: { index: number }) {
  return (
    <section className="mx-auto max-w-4xl px-4 py-24 sm:px-6 lg:py-32">
      <Reveal>
        <p className="kicker">(0{index}) — Good to know</p>
        <h2 className="mt-5 text-[clamp(2.25rem,5.5vw,4.5rem)]">
          Questions, <em>answered</em>
        </h2>
      </Reveal>

      <Reveal delay={120}>
        <div className="mt-12 border-t border-hair">
          {faqs.map((item, i) => (
            <details key={item.q} className="group border-b border-hair">
              <summary className="grid cursor-pointer list-none grid-cols-[2.5rem_1fr_auto] items-center gap-3 py-6 font-serif text-[clamp(1.35rem,2.6vw,2rem)] leading-tight transition-colors hover:text-gold-light sm:grid-cols-[4rem_1fr_auto] [&::-webkit-details-marker]:hidden">
                <span className="font-sans text-xs tracking-[0.2em] text-faint">0{i + 1}</span>
                {item.q}
                <span
                  aria-hidden="true"
                  className="font-sans text-3xl font-light text-gold transition-transform duration-500 ease-bounce group-open:rotate-45"
                >
                  +
                </span>
              </summary>
              <p className="max-w-2xl pb-7 pl-[3.25rem] text-mist sm:pl-[4.75rem]">{item.a}</p>
            </details>
          ))}
        </div>
      </Reveal>
    </section>
  );
}

export function ClosingCta() {
  return (
    <section className="relative overflow-hidden border-t border-hair">
      <div
        aria-hidden="true"
        className="absolute left-1/2 top-1/2 size-[90vmin] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgb(163_40_42/0.35),transparent_62%)]"
      />
      <Reveal className="relative mx-auto max-w-4xl px-4 py-28 text-center sm:px-6 lg:py-40">
        <h2 className="text-[clamp(2.75rem,8vw,7rem)]">
          Give something that <em>stays</em>
        </h2>
        <div className="mt-10">
          <Button href="/#gifts" arrow>
            Start gifting
          </Button>
        </div>
      </Reveal>
    </section>
  );
}
