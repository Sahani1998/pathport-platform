import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin-client";
import { redirect } from "next/navigation";
import { resolveStage, isInternshipRelevant } from "@/lib/application-stage-mapping";
import { getStageMeta } from "@/types/timeline";
import EligibilityClient from "./EligibilityClient";

export const dynamic = "force-dynamic";

export default async function InstitutionInternshipEligibilityPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, college_id")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || !["institution", "admin"].includes(profile.role)) redirect("/dashboard");

  const db = createAdminClient();
  const collegeId = (profile.college_id as string | null) ?? null;
  const isInstitution = profile.role === "institution";

  // ── College scoping ──────────────────────────────────────────────────────
  // college_id lives on `courses`, NOT on `applications`. Every institution
  // page scopes by resolving the college's course ids first, then filtering
  // applications by course_id. (Filtering applications.college_id directly was
  // the bug that made this page show zero enrolled students.)
  let courseIds: string[] | null = null; // null = admin, no scoping
  if (isInstitution) {
    if (!collegeId) {
      return <EligibilityClient students={[]} diagnostics={{ reason: "no_college" }} />;
    }
    const { data: courseRows } = await db
      .from("courses")
      .select("id")
      .eq("college_id", collegeId);
    courseIds = (courseRows ?? []).map((c: Record<string, unknown>) => c.id as string);
    if (courseIds.length === 0) {
      return <EligibilityClient students={[]} diagnostics={{ reason: "no_courses" }} />;
    }
  }

  // ── Fetch applications (scoped to the college's courses for institutions) ──
  let appQuery = db
    .from("applications")
    .select(`
      id, student_id, current_stage, status,
      student:profiles!applications_student_id_fkey(
        id, full_name, email, country
      ),
      courses(title, colleges(name))
    `)
    .not("current_stage", "in", '("rejected","withdrawn")')
    .order("submitted_at", { ascending: false });

  if (courseIds) appQuery = appQuery.in("course_id", courseIds);

  const { data: applications } = await appQuery;

  // ── Filter to internship-relevant students via the SINGLE SOURCE OF TRUTH ──
  // (enrolled and beyond, derived from resolveStage — same logic every other
  // module uses; no hardcoded stage exclusion list.)
  const relevant = (applications ?? []).filter((a: Record<string, unknown>) =>
    isInternshipRelevant(a.current_stage as string | null, a.status as string | null),
  );

  // Existing eligibility records
  const studentIds = relevant.map((a: Record<string, unknown>) => a.student_id as string).filter(Boolean);
  const { data: eligibilityRows } = studentIds.length > 0
    ? await db.from("posting_eligibility").select("*").in("student_id", studentIds)
    : { data: [] };

  const eligibilityMap: Record<string, Record<string, unknown>> = {};
  for (const row of eligibilityRows ?? []) {
    const r = row as Record<string, unknown>;
    eligibilityMap[r.student_id as string] = r;
  }

  const students = relevant.map((a: Record<string, unknown>) => {
    const student = Array.isArray(a.student) ? a.student[0] : a.student as Record<string, unknown> | null;
    const course  = Array.isArray(a.courses) ? a.courses[0] : a.courses as Record<string, unknown> | null;
    const college = course ? (Array.isArray(course.colleges) ? course.colleges[0] : course.colleges) : null;
    return {
      applicationId: a.id as string,
      studentId:     a.student_id as string,
      currentStage:  resolveStage(a.current_stage as string | null, a.status as string | null),
      fullName:      (student?.full_name as string) ?? "—",
      email:         (student?.email as string) ?? "—",
      country:       (student?.country as string | null) ?? null,
      courseTitle:   (course?.title as string) ?? "—",
      collegeName:   ((college as Record<string, unknown> | null)?.name as string) ?? "—",
      eligibility:   eligibilityMap[a.student_id as string] ?? null,
    };
  });

  // ── Diagnostics for the empty state ───────────────────────────────────────
  // When there are no internship-relevant students, show WHY: how many active
  // students exist in scope and which stages they're at, so the institution can
  // see the truth (e.g. "3 students, but the furthest is at Approved — not yet
  // Enrolled") instead of an opaque "none found".
  const allActive = applications ?? [];
  const stageCounts: Record<string, number> = {};
  for (const a of allActive) {
    const stage = resolveStage((a as Record<string, unknown>).current_stage as string | null, (a as Record<string, unknown>).status as string | null);
    const label = getStageMeta(stage).label;
    stageCounts[label] = (stageCounts[label] ?? 0) + 1;
  }
  const diagnostics = students.length === 0
    ? {
        reason: "none_enrolled" as const,
        activeStudents: allActive.length,
        stageBreakdown: Object.entries(stageCounts)
          .map(([label, count]) => ({ label, count }))
          .sort((a, b) => b.count - a.count),
      }
    : undefined;

  return <EligibilityClient students={students} diagnostics={diagnostics} />;
}
