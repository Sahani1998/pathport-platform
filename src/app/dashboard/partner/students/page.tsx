import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin-client";
import { redirect } from "next/navigation";
import StudentsClient, { type PartnerStudent } from "./StudentsClient";

export const dynamic = "force-dynamic";

export default async function PartnerStudentsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "recruitment_partner") redirect("/dashboard");

  const db = createAdminClient();
  // partner_students.student_id → auth.users (no FK to profiles) — batch-load.
  const { data } = await db
    .from("partner_students")
    .select(`id, referred_at, notes, student_id`)
    .eq("partner_id", user.id)
    .order("referred_at", { ascending: false });

  const studentIds = (data ?? [])
    .map((r: Record<string,unknown>) => r.student_id as string | undefined)
    .filter((id): id is string => Boolean(id));

  // Load profiles with the extra fields this page needs (phone, created_at)
  const { data: profileRows } = studentIds.length > 0
    ? await db.from("profiles").select("id, full_name, email, country, phone, created_at").in("id", studentIds)
    : { data: [] as Record<string, unknown>[] };
  const studentProfileMap = new Map<string, Record<string, unknown>>();
  for (const p of profileRows ?? []) studentProfileMap.set((p as Record<string, unknown>).id as string, p as Record<string, unknown>);

  const { data: appCounts } = studentIds.length > 0
    ? await db
        .from("applications")
        .select("student_id, current_stage, status")
        .in("student_id", studentIds)
    : { data: [] };

  const countsByStudent: Record<string, { total: number; approved: number }> = {};
  for (const app of (appCounts ?? []) as Record<string,unknown>[]) {
    const sid = app.student_id as string;
    if (!countsByStudent[sid]) countsByStudent[sid] = { total: 0, approved: 0 };
    countsByStudent[sid].total++;
    if (["approved","arrival_preparation","arrived_singapore"].includes(app.current_stage as string ?? "")) {
      countsByStudent[sid].approved++;
    }
  }

  const rows: PartnerStudent[] = (data ?? []).map((r: Record<string,unknown>) => {
    const sid = r.student_id as string ?? "";
    const s = studentProfileMap.get(sid) ?? null;
    const counts = countsByStudent[sid] ?? { total: 0, approved: 0 };
    return {
      id:          r.id as string,
      referred_at: r.referred_at as string,
      notes:       r.notes as string | null,
      student: {
        id:         sid,
        full_name:  s?.full_name as string | null,
        email:      s?.email as string ?? "",
        country:    s?.country as string | null,
        phone:      s?.phone as string | null,
        created_at: s?.created_at as string ?? "",
      },
      app_count:      counts.total,
      approved_count: counts.approved,
    };
  });

  return <StudentsClient initialRows={rows} />;
}
