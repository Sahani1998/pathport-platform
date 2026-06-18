"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import {
  MessageSquare, Trophy, Plus, Loader2, Trash2, Globe, Archive,
  RotateCcw, AlertCircle, CheckCircle2, Edit2, Upload, Star,
} from "lucide-react";
import { TRUST_STATUS_META } from "@/types/institution-trust";
import type { Testimonial, SuccessStory, TrustStatus } from "@/types/institution-trust";
import { IMAGE_MIME_TYPES, MAX_IMAGE_SIZE_BYTES } from "@/types/institution-media";

type StoryType = "testimonial" | "success-story";
type StoryItem = Testimonial | SuccessStory;

interface Props {
  storyType:    StoryType;
  initialItems: StoryItem[];
}

interface AddState {
  // common
  courseName:     string;
  graduationYear: string;
  // testimonial only
  studentName:     string;
  testimonialText: string;
  rating:          string;
  // success-story only
  personName:      string;
  storyText:       string;
  currentRole:     string;
  currentCompany:  string;
}

const EMPTY_ADD: AddState = {
  courseName: "", graduationYear: "",
  studentName: "", testimonialText: "", rating: "",
  personName: "", storyText: "", currentRole: "", currentCompany: "",
};

const isTestimonial = (item: StoryItem): item is Testimonial =>
  "student_name" in item;

export default function StoriesManager({ storyType, initialItems }: Props) {
  const photoInputRef                  = useRef<HTMLInputElement>(null);
  const [items,      setItems]         = useState<StoryItem[]>(initialItems);
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

  const isTestimonialType = storyType === "testimonial";
  const apiBase = `/api/institution-${storyType}s`;

  const inputCls    = "w-full bg-white/[0.06] border border-white/[0.10] rounded-xl px-3 py-2.5 font-body text-sm text-white placeholder-white/25 focus:outline-none focus:border-gold-400/50 transition-colors";
  const textareaCls = `${inputCls} resize-none`;
  const labelCls    = "block text-white/40 font-body text-[10px] uppercase tracking-wider mb-1.5";

  const buildPayload = (d: AddState): Record<string, unknown> => {
    if (isTestimonialType) {
      const p: Record<string, unknown> = {
        student_name:     d.studentName.trim()     || null,
        testimonial_text: d.testimonialText.trim() || null,
        course_name:      d.courseName.trim()      || null,
      };
      const gy = parseInt(d.graduationYear, 10);
      if (!isNaN(gy)) p.graduation_year = gy;
      const r = parseFloat(d.rating);
      if (!isNaN(r)) p.rating = r;
      return p;
    } else {
      const p: Record<string, unknown> = {
        person_name:     d.personName.trim()     || null,
        story_text:      d.storyText.trim()      || null,
        course_name:     d.courseName.trim()     || null,
        current_role:    d.currentRole.trim()    || null,
        current_company: d.currentCompany.trim() || null,
      };
      const gy = parseInt(d.graduationYear, 10);
      if (!isNaN(gy)) p.graduation_year = gy;
      return p;
    }
  };

  const getPhotoUrl = (item: StoryItem): string | null => {
    if (isTestimonial(item)) return item.student_photo_url;
    return (item as SuccessStory).photo_url;
  };

  const getDisplayName = (item: StoryItem): string => {
    if (isTestimonial(item)) return item.student_name;
    return (item as SuccessStory).person_name;
  };

  const handleAdd = async () => {
    setAddErr(null);
    if (isTestimonialType) {
      if (!addDraft.studentName.trim())     { setAddErr("Student name is required");         return; }
      if (!addDraft.testimonialText.trim()) { setAddErr("Testimonial text is required");     return; }
    } else {
      if (!addDraft.personName.trim()) { setAddErr("Person name is required"); return; }
      if (!addDraft.storyText.trim())  { setAddErr("Story text is required");  return; }
    }
    setAddBusy(true);
    try {
      const res  = await fetch(apiBase, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPayload(addDraft)),
      });
      const key  = isTestimonialType ? "testimonial" : "story";
      const json = await res.json() as Record<string, StoryItem | string | undefined>;
      if (!res.ok) throw new Error((json.error as string) ?? "Failed to add");
      setItems(prev => [json[key] as StoryItem, ...prev]);
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
      const key  = isTestimonialType ? "testimonial" : "story";
      const json = await res.json() as Record<string, StoryItem | string | undefined>;
      if (!res.ok) throw new Error((json.error as string) ?? "Save failed");
      setItems(prev => prev.map(i => i.id === editId ? json[key] as StoryItem : i));
      setEditId(null); setEditDraft(null);
    } catch (err) {
      setEditErr(err instanceof Error ? err.message : "Save failed");
    } finally { setEditBusy(false); }
  };

  const changeStatus = async (item: StoryItem, newStatus: TrustStatus) => {
    setStatusBusy(b => ({ ...b, [item.id]: true }));
    try {
      const res  = await fetch(`${apiBase}/${item.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const key  = isTestimonialType ? "testimonial" : "story";
      const json = await res.json() as Record<string, StoryItem | string | undefined>;
      if (res.ok) setItems(prev => prev.map(i => i.id === item.id ? json[key] as StoryItem : i));
    } catch (err) { console.error(err); }
    finally { setStatusBusy(b => ({ ...b, [item.id]: false })); }
  };

  const handleDelete = async (item: StoryItem) => {
    const name = getDisplayName(item);
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
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
      const json = await res.json() as Record<string, string | undefined>;
      const urlKey = isTestimonialType ? "student_photo_url" : "photo_url";
      if (res.ok && json[urlKey]) {
        setItems(prev => prev.map(i =>
          i.id === photoTarget
            ? { ...i, [urlKey]: json[urlKey] }
            : i
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

  const startEdit = (item: StoryItem) => {
    setEditId(item.id);
    if (isTestimonial(item)) {
      setEditDraft({
        ...EMPTY_ADD,
        studentName:     item.student_name,
        testimonialText: item.testimonial_text,
        courseName:      item.course_name      ?? "",
        graduationYear:  item.graduation_year?.toString() ?? "",
        rating:          item.rating?.toString() ?? "",
      });
    } else {
      const s = item as SuccessStory;
      setEditDraft({
        ...EMPTY_ADD,
        personName:     s.person_name,
        storyText:      s.story_text,
        courseName:     s.course_name      ?? "",
        graduationYear: s.graduation_year?.toString() ?? "",
        currentRole:    s.current_role     ?? "",
        currentCompany: s.current_company  ?? "",
      });
    }
    setEditErr(null);
  };

  const published = items.filter(i => i.status === "published").length;
  const EmptyIcon = isTestimonialType ? MessageSquare : Trophy;
  const emptyLabel = isTestimonialType ? "testimonials" : "success stories";
  const addLabel   = isTestimonialType ? "Testimonial" : "Success Story";

  const testimonialFields = (d: AddState, upd: (f: Partial<AddState>) => void) => (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Student Name *</label>
          <input type="text" value={d.studentName}
            onChange={e => upd({ studentName: e.target.value })}
            placeholder="e.g. Priya Sharma" className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Course / Programme</label>
          <input type="text" value={d.courseName}
            onChange={e => upd({ courseName: e.target.value })}
            placeholder="e.g. Diploma in Business" className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Graduation Year</label>
          <input type="number" min={1950} max={2100} value={d.graduationYear}
            onChange={e => upd({ graduationYear: e.target.value })}
            placeholder="e.g. 2023" className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Rating (1–5)</label>
          <input type="number" min={1} max={5} step={1} value={d.rating}
            onChange={e => upd({ rating: e.target.value })}
            placeholder="5" className={inputCls} />
        </div>
      </div>
      <div>
        <label className={labelCls}>Testimonial *</label>
        <textarea value={d.testimonialText}
          onChange={e => upd({ testimonialText: e.target.value })}
          rows={4} placeholder="What the student said about their experience." className={textareaCls} />
      </div>
    </>
  );

  const successStoryFields = (d: AddState, upd: (f: Partial<AddState>) => void) => (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Person Name *</label>
          <input type="text" value={d.personName}
            onChange={e => upd({ personName: e.target.value })}
            placeholder="e.g. Rahul Mehta" className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Course / Programme</label>
          <input type="text" value={d.courseName}
            onChange={e => upd({ courseName: e.target.value })}
            placeholder="e.g. Advanced Diploma in IT" className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Graduation Year</label>
          <input type="number" min={1950} max={2100} value={d.graduationYear}
            onChange={e => upd({ graduationYear: e.target.value })}
            placeholder="e.g. 2021" className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Current Role</label>
          <input type="text" value={d.currentRole}
            onChange={e => upd({ currentRole: e.target.value })}
            placeholder="e.g. Software Engineer" className={inputCls} />
        </div>
        <div className="sm:col-span-2">
          <label className={labelCls}>Current Company</label>
          <input type="text" value={d.currentCompany}
            onChange={e => upd({ currentCompany: e.target.value })}
            placeholder="e.g. Google, DBS Bank" className={inputCls} />
        </div>
      </div>
      <div>
        <label className={labelCls}>Story *</label>
        <textarea value={d.storyText}
          onChange={e => upd({ storyText: e.target.value })}
          rows={4} placeholder="Their journey and achievements." className={textareaCls} />
      </div>
    </>
  );

  return (
    <div className="space-y-5">
      <input
        ref={photoInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        onChange={handlePhotoSelect}
        className="hidden"
      />

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
          <Plus className="w-3.5 h-3.5" /> Add {addLabel}
        </button>
      </div>

      {showAdd && (
        <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-5 space-y-4">
          <h4 className="font-display text-base text-white">Add {addLabel}</h4>
          {isTestimonialType
            ? testimonialFields(addDraft, f => setAddDraft(d => ({ ...d, ...f })))
            : successStoryFields(addDraft, f => setAddDraft(d => ({ ...d, ...f })))
          }
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

      {items.length === 0 && !showAdd && (
        <div className="flex flex-col items-center py-16 border border-dashed border-white/[0.07] rounded-2xl text-white/20">
          <EmptyIcon className="w-8 h-8 mb-3" />
          <p className="font-body text-sm">No {emptyLabel} yet</p>
        </div>
      )}

      <div className="space-y-3">
        {items.map(item => {
          const meta      = TRUST_STATUS_META[item.status];
          const isEdit    = editId === item.id;
          const photoUrl  = getPhotoUrl(item);
          const dispName  = getDisplayName(item);

          return (
            <div key={item.id} className={`rounded-2xl border p-4 transition-all ${
              item.status === "published" ? "border-emerald-400/20 bg-white/[0.04]" :
              item.status === "archived"  ? "border-amber-400/15 bg-white/[0.03] opacity-70" :
              "border-white/[0.08] bg-white/[0.04]"
            }`}>
              {isEdit && editDraft ? (
                <div className="space-y-3">
                  {isTestimonialType
                    ? testimonialFields(editDraft, f => setEditDraft(d => d && ({ ...d, ...f })))
                    : successStoryFields(editDraft, f => setEditDraft(d => d && ({ ...d, ...f })))
                  }
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
                  {/* Photo */}
                  <div className="relative flex-shrink-0 group/photo">
                    <div className="w-12 h-12 rounded-xl overflow-hidden border border-white/[0.10] bg-white/[0.06] flex items-center justify-center">
                      {photoUrl ? (
                        <Image src={photoUrl} alt={dispName} width={48} height={48} className="object-cover w-full h-full" unoptimized />
                      ) : (
                        <span className="font-display font-bold text-white/30 text-lg leading-none">
                          {dispName.slice(0, 1).toUpperCase()}
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

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <p className="font-body font-semibold text-sm text-white/85">{dispName}</p>
                      <span className={`px-1.5 py-0.5 rounded-md border font-body text-[9px] font-semibold ${meta.colour}`}>
                        {meta.label}
                      </span>
                      {isTestimonial(item) && item.rating !== null && item.rating !== undefined && (
                        <span className="flex items-center gap-0.5 text-gold-400 font-body text-[10px]">
                          <Star className="w-3 h-3 fill-current" /> {item.rating}
                        </span>
                      )}
                    </div>
                    {isTestimonial(item) ? (
                      <>
                        {item.course_name && (
                          <p className="text-white/40 font-body text-xs">{item.course_name}{item.graduation_year && ` · ${item.graduation_year}`}</p>
                        )}
                        <p className="text-white/30 font-body text-xs mt-1 line-clamp-2">{item.testimonial_text}</p>
                      </>
                    ) : (
                      <>
                        {((item as SuccessStory).current_role || (item as SuccessStory).current_company) && (
                          <p className="text-white/45 font-body text-xs">
                            {(item as SuccessStory).current_role}
                            {(item as SuccessStory).current_role && (item as SuccessStory).current_company && " at "}
                            {(item as SuccessStory).current_company}
                          </p>
                        )}
                        {(item as SuccessStory).course_name && (
                          <p className="text-white/30 font-body text-[10px]">{(item as SuccessStory).course_name}{(item as SuccessStory).graduation_year && ` · ${(item as SuccessStory).graduation_year}`}</p>
                        )}
                        <p className="text-white/30 font-body text-xs mt-1 line-clamp-2">{(item as SuccessStory).story_text}</p>
                      </>
                    )}
                  </div>

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
