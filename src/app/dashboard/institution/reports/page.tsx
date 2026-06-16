import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { InstitutionReports } from "@/types/analytics";
import {
  BarChart2, TrendingUp, CheckCircle2, Clock, FileCheck, AlertCircle,
} from "lucide-react";

export const dynamic = "force-dynamic";

function formatMonth(yyyymm: string): string {
  // "2026-06" → "Jun 2026"
  const [y, m] = yyyymm.split("-");
  if (!y || !m) return yyyymm;
  const d = new Date(parseInt(y, 10), parseInt(m, 10) - 1, 1);
  return d.toLocaleDateString("en-SG", { month: "short", year: "numeric" });
}

export default async function InstitutionReportsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles").select("role, college_id").eq("id", user.id).single();

  if (profile?.role !== "institution" && profile?.role !== "admin") {
    redirect("/dashboard");
  }

  // Institution users must have a college; admins can be redirected if no
  // college context exists (reports are college-scoped).
  const collegeId = profile.college_id as string | null;
  if (!collegeId) {
    return (
      <div className="max-w-3xl space-y-6">
        <div>
          <h2 className="font-display text-3xl text-white mb-1">Reports</h2>
          <p className="text-white/40 font-body text-sm">Enrolment analytics and performance reporting</p>
        </div>
        <div className="flex items-start gap-3 p-4 rounded-2xl bg-gold-400/[0.07] border border-gold-400/25">
          <AlertCircle className="w-5 h-5 text-gold-400 flex-shrink-0 mt-0.5" />
          <p className="text-white/65 font-body text-sm">
            No college linked to your account. Ask your PathPort admin to link your account before viewing reports.
          </p>
        </div>
      </div>
    );
  }

  const { data, error } = await supabase.rpc("get_institution_reports", {
    p_college_id: collegeId,
    p_from:       null,
    p_to:         null,
  });

  if (error) console.error("[InstitutionReports] RPC error:", error.code, error.message);

  const reports = (data ?? null) as InstitutionReports | null;

  if (!reports) {
    return (
      <div className="max-w-3xl space-y-6">
        <div>
          <h2 className="font-display text-3xl text-white mb-1">Reports</h2>
          <p className="text-white/40 font-body text-sm">Enrolment analytics and performance reporting</p>
        </div>
        <div className="flex items-start gap-3 p-4 rounded-2xl bg-red-500/[0.07] border border-red-400/25">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-red-400 font-body text-sm">
            Failed to load reports{error ? `: ${error.message}` : "."}
          </p>
        </div>
      </div>
    );
  }

  const maxApps     = Math.max(1, ...reports.applications_by_month.map(r => r.count));
  const maxApprov   = Math.max(1, ...reports.approvals_by_month.map(r => r.count));
  const dateRange   = `${new Date(reports.from_date).toLocaleDateString("en-SG", { day: "numeric", month: "short", year: "numeric" })} – ${new Date(reports.to_date).toLocaleDateString("en-SG", { day: "numeric", month: "short", year: "numeric" })}`;

  const overallConversion = reports.conversion_by_month.length > 0
    ? Math.round(
        reports.conversion_by_month.reduce((acc, r) => acc + r.rate, 0) /
        reports.conversion_by_month.length,
      )
    : 0;

  return (
    <div className="max-w-5xl space-y-8">

      {/* Header */}
      <div>
        <h2 className="font-display text-3xl text-white mb-1 flex items-center gap-3">
          <BarChart2 className="w-7 h-7 text-gold-400" />
          Reports
        </h2>
        <p className="text-white/45 font-body text-sm">{dateRange} · last 12 months</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Avg Processing Time", value: reports.average_processing_days > 0 ? `${reports.average_processing_days}d` : "—", icon: Clock,        color: "text-pathBlue-400" },
          { label: "Avg Document Turnaround", value: reports.document_turnaround_days > 0 ? `${reports.document_turnaround_days}d` : "—", icon: FileCheck, color: "text-gold-400" },
          { label: "Overall Conversion",  value: `${overallConversion}%`,                                                  icon: CheckCircle2, color: "text-emerald-400" },
          { label: "Months Analysed",     value: String(reports.applications_by_month.length),                              icon: TrendingUp,   color: "text-white/60" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="rounded-2xl border bg-white/[0.04] border-white/[0.08] p-4">
            <Icon className={`w-4 h-4 mb-2 ${color}`} />
            <p className="font-display text-2xl font-bold text-white">{value}</p>
            <p className="text-white/40 font-body text-[11px] mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Applications by month */}
      <section className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-6">
        <h3 className="font-display text-xl text-white mb-4">Applications by Month</h3>
        {reports.applications_by_month.length === 0 ? (
          <p className="text-white/30 font-body text-sm">No applications received in this period.</p>
        ) : (
          <div className="space-y-2.5">
            {reports.applications_by_month.map(({ month, count }) => (
              <div key={month} className="flex items-center gap-3">
                <span className="w-24 flex-shrink-0 text-white/55 font-body text-xs">{formatMonth(month)}</span>
                <div className="flex-1 h-2 bg-white/[0.06] rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-pathBlue-500/70" style={{ width: `${Math.round((count / maxApps) * 100)}%` }} />
                </div>
                <span className="w-10 text-right text-white/45 font-body text-xs flex-shrink-0">{count}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Approvals by month */}
      <section className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-6">
        <h3 className="font-display text-xl text-white mb-4">Approvals by Month</h3>
        {reports.approvals_by_month.length === 0 ? (
          <p className="text-white/30 font-body text-sm">No approvals in this period.</p>
        ) : (
          <div className="space-y-2.5">
            {reports.approvals_by_month.map(({ month, count }) => (
              <div key={month} className="flex items-center gap-3">
                <span className="w-24 flex-shrink-0 text-white/55 font-body text-xs">{formatMonth(month)}</span>
                <div className="flex-1 h-2 bg-white/[0.06] rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-emerald-500/70" style={{ width: `${Math.round((count / maxApprov) * 100)}%` }} />
                </div>
                <span className="w-10 text-right text-white/45 font-body text-xs flex-shrink-0">{count}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Conversion rate by month */}
      <section className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-6">
        <h3 className="font-display text-xl text-white mb-4">Conversion Rate by Month</h3>
        {reports.conversion_by_month.length === 0 ? (
          <p className="text-white/30 font-body text-sm">No data yet.</p>
        ) : (
          <div className="space-y-2.5">
            {reports.conversion_by_month.map(({ month, rate }) => (
              <div key={month} className="flex items-center gap-3">
                <span className="w-24 flex-shrink-0 text-white/55 font-body text-xs">{formatMonth(month)}</span>
                <div className="flex-1 h-2 bg-white/[0.06] rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-gold-500/70" style={{ width: `${Math.min(100, rate)}%` }} />
                </div>
                <span className="w-12 text-right text-white/45 font-body text-xs flex-shrink-0">{rate}%</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
