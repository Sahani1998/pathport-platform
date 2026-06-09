import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ApplicationStageBadge from "@/components/applications/ApplicationStageBadge";
import StageUpdateSelect from "@/components/applications/StageUpdateSelect";
import { TIMELINE_STAGES } from "@/types/timeline";
import type { ApplicationStage } from "@/types/timeline";
import { STATUS_TO_STAGE } from "@/lib/application-stage-mapping";
import { FileText, CheckCircle2, TrendingUp, Clock, AlertTriangle } from "lucide-react";

interface AppRow {
  id:              string;
  student_id:      string;
  status:          string;
  current_stage:   ApplicationStage;
  submitted_at:    string;
  stage_updated_at:string | null;
  courses:  { title: string; colleges?: { name: string } | null } | null;
  profiles: { full_name: string | null; email: string | null } | null;
}

export default async function AdminApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const params   = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") redirect("/dashboard");

  // ── Fetch applications WITHOUT profile join ────────────────────────────────
  // applications.student_id references auth.users(id), NOT profiles(id), so
  // PostgREST can't resolve `profiles:student_id (...)` and the whole query
  // fails silently with a relationship error.  We fetch profiles separately
  // by IN(student_ids) and merge in code.
  const { data: rawRows, error: appsError } = await supabase
    .from("applications")
    .select(`
      id, student_id, status, current_stage, submitted_at, stage_updated_at,
      courses ( title, colleges ( name ) )
    `)
    .order("submitted_at", { ascending: false });

  if (appsError) console.error("[AdminApplications] applications fetch error:", appsError.code, appsError.message);
  console.log("[AdminApplications] raw rows:", rawRows?.length ?? 0);

  // ── Fetch student profiles separately ──────────────────────────────────────
  const studentIds = Array.from(new Set((rawRows ?? []).map(r => r.student_id).filter(Boolean) as string[]));
  let profileMap = new Map<string, { full_name: string | null; email: string | null }>();
  let profilesError: { code?: string; message: string } | null = null;

  if (studentIds.length > 0) {
    const { data: profileRows, error: pErr } = await supabase
      .from("profiles")
      .select("id, full_name, email")
      .in("id", studentIds);

    if (pErr) {
      console.error("[AdminApplications] profiles fetch error:", pErr.code, pErr.message);
      profilesError = { code: pErr.code, message: pErr.message };
    }

    profileMap = new Map(
      (profileRows ?? []).map(p => [p.id, { full_name: p.full_name, email: p.email }]),
    );
  }

  console.log("[AdminApplications] unique student ids:", studentIds.length);
  console.log("[AdminApplications] profiles fetched:", profileMap.size);

  // ── Normalise in code ──────────────────────────────────────────────────────
  const normalized: AppRow[] = (rawRows ?? []).map(row => {
    const rawCourse  = Array.isArray(row.courses)  ? row.courses[0]  : row.courses;
    const rawCollege = rawCourse
      ? (Array.isArray((rawCourse as { colleges?: unknown }).colleges)
          ? ((rawCourse as { colleges: unknown[] }).colleges)[0]
          : (rawCourse as { colleges?: unknown }).colleges)
      : null;

    const stage: ApplicationStage =
      (row.current_stage as ApplicationStage) ||
      STATUS_TO_STAGE[row.status as string] ||
      "application_submitted";

    return {
      id:               row.id,
      student_id:       row.student_id,
      status:           row.status ?? "submitted",
      current_stage:    stage,
      submitted_at:     row.submitted_at,
      stage_updated_at: row.stage_updated_at,
      courses:  rawCourse  ? { title: (rawCourse  as { title:  string }).title,  colleges: rawCollege as { name: string } | null } : null,
      profiles: profileMap.get(row.student_id) ?? null,
    };
  });

  console.log("[AdminApplications] normalized rows:", normalized.length);

  // ── Compute stats from normalised data ─────────────────────────────────────
  const stageCounts: Record<string, number> = {};
  for (const a of normalized) {
    stageCounts[a.current_stage] = (stageCounts[a.current_stage] ?? 0) + 1;
  }

  // ── Filter in code ─────────────────────────────────────────────────────────
  const activeFilter = params.stage ?? "";
  const visible      = activeFilter
    ? normalized.filter(a => a.current_stage === activeFilter)
    : normalized;

  const totalApps    = normalized.length;
  const approvedApps = stageCounts["approved"]          ?? 0;
  const ipaApps      = stageCounts["ipa_processing"]    ?? 0;
  const offerApps    = stageCounts["offer_letter_ready"] ?? 0;

  return (
    <div className="max-w-7xl space-y-6">

      {/* Header */}
      <div>
        <h2 className="font-display text-3xl text-white mb-1">All Applications</h2>
        <p className="text-white/45 font-body text-sm">Manage and update application stages across all colleges</p>
      </div>

      {/* RLS error banner — surfaces fetch errors instead of showing silent 0 */}
      {(appsError || profilesError) && (
        <div className="flex items-start gap-3 p-4 rounded-2xl bg-red-500/[0.07] border border-red-500/30">
          <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div className="min-w-0">
            <p className="font-display text-base text-red-300 mb-1">Data fetch error</p>
            {appsError && (
              <p className="text-white/65 font-body text-xs">
                applications: <code className="text-red-300">{appsError.code}</code> {appsError.message}
              </p>
            )}
            {profilesError && (
              <p className="text-white/65 font-body text-xs">
                profiles: <code className="text-red-300">{profilesError.code}</code> {profilesError.message}
              </p>
            )}
            <p className="text-white/45 font-body text-xs mt-1.5">
              Run <code className="text-gold-300">src/lib/supabase/admin_rls_fix.sql</code> in Supabase, then check{" "}
              <a className="underline" href="/dashboard/admin/diagnostic">/dashboard/admin/diagnostic</a>.
            </p>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total",       value: totalApps,   icon: FileText,    gold: true  },
          { label: "Offer Ready", value: offerApps,   icon: TrendingUp,  gold: false },
          { label: "IPA",         value: ipaApps,     icon: Clock,       gold: false },
          { label: "Approved",    value: approvedApps,icon: CheckCircle2,gold: false },
        ].map(({ label, value, icon: Icon, gold }) => (
          <div key={label} className={`rounded-2xl border p-4 ${gold ? "bg-gold-400/[0.07] border-gold-400/25" : "bg-white/[0.04] border-white/[0.08]"}`}>
            <div className="flex items-center gap-2 mb-1">
              <Icon className={`w-3.5 h-3.5 ${gold ? "text-gold-400" : "text-white/40"}`} />
              <p className="text-white/40 font-body text-xs uppercase tracking-wider">{label}</p>
            </div>
            <p className={`font-display text-3xl font-bold ${gold ? "text-gold-400" : "text-white"}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Stage filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {[{ value: "", label: "All Stages" }, ...TIMELINE_STAGES.slice(0, 8)].map(s => {
          const isActive = activeFilter === s.value;
          const count    = s.value ? (stageCounts[s.value] ?? 0) : totalApps;
          const qs       = new URLSearchParams(params);
          if (s.value) qs.set("stage", s.value); else qs.delete("stage");
          return (
            <a key={s.value} href={`?${qs.toString()}`}
              className={`px-3.5 py-2 rounded-xl font-body text-xs font-medium border transition-all ${
                isActive ? "bg-gold-400/20 border-gold-400/40 text-gold-300" : "bg-white/[0.04] border-white/[0.08] text-white/45 hover:border-white/20 hover:text-white/70"
              }`}
            >
              {s.label}{count > 0 && <span className="ml-1 opacity-60">{count}</span>}
            </a>
          );
        })}
      </div>

      {/* Table */}
      {visible.length === 0 ? (
        <div className="flex flex-col items-center py-14 bg-white/[0.03] border border-white/[0.07] rounded-2xl">
          <FileText className="w-10 h-10 text-white/20 mb-3" />
          <p className="text-white/35 font-body text-sm">No applications match this filter</p>
          <p className="text-white/20 font-body text-xs mt-1">
            {activeFilter ? `0 rows with stage = ${activeFilter}` : "No applications in the database yet"}
          </p>
        </div>
      ) : (
        <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.07]">
            <h3 className="font-display text-xl text-white">Applications</h3>
            <span className="text-white/35 font-body text-sm">{visible.length} of {totalApps}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  {["Student", "Course", "Stage", "Submitted", "Update Stage"].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-white/30 font-body text-xs uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visible.map(app => (
                  <tr key={app.id} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-4">
                      <p className="font-body text-sm text-white/80 font-semibold">{app.profiles?.full_name ?? "—"}</p>
                      <p className="font-body text-xs text-white/35">{app.profiles?.email}</p>
                    </td>
                    <td className="px-5 py-4 max-w-[180px]">
                      <p className="font-body text-sm text-white/70 truncate">{app.courses?.title ?? "—"}</p>
                      <p className="font-body text-xs text-white/35 truncate">{app.courses?.colleges?.name}</p>
                    </td>
                    <td className="px-5 py-4">
                      <ApplicationStageBadge stage={app.current_stage} size="sm" />
                    </td>
                    <td className="px-5 py-4 font-body text-xs text-white/40 whitespace-nowrap">
                      {new Date(app.submitted_at).toLocaleDateString("en-SG", { day: "numeric", month: "short", year: "2-digit" })}
                    </td>
                    <td className="px-5 py-4">
                      <StageUpdateSelect
                        applicationId={app.id}
                        currentStage={app.current_stage}
                        compact
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
