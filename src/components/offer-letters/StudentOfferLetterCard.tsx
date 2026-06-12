"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Download, FileCheck2, CalendarDays, Clock, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import type { OfferLetter } from "@/types/offer-letters";

interface Props {
  letters: OfferLetter[];
}

function fmtDate(s: string) {
  return new Date(s).toLocaleDateString("en-SG", { day: "numeric", month: "short", year: "numeric" });
}

function isExpired(d: string | null): boolean {
  if (!d) return false;
  return new Date(d) < new Date();
}

export default function StudentOfferLetterCard({ letters }: Props) {
  const router = useRouter();
  const [submitting,      setSubmitting]      = useState<"accepted" | "declined" | null>(null);
  const [showDeclineForm, setShowDeclineForm] = useState(false);
  const [declineComment,  setDeclineComment]  = useState("");
  const [error,           setError]           = useState<string | null>(null);

  if (letters.length === 0) return null;

  const latest   = letters[0];
  const expired  = isExpired(latest.expiry_date);
  const decision = latest.student_decision;

  const decide = async (choice: "accepted" | "declined", comment?: string) => {
    setError(null);
    setSubmitting(choice);
    try {
      const res = await fetch(`/api/offer-letters/${latest.id}/decision`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ decision: choice, comment: comment ?? null }),
      });
      const json = await res.json() as { error?: string };
      if (!res.ok) { setError(json.error ?? `Server error (${res.status})`); return; }
      setShowDeclineForm(false);
      setDeclineComment("");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Network error");
    } finally {
      setSubmitting(null);
    }
  };

  return (
    <div className={`p-4 rounded-2xl border space-y-3 ${
      decision === "accepted"
        ? "bg-emerald-500/[0.05] border-emerald-400/20"
        : decision === "declined"
          ? "bg-white/[0.03] border-white/[0.09]"
          : expired
            ? "bg-red-500/[0.05] border-red-400/15"
            : "bg-gold-400/[0.06] border-gold-400/20"
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <FileCheck2 className={`w-4 h-4 ${
            decision === "accepted" ? "text-emerald-400" : expired ? "text-red-400" : "text-gold-400"
          }`} />
          <p className={`font-body text-sm font-semibold ${
            decision === "accepted" ? "text-emerald-400" : expired ? "text-red-400/80" : "text-gold-400"
          }`}>
            {decision === "accepted" ? "Offer Accepted" : decision === "declined" ? "Offer Declined" : "Offer Letter Ready"}
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          {decision === "accepted" && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-400/25 text-emerald-400 font-body text-[10px] font-semibold">
              <CheckCircle2 className="w-2.5 h-2.5" /> Accepted {latest.decision_at ? fmtDate(latest.decision_at) : ""}
            </span>
          )}
          {decision === "declined" && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/[0.05] border border-white/[0.12] text-white/45 font-body text-[10px] font-semibold">
              <XCircle className="w-2.5 h-2.5" /> Declined {latest.decision_at ? fmtDate(latest.decision_at) : ""}
            </span>
          )}
          {!decision && expired && (
            <span className="px-2 py-0.5 rounded-full bg-red-500/10 border border-red-400/20 text-red-400 font-body text-[10px] font-semibold">
              Expired
            </span>
          )}
        </div>
      </div>

      {/* Latest version details */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-2">
        <div>
          <p className="text-white/30 font-body text-[9px] uppercase tracking-wider mb-0.5">Issued</p>
          <p className="text-white/60 font-body text-xs">{fmtDate(latest.created_at)}</p>
        </div>
        <div>
          <p className="text-white/30 font-body text-[9px] uppercase tracking-wider mb-0.5">Version</p>
          <p className="text-white/60 font-body text-xs">v{latest.version}</p>
        </div>
        {latest.expiry_date && (
          <div className="col-span-2 flex items-center gap-1.5">
            <CalendarDays className={`w-3 h-3 ${expired ? "text-red-400/60" : "text-amber-400/60"}`} />
            <p className={`font-body text-xs ${expired ? "text-red-400/70" : "text-amber-400/70"}`}>
              {expired ? "Expired" : "Expires"} {fmtDate(latest.expiry_date)}
            </p>
          </div>
        )}
      </div>

      {/* Download latest */}
      <a
        href={`/api/offer-letters/${latest.id}/download`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl bg-gold-400/15 border border-gold-400/30 text-gold-400 font-body text-sm font-semibold hover:bg-gold-400/25 transition-all"
      >
        <Download className="w-4 h-4" /> Download Offer Letter
      </a>

      {/* Accept / Decline — only while undecided and not expired */}
      {!decision && !expired && (
        <div className="space-y-2">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => decide("accepted")}
              disabled={submitting !== null}
              className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-500/15 border border-emerald-400/30 text-emerald-400 font-body text-sm font-semibold hover:bg-emerald-500/25 transition-all disabled:opacity-50"
            >
              {submitting === "accepted" ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              Accept Offer
            </button>
            <button
              type="button"
              onClick={() => setShowDeclineForm(v => !v)}
              disabled={submitting !== null}
              className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/[0.05] border border-white/[0.10] text-white/50 font-body text-sm font-semibold hover:border-red-400/30 hover:text-red-400 transition-all disabled:opacity-50"
            >
              <XCircle className="w-4 h-4" /> Decline
            </button>
          </div>

          {showDeclineForm && (
            <div className="flex gap-2 items-start">
              <input
                type="text"
                value={declineComment}
                onChange={e => setDeclineComment(e.target.value)}
                placeholder="Why are you declining? (required)"
                className="flex-1 bg-white/[0.06] border border-red-400/25 rounded-xl px-3 py-2 font-body text-xs text-white placeholder-white/25 focus:outline-none focus:border-red-400/50 transition-all"
              />
              <button
                type="button"
                onClick={() => decide("declined", declineComment.trim())}
                disabled={submitting !== null || !declineComment.trim()}
                className="px-3 py-2 rounded-xl bg-red-500/15 border border-red-400/30 text-red-400 font-body text-xs font-semibold hover:bg-red-500/25 transition-all disabled:opacity-50 whitespace-nowrap"
              >
                {submitting === "declined" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Confirm Decline"}
              </button>
            </div>
          )}
        </div>
      )}

      {error && <p className="text-red-400 font-body text-xs">{error}</p>}

      {/* Older versions */}
      {letters.length > 1 && (
        <details className="group">
          <summary className="cursor-pointer text-white/30 font-body text-xs hover:text-white/50 transition-colors flex items-center gap-1.5">
            <Clock className="w-3 h-3" />
            {letters.length - 1} earlier version{letters.length - 1 !== 1 ? "s" : ""}
          </summary>
          <div className="mt-2 space-y-1.5 pl-4 border-l border-white/[0.08]">
            {letters.slice(1).map(l => (
              <div key={l.id} className="flex items-center justify-between gap-2">
                <span className="text-white/30 font-body text-xs">v{l.version} — {fmtDate(l.created_at)}</span>
                <a
                  href={`/api/offer-letters/${l.id}/download`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-pathBlue-400/70 hover:text-pathBlue-300 font-body text-xs transition-colors flex items-center gap-1"
                >
                  <Download className="w-2.5 h-2.5" /> Download
                </a>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
