"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import DocumentUploadCard from "@/components/documents/DocumentUploadCard";
import { DOCUMENT_TYPES, REQUIRED_DOC_TYPES } from "@/types/documents";
import type { StudentDocument } from "@/types/documents";
import { FileText, BookOpen, ChevronDown, ChevronRight, Loader2, AlertCircle } from "lucide-react";

interface Application {
  id:      string;
  status:  string;
  courses: { id: string; title: string; colleges: { name: string } };
}

export default function StudentDocumentsPage() {
  const [userId,       setUserId]       = useState<string | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [documents,    setDocuments]    = useState<StudentDocument[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState<string | null>(null);
  const [expanded,     setExpanded]     = useState<string | null>(null);

  useEffect(() => {
    (async () => {
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

        console.log("[Documents] loaded apps:", apps?.length ?? 0, "docs:", docs?.length ?? 0);

        // Supabase may return joined relations as arrays — normalise to plain objects
        const normalizedApps: Application[] = ((apps ?? []) as RawApp[]).map((app) => {
          const c   = Array.isArray(app.courses)    ? app.courses[0]    : app.courses;
          const col = Array.isArray(c?.colleges)    ? c.colleges[0]     : c?.colleges;
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
        setApplications(normalizedApps);
        setDocuments((docs ?? []) as StudentDocument[]);

        // Auto-expand the first application
        if (apps?.[0]) setExpanded(apps[0].id);

      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Failed to load documents");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

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
      // Remove any older doc of same type + application, add new one
      const filtered = prev.filter(
        d => !(d.document_type === doc.document_type && d.application_id === doc.application_id)
      );
      return [doc, ...filtered];
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

      {/* Empty state */}
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

      {/* Application accordion */}
      {applications.map((app) => {
        const isOpen       = expanded === app.id;
        const totalTypes   = DOCUMENT_TYPES.length;
        const uploaded     = uploadedCount(app.id);
        const reqUploaded  = requiredUploaded(app.id);
        const reqTotal     = REQUIRED_DOC_TYPES.length;

        return (
          <div key={app.id} className="bg-white/[0.04] border border-white/[0.08] rounded-2xl overflow-hidden">

            {/* Accordion header */}
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
              <div className="flex items-center gap-3 flex-shrink-0">
                {/* Progress pill */}
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

            {/* Document cards */}
            {isOpen && userId && (
              <div className="px-5 pb-5 space-y-3 border-t border-white/[0.07] pt-4">
                <p className="text-white/35 font-body text-xs">
                  {uploaded} of {totalTypes} document types uploaded
                </p>
                {DOCUMENT_TYPES.map((docMeta) => {
                  const appDocs = docsForApp(app.id).filter(d => d.document_type === docMeta.value);
                  const latestDoc = appDocs[0] ?? null; // most recent

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
  );
}
