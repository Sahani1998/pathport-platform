"use client";

import { useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import DocumentStatusBadge from "@/components/documents/DocumentStatusBadge";
import {
  Upload, FileText, Eye, Loader2, AlertCircle, RefreshCw, Download,
} from "lucide-react";
import type { DocumentTypeMeta, StudentDocument } from "@/types/documents";
import { ALLOWED_MIME_TYPES, MAX_FILE_SIZE_BYTES, fmtFileSize } from "@/types/documents";

interface DocumentUploadCardProps {
  meta:          DocumentTypeMeta;
  applicationId: string;
  studentId:     string;
  existing?:     StudentDocument | null;
  onUploaded?:   (doc: StudentDocument) => void;
}

export default function DocumentUploadCard({
  meta,
  applicationId,
  studentId,
  existing,
  onUploaded,
}: DocumentUploadCardProps) {
  const inputRef                    = useRef<HTMLInputElement>(null);
  const [doc,          setDoc]      = useState<StudentDocument | null>(existing ?? null);
  const [uploading,    setUploading] = useState(false);
  const [error,        setError]    = useState<string | null>(null);
  const [progress,     setProgress] = useState(0);
  const [signedUrl,    setSignedUrl] = useState<string | null>(null);
  const [loadingUrl,   setLoadingUrl] = useState(false);

  const canReupload = !doc || doc.status === "rejected";

  // ── Generate signed URL for preview/download ──────────────────────────────
  const getSignedUrl = async () => {
    if (!doc?.file_path) return;
    setLoadingUrl(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.storage
        .from("student-documents")
        .createSignedUrl(doc.file_path, 3600); // 1 hour
      if (error) { setError(`Preview failed: ${error.message}`); return; }
      if (data?.signedUrl) {
        setSignedUrl(data.signedUrl);
        window.open(data.signedUrl, "_blank");
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Preview error");
    } finally {
      setLoadingUrl(false);
    }
  };

  // ── Upload handler ────────────────────────────────────────────────────────
  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);

    // Validate type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      setError("Only PDF, JPG, JPEG, PNG files are allowed.");
      return;
    }
    // Validate size
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setError(`File too large. Maximum size is 10 MB (${fmtFileSize(file.size)} uploaded).`);
      return;
    }

    setUploading(true);
    setProgress(0);

    try {
      const supabase   = createClient();
      const ext        = file.name.split(".").pop()?.toLowerCase() ?? "bin";
      const timestamp  = Date.now();
      const storagePath = `${studentId}/${applicationId}/${meta.value}-${timestamp}.${ext}`;

      console.log("[DocumentUpload] uploading to:", storagePath);

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("student-documents")
        .upload(storagePath, file, { upsert: true });

      if (uploadError) {
        console.error("[DocumentUpload] storage error:", uploadError.message);
        setError(`Upload failed: ${uploadError.message}`);
        return;
      }

      setProgress(70);
      console.log("[DocumentUpload] storage upload complete, inserting DB record");

      // Upsert DB record — if same type + application already exists, update it
      const { data: inserted, error: dbError } = await supabase
        .from("student_documents")
        .insert({
          student_id:    studentId,
          application_id: applicationId,
          document_type: meta.value,
          file_name:     file.name,
          file_url:      storagePath,
          file_path:     storagePath,
          mime_type:     file.type,
          file_size:     file.size,
          status:        "pending",
        })
        .select()
        .single();

      if (dbError) {
        console.error("[DocumentUpload] DB error:", dbError.message);
        setError(`Database error: ${dbError.message}`);
        return;
      }

      setProgress(100);
      console.log("[DocumentUpload] success — id:", inserted?.id);
      const newDoc = inserted as StudentDocument;
      setDoc(newDoc);
      setSignedUrl(null);
      onUploaded?.(newDoc);

    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[DocumentUpload] unexpected error:", msg);
      setError(`Unexpected error: ${msg}`);
    } finally {
      setUploading(false);
      setProgress(0);
      // Reset file input so same file can be re-selected
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className={`rounded-2xl border p-4 transition-all ${
      doc?.status === "verified"
        ? "bg-emerald-500/[0.04] border-emerald-400/20"
        : doc?.status === "rejected"
          ? "bg-red-500/[0.04] border-red-400/20"
          : doc
            ? "bg-white/[0.04] border-white/[0.10]"
            : "bg-white/[0.03] border-white/[0.07]"
    }`}>
      <div className="flex items-start justify-between gap-3">

        {/* Left: icon + info */}
        <div className="flex items-start gap-3 min-w-0">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
            doc?.status === "verified"
              ? "bg-emerald-500/15 border border-emerald-400/25"
              : "bg-white/[0.07] border border-white/[0.10]"
          }`}>
            <FileText className={`w-4 h-4 ${doc?.status === "verified" ? "text-emerald-400" : "text-white/50"}`} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-body font-semibold text-sm text-white/85">{meta.label}</p>
              {!meta.required && (
                <span className="px-2 py-0.5 rounded-full bg-white/[0.05] border border-white/[0.08] text-white/30 font-body text-[10px]">Optional</span>
              )}
            </div>
            <p className="text-white/35 font-body text-xs mt-0.5">{meta.description}</p>

            {/* Uploaded file info */}
            {doc && (
              <div className="mt-2 space-y-1">
                <p className="text-white/55 font-body text-xs truncate max-w-[200px]">
                  📄 {doc.file_name}
                  {doc.file_size && <span className="text-white/30 ml-1">({fmtFileSize(doc.file_size)})</span>}
                </p>
                <DocumentStatusBadge status={doc.status} rejectionReason={doc.rejection_reason} showReason />
              </div>
            )}

            {/* Progress bar */}
            {uploading && (
              <div className="mt-2">
                <div className="h-1.5 bg-white/[0.07] rounded-full w-32">
                  <div
                    className="h-full bg-gold-400 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-white/35 font-body text-[10px] mt-1">Uploading…</p>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="mt-2 flex items-start gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-red-400 font-body text-xs">{error}</p>
              </div>
            )}
          </div>
        </div>

        {/* Right: action buttons */}
        <div className="flex items-center gap-2 flex-shrink-0">

          {/* View/Download */}
          {doc && (
            <button
              type="button"
              onClick={getSignedUrl}
              disabled={loadingUrl}
              className="p-2 rounded-xl text-white/35 hover:text-pathBlue-400 hover:bg-pathBlue-500/10 border border-transparent hover:border-pathBlue-500/20 transition-all"
              title="Preview / Download"
            >
              {loadingUrl ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}
            </button>
          )}

          {/* Upload / Re-upload */}
          {canReupload && (
            <>
              <input
                ref={inputRef}
                type="file"
                accept={meta.accept}
                onChange={handleFile}
                className="hidden"
                id={`upload-${meta.value}-${applicationId}`}
              />
              <label
                htmlFor={`upload-${meta.value}-${applicationId}`}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl font-body text-xs font-semibold cursor-pointer transition-all ${
                  uploading ? "opacity-50 cursor-not-allowed" :
                  doc?.status === "rejected"
                    ? "bg-gold-400/15 border border-gold-400/30 text-gold-400 hover:bg-gold-400/25"
                    : "bg-white/[0.07] border border-white/[0.12] text-white/65 hover:border-white/25 hover:text-white/85"
                }`}
              >
                {uploading
                  ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  : doc?.status === "rejected"
                    ? <><RefreshCw className="w-3.5 h-3.5" /> Re-upload</>
                    : <><Upload className="w-3.5 h-3.5" /> {doc ? "Replace" : "Upload"}</>
                }
              </label>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
