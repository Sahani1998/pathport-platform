import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { resolveStage } from "@/lib/application-stage-mapping";
import type { ApplicationStage } from "@/types/timeline";
import { getStageMeta, STAGE_META } from "@/types/timeline";
import {
  Users, Search, Filter, GraduationCap,
  Mail, Globe, ChevronRight,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type StudentRow = {
  application_id: string;
  student_id:     string;
  full_name:      string;
  email:          string;
  country:        string | null;
  course_id:      string;
  course_title:   string;
  intake_date:    string | null;
  current_stage:  ApplicationStage;
  status:         string;
  submitted_at:   string;
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function InstitutionStudentsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const sp       = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles").select("role, college_id").eq("id", user.id).single();

  if (profile?.role !== "institution" && profile?.role !== "admin") {
    redirect("/dashboard");
  }

  const collegeId = (profile?.college_id as string | null) ?? null;

  if (!collegeId && profile?.role !== "admin") {
    return (
      <div className="max-w-3xl space-y-6">
        <h2 className="font-display text-3xl text-white">Students</h2>
        <p className="font-body text-sm text-white/45">No college linked to your account.</p>
      </div>
    );
  }

  // ── Filters from query params ───────────────────────────────────────────────
  const filterCourse = (sp.course ?? "").trim();
  const filterIntake = (sp.intake ?? "").trim();
  const filterStage  = (sp.stage  ?? "").trim();
  const filterStatus = (sp.status ?? "").trim();
  const filterSearch = (sp.search ?? "").trim().toLowerCase();

  // ── Fetch courses for the college ──────────────────────────────────────────
  let courseQuery = supabase.from("courses").select("id, title, intake_date");
  if (collegeId) courseQuery = courseQuery.eq("college_id", collegeId);
  const { data: courseRows } = await courseQuery;

  type CourseRow = { id: string; title: string; intake_date: string | null };
  const courses: CourseRow[] = (courseRows ?? []) as CourseRow[];
  const courseIds = courses.map(c => c.id);
  const courseMap = new Map(courses.map(c => [c.id, c]));

  // ── Fetch applications scoped to college courses ──────────────────────────
  let students: StudentRow[] = [];
  if (courseIds.length > 0) {
    const { data: appsRaw } = await supabase
      .from("applications")
      .select("id, status, current_stage, submitted_at, student_id, course_id")
      .in("course_id", courseIds)
      .order("submitted_at", { ascending: false });

    type RawApp = { id: string; status: string; current_stage: string | null; submitted_at: string; student_id: string; course_id: string };
    const apps = (appsRaw ?? []) as RawApp[];

    // Batch-load student profiles
    const studentIds = Array.from(new Set(apps.map(a => a.student_id).filter(Boolean)));
    const { data: profileRows } = studentIds.length
      ? await supabase.from("profiles").select("id, full_name, email, country").in("id", studentIds)
      : { data: [] };
    type ProfileRow = { id: string; full_name: string | null; email: string; country: string | null };
    const profileMap = new Map((profileRows ?? []).map(p => [(p as ProfileRow).id, p as ProfileRow]));

    students = apps.map(a => {
      const sp_ = profileMap.get(a.student_id);
      const course = courseMap.get(a.course_id);
      return {
        application_id: a.id,
        student_id:     a.student_id,
        full_name:      sp_?.full_name ?? "Unknown",
        email:          sp_?.email     ?? "—",
        country:        sp_?.country   ?? null,
        course_id:      a.course_id,
        course_title:   course?.title  ?? "—",
        intake_date:    course?.intake_date ?? null,
        current_stage:  resolveStage(a.current_stage, a.status),
        status:         a.status,
        submitted_at:   a.submitted_at,
      };
    });
  }

  // ── Apply filters ──────────────────────────────────────────────────────────
  let filtered = students;
  if (filterCourse) filtered = filtered.filter(s => s.course_id === filterCourse);
  if (filterIntake) filtered = filtered.filter(s => s.intake_date === filterIntake);
  if (filterStage)  filtered = filtered.filter(s => s.current_stage === filterStage);
  if (filterStatus) filtered = filtered.filter(s => s.status === filterStatus);
  if (filterSearch) {
    filtered = filtered.filter(s =>
      s.full_name.toLowerCase().includes(filterSearch) ||
      s.email.toLowerCase().includes(filterSearch)
    );
  }

  // Unique intakes for filter
  const intakes = Array.from(new Set(courses.map(c => c.intake_date).filter(Boolean) as string[])).sort();

  const totalStudents = new Set(students.map(s => s.student_id)).size;
  const filteredCount = filtered.length;

  return (
    <div className="max-w-7xl space-y-6">

      {/* Header */}
      <div>
        <h1 className="font-display text-3xl text-white mb-1">Student Roster</h1>
        <p className="text-white/45 font-body text-sm">
          {totalStudents} unique student{totalStudents !== 1 ? "s" : ""} across {students.length} application{students.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total Applications", value: students.length, color: "text-pathBlue-400" },
          { label: "Unique Students",    value: totalStudents,   color: "text-gold-400" },
          { label: "Approved",
            value: students.filter(s => ["approved", "arrival_preparation", "arrived_singapore"].includes(s.current_stage)).length,
            color: "text-emerald-400" },
          { label: "In Progress",
            value: students.filter(s => !["approved", "arrival_preparation", "arrived_singapore", "rejected", "withdrawn"].includes(s.current_stage)).length,
            color: "text-orange-400" },
        ].map(s => (
          <div key={s.label} className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-4">
            <p className="font-body text-[10px] text-white/40 uppercase tracking-wider mb-1">{s.label}</p>
            <p className={`font-display text-3xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <form method="GET" className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-4 h-4 text-white/40" />
          <span className="font-body text-sm text-white/70 font-semibold">Filters</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search */}
          <div className="lg:col-span-2 relative">
            <Search className="w-4 h-4 text-white/30 absolute left-3 top-3 pointer-events-none" />
            <input
              name="search"
              type="text"
              defaultValue={filterSearch}
              placeholder="Search name or email…"
              className="w-full bg-white/[0.05] border border-white/[0.10] rounded-xl pl-9 pr-3 py-2 font-body text-sm text-white placeholder-white/25 focus:outline-none focus:border-white/25"
            />
          </div>

          {/* Course */}
          <select
            name="course"
            defaultValue={filterCourse}
            className="bg-white/[0.05] border border-white/[0.10] rounded-xl px-3 py-2 font-body text-sm text-white/80 focus:outline-none focus:border-white/25 [&>option]:bg-navy-900"
          >
            <option value="">All courses</option>
            {courses.map(c => (
              <option key={c.id} value={c.id}>{c.title}</option>
            ))}
          </select>

          {/* Intake */}
          <select
            name="intake"
            defaultValue={filterIntake}
            className="bg-white/[0.05] border border-white/[0.10] rounded-xl px-3 py-2 font-body text-sm text-white/80 focus:outline-none focus:border-white/25 [&>option]:bg-navy-900"
          >
            <option value="">All intakes</option>
            {intakes.map(i => (
              <option key={i} value={i}>
                {new Date(i).toLocaleDateString("en-SG", { month: "short", year: "numeric" })}
              </option>
            ))}
          </select>

          {/* Stage */}
          <select
            name="stage"
            defaultValue={filterStage}
            className="bg-white/[0.05] border border-white/[0.10] rounded-xl px-3 py-2 font-body text-sm text-white/80 focus:outline-none focus:border-white/25 [&>option]:bg-navy-900"
          >
            <option value="">All stages</option>
            {STAGE_META.filter(s => s.step > 0).map(s => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>

        <div className="flex gap-2 mt-3">
          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-pathBlue-500/15 border border-pathBlue-500/30 text-pathBlue-400 font-body text-sm font-semibold hover:bg-pathBlue-500/25 transition-all"
          >
            Apply filters
          </button>
          {(filterCourse || filterIntake || filterStage || filterStatus || filterSearch) && (
            <Link
              href="/dashboard/institution/students"
              className="px-4 py-2 rounded-xl bg-white/[0.04] border border-white/[0.09] text-white/45 font-body text-sm hover:text-white/70 hover:border-white/20 transition-all"
            >
              Clear
            </Link>
          )}
        </div>
      </form>

      {/* Results */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white/[0.03] border border-white/[0.07] rounded-2xl">
          <GraduationCap className="w-10 h-10 text-white/20 mb-3" />
          <p className="font-display text-xl text-white/40 mb-1">
            {students.length === 0 ? "No students yet" : "No matches"}
          </p>
          <p className="font-body text-sm text-white/25">
            {students.length === 0
              ? "Students will appear here once they apply to your courses."
              : "Adjust the filters above to see more results."}
          </p>
        </div>
      ) : (
        <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-6 py-3 border-b border-white/[0.07]">
            <p className="font-body text-sm text-white/55">
              Showing {filteredCount} of {students.length}
            </p>
            <Users className="w-4 h-4 text-white/30" />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  {["Student", "Course", "Intake", "Stage", "Applied"].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-white/30 font-body text-xs uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(s => {
                  const meta = getStageMeta(s.current_stage);
                  return (
                    <tr key={s.application_id} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                      <td className="px-5 py-4">
                        <p className="font-body font-semibold text-sm text-white/85">{s.full_name}</p>
                        <p className="font-body text-xs text-white/35 flex items-center gap-1">
                          <Mail className="w-3 h-3" /> {s.email}
                        </p>
                        {s.country && (
                          <p className="font-body text-[11px] text-white/30 flex items-center gap-1 mt-0.5">
                            <Globe className="w-3 h-3" /> {s.country}
                          </p>
                        )}
                      </td>
                      <td className="px-5 py-4 max-w-[200px]">
                        <p className="font-body text-sm text-white/75 truncate">{s.course_title}</p>
                      </td>
                      <td className="px-5 py-4 font-body text-xs text-white/55 whitespace-nowrap">
                        {s.intake_date
                          ? new Date(s.intake_date).toLocaleDateString("en-SG", { month: "short", year: "numeric" })
                          : "—"}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border font-body text-[11px] font-semibold ${meta.color}`}>
                          {meta.emoji} {meta.label}
                        </span>
                      </td>
                      <td className="px-5 py-4 font-body text-xs text-white/35 whitespace-nowrap">
                        {new Date(s.submitted_at).toLocaleDateString("en-SG", { day: "numeric", month: "short", year: "2-digit" })}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <Link
                          href={`/dashboard/institution/applications/${s.application_id}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/[0.05] border border-white/[0.09] text-white/55 font-body text-xs hover:border-gold-400/30 hover:text-gold-400 transition-all whitespace-nowrap"
                        >
                          Open <ChevronRight className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
