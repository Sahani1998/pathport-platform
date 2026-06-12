"use client";

import { useState } from "react";
import { CheckCircle2, XCircle, Loader2, ChevronDown, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import type { DocumentStatus } from "@/types/documents";

interface DocumentReviewActionsProps {
  documentId:    string;
  currentStatus: DocumentStatus;
  onUpdated?:    (newStatus: DocumentStatus, reason?: string) => void;
}

export default function DocumentReviewActions({
  documentId,
  currentStatus,
  onUpdated,
}: DocumentReviewActionsProps) {
  const router = useRouter();
  const [status,      setStatus]      = useState<DocumentStatus>(currentStatus);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState<string | null>(null);
  const [commentMode, setCommentMode] = useState<"rejected" | "reupload_required" | null>(null);
  const [comment,     setComment]     = useState("");

  // Reviews go through /review so every decision records the full side-effect
  // chain: document_reviews history, notification, timeline event, audit log, email.
  const review = async (action: "verified" | "rejected" | "reupload_required", reviewComment?: string) => {
    setLoading(true);
    setError(null);
    try {
      const res  = await fetch(`/api/documents/${documentId}/review`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ action, comment: reviewComment ?? null }),
      });
      const json = await res.json() as { error?: string };
      if (!res.ok) {
        setError(json.error ?? `Server error (${res.status})`);
        return;
      }
      setStatus(action);
      setCommentMode(null);
      setComment("");
      onUpdated?.(action, reviewComment);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Network error");
    } finally {
      setLoading(false);
    }
  };

  // Undo resets the document back to pending via /review — audited like any
  // other decision, but skips student-facing notification/timeline/email.
  const undo = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/documents/${documentId}/review`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ action: "pending", comment: null }),
      });
      const json = await res.json() as { error?: string };
      if (!res.ok) {
        setError(json.error ?? `Server error (${res.status})`);
        return;
      }
      setStatus("pending");
      onUpdated?.("pending");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Network error");
    } finally {
      setLoading(false);
    }
  };

  if (status === "verified") {
    return (
      <div className="flex items-center gap-2">
        <span className="text-emerald-400 font-body text-xs font-semibold flex items-center gap-1">
          <CheckCircle2 className="w-3.5 h-3.5" /> Verified
        </span>
        <button
          onClick={undo}
          disabled={loading}
          className="text-white/30 hover:text-white/60 font-body text-[10px] underline underline-offset-2 transition-colors"
        >
          Undo
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 flex-wrap">
        {/* Verify */}
        <button
          type="button"
          onClick={() => review("verified")}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-400/25 text-emerald-400 font-body text-xs font-semibold hover:bg-emerald-500/20 transition-all disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
          Verify
        </button>

        {/* Reject toggle */}
        <button
          type="button"
          onClick={() => setCommentMode(m => (m === "rejected" ? null : "rejected"))}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/10 border border-red-400/25 text-red-400 font-body text-xs font-semibold hover:bg-red-500/20 transition-all disabled:opacity-50"
        >
          <XCircle className="w-3.5 h-3.5" />
          Reject
          <ChevronDown className={`w-3 h-3 transition-transform ${commentMode === "rejected" ? "rotate-180" : ""}`} />
        </button>

        {/* Re-upload toggle */}
        <button
          type="button"
          onClick={() => setCommentMode(m => (m === "reupload_required" ? null : "reupload_required"))}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gold-400/10 border border-gold-400/25 text-gold-400 font-body text-xs font-semibold hover:bg-gold-400/20 transition-all disabled:opacity-50"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Re-upload
          <ChevronDown className={`w-3 h-3 transition-transform ${commentMode === "reupload_required" ? "rotate-180" : ""}`} />
        </button>
      </div>

      {commentMode && (
        <div className="flex gap-2 items-start">
          <input
            type="text"
            value={comment}
            onChange={e => setComment(e.target.value)}
            placeholder={commentMode === "rejected" ? "Reason for rejection (required)…" : "What needs to change (required)…"}
            className={`flex-1 bg-white/[0.06] border rounded-xl px-3 py-2 font-body text-xs text-white placeholder-white/25 focus:outline-none transition-all ${
              commentMode === "rejected"
                ? "border-red-400/25 focus:border-red-400/50"
                : "border-gold-400/25 focus:border-gold-400/50"
            }`}
          />
          <button
            type="button"
            onClick={() => review(commentMode, comment.trim())}
            disabled={loading || !comment.trim()}
            className={`px-3 py-2 rounded-xl border font-body text-xs font-semibold transition-all disabled:opacity-50 whitespace-nowrap ${
              commentMode === "rejected"
                ? "bg-red-500/15 border-red-400/30 text-red-400 hover:bg-red-500/25"
                : "bg-gold-400/15 border-gold-400/30 text-gold-400 hover:bg-gold-400/25"
            }`}
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Confirm"}
          </button>
        </div>
      )}

      {error && <p className="text-red-400 font-body text-xs">{error}</p>}
    </div>
  );
}
