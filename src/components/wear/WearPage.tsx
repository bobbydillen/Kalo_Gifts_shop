"use client";

import { useState } from "react";
import { WEAR } from "@/lib/wear";
import { PieceView } from "./PieceView";
import { Rack } from "./Rack";
import { LetterWindow, Lookbook, OutfitChange, PhotoStrip, RailFooter } from "./WearSections";

/** The Wear page: the rack, then the outfit change, lookbook, letters, photo strip and the last rail. */
export function WearPage() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <>
      <Rack pieces={WEAR} onOpen={setOpen} />
      <OutfitChange />
      <Lookbook pieces={WEAR} onOpen={setOpen} />
      <LetterWindow />
      <PhotoStrip pieces={WEAR} onOpen={setOpen} />
      <RailFooter pieces={WEAR} onOpen={setOpen} />
      {open !== null && <PieceView key={WEAR[open].id} piece={WEAR[open]} onClose={() => setOpen(null)} />}
    </>
  );
}
