import { createAdminClient } from "@/lib/supabase/admin-client";
import IntakesClient, { type PageSection } from "./IntakesClient";

export default async function IntakesPage() {
  const db = createAdminClient();
  const { data } = await db
    .from("public_page_sections")
    .select("*")
    .eq("section_key", "intake_options")
    .order("display_order", { ascending: true });

  return <IntakesClient initialRows={(data ?? []) as PageSection[]} />;
}
