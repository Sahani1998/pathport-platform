import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import DeleteCourseButton from "@/components/courses/DeleteCourseButton";
import type { Course } from "@/types/courses";
import {
  BookOpen, Plus, Edit2, Users, ChevronRight,
  Building2, GraduationCap, Info, Receipt,
} from "lucide-react";

function fmtSGD(n: number) {
  return `S$${n.toLocaleString("en-SG")}`;
}

export default async function InstitutionCoursesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name, college_id")
    .eq("id", user.id).single();

  // PREVIEW MODE: role guard temporarily disabled
  // if (profile?.role !== "institution") redirect("/dashboard");

  const isAdmin = profile?.role === "admin";
  console.log("[InstitutionPortal] loading courses, role:", profile?.role, "| college_id:", profile?.college_id);

  // Institution users MUST have a college linked.
  // Admin users bypass this requirement and see all courses.
  if (!profile?.college_id && !isAdmin) {
    return (
      <div className="max-w-2xl">
        <h2 className="font-display text-3xl text-white mb-2">Course Management</h2>
        <div className="mt-6 p-6 rounded-2xl bg-gold-400/[0.07] border border-gold-400/25">
          <div className="flex items-start gap-4">
            <Info className="w-6 h-6 text-gold-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-display text-xl text-white mb-2">College not linked</p>
              <p className="text-white/55 font-body text-sm mb-3">
                Your institution account is not linked to a college yet. An admin needs to run:
              </p>
              <code className="block p-3 rounded-xl bg-navy-950 border border-white/[0.09] text-gold-300 font-mono text-xs break-all">
                UPDATE public.profiles SET college_id = &apos;&lt;college-uuid&gt;&apos; WHERE id = &apos;{user.id}&apos;;
              </code>
              <p className="text-white/40 font-body text-xs mt-3">
                Contact pathpportsg@gmail.com to get your college linked.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Fetch college + courses ────────────────────────────────────────────────
  // Admin with no college_id → fetch ALL colleges and ALL courses for oversight.
  // Institution user → fetch only their college and its courses.
  let college = null;
  let courses = null;
  let fetchError = null;

  if (isAdmin && !profile?.college_id) {
    // Admin overview: all courses joined with college name
    const { data, error } = await supabase
      .from("courses")
      .select("*, colleges(id, name)")
      .order("created_at", { ascending: false });
    courses     = data;
    fetchError  = error;
    college     = { name: "All Colleges (Admin View)" };
  } else {
    // Institution user (or admin with college_id): scoped to their college
    const [colRes, courseRes] = await Promise.all([
      supabase.from("colleges").select("*").eq("id", profile!.college_id!).single(),
      supabase.from("courses").select("*").eq("college_id", profile!.college_id!).order("created_at", { ascending: false }),
    ]);
    college    = colRes.data;
    courses    = courseRes.data;
    fetchError = courseRes.error;
  }

  if (fetchError) {
    console.error("[InstitutionPortal] courses fetch error:", fetchError.code, fetchError.message);
  }

  const courseList = (courses ?? []) as Course[];

  const stats = {
    total:       courseList.length,
    open:        courseList.filter(c => c.status === "open").length,
    totalSeats:  courseList.reduce((s, c) => s + c.seats_total,  0),
    filledSeats: courseList.reduce((s, c) => s + c.seats_filled, 0),
  };

  return (
    <div className="max-w-6xl space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Building2 className="w-4 h-4 text-pathBlue-400" />
            <span className="text-pathBlue-400 font-body text-xs font-semibold uppercase tracking-wider">
              {isAdmin && !profile?.college_id ? "Admin View · All Colleges" : (college as { name: string })?.name}
            </span>
          </div>
          <h2 className="font-display text-3xl text-white">Course Management</h2>
        </div>
        <Link href="/dashboard/institution/courses/new">
          <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gold-400/15 border border-gold-400/30 text-gold-400 font-body text-sm font-semibold hover:bg-gold-400/25 transition-all">
            <Plus className="w-4 h-4" /> New Course
          </div>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Courses",  value: stats.total,       gold: true },
          { label: "Open",           value: stats.open,        gold: false },
          { label: "Total Seats",    value: stats.totalSeats,  gold: false },
          { label: "Seats Filled",   value: stats.filledSeats, gold: false },
        ].map(({ label, value, gold }) => (
          <div key={label} className={`rounded-2xl border p-4 ${gold ? "bg-gold-400/[0.07] border-gold-400/25" : "bg-white/[0.04] border-white/[0.08]"}`}>
            <p className={`font-display text-3xl font-bold ${gold ? "text-gold-400" : "text-white"}`}>{value}</p>
            <p className="text-white/40 font-body text-xs mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Course table */}
      {courseList.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white/[0.03] border border-white/[0.07] rounded-2xl">
          <BookOpen className="w-12 h-12 text-white/20 mb-4" />
          <p className="font-display text-2xl text-white/40 mb-1">No courses yet</p>
          <p className="text-white/30 font-body text-sm mb-6">Create your first course to start accepting applications</p>
          <Link href="/dashboard/institution/courses/new">
            <div className="px-5 py-3 rounded-xl bg-gold-400/15 border border-gold-400/30 text-gold-400 font-body text-sm font-semibold hover:bg-gold-400/25 transition-all">
              <Plus className="w-4 h-4 inline mr-1" /> Create First Course
            </div>
          </Link>
        </div>
      ) : (
        <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.07]">
            <h3 className="font-display text-xl text-white">All Courses</h3>
            <span className="text-white/35 font-body text-sm">{courseList.length} total</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  {["Course", "Category", "Level", "Tuition", "Seats", "Intake", "Status", ""].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-white/30 font-body text-xs uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {courseList.map((course) => {
                  const fillPct  = Math.round((course.seats_filled / course.seats_total) * 100);
                  const seatsLeft = course.seats_total - course.seats_filled;

                  return (
                    <tr key={course.id} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors group">
                      <td className="px-5 py-4 max-w-[220px]">
                        <p className="font-body font-semibold text-sm text-white/85 truncate">{course.title}</p>
                        <p className="font-body text-xs text-white/35 mt-0.5">{course.duration_months} months · {course.study_mode.replace("_", "-")}</p>
                      </td>
                      <td className="px-5 py-4">
                        <span className="px-2.5 py-0.5 rounded-lg bg-pathBlue-500/10 border border-pathBlue-500/20 text-pathBlue-400 font-body text-xs font-semibold">
                          {course.category}
                        </span>
                      </td>
                      <td className="px-5 py-4 font-body text-xs text-white/50 whitespace-nowrap">
                        {course.level.replace(/_/g, " ")}
                      </td>
                      <td className="px-5 py-4 font-body text-sm font-bold text-gold-400 whitespace-nowrap">
                        {fmtSGD(course.tuition_fee)}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-white/[0.07] rounded-full">
                            <div className={`h-full rounded-full ${fillPct > 80 ? "bg-orange-500" : "bg-pathBlue-500"}`} style={{ width: `${Math.min(100, fillPct)}%` }} />
                          </div>
                          <span className="text-white/45 font-body text-xs whitespace-nowrap">{seatsLeft}/{course.seats_total}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 font-body text-xs text-white/45 whitespace-nowrap">
                        {course.intake_date
                          ? new Date(course.intake_date).toLocaleDateString("en-SG", { month: "short", year: "numeric" })
                          : "—"}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`px-2.5 py-0.5 rounded-full border font-body text-[11px] font-semibold ${
                          course.status === "open"   ? "bg-emerald-500/10 border-emerald-400/25 text-emerald-400" :
                          course.status === "draft"  ? "bg-white/[0.05] border-white/[0.10] text-white/35" :
                                                       "bg-red-500/10 border-red-400/25 text-red-400"
                        }`}>
                          {course.status}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Link
                            href={`/dashboard/institution/courses/${course.id}/fee-schedules`}
                            className="p-2 rounded-xl text-white/40 hover:text-gold-400 hover:bg-gold-400/10 border border-transparent hover:border-gold-400/20 transition-all"
                            title="Fee Schedules"
                          >
                            <Receipt className="w-4 h-4" />
                          </Link>
                          <Link
                            href={`/dashboard/institution/courses/${course.id}/edit`}
                            className="p-2 rounded-xl text-white/40 hover:text-gold-400 hover:bg-gold-400/10 border border-transparent hover:border-gold-400/20 transition-all"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Link>
                          <DeleteCourseButton courseId={course.id} courseTitle={course.title} />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Applications link */}
      {courseList.length > 0 && (
        <Link href="/dashboard/institution/applications" className="flex items-center justify-between p-5 rounded-2xl bg-white/[0.03] border border-white/[0.07] hover:border-gold-400/25 hover:bg-gold-400/[0.03] transition-all group">
          <div className="flex items-center gap-3">
            <GraduationCap className="w-5 h-5 text-gold-400/70" />
            <div>
              <p className="font-body font-semibold text-sm text-white/75 group-hover:text-white/90">Review Student Applications</p>
              <p className="font-body text-xs text-white/35">See all applications for your courses, update statuses, and add notes</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-white/25 group-hover:text-gold-400/60 transition-colors" />
        </Link>
      )}
    </div>
  );
}
