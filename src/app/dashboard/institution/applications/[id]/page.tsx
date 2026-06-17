import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import DocumentStatusBadge from "@/components/documents/DocumentStatusBadge";
import DocumentReviewActions from "@/components/documents/DocumentReviewActions";
import ApplicationStageBadge from "@/components/applications/ApplicationStageBadge";
import StageUpdateSelect from "@/components/applications/StageUpdateSelect";
import IssueOfferLetterForm from "@/components/offer-letters/IssueOfferLetterForm";
import DocumentRequestPanel from "@/components/applications/DocumentRequestPanel";
import ApplicationNotesPanel from "@/components/applications/ApplicationNotesPanel";
import IpaPanel from "@/components/applications/IpaPanel";
import { APPLICATION_STATUSES } from "@/types/courses";
import { resolveStage } from "@/lib/application-stage-mapping";
import type { ApplicationStage } from "@/types/timeline";
import { DOCUMENT_TYPES, fmtFileSize } from "@/types/documents";
import type { StudentDocument } from "@/types/documents";
import type { OfferLetterWithUploader } from "@/types/offer-letters";
import type { DocumentRequest, IpaRecord, ApplicationNoteWithAuthor, ApplicationNote } from "@/types/application-processing";
import {
  ArrowLeft, User, FileText, Building2, Calendar,
  Download, AlertCircle, CheckCircle2, Receipt, ChevronRight,
} from "lucide-react";

export default async function InstitutionApplicationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id }   = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles").select("role, college_id").eq("id", user.id).single();

  const isAdmin = profile?.role === "admin";

  // Fetch the application
  const { data: app, error: appError } = await supabase
    .from("applications")
    .select(`
      id, status, current_stage, notes, submitted_at, updated_at,
      courses (id, title, slug, category, college_id,
        colleges (id, name)),
      student_id
    `)
    .eq("id", id)
    .single();

  if (appError || !app) notFound();

  // Supabase may return joined relations as arrays — normalise once so all
  // downstream references use plain typed objects, no casts needed.
  type RawCourse = { id: string; title: string; slug: string; category: string; college_id: string; colleges: { id: string; name: string } | { id: string; name: string }[] | null };
  const rawCourse  = (Array.isArray(app.courses) ? app.courses[0] : app.courses) as RawCourse | null;
  const rawCollege = rawCourse ? (Array.isArray(rawCourse.colleges) ? rawCourse.colleges[0] : rawCourse.colleges) : null;

  const course = {
    id:         rawCourse?.id         ?? "",
    title:      rawCourse?.title      ?? "—",
    slug:       rawCourse?.slug       ?? "",
    category:   rawCourse?.category   ?? "",
    college_id: rawCourse?.college_id ?? "",
    colleges:   { id: rawCollege?.id ?? "", name: rawCollege?.name ?? "—" },
  };

  // Verify institution user has access to this application
  if (!isAdmin) {
    if (course.college_id !== profile?.college_id) redirect("/dashboard/institution/applications");
  }

  // Fetch student profile, documents, offer letters + sprint15 data in parallel
  const [
    { data: studentProfile },
    { data: docs, error: docsError },
    { data: offerLetterRows },
    docRequestsRes,
    notesRes,
    ipaRes,
  ] = await Promise.all([
    supabase.from("profiles").select("full_name, email, country").eq("id", app.student_id).single(),
    supabase.from("student_documents").select("*").eq("application_id", id).eq("is_active", true).order("uploaded_at", { ascending: false }),
    supabase
      .from("offer_letters")
      .select(`
        id, application_id, uploaded_by, file_path, file_name,
        file_size, version, notes, expiry_date, created_at, updated_at,
        student_decision, decision_at, decision_comment,
        profiles!offer_letters_uploaded_by_fkey (full_name)
      `)
      .eq("application_id", id)
      .order("version", { ascending: false }),
    supabase.from("document_requests").select("*").eq("application_id", id).order("created_at", { ascending: false }),
    supabase.from("application_notes").select("*").eq("application_id", id).order("created_at", { ascending: false }),
    supabase.from("ipa_records").select("*").eq("application_id", id).order("created_at", { ascending: false }),
  ]);

  if (docsError) console.error("[InstitutionApp] docs fetch error:", docsError.message);

  // Sprint 15 tables may not exist until the migration has been run (42P01) —
  // render the panels empty instead of failing the whole page.
  for (const [label, res] of [["document_requests", docRequestsRes], ["application_notes", notesRes], ["ipa_records", ipaRes]] as const) {
    if (res.error && res.error.code === "42P01") {
      console.warn(`[InstitutionApp] ${label} table missing — run sprint15_application_processing.sql`);
    } else if (res.error) {
      console.error(`[InstitutionApp] ${label} fetch error:`, res.error.message);
    }
  }

  const documentRequests = (docRequestsRes.data ?? []) as DocumentRequest[];
  const ipaRecords       = (ipaRes.data ?? []) as IpaRecord[];

  // Two-query pattern: note author_id references auth.users, so batch-fetch
  // author names from profiles separately.
  const rawNotes   = (notesRes.data ?? []) as ApplicationNote[];
  const authorIds  = Array.from(new Set(rawNotes.map(n => n.author_id).filter(Boolean))) as string[];
  const authorNames = new Map<string, string | null>();
  if (authorIds.length > 0) {
    const { data: authors } = await supabase.from("profiles").select("id, full_name").in("id", authorIds);
    for (const a of authors ?? []) authorNames.set(a.id, a.full_name);
  }
  const applicationNotes: ApplicationNoteWithAuthor[] = rawNotes.map(n => ({
    ...n,
    author_name: n.author_id ? (authorNames.get(n.author_id) ?? null) : null,
  }));

  const documents = (docs ?? []) as StudentDocument[];
  const statusMeta = APPLICATION_STATUSES.find(s => s.value === app.status);

  const offerLetters: OfferLetterWithUploader[] = (offerLetterRows ?? []).map((row: Record<string, unknown>) => {
    const uploaderProfile = row.profiles as { full_name: string | null } | null;
    const { profiles: _p, ...rest } = row;
    return { ...rest, uploader_name: uploaderProfile?.full_name ?? null } as OfferLetterWithUploader;
  });

  // Group: latest doc per type
  const latestByType = new Map<string, StudentDocument>();
  for (const doc of documents) {
    if (!latestByType.has(doc.document_type)) latestByType.set(doc.document_type, doc);
  }

  const totalRequired = DOCUMENT_TYPES.filter(d => d.required).length;
  const uploaded      = DOCUMENT_TYPES.filter(d => d.required && latestByType.has(d.value)).length;

  return (
    <div className="max-w-5xl space-y-6">

      {/* Back */}
      <Link href="/dashboard/institution/applications" className="inline-flex items-center gap-2 text-white/40 hover:text-white/70 font-body text-sm transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Applications
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left — Application info */}
        <div className="space-y-4">

          {/* Status card */}
          <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-5">
            <h3 className="font-display text-xl text-white mb-3">Application</h3>
            <div className="space-y-3">
              <div>
                <p className="text-white/35 font-body text-[10px] uppercase tracking-wider mb-1">Course</p>
                <p className="font-body text-sm text-white/80">{course.title}</p>
                <p className="font-body text-xs text-white/40">{course.colleges.name}</p>
              </div>
              <div>
                <p className="text-white/35 font-body text-[10px] uppercase tracking-wider mb-1">Legacy Status</p>
                <span className={`inline-flex items-center px-2.5 py-1 rounded-full border font-body text-xs font-semibold ${statusMeta?.color ?? ""}`}>
                  {statusMeta?.label ?? app.status}
                </span>
              </div>
              <div>
                <p className="text-white/35 font-body text-[10px] uppercase tracking-wider mb-1">Timeline Stage</p>
                <ApplicationStageBadge stage={resolveStage((app as unknown as { current_stage?: string }).current_stage, app.status)} size="sm" />
              </div>
              <div>
                <p className="text-white/35 font-body text-[10px] uppercase tracking-wider mb-1">Submitted</p>
                <p className="font-body text-xs text-white/55">
                  {new Date(app.submitted_at).toLocaleDateString("en-SG", { day: "numeric", month: "long", year: "numeric" })}
                </p>
              </div>
            </div>
          </div>

          {/* Stage update control */}
          <StageUpdateSelect
            applicationId={id}
            currentStage={resolveStage((app as unknown as { current_stage?: string }).current_stage, app.status)}
          />

          {/* Student info */}
          <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <User className="w-4 h-4 text-pathBlue-400" />
              <h3 className="font-display text-xl text-white">Student</h3>
            </div>
            <div className="space-y-2">
              <p className="font-body font-semibold text-sm text-white/85">{studentProfile?.full_name ?? "Unknown"}</p>
              <p className="font-body text-xs text-white/45">{studentProfile?.email}</p>
              {studentProfile?.country && <p className="font-body text-xs text-white/35">{studentProfile.country}</p>}
            </div>
          </div>

          {/* Document progress */}
          <div className={`p-4 rounded-2xl border ${uploaded === totalRequired ? "bg-emerald-500/[0.06] border-emerald-400/20" : "bg-gold-400/[0.06] border-gold-400/20"}`}>
            <div className="flex items-center justify-between mb-2">
              <p className="font-body text-sm font-semibold text-white/70">Required Documents</p>
              <span className={`font-display text-xl font-bold ${uploaded === totalRequired ? "text-emerald-400" : "text-gold-400"}`}>
                {uploaded}/{totalRequired}
              </span>
            </div>
            <div className="h-1.5 bg-white/[0.07] rounded-full">
              <div
                className={`h-full rounded-full ${uploaded === totalRequired ? "bg-emerald-500" : "bg-gold-500"}`}
                style={{ width: `${Math.round((uploaded / totalRequired) * 100)}%` }}
              />
            </div>
            {documents.length > 0 && (
              <div className="flex gap-3 mt-3 flex-wrap">
                {[
                  { label: "Pending",  count: documents.filter(d => d.status === "pending").length,  color: "text-gold-400" },
                  { label: "Verified", count: documents.filter(d => d.status === "verified").length, color: "text-emerald-400" },
                  { label: "Rejected", count: documents.filter(d => d.status === "rejected").length, color: "text-red-400" },
                ].filter(s => s.count > 0).map(s => (
                  <p key={s.label} className={`font-body text-xs ${s.color}`}>
                    {s.count} {s.label}
                  </p>
                ))}
              </div>
            )}
          </div>

          {/* Offer Letter */}
          <IssueOfferLetterForm
            applicationId={id}
            existingLetters={offerLetters}
          />

          {/* Invoices (Sprint 17) */}
          <Link href={`/dashboard/institution/applications/${id}/invoices`}
            className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.04] border border-white/[0.08] hover:border-gold-400/25 hover:bg-gold-400/[0.03] transition-all group">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gold-400/10 border border-gold-400/20 flex items-center justify-center">
                <Receipt className="w-4 h-4 text-gold-400" />
              </div>
              <div>
                <p className="font-body font-semibold text-sm text-white/85">Invoices &amp; Payments</p>
                <p className="font-body text-xs text-white/40">Issue invoice, track payment proofs</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-white/30 group-hover:text-gold-400 transition-colors" />
          </Link>

          {/* IPA management */}
          <IpaPanel applicationId={id} records={ipaRecords} />
        </div>

        {/* Right — Documents */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="font-display text-xl text-white">Uploaded Documents</h3>

          {latestByType.size === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 bg-white/[0.03] border border-white/[0.07] rounded-2xl">
              <FileText className="w-10 h-10 text-white/20 mb-3" />
              <p className="text-white/35 font-body text-sm">No documents uploaded yet</p>
              <p className="text-white/25 font-body text-xs mt-1">Student will be notified to upload after applying</p>
            </div>
          ) : (
            <div className="space-y-3">
              {DOCUMENT_TYPES.map((docMeta) => {
                const doc = latestByType.get(docMeta.value);
                if (!doc && !docMeta.required) return null; // hide optional if not uploaded
                if (!doc) {
                  // Required but not uploaded
                  return (
                    <div key={docMeta.value} className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
                      <div>
                        <p className="font-body text-sm text-white/50">{docMeta.label}</p>
                        <p className="font-body text-xs text-white/25 mt-0.5">Not uploaded yet</p>
                      </div>
                      <span className="text-white/25 font-body text-xs italic">Awaiting</span>
                    </div>
                  );
                }

                return (
                  <div key={docMeta.value} className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-4">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-white/[0.07] border border-white/[0.10] flex items-center justify-center flex-shrink-0">
                          <FileText className="w-4 h-4 text-white/50" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-body font-semibold text-sm text-white/85">{docMeta.label}</p>
                          <p className="font-body text-xs text-white/40 truncate mt-0.5">{doc.file_name}</p>
                          <div className="flex items-center gap-3 mt-1 flex-wrap">
                            {doc.file_size && <span className="text-white/30 font-body text-[10px]">{fmtFileSize(doc.file_size)}</span>}
                            <span className="text-white/30 font-body text-[10px]">
                              Uploaded {new Date(doc.uploaded_at).toLocaleDateString("en-SG", { day: "numeric", month: "short" })}
                            </span>
                          </div>
                          <div className="mt-2">
                            <DocumentStatusBadge status={doc.status} rejectionReason={doc.rejection_reason} showReason />
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 flex-shrink-0">
                        {/* Download link (generates signed URL server-side — link to API) */}
                        <a
                          href={`/api/documents/${doc.id}/download`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-pathBlue-500/10 border border-pathBlue-500/20 text-pathBlue-400 font-body text-xs font-semibold hover:bg-pathBlue-500/20 transition-all whitespace-nowrap"
                        >
                          <Download className="w-3.5 h-3.5" /> View
                        </a>

                        {/* Review actions */}
                        <DocumentReviewActions
                          documentId={doc.id}
                          currentStatus={doc.status}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Document requests */}
          <DocumentRequestPanel applicationId={id} requests={documentRequests} />

          {/* Internal notes */}
          <ApplicationNotesPanel applicationId={id} notes={applicationNotes} />
        </div>
      </div>
    </div>
  );
}
