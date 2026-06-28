import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin-client";
import { redirect } from "next/navigation";
import { loadStudentProfiles } from "@/lib/student-profiles";
import ApplicationsClient, { type PartnerApplication } from "./ApplicationsClient";

export const dynamic = "force-dynamic";

export default async function PartnerApplicationsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "recruitment_partner") redirect("/dashboard");

  const db = createAdminClient();

  // Get partner's student IDs
  const { data: psRows } = await db
    .from("partner_students")
    .select("student_id")
    .eq("partner_id", user.id);

  const studentIds = (psRows ?? []).map((r: Record<string,unknown>) => r.student_id as string);

  const { data: appsRaw } = studentIds.length > 0
    ? await db
        .from("applications")
        .select(`
          id, public_id, current_stage, status, submitted_at, updated_at, student_id,
          courses (
            id, title, category, level, tuition_fee,
            colleges ( name, logo_url )
          )
        `)
        .in("student_id", studentIds)
        .order("submitted_at", { ascending: false })
    : { data: [] };

  // applications.student_id → auth.users (no FK to profiles) — batch-load profiles
  const appProfileMap = await loadStudentProfiles(db, (appsRaw ?? []).map((a: Record<string,unknown>) => a.student_id as string));

  const rows: PartnerApplication[] = (appsRaw ?? []).map((a: Record<string,unknown>) => {
    const student = appProfileMap.get(a.student_id as string) ?? null;
    const courses = a.courses as Record<string,unknown> | null;
    const colleges = courses?.colleges as Record<string,unknown> | null;
    return {
      id:            a.id as string,
      public_id:     a.public_id as string | null,
      current_stage: a.current_stage as string | null,
      status:        a.status as string,
      submitted_at:  a.submitted_at as string,
      updated_at:    a.updated_at as string,
      student: {
        id:        student?.id as string ?? "",
        full_name: student?.full_name as string | null,
        email:     student?.email as string ?? "",
        country:   student?.country as string | null,
      },
      course: courses ? {
        id:          courses.id as string,
        title:       courses.title as string,
        category:    courses.category as string,
        level:       courses.level as string,
        tuition_fee: courses.tuition_fee as number,
        college: {
          name:     colleges?.name as string ?? "",
          logo_url: colleges?.logo_url as string | null,
        },
      } : null,
    };
  });

  return <ApplicationsClient initialRows={rows} />;
}
