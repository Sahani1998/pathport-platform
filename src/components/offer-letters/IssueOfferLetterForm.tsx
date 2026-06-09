"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  FilePlus2, Upload, Loader2, CheckCircle2, XCircle,
  FileText, Download, CalendarDays,
} from "lucide-react";
import type { OfferLetterWithUploader } from "@/types/offer-letters";

interface Props {
  applicationId: string;
  existingLetters: OfferLetterWithUploader[];
}

function fmtBytes(n: number | null) {
  if (!n) return "";
  if (n < 1024)        return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(2)} MB`;
}

const inputCls = "w-full px-3 py-2.5 rounded-xl bg-white/[0.06] border border-white/[0.1] text-white placeholder-white/20 font-body text-sm focus:outline-none focus:border-gold-400/50 transition-colors";

export default function IssueOfferLetterForm({ applicationId, existingLetters: initial }: Props) {
  const router  = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [letters,    setLetters]    = useState(initial);
  const [file,       setFile]       = useState<File | null>(null);
  const [notes,      setNotes]      = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [uploading,  setUploading]  = useState(false);
  const [error,      setError]      = useState<string | null>(null);
  const [success,    setSuccess]    = useState(false);

  const latestLetter = letters[0] ?? null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
    setError(null);
    setSuccess(false);
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) { setError("Please select a PDF file"); return; }
    setUploading(true);
    setError(null);
    setSuccess(false);

    try {
      const fd = new FormData();
      fd.append("application_id", applicationId);
      fd.append("file", file);
      if (notes.trim())      fd.append("notes",       notes.trim());
      if (expiryDate.trim()) fd.append("expiry_date", expiryDate.trim());

      const res = await fetch("/api/offer-letters", { method: "POST", body: fd });
      const data = await res.json() as OfferLetterWithUploader & { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Upload failed");

      // Prepend new letter to local state
      setLetters(prev => [{ ...data, uploader_name: data.uploader_name ?? null }, ...prev]);
      setFile(null);
      setNotes("");
      setExpiryDate("");
      if (fileRef.current) fileRef.current.value = "";
      setSuccess(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-5 space-y-5">
      <div className="flex items-center gap-2">
        <FilePlus2 className="w-4 h-4 text-gold-400" />
        <h3 className="font-display text-xl text-white">Offer Letter</h3>
        {latestLetter && (
          <span className="ml-auto px-2 py-0.5 rounded-full bg-gold-400/15 border border-gold-400/30 text-gold-400 font-body text-[10px] font-semibold">
            v{latestLetter.version} issued
          </span>
        )}
      </div>

      {/* Issue / replace form */}
      <form onSubmit={handleUpload} className="space-y-3">
        {/* File picker */}
        <div>
          <label className="block text-white/40 font-body text-[10px] uppercase tracking-wider mb-1.5">
            {latestLetter ? "Replace offer letter (PDF) *" : "Upload offer letter (PDF) *"}
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

        {/* Notes + Expiry */}
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
            <CheckCircle2 className="w-4 h-4" />
            Offer letter issued successfully — student has been notified.
          </div>
        )}

        <button
          type="submit"
          disabled={uploading || !file}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gold-400/15 border border-gold-400/30 text-gold-400 font-body text-sm font-semibold hover:bg-gold-400/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {uploading
            ? <><Loader2 className="w-4 h-4 animate-spin" /> Uploading…</>
            : <><Upload className="w-4 h-4" /> {latestLetter ? "Replace Offer Letter" : "Issue Offer Letter"}</>
          }
        </button>
      </form>

      {/* Version history */}
      {letters.length > 0 && (
        <div className="space-y-2 pt-1 border-t border-white/[0.07]">
          <p className="text-white/35 font-body text-[10px] uppercase tracking-wider">
            Version history ({letters.length})
          </p>
          <div className="space-y-2">
            {letters.map((l) => (
              <div
                key={l.id}
                className="flex items-center justify-between gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.07]"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-body text-xs font-semibold text-white/70">v{l.version}</span>
                    <span className="text-white/35 font-body text-xs truncate">{l.file_name}</span>
                    {l.file_size && <span className="text-white/25 font-body text-[10px]">{fmtBytes(l.file_size)}</span>}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <span className="text-white/30 font-body text-[10px]">
                      {new Date(l.created_at).toLocaleDateString("en-SG", { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                    {l.uploader_name && (
                      <span className="text-white/25 font-body text-[10px]">by {l.uploader_name}</span>
                    )}
                    {l.expiry_date && (
                      <span className="flex items-center gap-0.5 text-amber-400/70 font-body text-[10px]">
                        <CalendarDays className="w-2.5 h-2.5" />
                        Expires {new Date(l.expiry_date).toLocaleDateString("en-SG", { day: "numeric", month: "short", year: "numeric" })}
                      </span>
                    )}
                  </div>
                  {l.notes && <p className="text-white/25 font-body text-[10px] mt-0.5 truncate">{l.notes}</p>}
                </div>
                <a
                  href={`/api/offer-letters/${l.id}/download`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-pathBlue-500/10 border border-pathBlue-500/20 text-pathBlue-400 font-body text-xs font-semibold hover:bg-pathBlue-500/20 transition-all whitespace-nowrap"
                >
                  <Download className="w-3 h-3" /> Download
                </a>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
