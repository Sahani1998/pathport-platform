import { createAdminClient } from "@/lib/supabase/admin-client";
import DestinationsClient, { type Destination } from "./DestinationsClient";

export default async function DestinationsPage() {
  const db = createAdminClient();
  const { data } = await db
    .from("public_destinations")
    .select("*")
    .order("display_order", { ascending: true });

  return <DestinationsClient initialRows={(data ?? []) as Destination[]} />;
}
