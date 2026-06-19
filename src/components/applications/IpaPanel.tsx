"use client";

import { useState, useRef, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { BadgeCheck, Loader2, Upload, Download, FileText, Send, Archive, XCircle } from "lucide-react";
import { IPA_STATUS_META, IPA_LIFECYCLE_META } from "@/types/application-processing";
import type { IpaRecord, IpaStatus, IpaLifecycleStatus } from "@/types/application-processing";
import { fmtFileSize } from "@/types/documents";
import { cn } from "@/lib/utils";

interface Props {
  applicationId: string;
  records:       IpaRecord[];
}

function fmtDate(s: string) {
  return new Date(s).toLocaleDateString("en-SG", { day: "numeric", month: "short", year: "numeric" });
}

const STATUS_OPTIONS: IpaStatus[] = ["submitted", "pending", "approved", "rejected"];

export default function IpaPanel({ applicationId, records }: Props) {
  const router   = useRouter();
  const fileRef  = useRef<HTMLInputElement>(null);

  const [showForm,      setShowForm]      = useState(false);
  const [notes,         setNotes]         = useState("");
  const [uploading,     setUploading]     = useState(false);
  const [updating,      setUpdating]      = useState<string | null>(null);
  const [error,         setError]         = useState<string | null>(null);
  const [success,       setSuccess]       = useState<string | null>(null);
  const [statusDraft,   setStatusDraft]   = useState<Record<string, IpaStatus>>({});
  const [notesDraft,    setNotesDraft]    = useState<Record<string, string>>({});
  const [voidReason,    setVoidReason]    = useState<Record<string, string>>({});
  const [archReason,    setArchReason]    = useState<Record<string, string>>({});
  const [showVoidForm,  setShowVoidForm]  = useState<string | null>(null);
  const [showArchForm,  setShowArchForm]  = useState<string | null>(null);

  const upload = async (e: FormEvent) => {
    e.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!file) { setError("Please choose a PDF file"); return; }
    setError(null);
    setSuccess(null);
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      if (notes.trim()) formData.append("notes", notes.trim());

      const res  = await fetch(`/api/applications/${applicationId}/ipa`, { method: "POST", body: formData });
      const json = await res.json() as { error?: string };
      if (!res.ok) { setError(json.error ?? `Server error (${res.status})`); return; }
      setShowForm(false);
      setNotes("");
      if (fileRef.current) fileRef.current.value = "";
      setSuccess("IPA uploaded — student notified.");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Network error");
    } finally {
      setUploading(false);
    }
  };

  const updateStatus = async (record: IpaRecord) => {
    const newStatus = statusDraft[record.id];
    if (!newStatus || newStatus === record.status) return;
    setError(null);
    setSuccess(null);
    setUpdating(record.id);
    try {
      const res  = await fetch(`/api/ipa/${record.id}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ status: newStatus, notes: (notesDraft[record.id] ?? "").trim() || null }),
      });
      const json = await res.json() as { error?: string };
      if (!res.ok) { setError(json.error ?? `Server error (${res.status})`); return; }
      setSuccess("ICA status updated.");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Network error");
    } finally {
      setUpdating(null);
    }
  };

  const callLifecycle = async (
    recordId: string,
    action: string,
    extra?: Record<string, string>,
  ) => {
    setUpdating(recordId);
    setError(null);
    setSuccess(null);
    try {
      const res  = await fetch(`/api/ipa/${recordId}/lifecycle`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ action, ...extra }),
      });
      const json = await res.json() as { error?: string; lifecycle_status?: string };
      if (!res.ok) throw new Error(json.error ?? "Action failed");
      setShowVoidForm(null);
      setShowArchForm(null);
      setVoidReason(r => { const n = { ...r }; delete n[recordId]; return n; });
      setArchReason(r => { const n = { ...r }; delete n[recordId]; return n; });
      setSuccess(
        action === "issue"     ? "IPA issued — student notified." :
        action === "archive"   ? "IPA archived." :
        action === "void"      ? "IPA voided." : "Done.",
      );
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Action failed");
    } finally {
      setUpdating(null);
    }
  };

  // Sort: issued/draft first, then superseded/archived/void
  const sortedRecords = [...records].sort((a, b) => {
    const order: Record<IpaLifecycleStatus, number> = {
      issued: 0, draft: 1, superseded: 2, archived: 3, void: 4,
    };
    const aO = order[(a.lifecycle_status ?? "issued") as IpaLifecycleStatus] ?? 5;
    const bO = order[(b.lifecycle_status ?? "issued") as IpaLifecycleStatus] ?? 5;
    return aO !== bO ? aO - bO : new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return (
    <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <BadgeCheck className="w-4 h-4 text-purple-400" />
          <h3 className="font-display text-xl text-white">IPA</h3>
        </div>
        <button
          type="button"
          onClick={() => setShowForm(v => !v)}
          className="px-3 py-1.5 rounded-xl bg-purple-500/10 border border-purple-400/25 text-purple-400 font-body text-xs font-semibold hover:bg-purple-500/20 transition-all"
        >
          {showForm ? "Close" : "+ Upload IPA"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={upload} className="space-y-3 p-4 rounded-xl bg-white/[0.03] border border-white/[0.07]">
          <div>
            <label className="block text-white/45 font-body text-xs mb-1">IPA Letter (PDF, max 10 MB)</label>
            <input
              ref={fileRef}
              type="file" accept="application/pdf" required
              className="w-full text-white/55 font-body text-xs file:mr-3 file:px-3 file:py-1.5 file:rounded-xl file:border file:border-purple-400/30 file:bg-purple-500/10 file:text-purple-400 file:font-body file:text-xs file:font-semibold file:cursor-pointer file:border-solid"
            />
          </div>
          <div>
            <label className="block text-white/45 font-body text-xs mb-1">Notes (optional)</label>
            <textarea
              rows={2} maxLength={2000}
              value={notes} onChange={e => setNotes(e.target.value)}
              placeholder="Internal notes about this IPA submission…"
              className="w-full bg-white/[0.06] border border-white/[0.10] rounded-xl px-3 py-2 font-body text-xs text-white placeholder-white/25 focus:outline-none focus:border-purple-400/50 resize-none"
            />
          </div>
          <button
            type="submit" disabled={uploading}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-purple-500/15 border border-purple-400/30 text-purple-400 font-body text-xs font-semibold hover:bg-purple-500/25 transition-all disabled:opacity-50"
          >
            {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <><Upload className="w-3.5 h-3.5" /> Upload IPA</>}
          </button>
        </form>
      )}

      {error   && <p className="text-red-400   font-body text-xs">{error}</p>}
      {success && <p className="text-emerald-400 font-body text-xs">{success}</p>}

      {records.length === 0 ? (
        <p className="text-white/30 font-body text-xs">No IPA submitted yet. Upload after fee payment is confirmed.</p>
      ) : (
        <div className="space-y-2">
          {sortedRecords.map(record => {
            const statusMeta    = IPA_STATUS_META[record.status];
            const lifecycleMeta = IPA_LIFECYCLE_META[(record.lifecycle_status ?? "issued") as IpaLifecycleStatus];
            const icaDraft      = statusDraft[record.id] ?? record.status;
            const isIcaTerminal = record.status === "approved";
            const lifecycle     = (record.lifecycle_status ?? "issued") as IpaLifecycleStatus;
            const isActive      = lifecycle === "issued" || lifecycle === "draft";

            return (
              <div
                key={record.id}
                className={cn(
                  "p-3 rounded-xl border space-y-2",
                  lifecycle === "issued"     ? "bg-white/[0.03] border-white/[0.07]" :
                  lifecycle === "draft"      ? "bg-gold-400/[0.03] border-gold-400/15" :
                  lifecycle === "void"       ? "bg-red-500/[0.03] border-red-400/15 opacity-60" :
                  lifecycle === "archived"   ? "bg-white/[0.02] border-white/[0.05] opacity-60" :
                                              "bg-white/[0.02] border-white/[0.06] opacity-60",
                )}
              >
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className="w-3.5 h-3.5 text-white/40 flex-shrink-0" />
                    <p className="font-body text-xs text-white/70 truncate">{record.file_name}</p>
                    {record.file_size && (
                      <span className="text-white/30 font-body text-[10px]">({fmtFileSize(record.file_size)})</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className={cn("px-2 py-0.5 rounded-full border font-body text-[10px] font-semibold", statusMeta.color)}>
                      {statusMeta.label}
                    </span>
                    {lifecycle !== "issued" && (
                      <span className={cn("px-2 py-0.5 rounded-full border font-body text-[10px] font-semibold", lifecycleMeta.color)}>
                        {lifecycleMeta.label}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-white/25 font-body text-[10px]">Uploaded {fmtDate(record.created_at)}</span>
                  {record.decided_at && (
                    <span className="text-white/25 font-body text-[10px]">Decided {fmtDate(record.decided_at)}</span>
                  )}
                  <a
                    href={`/api/ipa/${record.id}/download`}
                    target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-pathBlue-400/70 hover:text-pathBlue-300 font-body text-[10px] transition-colors"
                  >
                    <Download className="w-2.5 h-2.5" /> Download
                  </a>
                </div>

                {record.notes && <p className="text-white/40 font-body text-[11px]">{record.notes}</p>}
                {record.void_reason    && <p className="text-red-400/60   font-body text-[10px]">Void reason: {record.void_reason}</p>}
                {record.archive_reason && <p className="text-white/30     font-body text-[10px]">Archive reason: {record.archive_reason}</p>}

                {/* ICA decision update (only for active issued records, non-terminal) */}
                {isActive && !isIcaTerminal && (
                  <div className="flex gap-2 items-center pt-1 flex-wrap border-t border-white/[0.06]">
                    <select
                      value={icaDraft}
                      onChange={e => setStatusDraft(d => ({ ...d, [record.id]: e.target.value as IpaStatus }))}
                      className="bg-white/[0.06] border border-white/[0.10] rounded-xl px-2.5 py-1.5 font-body text-[11px] text-white focus:outline-none focus:border-purple-400/50 [color-scheme:dark]"
                    >
                      {STATUS_OPTIONS.map(s => (
                        <option key={s} value={s} style={{ backgroundColor: "#0a1024", color: "#fff" }}>
                          {IPA_STATUS_META[s].label}
                        </option>
                      ))}
                    </select>
                    {icaDraft === "rejected" && (
                      <input
                        type="text"
                        value={notesDraft[record.id] ?? ""}
                        onChange={e => setNotesDraft(d => ({ ...d, [record.id]: e.target.value }))}
                        placeholder="Rejection reason (required)…"
                        className="flex-1 min-w-[140px] bg-white/[0.06] border border-red-400/25 rounded-xl px-2.5 py-1.5 font-body text-[11px] text-white placeholder-white/25 focus:outline-none focus:border-red-400/50"
                      />
                    )}
                    <button
                      type="button"
                      onClick={() => updateStatus(record)}
                      disabled={
                        updating === record.id ||
                        icaDraft === record.status ||
                        (icaDraft === "rejected" && !(notesDraft[record.id] ?? "").trim())
                      }
                      className="px-3 py-1.5 rounded-xl bg-purple-500/15 border border-purple-400/30 text-purple-400 font-body text-[11px] font-semibold hover:bg-purple-500/25 transition-all disabled:opacity-40"
                    >
                      {updating === record.id ? <Loader2 className="w-3 h-3 animate-spin" /> : "Update ICA Status"}
                    </button>
                  </div>
                )}

                {/* Lifecycle: Draft → Issue */}
                {lifecycle === "draft" && (
                  <div className="flex gap-2 pt-1 border-t border-white/[0.06]">
                    <button
                      type="button"
                      onClick={() => callLifecycle(record.id, "issue")}
                      disabled={updating === record.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-400/25 text-emerald-400 font-body text-[11px] font-semibold hover:bg-emerald-500/20 transition-all disabled:opacity-40"
                    >
                      {updating === record.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <><Send className="w-3 h-3" /> Issue to Student</>}
                    </button>
                  </div>
                )}

                {/* Lifecycle: Archive / Void for active records */}
                {isActive && (
                  <div className="flex gap-2 flex-wrap pt-1 border-t border-white/[0.06]">
                    {showArchForm !== record.id ? (
                      <button
                        type="button"
                        onClick={() => { setShowArchForm(record.id); setShowVoidForm(null); }}
                        className="flex items-center gap-1 px-2 py-1 rounded-lg border border-white/[0.1] text-white/35 font-body text-[10px] hover:text-amber-400 hover:border-amber-400/25 transition-all"
                      >
                        <Archive className="w-3 h-3" /> Archive
                      </button>
                    ) : (
                      <div className="flex gap-2 w-full flex-wrap">
                        <input
                          type="text"
                          value={archReason[record.id] ?? ""}
                          onChange={e => setArchReason(r => ({ ...r, [record.id]: e.target.value }))}
                          placeholder="Archive reason (required)…"
                          className="flex-1 min-w-[160px] bg-white/[0.06] border border-amber-400/25 rounded-xl px-2.5 py-1.5 font-body text-[11px] text-white placeholder-white/25 focus:outline-none focus:border-amber-400/50"
                        />
                        <button
                          type="button"
                          onClick={() => callLifecycle(record.id, "archive", { reason: archReason[record.id] ?? "" })}
                          disabled={updating === record.id || !(archReason[record.id] ?? "").trim()}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-amber-500/10 border border-amber-400/30 text-amber-400 font-body text-[10px] font-semibold disabled:opacity-40"
                        >
                          {updating === record.id ? <Loader2 className="w-3 h-3 animate-spin" /> : "Confirm"}
                        </button>
                        <button type="button" onClick={() => setShowArchForm(null)} className="px-2 py-1.5 rounded-xl border border-white/[0.08] text-white/30 font-body text-[10px]">Cancel</button>
                      </div>
                    )}

                    {record.status !== "approved" && (
                      <>
                        {showVoidForm !== record.id ? (
                          <button
                            type="button"
                            onClick={() => { setShowVoidForm(record.id); setShowArchForm(null); }}
                            className="flex items-center gap-1 px-2 py-1 rounded-lg border border-white/[0.1] text-white/35 font-body text-[10px] hover:text-red-400 hover:border-red-400/25 transition-all"
                          >
                            <XCircle className="w-3 h-3" /> Void
                          </button>
                        ) : (
                          <div className="flex gap-2 w-full flex-wrap">
                            <input
                              type="text"
                              value={voidReason[record.id] ?? ""}
                              onChange={e => setVoidReason(r => ({ ...r, [record.id]: e.target.value }))}
                              placeholder="Void reason (required)…"
                              className="flex-1 min-w-[160px] bg-white/[0.06] border border-red-400/25 rounded-xl px-2.5 py-1.5 font-body text-[11px] text-white placeholder-white/25 focus:outline-none focus:border-red-400/50"
                            />
                            <button
                              type="button"
                              onClick={() => callLifecycle(record.id, "void", { reason: voidReason[record.id] ?? "" })}
                              disabled={updating === record.id || !(voidReason[record.id] ?? "").trim()}
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-red-500/10 border border-red-400/30 text-red-400 font-body text-[10px] font-semibold disabled:opacity-40"
                            >
                              {updating === record.id ? <Loader2 className="w-3 h-3 animate-spin" /> : "Confirm Void"}
                            </button>
                            <button type="button" onClick={() => setShowVoidForm(null)} className="px-2 py-1.5 rounded-xl border border-white/[0.08] text-white/30 font-body text-[10px]">Cancel</button>
                          </div>
                        )}
                      </>
                    )}
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
