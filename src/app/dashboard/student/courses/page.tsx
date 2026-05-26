import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import CourseFilters from "@/components/courses/CourseFilters";
import type { CourseWithCollege } from "@/types/courses";
import { APPLICATION_STATUSES } from "@/types/courses";
import {
  BookOpen, Building2, Calendar, Clock,
  Users, ChevronRight, BadgeCheck,
} from "lucide-react";

// ─── helpers ────────────────────────────────────────────────────────────────
function fmtSGD(n: number) {
  return `S$${n.toLocaleString("en-SG")}`;
}
function seatsLabel(total: number, filled: number) {
  const left = total - filled;
  if (left <= 0)  return { text: "Full",            color: "text-red-400    bg-red-500/10    border-red-400/25"    };
  if (left <= 5)  return { text: `${left} left`,    color: "text-orange-400 bg-orange-500/10 border-orange-400/25" };
  return           { text: `${left} seats left`,    color: "text-emerald-400 bg-emerald-500/10 border-emerald-400/25" };
}

// ─── page ────────────────────────────────────────────────────────────────────
export default async function StudentCoursesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user.id).single();
  // PREVIEW MODE: role guard temporarily disabled
  // if (profile?.role !== "student") redirect("/dashboard");

  console.log("[Courses] loading course browser, filters:", params);

  // ── Build query ─────────────────────────────────────────────────────────
  let query = supabase
    .from("courses")
    .select(`
      *,
      colleges (id, name, slug, logo_url, website)
    `)
    .order("created_at", { ascending: false });

  if (params.search) {
    query = query.or(
      `title.ilike.%${params.search}%,category.ilike.%${params.search}%`
    );
  }
  if (params.category) query = query.eq("category",  params.category);
  if (params.level)    query = query.eq("level",     params.level);
  if (params.status)   query = query.eq("status",    params.status);

  const { data: courses, error } = await query;

  if (error) {
    console.error("[Courses] fetch error:", error.code, error.message);
  }

  // Fetch student's existing applications so we can show "Applied" on cards
  const { data: myApps } = await supabase
    .from("applications")
    .select("course_id, status")
    .eq("student_id", user.id);

  const appliedCourseIds = new Set((myApps ?? []).map(a => a.course_id));

  const courseList = (courses ?? []) as CourseWithCollege[];

  return (
    <div className="max-w-7xl space-y-6">

      {/* Header */}
      <div>
        <h2 className="font-display text-3xl text-white mb-1">Course Browser</h2>
        <p className="text-white/45 font-body text-sm">
          {courseList.length} programme{courseList.length !== 1 ? "s" : ""} available across Singapore&apos;s top private colleges
        </p>
      </div>

      <div className="flex gap-6">

        {/* Filter sidebar */}
        <aside className="w-56 flex-shrink-0">
          <Suspense>
            <CourseFilters
              currentSearch={params.search}
              currentCategory={params.category}
              currentLevel={params.level}
              currentStatus={params.status}
            />
          </Suspense>
        </aside>

        {/* Course grid */}
        <div className="flex-1 min-w-0">
          {courseList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-white/25">
              <BookOpen className="w-12 h-12 mb-4" />
              <p className="font-display text-2xl text-white/40 mb-1">No courses found</p>
              <p className="font-body text-sm">Try adjusting your filters</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              {courseList.map((course) => {
                const seats   = seatsLabel(course.seats_total, course.seats_filled);
                const applied = appliedCourseIds.has(course.id);
                const appStatus = myApps?.find(a => a.course_id === course.id)?.status;
                const appMeta  = APPLICATION_STATUSES.find(s => s.value === appStatus);

                return (
                  <Link
                    key={course.id}
                    href={`/dashboard/student/courses/${course.slug}`}
                    className="group block bg-white/[0.04] border border-white/[0.08] rounded-2xl p-5 hover:border-gold-400/30 hover:bg-gold-400/[0.03] transition-all duration-200"
                  >
                    {/* Top row */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-pathBlue-500/15 border border-pathBlue-500/20 flex items-center justify-center flex-shrink-0">
                          <Building2 className="w-4 h-4 text-pathBlue-400" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-white/40 font-body text-xs truncate">{course.colleges?.name}</p>
                          <p className="text-white/85 font-body font-semibold text-sm leading-tight mt-0.5 group-hover:text-white transition-colors line-clamp-2">
                            {course.title}
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-gold-400/60 group-hover:translate-x-0.5 flex-shrink-0 mt-1 transition-all" />
                    </div>

                    {/* Badges row */}
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      <span className="px-2.5 py-0.5 rounded-lg bg-pathBlue-500/10 border border-pathBlue-500/20 text-pathBlue-400 font-body text-[11px] font-semibold">
                        {course.category}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-lg bg-white/[0.05] border border-white/[0.09] text-white/50 font-body text-[11px]">
                        {course.level.replace("_", " ")}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-lg bg-white/[0.05] border border-white/[0.09] text-white/50 font-body text-[11px]">
                        {course.duration_months} mo
                      </span>
                      {course.status === "open" ? (
                        <span className={`px-2.5 py-0.5 rounded-lg border font-body text-[11px] font-semibold ${seats.color}`}>
                          {seats.text}
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white/30 font-body text-[11px]">
                          Closed
                        </span>
                      )}
                    </div>

                    {/* Fee + intake row */}
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-4">
                        <div>
                          <p className="text-white/30 font-body text-[10px] uppercase tracking-wider">Tuition</p>
                          <p className="text-gold-400 font-display text-base font-bold">{fmtSGD(course.tuition_fee)}</p>
                        </div>
                        {course.intake_date && (
                          <div>
                            <p className="text-white/30 font-body text-[10px] uppercase tracking-wider">Intake</p>
                            <p className="text-white/65 font-body text-xs font-semibold">
                              {new Date(course.intake_date).toLocaleDateString("en-SG", { month: "short", year: "numeric" })}
                            </p>
                          </div>
                        )}
                      </div>

                      {applied && (
                        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border font-body text-[11px] font-semibold ${appMeta?.color ?? "text-white/40 bg-white/[0.06] border-white/[0.10]"}`}>
                          <BadgeCheck className="w-3 h-3 flex-shrink-0" />
                          {appMeta?.label ?? "Applied"}
                        </div>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
