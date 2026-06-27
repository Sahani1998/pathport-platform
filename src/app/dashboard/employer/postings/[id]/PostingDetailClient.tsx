"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Briefcase, Users, ChevronLeft, Circle, MapPin,
  Clock, DollarSign, ChevronDown, AlertCircle, Loader2, CheckCircle2,
} from "lucide-react";

export type Candidacy = {
  id: string;
  status: string;
  cover_note: string | null;
  interview_date: string | null;
  offer_allowance_sgd: number | null;
  applied_at: string;
  student: { id: string; full_name: string; email: string; country: string | null } | null;
};

type Posting = {
  id: string; title: string; department: string | null; location: string;
  work_type: string; monthly_allowance_sgd: number; duration_months: number;
  openings: number; status: string; description: string | null;
  requirements: string | null; skills_required: string[]; start_date: string | null;
  application_deadline: string | null; created_at: string;
};

const STATUS_COLOR: Record<string, string> = {
  applied:             "text-white/55  bg-white/[0.05]     border-white/[0.08]",
  shortlisted:         "text-pathBlue-400 bg-pathBlue-500/10 border-pathBlue-400/25",
  interview_scheduled: "text-gold-400   bg-gold-400/10     border-gold-400/25",
  interview_completed: "text-gold-400   bg-gold-400/10     border-gold-400/25",
  offer_extended:      "text-emerald-400 bg-emerald-500/10 border-emerald-400/25",
  offer_accepted:      "text-emerald-400 bg-emerald-500/10 border-emerald-400/25",
  hired:               "text-emerald-400 bg-emerald-500/15 border-emerald-400/30",
  rejected:            "text-red-400/60  bg-red-500/[0.05] border-red-400/15",
  withdrawn:           "text-white/25   bg-white/[0.02]    border-white/[0.05]",
  offer_declined:      "text-orange-400 bg-orange-500/10  border-orange-400/25",
};

const NEXT_ACTIONS: Record<string, { label: string; action: string }[]> = {
  applied:             [{ label: "Shortlist", action: "shortlisted" }, { label: "Reject", action: "rejected" }],
  shortlisted:         [{ label: "Schedule Interview", action: "interview_scheduled" }, { label: "Reject", action: "rejected" }],
  interview_scheduled: [{ label: "Mark Completed", action: "interview_completed" }, { label: "Reject", action: "rejected" }],
  interview_completed: [{ label: "Extend Offer", action: "offer_extended" }, { label: "Reject", action: "rejected" }],
  offer_extended:      [],
  offer_accepted:      [{ label: "Mark Hired", action: "hired" }],
  hired:               [],
  rejected:            [],
  withdrawn:           [],
  offer_declined:      [],
};

const POSTING_STATUS_META: Record<string, { label: string; dotClass: string; textClass: string }> = {
  draft:  { label: "Draft",  dotClass: "bg-white/25",    textClass: "text-white/40"     },
  open:   { label: "Open",   dotClass: "bg-emerald-400", textClass: "text-emerald-400"  },
  paused: { label: "Paused", dotClass: "bg-gold-400",    textClass: "text-gold-400"     },
  closed: { label: "Closed", dotClass: "bg-red-400/70",  textClass: "text-red-400/70"   },
  filled: { label: "Filled", dotClass: "bg-pathBlue-400",textClass: "text-pathBlue-400" },
};

export default function PostingDetailClient({
  posting,
  candidacies: initial,
}: {
  posting: Posting;
  candidacies: Candidacy[];
}) {
  const [candidacies, setCandidacies] = useState<Candidacy[]>(initial);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionError, setActionError]     = useState<string | null>(null);
  const [expanded, setExpanded]           = useState<string | null>(null);
  const [statusFilter, setStatusFilter]   = useState("all");

  const postingMeta = POSTING_STATUS_META[posting.status] ?? POSTING_STATUS_META.draft;

  async function advanceCandidacy(candidacyId: string, newStatus: string) {
    setActionLoading(candidacyId + newStatus); setActionError(null);
    try {
      const res = await fetch(`/api/employer/candidacies/${candidacyId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) { const { error: e } = await res.json(); throw new Error(e); }
      const { candidacy: updated } = await res.json();
      setCandidacies(cs => cs.map(c => c.id === candidacyId ? { ...c, ...updated } : c));
    } catch (e) {
      setActionError(String(e));
    } finally {
      setActionLoading(null);
    }
  }

  async function togglePostingStatus(newStatus: string) {
    setActionLoading("posting"); setActionError(null);
    try {
      const res = await fetch(`/api/employer/postings/${posting.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) { const { error: e } = await res.json(); throw new Error(e); }
      window.location.reload();
    } catch (e) {
      setActionError(String(e));
      setActionLoading(null);
    }
  }

  const filtered = statusFilter === "all"
    ? candidacies
    : candidacies.filter(c => c.status === statusFilter);

  const groupCounts: Record<string, number> = {};
  for (const c of candidacies) groupCounts[c.status] = (groupCounts[c.status] ?? 0) + 1;

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/employer/postings" className="text-white/35 hover:text-white/65 transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <h2 className="font-display text-3xl text-white">{posting.title}</h2>
      </div>

      {actionError && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-400/25">
          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
          <p className="font-body text-sm text-red-300">{actionError}</p>
        </div>
      )}

      {/* Posting header card */}
      <div className="p-5 rounded-2xl bg-white/[0.04] border border-white/[0.08] space-y-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="space-y-2">
            <div className="flex items-center gap-3 flex-wrap">
              <span className={`inline-flex items-center gap-1.5 font-body text-sm font-semibold ${postingMeta.textClass}`}>
                <Circle className={`w-2 h-2 fill-current ${postingMeta.dotClass}`} />
                {postingMeta.label}
              </span>
              <span className="text-white/25 font-body text-xs">·</span>
              <span className="text-white/40 font-body text-xs">{posting.openings} opening{posting.openings !== 1 ? "s" : ""}</span>
            </div>
            <div className="flex items-center gap-4 flex-wrap">
              <span className="flex items-center gap-1.5 text-white/50 font-body text-xs">
                <MapPin className="w-3.5 h-3.5" /> {posting.location} · {posting.work_type}
              </span>
              <span className="flex items-center gap-1.5 text-white/50 font-body text-xs">
                <DollarSign className="w-3.5 h-3.5" /> S${Number(posting.monthly_allowance_sgd).toLocaleString("en-SG")}/mo
              </span>
              <span className="flex items-center gap-1.5 text-white/50 font-body text-xs">
                <Clock className="w-3.5 h-3.5" /> {posting.duration_months} months
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {posting.status === "draft" && (
              <button
                onClick={() => togglePostingStatus("open")}
                disabled={actionLoading === "posting"}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/15 border border-emerald-400/30 text-emerald-400 font-body text-sm font-semibold hover:bg-emerald-500/25 disabled:opacity-50 transition-all"
              >
                {actionLoading === "posting" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                Publish
              </button>
            )}
            {posting.status === "open" && (
              <button
                onClick={() => togglePostingStatus("paused")}
                disabled={actionLoading === "posting"}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gold-400/10 border border-gold-400/25 text-gold-400 font-body text-sm font-semibold hover:bg-gold-400/20 disabled:opacity-50 transition-all"
              >
                Pause
              </button>
            )}
            {posting.status === "paused" && (
              <button
                onClick={() => togglePostingStatus("open")}
                disabled={actionLoading === "posting"}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/15 border border-emerald-400/30 text-emerald-400 font-body text-sm font-semibold hover:bg-emerald-500/25 disabled:opacity-50 transition-all"
              >
                Resume
              </button>
            )}
            {["open","paused"].includes(posting.status) && (
              <button
                onClick={() => togglePostingStatus("closed")}
                disabled={actionLoading === "posting"}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 border border-red-400/20 text-red-400/70 font-body text-sm font-semibold hover:bg-red-500/15 disabled:opacity-50 transition-all"
              >
                Close
              </button>
            )}
          </div>
        </div>

        {posting.skills_required.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {posting.skills_required.map(s => (
              <span key={s} className="px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white/50 font-body text-xs">{s}</span>
            ))}
          </div>
        )}
      </div>

      {/* Pipeline */}
      <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.07]">
          <div className="flex items-center gap-3">
            <Users className="w-4 h-4 text-emerald-400" />
            <h3 className="font-display text-xl text-white">Candidates</h3>
            <span className="font-body text-sm text-white/40">({candidacies.length})</span>
          </div>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-white/[0.05] border border-white/[0.10] text-white/70 font-body text-xs focus:outline-none focus:border-emerald-400/40 transition-all"
          >
            <option value="all">All ({candidacies.length})</option>
            {Object.entries(groupCounts).map(([st, cnt]) => (
              <option key={st} value={st}>{st.replace(/_/g," ").replace(/\b\w/g,(l:string)=>l.toUpperCase())} ({cnt})</option>
            ))}
          </select>
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Briefcase className="w-9 h-9 text-white/15 mb-3" />
            <p className="font-display text-lg text-white/30">No candidates yet</p>
            <p className="text-white/25 font-body text-sm mt-1">
              {posting.status === "open" ? "Applications will appear here when students apply." : "Publish this posting to receive applications."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.05]">
            {filtered.map(c => {
              const isExpanded  = expanded === c.id;
              const actions     = NEXT_ACTIONS[c.status] ?? [];
              const statusClass = STATUS_COLOR[c.status] ?? STATUS_COLOR.applied;
              return (
                <div key={c.id} className="transition-colors">
                  <button
                    onClick={() => setExpanded(isExpanded ? null : c.id)}
                    className="w-full flex items-center justify-between gap-4 px-6 py-4 hover:bg-white/[0.02] transition-colors text-left"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center flex-shrink-0 text-white font-display font-bold text-sm">
                        {String(c.student?.full_name ?? "U")[0].toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="font-body font-semibold text-sm text-white/85 truncate">{c.student?.full_name ?? "—"}</p>
                        <p className="font-body text-xs text-white/40 truncate">{c.student?.email ?? "—"} · {c.student?.country ?? "—"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className={`px-2.5 py-1 rounded-lg border font-body text-xs font-semibold ${statusClass}`}>
                        {c.status.replace(/_/g," ").replace(/\b\w/g,(l:string)=>l.toUpperCase())}
                      </span>
                      <span className="text-white/25 font-body text-xs">
                        {new Date(c.applied_at).toLocaleDateString("en-SG",{day:"numeric",month:"short"})}
                      </span>
                      <ChevronDown className={`w-4 h-4 text-white/25 transition-transform ${isExpanded ? "rotate-180":""}`} />
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="px-6 pb-4 space-y-3 border-t border-white/[0.05] bg-white/[0.015] pt-4">
                      {c.cover_note && (
                        <div>
                          <p className="font-body text-[11px] text-white/35 uppercase tracking-wider mb-1">Cover Note</p>
                          <p className="font-body text-sm text-white/65">{c.cover_note}</p>
                        </div>
                      )}
                      {actions.length > 0 && (
                        <div className="flex items-center gap-2 flex-wrap pt-1">
                          {actions.map(({ label, action }) => {
                            const isRej = action === "rejected";
                            const key   = c.id + action;
                            return (
                              <button
                                key={action}
                                onClick={() => advanceCandidacy(c.id, action)}
                                disabled={!!actionLoading}
                                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl font-body text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all ${
                                  isRej
                                    ? "bg-red-500/10 border border-red-400/20 text-red-400/70 hover:bg-red-500/15"
                                    : "bg-emerald-500/15 border border-emerald-400/30 text-emerald-400 hover:bg-emerald-500/25"
                                }`}
                              >
                                {actionLoading === key
                                  ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  : isRej ? null : <CheckCircle2 className="w-3.5 h-3.5" />}
                                {label}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
