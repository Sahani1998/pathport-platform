"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { XCircle, AlertTriangle, Loader2, X } from "lucide-react";

interface Props {
  applicationId: string;
  courseName: string;
}

const REASONS: { value: string; label: string }[] = [
  { value: "financial_constraints", label: "Financial constraints" },
  { value: "changed_mind",          label: "Changed my mind" },
  { value: "accepted_elsewhere",    label: "Accepted at another institution" },
  { value: "course_concerns",       label: "Concerns about the course" },
  { value: "family_reasons",        label: "Family reasons" },
  { value: "personal_reasons",      label: "Personal reasons" },
  { value: "other",                 label: "Other" },
];

export default function WithdrawButton({ applicationId, courseName }: Props) {
  const router = useRouter();
  const [open,     setOpen]     = useState(false);
  const [reason,   setReason]   = useState("");
  const [comments, setComments] = useState("");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);

  const reset = () => { setReason(""); setComments(""); setError(null); };
  const close = () => { setOpen(false); reset(); };

  const handleWithdraw = async () => {
    if (!reason) { setError("Please select a reason"); return; }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/applications/${applicationId}/withdraw`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason, comments }),
      });
      if (!res.ok) {
        const data = await res.json() as { error?: string };
        throw new Error(data.error ?? "Failed to withdraw");
      }
      router.refresh();
      close();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to withdraw");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/[0.08] text-white/30 font-body text-xs hover:border-red-400/25 hover:text-red-400/70 transition-all"
      >
        <XCircle className="w-3 h-3" />
        Withdraw
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={close}
          role="dialog"
          aria-modal="true"
        >
          <div
            onClick={e => e.stopPropagation()}
            className="w-full max-w-md bg-navy-950 border border-white/[0.1] rounded-2xl shadow-2xl"
          >

            {/* Header */}
            <div className="flex items-start justify-between gap-3 p-5 border-b border-white/[0.08]">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-red-500/10 border border-red-400/20 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                </div>
                <div>
                  <p className="font-display text-lg text-white leading-tight">Withdraw Application?</p>
                  <p className="text-white/45 font-body text-xs mt-0.5 truncate max-w-[260px]">{courseName}</p>
                </div>
              </div>
              <button onClick={close} className="text-white/30 hover:text-white/60 transition-colors flex-shrink-0">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4">
              <p className="text-white/55 font-body text-sm leading-relaxed">
                This will cancel your application and notify the college. You can apply to other courses anytime.
              </p>

              {/* Reason selector */}
              <div>
                <label className="block text-white/50 font-body text-xs uppercase tracking-wider mb-2">
                  Reason *
                </label>
                <div className="space-y-1.5">
                  {REASONS.map(r => (
                    <label key={r.value}
                      className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                        reason === r.value
                          ? "bg-gold-400/10 border-gold-400/30"
                          : "bg-white/[0.03] border-white/[0.07] hover:border-white/[0.15]"
                      }`}>
                      <input type="radio" name="withdraw-reason" value={r.value}
                        checked={reason === r.value}
                        onChange={e => setReason(e.target.value)}
                        className="w-3.5 h-3.5 text-gold-400 bg-white/5 border-white/20 focus:ring-gold-400" />
                      <span className={`font-body text-sm ${reason === r.value ? "text-white/90" : "text-white/65"}`}>
                        {r.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Comments */}
              <div>
                <label className="block text-white/50 font-body text-xs uppercase tracking-wider mb-2">
                  Additional comments <span className="text-white/30 normal-case">(optional)</span>
                </label>
                <textarea
                  value={comments}
                  onChange={e => setComments(e.target.value)}
                  rows={3}
                  maxLength={1000}
                  placeholder="Anything else you'd like us to know…"
                  className="w-full px-4 py-3 rounded-xl bg-white/[0.06] border border-white/[0.1] text-white placeholder-white/25 font-body text-sm focus:outline-none focus:border-gold-400/50 transition-colors resize-none"
                />
                <p className="text-right text-white/25 font-body text-xs mt-1">{comments.length}/1000</p>
              </div>

              {error && <p className="text-red-400 font-body text-sm">{error}</p>}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 p-5 border-t border-white/[0.08]">
              <button
                onClick={close}
                disabled={loading}
                className="flex-1 px-4 py-2.5 rounded-xl border border-white/[0.1] text-white/65 font-body text-sm hover:text-white/85 hover:border-white/20 transition-all"
              >
                Keep application
              </button>
              <button
                onClick={handleWithdraw}
                disabled={loading || !reason}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-500/15 border border-red-400/30 text-red-400 font-body text-sm font-semibold hover:bg-red-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Withdrawing…</>
                  : <><XCircle className="w-4 h-4" /> Withdraw Application</>
                }
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
