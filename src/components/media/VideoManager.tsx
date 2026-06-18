"use client";

import { useState } from "react";
import {
  Play, Plus, Loader2, Trash2, Globe, Archive,
  RotateCcw, AlertCircle, CheckCircle2, X, Edit2,
} from "lucide-react";
import { VIDEO_STATUS_META } from "@/types/institution-videos";
import type { InstitutionVideo, VideoStatus } from "@/types/institution-videos";

interface Props {
  initialItems: InstitutionVideo[];
}

interface AddState { title: string; description: string; video_url: string }
const EMPTY_ADD: AddState = { title: "", description: "", video_url: "" };

interface EditState { id: string; title: string; description: string; video_url: string }

export default function VideoManager({ initialItems }: Props) {
  const [items,      setItems]     = useState<InstitutionVideo[]>(initialItems);
  const [showAdd,    setShowAdd]   = useState(false);
  const [addDraft,   setAddDraft]  = useState<AddState>(EMPTY_ADD);
  const [addBusy,    setAddBusy]   = useState(false);
  const [addErr,     setAddErr]    = useState<string | null>(null);
  const [editId,     setEditId]    = useState<string | null>(null);
  const [editDraft,  setEditDraft] = useState<EditState | null>(null);
  const [editBusy,   setEditBusy]  = useState(false);
  const [editErr,    setEditErr]   = useState<string | null>(null);
  const [statusBusy, setStatusBusy] = useState<Record<string, boolean>>({});
  const [deleteBusy, setDeleteBusy] = useState<Record<string, boolean>>({});

  const inputCls    = "w-full bg-white/[0.06] border border-white/[0.10] rounded-xl px-3 py-2.5 font-body text-sm text-white placeholder-white/25 focus:outline-none focus:border-gold-400/50 transition-colors";
  const textareaCls = `${inputCls} resize-none`;
  const labelCls    = "block text-white/40 font-body text-[10px] uppercase tracking-wider mb-1.5";

  const handleAdd = async () => {
    setAddErr(null);
    if (!addDraft.title.trim())     { setAddErr("Title is required");     return; }
    if (!addDraft.video_url.trim()) { setAddErr("Video URL is required"); return; }
    setAddBusy(true);
    try {
      const res  = await fetch("/api/institution-videos", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: addDraft.title, description: addDraft.description || null, video_url: addDraft.video_url }),
      });
      const json = await res.json() as { video?: InstitutionVideo; error?: string };
      if (!res.ok) throw new Error(json.error ?? "Failed to add video");
      setItems(prev => [json.video!, ...prev]);
      setAddDraft(EMPTY_ADD);
      setShowAdd(false);
    } catch (err) {
      setAddErr(err instanceof Error ? err.message : "Failed to add video");
    } finally { setAddBusy(false); }
  };

  const saveEdit = async () => {
    if (!editDraft) return;
    setEditErr(null);
    setEditBusy(true);
    try {
      const res  = await fetch(`/api/institution-videos/${editDraft.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: editDraft.title || null, description: editDraft.description || null, video_url: editDraft.video_url || undefined }),
      });
      const json = await res.json() as { video?: InstitutionVideo; error?: string };
      if (!res.ok) throw new Error(json.error ?? "Save failed");
      setItems(prev => prev.map(i => i.id === editDraft.id ? json.video! : i));
      setEditId(null); setEditDraft(null);
    } catch (err) {
      setEditErr(err instanceof Error ? err.message : "Save failed");
    } finally { setEditBusy(false); }
  };

  const changeStatus = async (item: InstitutionVideo, newStatus: VideoStatus) => {
    setStatusBusy(b => ({ ...b, [item.id]: true }));
    try {
      const res  = await fetch(`/api/institution-videos/${item.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const json = await res.json() as { video?: InstitutionVideo; error?: string };
      if (!res.ok) throw new Error(json.error);
      setItems(prev => prev.map(i => i.id === item.id ? json.video! : i));
    } catch (err) { console.error(err); }
    finally { setStatusBusy(b => ({ ...b, [item.id]: false })); }
  };

  const handleDelete = async (item: InstitutionVideo) => {
    if (!confirm(`Delete "${item.title}"? This cannot be undone.`)) return;
    setDeleteBusy(b => ({ ...b, [item.id]: true }));
    try {
      const res = await fetch(`/api/institution-videos/${item.id}`, { method: "DELETE" });
      if (!res.ok) { const j = await res.json() as { error?: string }; throw new Error(j.error); }
      setItems(prev => prev.filter(i => i.id !== item.id));
    } catch (err) { console.error(err); }
    finally { setDeleteBusy(b => ({ ...b, [item.id]: false })); }
  };

  const published = items.filter(i => i.status === "published").length;

  return (
    <div className="space-y-5">

      {/* Header row */}
      <div className="flex items-center justify-between">
        <p className="text-white/40 font-body text-sm">
          <span className="text-white font-semibold">{published}</span> published &nbsp;·&nbsp;
          <span className="text-white/55">{items.filter(i => i.status === "draft").length}</span> draft
        </p>
        <button
          type="button"
          onClick={() => { setShowAdd(true); setAddErr(null); }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gold-500/15 border border-gold-400/30 text-gold-400 font-body text-xs font-semibold hover:bg-gold-500/25 transition-all"
        >
          <Plus className="w-3.5 h-3.5" /> Add Video
        </button>
      </div>

      {/* Add form */}
      {showAdd && (
        <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-5 space-y-4">
          <h4 className="font-display text-base text-white">Add Video</h4>
          <div>
            <label className={labelCls}>Title *</label>
            <input type="text" value={addDraft.title} onChange={e => setAddDraft(d => ({ ...d, title: e.target.value }))}
              placeholder="e.g. Campus Tour 2025" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>YouTube or Vimeo URL *</label>
            <input type="url" value={addDraft.video_url} onChange={e => setAddDraft(d => ({ ...d, video_url: e.target.value }))}
              placeholder="https://www.youtube.com/watch?v=..." className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Description <span className="text-white/20 normal-case">(optional)</span></label>
            <textarea value={addDraft.description} onChange={e => setAddDraft(d => ({ ...d, description: e.target.value }))}
              rows={2} placeholder="A short description of this video." className={textareaCls} />
          </div>
          {addErr && (
            <div className="flex items-center gap-1.5 text-red-400 font-body text-xs">
              <AlertCircle className="w-3.5 h-3.5" /> {addErr}
            </div>
          )}
          <div className="flex gap-2">
            <button type="button" onClick={handleAdd} disabled={addBusy}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gold-500/15 border border-gold-400/30 text-gold-400 font-body text-xs font-semibold hover:bg-gold-500/25 disabled:opacity-50">
              {addBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />} Save
            </button>
            <button type="button" onClick={() => { setShowAdd(false); setAddDraft(EMPTY_ADD); setAddErr(null); }}
              className="px-4 py-2 rounded-xl border border-white/[0.10] text-white/40 font-body text-xs hover:text-white/70">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Empty state */}
      {items.length === 0 && !showAdd && (
        <div className="flex flex-col items-center py-16 border border-dashed border-white/[0.07] rounded-2xl text-white/20">
          <Play className="w-8 h-8 mb-3" />
          <p className="font-body text-sm">No videos yet — add your first video above</p>
        </div>
      )}

      {/* Video list */}
      <div className="space-y-3">
        {items.map(item => {
          const meta     = VIDEO_STATUS_META[item.status];
          const isEdit   = editId === item.id;

          return (
            <div key={item.id} className={`rounded-2xl border p-4 transition-all ${
              item.status === "published" ? "border-emerald-400/20 bg-white/[0.04]" :
              item.status === "archived"  ? "border-amber-400/15 bg-white/[0.03] opacity-70" :
              "border-white/[0.08] bg-white/[0.04]"
            }`}>
              {isEdit && editDraft ? (
                <div className="space-y-3">
                  <div>
                    <label className={labelCls}>Title</label>
                    <input type="text" value={editDraft.title} onChange={e => setEditDraft(d => d && ({ ...d, title: e.target.value }))} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>YouTube / Vimeo URL</label>
                    <input type="url" value={editDraft.video_url} onChange={e => setEditDraft(d => d && ({ ...d, video_url: e.target.value }))} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Description</label>
                    <textarea value={editDraft.description} onChange={e => setEditDraft(d => d && ({ ...d, description: e.target.value }))} rows={2} className={textareaCls} />
                  </div>
                  {editErr && <p className="text-red-400 font-body text-xs">{editErr}</p>}
                  <div className="flex gap-2">
                    <button type="button" onClick={saveEdit} disabled={editBusy}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gold-500/15 border border-gold-400/30 text-gold-400 font-body text-xs font-semibold hover:bg-gold-500/25 disabled:opacity-50">
                      {editBusy ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />} Save
                    </button>
                    <button type="button" onClick={() => { setEditId(null); setEditDraft(null); setEditErr(null); }}
                      className="px-3 py-1.5 rounded-lg border border-white/[0.10] text-white/40 font-body text-xs hover:text-white/60">
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-4">
                  {/* Play icon */}
                  <div className="w-10 h-10 rounded-xl bg-white/[0.06] border border-white/[0.10] flex items-center justify-center flex-shrink-0">
                    <Play className="w-4 h-4 text-white/40" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <p className="font-body font-semibold text-sm text-white/85 truncate">{item.title}</p>
                      <span className={`px-1.5 py-0.5 rounded-md border font-body text-[9px] font-semibold ${meta.colour}`}>
                        {meta.label}
                      </span>
                    </div>
                    {item.description && (
                      <p className="text-white/35 font-body text-xs truncate">{item.description}</p>
                    )}
                    <p className="text-white/20 font-body text-[10px] mt-0.5 truncate">{item.video_url}</p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button type="button" onClick={() => { setEditId(item.id); setEditDraft({ id: item.id, title: item.title, description: item.description ?? "", video_url: item.video_url }); setEditErr(null); }}
                      className="p-1.5 rounded-lg text-white/30 hover:text-white/70 hover:bg-white/[0.06] transition-all" title="Edit">
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    {item.status !== "published" && (
                      <button type="button" disabled={!!statusBusy[item.id]} onClick={() => changeStatus(item, "published")}
                        className="p-1.5 rounded-lg text-white/30 hover:text-emerald-400 hover:bg-emerald-500/10 transition-all disabled:opacity-50" title="Publish">
                        {statusBusy[item.id] ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Globe className="w-3.5 h-3.5" />}
                      </button>
                    )}
                    {item.status === "published" && (
                      <button type="button" disabled={!!statusBusy[item.id]} onClick={() => changeStatus(item, "draft")}
                        className="p-1.5 rounded-lg text-white/30 hover:text-white/70 hover:bg-white/[0.06] transition-all disabled:opacity-50" title="Move to Draft">
                        {statusBusy[item.id] ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
                      </button>
                    )}
                    {item.status !== "archived" && (
                      <button type="button" disabled={!!statusBusy[item.id]} onClick={() => changeStatus(item, "archived")}
                        className="p-1.5 rounded-lg text-white/30 hover:text-amber-400 hover:bg-amber-500/10 transition-all disabled:opacity-50" title="Archive">
                        {statusBusy[item.id] ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Archive className="w-3.5 h-3.5" />}
                      </button>
                    )}
                    <button type="button" disabled={!!deleteBusy[item.id]} onClick={() => handleDelete(item)}
                      className="p-1.5 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-all disabled:opacity-50" title="Delete">
                      {deleteBusy[item.id] ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
