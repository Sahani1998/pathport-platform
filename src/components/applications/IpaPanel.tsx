"use client";

import { useState, useRef, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { BadgeCheck, Loader2, Upload, Download, FileText } from "lucide-react";
import { IPA_STATUS_META } from "@/types/application-processing";
import type { IpaRecord, IpaStatus } from "@/types/application-processing";
import { fmtFileSize } from "@/types/documents";

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
  const [showForm,  setShowForm]  = useState(false);
  const [notes,     setNotes]     = useState("");
  const [uploading, setUploading] = useState(false);
  const [updating,  setUpdating]  = useState<string | null>(null);
  const [error,     setError]     = useState<string | null>(null);
  // Per-record pending status + notes for the update form
  const [statusDraft, setStatusDraft] = useState<Record<string, IpaStatus>>({});
  const [notesDraft,  setNotesDraft]  = useState<Record<string, string>>({});

  const upload = async (e: FormEvent) => {
    e.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!file) { setError("Please choose a PDF file"); return; }
    setError(null);
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      if (notes.trim()) formData.append("notes", notes.trim());

      const res = await fetch(`/api/applications/${applicationId}/ipa`, {
        method: "POST",
        body:   formData,
      });
      const json = await res.json() as { error?: string };
      if (!res.ok) { setError(json.error ?? `Server error (${res.status})`); return; }
      setShowForm(false);
      setNotes("");
      if (fileRef.current) fileRef.current.value = "";
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
    setUpdating(record.id);
    try {
      const res = await fetch(`/api/ipa/${record.id}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus,
          notes:  (notesDraft[record.id] ?? "").trim() || null,
        }),
      });
      const json = await res.json() as { error?: string };
      if (!res.ok) { setError(json.error ?? `Server error (${res.status})`); return; }
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Network error");
    } finally {
      setUpdating(null);
    }
  };

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
            type="submit"
            disabled={uploading}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-purple-500/15 border border-purple-400/30 text-purple-400 font-body text-xs font-semibold hover:bg-purple-500/25 transition-all disabled:opacity-50"
          >
            {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <><Upload className="w-3.5 h-3.5" /> Submit IPA</>}
          </button>
        </form>
      )}

      {error && <p className="text-red-400 font-body text-xs">{error}</p>}

      {records.length === 0 ? (
        <p className="text-white/30 font-body text-xs">No IPA submitted yet. Upload after fee payment is confirmed.</p>
      ) : (
        <div className="space-y-2">
          {records.map(record => {
            const meta = IPA_STATUS_META[record.status];
            const draft = statusDraft[record.id] ?? record.status;
            const isTerminal = record.status === "approved";
            return (
              <div key={record.id} className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.07] space-y-2">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className="w-3.5 h-3.5 text-white/40 flex-shrink-0" />
                    <p className="font-body text-xs text-white/70 truncate">{record.file_name}</p>
                    {record.file_size && (
                      <span className="text-white/30 font-body text-[10px]">({fmtFileSize(record.file_size)})</span>
                    )}
                  </div>
                  <span className={`px-2 py-0.5 rounded-full border font-body text-[10px] font-semibold ${meta.color}`}>
                    {meta.label}
                  </span>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-white/25 font-body text-[10px]">Uploaded {fmtDate(record.created_at)}</span>
                  {record.decided_at && (
                    <span className="text-white/25 font-body text-[10px]">Decided {fmtDate(record.decided_at)}</span>
                  )}
                  <a
                    href={`/api/ipa/${record.id}/download`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-pathBlue-400/70 hover:text-pathBlue-300 font-body text-[10px] transition-colors"
                  >
                    <Download className="w-2.5 h-2.5" /> Download
                  </a>
                </div>
                {record.notes && <p className="text-white/40 font-body text-[11px]">{record.notes}</p>}

                {!isTerminal && (
                  <div className="flex gap-2 items-center pt-1 flex-wrap">
                    <select
                      value={draft}
                      onChange={e => setStatusDraft(d => ({ ...d, [record.id]: e.target.value as IpaStatus }))}
                      className="bg-white/[0.06] border border-white/[0.10] rounded-xl px-2.5 py-1.5 font-body text-[11px] text-white focus:outline-none focus:border-purple-400/50"
                    >
                      {STATUS_OPTIONS.map(s => (
                        <option key={s} value={s} className="bg-[#0A1228]">{IPA_STATUS_META[s].label}</option>
                      ))}
                    </select>
                    {draft === "rejected" && (
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
                        draft === record.status ||
                        (draft === "rejected" && !(notesDraft[record.id] ?? "").trim())
                      }
                      className="px-3 py-1.5 rounded-xl bg-purple-500/15 border border-purple-400/30 text-purple-400 font-body text-[11px] font-semibold hover:bg-purple-500/25 transition-all disabled:opacity-40"
                    >
                      {updating === record.id ? <Loader2 className="w-3 h-3 animate-spin" /> : "Update"}
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
