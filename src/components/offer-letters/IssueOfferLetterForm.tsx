"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  FilePlus2, Upload, Loader2, CheckCircle2,
  FileText, Download, CalendarDays, Send, Archive, XCircle,
  ChevronDown, ChevronUp, Eye,
} from "lucide-react";
import type { OfferLetterStatus, OfferLetterWithUploader } from "@/types/offer-letters";
import { OFFER_LETTER_STATUS_META } from "@/types/offer-letters";
import { cn } from "@/lib/utils";

interface Props {
  applicationId:   string;
  existingLetters: OfferLetterWithUploader[];
}

function fmtBytes(n: number | null) {
  if (!n) return "";
  if (n < 1024)        return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(2)} MB`;
}

function fmtDate(s: string) {
  return new Date(s).toLocaleDateString("en-SG", { day: "numeric", month: "short", year: "numeric" });
}

const inputCls = "w-full px-3 py-2.5 rounded-xl bg-white/[0.06] border border-white/[0.1] text-white placeholder-white/20 font-body text-sm focus:outline-none focus:border-gold-400/50 transition-colors";

export default function IssueOfferLetterForm({ applicationId, existingLetters: initial }: Props) {
  const router  = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [letters,      setLetters]      = useState(initial);
  const [file,         setFile]         = useState<File | null>(null);
  const [notes,        setNotes]        = useState("");
  const [expiryDate,   setExpiryDate]   = useState("");
  const [uploading,    setUploading]    = useState(false);
  const [error,        setError]        = useState<string | null>(null);
  const [success,      setSuccess]      = useState<string | null>(null);
  const [busyId,       setBusyId]       = useState<string | null>(null);
  const [voidReason,   setVoidReason]   = useState<Record<string, string>>({});
  const [archReason,   setArchReason]   = useState<Record<string, string>>({});
  const [showHistory,  setShowHistory]  = useState(false);
  const [showVoidForm, setShowVoidForm] = useState<string | null>(null);
  const [showArchForm, setShowArchForm] = useState<string | null>(null);

  const issuedLetter = letters.find(l => l.status === "issued") ?? null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFile(e.target.files?.[0] ?? null);
    setError(null);
    setSuccess(null);
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) { setError("Please select a PDF file"); return; }
    setUploading(true);
    setError(null);
    setSuccess(null);

    try {
      const fd = new FormData();
      fd.append("application_id", applicationId);
      fd.append("file", file);
      if (notes.trim())      fd.append("notes",       notes.trim());
      if (expiryDate.trim()) fd.append("expiry_date", expiryDate.trim());

      const res  = await fetch("/api/offer-letters", { method: "POST", body: fd });
      const data = await res.json() as OfferLetterWithUploader & { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Upload failed");

      setLetters(prev => [data, ...prev.map(l => l.id === data.id ? data : l)]);
      setFile(null);
      setNotes("");
      setExpiryDate("");
      if (fileRef.current) fileRef.current.value = "";
      setSuccess("Offer letter issued — student has been notified.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const callLifecycle = async (
    letterId: string,
    action: string,
    extra?: Record<string, string>,
  ) => {
    setBusyId(letterId);
    setError(null);
    setSuccess(null);
    try {
      const res  = await fetch(`/api/offer-letters/${letterId}/lifecycle`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ action, ...extra }),
      });
      const data = await res.json() as { success?: boolean; error?: string; status?: string };
      if (!res.ok) throw new Error(data.error ?? "Action failed");
      setLetters(prev =>
        prev.map(l =>
          l.id === letterId ? { ...l, status: data.status as OfferLetterStatus } : l,
        ),
      );
      setShowVoidForm(null);
      setShowArchForm(null);
      setVoidReason(r => { const n = { ...r }; delete n[letterId]; return n; });
      setArchReason(r => { const n = { ...r }; delete n[letterId]; return n; });
      setSuccess(
        action === "issue"     ? "Offer letter issued — student notified." :
        action === "supersede" ? "Letter marked superseded." :
        action === "archive"   ? "Letter archived." :
        action === "void"      ? "Letter voided." : "Done.",
      );
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed");
    } finally {
      setBusyId(null);
    }
  };

  const statusLabel = (l: OfferLetterWithUploader) => {
    const m = OFFER_LETTER_STATUS_META[l.status as OfferLetterStatus];
    return (
      <span className={cn("px-2 py-0.5 rounded-full border font-body text-[10px] font-semibold", m.color)}>
        {m.label}
      </span>
    );
  };

  return (
    <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-5 space-y-5">
      <div className="flex items-center gap-2">
        <FilePlus2 className="w-4 h-4 text-gold-400" />
        <h3 className="font-display text-xl text-white">Offer Letter</h3>
        {issuedLetter && (
          <span className="ml-auto px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-400/25 text-emerald-400 font-body text-[10px] font-semibold">
            v{issuedLetter.version} issued
          </span>
        )}
      </div>

      {/* Currently issued letter — quick actions */}
      {issuedLetter && (
        <div className="p-3 rounded-xl bg-emerald-500/[0.05] border border-emerald-400/20 space-y-2">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2 min-w-0">
              <FileText className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
              <p className="font-body text-xs text-white/70 truncate">{issuedLetter.file_name}</p>
              {issuedLetter.file_size && (
                <span className="text-white/30 font-body text-[10px] flex-shrink-0">({fmtBytes(issuedLetter.file_size)})</span>
              )}
            </div>
            {statusLabel(issuedLetter)}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <a
              href={`/api/offer-letters/${issuedLetter.id}/download`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-pathBlue-400/70 hover:text-pathBlue-300 font-body text-[10px] transition-colors"
            >
              <Download className="w-2.5 h-2.5" /> Download
            </a>
            {issuedLetter.student_decision && (
              <span className={cn("font-body text-[10px]", issuedLetter.student_decision === "accepted" ? "text-emerald-400" : "text-red-400")}>
                {issuedLetter.student_decision === "accepted" ? "✓ Accepted" : "✗ Declined"}
              </span>
            )}
          </div>
          {/* Archive / Void */}
          <div className="flex gap-2 flex-wrap pt-0.5">
            {showArchForm !== issuedLetter.id ? (
              <button
                type="button"
                onClick={() => { setShowArchForm(issuedLetter.id); setShowVoidForm(null); }}
                className="flex items-center gap-1 px-2 py-1 rounded-lg border border-white/[0.1] text-white/35 font-body text-[10px] hover:text-amber-400 hover:border-amber-400/25 transition-all"
              >
                <Archive className="w-3 h-3" /> Archive
              </button>
            ) : (
              <div className="flex gap-2 w-full flex-wrap">
                <input
                  type="text"
                  value={archReason[issuedLetter.id] ?? ""}
                  onChange={e => setArchReason(r => ({ ...r, [issuedLetter.id]: e.target.value }))}
                  placeholder="Archive reason (required)…"
                  className="flex-1 min-w-[160px] bg-white/[0.06] border border-amber-400/25 rounded-xl px-2.5 py-1.5 font-body text-[11px] text-white placeholder-white/25 focus:outline-none focus:border-amber-400/50"
                />
                <button
                  type="button"
                  onClick={() => callLifecycle(issuedLetter.id, "archive", { reason: archReason[issuedLetter.id] ?? "" })}
                  disabled={busyId === issuedLetter.id || !(archReason[issuedLetter.id] ?? "").trim()}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-amber-500/10 border border-amber-400/30 text-amber-400 font-body text-[10px] font-semibold disabled:opacity-40"
                >
                  {busyId === issuedLetter.id ? <Loader2 className="w-3 h-3 animate-spin" /> : "Confirm"}
                </button>
                <button type="button" onClick={() => setShowArchForm(null)} className="px-2 py-1.5 rounded-xl border border-white/[0.08] text-white/30 font-body text-[10px]">Cancel</button>
              </div>
            )}
            {issuedLetter.student_decision !== "accepted" && (
              <>
                {showVoidForm !== issuedLetter.id ? (
                  <button
                    type="button"
                    onClick={() => { setShowVoidForm(issuedLetter.id); setShowArchForm(null); }}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg border border-white/[0.1] text-white/35 font-body text-[10px] hover:text-red-400 hover:border-red-400/25 transition-all"
                  >
                    <XCircle className="w-3 h-3" /> Void
                  </button>
                ) : (
                  <div className="flex gap-2 w-full flex-wrap">
                    <input
                      type="text"
                      value={voidReason[issuedLetter.id] ?? ""}
                      onChange={e => setVoidReason(r => ({ ...r, [issuedLetter.id]: e.target.value }))}
                      placeholder="Void reason (required)…"
                      className="flex-1 min-w-[160px] bg-white/[0.06] border border-red-400/25 rounded-xl px-2.5 py-1.5 font-body text-[11px] text-white placeholder-white/25 focus:outline-none focus:border-red-400/50"
                    />
                    <button
                      type="button"
                      onClick={() => callLifecycle(issuedLetter.id, "void", { reason: voidReason[issuedLetter.id] ?? "" })}
                      disabled={busyId === issuedLetter.id || !(voidReason[issuedLetter.id] ?? "").trim()}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-red-500/10 border border-red-400/30 text-red-400 font-body text-[10px] font-semibold disabled:opacity-40"
                    >
                      {busyId === issuedLetter.id ? <Loader2 className="w-3 h-3 animate-spin" /> : "Confirm Void"}
                    </button>
                    <button type="button" onClick={() => setShowVoidForm(null)} className="px-2 py-1.5 rounded-xl border border-white/[0.08] text-white/30 font-body text-[10px]">Cancel</button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Upload form — replace/issue */}
      <form onSubmit={handleUpload} className="space-y-3">
        <div>
          <label className="block text-white/40 font-body text-[10px] uppercase tracking-wider mb-1.5">
            {issuedLetter ? "Replace offer letter (PDF) *" : "Upload offer letter (PDF) *"}
          </label>
          <div
            onClick={() => fileRef.current?.click()}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-all ${
              file
                ? "bg-gold-400/10 border-gold-400/30"
                : "bg-white/[0.04] border-white/[0.1] hover:border-white/20"
            }`}
          >
            <FileText className={`w-4 h-4 flex-shrink-0 ${file ? "text-gold-400" : "text-white/30"}`} />
            <span className={`font-body text-sm truncate ${file ? "text-white/80" : "text-white/25"}`}>
              {file ? `${file.name} (${fmtBytes(file.size)})` : "Click to choose PDF…"}
            </span>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="application/pdf,.pdf"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-white/40 font-body text-[10px] uppercase tracking-wider mb-1.5">
              Internal notes <span className="normal-case text-white/25">(optional)</span>
            </label>
            <input
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="e.g. Revised intake date"
              className={inputCls}
            />
          </div>
          <div>
            <label className="block text-white/40 font-body text-[10px] uppercase tracking-wider mb-1.5">
              Expiry date <span className="normal-case text-white/25">(optional)</span>
            </label>
            <input
              type="date"
              value={expiryDate}
              onChange={e => setExpiryDate(e.target.value)}
              className={inputCls}
            />
          </div>
        </div>

        {error   && <p className="text-red-400   font-body text-xs">{error}</p>}
        {success && (
          <div className="flex items-center gap-2 text-emerald-400 font-body text-xs">
            <CheckCircle2 className="w-4 h-4" /> {success}
          </div>
        )}

        <button
          type="submit"
          disabled={uploading || !file}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gold-400/15 border border-gold-400/30 text-gold-400 font-body text-sm font-semibold hover:bg-gold-400/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {uploading
            ? <><Loader2 className="w-4 h-4 animate-spin" /> Uploading…</>
            : issuedLetter
              ? <><Send className="w-4 h-4" /> Issue Replacement Letter</>
              : <><Upload className="w-4 h-4" /> Issue Offer Letter</>
          }
        </button>
      </form>

      {/* Version history */}
      {letters.length > 0 && (
        <div className="pt-1 border-t border-white/[0.07] space-y-2">
          <button
            type="button"
            onClick={() => setShowHistory(v => !v)}
            className="flex items-center gap-1.5 text-white/35 hover:text-white/55 font-body text-[10px] uppercase tracking-wider transition-colors"
          >
            {showHistory ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            Version history ({letters.length})
          </button>

          {showHistory && (
            <div className="space-y-2">
              {letters.map(l => {
                const meta = OFFER_LETTER_STATUS_META[l.status];
                return (
                  <div
                    key={l.id}
                    className={cn(
                      "flex items-center justify-between gap-3 p-3 rounded-xl border",
                      l.status === "issued"     ? "bg-emerald-500/[0.04] border-emerald-400/15" :
                      l.status === "void"       ? "bg-red-500/[0.04]     border-red-400/15" :
                      l.status === "archived"   ? "bg-white/[0.02]       border-white/[0.05]" :
                      l.status === "draft"      ? "bg-gold-400/[0.04]    border-gold-400/15" :
                                                  "bg-white/[0.03]       border-white/[0.07]",
                    )}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-body text-xs font-semibold text-white/70">v{l.version}</span>
                        <span className="text-white/35 font-body text-xs truncate">{l.file_name}</span>
                        {l.file_size && <span className="text-white/25 font-body text-[10px]">{fmtBytes(l.file_size)}</span>}
                        <span className={cn("px-1.5 py-0.5 rounded-full border font-body text-[9px] font-semibold", meta.color)}>
                          {meta.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className="text-white/30 font-body text-[10px]">{fmtDate(l.created_at)}</span>
                        {l.uploader_name && (
                          <span className="text-white/25 font-body text-[10px]">by {l.uploader_name}</span>
                        )}
                        {l.expiry_date && (
                          <span className="flex items-center gap-0.5 text-amber-400/70 font-body text-[10px]">
                            <CalendarDays className="w-2.5 h-2.5" />
                            Expires {fmtDate(l.expiry_date)}
                          </span>
                        )}
                        {l.void_reason && (
                          <span className="text-red-400/60 font-body text-[10px]">Reason: {l.void_reason}</span>
                        )}
                        {l.archive_reason && (
                          <span className="text-white/30 font-body text-[10px]">Reason: {l.archive_reason}</span>
                        )}
                      </div>
                      {l.notes && <p className="text-white/25 font-body text-[10px] mt-0.5 truncate">{l.notes}</p>}
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <a
                        href={`/api/offer-letters/${l.id}/download`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-pathBlue-500/10 border border-pathBlue-500/20 text-pathBlue-400 font-body text-[10px] font-semibold hover:bg-pathBlue-500/20 transition-all whitespace-nowrap"
                      >
                        <Eye className="w-3 h-3" /> View
                      </a>
                      {/* Issue button for drafts */}
                      {l.status === "draft" && (
                        <button
                          type="button"
                          onClick={() => callLifecycle(l.id, "issue")}
                          disabled={busyId === l.id}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-400/25 text-emerald-400 font-body text-[10px] font-semibold hover:bg-emerald-500/20 transition-all disabled:opacity-50"
                        >
                          {busyId === l.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <><Send className="w-3 h-3" /> Issue</>}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
