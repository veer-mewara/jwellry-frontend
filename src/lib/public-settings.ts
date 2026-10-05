import "server-only";
import { cache } from "react";
import { siteConfig } from "@/lib/site";

// Shape served by GET /api/settings/public. Every value may be null.
interface ApiPublicSettings {
  store?: {
    name?: string | null;
    support_email?: string | null;
    support_phone?: string | null;
    whatsapp_number?: string | null;
    instagram_url?: string | null;
    facebook_url?: string | null;
  } | null;
  analytics?: {
    ga_measurement_id?: string | null;
    google_site_verification?: string | null;
  } | null;
  auth?: {
    firebase?: Partial<FirebaseWebConfig> | null;
    providers?: { google?: boolean | null; facebook?: boolean | null } | null;
  } | null;
}

export interface FirebaseWebConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  appId: string;
  messagingSenderId?: string;
}

export interface SiteSettings {
  name: string;
  description: string;
  url: string;
  supportEmail: string;
  supportPhone: string;
  whatsappNumber: string;
  instagramUrl: string;
  facebookUrl: string;
  gaMeasurementId: string;
  googleSiteVerification: string;
}

export interface AuthSettings {
  firebase: FirebaseWebConfig | null;
  providers: { google: boolean; facebook: boolean };
}

export interface PublicSettings {
  site: SiteSettings;
  auth: AuthSettings;
}

const REVALIDATE_SECONDS = 60;
const TIMEOUT_MS = 3000;

/** Raw settings from the API, or null on any failure (API down, bad JSON, not configured). */
async function fetchPublicSettings(): Promise<ApiPublicSettings | null> {
  const base = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
  if (!base) return null;
  try {
    const response = await fetch(`${base}/api/settings/public`, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(TIMEOUT_MS),
      next: { revalidate: REVALIDATE_SECONDS },
    });
    if (!response.ok) return null;
    const payload: unknown = await response.json();
    return payload && typeof payload === "object" ? (payload as ApiPublicSettings) : null;
  } catch {
    return null;
  }
}

function pick(apiValue: unknown, fallback: string): string {
  return typeof apiValue === "string" && apiValue.trim() ? apiValue.trim() : fallback;
}

function firebaseConfig(value: Partial<FirebaseWebConfig> | null | undefined): FirebaseWebConfig | null {
  if (!value) return null;
  const { apiKey, authDomain, projectId, appId, messagingSenderId } = value;
  if (!apiKey || !authDomain || !projectId || !appId) return null;
  return { apiKey, authDomain, projectId, appId, ...(messagingSenderId ? { messagingSenderId } : {}) };
}

/**
 * Admin-managed settings merged over the env defaults in siteConfig:
 * non-empty API values win, env values are the fallback, so the site
 * still renders when the API is unreachable or nothing is configured.
 */
export const getPublicSettings = cache(async (): Promise<PublicSettings> => {
  const api = await fetchPublicSettings();
  const store = api?.store ?? {};
  const analytics = api?.analytics ?? {};
  const firebase = firebaseConfig(api?.auth?.firebase);

  return {
    site: {
      name: pick(store.name, siteConfig.name),
      description: siteConfig.description,
      url: siteConfig.url,
      supportEmail: pick(store.support_email, siteConfig.supportEmail),
      supportPhone: pick(store.support_phone, siteConfig.supportPhone),
      whatsappNumber: pick(store.whatsapp_number, siteConfig.whatsappNumber),
      instagramUrl: pick(store.instagram_url, siteConfig.instagramUrl),
      facebookUrl: pick(store.facebook_url, siteConfig.facebookUrl),
      gaMeasurementId: pick(analytics.ga_measurement_id, process.env.NEXT_PUBLIC_GA_ID || ""),
      googleSiteVerification: pick(
        analytics.google_site_verification,
        process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || "",
      ),
    },
    auth: {
      firebase,
      providers: {
        google: Boolean(firebase && api?.auth?.providers?.google),
        facebook: Boolean(firebase && api?.auth?.providers?.facebook),
      },
    },
  };
});
