"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { createCatalog, type Catalog, type Product } from "@/lib/catalog";

const CatalogContext = createContext<Catalog | null>(null);

/** Hands the product list to browser-side code (the bag, the hamper picker, the buy box). */
export function CatalogProvider({ products, children }: { products: Product[]; children: ReactNode }) {
  const catalog = useMemo(() => createCatalog(products), [products]);
  return <CatalogContext.Provider value={catalog}>{children}</CatalogContext.Provider>;
}

export function useCatalog(): Catalog {
  const catalog = useContext(CatalogContext);
  if (!catalog) throw new Error("useCatalog must be used inside CatalogProvider");
  return catalog;
}
