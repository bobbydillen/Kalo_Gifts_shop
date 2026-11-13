"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

type Value = { colour: string | undefined; setColour: (name: string) => void };

const Ctx = createContext<Value | null>(null);

/**
 * Holds the colour chosen on a product page, so the photos and the buy box stay in step:
 * picking a colour in the buy box swaps the photos in the gallery.
 */
export function ProductColourProvider({ first, children }: { first: string | undefined; children: ReactNode }) {
  const [colour, setColour] = useState<string | undefined>(first);
  return <Ctx.Provider value={{ colour, setColour }}>{children}</Ctx.Provider>;
}

export function useProductColour(): Value {
  const value = useContext(Ctx);
  if (!value) throw new Error("useProductColour must be used inside ProductColourProvider");
  return value;
}
