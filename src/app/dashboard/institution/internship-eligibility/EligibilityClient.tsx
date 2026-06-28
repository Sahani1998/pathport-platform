"use client";

import { useState } from "react";
import {
  GraduationCap, CheckCircle2, AlertCircle, Clock, Loader2, XCircle,
} from "lucide-react";

type StudentRow = {
  applicationId: string;
  studentId:     string;
  currentStage:  string;
  fullName:      string;
  email:         string;
  country:       string | null;
  courseTitle:   string;
  collegeName:   string;
  eligibility:   Record<string, unknown> | null;
};

type EligStatus = "not_eligible" | "eligible" | "suspended" | null;

export type EligibilityDiagnostics =
  | { reason: "no_college" }
  | { reason: "no_courses" }
  | { reason: "none_enrolled"; activeStudents: number; stageBreakdown: { label: string; count: number }[] };

const STATUS_META: Record<string, { label: string; badge: string; icon: React.ElementType }> = {
  eligible:    { label: "Eligible",     badge: "text-emerald-400 bg-emerald-500/10 border-emerald-400/25", icon: CheckCircle2 },
  suspended:   { label: "Suspended",    badge: "text-orange-400 bg-orange-500/10 border-orange-400/25",   icon: AlertCircle  },
  not_eligible:{ label: "Not Eligible", badge: "text-white/40   bg-white/[0.04]  border-white/[0.08]",   icon: Clock        },
};

export default function EligibilityClient({
  students,
  diagnostics,
}: {
  students: StudentRow[];
  diagnostics?: EligibilityDiagnostics;
}) {
  const [rows, setRows]                   = useState(students);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionError, setActionError]     = useState<string | null>(null);
  const [suspendReason, setSuspendReason] = useState<string>("");
  const [suspendTarget, setSuspendTarget] = useState<StudentRow | null>(null);

  function getStatus(row: StudentRow): EligStatus {
    if (row.eligibility?.status) return row.eligibility.status as EligStatus;
    return null;
  }

  async function enableStudent(row: StudentRow) {
    setActionLoading(row.studentId); setActionError(null);
    try {
      const res = await fetch("/api/institution/internship-eligibility", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ student_id: row.studentId, application_id: row.applicationId }),
      });
      if (!res.ok) { const { error: e } = await res.json(); throw new Error(e); }
      const { eligibility } = await res.json();
      setRows(rs => rs.map(r => r.studentId === row.studentId ? { ...r, eligibility } : r));
    } catch (e) {
      setActionError(String(e));
    } finally {
      setActionLoading(null);
    }
  }

  async function doSuspend() {
    if (!suspendTarget) return;
    const row = suspendTarget;
    setActionLoading(row.studentId); setActionError(null);
    setSuspendTarget(null);
    try {
      const { eligibility } = row;
      const id = eligibility?.id as string;
      const res = await fetch(`/api/institution/internship-eligibility/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "suspend", suspension_reason: suspendReason || null }),
      });
      if (!res.ok) { const { error: e } = await res.json(); throw new Error(e); }
      const { eligibility: updated } = await res.json();
      setRows(rs => rs.map(r => r.studentId === row.studentId ? { ...r, eligibility: updated } : r));
      setSuspendReason("");
    } catch (e) {
      setActionError(String(e));
    } finally {
      setActionLoading(null);
    }
  }

  async function resumeStudent(row: StudentRow) {
    setActionLoading(row.studentId); setActionError(null);
    try {
      const id = row.eligibility?.id as string;
      const res = await fetch(`/api/institution/internship-eligibility/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "resume" }),
      });
      if (!res.ok) { const { error: e } = await res.json(); throw new Error(e); }
      const { eligibility: updated } = await res.json();
      setRows(rs => rs.map(r => r.studentId === row.studentId ? { ...r, eligibility: updated } : r));
    } catch (e) {
      setActionError(String(e));
    } finally {
      setActionLoading(null);
    }
  }

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <h2 className="font-display text-3xl text-white mb-1">Internship Eligibility</h2>
        <p className="text-white/40 font-body text-sm">Manage which enrolled students can access the internship marketplace</p>
      </div>

      {actionError && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-400/25">
          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
          <p className="font-body text-sm text-red-300">{actionError}</p>
        </div>
      )}

      {/* Suspend modal */}
      {suspendTarget && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-navy-900 border border-white/[0.10] rounded-2xl p-6 max-w-md w-full space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-display text-xl text-white mb-1">Suspend Internship Access</h3>
                <p className="font-body text-sm text-white/50">For {suspendTarget.fullName}</p>
              </div>
              <button onClick={() => setSuspendTarget(null)} className="text-white/30 hover:text-white/60 transition-colors">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <div>
              <label className="block font-body text-xs text-white/50 uppercase tracking-wider mb-2">Reason (optional)</label>
              <textarea
                value={suspendReason}
                onChange={e => setSuspendReason(e.target.value)}
                rows={3}
                placeholder="e.g. Attendance concerns, academic requirements not met..."
                className="w-full px-4 py-3 rounded-xl bg-white/[0.05] border border-white/[0.10] text-white/90 font-body text-sm placeholder:text-white/25 focus:outline-none focus:border-orange-400/40 transition-all resize-none"
              />
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSuspendTarget(null)}
                className="flex-1 px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white/50 font-body text-sm font-semibold hover:bg-white/[0.07] transition-all"
              >
                Cancel
              </button>
              <button
                onClick={doSuspend}
                className="flex-1 px-4 py-2.5 rounded-xl bg-orange-500/15 border border-orange-400/30 text-orange-400 font-body text-sm font-semibold hover:bg-orange-500/25 transition-all"
              >
                Suspend Access
              </button>
            </div>
          </div>
        </div>
      )}

      {rows.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-6 bg-white/[0.03] border border-white/[0.07] rounded-2xl text-center">
          <GraduationCap className="w-10 h-10 text-white/20 mb-3" />
          <p className="font-display text-xl text-white/40">No enrolled students found</p>

          {diagnostics?.reason === "no_college" ? (
            <p className="text-white/30 font-body text-sm mt-2 max-w-md">
              Your account isn&apos;t linked to a college yet, so we can&apos;t show its students.
              Ask your PathPort admin to link your institution account to a college.
            </p>
          ) : diagnostics?.reason === "no_courses" ? (
            <p className="text-white/30 font-body text-sm mt-2 max-w-md">
              Your college has no courses set up yet. Add courses (and students will be
              matched to them) before managing internship access.
            </p>
          ) : diagnostics?.reason === "none_enrolled" && diagnostics.activeStudents > 0 ? (
            <div className="mt-2 max-w-md">
              <p className="text-white/35 font-body text-sm">
                You have {diagnostics.activeStudents} active student{diagnostics.activeStudents !== 1 ? "s" : ""}, but
                none have reached the <span className="text-white/60 font-semibold">Enrolled</span> stage yet —
                that&apos;s the gate for internship access.
              </p>
              <div className="mt-3 inline-flex flex-col items-start gap-1 rounded-xl bg-white/[0.03] border border-white/[0.07] px-4 py-3">
                <p className="text-white/30 font-body text-[10px] uppercase tracking-wider mb-1">Current stages</p>
                {diagnostics.stageBreakdown.map(s => (
                  <p key={s.label} className="font-body text-xs text-white/55">
                    {s.count} × <span className="text-white/75">{s.label}</span>
                  </p>
                ))}
              </div>
              <p className="text-white/30 font-body text-xs mt-3">
                Advance a student to <span className="text-white/60 font-semibold">Enrolled</span> on the
                Applications page and they&apos;ll appear here automatically.
              </p>
            </div>
          ) : (
            <p className="text-white/30 font-body text-sm mt-1">Students appear here once they reach the enrolled stage.</p>
          )}
        </div>
      ) : (
        <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-white/[0.07]">
            <p className="font-body text-sm text-white/40">{rows.length} enrolled student{rows.length !== 1 ? "s" : ""}</p>
          </div>
          <div className="divide-y divide-white/[0.05]">
            {rows.map(row => {
              const status    = getStatus(row);
              const meta      = status ? STATUS_META[status] : STATUS_META.not_eligible;
              const StatusIcon = meta?.icon ?? Clock;
              const isLoading = actionLoading === row.studentId;

              return (
                <div key={row.studentId} className="px-6 py-4 flex items-center justify-between gap-4 hover:bg-white/[0.02] transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-pathBlue-500 to-pathBlue-700 flex items-center justify-center flex-shrink-0 text-white font-display font-bold text-sm">
                      {row.fullName[0]?.toUpperCase() ?? "S"}
                    </div>
                    <div className="min-w-0">
                      <p className="font-body font-semibold text-sm text-white/85 truncate">{row.fullName}</p>
                      <p className="font-body text-xs text-white/40 truncate mt-0.5">
                        {row.courseTitle} · {row.currentStage.replace(/_/g," ").replace(/\b\w/g,l=>l.toUpperCase())}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border font-body text-xs font-semibold ${meta?.badge}`}>
                      <StatusIcon className="w-3 h-3" />
                      {meta?.label}
                    </span>

                    {isLoading ? (
                      <Loader2 className="w-4 h-4 text-white/30 animate-spin" />
                    ) : status === "eligible" ? (
                      <button
                        onClick={() => setSuspendTarget(row)}
                        className="px-3 py-1.5 rounded-lg bg-orange-500/10 border border-orange-400/20 text-orange-400/80 font-body text-xs font-semibold hover:bg-orange-500/15 transition-all"
                      >
                        Suspend
                      </button>
                    ) : status === "suspended" ? (
                      <button
                        onClick={() => resumeStudent(row)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-400/25 text-emerald-400 font-body text-xs font-semibold hover:bg-emerald-500/15 transition-all"
                      >
                        Resume
                      </button>
                    ) : (
                      <button
                        onClick={() => enableStudent(row)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-400/25 text-emerald-400 font-body text-xs font-semibold hover:bg-emerald-500/15 transition-all"
                      >
                        Enable
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
