"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { PublicSettings } from "@/lib/public-settings";

const SiteSettingsContext = createContext<PublicSettings | null>(null);

/** Receives the merged public settings from the root layout (server) once per render. */
export function SiteSettingsProvider({ settings, children }: { settings: PublicSettings; children: ReactNode }) {
  return <SiteSettingsContext.Provider value={settings}>{children}</SiteSettingsContext.Provider>;
}

export function usePublicSettings(): PublicSettings {
  const settings = useContext(SiteSettingsContext);
  if (!settings) throw new Error("usePublicSettings must be used inside SiteSettingsProvider");
  return settings;
}

export function useSiteSettings() {
  return usePublicSettings().site;
}
