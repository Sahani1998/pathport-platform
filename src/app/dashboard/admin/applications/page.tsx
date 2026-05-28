import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import ApplicationStageBadge from "@/components/applications/ApplicationStageBadge";
import StageUpdateSelect from "@/components/applications/StageUpdateSelect";
import { STAGE_META, TIMELINE_STAGES } from "@/types/timeline";
import type { ApplicationStage } from "@/types/timeline";
import { FileText, Users, CheckCircle2, TrendingUp, Clock } from "lucide-react";

interface AppRow {
  id:           string;
  student_id:   string;
  status:       string;
  current_stage: ApplicationStage | null;
  submitted_at: string;
  stage_updated_at: string | null;
  courses: { title: string; colleges?: { name: string } | null } | null;
  profiles?: { full_name: string | null; email: string | null } | null;
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

  console.log("[AdminApplications] active filter:", params.stage ?? "none (all)");

  // Stage stats — NULL current_stage is treated as application_submitted
  const stageCounts: Record<string, number> = {};
  const { data: allApps } = await supabase.from("applications").select("current_stage");
  for (const a of allApps ?? []) {
    const s = a.current_stage ?? "application_submitted";
    stageCounts[s] = (stageCounts[s] ?? 0) + 1;
  }

  console.log("[AdminApplications] total rows:", allApps?.length ?? 0, "| stageCounts:", JSON.stringify(stageCounts));

  // Main query
  let query = supabase
    .from("applications")
    .select(`
      id, student_id, status, current_stage, submitted_at, stage_updated_at,
      courses ( title, colleges ( name ) ),
      profiles:student_id ( full_name, email )
    `)
    .order("submitted_at", { ascending: false })
    .limit(100);

  if (params.stage) {
    // "application_submitted" must also match NULL rows (pre-migration rows default there)
    if (params.stage === "application_submitted") {
      query = query.or("current_stage.eq.application_submitted,current_stage.is.null");
    } else {
      query = query.eq("current_stage", params.stage);
    }
  }
  // No params.stage → All Stages tab → no filter applied

  const { data, error } = await query;
  if (error) console.error("[AdminApplications] fetch error:", error.message);

  console.log("[AdminApplications] filtered rows:", data?.length ?? 0);

  const apps = (data ?? []).map(row => {
    const rawCourses = Array.isArray(row.courses) ? row.courses[0] : row.courses;
    const rawCollege = rawCourses ? (Array.isArray((rawCourses as { colleges?: unknown }).colleges) ? ((rawCourses as { colleges: unknown[] }).colleges)[0] : (rawCourses as { colleges?: unknown }).colleges) : null;
    const rawProfile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
    return {
      ...row,
      courses: rawCourses ? { title: (rawCourses as { title: string }).title, colleges: rawCollege as { name: string } | null } : null,
      profiles: rawProfile as { full_name: string | null; email: string | null } | null,
    } as AppRow;
  });

  const totalApps    = allApps?.length ?? 0;
  const approvedApps = stageCounts["approved"] ?? 0;
  const ipaApps      = stageCounts["ipa_processing"] ?? 0;
  const offerApps    = stageCounts["offer_letter_ready"] ?? 0;

  return (
    <div className="max-w-7xl space-y-6">

      {/* Header */}
      <div>
        <h2 className="font-display text-3xl text-white mb-1">All Applications</h2>
        <p className="text-white/45 font-body text-sm">Manage and update application stages across all colleges</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total",        value: totalApps,   icon: FileText,    gold: true  },
          { label: "Offer Ready",  value: offerApps,   icon: TrendingUp,  gold: false },
          { label: "IPA",          value: ipaApps,     icon: Clock,       gold: false },
          { label: "Approved",     value: approvedApps,icon: CheckCircle2,gold: false },
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
          const isActive = (params.stage ?? "") === s.value;
          const count    = s.value ? (stageCounts[s.value] ?? 0) : totalApps;
          const qs       = new URLSearchParams(params);
          if (s.value) qs.set("stage", s.value); else qs.delete("stage");
          return (
            <a key={s.value} href={`?${qs.toString()}`}
              className={`px-3.5 py-2 rounded-xl font-body text-xs font-medium border transition-all ${
                isActive ? "bg-gold-400/20 border-gold-400/40 text-gold-300" : "bg-white/[0.04] border-white/[0.08] text-white/45 hover:border-white/20 hover:text-white/70"
              }`}
            >
              {s.label} {count > 0 && <span className="ml-1 opacity-60">{count}</span>}
            </a>
          );
        })}
      </div>

      {/* Table */}
      {apps.length === 0 ? (
        <div className="flex flex-col items-center py-14 bg-white/[0.03] border border-white/[0.07] rounded-2xl">
          <FileText className="w-10 h-10 text-white/20 mb-3" />
          <p className="text-white/35 font-body text-sm">No applications match this filter</p>
        </div>
      ) : (
        <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.07]">
            <h3 className="font-display text-xl text-white">Applications</h3>
            <span className="text-white/35 font-body text-sm">{apps.length} shown</span>
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
                {apps.map(app => (
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
                      <ApplicationStageBadge stage={app.current_stage ?? "application_submitted"} size="sm" />
                    </td>
                    <td className="px-5 py-4 font-body text-xs text-white/40 whitespace-nowrap">
                      {new Date(app.submitted_at).toLocaleDateString("en-SG", { day: "numeric", month: "short", year: "2-digit" })}
                    </td>
                    <td className="px-5 py-4">
                      <StageUpdateSelect
                        applicationId={app.id}
                        currentStage={app.current_stage ?? "application_submitted"}
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
