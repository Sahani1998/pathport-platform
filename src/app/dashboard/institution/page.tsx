import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { resolveStage } from "@/lib/application-stage-mapping";
import type { ApplicationStage } from "@/types/timeline";
import { getStageMeta } from "@/types/timeline";
import type { InstitutionDashboardSummary } from "@/types/analytics";
import {
  GraduationCap, FileText, BookOpen, ChevronRight, BarChart2,
  AlertCircle, Users, Clock, CheckCircle2, XCircle, RefreshCw,
  Activity, FileCheck, FileClock, Plane, Upload, Eye,
  TrendingUp, Calendar, ArrowUpRight,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type AppRow = {
  id:             string;
  status:         string;
  current_stage:  string | null;
  submitted_at:   string;
  student_id:     string;
  course_id:      string;
  course_title:   string;
};

type DocRow = {
  id:            string;
  document_type: string;
  status:        string;
  uploaded_at:   string;
  student_id:    string;
  application_id: string | null;
};

type OfferRow = {
  id:             string;
  application_id: string;
  file_name:      string;
  version:        number;
  created_at:     string;
};

type TimelineRow = {
  id:             string;
  application_id: string;
  stage:          string;
  title:          string;
  description:    string | null;
  created_at:     string;
};

// Live-display slice sizes — small bounded queries for the lists below the metrics
const RECENT_APPS_LIMIT     = 5;
const REVIEW_QUEUE_LIMIT    = 5;
const OFFER_QUEUE_LIMIT     = 5;
const RECENT_OFFERS_LIMIT   = 5;
const RECENT_ACTIVITY_LIMIT = 10;

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function InstitutionDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name, college_id")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "institution" && profile?.role !== "admin") {
    redirect("/dashboard");
  }

  const collegeId = (profile?.college_id as string | null) ?? null;

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
              Ask your PathPort admin to link your account to a college.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── Load college info for header ───────────────────────────────────────────
  const { data: college } = await supabase
    .from("colleges")
    .select("id, name, country")
    .eq("id", collegeId)
    .single();

  const institutionName = college?.name ?? profile?.full_name ?? "Your Institution";

  // ── Course IDs for this college (still need course list + titles for UI) ───
  const { data: courseRows } = await supabase
    .from("courses")
    .select("id, title, status, seats_total, seats_filled, intake_date")
    .eq("college_id", collegeId);

  type CourseRow = { id: string; title: string; status: string; seats_total: number; seats_filled: number; intake_date: string | null };
  const courses: CourseRow[] = (courseRows ?? []) as CourseRow[];
  const courseIds = courses.map(c => c.id);
  const courseMap = new Map(courses.map(c => [c.id, c.title]));

  // ── Single SQL aggregation call replaces all bulk metric calculations ──────
  const { data: summaryData, error: summaryErr } = await supabase.rpc(
    "get_institution_dashboard_summary",
    { p_college_id: collegeId },
  );

  if (summaryErr) console.error("[InstitutionDashboard] RPC error:", summaryErr.code, summaryErr.message);

  const summary = (summaryData ?? null) as InstitutionDashboardSummary | null;

  // Fall back to safe zero defaults if the RPC fails — the UI still renders.
  const m: InstitutionDashboardSummary = summary ?? {
    total_applications: 0, pending_documents: 0, approved_applications: 0,
    rejected_applications: 0, offer_letters_issued: 0, ipa_processing: 0,
    ipa_approved: 0, conversion_rate: 0, avg_processing_days: 0,
    new_apps_7d: 0, apps_this_month: 0, offers_pending: 0, arrived_students: 0,
    docs_awaiting: 0, verified_docs: 0, rejected_docs: 0, pipeline_counts: {},
  };

  // ── Live small queries — only what the lists below the metric cards show ───
  const [
    { data: recentAppsRaw },
    { data: reviewQueueRaw },
    { data: needsOfferRaw },
    { data: recentOffersRaw },
    { data: timelineRaw },
  ] = await Promise.all([
    courseIds.length
      ? supabase.from("applications")
          .select("id, status, current_stage, submitted_at, student_id, course_id")
          .in("course_id", courseIds)
          .order("submitted_at", { ascending: false })
          .limit(RECENT_APPS_LIMIT)
      : Promise.resolve({ data: [] as Array<Record<string, unknown>> }),
    courseIds.length
      ? supabase.from("student_documents")
          .select("id, document_type, status, uploaded_at, student_id, application_id, applications!inner(course_id)")
          .in("applications.course_id", courseIds)
          .eq("is_active", true)
          .in("status", ["pending", "reupload_required"])
          .order("uploaded_at", { ascending: false })
          .limit(REVIEW_QUEUE_LIMIT)
      : Promise.resolve({ data: [] as Array<Record<string, unknown>> }),
    // Apps that need an offer letter — bounded fetch, joined to offer_letters via NOT IN subquery
    courseIds.length
      ? supabase.from("applications")
          .select("id, status, current_stage, submitted_at, student_id, course_id")
          .in("course_id", courseIds)
          .in("current_stage", ["documents_verified", "offer_letter_processing"])
          .order("submitted_at", { ascending: false })
          .limit(OFFER_QUEUE_LIMIT * 3) // over-fetch then JS-filter out those that already have offers
      : Promise.resolve({ data: [] as Array<Record<string, unknown>> }),
    courseIds.length
      ? supabase.from("offer_letters")
          .select("id, application_id, file_name, version, created_at, applications!inner(course_id)")
          .in("applications.course_id", courseIds)
          .order("created_at", { ascending: false })
          .limit(RECENT_OFFERS_LIMIT)
      : Promise.resolve({ data: [] as Array<Record<string, unknown>> }),
    courseIds.length
      ? supabase.from("application_timeline_events")
          .select("id, application_id, stage, title, description, created_at, applications!inner(course_id)")
          .in("applications.course_id", courseIds)
          .order("created_at", { ascending: false })
          .limit(RECENT_ACTIVITY_LIMIT)
      : Promise.resolve({ data: [] as Array<Record<string, unknown>> }),
  ]);

  const recentApps: AppRow[] = ((recentAppsRaw ?? []) as Array<Record<string, unknown>>).map(a => ({
    id:            String(a.id),
    status:        String(a.status ?? "submitted"),
    current_stage: (a.current_stage as string | null) ?? null,
    submitted_at:  String(a.submitted_at ?? new Date().toISOString()),
    student_id:    String(a.student_id ?? ""),
    course_id:     String(a.course_id ?? ""),
    course_title:  courseMap.get(String(a.course_id)) ?? "—",
  }));

  const reviewQueue: DocRow[] = ((reviewQueueRaw ?? []) as Array<Record<string, unknown>>).map(d => ({
    id:             String(d.id),
    document_type:  String(d.document_type ?? "other"),
    status:         String(d.status ?? "pending"),
    uploaded_at:    String(d.uploaded_at ?? new Date().toISOString()),
    student_id:     String(d.student_id ?? ""),
    application_id: (d.application_id as string | null) ?? null,
  }));

  // Offer queue: apps in offer-required stages MINUS those already having an offer
  const offerCandidates: AppRow[] = ((needsOfferRaw ?? []) as Array<Record<string, unknown>>).map(a => ({
    id:            String(a.id),
    status:        String(a.status ?? "submitted"),
    current_stage: (a.current_stage as string | null) ?? null,
    submitted_at:  String(a.submitted_at ?? new Date().toISOString()),
    student_id:    String(a.student_id ?? ""),
    course_id:     String(a.course_id ?? ""),
    course_title:  courseMap.get(String(a.course_id)) ?? "—",
  }));

  const recentOffers: OfferRow[] = ((recentOffersRaw ?? []) as Array<Record<string, unknown>>).map(o => ({
    id:             String(o.id),
    application_id: String(o.application_id),
    file_name:      String(o.file_name ?? "offer-letter.pdf"),
    version:        Number(o.version ?? 1),
    created_at:     String(o.created_at ?? new Date().toISOString()),
  }));

  const events: TimelineRow[] = ((timelineRaw ?? []) as Array<Record<string, unknown>>).map(e => ({
    id:             String(e.id),
    application_id: String(e.application_id),
    stage:          String(e.stage ?? ""),
    title:          String(e.title ?? ""),
    description:    (e.description as string | null) ?? null,
    created_at:     String(e.created_at ?? new Date().toISOString()),
  }));

  // Filter offer candidates by checking which already have offers (limited list)
  const offerAppIds = offerCandidates.map(a => a.id);
  const { data: existingOffers } = offerAppIds.length
    ? await supabase.from("offer_letters").select("application_id").in("application_id", offerAppIds)
    : { data: [] };
  const appsWithOffers = new Set((existingOffers ?? []).map(o => (o as { application_id: string }).application_id));
  const needsOffer = offerCandidates.filter(a => !appsWithOffers.has(a.id)).slice(0, OFFER_QUEUE_LIMIT);

  // ── Student profiles for visible rows only (bounded) ───────────────────────
  const studentIds = Array.from(new Set([
    ...recentApps.map(a => a.student_id),
    ...reviewQueue.map(d => d.student_id),
    ...needsOffer.map(a => a.student_id),
  ].filter(Boolean)));

  const { data: studentProfiles } = studentIds.length
    ? await supabase.from("profiles").select("id, full_name, email").in("id", studentIds)
    : { data: [] };
  const studentMap = new Map((studentProfiles ?? []).map(p => [p.id as string, p as { full_name: string | null; email: string }]));

  // ── Header / metric aliases from RPC ───────────────────────────────────────
  const totalApps        = m.total_applications;
  const newApps          = m.new_apps_7d;
  const appsThisMonth    = m.apps_this_month;
  const pendingDocs      = m.pending_documents;
  const verifiedDocs     = m.verified_docs;
  const rejectedDocs     = m.rejected_docs;
  const docsAwaiting     = m.docs_awaiting;
  const offersIssued     = m.offer_letters_issued;
  const offersPending    = m.offers_pending;
  const approvedStudents = m.approved_applications;
  const arrivedStudents  = m.arrived_students;
  const rejectedApps     = m.rejected_applications;
  const approvalRate     = Math.round(m.conversion_rate);
  const avgProcessingDays = Math.round(m.avg_processing_days);

  // ── Pipeline counts (by canonical stage, from RPC) ─────────────────────────
  const pipelineStages: { key: ApplicationStage; label: string; emoji: string }[] = [
    { key: "application_submitted",  label: "Submitted",    emoji: "📋" },
    { key: "documents_pending",      label: "Docs Pending", emoji: "📎" },
    { key: "documents_under_review", label: "Doc Review",   emoji: "🔍" },
    { key: "documents_verified",     label: "Doc Verified", emoji: "✅" },
    { key: "offer_letter_ready",     label: "Offer Ready",  emoji: "📩" },
    { key: "approved",               label: "Approved",     emoji: "🎉" },
    { key: "arrival_preparation",    label: "Arrival Prep", emoji: "✈️" },
    { key: "arrived_singapore",      label: "Arrived",      emoji: "🇸🇬" },
  ];

  const stageCounts = pipelineStages.map(s => ({
    ...s,
    count: m.pipeline_counts[s.key] ?? 0,
  }));
  const pipelineMax = Math.max(1, ...stageCounts.map(s => s.count));

  // ── Activity feed (last 10) ────────────────────────────────────────────────
  const recentActivity = events.slice(0, RECENT_ACTIVITY_LIMIT);

  return (
    <div className="space-y-7 max-w-7xl">

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
          <h1 className="font-display text-3xl md:text-4xl text-white mb-1">{institutionName}</h1>
          <p className="text-white/45 font-body text-sm">
            {courses.length} course{courses.length !== 1 ? "s" : ""} · {totalApps} application{totalApps !== 1 ? "s" : ""} · {approvedStudents} approved
          </p>
        </div>
      </div>

      {/* ── Metric Cards (Feature 1) ────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {[
          { label: "Total Applications", value: totalApps,      icon: FileText,    color: "text-pathBlue-400 bg-pathBlue-500/10 border-pathBlue-500/25", href: "/dashboard/institution/applications" },
          { label: "New (7 days)",       value: newApps,        icon: TrendingUp,  color: "text-gold-400 bg-gold-400/10 border-gold-400/25",             href: "/dashboard/institution/applications" },
          { label: "Pending Documents",  value: pendingDocs,    icon: FileClock,   color: "text-orange-400 bg-orange-500/10 border-orange-400/25",       href: "/dashboard/institution/documents?status=pending" },
          { label: "Awaiting Review",    value: docsAwaiting,   icon: Clock,       color: "text-orange-400 bg-orange-500/10 border-orange-400/25",       href: "/dashboard/institution/documents" },
          { label: "Offer Letters Issued", value: offersIssued, icon: FileCheck,   color: "text-emerald-400 bg-emerald-500/10 border-emerald-400/25",    href: "/dashboard/institution/applications" },
          { label: "Offers Pending",     value: offersPending,  icon: Upload,      color: "text-gold-400 bg-gold-400/10 border-gold-400/25",             href: "/dashboard/institution/applications" },
          { label: "Approved Students",  value: approvedStudents, icon: CheckCircle2, color: "text-emerald-400 bg-emerald-500/10 border-emerald-400/25", href: "/dashboard/institution/students?stage=approved" },
          { label: "Arrived Students",   value: arrivedStudents,icon: Plane,       color: "text-purple-400 bg-purple-500/10 border-purple-400/25",       href: "/dashboard/institution/students?stage=arrived_singapore" },
        ].map(({ label, value, icon: Icon, color, href }) => (
          <Link
            key={label}
            href={href}
            className={`group p-4 rounded-2xl border transition-all hover:-translate-y-0.5 ${color}`}
          >
            <div className="flex items-center justify-between mb-2">
              <Icon className="w-4 h-4 opacity-80" strokeWidth={2} />
              <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-60 transition-opacity" />
            </div>
            <p className="font-display text-3xl font-bold mb-0.5">{value}</p>
            <p className="font-body text-[11px] opacity-70 uppercase tracking-wider">{label}</p>
          </Link>
        ))}
      </div>

      {/* ── Pipeline (Feature 2) ──────────────────────────────────────────── */}
      <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-5 md:p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-gold-400" />
            <h2 className="font-display text-xl text-white">Application Pipeline</h2>
          </div>
          <Link href="/dashboard/institution/applications" className="text-gold-400 hover:text-gold-300 font-body text-xs flex items-center gap-1">
            All applications <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        {totalApps === 0 ? (
          <div className="text-center py-8 text-white/25 font-body text-sm">No applications yet</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            {stageCounts.map(s => {
              const pct = Math.round((s.count / pipelineMax) * 100);
              return (
                <div key={s.key} className="bg-navy-950/40 border border-white/[0.06] rounded-xl p-3">
                  <div className="text-lg mb-1">{s.emoji}</div>
                  <p className="font-display text-2xl font-bold text-white mb-0.5">{s.count}</p>
                  <p className="font-body text-[10px] text-white/40 uppercase tracking-wider mb-2 truncate">{s.label}</p>
                  <div className="h-1 bg-white/[0.06] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-pathBlue-500 to-gold-500 rounded-full"
                      style={{ width: `${Math.max(pct, s.count > 0 ? 6 : 0)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Quick Actions (Feature 7) ───────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { icon: FileClock,    title: "Review Documents",    desc: `${docsAwaiting} awaiting`,            href: "/dashboard/institution/documents",    color: "text-orange-400 border-orange-400/25 bg-orange-500/[0.06] hover:bg-orange-500/[0.12]" },
          { icon: FileText,     title: "View Applications",   desc: `${totalApps} total`,                  href: "/dashboard/institution/applications", color: "text-pathBlue-400 border-pathBlue-500/25 bg-pathBlue-500/[0.06] hover:bg-pathBlue-500/[0.12]" },
          { icon: Upload,       title: "Upload Offer Letter", desc: `${offersPending} pending`,            href: "/dashboard/institution/applications", color: "text-gold-400 border-gold-400/25 bg-gold-400/[0.06] hover:bg-gold-400/[0.12]" },
          { icon: Users,        title: "Manage Students",     desc: `${approvedStudents} approved`,        href: "/dashboard/institution/students",     color: "text-emerald-400 border-emerald-400/25 bg-emerald-500/[0.06] hover:bg-emerald-500/[0.12]" },
        ].map(({ icon: Icon, title, desc, href, color }) => (
          <Link
            key={title}
            href={href}
            className={`p-4 rounded-2xl border transition-all hover:-translate-y-0.5 ${color}`}
          >
            <Icon className="w-5 h-5 mb-2" />
            <p className="font-body font-semibold text-sm mb-0.5">{title}</p>
            <p className="font-body text-xs opacity-70">{desc}</p>
          </Link>
        ))}
      </div>

      {/* ── Two-column: Recent Apps + Document Queue ──────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Recent Applications (Feature 3) */}
        <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.07]">
            <h2 className="font-display text-lg text-white">Recent Applications</h2>
            <Link href="/dashboard/institution/applications" className="text-gold-400 hover:text-gold-300 font-body text-xs flex items-center gap-1">
              View all <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          {recentApps.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-white/25">
              <FileText className="w-8 h-8 mb-2" />
              <p className="font-body text-sm">No applications yet</p>
            </div>
          ) : (
            <div className="divide-y divide-white/[0.05]">
              {recentApps.map(app => {
                const stage   = resolveStage(app.current_stage, app.status);
                const meta    = getStageMeta(stage);
                const student = studentMap.get(app.student_id);
                return (
                  <Link
                    key={app.id}
                    href={`/dashboard/institution/applications/${app.id}`}
                    className="block px-6 py-3 hover:bg-white/[0.02] transition-colors"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="font-body text-sm text-white/85 font-semibold truncate">
                          {student?.full_name ?? "Unknown student"}
                        </p>
                        <p className="font-body text-xs text-white/40 truncate">{app.course_title}</p>
                      </div>
                      <div className="flex-shrink-0 text-right">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border font-body text-[10px] font-semibold ${meta.color}`}>
                          {meta.emoji} {meta.label}
                        </span>
                        <p className="font-body text-[10px] text-white/30 mt-1">
                          {new Date(app.submitted_at).toLocaleDateString("en-SG", { day: "numeric", month: "short" })}
                        </p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Documents Awaiting Review (Feature 4) */}
        <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.07]">
            <h2 className="font-display text-lg text-white">Documents Awaiting Review</h2>
            <Link href="/dashboard/institution/documents" className="text-gold-400 hover:text-gold-300 font-body text-xs flex items-center gap-1">
              Review queue <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          {reviewQueue.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-white/25">
              <CheckCircle2 className="w-8 h-8 mb-2 text-emerald-400/40" />
              <p className="font-body text-sm">All caught up</p>
            </div>
          ) : (
            <div className="divide-y divide-white/[0.05]">
              {reviewQueue.map(d => {
                const student = studentMap.get(d.student_id);
                const isReupload = d.status === "reupload_required";
                return (
                  <Link
                    key={d.id}
                    href="/dashboard/institution/documents"
                    className="block px-6 py-3 hover:bg-white/[0.02] transition-colors"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="font-body text-sm text-white/85 font-semibold truncate">
                          {student?.full_name ?? "Unknown student"}
                        </p>
                        <p className="font-body text-xs text-white/40 truncate capitalize">
                          {d.document_type.replace(/_/g, " ")}
                        </p>
                      </div>
                      <div className="flex-shrink-0 text-right">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border font-body text-[10px] font-semibold ${
                          isReupload
                            ? "text-orange-400 bg-orange-500/10 border-orange-400/25"
                            : "text-gold-400 bg-gold-400/10 border-gold-400/25"
                        }`}>
                          {isReupload ? <RefreshCw className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                          {isReupload ? "Re-upload" : "Pending"}
                        </span>
                        <p className="font-body text-[10px] text-white/30 mt-1">
                          {new Date(d.uploaded_at).toLocaleDateString("en-SG", { day: "numeric", month: "short" })}
                        </p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Two-column: Offer Letter Queue + Activity Feed ────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Offer Letter Queue (Feature 5) */}
        <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.07]">
            <h2 className="font-display text-lg text-white">Offer Letters</h2>
            <span className="font-body text-xs text-white/35">
              {needsOffer.length} pending · {recentOffers.length} issued
            </span>
          </div>
          <div className="divide-y divide-white/[0.05]">
            {needsOffer.length === 0 && recentOffers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-white/25">
                <FileCheck className="w-8 h-8 mb-2" />
                <p className="font-body text-sm">No offer letter activity</p>
              </div>
            ) : (
              <>
                {needsOffer.length > 0 && (
                  <div className="px-6 py-2 bg-gold-400/[0.04] border-b border-gold-400/[0.10]">
                    <p className="font-body text-[10px] font-semibold text-gold-400 uppercase tracking-wider">
                      Needs offer letter
                    </p>
                  </div>
                )}
                {needsOffer.map(app => {
                  const student = studentMap.get(app.student_id);
                  return (
                    <Link
                      key={`pending-${app.id}`}
                      href={`/dashboard/institution/applications/${app.id}`}
                      className="block px-6 py-3 hover:bg-white/[0.02] transition-colors"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="font-body text-sm text-white/85 font-semibold truncate">
                            {student?.full_name ?? "Unknown student"}
                          </p>
                          <p className="font-body text-xs text-white/40 truncate">{app.course_title}</p>
                        </div>
                        <span className="flex-shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border font-body text-[11px] font-semibold text-gold-400 bg-gold-400/10 border-gold-400/30">
                          <Upload className="w-3 h-3" /> Upload
                        </span>
                      </div>
                    </Link>
                  );
                })}
                {recentOffers.length > 0 && (
                  <div className="px-6 py-2 bg-emerald-500/[0.04] border-b border-emerald-500/[0.10]">
                    <p className="font-body text-[10px] font-semibold text-emerald-400 uppercase tracking-wider">
                      Recently issued
                    </p>
                  </div>
                )}
                {recentOffers.map(o => (
                  <Link
                    key={o.id}
                    href={`/dashboard/institution/applications/${o.application_id}`}
                    className="block px-6 py-3 hover:bg-white/[0.02] transition-colors"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="font-body text-sm text-white/85 truncate">{o.file_name}</p>
                        <p className="font-body text-xs text-white/40">
                          v{o.version} · {new Date(o.created_at).toLocaleDateString("en-SG", { day: "numeric", month: "short", year: "numeric" })}
                        </p>
                      </div>
                      <span className="flex-shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border font-body text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 border-emerald-400/30">
                        <CheckCircle2 className="w-3 h-3" /> Issued
                      </span>
                    </div>
                  </Link>
                ))}
              </>
            )}
          </div>
        </div>

        {/* Activity Feed (Feature 6) */}
        <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.07]">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-pathBlue-400" />
              <h2 className="font-display text-lg text-white">Recent Activity</h2>
            </div>
            <span className="font-body text-xs text-white/35">Last {recentActivity.length} events</span>
          </div>
          {recentActivity.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-white/25">
              <Activity className="w-8 h-8 mb-2" />
              <p className="font-body text-sm">No recent activity</p>
            </div>
          ) : (
            <div className="divide-y divide-white/[0.05] max-h-[500px] overflow-y-auto">
              {recentActivity.map(e => {
                const meta = getStageMeta(e.stage as ApplicationStage);
                return (
                  <Link
                    key={e.id}
                    href={`/dashboard/institution/applications/${e.application_id}`}
                    className="block px-6 py-3 hover:bg-white/[0.02] transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <span className={`flex-shrink-0 inline-flex items-center justify-center w-7 h-7 rounded-full border ${meta.color}`}>
                        <span className="text-xs">{meta.emoji}</span>
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="font-body text-sm text-white/80 font-semibold truncate">{e.title}</p>
                        {e.description && (
                          <p className="font-body text-xs text-white/40 truncate">{e.description}</p>
                        )}
                        <p className="font-body text-[10px] text-white/30 mt-0.5">
                          {new Date(e.created_at).toLocaleString("en-SG", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Performance Metrics (Feature 9) ─────────────────────────────────── */}
      <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-5 md:p-6">
        <div className="flex items-center gap-2 mb-5">
          <BarChart2 className="w-4 h-4 text-gold-400" />
          <h2 className="font-display text-xl text-white">Performance Metrics</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {[
            { label: "Applications Received", value: String(totalApps),                      icon: FileText,    sub: "All time" },
            { label: "Documents Reviewed",    value: String(verifiedDocs + rejectedDocs),    icon: FileCheck,   sub: `${verifiedDocs} approved · ${rejectedDocs} rejected` },
            { label: "Offer Letters Issued",  value: String(offersIssued),                   icon: Upload,      sub: "All time" },
            { label: "Approval Rate",         value: `${approvalRate}%`,                     icon: CheckCircle2,sub: `${approvedStudents} of ${totalApps}` },
            { label: "Avg. Processing Time",  value: avgProcessingDays > 0 ? `${avgProcessingDays}d` : "—",  icon: Clock, sub: "Submit → approve" },
            { label: "Applications This Month", value: String(appsThisMonth),                icon: Calendar,    sub: new Date().toLocaleDateString("en-SG", { month: "long" }) },
            { label: "Students Arrived",      value: String(arrivedStudents),                icon: Plane,       sub: "In Singapore" },
            { label: "Not Progressed",        value: String(rejectedApps),                   icon: XCircle,     sub: "Closed apps" },
          ].map(({ label, value, icon: Icon, sub }) => (
            <div key={label} className="bg-navy-950/40 border border-white/[0.06] rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Icon className="w-3.5 h-3.5 text-white/40" />
                <p className="font-body text-[10px] text-white/40 uppercase tracking-wider">{label}</p>
              </div>
              <p className="font-display text-2xl font-bold text-white">{value}</p>
              <p className="font-body text-[10px] text-white/30 mt-1 truncate">{sub}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Footer: Other Quick Links ───────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { icon: BookOpen,  title: "Courses",  desc: `${courses.length} programme${courses.length !== 1 ? "s" : ""}`, href: "/dashboard/institution/courses" },
          { icon: GraduationCap, title: "Student Roster", desc: `${studentIds.length} unique applicants`,             href: "/dashboard/institution/students" },
          { icon: Eye,       title: "Reports",  desc: "Institution analytics",                                          href: "/dashboard/institution/reports" },
        ].map(({ icon: Icon, title, desc, href }) => (
          <Link key={title} href={href} className="group p-4 bg-white/[0.03] border border-white/[0.07] rounded-2xl hover:border-gold-400/30 hover:bg-gold-400/[0.03] transition-all">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gold-400/[0.08] border border-gold-400/20 flex items-center justify-center flex-shrink-0">
                <Icon className="w-4 h-4 text-gold-400" />
              </div>
              <div className="min-w-0">
                <p className="font-body font-semibold text-sm text-white/80 group-hover:text-white">{title}</p>
                <p className="font-body text-xs text-white/35 truncate">{desc}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-white/25 group-hover:text-gold-400 transition-colors ml-auto flex-shrink-0" />
            </div>
          </Link>
        ))}
      </div>

    </div>
  );
}
