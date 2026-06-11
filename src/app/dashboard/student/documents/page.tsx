"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import DocumentUploadCard from "@/components/documents/DocumentUploadCard";
import DocumentStatusBadge from "@/components/documents/DocumentStatusBadge";
import { DOCUMENT_TYPES, REQUIRED_DOC_TYPES } from "@/types/documents";
import type { StudentDocument, DocumentReview } from "@/types/documents";
import {
  FileText, BookOpen, ChevronDown, ChevronRight,
  AlertCircle, Clock, MessageSquare,
} from "lucide-react";

interface Application {
  id:      string;
  status:  string;
  courses: { id: string; title: string; colleges: { name: string } };
}

interface DocWithReviews extends StudentDocument {
  reviews: DocumentReview[];
}

export default function StudentDocumentsPage() {
  const [userId,       setUserId]       = useState<string | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [documents,    setDocuments]    = useState<DocWithReviews[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState<string | null>(null);
  const [expanded,     setExpanded]     = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { window.location.href = "/login"; return; }

      setUserId(user.id);

      type RawApp = {
        id:      string;
        status:  string;
        courses: { id: string; title: string; colleges: { name: string } | { name: string }[] | null } |
                 { id: string; title: string; colleges: { name: string } | { name: string }[] | null }[] |
                 null;
      };

      const [{ data: apps }, { data: docs }] = await Promise.all([
        supabase
          .from("applications")
          .select("id, status, courses(id, title, colleges(name))")
          .eq("student_id", user.id)
          .not("status", "eq", "rejected")
          .order("submitted_at", { ascending: false }),
        supabase
          .from("student_documents")
          .select("*")
          .eq("student_id", user.id)
          .order("uploaded_at", { ascending: false }),
      ]);

      const normalizedApps: Application[] = ((apps ?? []) as RawApp[]).map((app) => {
        const c   = Array.isArray(app.courses)  ? app.courses[0]  : app.courses;
        const col = Array.isArray(c?.colleges)  ? c.colleges[0]   : c?.colleges;
        return {
          id:      app.id,
          status:  app.status,
          courses: {
            id:       c?.id      ?? "",
            title:    c?.title   ?? "Unknown course",
            colleges: { name: (col as { name?: string } | null)?.name ?? "Unknown college" },
          },
        };
      });

      const docIds = ((docs ?? []) as { id: string }[]).map(d => d.id);
      let reviewsByDoc = new Map<string, DocumentReview[]>();

      if (docIds.length > 0) {
        const { data: reviewRows } = await supabase
          .from("document_reviews")
          .select("id, document_id, reviewer_id, status, comment, created_at, profiles:reviewer_id(full_name)")
          .in("document_id", docIds)
          .order("created_at", { ascending: false });

        for (const r of (reviewRows ?? [])) {
          const raw     = r as Record<string, unknown>;
          const profile = Array.isArray(raw.profiles) ? raw.profiles[0] : raw.profiles as { full_name: string | null } | null;
          const review: DocumentReview = {
            id:          String(raw.id),
            document_id: String(raw.document_id),
            reviewer_id: raw.reviewer_id as string | null,
            status:      raw.status as DocumentReview["status"],
            comment:     raw.comment as string | null,
            created_at:  String(raw.created_at),
            reviewer:    profile ? { full_name: profile.full_name } : null,
          };
          const bucket = reviewsByDoc.get(review.document_id) ?? [];
          bucket.push(review);
          reviewsByDoc.set(review.document_id, bucket);
        }
      }

      const docsWithReviews: DocWithReviews[] = ((docs ?? []) as StudentDocument[]).map(d => ({
        ...d,
        reviews: reviewsByDoc.get(d.id) ?? [],
      }));

      setApplications(normalizedApps);
      setDocuments(docsWithReviews);
      if (apps?.[0]) setExpanded(apps[0].id);

    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load documents");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const docsForApp = (appId: string) =>
    documents.filter(d => d.application_id === appId);

  const uploadedCount = (appId: string) =>
    new Set(docsForApp(appId).map(d => d.document_type)).size;

  const requiredUploaded = (appId: string) => {
    const types = new Set(docsForApp(appId).map(d => d.document_type));
    return REQUIRED_DOC_TYPES.filter(t => types.has(t)).length;
  };

  const handleUploaded = (doc: StudentDocument) => {
    setDocuments(prev => {
      const filtered = prev.filter(
        d => !(d.document_type === doc.document_type && d.application_id === doc.application_id)
      );
      return [{ ...doc, reviews: [] }, ...filtered];
    });
  };

  if (loading) {
    return (
      <div className="max-w-3xl space-y-4">
        <div className="h-9 w-56 rounded-xl bg-white/[0.06] animate-pulse" />
        {[...Array(3)].map((_, i) => <div key={i} className="h-32 rounded-2xl bg-white/[0.04] animate-pulse border border-white/[0.06]" />)}
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="font-display text-3xl text-white mb-1">My Documents</h2>
          <p className="text-white/45 font-body text-sm">Upload admission documents for each of your course applications</p>
        </div>
        <Link href="/dashboard/student/applications">
          <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.05] border border-white/[0.09] text-white/55 font-body text-sm hover:border-white/20 hover:text-white/80 transition-all">
            <FileText className="w-4 h-4" /> My Applications
          </div>
        </Link>
      </div>

      {error && (
        <div className="flex items-start gap-3 p-4 rounded-2xl bg-red-500/[0.07] border border-red-400/25">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-white/65 font-body text-sm">{error}</p>
        </div>
      )}

      {applications.length === 0 && !error && (
        <div className="flex flex-col items-center justify-center py-20 bg-white/[0.03] border border-white/[0.07] rounded-2xl">
          <BookOpen className="w-12 h-12 text-white/20 mb-4" />
          <p className="font-display text-2xl text-white/40 mb-1">No applications yet</p>
          <p className="text-white/30 font-body text-sm mb-6">Apply to a course first, then upload your documents here</p>
          <Link href="/dashboard/student/courses">
            <div className="px-5 py-3 rounded-xl bg-gold-400/15 border border-gold-400/30 text-gold-400 font-body text-sm font-semibold hover:bg-gold-400/25 transition-all">
              Browse Courses
            </div>
          </Link>
        </div>
      )}

      {applications.map((app) => {
        const isOpen      = expanded === app.id;
        const totalTypes  = DOCUMENT_TYPES.length;
        const uploaded    = uploadedCount(app.id);
        const reqUploaded = requiredUploaded(app.id);
        const reqTotal    = REQUIRED_DOC_TYPES.length;
        const appDocs     = docsForApp(app.id);

        // Attention-required docs (rejected or reupload)
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
                  <p className="font-body font-semibold text-sm text-white/85 truncate">{app.courses?.title}</p>
                  <p className="font-body text-xs text-white/35">{app.courses?.colleges?.name}</p>
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

            {isOpen && userId && (
              <div className="px-5 pb-5 space-y-3 border-t border-white/[0.07] pt-4">
                <p className="text-white/35 font-body text-xs">
                  {uploaded} of {totalTypes} document types uploaded
                </p>
                {DOCUMENT_TYPES.map((docMeta) => {
                  const appDocList = appDocs
                    .filter(d => d.document_type === docMeta.value)
                    .sort((a, b) => new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime());
                  const latestDoc = appDocList[0] ?? null;
                  const reviews   = latestDoc?.reviews ?? [];
                  const latestReview = reviews[0] ?? null;

                  return (
                    <div key={docMeta.value} className="space-y-2">
                      <DocumentUploadCard
                        meta={docMeta}
                        applicationId={app.id}
                        studentId={userId}
                        existing={latestDoc}
                        onUploaded={handleUploaded}
                      />

                      {/* Review feedback panel — shown when there's a reviewer comment */}
                      {latestDoc && latestReview && latestReview.comment && (
                        <div className="ml-2 flex items-start gap-2.5 p-3 rounded-xl bg-white/[0.03] border border-white/[0.07]">
                          <MessageSquare className="w-3.5 h-3.5 text-white/30 mt-0.5 flex-shrink-0" />
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <DocumentStatusBadge status={latestDoc.status} showReason={false} />
                              <span className="font-body text-[11px] text-white/30">
                                {latestReview.reviewer?.full_name ?? "Reviewer"} ·{" "}
                                {new Date(latestReview.created_at).toLocaleDateString("en-GB", {
                                  day: "numeric", month: "short", year: "numeric",
                                })}
                              </span>
                            </div>
                            <p className="font-body text-xs text-white/60 leading-relaxed">
                              {latestReview.comment}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Review history (collapsed by default) */}
                      {latestDoc && reviews.length > 1 && (
                        <ReviewHistoryAccordion reviews={reviews} />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Review history accordion (client-side toggle) ───────────────────────────

function ReviewHistoryAccordion({ reviews }: { reviews: DocumentReview[] }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="ml-2">
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
                <span className="font-body text-[11px] text-white/30">
                  {new Date(r.created_at).toLocaleDateString("en-GB", {
                    day: "numeric", month: "short", year: "numeric",
                  })}
                </span>
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
