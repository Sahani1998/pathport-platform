import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import CourseManagementClient from "@/components/admin/CourseManagementClient";

export const metadata = { title: "Courses — Admin" };

interface PageProps {
  searchParams: Promise<{ college?: string }>;
}

export default async function AdminCoursesPage({ searchParams }: PageProps) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") redirect("/dashboard");

  const { college: collegeFilter } = await searchParams;

  const [{ data: courses }, { data: colleges }, { data: applicationRows }] = await Promise.all([
    supabase
      .from("courses")
      .select(`
        id, college_id, title, slug, category, description,
        duration_months, tuition_fee, application_fee,
        intake_date, seats_total, seats_filled,
        study_mode, level, status, is_published, created_at
      `)
      .order("created_at", { ascending: false }),
    supabase
      .from("colleges")
      .select("id, name, slug, is_active")
      .order("name"),
    supabase
      .from("applications")
      .select("course_id"),
  ]);

  const appCounts: Record<string, number> = {};
  for (const a of (applicationRows ?? []) as { course_id: string }[]) {
    appCounts[a.course_id] = (appCounts[a.course_id] ?? 0) + 1;
  }

  return (
    <div className="max-w-6xl space-y-6">
      <div>
        <h2 className="font-display text-3xl text-white mb-1">Courses</h2>
        <p className="text-white/40 font-body text-sm">
          Create, edit, and archive courses across all partner institutions
        </p>
      </div>

      <CourseManagementClient
        courses={courses ?? []}
        colleges={colleges ?? []}
        applicationCounts={appCounts}
        initialCollegeFilter={collegeFilter ?? ""}
      />
    </div>
  );
}
