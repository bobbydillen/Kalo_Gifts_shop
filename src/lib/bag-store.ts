/**
 * The bag's contents, kept in this browser's localStorage so a refresh or a
 * return visit does not empty it. Read through useSyncExternalStore in
 * BagProvider. If storage is blocked the bag still works for the current visit.
 */

import type { HamperPart } from "@/lib/hamper";

export type StoredLine = {
  id: string;
  slug: string;
  colour?: string;
  size?: string;
  qty: number;
  wrap: boolean;
  note: string; // handwritten card message; empty means no card
  /** For items the customer sends a photo for: where it is stored, a small preview, and its direction. */
  photo?: { path: string; thumb: string; orient: "portrait" | "landscape" };
  /** For a build-your-own hamper: the products chosen. The line is always one hamper. */
  parts?: HamperPart[];
};

const KEY = "kalo-bag-v1";
const EMPTY: StoredLine[] = [];

let lines = EMPTY;
let loaded = false;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((listener) => listener());

function parse(raw: string | null): StoredLine[] {
  if (!raw) return EMPTY;
  try {
    const data: unknown = JSON.parse(raw);
    if (!Array.isArray(data)) return EMPTY;
    const valid = data.filter(
      (l): l is StoredLine =>
        Boolean(l) &&
        typeof l.id === "string" &&
        typeof l.slug === "string" &&
        Number.isInteger(l.qty) &&
        l.qty > 0 &&
        typeof l.wrap === "boolean" &&
        typeof l.note === "string",
    );
    return valid.length ? valid : EMPTY;
  } catch {
    return EMPTY;
  }
}

function load() {
  if (loaded) return;
  loaded = true;
  try {
    lines = parse(localStorage.getItem(KEY));
  } catch {
    // storage blocked: start empty
  }
}

export const getSnapshot = () => {
  load();
  return lines;
};

/** The server has no bag; the first client render matches this, then updates. */
export const getServerSnapshot = () => EMPTY;

export function subscribe(listener: () => void) {
  listeners.add(listener);
  // keep several open tabs in step
  const onStorage = (e: StorageEvent) => {
    if (e.key !== KEY) return;
    lines = parse(e.newValue);
    emit();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function setLines(next: StoredLine[]) {
  lines = next.length ? next : EMPTY;
  try {
    localStorage.setItem(KEY, JSON.stringify(lines));
  } catch {
    // storage blocked: the bag lives in memory for this visit
  }
  emit();
}
