import { createAdminClient } from "@/lib/supabase/admin-client";
import DurationGuideClient, { type PageSection } from "./DurationGuideClient";

export default async function DurationGuidePage() {
  const db = createAdminClient();
  const { data } = await db
    .from("public_page_sections")
    .select("*")
    .eq("section_key", "duration_guide")
    .order("display_order", { ascending: true });

  return <DurationGuideClient initialRows={(data ?? []) as PageSection[]} />;
}
