/**
 * A preview of the handwritten card: the customer's message in white handwriting on dark
 * card stock, like the real ones. The real card is written by hand, so this only gives the
 * feel; the handwriting will differ.
 */
export function CardPreview({ message }: { message: string }) {
  const text = message.trim();
  // longer messages get smaller writing so they always fit the card
  const size = text.length > 170 ? "text-xl" : text.length > 90 ? "text-2xl" : "text-3xl";

  return (
    <figure
      aria-label="Preview of your card"
      className="relative aspect-[16/10] w-full overflow-hidden rounded-xl border border-hair-2 bg-[#2b2b2a] shadow-[inset_0_0_60px_rgba(0,0,0,0.45)]"
    >
      <div className="grid size-full place-items-center p-5 sm:p-7">
        <p
          className={`max-h-full w-full overflow-hidden whitespace-pre-wrap break-words text-center font-script leading-[1.15] ${size} ${
            text ? "text-[#f6f3ea]" : "text-[#f6f3ea]/35"
          }`}
        >
          {text || "Your message will appear here, written by hand."}
        </p>
      </div>
      <figcaption className="absolute bottom-2 right-3 text-[0.625rem] uppercase tracking-[0.18em] text-white/35">
        Preview
      </figcaption>
    </figure>
  );
}
