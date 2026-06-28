"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Briefcase, Users, ChevronLeft, Circle, MapPin,
  Clock, DollarSign, ChevronDown, AlertCircle, Loader2, CheckCircle2,
  Calendar, Send, XCircle, Copy,
} from "lucide-react";

export type Candidacy = {
  id: string;
  status: string;
  cover_note: string | null;
  interview_date: string | null;
  interview_mode: string | null;
  interview_location: string | null;
  offer_allowance: number | null;
  offer_currency: string | null;
  offer_start_date: string | null;
  offer_response_deadline: string | null;
  employer_notes: string | null;
  applied_at: string;
  student: { id: string; full_name: string; email: string; country: string | null } | null;
};

type Posting = {
  id: string; title: string; department: string | null; location: string;
  work_type: string; monthly_allowance: number; currency_code: string | null;
  posting_type: string | null; duration_months: number;
  openings: number; status: string; description: string | null;
  requirements: string | null; skills_required: string[]; benefits: string[] | null;
  start_date: string | null; application_deadline: string | null; created_at: string;
};

const STATUS_COLOR: Record<string, string> = {
  applied:              "text-white/55  bg-white/[0.05]     border-white/[0.08]",
  under_review:         "text-pathBlue-400 bg-pathBlue-500/10 border-pathBlue-400/25",
  shortlisted:          "text-pathBlue-400 bg-pathBlue-500/10 border-pathBlue-400/25",
  interview_scheduled:  "text-gold-400   bg-gold-400/10     border-gold-400/25",
  interview_completed:  "text-gold-400   bg-gold-400/10     border-gold-400/25",
  offer_extended:       "text-emerald-400 bg-emerald-500/10 border-emerald-400/25",
  offer_accepted:       "text-emerald-400 bg-emerald-500/10 border-emerald-400/25",
  hired:                "text-emerald-400 bg-emerald-500/15 border-emerald-400/30",
  started_internship:   "text-emerald-400 bg-emerald-500/15 border-emerald-400/30",
  completed_internship: "text-gold-400   bg-gold-400/15     border-gold-400/35",
  rejected:             "text-red-400/60  bg-red-500/[0.05] border-red-400/15",
  withdrawn:            "text-white/25   bg-white/[0.02]    border-white/[0.05]",
  offer_declined:       "text-orange-400 bg-orange-500/10  border-orange-400/25",
  cancelled:            "text-white/25   bg-white/[0.02]    border-white/[0.05]",
};

// label, action(status), needsModal
type Action = { label: string; action: string; modal?: "interview" | "offer" | "reject"; danger?: boolean };
const NEXT_ACTIONS: Record<string, Action[]> = {
  applied:             [{ label: "Review", action: "under_review" }, { label: "Shortlist", action: "shortlisted" }, { label: "Reject", action: "rejected", modal: "reject", danger: true }],
  under_review:        [{ label: "Shortlist", action: "shortlisted" }, { label: "Reject", action: "rejected", modal: "reject", danger: true }],
  shortlisted:         [{ label: "Schedule Interview", action: "interview_scheduled", modal: "interview" }, { label: "Reject", action: "rejected", modal: "reject", danger: true }],
  interview_scheduled: [{ label: "Mark Completed", action: "interview_completed" }, { label: "Reject", action: "rejected", modal: "reject", danger: true }],
  interview_completed: [{ label: "Extend Offer", action: "offer_extended", modal: "offer" }, { label: "Reject", action: "rejected", modal: "reject", danger: true }],
  offer_extended:      [],
  offer_accepted:      [{ label: "Mark Hired", action: "hired" }],
  hired:               [{ label: "Start Internship", action: "started_internship" }],
  started_internship:  [{ label: "Complete Internship", action: "completed_internship" }],
  completed_internship:[],
  rejected:            [],
  withdrawn:           [],
  offer_declined:      [],
  cancelled:           [],
};

const POSTING_STATUS_META: Record<string, { label: string; dotClass: string; textClass: string }> = {
  draft:    { label: "Draft",    dotClass: "bg-white/25",    textClass: "text-white/40"     },
  open:     { label: "Open",     dotClass: "bg-emerald-400", textClass: "text-emerald-400"  },
  paused:   { label: "Paused",   dotClass: "bg-gold-400",    textClass: "text-gold-400"     },
  closed:   { label: "Closed",   dotClass: "bg-red-400/70",  textClass: "text-red-400/70"   },
  filled:   { label: "Filled",   dotClass: "bg-pathBlue-400",textClass: "text-pathBlue-400" },
  archived: { label: "Archived", dotClass: "bg-white/20",    textClass: "text-white/30"     },
};

const fmtStatus = (s: string) => s.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());

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
  const currency = posting.currency_code ?? "SGD";

  // Modal state
  const [modal, setModal] = useState<{ kind: "interview" | "offer" | "reject"; cand: Candidacy } | null>(null);
  const [form, setForm]   = useState<Record<string, string>>({});

  const postingMeta = POSTING_STATUS_META[posting.status] ?? POSTING_STATUS_META.draft;

  async function patchCandidacy(candidacyId: string, payload: Record<string, unknown>, loadingKey: string) {
    setActionLoading(loadingKey); setActionError(null);
    try {
      const res = await fetch(`/api/employer/candidacies/${candidacyId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) { const { error: e } = await res.json(); throw new Error(e); }
      const { candidacy: updated } = await res.json();
      setCandidacies(cs => cs.map(c => c.id === candidacyId ? { ...c, ...updated } : c));
      setModal(null); setForm({});
    } catch (e) {
      setActionError(String(e));
    } finally {
      setActionLoading(null);
    }
  }

  function handleAction(cand: Candidacy, action: Action) {
    if (action.modal) {
      setForm({});
      setModal({ kind: action.modal, cand });
      return;
    }
    patchCandidacy(cand.id, { status: action.action }, cand.id + action.action);
  }

  function submitModal() {
    if (!modal) return;
    const { kind, cand } = modal;
    if (kind === "interview") {
      patchCandidacy(cand.id, {
        status: "interview_scheduled",
        interview_date: form.interview_date || null,
        interview_mode: form.interview_mode || "video",
        interview_location: form.interview_location || null,
      }, cand.id + "interview");
    } else if (kind === "offer") {
      if (!form.offer_allowance) { setActionError("Allowance is required"); return; }
      patchCandidacy(cand.id, {
        status: "offer_extended",
        offer_allowance: parseFloat(form.offer_allowance),
        offer_currency: currency,
        offer_start_date: form.offer_start_date || null,
        offer_response_deadline: form.offer_response_deadline || null,
        offer_terms: form.offer_terms || null,
      }, cand.id + "offer");
    } else {
      patchCandidacy(cand.id, {
        status: "rejected",
        rejection_category: form.rejection_category || "other",
        rejection_reason: form.rejection_reason || null,
      }, cand.id + "reject");
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

  async function duplicatePosting() {
    setActionLoading("duplicate"); setActionError(null);
    try {
      const res = await fetch(`/api/employer/postings/${posting.id}/duplicate`, { method: "POST" });
      if (!res.ok) { const { error: e } = await res.json(); throw new Error(e); }
      const { posting: dup } = await res.json();
      window.location.href = `/dashboard/employer/postings/${dup.id}`;
    } catch (e) {
      setActionError(String(e));
      setActionLoading(null);
    }
  }

  const filtered = statusFilter === "all" ? candidacies : candidacies.filter(c => c.status === statusFilter);
  const groupCounts: Record<string, number> = {};
  for (const c of candidacies) groupCounts[c.status] = (groupCounts[c.status] ?? 0) + 1;

  const inputCls = "w-full px-4 py-3 rounded-xl bg-white/[0.05] border border-white/[0.10] text-white/90 font-body text-sm placeholder:text-white/25 focus:outline-none focus:border-emerald-400/40 transition-all";

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
              <span className="text-white/40 font-body text-xs">{fmtStatus(posting.posting_type ?? "internship")}</span>
              <span className="text-white/25 font-body text-xs">·</span>
              <span className="text-white/40 font-body text-xs">{posting.openings} opening{posting.openings !== 1 ? "s" : ""}</span>
            </div>
            <div className="flex items-center gap-4 flex-wrap">
              <span className="flex items-center gap-1.5 text-white/50 font-body text-xs">
                <MapPin className="w-3.5 h-3.5" /> {posting.location} · {posting.work_type}
              </span>
              <span className="flex items-center gap-1.5 text-white/50 font-body text-xs">
                <DollarSign className="w-3.5 h-3.5" /> {currency} {Number(posting.monthly_allowance).toLocaleString()}/mo
              </span>
              <span className="flex items-center gap-1.5 text-white/50 font-body text-xs">
                <Clock className="w-3.5 h-3.5" /> {posting.duration_months} months
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={duplicatePosting} disabled={actionLoading === "duplicate"}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/[0.05] border border-white/[0.10] text-white/55 font-body text-sm font-semibold hover:bg-white/[0.08] disabled:opacity-50 transition-all">
              {actionLoading === "duplicate" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Copy className="w-3.5 h-3.5" />} Duplicate
            </button>
            {posting.status === "draft" && (
              <button onClick={() => togglePostingStatus("open")} disabled={actionLoading === "posting"}
                className="px-4 py-2 rounded-xl bg-emerald-500/15 border border-emerald-400/30 text-emerald-400 font-body text-sm font-semibold hover:bg-emerald-500/25 disabled:opacity-50 transition-all">Publish</button>
            )}
            {posting.status === "open" && (
              <button onClick={() => togglePostingStatus("paused")} disabled={actionLoading === "posting"}
                className="px-4 py-2 rounded-xl bg-gold-400/10 border border-gold-400/25 text-gold-400 font-body text-sm font-semibold hover:bg-gold-400/20 disabled:opacity-50 transition-all">Pause</button>
            )}
            {posting.status === "paused" && (
              <button onClick={() => togglePostingStatus("open")} disabled={actionLoading === "posting"}
                className="px-4 py-2 rounded-xl bg-emerald-500/15 border border-emerald-400/30 text-emerald-400 font-body text-sm font-semibold hover:bg-emerald-500/25 disabled:opacity-50 transition-all">Resume</button>
            )}
            {["open","paused"].includes(posting.status) && (
              <button onClick={() => togglePostingStatus("closed")} disabled={actionLoading === "posting"}
                className="px-4 py-2 rounded-xl bg-red-500/10 border border-red-400/20 text-red-400/70 font-body text-sm font-semibold hover:bg-red-500/15 disabled:opacity-50 transition-all">Close</button>
            )}
            {["closed","filled","draft"].includes(posting.status) && (
              <button onClick={() => togglePostingStatus("archived")} disabled={actionLoading === "posting"}
                className="px-4 py-2 rounded-xl bg-white/[0.05] border border-white/[0.10] text-white/40 font-body text-sm font-semibold hover:bg-white/[0.08] disabled:opacity-50 transition-all">Archive</button>
            )}
            {posting.status === "archived" && (
              <button onClick={() => togglePostingStatus("draft")} disabled={actionLoading === "posting"}
                className="px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-400/25 text-emerald-400 font-body text-sm font-semibold hover:bg-emerald-500/20 disabled:opacity-50 transition-all">Restore</button>
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
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-white/[0.05] border border-white/[0.10] text-white/70 font-body text-xs focus:outline-none focus:border-emerald-400/40 transition-all">
            <option value="all">All ({candidacies.length})</option>
            {Object.entries(groupCounts).map(([st, cnt]) => (
              <option key={st} value={st}>{fmtStatus(st)} ({cnt})</option>
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
                <div key={c.id}>
                  <button onClick={() => setExpanded(isExpanded ? null : c.id)}
                    className="w-full flex items-center justify-between gap-4 px-6 py-4 hover:bg-white/[0.02] transition-colors text-left">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center flex-shrink-0 text-white font-display font-bold text-sm">
                        {(String(c.student?.full_name ?? "").trim()[0] ?? "U").toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="font-body font-semibold text-sm text-white/85 truncate">{c.student?.full_name ?? "—"}</p>
                        <p className="font-body text-xs text-white/40 truncate">{c.student?.email ?? "—"} · {c.student?.country ?? "—"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className={`px-2.5 py-1 rounded-lg border font-body text-xs font-semibold ${statusClass}`}>{fmtStatus(c.status)}</span>
                      <span className="text-white/25 font-body text-xs">{new Date(c.applied_at).toLocaleDateString("en-SG",{day:"numeric",month:"short"})}</span>
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
                      {c.interview_date && (
                        <div className="flex items-center gap-2 text-white/55 font-body text-xs">
                          <Calendar className="w-3.5 h-3.5 text-gold-400" />
                          Interview: {new Date(c.interview_date).toLocaleString("en-SG")} {c.interview_mode ? `· ${fmtStatus(c.interview_mode)}` : ""}
                          {c.interview_location ? ` · ${c.interview_location}` : ""}
                        </div>
                      )}
                      {c.offer_allowance != null && (
                        <div className="flex items-center gap-2 text-emerald-400/80 font-body text-xs">
                          <DollarSign className="w-3.5 h-3.5" />
                          Offer: {c.offer_currency ?? currency} {Number(c.offer_allowance).toLocaleString()}/mo
                          {c.offer_start_date ? ` · starts ${c.offer_start_date}` : ""}
                        </div>
                      )}
                      {actions.length > 0 && (
                        <div className="flex items-center gap-2 flex-wrap pt-1">
                          {actions.map(action => {
                            const key = c.id + action.action;
                            return (
                              <button key={action.action} onClick={() => handleAction(c, action)} disabled={!!actionLoading}
                                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl font-body text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all ${
                                  action.danger
                                    ? "bg-red-500/10 border border-red-400/20 text-red-400/70 hover:bg-red-500/15"
                                    : "bg-emerald-500/15 border border-emerald-400/30 text-emerald-400 hover:bg-emerald-500/25"
                                }`}>
                                {actionLoading === key ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : action.danger ? null : <CheckCircle2 className="w-3.5 h-3.5" />}
                                {action.label}
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

      {/* ── Modals ── */}
      {modal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-navy-900 border border-white/[0.10] rounded-2xl p-6 max-w-md w-full space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-display text-xl text-white mb-1">
                  {modal.kind === "interview" ? "Schedule Interview" : modal.kind === "offer" ? "Extend Offer" : "Reject Candidate"}
                </h3>
                <p className="font-body text-sm text-white/50">{modal.cand.student?.full_name}</p>
              </div>
              <button onClick={() => { setModal(null); setForm({}); }} className="text-white/30 hover:text-white/60 transition-colors">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {modal.kind === "interview" && (
              <div className="space-y-3">
                <div>
                  <label className="block font-body text-xs text-white/50 uppercase tracking-wider mb-2">Date & Time</label>
                  <input type="datetime-local" className={inputCls} value={form.interview_date ?? ""} onChange={e => setForm(f => ({ ...f, interview_date: e.target.value }))} />
                </div>
                <div>
                  <label className="block font-body text-xs text-white/50 uppercase tracking-wider mb-2">Mode</label>
                  <select className={inputCls} value={form.interview_mode ?? "video"} onChange={e => setForm(f => ({ ...f, interview_mode: e.target.value }))}>
                    <option value="video">Video</option>
                    <option value="in_person">In Person</option>
                    <option value="phone">Phone</option>
                  </select>
                </div>
                <div>
                  <label className="block font-body text-xs text-white/50 uppercase tracking-wider mb-2">Location / Link</label>
                  <input className={inputCls} placeholder="Google Meet link or office address" value={form.interview_location ?? ""} onChange={e => setForm(f => ({ ...f, interview_location: e.target.value }))} />
                </div>
              </div>
            )}

            {modal.kind === "offer" && (
              <div className="space-y-3">
                <div>
                  <label className="block font-body text-xs text-white/50 uppercase tracking-wider mb-2">Monthly Allowance ({currency}) *</label>
                  <input type="number" min="0" className={inputCls} placeholder="1200" value={form.offer_allowance ?? ""} onChange={e => setForm(f => ({ ...f, offer_allowance: e.target.value }))} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-body text-xs text-white/50 uppercase tracking-wider mb-2">Start Date</label>
                    <input type="date" className={inputCls} value={form.offer_start_date ?? ""} onChange={e => setForm(f => ({ ...f, offer_start_date: e.target.value }))} />
                  </div>
                  <div>
                    <label className="block font-body text-xs text-white/50 uppercase tracking-wider mb-2">Respond By</label>
                    <input type="date" className={inputCls} value={form.offer_response_deadline ?? ""} onChange={e => setForm(f => ({ ...f, offer_response_deadline: e.target.value }))} />
                  </div>
                </div>
                <div>
                  <label className="block font-body text-xs text-white/50 uppercase tracking-wider mb-2">Terms (optional)</label>
                  <textarea rows={2} className={inputCls + " resize-none"} placeholder="Any conditions or notes" value={form.offer_terms ?? ""} onChange={e => setForm(f => ({ ...f, offer_terms: e.target.value }))} />
                </div>
              </div>
            )}

            {modal.kind === "reject" && (
              <div className="space-y-3">
                <div>
                  <label className="block font-body text-xs text-white/50 uppercase tracking-wider mb-2">Reason Category</label>
                  <select className={inputCls} value={form.rejection_category ?? "not_suitable"} onChange={e => setForm(f => ({ ...f, rejection_category: e.target.value }))}>
                    <option value="not_qualified">Not qualified</option>
                    <option value="position_filled">Position filled</option>
                    <option value="not_suitable">Not suitable</option>
                    <option value="no_response">No response</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block font-body text-xs text-white/50 uppercase tracking-wider mb-2">Private Note (optional)</label>
                  <textarea rows={2} className={inputCls + " resize-none"} placeholder="Internal note — not shared with the candidate" value={form.rejection_reason ?? ""} onChange={e => setForm(f => ({ ...f, rejection_reason: e.target.value }))} />
                </div>
              </div>
            )}

            <div className="flex items-center gap-3 pt-1">
              <button onClick={() => { setModal(null); setForm({}); }}
                className="flex-1 px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white/50 font-body text-sm font-semibold hover:bg-white/[0.07] transition-all">Cancel</button>
              <button onClick={submitModal} disabled={!!actionLoading}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-body text-sm font-semibold disabled:opacity-50 transition-all ${
                  modal.kind === "reject"
                    ? "bg-red-500/15 border border-red-400/30 text-red-400 hover:bg-red-500/25"
                    : "bg-emerald-500/15 border border-emerald-400/30 text-emerald-400 hover:bg-emerald-500/25"
                }`}>
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : modal.kind === "interview" ? <Calendar className="w-4 h-4" /> : modal.kind === "offer" ? <Send className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                {modal.kind === "interview" ? "Schedule" : modal.kind === "offer" ? "Send Offer" : "Reject"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
