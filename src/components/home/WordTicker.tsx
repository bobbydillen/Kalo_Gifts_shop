import { Marquee } from "@/components/ui/Marquee";
import { tickerWords } from "@/lib/site";

/** Large serif word ticker used between sections. */
export function WordTicker() {
  return (
    <Marquee
      seconds={38}
      className="border-y border-hair py-6 font-serif text-[clamp(2rem,5vw,4rem)] leading-none"
    >
      {tickerWords.map((word, i) => (
        <span key={word} className="flex items-center gap-10 pr-10">
          <span className={i % 2 ? "italic text-gold-light" : ""}>{word}</span>
          <span aria-hidden="true" className="text-2xl text-gold">
            ✦
          </span>
        </span>
      ))}
    </Marquee>
  );
}
