"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import {
  Upload, Loader2, AlertCircle, Trash2, Globe, Archive, FileEdit, X,
  CheckCircle2, RotateCcw,
} from "lucide-react";
import {
  MEDIA_CATEGORIES, MEDIA_STATUS_META,
  IMAGE_MIME_TYPES, MAX_IMAGE_SIZE_BYTES, fmtFileSize,
} from "@/types/institution-media";
import type { InstitutionMedia, MediaStatus, MediaCategory } from "@/types/institution-media";

interface Props {
  initialItems: InstitutionMedia[];
  collegeId:    string;
}

interface UploadState {
  busy:     boolean;
  progress: number;
  error:    string | null;
}

interface EditState {
  id:       string;
  title:    string;
  caption:  string;
  alt_text: string;
  category: MediaCategory | "";
}

export default function GalleryManager({ initialItems, collegeId }: Props) {
  const inputRef                   = useRef<HTMLInputElement>(null);
  const [items,   setItems]        = useState<InstitutionMedia[]>(initialItems);
  const [upload,  setUpload]       = useState<UploadState>({ busy: false, progress: 0, error: null });
  const [editId,  setEditId]       = useState<string | null>(null);
  const [editDraft, setEditDraft]  = useState<EditState | null>(null);
  const [statusBusy, setStatusBusy] = useState<Record<string, boolean>>({});
  const [deleteBusy, setDeleteBusy] = useState<Record<string, boolean>>({});
  const [saveErr, setSaveErr]      = useState<string | null>(null);
  const [saveBusy, setSaveBusy]    = useState(false);

  // ── Upload ────────────────────────────────────────────────────────────────
  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUpload({ busy: false, progress: 0, error: null });

    if (!(IMAGE_MIME_TYPES as readonly string[]).includes(file.type)) {
      setUpload(u => ({ ...u, error: "Only JPEG, PNG, or WebP images are allowed." }));
      return;
    }
    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      setUpload(u => ({ ...u, error: `File too large. Max 5 MB (${fmtFileSize(file.size)} uploaded).` }));
      return;
    }

    setUpload({ busy: true, progress: 20, error: null });
    const fd = new FormData();
    fd.append("file", file);

    try {
      setUpload(u => ({ ...u, progress: 50 }));
      const res  = await fetch("/api/institution-media", { method: "POST", body: fd });
      setUpload(u => ({ ...u, progress: 90 }));
      const json = await res.json() as { media?: InstitutionMedia; error?: string };
      if (!res.ok) throw new Error(json.error ?? "Upload failed");
      setItems(prev => [json.media!, ...prev]);
      setUpload({ busy: false, progress: 100, error: null });
      setTimeout(() => setUpload(u => ({ ...u, progress: 0 })), 800);
    } catch (err) {
      setUpload({ busy: false, progress: 0, error: err instanceof Error ? err.message : "Upload failed" });
    } finally {
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  // ── Status change ─────────────────────────────────────────────────────────
  const changeStatus = async (item: InstitutionMedia, newStatus: MediaStatus) => {
    setStatusBusy(b => ({ ...b, [item.id]: true }));
    try {
      const res  = await fetch(`/api/institution-media/${item.id}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ status: newStatus }),
      });
      const json = await res.json() as { media?: InstitutionMedia; error?: string };
      if (!res.ok) throw new Error(json.error ?? "Update failed");
      setItems(prev => prev.map(i => i.id === item.id ? json.media! : i));
    } catch (err) {
      console.error(err);
    } finally {
      setStatusBusy(b => ({ ...b, [item.id]: false }));
    }
  };

  // ── Delete ────────────────────────────────────────────────────────────────
  const handleDelete = async (item: InstitutionMedia) => {
    if (!confirm("Delete this image permanently? This cannot be undone.")) return;
    setDeleteBusy(b => ({ ...b, [item.id]: true }));
    try {
      const res = await fetch(`/api/institution-media/${item.id}`, { method: "DELETE" });
      if (!res.ok) {
        const json = await res.json() as { error?: string };
        throw new Error(json.error ?? "Delete failed");
      }
      setItems(prev => prev.filter(i => i.id !== item.id));
    } catch (err) {
      console.error(err);
    } finally {
      setDeleteBusy(b => ({ ...b, [item.id]: false }));
    }
  };

  // ── Edit metadata ─────────────────────────────────────────────────────────
  const startEdit = (item: InstitutionMedia) => {
    setEditId(item.id);
    setEditDraft({
      id:       item.id,
      title:    item.title    ?? "",
      caption:  item.caption  ?? "",
      alt_text: item.alt_text ?? "",
      category: item.category ?? "",
    });
    setSaveErr(null);
  };

  const saveEdit = async () => {
    if (!editDraft) return;
    setSaveBusy(true);
    setSaveErr(null);
    try {
      const res  = await fetch(`/api/institution-media/${editDraft.id}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          title:    editDraft.title    || null,
          caption:  editDraft.caption  || null,
          alt_text: editDraft.alt_text || null,
          category: editDraft.category || null,
        }),
      });
      const json = await res.json() as { media?: InstitutionMedia; error?: string };
      if (!res.ok) throw new Error(json.error ?? "Save failed");
      setItems(prev => prev.map(i => i.id === editDraft.id ? json.media! : i));
      setEditId(null);
      setEditDraft(null);
    } catch (err) {
      setSaveErr(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaveBusy(false);
    }
  };

  const inputCls    = "w-full bg-white/[0.06] border border-white/[0.10] rounded-lg px-2.5 py-2 font-body text-xs text-white placeholder-white/25 focus:outline-none focus:border-gold-400/50";
  const selectCls   = `${inputCls} [color-scheme:dark]`;
  const published   = items.filter(i => i.status === "published");
  const drafts      = items.filter(i => i.status === "draft");
  const archived    = items.filter(i => i.status === "archived");

  return (
    <div className="space-y-6">

      {/* Upload area */}
      <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-5">
        <div className="flex items-center justify-between mb-3">
          <p className="font-body text-sm text-white/70">
            <span className="text-white font-semibold">{published.length}</span> published &nbsp;·&nbsp;
            <span className="text-white/55">{drafts.length}</span> draft &nbsp;·&nbsp;
            <span className="text-amber-400/70">{archived.length}</span> archived
          </p>
          <button
            type="button"
            disabled={upload.busy}
            onClick={() => inputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gold-500/15 border border-gold-400/30 text-gold-400 font-body text-xs font-semibold hover:bg-gold-500/25 transition-all disabled:opacity-50"
          >
            {upload.busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
            Upload Image
          </button>
          <input ref={inputRef} type="file" accept="image/jpeg,image/jpg,image/png,image/webp" onChange={handleFile} className="hidden" />
        </div>

        {upload.progress > 0 && (
          <div className="h-1 bg-white/[0.07] rounded-full mb-2">
            <div className="h-full bg-gold-400 rounded-full transition-all duration-300" style={{ width: `${upload.progress}%` }} />
          </div>
        )}
        {upload.error && (
          <div className="flex items-start gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-red-400 font-body text-xs">{upload.error}</p>
            <button type="button" onClick={() => setUpload(u => ({ ...u, error: null }))} className="ml-auto">
              <X className="w-3 h-3 text-white/25" />
            </button>
          </div>
        )}
      </div>

      {/* Empty state */}
      {items.length === 0 && (
        <div className="flex flex-col items-center py-16 text-white/20 border border-dashed border-white/[0.07] rounded-2xl">
          <Upload className="w-8 h-8 mb-3" />
          <p className="font-body text-sm">No gallery images yet — upload your first one above</p>
        </div>
      )}

      {/* Image grid */}
      {items.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {items.map(item => {
            const statusMeta = MEDIA_STATUS_META[item.status];
            const isEditOpen = editId === item.id;
            return (
              <div
                key={item.id}
                className={`rounded-2xl border overflow-hidden transition-all ${
                  item.status === "published" ? "border-emerald-400/20" :
                  item.status === "archived"  ? "border-amber-400/15 opacity-60" :
                  "border-white/[0.08]"
                } bg-white/[0.04]`}
              >
                {/* Thumbnail */}
                <div className="relative aspect-video">
                  <Image
                    src={item.public_url}
                    alt={item.alt_text ?? item.title ?? "Gallery image"}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                  {/* Status badge */}
                  <span className={`absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-md border font-body text-[9px] font-semibold ${statusMeta.colour}`}>
                    {statusMeta.label}
                  </span>
                </div>

                {/* Metadata (collapsed / expanded) */}
                {isEditOpen && editDraft ? (
                  <div className="p-3 space-y-2">
                    <div>
                      <label className="text-white/30 font-body text-[9px] uppercase tracking-wider block mb-1">Title</label>
                      <input type="text" value={editDraft.title} onChange={e => setEditDraft(d => d && ({ ...d, title: e.target.value }))} className={inputCls} placeholder="e.g. Main Campus Atrium" />
                    </div>
                    <div>
                      <label className="text-white/30 font-body text-[9px] uppercase tracking-wider block mb-1">Caption</label>
                      <input type="text" value={editDraft.caption} onChange={e => setEditDraft(d => d && ({ ...d, caption: e.target.value }))} className={inputCls} placeholder="Short caption" />
                    </div>
                    <div>
                      <label className="text-white/30 font-body text-[9px] uppercase tracking-wider block mb-1">Alt Text</label>
                      <input type="text" value={editDraft.alt_text} onChange={e => setEditDraft(d => d && ({ ...d, alt_text: e.target.value }))} className={inputCls} placeholder="Describe for screen readers" />
                    </div>
                    <div>
                      <label className="text-white/30 font-body text-[9px] uppercase tracking-wider block mb-1">Category</label>
                      <select value={editDraft.category} onChange={e => setEditDraft(d => d && ({ ...d, category: e.target.value as MediaCategory | "" }))} className={selectCls}>
                        <option value="">— None —</option>
                        {MEDIA_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                      </select>
                    </div>
                    {saveErr && <p className="text-red-400 font-body text-[10px]">{saveErr}</p>}
                    <div className="flex gap-2">
                      <button type="button" onClick={saveEdit} disabled={saveBusy}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-gold-500/15 border border-gold-400/30 text-gold-400 font-body text-[10px] font-semibold hover:bg-gold-500/25 disabled:opacity-50">
                        {saveBusy ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />} Save
                      </button>
                      <button type="button" onClick={() => { setEditId(null); setEditDraft(null); }}
                        className="px-2.5 py-1.5 rounded-lg border border-white/[0.10] text-white/35 font-body text-[10px] hover:text-white/60">
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-2.5 space-y-2">
                    {item.title && <p className="font-body text-xs text-white/70 truncate">{item.title}</p>}
                    {item.category && (
                      <span className="inline-block px-1.5 py-0.5 rounded-md bg-white/[0.06] border border-white/[0.08] text-white/35 font-body text-[9px]">
                        {MEDIA_CATEGORIES.find(c => c.value === item.category)?.label ?? item.category}
                      </span>
                    )}

                    {/* Action row */}
                    <div className="flex items-center gap-1 flex-wrap">
                      {/* Edit metadata */}
                      <button type="button" onClick={() => startEdit(item)}
                        className="p-1.5 rounded-lg text-white/30 hover:text-white/70 hover:bg-white/[0.06] transition-all" title="Edit metadata">
                        <FileEdit className="w-3 h-3" />
                      </button>

                      {/* Publish */}
                      {item.status !== "published" && (
                        <button type="button" disabled={!!statusBusy[item.id]} onClick={() => changeStatus(item, "published")}
                          className="p-1.5 rounded-lg text-white/30 hover:text-emerald-400 hover:bg-emerald-500/10 transition-all disabled:opacity-50" title="Publish">
                          {statusBusy[item.id] ? <Loader2 className="w-3 h-3 animate-spin" /> : <Globe className="w-3 h-3" />}
                        </button>
                      )}

                      {/* Back to draft */}
                      {item.status === "published" && (
                        <button type="button" disabled={!!statusBusy[item.id]} onClick={() => changeStatus(item, "draft")}
                          className="p-1.5 rounded-lg text-white/30 hover:text-white/70 hover:bg-white/[0.06] transition-all disabled:opacity-50" title="Move to Draft">
                          {statusBusy[item.id] ? <Loader2 className="w-3 h-3 animate-spin" /> : <RotateCcw className="w-3 h-3" />}
                        </button>
                      )}

                      {/* Archive */}
                      {item.status !== "archived" && (
                        <button type="button" disabled={!!statusBusy[item.id]} onClick={() => changeStatus(item, "archived")}
                          className="p-1.5 rounded-lg text-white/30 hover:text-amber-400 hover:bg-amber-500/10 transition-all disabled:opacity-50" title="Archive">
                          {statusBusy[item.id] ? <Loader2 className="w-3 h-3 animate-spin" /> : <Archive className="w-3 h-3" />}
                        </button>
                      )}

                      {/* Delete */}
                      <button type="button" disabled={!!deleteBusy[item.id]} onClick={() => handleDelete(item)}
                        className="p-1.5 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-all disabled:opacity-50 ml-auto" title="Delete">
                        {deleteBusy[item.id] ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                      </button>
                    </div>
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
