import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { resolveStage } from "@/lib/application-stage-mapping";
import type { ApplicationStage } from "@/types/timeline";
import { getStageMeta } from "@/types/timeline";
import {
  GraduationCap, FileText, BookOpen, TrendingUp,
  CheckCircle2, ChevronRight, BarChart2, AlertCircle,
  Users, Clock,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────

export default async function InstitutionDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name, college_id")
    .eq("id", user.id)
    .single();

  const institutionName = profile?.full_name ?? "Your Institution";
  const collegeId       = (profile?.college_id as string | null) ?? null;

  // ── No college linked — show setup instruction ─────────────────────────────
  if (!collegeId) {
    return (
      <div className="max-w-2xl space-y-6">
        <h2 className="font-display text-3xl text-white">Institution Dashboard</h2>
        <div className="flex items-start gap-4 p-6 rounded-2xl bg-gold-400/[0.07] border border-gold-400/25">
          <AlertCircle className="w-5 h-5 text-gold-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-body font-semibold text-white/80 mb-1">No college linked to your account</p>
            <p className="font-body text-sm text-white/50 mb-3">
              Ask your PathPort admin to link your account to a college:
            </p>
            <code className="block bg-navy-950/80 border border-white/10 rounded-xl px-4 py-3 font-mono text-xs text-gold-300 whitespace-pre">
              {`UPDATE public.profiles\nSET college_id = '<college-uuid>'\nWHERE email = '${user.email}';`}
            </code>
          </div>
        </div>
        <Link
          href="/dashboard/institution/courses"
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-pathBlue-500/15 border border-pathBlue-500/25 text-pathBlue-400 font-body text-sm font-semibold hover:bg-pathBlue-500/25 transition-all"
        >
          <BookOpen className="w-4 h-4" /> Browse Courses
        </Link>
      </div>
    );
  }

  // ── Fetch courses for this college ─────────────────────────────────────────
  const { data: coursesRaw } = await supabase
    .from("courses")
    .select("id, title, status, intake_date, seats_total, seats_filled, category, level")
    .eq("college_id", collegeId)
    .order("created_at", { ascending: false });

  type CourseRow = { id: string; title: string; status: string; intake_date: string | null; seats_total: number; seats_filled: number; category: string; level: string };
  const courses: CourseRow[] = (coursesRaw ?? []) as CourseRow[];
  const courseIds = courses.map((c: CourseRow) => c.id);

  // ── Fetch applications for this college's courses ──────────────────────────
  // RLS also enforces this scope; explicit .in() keeps counts correct if RLS
  // is not yet configured.
  const { data: appsRaw } = courseIds.length > 0
    ? await supabase
        .from("applications")
        .select("id, status, current_stage, submitted_at, course_id, courses:course_id ( title )")
        .in("course_id", courseIds)
        .order("submitted_at", { ascending: false })
    : { data: [] };

  type RawApp = { id: string; status: string; current_stage: string | null; submitted_at: string; course_id: string; courses: unknown };
  const apps = ((appsRaw ?? []) as RawApp[]).map((a: RawApp) => {
    const rawCourse = Array.isArray(a.courses) ? (a.courses as { title: string }[])[0] : (a.courses as { title: string } | null);
    return {
      id:            a.id,
      status:        a.status,
      current_stage: resolveStage(a.current_stage, a.status),
      submitted_at:  a.submitted_at,
      course_title:  rawCourse?.title ?? "—",
    };
  });

  console.log("[InstitutionDashboard] courses:", courses.length, "| applications:", apps.length);

  // ── Pipeline stats (from real application stages) ──────────────────────────
  type AppItem = { id: string; status: string; current_stage: string; submitted_at: string; course_title: string };
  const typedApps: AppItem[] = apps;
  const totalApps = typedApps.length;
  const underReview = typedApps.filter((a: AppItem) => [
    "documents_uploaded", "documents_under_review", "documents_verified",
    "offer_letter_processing",
  ].includes(a.current_stage)).length;
  const offerSent = typedApps.filter((a: AppItem) => [
    "offer_letter_ready", "fee_payment_pending", "ipa_processing",
    "approved", "arrival_preparation", "arrived_singapore",
  ].includes(a.current_stage)).length;
  const enrolled = typedApps.filter((a: AppItem) => [
    "approved", "arrival_preparation", "arrived_singapore",
  ].includes(a.current_stage)).length;

  const pipeline = [
    { stage: "Applications",  count: totalApps,   color: "bg-pathBlue-500"   },
    { stage: "Under Review",  count: underReview, color: "bg-pathBlue-400"   },
    { stage: "Offer Sent",    count: offerSent,   color: "bg-gold-500"       },
    { stage: "Enrolled",      count: enrolled,    color: "bg-emerald-500"    },
  ];
  const pipelineMax = Math.max(totalApps, 1);

  // ── Open / draft / closed counts ──────────────────────────────────────────
  const openCourses  = courses.filter((c: CourseRow) => c.status === "open").length;
  const draftCourses = courses.filter((c: CourseRow) => c.status === "draft").length;
  const totalSeats   = courses.reduce((s: number, c: CourseRow) => s + (c.seats_total ?? 0), 0);
  const filledSeats  = courses.reduce((s: number, c: CourseRow) => s + (c.seats_filled ?? 0), 0);

  // ── Recent applications (last 5) ──────────────────────────────────────────
  const recentApps: AppItem[] = typedApps.slice(0, 5);

  return (
    <div className="space-y-7 max-w-6xl">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-pathBlue-600/15 via-navy-900/80 to-navy-950 border border-white/[0.08] p-6 md:p-8">
        <div aria-hidden className="absolute top-0 right-0 w-64 h-64 bg-pathBlue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg bg-pathBlue-500/20 border border-pathBlue-500/30 flex items-center justify-center">
              <GraduationCap className="w-4 h-4 text-pathBlue-400" />
            </div>
            <span className="text-pathBlue-400 font-body text-xs font-semibold tracking-wider uppercase">Institution Portal</span>
          </div>
          <h2 className="font-display text-4xl text-white mb-1">{institutionName}</h2>
          <p className="text-white/45 font-body text-sm">
            {openCourses} open course{openCourses !== 1 ? "s" : ""} · {totalApps} total application{totalApps !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="relative mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Total Applications", value: String(totalApps),  icon: FileText,      gold: true  },
            { label: "Enrolled",           value: String(enrolled),   icon: CheckCircle2,  gold: false },
            { label: "Open Courses",       value: String(openCourses),icon: BookOpen,      gold: false },
            { label: "Seats Filled",       value: `${filledSeats}/${totalSeats}`, icon: Users, gold: false },
          ].map(({ label, value, icon: Icon, gold }) => (
            <div key={label} className={`rounded-xl border px-4 py-3 ${gold ? "bg-gold-400/[0.10] border-gold-400/30" : "bg-white/[0.05] border-white/[0.09]"}`}>
              <div className="flex items-center gap-2 mb-1">
                <Icon className={`w-3.5 h-3.5 ${gold ? "text-gold-400" : "text-white/40"}`} strokeWidth={2} />
                <p className="text-white/40 font-body text-[10px] uppercase tracking-wider">{label}</p>
              </div>
              <p className={`font-display text-2xl font-bold ${gold ? "text-gold-400" : "text-white"}`}>{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Pipeline + Programmes ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* Pipeline funnel — 2/5 */}
        <div className="lg:col-span-2 bg-white/[0.04] border border-white/[0.08] rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-5">
            <BarChart2 className="w-4 h-4 text-gold-400" />
            <h3 className="font-display text-xl text-white">Application Pipeline</h3>
          </div>
          {totalApps === 0 ? (
            <div className="text-center py-8 text-white/25 font-body text-sm">
              No applications yet
            </div>
          ) : (
            <div className="space-y-3">
              {pipeline.map((s) => {
                const pct = Math.round((s.count / pipelineMax) * 100);
                return (
                  <div key={s.stage}>
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-body text-xs text-white/60">{s.stage}</p>
                      <p className="font-body text-xs font-bold text-white/80">{s.count}</p>
                    </div>
                    <div className="h-6 bg-white/[0.05] rounded-lg overflow-hidden">
                      <div
                        className={`h-full ${s.color} rounded-lg flex items-center px-2 transition-all`}
                        style={{ width: `${Math.max(pct, s.count > 0 ? 8 : 0)}%` }}
                      >
                        {pct > 10 && <span className="font-body text-[10px] font-bold text-white/90">{pct}%</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {enrolled > 0 && (
            <div className="mt-4 p-3 rounded-xl bg-emerald-500/[0.07] border border-emerald-500/20">
              <p className="text-emerald-400 font-body text-xs font-semibold">
                {Math.round((enrolled / Math.max(totalApps, 1)) * 100)}% enrolment rate
              </p>
            </div>
          )}
        </div>

        {/* Programmes — 3/5 */}
        <div className="lg:col-span-3 bg-white/[0.04] border border-white/[0.08] rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.07]">
            <h3 className="font-display text-xl text-white">Courses</h3>
            <Link href="/dashboard/institution/courses" className="text-gold-400 hover:text-gold-300 font-body text-xs flex items-center gap-1">
              Manage <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          {courses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-white/25">
              <BookOpen className="w-10 h-10 mb-3" />
              <p className="font-body text-sm">No courses yet</p>
              <Link href="/dashboard/institution/courses/new" className="mt-3 text-gold-400 font-body text-xs">
                Create your first course →
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-white/[0.05]">
              {courses.slice(0, 4).map((c) => {
                const fillPct = c.seats_total > 0 ? Math.round((c.seats_filled / c.seats_total) * 100) : 0;
                return (
                  <div key={c.id} className="px-6 py-4">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div>
                        <p className="font-body font-semibold text-sm text-white/85">{c.title}</p>
                        <p className="font-body text-xs text-white/35 mt-0.5">
                          {c.intake_date ? new Date(c.intake_date).toLocaleDateString("en-SG", { month: "short", year: "numeric" }) : "No intake date"}
                          {" · "}{c.level?.replace(/_/g, " ")}
                        </p>
                      </div>
                      <span className={`flex-shrink-0 px-2.5 py-0.5 rounded-full border font-body text-[11px] font-semibold ${
                        c.status === "open"   ? "bg-emerald-500/10 border-emerald-400/30 text-emerald-400" :
                        c.status === "draft"  ? "bg-white/[0.06]   border-white/[0.10]   text-white/40"   :
                                                "bg-orange-500/10  border-orange-400/30  text-orange-400"
                      }`}>
                        {c.status === "open" ? "Open" : c.status === "draft" ? "Draft" : "Closed"}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-1.5 bg-white/[0.07] rounded-full">
                        <div
                          className={`h-full rounded-full ${fillPct > 80 ? "bg-orange-500" : "bg-pathBlue-500"}`}
                          style={{ width: `${fillPct}%` }}
                        />
                      </div>
                      <p className="text-white/40 font-body text-[11px] flex-shrink-0">{c.seats_filled}/{c.seats_total} seats</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {draftCourses > 0 && (
            <div className="px-6 py-3 border-t border-white/[0.05]">
              <p className="text-white/30 font-body text-xs">{draftCourses} draft course{draftCourses !== 1 ? "s" : ""} — publish to accept applications</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Recent Applications ────────────────────────────────────────────── */}
      <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.07]">
          <h3 className="font-display text-xl text-white">Recent Applications</h3>
          <Link href="/dashboard/institution/applications" className="text-gold-400 hover:text-gold-300 font-body text-xs flex items-center gap-1">
            View all <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        {recentApps.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-white/25">
            <FileText className="w-10 h-10 mb-3" />
            <p className="font-body text-sm">No applications yet</p>
            <p className="font-body text-xs mt-1 text-white/20">Applications will appear here once students apply to your courses</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  {["Course", "Stage", "Submitted"].map(h => (
                    <th key={h} className="text-left px-6 py-3 text-white/30 font-body text-xs uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentApps.map((app) => {
                  const meta = getStageMeta(app.current_stage as ApplicationStage);
                  return (
                    <tr key={app.id} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-3.5 font-body text-sm text-white/75 max-w-[220px] truncate">{app.course_title}</td>
                      <td className="px-6 py-3.5">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border font-body text-[11px] font-semibold ${meta.color}`}>
                          {meta.emoji} {meta.label}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 font-body text-xs text-white/35 whitespace-nowrap">
                        {new Date(app.submitted_at).toLocaleDateString("en-SG", { day: "numeric", month: "short", year: "2-digit" })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Quick links ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { icon: FileText,     title: "Review Applications", desc: "See all pending applications and update their stages",    href: "/dashboard/institution/applications" },
          { icon: BookOpen,     title: "Manage Courses",      desc: "Edit course details, intake dates, and seat capacity",    href: "/dashboard/institution/courses"      },
          { icon: TrendingUp,   title: "Add New Course",      desc: "Publish a new diploma or advanced diploma programme",     href: "/dashboard/institution/courses/new"  },
        ].map(({ icon: Icon, title, desc, href }) => (
          <Link key={title} href={href} className="group p-5 bg-white/[0.03] border border-white/[0.07] rounded-2xl hover:border-gold-400/30 hover:bg-gold-400/[0.03] transition-all">
            <div className="w-9 h-9 rounded-xl bg-gold-400/[0.08] border border-gold-400/20 flex items-center justify-center mb-3">
              <Icon className="w-4 h-4 text-gold-400" />
            </div>
            <p className="font-body font-semibold text-sm text-white/80 group-hover:text-white mb-1">{title}</p>
            <p className="font-body text-xs text-white/35 leading-relaxed">{desc}</p>
          </Link>
        ))}
      </div>

    </div>
  );
}
