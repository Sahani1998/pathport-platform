import { createClient } from "@/lib/supabase/server";
import { redirect }      from "next/navigation";
import { DOCUMENT_TYPES, DOCUMENT_STATUS_META } from "@/types/documents";
import type { DocumentStatus, StudentDocument, DocumentReview } from "@/types/documents";
import type { ApplicationStage } from "@/types/timeline";
import DocumentReviewPanel from "@/components/documents/DocumentReviewPanel";
import ApplicationStageBadge from "@/components/applications/ApplicationStageBadge";
import { FileText, Filter, Clock, CheckCircle2, XCircle, RefreshCw, AlertCircle } from "lucide-react";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function one<T>(v: T | T[] | null | undefined): T | null {
  if (Array.isArray(v)) return v[0] ?? null;
  return v ?? null;
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface DocRow extends StudentDocument {
  application: {
    id:            string;
    current_stage: ApplicationStage | null;
    courses:       { title: string; colleges: { name: string } | null } | null;
  } | null;
  student: { full_name: string | null; email: string } | null;
  reviews: DocumentReview[];
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function InstitutionDocumentsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const sp      = await searchParams;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, college_id, full_name")
    .eq("id", user.id)
    .single();

  if (!profile || !["admin", "institution"].includes(profile.role)) {
    redirect("/dashboard");
  }

  // ── Filters from query params ───────────────────────────────────────────────
  const filterStatus = (sp.status ?? "all") as DocumentStatus | "all";
  const filterSearch = (sp.search ?? "").trim().toLowerCase();
  const filterCourse = (sp.course ?? "").trim();

  // ── Fetch documents for this college ───────────────────────────────────────
  // Two-query pattern (FK to auth.users, can't use implicit PostgREST join)
  let docsQuery = supabase
    .from("student_documents")
    .select(`
      id, student_id, application_id, document_type,
      file_name, file_url, file_path, mime_type, file_size,
      status, rejection_reason, uploaded_at, reviewed_at, reviewed_by,
      applications (
        id, current_stage,
        courses ( title, colleges ( name ) )
      )
    `)
    .order("uploaded_at", { ascending: false });

  if (filterStatus !== "all") {
    docsQuery = docsQuery.eq("status", filterStatus);
  }

  const { data: rawDocs, error: docsError } = await docsQuery;

  // Fetch profiles for all student_ids (avoid broken FK join)
  const studentIds = Array.from(
    new Set(((rawDocs ?? []) as { student_id: string }[]).map(d => d.student_id).filter(Boolean))
  );
  const { data: profileRows } = studentIds.length
    ? await supabase.from("profiles").select("id, full_name, email").in("id", studentIds)
    : { data: [] };
  const profileMap = new Map((profileRows ?? []).map(p => [p.id, p]));

  // Fetch review history for all these documents in one query
  const docIds = ((rawDocs ?? []) as { id: string }[]).map(d => d.id);
  const { data: reviewRows } = docIds.length
    ? await supabase
        .from("document_reviews")
        .select("id, document_id, reviewer_id, status, comment, created_at, profiles:reviewer_id(full_name)")
        .in("document_id", docIds)
        .order("created_at", { ascending: false })
    : { data: [] };

  // Group reviews by document_id
  const reviewsByDoc = new Map<string, DocumentReview[]>();
  for (const r of (reviewRows ?? [])) {
    const raw     = r as Record<string, unknown>;
    const profile = one(raw.profiles as { full_name: string | null } | null);
    const review: DocumentReview = {
      id:          String(raw.id),
      document_id: String(raw.document_id),
      reviewer_id: raw.reviewer_id as string | null,
      status:      raw.status as DocumentStatus,
      comment:     raw.comment as string | null,
      created_at:  String(raw.created_at),
      reviewer:    profile ? { full_name: profile.full_name } : null,
    };
    const bucket = reviewsByDoc.get(review.document_id) ?? [];
    bucket.push(review);
    reviewsByDoc.set(review.document_id, bucket);
  }

  // Normalise and filter docs
  type RawDoc = {
    id: string; student_id: string; application_id: string | null;
    document_type: string; file_name: string; file_url: string; file_path: string;
    mime_type: string | null; file_size: number | null; status: string;
    rejection_reason: string | null; uploaded_at: string;
    reviewed_at: string | null; reviewed_by: string | null;
    applications: unknown;
  };

  let docs: DocRow[] = ((rawDocs ?? []) as RawDoc[]).map(d => {
    const rawApp    = one(d.applications as { id: string; current_stage: string | null; courses: unknown } | null);
    const rawCourse = rawApp ? one(rawApp.courses as { title: string; colleges: unknown } | null) : null;
    const rawColl   = rawCourse ? one(rawCourse.colleges as { name: string } | null) : null;

    const student   = profileMap.get(d.student_id) ?? null;

    return {
      ...(d as unknown as StudentDocument),
      status: d.status as DocumentStatus,
      application: rawApp ? {
        id:            rawApp.id,
        current_stage: rawApp.current_stage as ApplicationStage | null,
        courses:       rawCourse ? { title: rawCourse.title, colleges: rawColl } : null,
      } : null,
      student: student ? { full_name: student.full_name, email: student.email } : null,
      reviews: reviewsByDoc.get(d.id) ?? [],
    };
  });

  // Institution: keep only docs belonging to college (already RLS-scoped, but filter defensively)
  if (profile.role === "institution" && profile.college_id) {
    docs = docs.filter(d => {
      const college = d.application?.courses?.colleges;
      const rawCollege = one(college as { name: string } | null);
      // We can check via the college name match from the courses join
      // If college isn't resolved, keep it only for admins
      return rawCollege !== null;
    });
  }

  // Apply search filter
  if (filterSearch) {
    docs = docs.filter(d =>
      d.student?.full_name?.toLowerCase().includes(filterSearch) ||
      d.student?.email?.toLowerCase().includes(filterSearch) ||
      d.application?.courses?.title?.toLowerCase().includes(filterSearch) ||
      d.file_name.toLowerCase().includes(filterSearch)
    );
  }

  // Apply course filter
  if (filterCourse) {
    docs = docs.filter(d => d.application?.courses?.title === filterCourse);
  }

  // ── Stats ───────────────────────────────────────────────────────────────────
  const allForStats = rawDocs ?? [];
  const counts = {
    pending:           (allForStats as { status: string }[]).filter(d => d.status === "pending").length,
    verified:          (allForStats as { status: string }[]).filter(d => d.status === "verified").length,
    rejected:          (allForStats as { status: string }[]).filter(d => d.status === "rejected").length,
    reupload_required: (allForStats as { status: string }[]).filter(d => d.status === "reupload_required").length,
  };

  // Unique course list for filter
  const courseSet = new Set(docs.map(d => d.application?.courses?.title).filter(Boolean) as string[]);
  const courseOptions = Array.from(courseSet).sort();

  const STAT_CARDS = [
    { key: "pending",           label: "Pending",          icon: Clock,         color: "text-gold-400    bg-gold-400/10    border-gold-400/25"    },
    { key: "verified",          label: "Verified",         icon: CheckCircle2,  color: "text-emerald-400 bg-emerald-500/10 border-emerald-400/25" },
    { key: "rejected",          label: "Rejected",         icon: XCircle,       color: "text-red-400     bg-red-500/10     border-red-400/25"     },
    { key: "reupload_required", label: "Re-upload Needed", icon: RefreshCw,     color: "text-orange-400  bg-orange-500/10  border-orange-400/25"  },
  ] as const;

  return (
    <div className="space-y-8">

      {/* Header */}
      <div>
        <h1 className="font-display text-3xl text-white mb-1">Document Queue</h1>
        <p className="text-white/45 font-body text-sm">
          Review and verify student documents submitted for your college&apos;s applications.
        </p>
      </div>

      {/* Error banner */}
      {docsError && (
        <div className="flex items-start gap-3 p-4 rounded-2xl bg-red-500/[0.07] border border-red-400/25">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-red-400 font-body text-sm">{docsError.message}</p>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {STAT_CARDS.map(({ key, label, icon: Icon, color }) => (
          <a
            key={key}
            href={`?status=${key}`}
            className={`block p-4 rounded-2xl border transition-all hover:-translate-y-0.5 ${
              filterStatus === key
                ? color + " shadow-lg"
                : "bg-white/[0.03] border-white/[0.08] hover:border-white/20"
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <Icon className={`w-4 h-4 ${filterStatus === key ? "" : "text-white/40"}`} />
              <span className={`font-body text-xs font-medium ${filterStatus === key ? "" : "text-white/40"}`}>{label}</span>
            </div>
            <p className={`font-display text-3xl font-bold ${filterStatus === key ? "" : "text-white/70"}`}>
              {counts[key as keyof typeof counts]}
            </p>
          </a>
        ))}
      </div>

      {/* Filters */}
      <form method="GET" className="flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-2 text-white/40">
          <Filter className="w-4 h-4" />
          <span className="font-body text-sm">Filter:</span>
        </div>

        <select
          name="status"
          defaultValue={filterStatus}
          className="bg-white/[0.05] border border-white/[0.10] rounded-xl px-3 py-2 font-body text-sm text-white/80 focus:outline-none focus:border-white/25 [&>option]:bg-navy-900"
        >
          <option value="all">All statuses</option>
          {(Object.keys(DOCUMENT_STATUS_META) as DocumentStatus[]).map(s => (
            <option key={s} value={s}>{DOCUMENT_STATUS_META[s].label}</option>
          ))}
        </select>

        {courseOptions.length > 0 && (
          <select
            name="course"
            defaultValue={filterCourse}
            className="bg-white/[0.05] border border-white/[0.10] rounded-xl px-3 py-2 font-body text-sm text-white/80 focus:outline-none focus:border-white/25 [&>option]:bg-navy-900 max-w-[220px] truncate"
          >
            <option value="">All courses</option>
            {courseOptions.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        )}

        <input
          name="search"
          type="text"
          defaultValue={filterSearch}
          placeholder="Search student or file…"
          className="bg-white/[0.05] border border-white/[0.10] rounded-xl px-3 py-2 font-body text-sm text-white placeholder-white/25 focus:outline-none focus:border-white/25 w-52"
        />

        <button
          type="submit"
          className="px-4 py-2 rounded-xl bg-pathBlue-500/15 border border-pathBlue-500/30 text-pathBlue-400 font-body text-sm font-semibold hover:bg-pathBlue-500/25 transition-all"
        >
          Apply
        </button>

        {(filterStatus !== "all" || filterSearch || filterCourse) && (
          <a
            href="?"
            className="px-4 py-2 rounded-xl bg-white/[0.04] border border-white/[0.09] text-white/45 font-body text-sm hover:text-white/70 hover:border-white/20 transition-all"
          >
            Clear
          </a>
        )}
      </form>

      {/* Document type filter pills */}
      <div className="flex flex-wrap gap-2">
        {DOCUMENT_TYPES.map(dt => {
          const count = docs.filter(d => d.document_type === dt.value).length;
          if (count === 0) return null;
          return (
            <span
              key={dt.value}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] font-body text-xs text-white/55"
            >
              <FileText className="w-3 h-3" />
              {dt.label}
              <span className="w-4 h-4 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-bold text-white/70">{count}</span>
            </span>
          );
        })}
      </div>

      {/* Empty state */}
      {docs.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 bg-white/[0.03] border border-white/[0.07] rounded-2xl">
          <FileText className="w-12 h-12 text-white/20 mb-4" />
          <p className="font-display text-2xl text-white/40 mb-1">No documents</p>
          <p className="text-white/30 font-body text-sm">
            {filterStatus !== "all" || filterSearch || filterCourse
              ? "No documents match the current filters."
              : "No student documents have been uploaded yet."}
          </p>
        </div>
      )}

      {/* Document list */}
      {docs.length > 0 && (
        <div className="space-y-4">
          <p className="font-body text-sm text-white/40">
            Showing {docs.length} document{docs.length !== 1 ? "s" : ""}
          </p>
          <div className="space-y-3">
            {docs.map(doc => (
              <div key={doc.id} className="space-y-1">
                {doc.application && (
                  <div className="flex items-center gap-2 px-1 mb-1">
                    <span className="font-body text-xs text-white/35 truncate">
                      {doc.student?.full_name ?? "—"} · {doc.application.courses?.title ?? "—"}
                    </span>
                    {doc.application.current_stage && (
                      <ApplicationStageBadge
                        stage={doc.application.current_stage}
                        size="sm"
                        showEmoji={false}
                      />
                    )}
                  </div>
                )}
                <DocumentReviewPanel doc={doc} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
