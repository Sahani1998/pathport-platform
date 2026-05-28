"use client";

import { useState } from "react";
import { CheckCircle2, XCircle, Loader2, ChevronDown } from "lucide-react";
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
  const [status,         setStatus]         = useState<DocumentStatus>(currentStatus);
  const [loading,        setLoading]        = useState(false);
  const [error,          setError]          = useState<string | null>(null);
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectReason,   setRejectReason]   = useState("");

  const update = async (newStatus: DocumentStatus, reason?: string) => {
    setLoading(true);
    setError(null);
    try {
      console.log("[DocumentReview] updating", documentId, "→", newStatus);
      const res = await fetch(`/api/documents/${documentId}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ status: newStatus, rejection_reason: reason ?? null }),
      });
      const json = await res.json() as { error?: string };
      if (!res.ok) {
        setError(json.error ?? `Server error (${res.status})`);
        return;
      }
      setStatus(newStatus);
      setShowRejectForm(false);
      setRejectReason("");
      onUpdated?.(newStatus, reason);
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
          onClick={() => update("pending")}
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
      <div className="flex items-center gap-2">
        {/* Verify */}
        <button
          type="button"
          onClick={() => update("verified")}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-400/25 text-emerald-400 font-body text-xs font-semibold hover:bg-emerald-500/20 transition-all disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
          Verify
        </button>

        {/* Reject toggle */}
        <button
          type="button"
          onClick={() => setShowRejectForm(v => !v)}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/10 border border-red-400/25 text-red-400 font-body text-xs font-semibold hover:bg-red-500/20 transition-all disabled:opacity-50"
        >
          <XCircle className="w-3.5 h-3.5" />
          Reject
          <ChevronDown className={`w-3 h-3 transition-transform ${showRejectForm ? "rotate-180" : ""}`} />
        </button>
      </div>

      {showRejectForm && (
        <div className="flex gap-2 items-start">
          <input
            type="text"
            value={rejectReason}
            onChange={e => setRejectReason(e.target.value)}
            placeholder="Reason for rejection…"
            className="flex-1 bg-white/[0.06] border border-red-400/25 rounded-xl px-3 py-2 font-body text-xs text-white placeholder-white/25 focus:outline-none focus:border-red-400/50 transition-all"
          />
          <button
            type="button"
            onClick={() => update("rejected", rejectReason.trim() || "Document not accepted.")}
            disabled={loading}
            className="px-3 py-2 rounded-xl bg-red-500/15 border border-red-400/30 text-red-400 font-body text-xs font-semibold hover:bg-red-500/25 transition-all disabled:opacity-50 whitespace-nowrap"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Confirm"}
          </button>
        </div>
      )}

      {error && <p className="text-red-400 font-body text-xs">{error}</p>}
    </div>
  );
}
