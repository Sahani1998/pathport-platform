"use client";

import { useState } from "react";
import {
  Briefcase, MapPin, DollarSign, Clock, AlertCircle, CheckCircle2, Loader2,
  Search, Building2,
} from "lucide-react";

type Posting = {
  id: string; title: string; department: string | null; location: string;
  work_type: string; monthly_allowance: number; duration_months: number;
  openings: number; skills_required: string[];
  start_date: string | null; application_deadline: string | null;
  employer_companies: { company_name: string; logo_url: string | null; industry: string | null } | null;
};

type Candidacy = { posting_id: string; status: string };

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
};

export default function InternshipHubClient({
  postings: initial,
  appliedSet: initialApplied,
  candidacies: initialCandidacies,
}: {
  postings:     Posting[];
  appliedSet:   string[];
  candidacies:  Candidacy[];
}) {
  const [postings]                        = useState(initial);
  const [applied, setApplied]             = useState(new Set(initialApplied));
  const [candidacies, setCandidacies]     = useState(initialCandidacies);
  const [applying, setApplying]           = useState<string | null>(null);
  const [error, setError]                 = useState<string | null>(null);
  const [success, setSuccess]             = useState<string | null>(null);
  const [coverNote, setCoverNote]         = useState<Record<string, string>>({});
  const [expanded, setExpanded]           = useState<string | null>(null);
  const [search, setSearch]               = useState("");

  const filtered = postings.filter(p =>
    !search || p.title.toLowerCase().includes(search.toLowerCase()) ||
    (p.department?.toLowerCase().includes(search.toLowerCase()))
  );

  async function apply(posting: Posting) {
    setApplying(posting.id); setError(null); setSuccess(null);
    try {
      const res = await fetch(`/api/student/internship-postings/${posting.id}/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cover_note: coverNote[posting.id] ?? null }),
      });
      if (!res.ok) { const { error: e } = await res.json(); throw new Error(e); }
      setApplied(s => new Set(Array.from(s).concat(posting.id)));
      setCandidacies(cs => [...cs, { posting_id: posting.id, status: "applied" }]);
      setSuccess(`Applied to ${posting.title}!`);
      setExpanded(null);
      setTimeout(() => setSuccess(null), 4000);
    } catch (e) {
      setError(String(e));
    } finally {
      setApplying(null);
    }
  }

  const getCandidacy = (postingId: string) => candidacies.find(c => c.posting_id === postingId);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <p className="font-body text-xs text-white/35 uppercase tracking-wider mb-1">Open Positions</p>
          <p className="font-display text-2xl text-white">{postings.length} internship{postings.length !== 1 ? "s" : ""} available</p>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-400/25">
          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
          <p className="font-body text-sm text-red-300">{error}</p>
        </div>
      )}
      {success && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-400/25">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <p className="font-body text-sm text-emerald-300">{success}</p>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by title or department…"
          className="w-full pl-11 pr-4 py-3 rounded-xl bg-white/[0.05] border border-white/[0.10] text-white/90 font-body text-sm placeholder:text-white/25 focus:outline-none focus:border-emerald-400/40 transition-all"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 bg-white/[0.03] border border-white/[0.07] rounded-2xl">
          <Briefcase className="w-9 h-9 text-white/20 mb-3" />
          <p className="font-display text-lg text-white/35">{search ? "No matching postings" : "No open positions right now"}</p>
          <p className="text-white/25 font-body text-sm mt-1">Check back soon — new opportunities are added regularly.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(posting => {
            const company    = posting.employer_companies;
            const isApplied  = applied.has(posting.id);
            const candidacy  = getCandidacy(posting.id);
            const isExpanded = expanded === posting.id;
            const appliedStatus = candidacy?.status;
            const statusClass = appliedStatus ? (STATUS_COLOR[appliedStatus] ?? STATUS_COLOR.applied) : "";

            return (
              <div key={posting.id} className={`rounded-2xl border transition-all ${
                isApplied ? "bg-white/[0.03] border-white/[0.07]" : "bg-white/[0.04] border-white/[0.09] hover:border-white/[0.14]"
              }`}>
                <div
                  className="p-5 cursor-pointer"
                  onClick={() => !isApplied && setExpanded(isExpanded ? null : posting.id)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-400/20 flex items-center justify-center flex-shrink-0 font-display font-bold text-emerald-400 text-sm">
                        {company?.company_name?.[0]?.toUpperCase() ?? <Building2 className="w-4 h-4" />}
                      </div>
                      <div className="min-w-0">
                        <p className="font-body font-semibold text-white/90 truncate">{posting.title}</p>
                        <p className="font-body text-xs text-white/50 mt-0.5">{company?.company_name ?? "—"}</p>
                      </div>
                    </div>
                    {isApplied && appliedStatus && (
                      <span className={`px-2.5 py-1 rounded-lg border font-body text-xs font-semibold flex-shrink-0 ${statusClass}`}>
                        {appliedStatus.replace(/_/g," ").replace(/\b\w/g,(l:string)=>l.toUpperCase())}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-4 mt-3 flex-wrap">
                    <span className="flex items-center gap-1.5 text-white/45 font-body text-xs">
                      <MapPin className="w-3 h-3" /> {posting.location} · {posting.work_type}
                    </span>
                    <span className="flex items-center gap-1.5 text-white/45 font-body text-xs">
                      <DollarSign className="w-3 h-3" /> S${Number(posting.monthly_allowance).toLocaleString("en-SG")}/mo
                    </span>
                    <span className="flex items-center gap-1.5 text-white/45 font-body text-xs">
                      <Clock className="w-3 h-3" /> {posting.duration_months} months
                    </span>
                    {posting.openings > 1 && (
                      <span className="text-white/35 font-body text-xs">{posting.openings} openings</span>
                    )}
                  </div>

                  {posting.skills_required.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {posting.skills_required.slice(0, 5).map(s => (
                        <span key={s} className="px-2 py-0.5 rounded-md bg-white/[0.04] border border-white/[0.07] text-white/40 font-body text-[11px]">{s}</span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Apply form — only for non-applied postings */}
                {!isApplied && isExpanded && (
                  <div className="px-5 pb-5 pt-0 border-t border-white/[0.07] space-y-3">
                    <div className="pt-4">
                      <label className="block font-body text-xs text-white/40 uppercase tracking-wider mb-2">Cover Note (optional)</label>
                      <textarea
                        value={coverNote[posting.id] ?? ""}
                        onChange={e => setCoverNote(c => ({ ...c, [posting.id]: e.target.value }))}
                        rows={3}
                        placeholder="Tell the employer why you're interested and what you'll bring to the role…"
                        className="w-full px-4 py-3 rounded-xl bg-white/[0.05] border border-white/[0.10] text-white/90 font-body text-sm placeholder:text-white/25 focus:outline-none focus:border-emerald-400/40 transition-all resize-none"
                      />
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setExpanded(null)}
                        className="px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white/45 font-body text-sm font-semibold hover:bg-white/[0.07] transition-all"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => apply(posting)}
                        disabled={!!applying}
                        className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500/15 border border-emerald-400/30 text-emerald-400 font-body text-sm font-semibold hover:bg-emerald-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      >
                        {applying === posting.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Briefcase className="w-4 h-4" />}
                        {applying === posting.id ? "Applying…" : "Apply Now"}
                      </button>
                    </div>
                  </div>
                )}

                {/* Tap to apply prompt */}
                {!isApplied && !isExpanded && (
                  <div className="px-5 pb-4 pt-0">
                    <button
                      onClick={() => setExpanded(posting.id)}
                      className="w-full flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-400/25 text-emerald-400 font-body text-sm font-semibold hover:bg-emerald-500/20 transition-all"
                    >
                      <Briefcase className="w-4 h-4" /> Apply
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
