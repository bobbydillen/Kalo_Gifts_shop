"use client";

import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";

/**
 * Minimal bag for phase 2: it only counts items and confirms an add.
 * Phase 4 replaces this with the real bag (lines, quantities, drawer).
 */
type Bag = { count: number; add: (name: string) => void };

const BagContext = createContext<Bag>({ count: 0, add: () => {} });
export const useBag = () => useContext(BagContext);

export function BagProvider({ children }: { children: ReactNode }) {
  const [count, setCount] = useState(0);
  const [toast, setToast] = useState<{ id: number; name: string } | null>(null);
  const timer = useRef<number | undefined>(undefined);

  const add = useCallback((name: string) => {
    setCount((c) => c + 1);
    setToast({ id: Date.now(), name });
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setToast(null), 2600);
  }, []);

  return (
    <BagContext.Provider value={{ count, add }}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-24 z-50 flex justify-center px-4">
        {toast && (
          <p
            key={toast.id}
            className="toast-pop flex items-center gap-3 rounded-full bg-cream/95 py-2.5 pl-5 pr-6 text-sm text-night shadow-[0_20px_40px_-14px_rgba(0,0,0,0.7)]"
          >
            <span aria-hidden="true" className="text-gold-deep">
              ✦
            </span>
            <span>
              <em className="font-serif text-lg">{toast.name}</em> is in your bag
            </span>
          </p>
        )}
      </div>
    </BagContext.Provider>
  );
}
