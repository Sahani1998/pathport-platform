"use client";

import { useState } from "react";
import Link from "next/link";
import DocumentUploadCard from "@/components/documents/DocumentUploadCard";
import DocumentStatusBadge from "@/components/documents/DocumentStatusBadge";
import { DOCUMENT_TYPES, REQUIRED_DOC_TYPES, fmtFileSize } from "@/types/documents";
import type { StudentDocument, DocumentReview } from "@/types/documents";
import { PRIORITY_META } from "@/types/application-processing";
import type { DocumentRequest } from "@/types/application-processing";
import {
  FileText, BookOpen, ChevronDown, ChevronRight, AlertCircle,
  Clock, MessageSquare, Download, Award, Building2, FilePlus2, CalendarDays,
} from "lucide-react";

// ─── Props (data fetched server-side in page.tsx) ─────────────────────────────

export interface AppRow {
  id:          string;
  status:      string;
  courseTitle: string;
  collegeName: string;
}

export interface DocWithReviews extends StudentDocument {
  reviews: DocumentReview[];
}

export interface CollegeDocRow {
  id:            string;
  title:         string;
  file_name:     string;
  file_size:     number | null;
  document_type: string;
  created_at:    string;
  courseTitle:   string | null;
}

export interface OfferLetterRow {
  id:          string;
  file_name:   string;
  version:     number;
  expiry_date: string | null;
  created_at:  string;
  courseTitle: string | null;
}

interface DocumentsClientProps {
  userId:          string;
  applications:    AppRow[];
  documents:       DocWithReviews[];
  collegeDocs:     CollegeDocRow[];
  offerLetters:    OfferLetterRow[];
  pendingRequests: DocumentRequest[];
  queryErrors:     string[];
}

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

function SectionHeader({ icon: Icon, title, count, subtitle }: {
  icon: typeof FileText; title: string; count?: number; subtitle: string;
}) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="w-9 h-9 rounded-xl bg-gold-400/[0.08] border border-gold-400/20 flex items-center justify-center flex-shrink-0">
        <Icon className="w-4 h-4 text-gold-400" />
      </div>
      <div>
        <h3 className="font-display text-xl text-white leading-tight">
          {title}{typeof count === "number" && <span className="text-white/30 text-base ml-2">({count})</span>}
        </h3>
        <p className="text-white/35 font-body text-xs">{subtitle}</p>
      </div>
    </div>
  );
}

export default function DocumentsClient({
  userId, applications, documents, collegeDocs, offerLetters, pendingRequests, queryErrors,
}: DocumentsClientProps) {
  const [docs,     setDocs]     = useState<DocWithReviews[]>(documents);
  const [expanded, setExpanded] = useState<string | null>(applications[0]?.id ?? null);

  const docsForApp = (appId: string) => docs.filter(d => d.application_id === appId);

  const requiredUploaded = (appId: string) => {
    const types = new Set(docsForApp(appId).map(d => d.document_type));
    return REQUIRED_DOC_TYPES.filter(t => types.has(t)).length;
  };

  const handleUploaded = (doc: StudentDocument) => {
    setDocs(prev => {
      const filtered = prev.filter(
        d => !(d.document_type === doc.document_type && d.application_id === doc.application_id)
      );
      return [{ ...doc, reviews: [] }, ...filtered];
    });
  };

  // Documents that have been reviewed (verified / rejected / reupload)
  const reviewedDocs = docs.filter(d => d.status !== "pending");

  return (
    <div className="max-w-3xl space-y-10">

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="font-display text-3xl text-white mb-1">My Documents</h2>
          <p className="text-white/45 font-body text-sm">Uploads, review results, college documents and offer letters</p>
        </div>
        <Link href="/dashboard/student/applications">
          <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.05] border border-white/[0.09] text-white/55 font-body text-sm hover:border-white/20 hover:text-white/80 transition-all">
            <FileText className="w-4 h-4" /> My Applications
          </div>
        </Link>
      </div>

      {/* Visible error cards — one per failed query */}
      {queryErrors.map((msg, i) => (
        <div key={i} className="flex items-start gap-3 p-4 rounded-2xl bg-red-500/[0.07] border border-red-400/25">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-white/65 font-body text-sm">{msg}</p>
        </div>
      ))}

      {/* ── Pending document requests ──────────────────────────────────────── */}
      {pendingRequests.length > 0 && (
        <section>
          <SectionHeader
            icon={FilePlus2}
            title="Requested Documents"
            count={pendingRequests.length}
            subtitle="Your institution has asked for these documents — upload them below to fulfil the request"
          />
          <div className="space-y-3">
            {pendingRequests.map((req) => {
              const meta        = DOCUMENT_TYPES.find(t => t.value === req.document_type);
              const courseTitle = applications.find(a => a.id === req.application_id)?.courseTitle;
              const overdue     = req.deadline ? new Date(req.deadline) < new Date() : false;
              return (
                <div key={req.id} className={`p-4 rounded-2xl border ${
                  overdue ? "bg-red-500/[0.05] border-red-400/20" : "bg-orange-500/[0.05] border-orange-400/20"
                }`}>
                  <div className="flex items-center justify-between gap-3 flex-wrap mb-1">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <AlertCircle className={`w-4 h-4 flex-shrink-0 ${overdue ? "text-red-400" : "text-orange-400"}`} />
                      <p className="font-body font-semibold text-sm text-white/85 truncate">{req.title}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full border font-body text-[10px] font-semibold ${PRIORITY_META[req.priority].color}`}>
                      {PRIORITY_META[req.priority].label}
                    </span>
                  </div>
                  <p className="font-body text-xs text-white/45">
                    {meta?.label ?? req.document_type}
                    {courseTitle && <> · {courseTitle}</>}
                    {req.description && <> — {req.description}</>}
                  </p>
                  {req.deadline && (
                    <p className={`mt-1.5 inline-flex items-center gap-1 font-body text-xs ${overdue ? "text-red-400" : "text-orange-400/80"}`}>
                      <CalendarDays className="w-3 h-3" />
                      {overdue ? "Overdue — was due" : "Due"} {fmtDate(req.deadline)}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ── A. My Uploaded Documents ───────────────────────────────────────── */}
      <section>
        <SectionHeader
          icon={FileText}
          title="My Uploaded Documents"
          subtitle="Upload admission documents for each of your course applications"
        />

        {applications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 bg-white/[0.03] border border-white/[0.07] rounded-2xl">
            <BookOpen className="w-12 h-12 text-white/20 mb-4" />
            <p className="font-display text-2xl text-white/40 mb-1">No applications yet</p>
            <p className="text-white/30 font-body text-sm mb-6">Apply to a course first, then upload your documents here</p>
            <Link href="/dashboard/student/courses">
              <div className="px-5 py-3 rounded-xl bg-gold-400/15 border border-gold-400/30 text-gold-400 font-body text-sm font-semibold hover:bg-gold-400/25 transition-all">
                Browse Courses
              </div>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {applications.map((app) => {
              const isOpen      = expanded === app.id;
              const appDocs     = docsForApp(app.id);
              const reqUploaded = requiredUploaded(app.id);
              const reqTotal    = REQUIRED_DOC_TYPES.length;
              const needsAction = appDocs.filter(d =>
                d.status === "rejected" || d.status === "reupload_required"
              ).length;

              return (
                <div key={app.id} className="bg-white/[0.04] border border-white/[0.08] rounded-2xl overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setExpanded(isOpen ? null : app.id)}
                    className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/[0.03] transition-colors text-left"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-pathBlue-500/15 border border-pathBlue-500/20 flex items-center justify-center flex-shrink-0">
                        <FileText className="w-4 h-4 text-pathBlue-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-body font-semibold text-sm text-white/85 truncate">{app.courseTitle}</p>
                        <p className="font-body text-xs text-white/35">{app.collegeName}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {needsAction > 0 && (
                        <span className="px-2.5 py-1 rounded-full bg-orange-500/10 border border-orange-400/25 text-orange-400 font-body text-xs font-semibold">
                          {needsAction} action{needsAction !== 1 ? "s" : ""}
                        </span>
                      )}
                      <div className={`px-3 py-1 rounded-full border font-body text-xs font-semibold ${
                        reqUploaded === reqTotal
                          ? "bg-emerald-500/10 border-emerald-400/25 text-emerald-400"
                          : "bg-gold-400/10 border-gold-400/25 text-gold-400"
                      }`}>
                        {reqUploaded}/{reqTotal} required
                      </div>
                      {isOpen ? <ChevronDown className="w-4 h-4 text-white/35" /> : <ChevronRight className="w-4 h-4 text-white/35" />}
                    </div>
                  </button>

                  {isOpen && (
                    <div className="px-5 pb-5 space-y-3 border-t border-white/[0.07] pt-4">
                      {DOCUMENT_TYPES.map((docMeta) => {
                        const appDocList = appDocs
                          .filter(d => d.document_type === docMeta.value)
                          .sort((a, b) => new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime());
                        const latestDoc = appDocList[0] ?? null;

                        return (
                          <DocumentUploadCard
                            key={docMeta.value}
                            meta={docMeta}
                            applicationId={app.id}
                            studentId={userId}
                            existing={latestDoc}
                            onUploaded={handleUploaded}
                          />
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ── B. Review Results ──────────────────────────────────────────────── */}
      <section>
        <SectionHeader
          icon={MessageSquare}
          title="Review Results"
          count={reviewedDocs.length}
          subtitle="Verified, rejected and re-upload requested documents with reviewer comments"
        />

        {reviewedDocs.length === 0 ? (
          <div className="py-10 text-center bg-white/[0.03] border border-white/[0.07] rounded-2xl">
            <p className="text-white/30 font-body text-sm">No documents have been reviewed yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {reviewedDocs.map((doc) => {
              const meta         = DOCUMENT_TYPES.find(t => t.value === doc.document_type);
              const latestReview = doc.reviews[0] ?? null;
              return (
                <div key={doc.id} className="p-4 rounded-2xl bg-white/[0.04] border border-white/[0.08]">
                  <div className="flex items-center justify-between gap-3 flex-wrap mb-1.5">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <FileText className="w-4 h-4 text-white/30 flex-shrink-0" />
                      <p className="font-body font-semibold text-sm text-white/85 truncate">
                        {meta?.label ?? doc.document_type}
                      </p>
                      <span className="font-body text-xs text-white/30 truncate">{doc.file_name}</span>
                    </div>
                    <DocumentStatusBadge status={doc.status} showReason={false} />
                  </div>

                  {(latestReview?.comment || doc.rejection_reason) && (
                    <div className="mt-2 flex items-start gap-2.5 p-3 rounded-xl bg-white/[0.03] border border-white/[0.07]">
                      <MessageSquare className="w-3.5 h-3.5 text-white/30 mt-0.5 flex-shrink-0" />
                      <div className="min-w-0">
                        <span className="font-body text-[11px] text-white/30 block mb-0.5">
                          {latestReview?.reviewer?.full_name ?? "Reviewer"}
                          {latestReview && <> · {fmtDate(latestReview.created_at)}</>}
                        </span>
                        <p className="font-body text-xs text-white/60 leading-relaxed">
                          {latestReview?.comment ?? doc.rejection_reason}
                        </p>
                      </div>
                    </div>
                  )}

                  {doc.reviews.length > 1 && <ReviewHistoryAccordion reviews={doc.reviews} />}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ── C. College Documents ───────────────────────────────────────────── */}
      <section>
        <SectionHeader
          icon={Building2}
          title="College Documents"
          count={collegeDocs.length}
          subtitle="Documents your institution has shared with you — click to download"
        />

        {collegeDocs.length === 0 ? (
          <div className="py-10 text-center bg-white/[0.03] border border-white/[0.07] rounded-2xl">
            <p className="text-white/30 font-body text-sm">Your institution hasn&apos;t shared any documents yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {collegeDocs.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between gap-3 p-4 rounded-2xl bg-white/[0.04] border border-white/[0.08]">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-pathBlue-500/15 border border-pathBlue-500/20 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-4 h-4 text-pathBlue-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-body font-semibold text-sm text-white/85 truncate">{doc.title}</p>
                    <p className="font-body text-xs text-white/35 truncate">
                      {doc.file_name} · {fmtFileSize(doc.file_size)} · {fmtDate(doc.created_at)}
                      {doc.courseTitle && <> · {doc.courseTitle}</>}
                    </p>
                  </div>
                </div>
                <a
                  href={`/api/student-downloadable-documents/${doc.id}/download`}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gold-400/15 border border-gold-400/30 text-gold-400 font-body text-xs font-semibold hover:bg-gold-400/25 transition-all flex-shrink-0"
                >
                  <Download className="w-3.5 h-3.5" /> Download
                </a>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── D. Offer Letters ───────────────────────────────────────────────── */}
      <section>
        <SectionHeader
          icon={Award}
          title="Offer Letters"
          count={offerLetters.length}
          subtitle="Offer letters issued by your institution"
        />

        {offerLetters.length === 0 ? (
          <div className="py-10 text-center bg-white/[0.03] border border-white/[0.07] rounded-2xl">
            <p className="text-white/30 font-body text-sm">No offer letters yet. We&apos;ll notify you the moment one is issued.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {offerLetters.map((letter) => (
              <div key={letter.id} className="flex items-center justify-between gap-3 p-4 rounded-2xl bg-white/[0.04] border border-white/[0.08]">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-400/20 flex items-center justify-center flex-shrink-0">
                    <Award className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-body font-semibold text-sm text-white/85 truncate">
                      {letter.courseTitle ?? "Offer Letter"}{letter.version > 1 && <span className="text-white/35"> · v{letter.version}</span>}
                    </p>
                    <p className="font-body text-xs text-white/35 truncate">
                      {letter.file_name} · Issued {fmtDate(letter.created_at)}
                      {letter.expiry_date && <> · Valid until {fmtDate(letter.expiry_date)}</>}
                    </p>
                  </div>
                </div>
                <a
                  href={`/api/offer-letters/${letter.id}/download`}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/15 border border-emerald-400/30 text-emerald-400 font-body text-xs font-semibold hover:bg-emerald-500/25 transition-all flex-shrink-0"
                >
                  <Download className="w-3.5 h-3.5" /> Download
                </a>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

// ─── Review history accordion ─────────────────────────────────────────────────

function ReviewHistoryAccordion({ reviews }: { reviews: DocumentReview[] }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-1.5 text-white/30 hover:text-white/50 font-body text-[11px] transition-colors"
      >
        <Clock className="w-3 h-3" />
        {open ? "Hide" : "Show"} review history ({reviews.length} events)
      </button>
      {open && (
        <div className="mt-2 space-y-2 pl-2 border-l border-white/[0.07]">
          {reviews.map(r => (
            <div key={r.id} className="py-1.5">
              <div className="flex items-center gap-2 mb-0.5">
                <DocumentStatusBadge status={r.status} showReason={false} />
                <span className="font-body text-[11px] text-white/30">{fmtDate(r.created_at)}</span>
              </div>
              {r.comment && (
                <p className="font-body text-xs text-white/50 leading-relaxed">{r.comment}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
