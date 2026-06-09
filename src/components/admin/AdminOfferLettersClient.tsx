"use client";

import { useMemo, useState } from "react";
import {
  Search, Download, FileText, Building2, User,
  CalendarDays, ShieldAlert, Clock,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface LetterRow {
  id:             string;
  application_id: string;
  uploaded_by:    string | null;
  file_name:      string;
  file_size:      number | null;
  version:        number;
  notes:          string | null;
  expiry_date:    string | null;
  created_at:     string;
  // Nested joins (raw from Supabase — may be array)
  applications:   unknown;
  profiles:       unknown; // uploader
}

interface CollegeOption { id: string; name: string }

interface AuditRow {
  id:             string;
  application_id: string;
  actor_id:       string | null;
  actor_role:     string | null;
  action:         string;
  metadata:       Record<string, unknown> | null;
  created_at:     string;
  profiles:       unknown;
}

interface Props {
  letterRows: LetterRow[];
  colleges:   CollegeOption[];
  auditRows:  AuditRow[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtBytes(n: number | null) {
  if (!n) return "";
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / 1024 / 1024).toFixed(2)} MB`;
}

function fmtDate(s: string) {
  return new Date(s).toLocaleDateString("en-SG", { day: "numeric", month: "short", year: "numeric" });
}

function isExpired(d: string | null) {
  return d ? new Date(d) < new Date() : false;
}

type NormApp = {
  id: string; student_id: string; current_stage: string;
  course_title: string; college_id: string; college_name: string;
  student_name: string | null; student_email: string | null;
};

type NormLetter = {
  id: string; application_id: string; file_name: string;
  file_size: number | null; version: number; notes: string | null;
  expiry_date: string | null; created_at: string;
  uploader_name: string | null;
  app: NormApp;
};

function normalise(rows: LetterRow[]): NormLetter[] {
  return rows.map(row => {
    const rawApp   = (Array.isArray(row.applications) ? (row.applications as unknown[])[0] : row.applications) as Record<string, unknown> | null;
    const rawCourse = rawApp ? ((Array.isArray(rawApp.courses) ? (rawApp.courses as unknown[])[0] : rawApp.courses) as Record<string, unknown> | null) : null;
    const rawCollege = rawCourse ? ((Array.isArray(rawCourse.colleges) ? (rawCourse.colleges as unknown[])[0] : rawCourse.colleges) as Record<string, unknown> | null) : null;
    const rawStudent = rawApp ? ((Array.isArray(rawApp.profiles) ? (rawApp.profiles as unknown[])[0] : rawApp.profiles) as Record<string, unknown> | null) : null;
    const rawUploader = (Array.isArray(row.profiles) ? (row.profiles as unknown[])[0] : row.profiles) as Record<string, unknown> | null;

    return {
      id:             row.id,
      application_id: row.application_id,
      file_name:      row.file_name,
      file_size:      row.file_size,
      version:        row.version,
      notes:          row.notes,
      expiry_date:    row.expiry_date,
      created_at:     row.created_at,
      uploader_name:  (rawUploader?.full_name as string | null) ?? null,
      app: {
        id:            (rawApp?.id             as string) ?? row.application_id,
        student_id:    (rawApp?.student_id     as string) ?? "",
        current_stage: (rawApp?.current_stage  as string) ?? "",
        course_title:  (rawCourse?.title       as string) ?? "Unknown course",
        college_id:    (rawCourse?.college_id  as string) ?? "",
        college_name:  (rawCollege?.name       as string) ?? "Unknown college",
        student_name:  (rawStudent?.full_name  as string | null) ?? null,
        student_email: (rawStudent?.email      as string | null) ?? null,
      },
    };
  });
}

function normaliseAudit(rows: AuditRow[]) {
  return rows.map(row => {
    const rawActor = (Array.isArray(row.profiles) ? (row.profiles as unknown[])[0] : row.profiles) as Record<string, unknown> | null;
    return {
      ...row,
      actor_name: (rawActor?.full_name as string | null) ?? row.actor_id ?? "Unknown",
    };
  });
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AdminOfferLettersClient({ letterRows, colleges, auditRows }: Props) {
  const letters = useMemo(() => normalise(letterRows), [letterRows]);
  const audits  = useMemo(() => normaliseAudit(auditRows), [auditRows]);

  const [search,        setSearch]        = useState("");
  const [collegeFilter, setCollegeFilter] = useState("");
  const [statusFilter,  setStatusFilter]  = useState<"" | "active" | "expired">("");
  const [tab,           setTab]           = useState<"letters" | "audit">("letters");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return letters.filter(l => {
      if (collegeFilter && l.app.college_id !== collegeFilter) return false;
      if (statusFilter === "expired" && !isExpired(l.expiry_date)) return false;
      if (statusFilter === "active"  && isExpired(l.expiry_date))  return false;
      if (q) {
        const hay = [l.app.student_name, l.app.student_email, l.app.course_title, l.app.college_name, l.file_name]
          .filter(Boolean).join(" ").toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [letters, search, collegeFilter, statusFilter]);

  return (
    <div className="space-y-4">

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 rounded-xl bg-white/[0.04] border border-white/[0.08] w-fit">
        {(["letters", "audit"] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-lg font-body text-sm transition-all capitalize ${
              tab === t
                ? "bg-gold-400/15 border border-gold-400/30 text-gold-400"
                : "text-white/40 hover:text-white/65"
            }`}
          >
            {t === "letters" ? `Letters (${letters.length})` : `Audit Log (${audits.length})`}
          </button>
        ))}
      </div>

      {tab === "letters" && (
        <>
          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by student, course, college…"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white/[0.06] border border-white/[0.1] text-white placeholder-white/30 font-body text-sm focus:outline-none focus:border-gold-400/50 transition-colors"
              />
            </div>
            <select
              value={collegeFilter}
              onChange={e => setCollegeFilter(e.target.value)}
              className="px-3 py-2.5 rounded-xl bg-white/[0.06] border border-white/[0.1] text-white font-body text-sm focus:outline-none focus:border-gold-400/50 transition-colors"
            >
              <option value="">All colleges</option>
              {colleges.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as "" | "active" | "expired")}
              className="px-3 py-2.5 rounded-xl bg-white/[0.06] border border-white/[0.1] text-white font-body text-sm focus:outline-none focus:border-gold-400/50 transition-colors"
            >
              <option value="">All statuses</option>
              <option value="active">Active (not expired)</option>
              <option value="expired">Expired</option>
            </select>
          </div>

          {/* Summary */}
          <div className="flex items-center gap-4 flex-wrap">
            <p className="text-white/35 font-body text-xs">
              {filtered.length} offer letter{filtered.length !== 1 ? "s" : ""}{filtered.length !== letters.length ? ` (filtered from ${letters.length})` : ""}
            </p>
            <p className="text-amber-400/60 font-body text-xs">
              {letters.filter(l => isExpired(l.expiry_date)).length} expired
            </p>
          </div>

          {/* Table */}
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center py-16 rounded-2xl bg-white/[0.03] border border-white/[0.07] text-white/25">
              <FileText className="w-10 h-10 mb-3" />
              <p className="font-body text-sm">
                {letters.length === 0 ? "No offer letters issued yet" : "No results match these filters"}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map(l => {
                const expired = isExpired(l.expiry_date);
                return (
                  <div
                    key={l.id}
                    className={`p-4 rounded-2xl border ${
                      expired ? "bg-white/[0.02] border-white/[0.06]" : "bg-white/[0.04] border-white/[0.08]"
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      {/* Meta */}
                      <div className="space-y-2 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-body text-xs font-semibold text-white/80 truncate">{l.file_name}</span>
                          <span className="px-1.5 py-0.5 rounded-full bg-white/[0.07] border border-white/[0.1] text-white/45 font-body text-[10px]">v{l.version}</span>
                          {l.file_size && <span className="text-white/30 font-body text-[10px]">{fmtBytes(l.file_size)}</span>}
                          {expired && (
                            <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-red-500/10 border border-red-400/20 text-red-400 font-body text-[10px]">
                              <ShieldAlert className="w-2.5 h-2.5" /> Expired
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3 flex-wrap text-white/45 font-body text-xs">
                          <span className="flex items-center gap-1"><User className="w-3 h-3 flex-shrink-0" />{l.app.student_name ?? l.app.student_email ?? "Unknown student"}</span>
                          <span className="flex items-center gap-1"><Building2 className="w-3 h-3 flex-shrink-0" />{l.app.college_name}</span>
                          <span className="text-white/30 truncate max-w-[200px]">{l.app.course_title}</span>
                        </div>

                        <div className="flex items-center gap-3 flex-wrap text-white/30 font-body text-[11px]">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Issued {fmtDate(l.created_at)}
                            {l.uploader_name && ` by ${l.uploader_name}`}
                          </span>
                          {l.expiry_date && (
                            <span className={`flex items-center gap-1 ${expired ? "text-red-400/60" : "text-amber-400/60"}`}>
                              <CalendarDays className="w-3 h-3" />
                              {expired ? "Expired" : "Expires"} {fmtDate(l.expiry_date)}
                            </span>
                          )}
                          {l.notes && <span className="italic truncate max-w-[220px]">{l.notes}</span>}
                        </div>
                      </div>

                      {/* Download */}
                      <a
                        href={`/api/offer-letters/${l.id}/download`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-pathBlue-500/10 border border-pathBlue-500/20 text-pathBlue-400 font-body text-xs font-semibold hover:bg-pathBlue-500/20 transition-all whitespace-nowrap self-start"
                      >
                        <Download className="w-3.5 h-3.5" /> Download
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {tab === "audit" && (
        <div className="space-y-2">
          {audits.length === 0 ? (
            <div className="flex flex-col items-center py-16 rounded-2xl bg-white/[0.03] border border-white/[0.07] text-white/25">
              <Clock className="w-10 h-10 mb-3" />
              <p className="font-body text-sm">No audit events yet</p>
            </div>
          ) : (
            audits.map(a => {
              const meta = a.metadata ?? {};
              return (
                <div key={a.id} className="flex items-start gap-3 p-4 rounded-xl bg-white/[0.03] border border-white/[0.07]">
                  <div className="w-7 h-7 rounded-lg bg-gold-400/10 border border-gold-400/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <FileText className="w-3.5 h-3.5 text-gold-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-body text-xs font-semibold text-white/75">{a.actor_name}</span>
                      <span className="text-white/30 font-body text-xs capitalize">{a.actor_role}</span>
                      <span className="text-white/25 font-body text-[10px]">
                        {new Date(a.created_at).toLocaleString("en-SG")}
                      </span>
                    </div>
                    <p className="text-white/45 font-body text-xs mt-0.5">
                      Uploaded offer letter
                      {(meta.file_name as string | undefined) ? ` "${meta.file_name}"` : ""}
                      {(meta.version as number | undefined) ? ` (v${meta.version})` : ""}
                      {(meta.file_size as number | undefined) ? ` · ${fmtBytes(meta.file_size as number)}` : ""}
                    </p>
                    <p className="text-white/25 font-body text-[10px] mt-0.5 font-mono">{a.application_id}</p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
