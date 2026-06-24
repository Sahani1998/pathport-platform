"use client";

import { useRef, useState } from "react";
import { Loader2, Upload, Trash2, FileText, ExternalLink } from "lucide-react";

interface Props {
  courseId:   string;
  initialUrl: string | null;
}

export default function CourseBrochureUpload({ courseId, initialUrl }: Props) {
  const [url,       setUrl]       = useState<string | null>(initialUrl);
  const [uploading, setUploading] = useState(false);
  const [removing,  setRemoving]  = useState(false);
  const [error,     setError]     = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setError(null);
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res  = await fetch(`/api/courses/${courseId}/brochure`, { method: "POST", body: fd });
      const json = await res.json() as { brochure_url?: string; error?: string };
      if (!res.ok) throw new Error(json.error ?? `Upload failed (${res.status})`);
      setUrl(json.brochure_url ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async () => {
    setError(null);
    setRemoving(true);
    try {
      const res = await fetch(`/api/courses/${courseId}/brochure`, { method: "DELETE" });
      if (!res.ok) {
        const json = await res.json() as { error?: string };
        throw new Error(json.error ?? `Remove failed (${res.status})`);
      }
      setUrl(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setRemoving(false);
    }
  };

  const filename = url
    ? decodeURIComponent(url.split("/").pop()?.split("?")[0] ?? "brochure.pdf")
    : null;

  return (
    <div className="space-y-2">
      {url ? (
        <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.04] border border-white/[0.09]">
          <FileText className="w-5 h-5 text-pathBlue-400 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="font-body text-xs text-white/75 truncate">{filename}</p>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-body text-[10px] text-pathBlue-400/70 hover:text-pathBlue-400 flex items-center gap-1 transition-colors"
            >
              <ExternalLink className="w-2.5 h-2.5" /> Preview
            </a>
          </div>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading || removing}
            className="px-2.5 py-1.5 rounded-lg bg-white/[0.06] border border-white/[0.09] text-white/50 font-body text-[10px] flex items-center gap-1 hover:text-white/80 transition-all disabled:opacity-50"
          >
            <Upload className="w-3 h-3" /> Replace
          </button>
          <button
            type="button"
            onClick={handleRemove}
            disabled={uploading || removing}
            className="p-1.5 rounded-lg bg-red-500/10 border border-red-400/20 text-red-400/70 hover:text-red-400 hover:bg-red-500/20 transition-all disabled:opacity-50"
          >
            {removing
              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
              : <Trash2  className="w-3.5 h-3.5" />
            }
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="w-full h-20 rounded-xl border-2 border-dashed border-white/[0.12] hover:border-pathBlue-500/40 text-white/35 hover:text-white/60 flex flex-col items-center justify-center gap-1.5 transition-all disabled:opacity-50"
        >
          {uploading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="font-body text-xs">Uploading…</span>
            </>
          ) : (
            <>
              <Upload className="w-5 h-5" />
              <span className="font-body text-xs">Upload Brochure</span>
              <span className="font-body text-[10px] text-white/25">PDF only · max 10 MB</span>
            </>
          )}
        </button>
      )}

      {error && <p className="text-red-400 font-body text-xs">{error}</p>}

      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        className="sr-only"
        onChange={e => {
          const file = e.target.files?.[0];
          if (file) { handleFile(file); e.target.value = ""; }
        }}
      />
    </div>
  );
}
