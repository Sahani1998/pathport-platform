import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { STAGE_META, APPROVED_STAGES } from "@/lib/application-workflow";
import type { ApplicationStage } from "@/types/timeline";
import {
  BarChart2, Users, Clock, FileCheck2, BadgeCheck,
  CheckCircle2, XCircle, Building2, CalendarDays, Globe2,
} from "lucide-react";

export const dynamic = "force-dynamic";

const PENDING_REVIEW_STAGES: ApplicationStage[] = [
  "application_submitted", "documents_pending", "documents_uploaded", "documents_under_review",
];
const OFFER_STAGES: ApplicationStage[] = [
  "offer_letter_ready", "offer_letter_accepted", "fee_payment_pending",
];

export default async function AdminAnalyticsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") redirect("/dashboard");

  // ── Fetch raw analytics rows in parallel ───────────────────────────────────
  const [appsRes, coursesRes, collegesRes] = await Promise.all([
    supabase.from("applications").select("id, status, current_stage, course_id, student_id, submitted_at"),
    supabase.from("courses").select("id, title, college_id, intake_date"),
    supabase.from("colleges").select("id, name"),
  ]);

  if (appsRes.error)     console.error("[Analytics] applications error:", appsRes.error.message);
  if (coursesRes.error)  console.error("[Analytics] courses error:", coursesRes.error.message);
  if (collegesRes.error) console.error("[Analytics] colleges error:", collegesRes.error.message);

  type AppRow = { id: string; status: string; current_stage: string | null; course_id: string; student_id: string; submitted_at: string };
  const apps     = (appsRes.data ?? []) as AppRow[];
  const courses  = new Map((coursesRes.data ?? []).map(c => [c.id, c]));
  const colleges = new Map((collegesRes.data ?? []).map(c => [c.id, c.name as string]));

  // Student countries — two-query pattern (student_id references auth.users)
  const studentIds = Array.from(new Set(apps.map(a => a.student_id)));
  const countryByStudent = new Map<string, string>();
  if (studentIds.length > 0) {
    const { data: students } = await supabase
      .from("profiles").select("id, country").in("id", studentIds);
    for (const s of students ?? []) countryByStudent.set(s.id, s.country ?? "Unknown");
  }

  // ── Aggregations ────────────────────────────────────────────────────────────
  const stageOf = (a: AppRow) => (a.current_stage ?? "application_submitted") as ApplicationStage;

  const totals = {
    total:         apps.length,
    pendingReview: apps.filter(a => PENDING_REVIEW_STAGES.includes(stageOf(a))).length,
    offersIssued:  apps.filter(a => OFFER_STAGES.includes(stageOf(a))).length,
    ipaProcessing: apps.filter(a => stageOf(a) === "ipa_processing").length,
    approved:      apps.filter(a => APPROVED_STAGES.includes(stageOf(a))).length,
    rejected:      apps.filter(a => ["rejected", "withdrawn"].includes(stageOf(a))).length,
  };

  // Per-stage counts (pipeline breakdown)
  const stageCounts = new Map<ApplicationStage, number>();
  for (const a of apps) stageCounts.set(stageOf(a), (stageCounts.get(stageOf(a)) ?? 0) + 1);

  // By college
  const byCollege = new Map<string, number>();
  for (const a of apps) {
    const course = courses.get(a.course_id);
    const name   = course ? (colleges.get(course.college_id) ?? "Unknown college") : "Unknown college";
    byCollege.set(name, (byCollege.get(name) ?? 0) + 1);
  }
  const collegeRows = Array.from(byCollege.entries()).sort((a, b) => b[1] - a[1]).slice(0, 10);

  // By intake (course intake_date month)
  const byIntake = new Map<string, number>();
  for (const a of apps) {
    const course = courses.get(a.course_id);
    const key = course?.intake_date
      ? new Date(course.intake_date).toLocaleDateString("en-SG", { month: "short", year: "numeric" })
      : "No intake set";
    byIntake.set(key, (byIntake.get(key) ?? 0) + 1);
  }
  const intakeRows = Array.from(byIntake.entries()).sort((a, b) => b[1] - a[1]).slice(0, 10);

  // By country (student profile country)
  const byCountry = new Map<string, number>();
  for (const a of apps) {
    const country = countryByStudent.get(a.student_id) ?? "Unknown";
    byCountry.set(country, (byCountry.get(country) ?? 0) + 1);
  }
  const countryRows = Array.from(byCountry.entries()).sort((a, b) => b[1] - a[1]).slice(0, 10);

  const maxBar = (rows: [string, number][]) => Math.max(1, ...rows.map(r => r[1]));

  const heroCards = [
    { label: "Total Applications", value: totals.total,         icon: Users,        color: "text-gold-400",     gold: true  },
    { label: "Pending Review",     value: totals.pendingReview, icon: Clock,        color: "text-pathBlue-400", gold: false },
    { label: "Offer Letters",      value: totals.offersIssued,  icon: FileCheck2,   color: "text-gold-400",     gold: false },
    { label: "IPA Processing",     value: totals.ipaProcessing, icon: BadgeCheck,   color: "text-purple-400",   gold: false },
    { label: "Approved",           value: totals.approved,      icon: CheckCircle2, color: "text-emerald-400",  gold: false },
    { label: "Rejected",           value: totals.rejected,      icon: XCircle,      color: "text-red-400",      gold: false },
  ];

  return (
    <div className="max-w-5xl space-y-8">

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="font-display text-3xl text-white mb-1 flex items-center gap-3">
            <BarChart2 className="w-7 h-7 text-gold-400" />
            Command Center
          </h2>
          <p className="text-white/45 font-body text-sm">Application pipeline, college performance, intakes and geography</p>
        </div>
        <Link
          href="/dashboard/admin/applications"
          className="px-4 py-2.5 rounded-xl bg-gold-400/10 border border-gold-400/25 text-gold-400 font-body text-sm font-semibold hover:bg-gold-400/20 transition-all"
        >
          All Applications →
        </Link>
      </div>

      {/* Hero stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {heroCards.map(({ label, value, icon: Icon, color, gold }) => (
          <div key={label} className={`rounded-2xl border p-4 ${gold ? "bg-gold-400/[0.07] border-gold-400/25" : "bg-white/[0.04] border-white/[0.08]"}`}>
            <Icon className={`w-4 h-4 mb-2 ${color}`} />
            <p className={`font-display text-2xl font-bold ${gold ? "text-gold-400" : "text-white"}`}>{value}</p>
            <p className="text-white/40 font-body text-[11px] mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Pipeline breakdown */}
      <section className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-6">
        <h3 className="font-display text-xl text-white mb-4">Pipeline by Stage</h3>
        <div className="space-y-2.5">
          {STAGE_META.filter(s => (stageCounts.get(s.value) ?? 0) > 0).map(s => {
            const count = stageCounts.get(s.value) ?? 0;
            const pct   = totals.total > 0 ? Math.round((count / totals.total) * 100) : 0;
            return (
              <div key={s.value} className="flex items-center gap-3">
                <span className="w-5 text-center flex-shrink-0">{s.emoji}</span>
                <span className="w-44 flex-shrink-0 text-white/55 font-body text-xs truncate">{s.label}</span>
                <div className="flex-1 h-2 bg-white/[0.06] rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-gold-500/70" style={{ width: `${pct}%` }} />
                </div>
                <span className="w-14 text-right text-white/45 font-body text-xs flex-shrink-0">
                  {count} <span className="text-white/25">({pct}%)</span>
                </span>
              </div>
            );
          })}
          {totals.total === 0 && (
            <p className="text-white/30 font-body text-sm">No applications yet.</p>
          )}
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* College analytics */}
        <section className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Building2 className="w-4 h-4 text-pathBlue-400" />
            <h3 className="font-display text-xl text-white">By College</h3>
          </div>
          {collegeRows.length === 0 ? (
            <p className="text-white/30 font-body text-sm">No data yet.</p>
          ) : (
            <div className="space-y-2.5">
              {collegeRows.map(([name, count]) => (
                <div key={name}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-white/55 font-body text-xs truncate pr-2">{name}</span>
                    <span className="text-white/45 font-body text-xs flex-shrink-0">{count}</span>
                  </div>
                  <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-pathBlue-500/70" style={{ width: `${Math.round((count / maxBar(collegeRows)) * 100)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Intake analytics */}
        <section className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <CalendarDays className="w-4 h-4 text-gold-400" />
            <h3 className="font-display text-xl text-white">By Intake</h3>
          </div>
          {intakeRows.length === 0 ? (
            <p className="text-white/30 font-body text-sm">No data yet.</p>
          ) : (
            <div className="space-y-2.5">
              {intakeRows.map(([label, count]) => (
                <div key={label}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-white/55 font-body text-xs truncate pr-2">{label}</span>
                    <span className="text-white/45 font-body text-xs flex-shrink-0">{count}</span>
                  </div>
                  <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-gold-500/70" style={{ width: `${Math.round((count / maxBar(intakeRows)) * 100)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Country analytics */}
        <section className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Globe2 className="w-4 h-4 text-emerald-400" />
            <h3 className="font-display text-xl text-white">By Country</h3>
          </div>
          {countryRows.length === 0 ? (
            <p className="text-white/30 font-body text-sm">No data yet.</p>
          ) : (
            <div className="space-y-2.5">
              {countryRows.map(([label, count]) => (
                <div key={label}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-white/55 font-body text-xs truncate pr-2">{label}</span>
                    <span className="text-white/45 font-body text-xs flex-shrink-0">{count}</span>
                  </div>
                  <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-emerald-500/70" style={{ width: `${Math.round((count / maxBar(countryRows)) * 100)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
