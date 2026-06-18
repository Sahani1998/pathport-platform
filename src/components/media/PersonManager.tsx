"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import {
  Users, Plus, Loader2, Trash2, Globe, Archive,
  RotateCcw, AlertCircle, CheckCircle2, Edit2, Upload,
} from "lucide-react";
import { PERSON_STATUS_META } from "@/types/institution-people";
import type { LeadershipMember, FacultyMember, PersonStatus } from "@/types/institution-people";
import { IMAGE_MIME_TYPES, MAX_IMAGE_SIZE_BYTES } from "@/types/institution-media";

type Person = LeadershipMember | FacultyMember;
type PersonType = "leadership" | "faculty";

interface Props {
  personType:   PersonType;
  initialItems: Person[];
}

interface AddState {
  name:           string;
  roleOrTitle:    string;  // "role" for leadership, "title" for faculty
  department:     string;
  qualifications: string;
  bio:            string;
}

const EMPTY_ADD: AddState = { name: "", roleOrTitle: "", department: "", qualifications: "", bio: "" };

export default function PersonManager({ personType, initialItems }: Props) {
  const photoInputRef                  = useRef<HTMLInputElement>(null);
  const [items,      setItems]         = useState<Person[]>(initialItems);
  const [showAdd,    setShowAdd]       = useState(false);
  const [addDraft,   setAddDraft]      = useState<AddState>(EMPTY_ADD);
  const [addBusy,    setAddBusy]       = useState(false);
  const [addErr,     setAddErr]        = useState<string | null>(null);
  const [editId,     setEditId]        = useState<string | null>(null);
  const [editDraft,  setEditDraft]     = useState<AddState | null>(null);
  const [editBusy,   setEditBusy]      = useState(false);
  const [editErr,    setEditErr]       = useState<string | null>(null);
  const [statusBusy, setStatusBusy]   = useState<Record<string, boolean>>({});
  const [deleteBusy, setDeleteBusy]   = useState<Record<string, boolean>>({});
  const [photoBusy,  setPhotoBusy]    = useState<Record<string, boolean>>({});
  const [photoTarget, setPhotoTarget] = useState<string | null>(null);

  const isLeadership = personType === "leadership";
  const apiBase      = `/api/institution-${personType}`;
  const roleLabel    = isLeadership ? "Role / Title" : "Position Title";
  const rolePlaceholder = isLeadership ? "e.g. Principal" : "e.g. Senior Lecturer";
  const namePlaceholder = isLeadership ? "e.g. Dr. Sarah Lee" : "e.g. Mr. James Tan";

  const inputCls    = "w-full bg-white/[0.06] border border-white/[0.10] rounded-xl px-3 py-2.5 font-body text-sm text-white placeholder-white/25 focus:outline-none focus:border-gold-400/50 transition-colors";
  const textareaCls = `${inputCls} resize-none`;
  const labelCls    = "block text-white/40 font-body text-[10px] uppercase tracking-wider mb-1.5";

  const buildPayload = (d: AddState) => {
    const base: Record<string, string | null> = {
      name: d.name.trim() || null,
      bio:  d.bio.trim()  || null,
    };
    if (isLeadership) {
      base.role = d.roleOrTitle.trim() || null;
    } else {
      base.title          = d.roleOrTitle.trim()    || null;
      base.department     = d.department.trim()     || null;
      base.qualifications = d.qualifications.trim() || null;
    }
    return base;
  };

  const handleAdd = async () => {
    setAddErr(null);
    if (!addDraft.name.trim())        { setAddErr("Name is required");                               return; }
    if (!addDraft.roleOrTitle.trim()) { setAddErr(`${isLeadership ? "Role" : "Title"} is required`); return; }
    setAddBusy(true);
    try {
      const res  = await fetch(apiBase, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPayload(addDraft)),
      });
      const json = await res.json() as { member?: Person; error?: string };
      if (!res.ok) throw new Error(json.error ?? "Failed to add");
      setItems(prev => [json.member!, ...prev]);
      setAddDraft(EMPTY_ADD);
      setShowAdd(false);
    } catch (err) {
      setAddErr(err instanceof Error ? err.message : "Failed to add");
    } finally { setAddBusy(false); }
  };

  const saveEdit = async () => {
    if (!editDraft || !editId) return;
    setEditErr(null);
    setEditBusy(true);
    try {
      const res  = await fetch(`${apiBase}/${editId}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPayload(editDraft)),
      });
      const json = await res.json() as { member?: Person; error?: string };
      if (!res.ok) throw new Error(json.error ?? "Save failed");
      setItems(prev => prev.map(i => i.id === editId ? json.member! : i));
      setEditId(null); setEditDraft(null);
    } catch (err) {
      setEditErr(err instanceof Error ? err.message : "Save failed");
    } finally { setEditBusy(false); }
  };

  const changeStatus = async (item: Person, newStatus: PersonStatus) => {
    setStatusBusy(b => ({ ...b, [item.id]: true }));
    try {
      const res  = await fetch(`${apiBase}/${item.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const json = await res.json() as { member?: Person; error?: string };
      if (res.ok) setItems(prev => prev.map(i => i.id === item.id ? json.member! : i));
    } catch (err) { console.error(err); }
    finally { setStatusBusy(b => ({ ...b, [item.id]: false })); }
  };

  const handleDelete = async (item: Person) => {
    if (!confirm(`Delete "${item.name}"? This cannot be undone.`)) return;
    setDeleteBusy(b => ({ ...b, [item.id]: true }));
    try {
      const res = await fetch(`${apiBase}/${item.id}`, { method: "DELETE" });
      if (res.ok || res.status === 204) setItems(prev => prev.filter(i => i.id !== item.id));
    } catch (err) { console.error(err); }
    finally { setDeleteBusy(b => ({ ...b, [item.id]: false })); }
  };

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !photoTarget) return;
    if (!(IMAGE_MIME_TYPES as readonly string[]).includes(file.type)) return;
    if (file.size > MAX_IMAGE_SIZE_BYTES) return;

    setPhotoBusy(b => ({ ...b, [photoTarget]: true }));
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res  = await fetch(`${apiBase}/${photoTarget}/photo`, { method: "POST", body: fd });
      const json = await res.json() as { photo_url?: string; error?: string };
      if (res.ok && json.photo_url) {
        setItems(prev => prev.map(i =>
          i.id === photoTarget ? { ...i, photo_url: json.photo_url! } : i
        ));
      }
    } catch (err) { console.error(err); }
    finally {
      setPhotoBusy(b => ({ ...b, [photoTarget]: false }));
      setPhotoTarget(null);
      if (photoInputRef.current) photoInputRef.current.value = "";
    }
  };

  const startPhotoUpload = (id: string) => {
    setPhotoTarget(id);
    photoInputRef.current?.click();
  };

  const startEdit = (item: Person) => {
    const name        = item.name;
    const roleOrTitle = isLeadership
      ? (item as LeadershipMember).role
      : (item as FacultyMember).title;
    const department     = isLeadership ? "" : ((item as FacultyMember).department     ?? "");
    const qualifications = isLeadership ? "" : ((item as FacultyMember).qualifications ?? "");
    const bio            = item.bio ?? "";
    setEditId(item.id);
    setEditDraft({ name, roleOrTitle, department, qualifications, bio });
    setEditErr(null);
  };

  const published = items.filter(i => i.status === "published").length;

  return (
    <div className="space-y-5">
      <input
        ref={photoInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        onChange={handlePhotoSelect}
        className="hidden"
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-white/40 font-body text-sm">
          <span className="text-white font-semibold">{published}</span> published &nbsp;·&nbsp;
          <span className="text-white/55">{items.filter(i => i.status === "draft").length}</span> draft
        </p>
        <button
          type="button"
          onClick={() => { setShowAdd(true); setAddErr(null); setAddDraft(EMPTY_ADD); }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gold-500/15 border border-gold-400/30 text-gold-400 font-body text-xs font-semibold hover:bg-gold-500/25 transition-all"
        >
          <Plus className="w-3.5 h-3.5" /> Add {isLeadership ? "Leader" : "Faculty"}
        </button>
      </div>

      {/* Add form */}
      {showAdd && (
        <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-5 space-y-4">
          <h4 className="font-display text-base text-white">Add {isLeadership ? "Leadership Member" : "Faculty Member"}</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Full Name *</label>
              <input type="text" value={addDraft.name} onChange={e => setAddDraft(d => ({ ...d, name: e.target.value }))}
                placeholder={namePlaceholder} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>{roleLabel} *</label>
              <input type="text" value={addDraft.roleOrTitle} onChange={e => setAddDraft(d => ({ ...d, roleOrTitle: e.target.value }))}
                placeholder={rolePlaceholder} className={inputCls} />
            </div>
            {!isLeadership && (
              <>
                <div>
                  <label className={labelCls}>Department</label>
                  <input type="text" value={addDraft.department} onChange={e => setAddDraft(d => ({ ...d, department: e.target.value }))}
                    placeholder="e.g. Business & Finance" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Qualifications</label>
                  <input type="text" value={addDraft.qualifications} onChange={e => setAddDraft(d => ({ ...d, qualifications: e.target.value }))}
                    placeholder="e.g. MBA (NUS), ACCA" className={inputCls} />
                </div>
              </>
            )}
          </div>
          <div>
            <label className={labelCls}>Bio <span className="text-white/20 normal-case">(optional)</span></label>
            <textarea value={addDraft.bio} onChange={e => setAddDraft(d => ({ ...d, bio: e.target.value }))}
              rows={3} placeholder="A short professional biography." className={textareaCls} />
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
          <Users className="w-8 h-8 mb-3" />
          <p className="font-body text-sm">No {isLeadership ? "leadership members" : "faculty"} yet</p>
        </div>
      )}

      {/* List */}
      <div className="space-y-3">
        {items.map(item => {
          const meta   = PERSON_STATUS_META[item.status];
          const isEdit = editId === item.id;

          return (
            <div key={item.id} className={`rounded-2xl border p-4 transition-all ${
              item.status === "published" ? "border-emerald-400/20 bg-white/[0.04]" :
              item.status === "archived"  ? "border-amber-400/15 bg-white/[0.03] opacity-70" :
              "border-white/[0.08] bg-white/[0.04]"
            }`}>
              {isEdit && editDraft ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className={labelCls}>Full Name</label>
                      <input type="text" value={editDraft.name} onChange={e => setEditDraft(d => d && ({ ...d, name: e.target.value }))} className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>{roleLabel}</label>
                      <input type="text" value={editDraft.roleOrTitle} onChange={e => setEditDraft(d => d && ({ ...d, roleOrTitle: e.target.value }))} className={inputCls} />
                    </div>
                    {!isLeadership && (
                      <>
                        <div>
                          <label className={labelCls}>Department</label>
                          <input type="text" value={editDraft.department} onChange={e => setEditDraft(d => d && ({ ...d, department: e.target.value }))} className={inputCls} />
                        </div>
                        <div>
                          <label className={labelCls}>Qualifications</label>
                          <input type="text" value={editDraft.qualifications} onChange={e => setEditDraft(d => d && ({ ...d, qualifications: e.target.value }))} className={inputCls} />
                        </div>
                      </>
                    )}
                  </div>
                  <div>
                    <label className={labelCls}>Bio</label>
                    <textarea value={editDraft.bio} onChange={e => setEditDraft(d => d && ({ ...d, bio: e.target.value }))} rows={3} className={textareaCls} />
                  </div>
                  {editErr && <p className="text-red-400 font-body text-xs">{editErr}</p>}
                  <div className="flex gap-2">
                    <button type="button" onClick={saveEdit} disabled={editBusy}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gold-500/15 border border-gold-400/30 text-gold-400 font-body text-xs font-semibold disabled:opacity-50">
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
                  {/* Headshot */}
                  <div className="relative flex-shrink-0 group/photo">
                    <div className="w-12 h-12 rounded-xl overflow-hidden border border-white/[0.10] bg-white/[0.06] flex items-center justify-center">
                      {item.photo_url ? (
                        <Image src={item.photo_url} alt={item.name} width={48} height={48} className="object-cover w-full h-full" unoptimized />
                      ) : (
                        <span className="font-display font-bold text-white/30 text-lg leading-none">
                          {item.name.slice(0, 1).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      disabled={!!photoBusy[item.id]}
                      onClick={() => startPhotoUpload(item.id)}
                      className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/50 opacity-0 group-hover/photo:opacity-100 transition-opacity"
                      title="Upload photo"
                    >
                      {photoBusy[item.id]
                        ? <Loader2 className="w-3.5 h-3.5 text-white animate-spin" />
                        : <Upload className="w-3.5 h-3.5 text-white" />
                      }
                    </button>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <p className="font-body font-semibold text-sm text-white/85">{item.name}</p>
                      <span className={`px-1.5 py-0.5 rounded-md border font-body text-[9px] font-semibold ${meta.colour}`}>
                        {meta.label}
                      </span>
                    </div>
                    <p className="text-white/45 font-body text-xs">
                      {isLeadership
                        ? (item as LeadershipMember).role
                        : (item as FacultyMember).title
                      }
                      {!isLeadership && (item as FacultyMember).department && (
                        <span className="text-white/25"> · {(item as FacultyMember).department}</span>
                      )}
                    </p>
                    {!isLeadership && (item as FacultyMember).qualifications && (
                      <p className="text-white/25 font-body text-[10px] mt-0.5">{(item as FacultyMember).qualifications}</p>
                    )}
                    {item.bio && (
                      <p className="text-white/30 font-body text-xs mt-1 line-clamp-2">{item.bio}</p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button type="button" onClick={() => startEdit(item)}
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
