"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { Upload, Loader2, AlertCircle, RefreshCw, X } from "lucide-react";
import { IMAGE_MIME_TYPES, MAX_IMAGE_SIZE_BYTES, fmtFileSize } from "@/types/institution-media";

interface Props {
  label:        string;
  endpoint:     string;
  fieldName?:   string;       // form field name for the file (default: "file")
  currentUrl?:  string | null;
  aspectHint?:  string;       // e.g. "16:9 recommended"
  onUploaded:   (url: string) => void;
  extraFields?: Record<string, string>;
}

export default function MediaUploadWidget({
  label,
  endpoint,
  fieldName = "file",
  currentUrl,
  aspectHint,
  onUploaded,
  extraFields,
}: Props) {
  const inputRef               = useRef<HTMLInputElement>(null);
  const [preview,  setPreview] = useState<string | null>(currentUrl ?? null);
  const [busy,     setBusy]    = useState(false);
  const [progress, setProgress] = useState(0);
  const [error,    setError]   = useState<string | null>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);

    if (!(IMAGE_MIME_TYPES as readonly string[]).includes(file.type)) {
      setError("Only JPEG, PNG, or WebP images are allowed.");
      return;
    }
    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      setError(`File too large. Maximum is 5 MB (${fmtFileSize(file.size)} uploaded).`);
      return;
    }
    if (file.size === 0) {
      setError("File is empty.");
      return;
    }

    // Show local preview immediately
    const localUrl = URL.createObjectURL(file);
    setPreview(localUrl);
    setBusy(true);
    setProgress(20);

    const fd = new FormData();
    fd.append(fieldName, file);
    if (extraFields) {
      for (const [k, v] of Object.entries(extraFields)) fd.append(k, v);
    }

    try {
      setProgress(50);
      const res  = await fetch(endpoint, { method: "POST", body: fd });
      setProgress(90);
      const json = await res.json() as Record<string, string>;

      if (!res.ok) {
        setError((json.error as string) ?? `Upload failed (${res.status})`);
        setPreview(currentUrl ?? null);
        return;
      }

      // Extract the URL from whatever key the endpoint returns
      const url = json.logo_url ?? json.cover_image_url ?? json.public_url ?? json.url ?? "";
      setPreview(url || localUrl);
      onUploaded(url || localUrl);
      setProgress(100);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
      setPreview(currentUrl ?? null);
    } finally {
      setBusy(false);
      setProgress(0);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-2">
      <p className="text-white/40 font-body text-[10px] uppercase tracking-wider">{label}</p>

      {/* Preview */}
      {preview ? (
        <div className="relative group w-full max-w-xs">
          <div className="rounded-xl overflow-hidden border border-white/[0.10] bg-white/[0.04]">
            <Image
              src={preview}
              alt={label}
              width={320} height={180}
              className="w-full object-cover"
              unoptimized
            />
          </div>
          <button
            type="button"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
            className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity disabled:cursor-not-allowed"
          >
            {busy
              ? <Loader2 className="w-5 h-5 text-white animate-spin" />
              : <><RefreshCw className="w-4 h-4 text-white mr-1.5" /><span className="text-white font-body text-xs font-semibold">Replace</span></>
            }
          </button>
        </div>
      ) : (
        <button
          type="button"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
          className="flex flex-col items-center justify-center w-full max-w-xs h-32 rounded-xl border border-dashed border-white/[0.15] text-white/30 hover:border-gold-400/40 hover:text-gold-400/60 hover:bg-gold-400/[0.03] transition-all disabled:cursor-not-allowed"
        >
          {busy
            ? <Loader2 className="w-5 h-5 animate-spin mb-1.5" />
            : <Upload className="w-5 h-5 mb-1.5" />
          }
          <span className="font-body text-xs">{busy ? "Uploading…" : "Click to upload"}</span>
          {aspectHint && !busy && (
            <span className="font-body text-[10px] text-white/20 mt-0.5">{aspectHint}</span>
          )}
        </button>
      )}

      {/* Progress bar */}
      {busy && progress > 0 && (
        <div className="h-1 bg-white/[0.07] rounded-full w-full max-w-xs">
          <div
            className="h-full bg-gold-400 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-start gap-1.5 max-w-xs">
          <AlertCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-red-400 font-body text-xs">{error}</p>
          <button type="button" onClick={() => setError(null)} className="ml-auto text-white/25 hover:text-white/50">
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        onChange={handleFile}
        className="hidden"
      />
    </div>
  );
}
