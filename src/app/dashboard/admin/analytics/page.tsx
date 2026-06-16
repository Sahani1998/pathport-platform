import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { STAGE_META } from "@/lib/application-workflow";
import type { ApplicationStage } from "@/types/timeline";
import type { AdminAnalyticsSummary } from "@/types/analytics";
import {
  BarChart2, Users, Clock, FileCheck2, BadgeCheck,
  CheckCircle2, XCircle, Building2, CalendarDays, AlertCircle,
} from "lucide-react";

export const dynamic = "force-dynamic";

const PENDING_REVIEW_STAGES: ApplicationStage[] = [
  "application_submitted", "documents_pending", "documents_uploaded", "documents_under_review",
];
const OFFER_STAGES: ApplicationStage[] = [
  "offer_letter_ready", "offer_letter_accepted", "fee_payment_pending",
];
const APPROVED_HERO_STAGES: ApplicationStage[] = [
  "approved", "arrival_preparation", "arrived_singapore",
  "enrolled", "internship_eligible", "completed",
];

export default async function AdminAnalyticsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") redirect("/dashboard");

  // ── Single SQL aggregation call ────────────────────────────────────────────
  const { data, error } = await supabase.rpc("get_admin_analytics_summary");
  if (error) console.error("[Analytics] RPC error:", error.code, error.message);

  const summary = (data ?? null) as AdminAnalyticsSummary | null;

  if (!summary) {
    return (
      <div className="max-w-5xl">
        <h2 className="font-display text-3xl text-white mb-1 flex items-center gap-3">
          <BarChart2 className="w-7 h-7 text-gold-400" />
          Command Center
        </h2>
        <div className="mt-6 flex items-start gap-3 p-4 rounded-2xl bg-red-500/[0.07] border border-red-400/25">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-red-400 font-body text-sm">
            Failed to load analytics{error ? `: ${error.message}` : "."}
          </p>
        </div>
      </div>
    );
  }

  const stageCount = (s: ApplicationStage) => summary.by_stage[s] ?? 0;
  const sumStages  = (stages: ApplicationStage[]) =>
    stages.reduce((acc, s) => acc + stageCount(s), 0);

  const totals = {
    total:         summary.total_applications,
    pendingReview: sumStages(PENDING_REVIEW_STAGES),
    offersIssued:  sumStages(OFFER_STAGES),
    ipaProcessing: stageCount("ipa_processing"),
    approved:      sumStages(APPROVED_HERO_STAGES),
    rejected:      stageCount("rejected") + stageCount("withdrawn"),
  };

  const maxBar = (rows: { count: number }[]) =>
    Math.max(1, ...rows.map(r => r.count));

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
          <p className="text-white/45 font-body text-sm">
            {summary.total_students} students · {summary.total_colleges} colleges · {summary.total_courses} courses
          </p>
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
          {STAGE_META.filter(s => stageCount(s.value) > 0).map(s => {
            const count = stageCount(s.value);
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* College analytics */}
        <section className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Building2 className="w-4 h-4 text-pathBlue-400" />
            <h3 className="font-display text-xl text-white">By College</h3>
          </div>
          {summary.by_college.length === 0 ? (
            <p className="text-white/30 font-body text-sm">No data yet.</p>
          ) : (
            <div className="space-y-2.5">
              {summary.by_college.map(({ college, count }) => (
                <div key={college}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-white/55 font-body text-xs truncate pr-2">{college}</span>
                    <span className="text-white/45 font-body text-xs flex-shrink-0">{count}</span>
                  </div>
                  <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-pathBlue-500/70" style={{ width: `${Math.round((count / maxBar(summary.by_college)) * 100)}%` }} />
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
          {summary.by_intake.length === 0 ? (
            <p className="text-white/30 font-body text-sm">No data yet.</p>
          ) : (
            <div className="space-y-2.5">
              {summary.by_intake.map(({ intake, count }) => (
                <div key={intake}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-white/55 font-body text-xs truncate pr-2">{intake}</span>
                    <span className="text-white/45 font-body text-xs flex-shrink-0">{count}</span>
                  </div>
                  <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-gold-500/70" style={{ width: `${Math.round((count / maxBar(summary.by_intake)) * 100)}%` }} />
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
