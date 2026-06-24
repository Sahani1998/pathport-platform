"use client";

import { useRef, useState } from "react";
import { Loader2, Upload, Trash2 } from "lucide-react";
import SafeImage from "@/components/ui/SafeImage";

interface Props {
  courseId:   string;
  initialUrl: string | null;
}

export default function CourseThumbnailUpload({ courseId, initialUrl }: Props) {
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
      const res  = await fetch(`/api/courses/${courseId}/thumbnail`, { method: "POST", body: fd });
      const json = await res.json() as { thumbnail_url?: string; error?: string };
      if (!res.ok) throw new Error(json.error ?? `Upload failed (${res.status})`);
      setUrl(json.thumbnail_url ?? null);
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
      const res = await fetch(`/api/courses/${courseId}/thumbnail`, { method: "DELETE" });
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

  return (
    <div className="space-y-2">
      {url ? (
        <div className="relative w-full h-40 rounded-xl overflow-hidden border border-white/[0.09] group">
          <SafeImage src={url} alt="Course thumbnail" fill className="object-cover" />
          <div className="absolute inset-0 bg-black/55 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading || removing}
              className="px-3 py-1.5 rounded-lg bg-white/15 border border-white/20 text-white font-body text-xs flex items-center gap-1.5 hover:bg-white/25 transition-all disabled:opacity-50"
            >
              <Upload className="w-3 h-3" /> Replace
            </button>
            <button
              type="button"
              onClick={handleRemove}
              disabled={uploading || removing}
              className="px-3 py-1.5 rounded-lg bg-red-500/20 border border-red-400/30 text-red-300 font-body text-xs flex items-center gap-1.5 hover:bg-red-500/30 transition-all disabled:opacity-50"
            >
              {removing
                ? <Loader2 className="w-3 h-3 animate-spin" />
                : <Trash2  className="w-3 h-3" />
              } Remove
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="w-full h-32 rounded-xl border-2 border-dashed border-white/[0.12] hover:border-gold-400/40 text-white/35 hover:text-white/60 flex flex-col items-center justify-center gap-2 transition-all disabled:opacity-50"
        >
          {uploading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="font-body text-xs">Uploading…</span>
            </>
          ) : (
            <>
              <Upload className="w-5 h-5" />
              <span className="font-body text-xs">Upload Thumbnail</span>
              <span className="font-body text-[10px] text-white/25">JPG, PNG or WebP · max 5 MB · 1200×630 px recommended</span>
            </>
          )}
        </button>
      )}

      {error && <p className="text-red-400 font-body text-xs">{error}</p>}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        onChange={e => {
          const file = e.target.files?.[0];
          if (file) { handleFile(file); e.target.value = ""; }
        }}
      />
    </div>
  );
}
