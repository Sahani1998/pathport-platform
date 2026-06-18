"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Archive, RotateCcw, Loader2, AlertTriangle, CheckCircle2 } from "lucide-react";
import type { ApplicationOutcome } from "@/types/courses";

interface Props {
  applicationId: string;
  archived:      boolean;
  outcome:       string | null;
  archiveReason: string | null;
}

const OUTCOME_OPTIONS: { value: ApplicationOutcome; label: string }[] = [
  { value: "not_interested",          label: "Not Interested"         },
  { value: "archived_lead",           label: "Archived Lead"          },
  { value: "rejected_by_institution", label: "Not Progressed"         },
];

export default function ApplicationArchivePanel({
  applicationId,
  archived,
  outcome,
  archiveReason,
}: Props) {
  const router = useRouter();

  const [showForm, setShowForm]     = useState(false);
  const [selOutcome, setSelOutcome] = useState<ApplicationOutcome>("not_interested");
  const [reason, setReason]         = useState("");
  const [busy, setBusy]             = useState(false);
  const [error, setError]           = useState<string | null>(null);
  const [success, setSuccess]       = useState<string | null>(null);

  const handleArchive = async () => {
    if (!reason.trim()) { setError("Reason is required"); return; }
    setBusy(true);
    setError(null);
    setSuccess(null);
    try {
      const res  = await fetch(`/api/applications/${applicationId}/archive`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ outcome: selOutcome, reason: reason.trim() }),
      });
      const data = await res.json() as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Archive failed");
      setSuccess("Application archived.");
      setShowForm(false);
      setReason("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Archive failed");
    } finally {
      setBusy(false);
    }
  };

  const handleRestore = async () => {
    if (!confirm("Restore this application to the active queue?")) return;
    setBusy(true);
    setError(null);
    setSuccess(null);
    try {
      const res  = await fetch(`/api/applications/${applicationId}/restore`, { method: "POST" });
      const data = await res.json() as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Restore failed");
      setSuccess("Application restored to active queue.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Restore failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-5 space-y-3">
      <div className="flex items-center gap-2">
        <Archive className={`w-4 h-4 ${archived ? "text-amber-400" : "text-white/40"}`} />
        <h3 className="font-display text-xl text-white">Lead Management</h3>
      </div>

      {archived ? (
        <div className="space-y-2">
          <div className="p-3 rounded-xl bg-amber-500/[0.06] border border-amber-400/20">
            <p className="font-body text-xs text-amber-200/80 font-semibold mb-0.5">This application is archived</p>
            {outcome && (
              <p className="font-body text-[10px] text-white/40">
                Outcome: {OUTCOME_OPTIONS.find(o => o.value === outcome)?.label ?? outcome}
              </p>
            )}
            {archiveReason && (
              <p className="font-body text-[10px] text-white/35 mt-0.5">Reason: {archiveReason}</p>
            )}
          </div>
          {error   && <p className="text-red-400   font-body text-xs">{error}</p>}
          {success && (
            <div className="flex items-center gap-1.5 text-emerald-400 font-body text-xs">
              <CheckCircle2 className="w-3.5 h-3.5" /> {success}
            </div>
          )}
          <button
            type="button"
            onClick={handleRestore}
            disabled={busy}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-400/25 text-emerald-400 font-body text-xs font-semibold hover:bg-emerald-500/20 transition-all disabled:opacity-50"
          >
            {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
            Restore to Active Queue
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-white/35 font-body text-xs">
            Archive this application to remove it from the active queue. Use when a lead has gone cold, the student is not interested, or the application is not progressing.
          </p>
          {!showForm ? (
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl border border-white/[0.1] text-white/40 font-body text-xs hover:text-amber-400 hover:border-amber-400/25 hover:bg-amber-500/[0.05] transition-all"
            >
              <Archive className="w-3.5 h-3.5" /> Archive Application
            </button>
          ) : (
            <div className="space-y-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.07]">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400 mt-0.5 flex-shrink-0" />
                <p className="font-body text-[11px] text-amber-200/70">
                  The student will be notified. This application will be hidden from the active pipeline. You can restore it at any time.
                </p>
              </div>
              <div>
                <label className="block text-white/40 font-body text-[10px] uppercase tracking-wider mb-1">Outcome</label>
                <select
                  value={selOutcome}
                  onChange={e => setSelOutcome(e.target.value as ApplicationOutcome)}
                  className="w-full bg-white/[0.06] border border-white/[0.10] rounded-xl px-2.5 py-2 font-body text-xs text-white focus:outline-none focus:border-amber-400/50 [color-scheme:dark]"
                >
                  {OUTCOME_OPTIONS.map(o => (
                    <option key={o.value} value={o.value} style={{ backgroundColor: "#0a1024", color: "#fff" }}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-white/40 font-body text-[10px] uppercase tracking-wider mb-1">Reason *</label>
                <input
                  type="text"
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  maxLength={500}
                  placeholder="e.g. Student confirmed no longer interested"
                  className="w-full bg-white/[0.06] border border-white/[0.10] rounded-xl px-3 py-2 font-body text-xs text-white placeholder-white/25 focus:outline-none focus:border-amber-400/50"
                />
              </div>
              {error && <p className="text-red-400 font-body text-xs">{error}</p>}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleArchive}
                  disabled={busy || !reason.trim()}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-400/30 text-amber-400 font-body text-xs font-semibold hover:bg-amber-500/20 transition-all disabled:opacity-50"
                >
                  {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Archive className="w-3.5 h-3.5" />}
                  Confirm Archive
                </button>
                <button
                  type="button"
                  onClick={() => { setShowForm(false); setReason(""); setError(null); }}
                  className="px-3 py-2 rounded-xl border border-white/[0.1] text-white/40 font-body text-xs hover:text-white/70 transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
          {success && (
            <div className="flex items-center gap-1.5 text-emerald-400 font-body text-xs">
              <CheckCircle2 className="w-3.5 h-3.5" /> {success}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
