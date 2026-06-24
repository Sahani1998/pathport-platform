// Global site settings — single source of truth for sitewide contact details
// and social links. Public pages read these instead of hardcoding values.
//
// Server components: call `getSiteSettings()` (cached per request).
// Client components: fetch via the anon Supabase client (RLS allows public read
//   of is_public rows) and merge over CONTACT_DEFAULTS for graceful fallback.
//
// If the site_settings table is missing or empty, callers fall back to
// CONTACT_DEFAULTS so nothing ever renders blank.

import { cache } from "react";
import { createAdminClient } from "@/lib/supabase/admin-client";

export interface SiteSettings {
  whatsapp_number: string;   // digits only, for wa.me links
  whatsapp_display: string;  // human-readable format
  contact_email: string;
  support_email: string;
  admissions_email: string;
  social_instagram: string;
  social_facebook: string;
  social_linkedin: string;
}

// Defaults mirror the values previously hardcoded across the site. These are
// the canonical fallback when the DB row is absent.
export const CONTACT_DEFAULTS: SiteSettings = {
  whatsapp_number:  "6583776492",
  whatsapp_display: "+65 8377 6492",
  contact_email:    "pathportsg@gmail.com",
  support_email:    "pathportsg@gmail.com",
  admissions_email: "pathportsg@gmail.com",
  social_instagram: "",
  social_facebook:  "",
  social_linkedin:  "",
};

/**
 * Build a wa.me link from a digits-only number, with optional prefilled text.
 */
export function whatsappHref(number: string, text?: string): string {
  const base = `https://wa.me/${number}`;
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
}

/**
 * Server-side settings fetch, deduped per request via React cache().
 * Always returns a complete SiteSettings object (defaults merged under DB rows).
 * Never throws — on any error it returns CONTACT_DEFAULTS so pages keep rendering.
 */
export const getSiteSettings = cache(async (): Promise<SiteSettings> => {
  try {
    const db = createAdminClient();
    const { data, error } = await db.from("site_settings").select("key, value");

    if (error || !data) return { ...CONTACT_DEFAULTS };

    const merged: SiteSettings = { ...CONTACT_DEFAULTS };
    for (const row of data) {
      if (row.key in merged && typeof row.value === "string" && row.value !== "") {
        merged[row.key as keyof SiteSettings] = row.value;
      }
    }
    return merged;
  } catch {
    return { ...CONTACT_DEFAULTS };
  }
});
