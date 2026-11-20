"use client";

import { useEffect, useRef, useState } from "react";
import { finishFor, FRAME_SLICE } from "@/lib/frames";

/**
 * A print inside a frame, drawn with the finish's mitred frame picture (CSS border-image), so the
 * same print can sit in any colour. Changing the colour cross-fades to the new frame.
 * `share` is the moulding width as a share of the print width.
 */
export function FramedPrint({ art, colour, share, alt, eager }: { art: string; colour: string | undefined; share: number; alt: string; eager?: boolean }) {
  const finish = finishFor(colour);
  const [layers, setLayers] = useState([{ texture: finish.texture, key: 0 }]);
  const last = useRef(finish.texture);

  useEffect(() => {
    if (finish.texture === last.current) return;
    last.current = finish.texture;
     
    setLayers((l) => [l[l.length - 1], { texture: finish.texture, key: Date.now() }]);
    const t = setTimeout(() => setLayers((l) => l.slice(-1)), 650);
    return () => clearTimeout(t);
  }, [finish.texture]);

  // the moulding as a share of the whole frame's width, in container units
  const border = `${((share * 100) / (1 + 2 * share)).toFixed(3)}cqw`;

  return (
    <span className="relative block [container-type:inline-size]">
      <span className="relative block shadow-[0_24px_40px_-12px_rgba(0,0,0,0.75)]" style={{ padding: border }}>
        {/* eslint-disable-next-line @next/next/no-img-element -- already sized prints */}
        <img src={art} alt={alt} draggable={false} loading={eager ? "eager" : "lazy"} decoding="async" className="block w-full select-none" />
        {/* a little depth where the print meets the frame */}
        <span aria-hidden="true" className="pointer-events-none absolute shadow-[inset_0_4px_10px_rgba(0,0,0,0.35)]" style={{ inset: border }} />
        {layers.map((l, i) => (
          <span
            key={l.key}
            aria-hidden="true"
            className={`pointer-events-none absolute inset-0 ${i === layers.length - 1 && layers.length > 1 ? "animate-[fade-in_0.6s_ease]" : ""}`}
            style={{ borderStyle: "solid", borderWidth: border, borderImage: `url(${l.texture}) ${FRAME_SLICE} stretch` }}
          />
        ))}
      </span>
    </span>
  );
}
