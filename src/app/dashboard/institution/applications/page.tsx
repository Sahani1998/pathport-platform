import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import StatusUpdateSelect from "@/components/courses/StatusUpdateSelect";
import type { ApplicationWithCourse } from "@/types/courses";
import { APPLICATION_STATUSES } from "@/types/courses";
import {
  FileText, Search, Users,
  CheckCircle2, Clock, TrendingUp, ChevronLeft, ChevronRight,
} from "lucide-react";

const PER_PAGE = 20;
const UUID_RE  = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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

  const isAdmin = profile?.role === "admin";

  // Institution users require a linked college. Admins bypass this requirement
  // and see all applications across every college.
  if (!isAdmin && !profile?.college_id) redirect("/dashboard/institution/courses");

  const q    = (params.q ?? "").trim().slice(0, 120);
  const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1);

  // ── Scope: institution sees only their college's courses ───────────────────
  let courseIds: string[] = [];
  if (!isAdmin && profile?.college_id) {
    const { data: myCourseIds } = await supabase
      .from("courses").select("id").eq("college_id", profile.college_id);
    courseIds = (myCourseIds ?? []).map(c => c.id);

    if (courseIds.length === 0) {
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
  }

  // ── Search: resolve matching students + courses, then filter by IDs ────────
  // Student name/email lives in profiles (FK → auth.users), so PostgREST can't
  // join it inline — resolve matching IDs first, then filter applications.
  let searchStudentIds: string[] | null = null;
  let searchCourseIds:  string[] | null = null;
  let searchAppId:      string  | null = null;

  if (q) {
    if (UUID_RE.test(q)) {
      searchAppId = q;
    } else {
      const ilike = `%${q.replace(/[%_]/g, "")}%`;
      const [studentsRes, coursesRes] = await Promise.all([
        supabase.from("profiles").select("id").or(`full_name.ilike.${ilike},email.ilike.${ilike}`).limit(100),
        (() => {
          let cq = supabase.from("courses").select("id").ilike("title", ilike).limit(100);
          if (!isAdmin && profile?.college_id) cq = cq.eq("college_id", profile.college_id);
          return cq;
        })(),
      ]);
      searchStudentIds = (studentsRes.data ?? []).map(s => s.id);
      searchCourseIds  = (coursesRes.data ?? []).map(c => c.id);
    }
  }

  // ── Build the filtered query (shared between count + page fetch) ───────────
  const buildQuery = (selectArg: string, opts?: { count?: "exact"; head?: boolean }) => {
    let query = supabase.from("applications").select(selectArg, opts);
    if (!isAdmin && courseIds.length > 0) query = query.in("course_id", courseIds);
    if (params.status) query = query.eq("status", params.status);
    if (searchAppId) {
      query = query.eq("id", searchAppId);
    } else if (searchStudentIds !== null || searchCourseIds !== null) {
      const parts: string[] = [];
      if (searchStudentIds?.length) parts.push(`student_id.in.(${searchStudentIds.join(",")})`);
      if (searchCourseIds?.length)  parts.push(`course_id.in.(${searchCourseIds.join(",")})`);
      if (parts.length === 0) {
        // No matches — force an empty result set
        query = query.eq("id", "00000000-0000-0000-0000-000000000000");
      } else {
        query = query.or(parts.join(","));
      }
    }
    return query;
  };

  const from = (page - 1) * PER_PAGE;
  const [{ data, error, count: filteredCount }, statsRes] = await Promise.all([
    buildQuery(`
      *,
      courses (
        id, title, slug, category,
        colleges (id, name, slug)
      )
    `, { count: "exact" })
      .order("submitted_at", { ascending: false })
      .range(from, from + PER_PAGE - 1),

    // Stats — scoped to college for institution, all for admin (unfiltered)
    (() => {
      let sq = supabase.from("applications").select("status");
      if (!isAdmin && courseIds.length > 0) sq = sq.in("course_id", courseIds);
      return sq;
    })(),
  ]);

  if (error) console.error("[InstitutionPortal] applications error:", error.code, error.message);

  const applications = (data ?? []) as unknown as ApplicationWithCourse[];
  const total        = filteredCount ?? applications.length;
  const totalPages   = Math.max(1, Math.ceil(total / PER_PAGE));

  // Student names/emails for the visible rows (two-query pattern)
  const studentIds   = Array.from(new Set(applications.map(a => a.student_id)));
  const studentNames = new Map<string, { full_name: string | null; email: string | null }>();
  if (studentIds.length > 0) {
    const { data: students } = await supabase
      .from("profiles").select("id, full_name, email").in("id", studentIds);
    for (const s of students ?? []) studentNames.set(s.id, { full_name: s.full_name, email: s.email });
  }

  const allData  = statsRes.data ?? [];
  const statsMap = allData.reduce<Record<string, number>>((acc, a) => {
    acc[a.status] = (acc[a.status] ?? 0) + 1;
    return acc;
  }, {});

  // Preserve filters across links
  const buildHref = (overrides: { status?: string; page?: number; q?: string }) => {
    const sp = new URLSearchParams();
    const status = overrides.status ?? params.status ?? "";
    const query  = overrides.q ?? q;
    const p      = overrides.page ?? 1;
    if (status) sp.set("status", status);
    if (query)  sp.set("q", query);
    if (p > 1)  sp.set("page", String(p));
    const s = sp.toString();
    return s ? `?${s}` : "?";
  };

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

      {/* Search */}
      <form method="GET" className="flex gap-2">
        {params.status && <input type="hidden" name="status" value={params.status} />}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="Search by student name, email, course, or application ID…"
            className="w-full bg-white/[0.05] border border-white/[0.09] rounded-xl pl-10 pr-4 py-2.5 font-body text-sm text-white placeholder-white/25 focus:outline-none focus:border-gold-400/40"
          />
        </div>
        <button
          type="submit"
          className="px-4 py-2.5 rounded-xl bg-gold-400/10 border border-gold-400/25 text-gold-400 font-body text-sm font-semibold hover:bg-gold-400/20 transition-all"
        >
          Search
        </button>
        {q && (
          <Link
            href={buildHref({ q: "" })}
            className="px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white/45 font-body text-sm hover:border-white/20 hover:text-white/70 transition-all"
          >
            Clear
          </Link>
        )}
      </form>

      {/* Status filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {[{ value: "", label: "All" }, ...APPLICATION_STATUSES].map(s => {
          const isActive = (params.status ?? "") === s.value;
          return (
            <Link
              key={s.value}
              href={buildHref({ status: s.value })}
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
            </Link>
          );
        })}
      </div>

      {/* Applications list */}
      {applications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-14 bg-white/[0.03] border border-white/[0.07] rounded-2xl">
          <FileText className="w-10 h-10 text-white/20 mb-3" />
          <p className="text-white/35 font-body text-sm">
            {q ? `No applications match “${q}”` : "No applications match this filter"}
          </p>
        </div>
      ) : (
        <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.07]">
            <h3 className="font-display text-xl text-white">
              {params.status
                ? APPLICATION_STATUSES.find(s => s.value === params.status)?.label
                : "All Applications"}
            </h3>
            <span className="text-white/35 font-body text-sm">{total}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  {["Student", "Course", "Category", "Submitted", "Status", "Update"].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-white/30 font-body text-xs uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {applications.map((app) => {
                  const statusMeta = APPLICATION_STATUSES.find(s => s.value === app.status);
                  const student    = studentNames.get(app.student_id);

                  return (
                    <tr key={app.id} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                      <td className="px-5 py-4 max-w-[180px]">
                        <p className="font-body font-semibold text-sm text-white/80 truncate">
                          {student?.full_name ?? `${app.student_id.slice(0, 8)}…`}
                        </p>
                        {student?.email && (
                          <p className="font-body text-[11px] text-white/35 truncate">{student.email}</p>
                        )}
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
                        <div className="flex items-center gap-2">
                          <StatusUpdateSelect
                            applicationId={app.id}
                            currentStage={(app.current_stage as import("@/types/timeline").ApplicationStage) ?? "application_submitted"}
                          />
                          <Link
                            href={`/dashboard/institution/applications/${app.id}`}
                            className="px-3 py-1.5 rounded-xl bg-white/[0.05] border border-white/[0.09] text-white/45 font-body text-xs hover:border-gold-400/30 hover:text-gold-400 transition-all whitespace-nowrap"
                          >
                            View Docs →
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-5 py-3 border-t border-white/[0.06] flex items-center justify-between gap-2 flex-wrap">
            <p className="text-white/25 font-body text-xs">
              Showing {from + 1}–{Math.min(from + applications.length, total)} of {total} applications
            </p>
            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                {page > 1 ? (
                  <Link
                    href={buildHref({ page: page - 1 })}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/[0.05] border border-white/[0.09] text-white/55 font-body text-xs hover:border-gold-400/30 hover:text-gold-400 transition-all"
                  >
                    <ChevronLeft className="w-3 h-3" /> Prev
                  </Link>
                ) : (
                  <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/[0.05] text-white/20 font-body text-xs">
                    <ChevronLeft className="w-3 h-3" /> Prev
                  </span>
                )}
                <span className="text-white/35 font-body text-xs">Page {page} of {totalPages}</span>
                {page < totalPages ? (
                  <Link
                    href={buildHref({ page: page + 1 })}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/[0.05] border border-white/[0.09] text-white/55 font-body text-xs hover:border-gold-400/30 hover:text-gold-400 transition-all"
                  >
                    Next <ChevronRight className="w-3 h-3" />
                  </Link>
                ) : (
                  <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/[0.05] text-white/20 font-body text-xs">
                    Next <ChevronRight className="w-3 h-3" />
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
