import { createAdminClient } from "@/lib/supabase/admin-client";
import SiteSettingsClient, { type SettingRow } from "./SiteSettingsClient";

export default async function SiteSettingsPage() {
  const db = createAdminClient();
  const { data } = await db
    .from("site_settings")
    .select("*")
    .order("group_name", { ascending: true })
    .order("key",        { ascending: true });

  return <SiteSettingsClient initialRows={(data ?? []) as SettingRow[]} />;
}
