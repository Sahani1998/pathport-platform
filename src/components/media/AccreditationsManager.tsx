"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import {
  Award, Plus, Loader2, Trash2, Globe, Archive,
  RotateCcw, AlertCircle, CheckCircle2, Edit2, Upload,
} from "lucide-react";
import { TRUST_STATUS_META } from "@/types/institution-trust";
import type { Accreditation, TrustStatus } from "@/types/institution-trust";
import { IMAGE_MIME_TYPES, MAX_IMAGE_SIZE_BYTES } from "@/types/institution-media";

interface Props {
  initialItems: Accreditation[];
}

interface AddState {
  name:         string;
  issuing_body: string;
  description:  string;
  year_awarded: string;
  valid_until:  string;
}

const EMPTY_ADD: AddState = { name: "", issuing_body: "", description: "", year_awarded: "", valid_until: "" };

export default function AccreditationsManager({ initialItems }: Props) {
  const logoInputRef                   = useRef<HTMLInputElement>(null);
  const [items,      setItems]         = useState<Accreditation[]>(initialItems);
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
  const [logoBusy,   setLogoBusy]     = useState<Record<string, boolean>>({});
  const [logoTarget, setLogoTarget]   = useState<string | null>(null);

  const inputCls    = "w-full bg-white/[0.06] border border-white/[0.10] rounded-xl px-3 py-2.5 font-body text-sm text-white placeholder-white/25 focus:outline-none focus:border-gold-400/50 transition-colors";
  const textareaCls = `${inputCls} resize-none`;
  const labelCls    = "block text-white/40 font-body text-[10px] uppercase tracking-wider mb-1.5";

  const parseYear = (s: string): number | undefined => {
    const n = parseInt(s, 10);
    return isNaN(n) ? undefined : n;
  };

  const buildPayload = (d: AddState) => ({
    name:         d.name.trim()         || null,
    issuing_body: d.issuing_body.trim() || null,
    description:  d.description.trim() || null,
    year_awarded: parseYear(d.year_awarded) ?? null,
    valid_until:  parseYear(d.valid_until)  ?? null,
  });

  const handleAdd = async () => {
    setAddErr(null);
    if (!addDraft.name.trim())         { setAddErr("Name is required");         return; }
    if (!addDraft.issuing_body.trim()) { setAddErr("Issuing body is required"); return; }
    setAddBusy(true);
    try {
      const payload: Record<string, unknown> = {
        name:         addDraft.name.trim(),
        issuing_body: addDraft.issuing_body.trim(),
      };
      if (addDraft.description.trim()) payload.description  = addDraft.description.trim();
      if (addDraft.year_awarded)       payload.year_awarded = parseYear(addDraft.year_awarded);
      if (addDraft.valid_until)        payload.valid_until  = parseYear(addDraft.valid_until);

      const res  = await fetch("/api/institution-accreditations", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json() as { accreditation?: Accreditation; error?: string };
      if (!res.ok) throw new Error(json.error ?? "Failed to add");
      setItems(prev => [json.accreditation!, ...prev]);
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
      const res  = await fetch(`/api/institution-accreditations/${editId}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPayload(editDraft)),
      });
      const json = await res.json() as { accreditation?: Accreditation; error?: string };
      if (!res.ok) throw new Error(json.error ?? "Save failed");
      setItems(prev => prev.map(i => i.id === editId ? json.accreditation! : i));
      setEditId(null); setEditDraft(null);
    } catch (err) {
      setEditErr(err instanceof Error ? err.message : "Save failed");
    } finally { setEditBusy(false); }
  };

  const changeStatus = async (item: Accreditation, newStatus: TrustStatus) => {
    setStatusBusy(b => ({ ...b, [item.id]: true }));
    try {
      const res  = await fetch(`/api/institution-accreditations/${item.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const json = await res.json() as { accreditation?: Accreditation; error?: string };
      if (res.ok) setItems(prev => prev.map(i => i.id === item.id ? json.accreditation! : i));
    } catch (err) { console.error(err); }
    finally { setStatusBusy(b => ({ ...b, [item.id]: false })); }
  };

  const handleDelete = async (item: Accreditation) => {
    if (!confirm(`Delete "${item.name}"? This cannot be undone.`)) return;
    setDeleteBusy(b => ({ ...b, [item.id]: true }));
    try {
      const res = await fetch(`/api/institution-accreditations/${item.id}`, { method: "DELETE" });
      if (res.ok || res.status === 204) setItems(prev => prev.filter(i => i.id !== item.id));
    } catch (err) { console.error(err); }
    finally { setDeleteBusy(b => ({ ...b, [item.id]: false })); }
  };

  const handleLogoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !logoTarget) return;
    if (!(IMAGE_MIME_TYPES as readonly string[]).includes(file.type)) return;
    if (file.size > MAX_IMAGE_SIZE_BYTES) return;

    setLogoBusy(b => ({ ...b, [logoTarget]: true }));
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res  = await fetch(`/api/institution-accreditations/${logoTarget}/logo`, { method: "POST", body: fd });
      const json = await res.json() as { logo_url?: string; error?: string };
      if (res.ok && json.logo_url) {
        setItems(prev => prev.map(i =>
          i.id === logoTarget ? { ...i, logo_url: json.logo_url! } : i
        ));
      }
    } catch (err) { console.error(err); }
    finally {
      setLogoBusy(b => ({ ...b, [logoTarget]: false }));
      setLogoTarget(null);
      if (logoInputRef.current) logoInputRef.current.value = "";
    }
  };

  const startLogoUpload = (id: string) => {
    setLogoTarget(id);
    logoInputRef.current?.click();
  };

  const startEdit = (item: Accreditation) => {
    setEditId(item.id);
    setEditDraft({
      name:         item.name,
      issuing_body: item.issuing_body,
      description:  item.description ?? "",
      year_awarded: item.year_awarded?.toString() ?? "",
      valid_until:  item.valid_until?.toString()  ?? "",
    });
    setEditErr(null);
  };

  const published = items.filter(i => i.status === "published").length;

  const yearFields = (d: AddState, update: (f: Partial<AddState>) => void) => (
    <div className="grid grid-cols-2 gap-3">
      <div>
        <label className={labelCls}>Year Awarded</label>
        <input type="number" min={1900} max={2100} value={d.year_awarded}
          onChange={e => update({ year_awarded: e.target.value })}
          placeholder="e.g. 2019" className={inputCls} />
      </div>
      <div>
        <label className={labelCls}>Valid Until</label>
        <input type="number" min={1900} max={2100} value={d.valid_until}
          onChange={e => update({ valid_until: e.target.value })}
          placeholder="e.g. 2026" className={inputCls} />
      </div>
    </div>
  );

  return (
    <div className="space-y-5">
      <input
        ref={logoInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        onChange={handleLogoSelect}
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
          <Plus className="w-3.5 h-3.5" /> Add Accreditation
        </button>
      </div>

      {showAdd && (
        <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-5 space-y-4">
          <h4 className="font-display text-base text-white">Add Accreditation</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Accreditation Name *</label>
              <input type="text" value={addDraft.name}
                onChange={e => setAddDraft(d => ({ ...d, name: e.target.value }))}
                placeholder="e.g. ISO 9001:2015" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Issuing Body *</label>
              <input type="text" value={addDraft.issuing_body}
                onChange={e => setAddDraft(d => ({ ...d, issuing_body: e.target.value }))}
                placeholder="e.g. CPE, SSG, BCA" className={inputCls} />
            </div>
          </div>
          {yearFields(addDraft, f => setAddDraft(d => ({ ...d, ...f })))}
          <div>
            <label className={labelCls}>Description <span className="text-white/20 normal-case">(optional)</span></label>
            <textarea value={addDraft.description}
              onChange={e => setAddDraft(d => ({ ...d, description: e.target.value }))}
              rows={2} placeholder="Brief description of this accreditation." className={textareaCls} />
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

      {items.length === 0 && !showAdd && (
        <div className="flex flex-col items-center py-16 border border-dashed border-white/[0.07] rounded-2xl text-white/20">
          <Award className="w-8 h-8 mb-3" />
          <p className="font-body text-sm">No accreditations yet</p>
        </div>
      )}

      <div className="space-y-3">
        {items.map(item => {
          const meta   = TRUST_STATUS_META[item.status];
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
                      <label className={labelCls}>Name</label>
                      <input type="text" value={editDraft.name}
                        onChange={e => setEditDraft(d => d && ({ ...d, name: e.target.value }))}
                        className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>Issuing Body</label>
                      <input type="text" value={editDraft.issuing_body}
                        onChange={e => setEditDraft(d => d && ({ ...d, issuing_body: e.target.value }))}
                        className={inputCls} />
                    </div>
                  </div>
                  {yearFields(editDraft, f => setEditDraft(d => d && ({ ...d, ...f })))}
                  <div>
                    <label className={labelCls}>Description</label>
                    <textarea value={editDraft.description}
                      onChange={e => setEditDraft(d => d && ({ ...d, description: e.target.value }))}
                      rows={2} className={textareaCls} />
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
                  {/* Logo */}
                  <div className="relative flex-shrink-0 group/logo">
                    <div className="w-12 h-12 rounded-xl overflow-hidden border border-white/[0.10] bg-white/[0.06] flex items-center justify-center">
                      {item.logo_url ? (
                        <Image src={item.logo_url} alt={item.name} width={48} height={48} className="object-contain w-full h-full p-1" unoptimized />
                      ) : (
                        <Award className="w-5 h-5 text-white/20" />
                      )}
                    </div>
                    <button
                      type="button"
                      disabled={!!logoBusy[item.id]}
                      onClick={() => startLogoUpload(item.id)}
                      className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/50 opacity-0 group-hover/logo:opacity-100 transition-opacity"
                      title="Upload logo"
                    >
                      {logoBusy[item.id]
                        ? <Loader2 className="w-3.5 h-3.5 text-white animate-spin" />
                        : <Upload className="w-3.5 h-3.5 text-white" />
                      }
                    </button>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <p className="font-body font-semibold text-sm text-white/85">{item.name}</p>
                      <span className={`px-1.5 py-0.5 rounded-md border font-body text-[9px] font-semibold ${meta.colour}`}>
                        {meta.label}
                      </span>
                    </div>
                    <p className="text-white/45 font-body text-xs">{item.issuing_body}</p>
                    {(item.year_awarded || item.valid_until) && (
                      <p className="text-white/25 font-body text-[10px] mt-0.5">
                        {item.year_awarded && `Awarded ${item.year_awarded}`}
                        {item.year_awarded && item.valid_until && " · "}
                        {item.valid_until && `Valid until ${item.valid_until}`}
                      </p>
                    )}
                    {item.description && (
                      <p className="text-white/30 font-body text-xs mt-1 line-clamp-2">{item.description}</p>
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
