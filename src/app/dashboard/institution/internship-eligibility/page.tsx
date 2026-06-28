import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin-client";
import { redirect } from "next/navigation";
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
    .single();

  if (!profile || !["institution","admin"].includes(profile.role)) redirect("/dashboard");

  const db = createAdminClient();
  const collegeId = profile.college_id as string | null;

  // Fetch enrolled students who are at internship-relevant stages
  let studentQuery = db
    .from("applications")
    .select(`
      id, student_id, current_stage,
      student:profiles!applications_student_id_fkey(
        id, full_name, email, country
      ),
      courses(title, colleges(name))
    `)
    .not("current_stage", "in", '("rejected","withdrawn","application_submitted","documents_pending","documents_uploaded","documents_under_review","documents_verified","offer_letter_processing","offer_letter_ready","offer_letter_accepted","fee_payment_pending","ipa_processing","approved","tuition_fee_payment_pending","arrival_preparation")')
    .order("submitted_at", { ascending: false });

  if (collegeId && profile.role === "institution") {
    studentQuery = studentQuery.eq("college_id", collegeId);
  }

  const { data: applications } = await studentQuery;

  // Fetch existing eligibility records
  const studentIds = (applications ?? [])
    .map((a: Record<string,unknown>) => a.student_id as string)
    .filter(Boolean);

  const { data: eligibilityRows } = studentIds.length > 0
    ? await db
        .from("posting_eligibility")
        .select("*")
        .in("student_id", studentIds)
    : { data: [] };

  const eligibilityMap: Record<string, Record<string,unknown>> = {};
  for (const row of eligibilityRows ?? []) {
    const r = row as Record<string,unknown>;
    eligibilityMap[r.student_id as string] = r;
  }

  const students = (applications ?? []).map((a: Record<string,unknown>) => {
    const student = Array.isArray(a.student) ? a.student[0] : a.student as Record<string,unknown> | null;
    const course  = Array.isArray(a.courses) ? a.courses[0] : a.courses as Record<string,unknown> | null;
    const college = course ? (Array.isArray(course.colleges) ? course.colleges[0] : course.colleges) : null;
    return {
      applicationId: a.id as string,
      studentId:     a.student_id as string,
      currentStage:  a.current_stage as string,
      fullName:      student?.full_name as string ?? "—",
      email:         student?.email as string ?? "—",
      country:       student?.country as string | null ?? null,
      courseTitle:   course?.title as string ?? "—",
      collegeName:   (college as Record<string,unknown> | null)?.name as string ?? "—",
      eligibility:   eligibilityMap[a.student_id as string] ?? null,
    };
  });

  return <EligibilityClient students={students} />;
}
