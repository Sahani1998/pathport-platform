import { createAdminClient } from "@/lib/supabase/admin-client";
import PathwayCardsClient, { type PathwayCard } from "./PathwayCardsClient";

export default async function PathwayCardsPage() {
  const db = createAdminClient();
  const { data } = await db
    .from("public_pathway_cards")
    .select("*")
    .order("display_order", { ascending: true });

  return <PathwayCardsClient initialRows={(data ?? []) as PathwayCard[]} />;
}
