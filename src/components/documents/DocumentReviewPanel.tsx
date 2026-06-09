"use client";

import { useState } from "react";
import {
  CheckCircle2, XCircle, RefreshCw, MessageSquare,
  Loader2, Download, User, FileText, Building2, Clock,
} from "lucide-react";
import DocumentStatusBadge from "@/components/documents/DocumentStatusBadge";
import { DOCUMENT_TYPES, DOCUMENT_STATUS_META, fmtFileSize } from "@/types/documents";
import type { DocumentStatus, DocumentReview, StudentDocument } from "@/types/documents";
import { cn } from "@/lib/utils";

interface ReviewPanelDoc extends StudentDocument {
  application?: {
    id:       string;
    courses?: { title: string; colleges?: { name: string } | null } | null;
  } | null;
  student?: {
    full_name: string | null;
    email:     string;
  } | null;
  reviews?: DocumentReview[];
}

interface DocumentReviewPanelProps {
  doc:           ReviewPanelDoc;
  onReviewed?:   (docId: string, newStatus: DocumentStatus, comment: string | null) => void;
}

const ACTION_META = {
  verified:          { label: "Approve",          icon: CheckCircle2, variant: "emerald" as const },
  rejected:          { label: "Reject",           icon: XCircle,      variant: "red"     as const },
  reupload_required: { label: "Request Re-upload",icon: RefreshCw,    variant: "orange"  as const },
};

type ActionKey = keyof typeof ACTION_META;

const VARIANT_CLASSES: Record<"emerald" | "red" | "orange", string> = {
  emerald: "bg-emerald-500/10 border-emerald-400/25 text-emerald-400 hover:bg-emerald-500/20",
  red:     "bg-red-500/10     border-red-400/25     text-red-400     hover:bg-red-500/20",
  orange:  "bg-orange-500/10  border-orange-400/25  text-orange-400  hover:bg-orange-500/20",
};

export default function DocumentReviewPanel({ doc, onReviewed }: DocumentReviewPanelProps) {
  const [status,        setStatus]        = useState<DocumentStatus>(doc.status);
  const [activeAction,  setActiveAction]  = useState<ActionKey | null>(null);
  const [comment,       setComment]       = useState("");
  const [loading,       setLoading]       = useState(false);
  const [error,         setError]         = useState<string | null>(null);
  const [showHistory,   setShowHistory]   = useState(false);

  const docMeta    = DOCUMENT_TYPES.find(d => d.value === doc.document_type);
  const course     = doc.application?.courses;
  const college    = course?.colleges;
  const rawCourse  = Array.isArray(course) ? course[0] : course;
  const rawCollege = Array.isArray(college) ? college[0] : college;

  const handleDownload = async () => {
    const res  = await fetch(`/api/documents/${doc.id}/download`);
    const json = await res.json() as { url?: string; error?: string };
    if (json.url) window.open(json.url, "_blank", "noopener,noreferrer");
    else alert(json.error ?? "Could not generate download link");
  };

  const submitAction = async (action: ActionKey) => {
    if (loading) return;
    setLoading(true);
    setError(null);
    try {
      const res  = await fetch(`/api/documents/${doc.id}/review`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ action, comment: comment.trim() || null }),
      });
      const json = await res.json() as { error?: string; status?: DocumentStatus };
      if (!res.ok) { setError(json.error ?? `Server error (${res.status})`); return; }
      setStatus(json.status ?? action);
      setActiveAction(null);
      setComment("");
      onReviewed?.(doc.id, json.status ?? action, comment.trim() || null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white/[0.04] border border-white/[0.09] rounded-2xl overflow-hidden">

      {/* Header — doc type + current status */}
      <div className="px-5 py-4 border-b border-white/[0.07] flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-pathBlue-500/15 border border-pathBlue-500/20 flex items-center justify-center flex-shrink-0">
            <FileText className="w-4 h-4 text-pathBlue-400" />
          </div>
          <div className="min-w-0">
            <p className="font-body font-semibold text-sm text-white/90 truncate">
              {docMeta?.label ?? doc.document_type}
            </p>
            <p className="font-body text-xs text-white/35 truncate">{doc.file_name}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <DocumentStatusBadge status={status} />
          <button
            type="button"
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.06] border border-white/[0.10] text-white/60 font-body text-xs hover:text-white/90 hover:border-white/20 transition-all"
          >
            <Download className="w-3.5 h-3.5" /> Download
          </button>
        </div>
      </div>

      {/* Metadata row */}
      <div className="px-5 py-3 border-b border-white/[0.06] flex flex-wrap gap-x-6 gap-y-2">
        {doc.student && (
          <div className="flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-white/30" />
            <span className="font-body text-xs text-white/55">
              {doc.student.full_name ?? "—"} · {doc.student.email}
            </span>
          </div>
        )}
        {rawCourse && (
          <div className="flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-white/30" />
            <span className="font-body text-xs text-white/55">
              {(rawCourse as { title?: string }).title} {rawCollege ? `· ${(rawCollege as { name?: string }).name}` : ""}
            </span>
          </div>
        )}
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-white/30" />
          <span className="font-body text-xs text-white/55">
            Uploaded {new Date(doc.uploaded_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
          </span>
        </div>
        {doc.file_size && (
          <span className="font-body text-xs text-white/35">{fmtFileSize(doc.file_size)}</span>
        )}
      </div>

      {/* Review actions */}
      <div className="px-5 py-4 space-y-3">
        <div className="flex flex-wrap gap-2">
          {(Object.entries(ACTION_META) as [ActionKey, typeof ACTION_META[ActionKey]][]).map(([key, meta]) => {
            const Icon    = meta.icon;
            const active  = activeAction === key;
            const done    = status === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setActiveAction(active ? null : key)}
                disabled={loading || done}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-body text-xs font-semibold transition-all disabled:opacity-50",
                  VARIANT_CLASSES[meta.variant],
                  active && "ring-1 ring-offset-0 ring-current/40",
                )}
              >
                {loading && activeAction === key
                  ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  : <Icon className="w-3.5 h-3.5" />
                }
                {done ? `${meta.label}d` : meta.label}
              </button>
            );
          })}
        </div>

        {/* Comment + confirm row */}
        {activeAction && (
          <div className="space-y-2 pt-1">
            <div className="flex gap-2 items-start">
              <div className="relative flex-1">
                <MessageSquare className="w-3.5 h-3.5 text-white/30 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  placeholder={
                    activeAction === "rejected"          ? "Reason for rejection…" :
                    activeAction === "reupload_required" ? "What should be corrected…" :
                    "Optional comment…"
                  }
                  className="w-full bg-white/[0.06] border border-white/[0.12] rounded-xl pl-9 pr-3 py-2.5 font-body text-xs text-white placeholder-white/25 focus:outline-none focus:border-white/25 transition-all"
                />
              </div>
              <button
                type="button"
                onClick={() => submitAction(activeAction)}
                disabled={loading || (activeAction === "rejected" && !comment.trim())}
                className={cn(
                  "px-4 py-2.5 rounded-xl border font-body text-xs font-semibold transition-all disabled:opacity-50 whitespace-nowrap",
                  VARIANT_CLASSES[ACTION_META[activeAction].variant],
                )}
              >
                {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Confirm"}
              </button>
            </div>
            {activeAction === "rejected" && (
              <p className="text-white/30 font-body text-[11px] pl-1">A reason is required when rejecting a document.</p>
            )}
          </div>
        )}

        {error && <p className="text-red-400 font-body text-xs">{error}</p>}
      </div>

      {/* Review history */}
      {(doc.reviews?.length ?? 0) > 0 && (
        <div className="border-t border-white/[0.06]">
          <button
            type="button"
            onClick={() => setShowHistory(v => !v)}
            className="w-full px-5 py-3 text-left font-body text-xs text-white/40 hover:text-white/60 transition-colors flex items-center gap-2"
          >
            <Clock className="w-3.5 h-3.5" />
            Review history ({doc.reviews!.length} event{doc.reviews!.length !== 1 ? "s" : ""})
            <span className="ml-auto">{showHistory ? "▲" : "▼"}</span>
          </button>
          {showHistory && (
            <div className="px-5 pb-4 space-y-2">
              {doc.reviews!.map(r => {
                const meta = DOCUMENT_STATUS_META[r.status];
                return (
                  <div key={r.id} className="flex items-start gap-3 py-2.5 border-t border-white/[0.05]">
                    <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full border font-body text-[11px] font-semibold flex-shrink-0", meta.color)}>
                      {meta.label}
                    </span>
                    <div className="min-w-0 flex-1">
                      {r.comment && (
                        <p className="font-body text-xs text-white/65 leading-relaxed mb-0.5">{r.comment}</p>
                      )}
                      <p className="font-body text-[11px] text-white/30">
                        {r.reviewer?.full_name ?? "Reviewer"} ·{" "}
                        {new Date(r.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
