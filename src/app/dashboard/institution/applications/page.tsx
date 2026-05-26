import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import StatusUpdateSelect from "@/components/courses/StatusUpdateSelect";
import type { ApplicationWithCourse } from "@/types/courses";
import { APPLICATION_STATUSES } from "@/types/courses";
import {
  FileText, Building2, Search, Users,
  CheckCircle2, Clock, TrendingUp,
} from "lucide-react";

export default async function InstitutionApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const params   = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles").select("role, college_id").eq("id", user.id).single();

  // PREVIEW MODE: role guard temporarily disabled
  // if (profile?.role !== "institution") redirect("/dashboard");
  if (!profile?.college_id) redirect("/dashboard/institution/courses");

  console.log("[InstitutionPortal] loading applications for college:", profile.college_id);

  // Build query — get all applications for courses owned by this college
  let query = supabase
    .from("applications")
    .select(`
      *,
      courses (
        id, title, slug, category,
        colleges (id, name, slug)
      )
    `)
    .order("submitted_at", { ascending: false });

  // Filter by courses belonging to this institution's college
  // (Uses RLS to enforce, but we also filter here for correctness)
  const { data: myCourseIds } = await supabase
    .from("courses").select("id").eq("college_id", profile.college_id);

  const courseIds = (myCourseIds ?? []).map(c => c.id);
  if (courseIds.length === 0) {
    // No courses yet
    return (
      <div className="max-w-4xl">
        <h2 className="font-display text-3xl text-white mb-2">Applications</h2>
        <div className="mt-6 flex flex-col items-center justify-center py-16 bg-white/[0.03] border border-white/[0.07] rounded-2xl">
          <FileText className="w-12 h-12 text-white/20 mb-4" />
          <p className="font-display text-2xl text-white/40 mb-1">No applications yet</p>
          <p className="text-white/30 font-body text-sm">Create courses first so students can apply</p>
        </div>
      </div>
    );
  }

  if (params.status) query = query.eq("status", params.status);
  query = query.in("course_id", courseIds);

  const { data, error } = await query;

  if (error) console.error("[InstitutionPortal] applications error:", error.code, error.message);

  const applications = (data ?? []) as ApplicationWithCourse[];

  // Stats
  const allApps = await supabase
    .from("applications")
    .select("status")
    .in("course_id", courseIds);

  const allData   = allApps.data ?? [];
  const statsMap  = allData.reduce<Record<string, number>>((acc, a) => {
    acc[a.status] = (acc[a.status] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="max-w-5xl space-y-6">

      {/* Header */}
      <div>
        <h2 className="font-display text-3xl text-white mb-1">Student Applications</h2>
        <p className="text-white/45 font-body text-sm">Review and update application statuses for your programmes</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total",       value: allData.length,               icon: Users,       gold: true  },
          { label: "New",         value: statsMap.submitted      ?? 0, icon: Clock,       gold: false },
          { label: "In Progress", value: (statsMap.under_review  ?? 0) + (statsMap.docs_required ?? 0), icon: TrendingUp, gold: false },
          { label: "Approved",    value: statsMap.approved       ?? 0, icon: CheckCircle2,gold: false },
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

      {/* Status filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {[{ value: "", label: "All" }, ...APPLICATION_STATUSES].map(s => {
          const isActive = (params.status ?? "") === s.value;
          return (
            <a
              key={s.value}
              href={s.value ? `?status=${s.value}` : "?"}
              className={`px-3.5 py-2 rounded-xl font-body text-xs font-medium border transition-all ${
                isActive
                  ? "bg-gold-400/20 border-gold-400/40 text-gold-300"
                  : "bg-white/[0.04] border-white/[0.08] text-white/45 hover:border-white/20 hover:text-white/70"
              }`}
            >
              {"label" in s ? s.label : "All"}
              {s.value && statsMap[s.value]
                ? <span className="ml-1 opacity-60">{statsMap[s.value]}</span>
                : null
              }
            </a>
          );
        })}
      </div>

      {/* Applications list */}
      {applications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-14 bg-white/[0.03] border border-white/[0.07] rounded-2xl">
          <FileText className="w-10 h-10 text-white/20 mb-3" />
          <p className="text-white/35 font-body text-sm">No applications match this filter</p>
        </div>
      ) : (
        <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.07]">
            <h3 className="font-display text-xl text-white">
              {params.status
                ? APPLICATION_STATUSES.find(s => s.value === params.status)?.label
                : "All Applications"}
            </h3>
            <span className="text-white/35 font-body text-sm">{applications.length}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  {["Student ID", "Course", "Category", "Submitted", "Status", "Update"].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-white/30 font-body text-xs uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {applications.map((app) => {
                  const statusMeta = APPLICATION_STATUSES.find(s => s.value === app.status);

                  return (
                    <tr key={app.id} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                      <td className="px-5 py-4">
                        <p className="font-mono text-xs text-white/40">{app.student_id.slice(0, 8)}…</p>
                      </td>
                      <td className="px-5 py-4 max-w-[180px]">
                        <p className="font-body font-semibold text-sm text-white/85 truncate">{app.courses?.title}</p>
                      </td>
                      <td className="px-5 py-4">
                        <span className="px-2.5 py-0.5 rounded-lg bg-pathBlue-500/10 border border-pathBlue-500/20 text-pathBlue-400 font-body text-xs">
                          {app.courses?.category}
                        </span>
                      </td>
                      <td className="px-5 py-4 font-body text-xs text-white/40 whitespace-nowrap">
                        {new Date(app.submitted_at).toLocaleDateString("en-SG", { day: "numeric", month: "short", year: "2-digit" })}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`px-2.5 py-0.5 rounded-full border font-body text-[11px] font-semibold ${statusMeta?.color ?? ""}`}>
                          {statusMeta?.label ?? app.status}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <StatusUpdateSelect
                          applicationId={app.id}
                          currentStatus={app.status}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="px-5 py-3 border-t border-white/[0.06] text-white/25 font-body text-xs">
            Showing {applications.length} of {allData.length} applications
          </div>
        </div>
      )}
    </div>
  );
}
