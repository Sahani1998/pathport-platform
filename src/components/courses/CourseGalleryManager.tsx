"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Loader2, Plus, Trash2, AlertCircle } from "lucide-react";
import SafeImage from "@/components/ui/SafeImage";
import type { CourseGalleryImage } from "@/types/course-media";

interface Props {
  courseId: string;
}

export default function CourseGalleryManager({ courseId }: Props) {
  const [images,    setImages]    = useState<CourseGalleryImage[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error,     setError]     = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const fetchGallery = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res  = await fetch(`/api/courses/${courseId}/gallery`);
      const json = await res.json() as { images?: CourseGalleryImage[]; error?: string };
      if (!res.ok) throw new Error(json.error ?? `Fetch failed (${res.status})`);
      setImages(json.images ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => { fetchGallery(); }, [fetchGallery]);

  const handleUpload = async (file: File) => {
    setError(null);
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res  = await fetch(`/api/courses/${courseId}/gallery`, { method: "POST", body: fd });
      const json = await res.json() as { image?: CourseGalleryImage; error?: string };
      if (!res.ok) throw new Error(json.error ?? `Upload failed (${res.status})`);
      if (json.image) setImages(prev => [...prev, json.image!]);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (imageId: string) => {
    setError(null);
    setDeletingId(imageId);
    try {
      const res = await fetch(`/api/courses/${courseId}/gallery/${imageId}`, { method: "DELETE" });
      if (!res.ok) {
        const json = await res.json() as { error?: string };
        throw new Error(json.error ?? `Delete failed (${res.status})`);
      }
      setImages(prev => prev.filter(img => img.id !== imageId));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-3 text-white/35">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="font-body text-xs">Loading gallery…</span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {error && (
        <div className="flex items-start gap-2 p-3 rounded-xl bg-red-500/10 border border-red-400/20">
          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-px" />
          <p className="text-red-400 font-body text-xs">{error}</p>
        </div>
      )}

      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {images.map(img => (
            <div key={img.id} className="relative aspect-video rounded-lg overflow-hidden border border-white/[0.08] group">
              <SafeImage
                src={img.public_url}
                alt={img.alt_text ?? "Gallery image"}
                fill
                className="object-cover"
              />
              <button
                type="button"
                onClick={() => handleDelete(img.id)}
                disabled={deletingId === img.id}
                className="absolute top-1 right-1 w-6 h-6 rounded-md bg-black/65 text-white/70 hover:text-red-400 items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity flex disabled:opacity-50"
              >
                {deletingId === img.id
                  ? <Loader2 className="w-3 h-3 animate-spin" />
                  : <Trash2  className="w-3 h-3" />
                }
              </button>
            </div>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="w-full py-2.5 rounded-xl border border-dashed border-white/[0.12] hover:border-gold-400/30 text-white/35 hover:text-white/60 flex items-center justify-center gap-2 transition-all disabled:opacity-50 font-body text-xs"
      >
        {uploading ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> Uploading…</>
        ) : (
          <><Plus className="w-4 h-4" /> Add Gallery Image</>
        )}
      </button>

      {images.length === 0 && !uploading && !error && (
        <p className="text-white/25 font-body text-[10px]">No gallery images yet</p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        onChange={e => {
          const file = e.target.files?.[0];
          if (file) { handleUpload(file); e.target.value = ""; }
        }}
      />
    </div>
  );
}
