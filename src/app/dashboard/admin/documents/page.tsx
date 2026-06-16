import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import DocumentStatusBadge from "@/components/documents/DocumentStatusBadge";
import DocumentReviewActions from "@/components/documents/DocumentReviewActions";
import { DOCUMENT_TYPES, fmtFileSize } from "@/types/documents";
import type { StudentDocument } from "@/types/documents";
import { FileText, Download, Users, CheckCircle2, Clock, XCircle } from "lucide-react";

interface DocRow extends StudentDocument {
  profiles?:    { full_name: string | null; email: string | null } | null;
  applications?: {
    courses?: { title: string; colleges?: { name: string } | null } | null;
  } | null;
}

export default async function AdminDocumentsPage({
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

  console.log("[Documents] admin loading all documents, filter:", params);

  // Stats
  const [
    { count: totalDocs },
    { count: pendingDocs },
    { count: verifiedDocs },
    { count: rejectedDocs },
  ] = await Promise.all([
    supabase.from("student_documents").select("*", { count: "exact", head: true }).eq("is_active", true),
    supabase.from("student_documents").select("*", { count: "exact", head: true }).eq("is_active", true).eq("status", "pending"),
    supabase.from("student_documents").select("*", { count: "exact", head: true }).eq("is_active", true).eq("status", "verified"),
    supabase.from("student_documents").select("*", { count: "exact", head: true }).eq("is_active", true).eq("status", "rejected"),
  ]);

  // Main query — fetch documents with application/course/college join only.
  // student_documents.student_id references auth.users, NOT profiles, so the
  // FK-implicit `profiles:student_id` join fails.  We fetch profiles
  // separately by IN(student_ids) below.
  let query = supabase
    .from("student_documents")
    .select(`
      *,
      applications:application_id (
        courses ( title, colleges ( name ) )
      )
    `)
    .eq("is_active", true)
    .order("uploaded_at", { ascending: false })
    .limit(100);

  if (params.status)   query = query.eq("status",        params.status);
  if (params.docType)  query = query.eq("document_type", params.docType);

  const { data, error } = await query;
  if (error) console.error("[Documents] admin fetch error:", error.code, error.message);

  // Fetch student profiles separately
  const studentIds = Array.from(new Set((data ?? []).map(r => (r as { student_id?: string }).student_id).filter(Boolean) as string[]));
  let profileMap = new Map<string, { full_name: string | null; email: string | null }>();
  if (studentIds.length > 0) {
    const { data: profiles, error: pErr } = await supabase
      .from("profiles")
      .select("id, full_name, email")
      .in("id", studentIds);
    if (pErr) console.error("[Documents] profile fetch error:", pErr.code, pErr.message);
    profileMap = new Map((profiles ?? []).map(p => [p.id, { full_name: p.full_name, email: p.email }]));
  }

  // Normalise: Supabase may return foreign-key joins as arrays instead of objects
  type RawRow = {
    student_id?:   string;
    applications?: {
      courses?: { title: string; colleges?: { name: string } | { name: string }[] | null } | null |
                { title: string; colleges?: { name: string } | { name: string }[] | null }[];
    } | { courses?: unknown }[] | null;
    [key: string]: unknown;
  };

  const docs: DocRow[] = ((data ?? []) as RawRow[]).map((row) => {
    const rawApp      = Array.isArray(row.applications)  ? row.applications[0]  : row.applications;
    const rawCourse   = rawApp  ? (Array.isArray((rawApp as { courses?: unknown }).courses) ? ((rawApp as { courses: unknown[] }).courses)[0] : (rawApp as { courses?: unknown }).courses) : null;
    const rawCollege  = rawCourse ? (Array.isArray((rawCourse as { colleges?: unknown }).colleges) ? ((rawCourse as { colleges: unknown[] }).colleges)[0] : (rawCourse as { colleges?: unknown }).colleges) : null;

    return {
      ...(row as unknown as StudentDocument),
      profiles: row.student_id ? (profileMap.get(row.student_id) ?? null) : null,
      applications: rawApp ? {
        courses: rawCourse ? {
          title:    (rawCourse as { title?: string }).title ?? "—",
          colleges: rawCollege ? { name: (rawCollege as { name?: string }).name ?? "—" } : null,
        } : null,
      } : null,
    } as DocRow;
  });

  return (
    <div className="max-w-6xl space-y-6">

      {/* Header */}
      <div>
        <h2 className="font-display text-3xl text-white mb-1">Document Review</h2>
        <p className="text-white/45 font-body text-sm">Review and verify all student uploaded documents across the platform</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Docs",  value: totalDocs   ?? 0, icon: FileText,    gold: true  },
          { label: "Pending",     value: pendingDocs ?? 0, icon: Clock,       gold: false },
          { label: "Verified",    value: verifiedDocs ?? 0, icon: CheckCircle2, gold: false },
          { label: "Rejected",    value: rejectedDocs ?? 0, icon: XCircle,    gold: false },
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

      {/* Filters */}
      <div className="flex gap-2 flex-wrap items-center">
        {/* Status filter */}
        <div className="flex gap-1.5">
          {[
            { value: "",         label: "All Status" },
            { value: "pending",  label: "Pending" },
            { value: "verified", label: "Verified" },
            { value: "rejected", label: "Rejected" },
          ].map(s => {
            const active = (params.status ?? "") === s.value;
            const qs = new URLSearchParams(params);
            if (s.value) qs.set("status", s.value); else qs.delete("status");
            return (
              <a key={s.value} href={`?${qs.toString()}`}
                className={`px-3 py-1.5 rounded-xl font-body text-xs font-medium border transition-all ${
                  active ? "bg-gold-400/20 border-gold-400/40 text-gold-300" : "bg-white/[0.04] border-white/[0.08] text-white/45 hover:border-white/20"
                }`}
              >{s.label}</a>
            );
          })}
        </div>

        <div className="w-px h-5 bg-white/[0.10]" />

        {/* Type filter */}
        <div className="flex gap-1.5 flex-wrap">
          {DOCUMENT_TYPES.slice(0, 6).map(dt => {
            const active = params.docType === dt.value;
            const qs = new URLSearchParams(params);
            if (!active) qs.set("docType", dt.value); else qs.delete("docType");
            return (
              <a key={dt.value} href={`?${qs.toString()}`}
                className={`px-3 py-1.5 rounded-xl font-body text-xs border transition-all ${
                  active ? "bg-pathBlue-500/15 border-pathBlue-500/30 text-pathBlue-300" : "bg-white/[0.03] border-white/[0.07] text-white/35 hover:border-white/15"
                }`}
              >{dt.label}</a>
            );
          })}
        </div>
      </div>

      {/* Table */}
      {docs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-14 bg-white/[0.03] border border-white/[0.07] rounded-2xl">
          <FileText className="w-10 h-10 text-white/20 mb-3" />
          <p className="text-white/35 font-body text-sm">No documents match this filter</p>
        </div>
      ) : (
        <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.07]">
            <h3 className="font-display text-xl text-white">Documents</h3>
            <span className="text-white/35 font-body text-sm">{docs.length} shown</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  {["Student", "Type", "File", "College / Course", "Uploaded", "Status", "Actions"].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-white/30 font-body text-xs uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {docs.map(doc => {
                  const typeMeta = DOCUMENT_TYPES.find(d => d.value === doc.document_type);
                  const course   = doc.applications?.courses;
                  return (
                    <tr key={doc.id} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-body text-sm text-white/80 font-semibold">{doc.profiles?.full_name ?? "—"}</p>
                        <p className="font-body text-xs text-white/35">{doc.profiles?.email}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2.5 py-0.5 rounded-lg bg-pathBlue-500/10 border border-pathBlue-500/20 text-pathBlue-400 font-body text-xs">
                          {typeMeta?.label ?? doc.document_type}
                        </span>
                      </td>
                      <td className="px-4 py-3 max-w-[140px]">
                        <p className="font-body text-xs text-white/55 truncate">{doc.file_name}</p>
                        <p className="font-body text-[10px] text-white/30">{fmtFileSize(doc.file_size)}</p>
                      </td>
                      <td className="px-4 py-3 max-w-[180px]">
                        <p className="font-body text-xs text-white/55 truncate">{course?.colleges?.name ?? "—"}</p>
                        <p className="font-body text-[10px] text-white/30 truncate">{course?.title}</p>
                      </td>
                      <td className="px-4 py-3 font-body text-xs text-white/40 whitespace-nowrap">
                        {new Date(doc.uploaded_at).toLocaleDateString("en-SG", { day: "numeric", month: "short", year: "2-digit" })}
                      </td>
                      <td className="px-4 py-3">
                        <DocumentStatusBadge status={doc.status} rejectionReason={doc.rejection_reason} showReason />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-2">
                          <a href={`/api/documents/${doc.id}/download`} target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-pathBlue-400 hover:text-pathBlue-300 font-body text-xs transition-colors">
                            <Download className="w-3 h-3" /> View
                          </a>
                          <DocumentReviewActions documentId={doc.id} currentStatus={doc.status} />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
