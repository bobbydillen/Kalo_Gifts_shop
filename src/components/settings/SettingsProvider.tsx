"use client";

import { createContext, useContext, type ReactNode } from "react";
import { DEFAULT_SETTINGS, type SiteSettings } from "@/lib/settings";

const SettingsContext = createContext<SiteSettings>(DEFAULT_SETTINGS);

/** Hands the site settings to browser-side code (menu, countdown, order-by pill, bag). */
export function SettingsProvider({ settings, children }: { settings: SiteSettings; children: ReactNode }) {
  return <SettingsContext.Provider value={settings}>{children}</SettingsContext.Provider>;
}

export const useSettings = () => useContext(SettingsContext);
