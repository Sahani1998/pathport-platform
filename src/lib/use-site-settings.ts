"use client";

// Client-side site settings hook. Returns CONTACT_DEFAULTS immediately so the
// UI never flashes blank, then swaps in DB values once fetched. Reads via the
// anon Supabase client — RLS allows public read of is_public settings rows.

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { CONTACT_DEFAULTS, type SiteSettings } from "@/lib/site-settings";

export function useSiteSettings(): SiteSettings {
  const [settings, setSettings] = useState<SiteSettings>(CONTACT_DEFAULTS);

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const supabase = createClient();
        const { data, error } = await supabase.from("site_settings").select("key, value");
        if (!active || error || !data) return;

        const merged: SiteSettings = { ...CONTACT_DEFAULTS };
        for (const row of data) {
          if (row.key in merged && typeof row.value === "string" && row.value !== "") {
            merged[row.key as keyof SiteSettings] = row.value;
          }
        }
        setSettings(merged);
      } catch {
        // keep defaults
      }
    })();

    return () => { active = false; };
  }, []);

  return settings;
}
