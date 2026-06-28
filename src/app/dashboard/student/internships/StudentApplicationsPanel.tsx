"use client";

import { useState } from "react";
import {
  Briefcase, Calendar, DollarSign, CheckCircle2, XCircle,
  AlertCircle, Loader2, Building2, ChevronDown, Clock,
} from "lucide-react";

export type StudentCandidacy = {
  id: string;
  posting_id: string;
  status: string;
  offer_allowance: number | null;
  offer_currency: string | null;
  offer_start_date: string | null;
  offer_response_deadline: string | null;
  offer_terms: string | null;
  interview_date: string | null;
  interview_mode: string | null;
  interview_location: string | null;
  applied_at: string;
  postingTitle: string;
  companyName: string;
};

const STATUS_META: Record<string, { label: string; cls: string }> = {
  applied:              { label: "Applied",              cls: "text-white/55  bg-white/[0.05]     border-white/[0.08]" },
  under_review:         { label: "Under Review",         cls: "text-pathBlue-400 bg-pathBlue-500/10 border-pathBlue-400/25" },
  shortlisted:          { label: "Shortlisted",          cls: "text-pathBlue-400 bg-pathBlue-500/10 border-pathBlue-400/25" },
  interview_scheduled:  { label: "Interview Scheduled",  cls: "text-gold-400   bg-gold-400/10     border-gold-400/25" },
  interview_completed:  { label: "Interview Completed",  cls: "text-gold-400   bg-gold-400/10     border-gold-400/25" },
  offer_extended:       { label: "Offer Received",       cls: "text-emerald-400 bg-emerald-500/10 border-emerald-400/25" },
  offer_accepted:       { label: "Offer Accepted",       cls: "text-emerald-400 bg-emerald-500/15 border-emerald-400/30" },
  offer_declined:       { label: "Offer Declined",       cls: "text-orange-400 bg-orange-500/10  border-orange-400/25" },
  hired:                { label: "Hired",                cls: "text-emerald-400 bg-emerald-500/15 border-emerald-400/30" },
  started_internship:   { label: "Internship Started",   cls: "text-emerald-400 bg-emerald-500/15 border-emerald-400/30" },
  completed_internship: { label: "Completed",            cls: "text-gold-400   bg-gold-400/15     border-gold-400/35" },
  rejected:             { label: "Not Selected",         cls: "text-red-400/60 bg-red-500/[0.05]  border-red-400/15" },
  withdrawn:            { label: "Withdrawn",            cls: "text-white/30   bg-white/[0.02]    border-white/[0.05]" },
  cancelled:            { label: "Cancelled",            cls: "text-white/30   bg-white/[0.02]    border-white/[0.05]" },
};

export default function StudentApplicationsPanel({ candidacies: initial }: { candidacies: StudentCandidacy[] }) {
  const [candidacies, setCandidacies] = useState(initial);
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError]     = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [declineFor, setDeclineFor] = useState<StudentCandidacy | null>(null);
  const [declineReason, setDeclineReason] = useState("");

  if (candidacies.length === 0) return null;

  async function act(candidacy_id: string, action: string, reason?: string) {
    setLoading(candidacy_id + action); setError(null);
    try {
      const res = await fetch("/api/student/internship-candidacies", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidacy_id, action, reason }),
      });
      if (!res.ok) { const { error: e } = await res.json(); throw new Error(e); }
      const { candidacy: updated } = await res.json();
      setCandidacies(cs => cs.map(c => c.id === candidacy_id ? { ...c, status: updated.status } : c));
      setDeclineFor(null); setDeclineReason("");
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="font-body text-xs text-white/35 uppercase tracking-wider">My Applications</p>
        <span className="font-body text-xs text-white/30">{candidacies.length}</span>
      </div>

      {error && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-400/25">
          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
          <p className="font-body text-sm text-red-300">{error}</p>
        </div>
      )}

      {candidacies.map(c => {
        const meta = STATUS_META[c.status] ?? STATUS_META.applied;
        const hasOffer = c.status === "offer_extended";
        const isOpen = expanded === c.id;
        const canWithdraw = !["hired","offer_accepted","started_internship","completed_internship","rejected","withdrawn","cancelled","offer_declined"].includes(c.status);
        return (
          <div key={c.id} className={`rounded-2xl border ${hasOffer ? "bg-emerald-500/[0.06] border-emerald-400/25" : "bg-white/[0.04] border-white/[0.08]"}`}>
            <button onClick={() => setExpanded(isOpen ? null : c.id)} className="w-full p-4 flex items-center justify-between gap-3 text-left">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-400/20 flex items-center justify-center flex-shrink-0 font-display font-bold text-emerald-400 text-sm">
                  {c.companyName?.[0]?.toUpperCase() ?? <Building2 className="w-4 h-4" />}
                </div>
                <div className="min-w-0">
                  <p className="font-body font-semibold text-sm text-white/85 truncate">{c.postingTitle}</p>
                  <p className="font-body text-xs text-white/40 truncate">{c.companyName}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className={`px-2.5 py-1 rounded-lg border font-body text-xs font-semibold ${meta.cls}`}>{meta.label}</span>
                <ChevronDown className={`w-4 h-4 text-white/25 transition-transform ${isOpen ? "rotate-180" : ""}`} />
              </div>
            </button>

            {isOpen && (
              <div className="px-4 pb-4 space-y-3 border-t border-white/[0.05] pt-3">
                {c.interview_date && (
                  <div className="flex items-center gap-2 text-white/55 font-body text-xs">
                    <Calendar className="w-3.5 h-3.5 text-gold-400" />
                    Interview: {new Date(c.interview_date).toLocaleString("en-SG")}
                    {c.interview_mode ? ` · ${c.interview_mode.replace(/_/g," ")}` : ""}
                    {c.interview_location ? ` · ${c.interview_location}` : ""}
                  </div>
                )}

                {hasOffer && (
                  <div className="p-3 rounded-xl bg-emerald-500/[0.08] border border-emerald-400/20 space-y-2">
                    <p className="font-body text-sm font-semibold text-emerald-400 flex items-center gap-1.5">
                      <DollarSign className="w-4 h-4" /> Offer Details
                    </p>
                    <div className="grid grid-cols-2 gap-2 font-body text-xs text-white/65">
                      <div><span className="text-white/35">Allowance:</span> {c.offer_currency ?? "SGD"} {c.offer_allowance != null ? Number(c.offer_allowance).toLocaleString() : "—"}/mo</div>
                      <div><span className="text-white/35">Start:</span> {c.offer_start_date ?? "TBD"}</div>
                      {c.offer_response_deadline && <div className="col-span-2 flex items-center gap-1 text-gold-400"><Clock className="w-3 h-3" /> Respond by {c.offer_response_deadline}</div>}
                    </div>
                    {c.offer_terms && <p className="font-body text-xs text-white/50 italic">{c.offer_terms}</p>}
                    <div className="flex items-center gap-2 pt-1">
                      <button onClick={() => act(c.id, "accept_offer")} disabled={!!loading}
                        className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-500/15 border border-emerald-400/30 text-emerald-400 font-body text-sm font-semibold hover:bg-emerald-500/25 disabled:opacity-50 transition-all">
                        {loading === c.id + "accept_offer" ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />} Accept
                      </button>
                      <button onClick={() => setDeclineFor(c)} disabled={!!loading}
                        className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/[0.05] border border-white/[0.10] text-white/55 font-body text-sm font-semibold hover:bg-white/[0.08] disabled:opacity-50 transition-all">
                        <XCircle className="w-4 h-4" /> Decline
                      </button>
                    </div>
                  </div>
                )}

                {canWithdraw && !hasOffer && (
                  <button onClick={() => act(c.id, "withdraw")} disabled={!!loading}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white/45 font-body text-xs font-semibold hover:bg-white/[0.07] disabled:opacity-50 transition-all">
                    {loading === c.id + "withdraw" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />} Withdraw Application
                  </button>
                )}

                <p className="font-body text-[11px] text-white/25">Applied {new Date(c.applied_at).toLocaleDateString("en-SG", { day: "numeric", month: "short", year: "numeric" })}</p>
              </div>
            )}
          </div>
        );
      })}

      {/* Decline modal */}
      {declineFor && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-navy-900 border border-white/[0.10] rounded-2xl p-6 max-w-md w-full space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-display text-xl text-white mb-1">Decline Offer</h3>
                <p className="font-body text-sm text-white/50">{declineFor.postingTitle}</p>
              </div>
              <button onClick={() => { setDeclineFor(null); setDeclineReason(""); }} className="text-white/30 hover:text-white/60">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <div>
              <label className="block font-body text-xs text-white/50 uppercase tracking-wider mb-2">Reason (optional)</label>
              <textarea rows={3} value={declineReason} onChange={e => setDeclineReason(e.target.value)}
                placeholder="Let the employer know why (optional)…"
                className="w-full px-4 py-3 rounded-xl bg-white/[0.05] border border-white/[0.10] text-white/90 font-body text-sm placeholder:text-white/25 focus:outline-none focus:border-orange-400/40 transition-all resize-none" />
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => { setDeclineFor(null); setDeclineReason(""); }}
                className="flex-1 px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white/50 font-body text-sm font-semibold hover:bg-white/[0.07] transition-all">Cancel</button>
              <button onClick={() => act(declineFor.id, "decline_offer", declineReason)} disabled={!!loading}
                className="flex-1 px-4 py-2.5 rounded-xl bg-orange-500/15 border border-orange-400/30 text-orange-400 font-body text-sm font-semibold hover:bg-orange-500/25 disabled:opacity-50 transition-all">
                {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Decline Offer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
