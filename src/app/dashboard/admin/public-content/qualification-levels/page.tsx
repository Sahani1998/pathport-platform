import { createAdminClient } from "@/lib/supabase/admin-client";
import QualificationLevelsClient, { type QualLevel } from "./QualificationLevelsClient";

export default async function QualificationLevelsPage() {
  const db = createAdminClient();
  const { data } = await db
    .from("public_qualification_levels")
    .select("*")
    .order("display_order", { ascending: true });

  return <QualificationLevelsClient initialRows={(data ?? []) as QualLevel[]} />;
}
