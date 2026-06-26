"use client";

import { useState, useMemo } from "react";
import { FileText, Search, Building2, Filter } from "lucide-react";

export interface PartnerApplication {
  id: string;
  public_id: string | null;
  current_stage: string | null;
  status: string;
  submitted_at: string;
  updated_at: string;
  student: {
    id: string;
    full_name: string | null;
    email: string;
    country: string | null;
  };
  course: {
    id: string;
    title: string;
    category: string;
    level: string;
    tuition_fee: number;
    college: {
      name: string;
      logo_url: string | null;
    };
  } | null;
}

const STAGE_LABEL: Record<string, string> = {
  application_submitted:        "Submitted",
  documents_pending:            "Docs Pending",
  documents_under_review:       "Under Review",
  documents_verified:           "Docs Verified",
  application_under_review:     "Under Review",
  conditional_offer_issued:     "Conditional Offer",
  offer_letter_ready:           "Offer Ready",
  fee_payment_pending:          "Fee Pending",
  fee_payment_received:         "Fee Received",
  ipa_processing:               "IPA Processing",
  ipa_approved:                 "IPA Approved",
  visa_guidance:                "Visa Guidance",
  pre_departure_briefing:       "Pre-Departure",
  arrival_preparation:          "Arriving",
  arrived_singapore:            "Arrived",
  approved:                     "Approved",
  rejected:                     "Rejected",
  withdrawn:                    "Withdrawn",
};

const STAGE_COLOR: Record<string, string> = {
  approved:              "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  arrived_singapore:     "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  arrival_preparation:   "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  offer_letter_ready:    "bg-gold-400/15 text-gold-400 border-gold-400/30",
  ipa_approved:          "bg-gold-400/15 text-gold-400 border-gold-400/30",
  rejected:              "bg-red-500/15 text-red-400 border-red-500/30",
  withdrawn:             "bg-white/10 text-white/40 border-white/20",
};

const DEFAULT_COLOR = "bg-pathBlue-500/15 text-pathBlue-400 border-pathBlue-500/30";

const STAGE_OPTIONS = ["all", "active", "approved", "rejected"] as const;
type StageFilter = typeof STAGE_OPTIONS[number];

interface Props {
  initialRows: PartnerApplication[];
}

export default function ApplicationsClient({ initialRows }: Props) {
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState<StageFilter>("all");

  const filtered = useMemo(() => {
    let rows = initialRows;
    if (stageFilter === "active") {
      rows = rows.filter(r => !["rejected","withdrawn","approved","arrived_singapore"].includes(r.current_stage ?? r.status ?? ""));
    } else if (stageFilter === "approved") {
      rows = rows.filter(r => ["approved","arrived_singapore","arrival_preparation"].includes(r.current_stage ?? ""));
    } else if (stageFilter === "rejected") {
      rows = rows.filter(r => ["rejected","withdrawn"].includes(r.current_stage ?? r.status ?? ""));
    }
    const q = search.toLowerCase().trim();
    if (!q) return rows;
    return rows.filter(r =>
      (r.student.full_name ?? "").toLowerCase().includes(q) ||
      r.student.email.toLowerCase().includes(q) ||
      (r.course?.title ?? "").toLowerCase().includes(q) ||
      (r.course?.college.name ?? "").toLowerCase().includes(q) ||
      (r.public_id ?? "").toLowerCase().includes(q)
    );
  }, [initialRows, search, stageFilter]);

  const stage = (r: PartnerApplication) => r.current_stage ?? r.status ?? "application_submitted";

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div>
        <h2 className="font-display text-3xl text-white mb-1 flex items-center gap-3">
          <FileText className="w-7 h-7 text-gold-400" />
          Applications
        </h2>
        <p className="text-white/45 font-body text-sm">
          {initialRows.length} application{initialRows.length !== 1 ? "s" : ""} across your students
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 bg-white/[0.05] border border-white/[0.08] rounded-xl px-3 py-2.5 w-64">
          <Search className="w-3.5 h-3.5 text-white/30 flex-shrink-0" />
          <input
            type="text"
            placeholder="Search by student or course…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="bg-transparent text-white/70 placeholder-white/25 font-body text-sm flex-1 min-w-0 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 bg-white/[0.05] border border-white/[0.08] rounded-xl px-3 py-2.5">
          <Filter className="w-3.5 h-3.5 text-white/30" />
          <select
            value={stageFilter}
            onChange={e => setStageFilter(e.target.value as StageFilter)}
            className="bg-transparent text-white/70 font-body text-sm focus:outline-none cursor-pointer"
          >
            <option value="all" className="bg-navy-900">All Statuses</option>
            <option value="active" className="bg-navy-900">Active</option>
            <option value="approved" className="bg-navy-900">Approved</option>
            <option value="rejected" className="bg-navy-900">Rejected / Withdrawn</option>
          </select>
        </div>

        <p className="text-white/30 font-body text-xs ml-auto">
          {filtered.length} of {initialRows.length} shown
        </p>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-12 flex flex-col items-center text-center gap-4">
          <FileText className="w-10 h-10 text-white/20" />
          <div>
            <p className="font-display text-xl text-white/40 mb-1">
              {search || stageFilter !== "all" ? "No applications found" : "No applications yet"}
            </p>
            <p className="text-white/25 font-body text-sm">
              {search || stageFilter !== "all" ? "Try adjusting your filters" : "Applications will appear here once your students apply"}
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(app => {
            const s = stage(app);
            const color = STAGE_COLOR[s] ?? DEFAULT_COLOR;
            return (
              <div key={app.id} className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-5 hover:bg-white/[0.06] transition-colors">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  {/* Left: student + course */}
                  <div className="flex items-start gap-4 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-pathBlue-500/15 border border-pathBlue-500/25 flex items-center justify-center flex-shrink-0">
                      <Building2 className="w-4.5 h-4.5 text-pathBlue-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-body font-semibold text-sm text-white/85">{app.student.full_name ?? "—"}</p>
                      <p className="font-body text-xs text-white/40 mt-0.5">{app.student.email}</p>
                      <p className="font-body text-sm text-white/70 mt-1 font-medium">{app.course?.title ?? "—"}</p>
                      <p className="font-body text-xs text-white/40">{app.course?.college.name ?? "—"}</p>
                    </div>
                  </div>
                  {/* Right: stage + date */}
                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full border font-body text-xs font-semibold ${color}`}>
                      {STAGE_LABEL[s] ?? s.replace(/_/g, " ")}
                    </span>
                    {app.public_id && (
                      <span className="font-mono text-white/25 text-[10px]">{app.public_id}</span>
                    )}
                    <p className="text-white/30 font-body text-xs">
                      {new Date(app.submitted_at).toLocaleDateString("en-SG", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
