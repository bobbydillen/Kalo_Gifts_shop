"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { getServerSnapshot, getSnapshot, setLines, subscribe, type StoredLine } from "@/lib/bag-store";
import { useCatalog } from "@/components/catalog/CatalogProvider";
import type { Catalog, Product } from "@/lib/catalog";
import { useSettings } from "@/components/settings/SettingsProvider";
import { canGiftWrap, unitPrice } from "@/lib/gifting";
import { hamperInStock, hamperPrice, type HamperPart } from "@/lib/hamper";

export const MAX_QTY = 10;

/** A bag line with its product and prices worked out. */
export type BagLine = StoredLine & {
  product: Product;
  unit: number; // price of one piece including gift options
  total: number;
  left: number; // units in stock for this variant (Infinity when not tracked)
};

type AddInput = {
  slug: string;
  colour?: string;
  size?: string;
  qty?: number;
  wrap?: boolean;
  note?: string;
  photo?: StoredLine["photo"];
  parts?: HamperPart[];
};

type Bag = {
  lines: BagLine[];
  count: number;
  subtotal: number;
  isOpen: boolean;
  setOpen: (open: boolean) => void;
  add: (input: AddInput) => void;
  setQty: (id: string, qty: number) => void;
  remove: (id: string) => void;
  setGift: (id: string, gift: { wrap: boolean; note: string }) => void;
  clear: () => void;
};

const noop = () => {};
const BagContext = createContext<Bag>({
  lines: [],
  count: 0,
  subtotal: 0,
  isOpen: false,
  setOpen: noop,
  add: noop,
  setQty: noop,
  remove: noop,
  setGift: noop,
  clear: noop,
});
export const useBag = () => useContext(BagContext);

const makeId = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

/** Most of one variant that can go in the bag: the cap, or what is in stock. */
const limitFor = (catalog: Catalog, product: Product, colour?: string, size?: string) =>
  Math.min(MAX_QTY, catalog.stockFor(product, colour, size));

export function BagProvider({ children }: { children: ReactNode }) {
  const catalog = useCatalog();
  const settings = useSettings();
  const maxChars = settings.giftCardMaxChars;
  const { productBySlug, stockFor } = catalog;
  const stored = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [isOpen, setOpen] = useState(false);

  const lines = useMemo<BagLine[]>(
    () =>
      stored.flatMap((line) => {
        const product = productBySlug(line.slug);
        if (!product) return []; // product was removed from the catalogue
        if (line.parts) {
          // a build-your-own hamper is always one hamper, priced from what is inside it
          const price = hamperPrice(line.parts, productBySlug, settings).total;
          const unit = price + (line.note.trim() ? settings.giftCardPrice : 0);
          const left = hamperInStock(line.parts, { productBySlug, stockFor }) ? Infinity : 0;
          return [{ ...line, qty: 1, product, left, unit, total: unit }];
        }
        const left = stockFor(product, line.colour, line.size);
        const qty = Math.max(1, Math.min(line.qty, MAX_QTY, left));
        const unit = unitPrice(product, line, settings, line.size);
        return [{ ...line, qty, product, left, unit, total: unit * qty }];
      }),
    [stored, productBySlug, stockFor, settings],
  );

  const add = useCallback((input: AddInput) => {
    const product = productBySlug(input.slug);
    if (!product) return;

    if (input.parts?.length) {
      // each build-your-own hamper is its own line: never merged with another
      const note = (input.note ?? "").trim().slice(0, maxChars);
      setLines([...getSnapshot(), { id: makeId(), slug: input.slug, qty: 1, wrap: false, note, parts: input.parts }]);
      setOpen(true);
      return;
    }

    const limit = limitFor(catalog, product, input.colour, input.size);
    if (limit <= 0) return;

    const wrap = Boolean(input.wrap) && canGiftWrap(product);
    const note = (input.note ?? "").trim().slice(0, maxChars);
    const qty = Math.max(1, input.qty ?? 1);

    const current = getSnapshot();
    const same = current.find(
      (l) =>
        l.slug === input.slug &&
        l.colour === input.colour &&
        l.size === input.size &&
        l.wrap === wrap &&
        l.note === note &&
        l.photo?.path === input.photo?.path, // each customer photo is its own line
    );
    if (same) {
      setLines(
        current.map((l) => (l.id === same.id ? { ...l, qty: Math.min(limit, l.qty + qty) } : l)),
      );
    } else {
      setLines([
        ...current,
        {
          id: makeId(),
          slug: input.slug,
          colour: input.colour,
          size: input.size,
          qty: Math.min(limit, qty),
          wrap,
          note,
          ...(input.photo ? { photo: input.photo } : {}),
        },
      ]);
    }
    setOpen(true);
  }, [catalog, productBySlug, maxChars]);

  const setQty = useCallback((id: string, qty: number) => {
    setLines(
      getSnapshot().map((l) => {
        if (l.id !== id || l.parts) return l; // a hamper line stays at one
        const product = productBySlug(l.slug);
        const limit = product ? limitFor(catalog, product, l.colour, l.size) : MAX_QTY;
        return { ...l, qty: Math.max(1, Math.min(limit, qty)) };
      }),
    );
  }, [catalog, productBySlug]);

  const clear = useCallback(() => setLines([]), []);

  const remove = useCallback((id: string) => {
    setLines(getSnapshot().filter((l) => l.id !== id));
  }, []);

  const setGift = useCallback((id: string, gift: { wrap: boolean; note: string }) => {
    setLines(
      getSnapshot().map((l) =>
        l.id === id ? { ...l, wrap: gift.wrap, note: gift.note.slice(0, maxChars) } : l,
      ),
    );
  }, [maxChars]);

  const value = useMemo<Bag>(
    () => ({
      lines,
      count: lines.reduce((sum, l) => sum + l.qty, 0),
      subtotal: lines.reduce((sum, l) => sum + l.total, 0),
      isOpen,
      setOpen,
      add,
      setQty,
      remove,
      setGift,
      clear,
    }),
    [lines, isOpen, add, setQty, remove, setGift, clear],
  );

  return <BagContext.Provider value={value}>{children}</BagContext.Provider>;
}
