"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Loader2, AlertCircle, Plus, Trash2, Upload, CheckCircle2,
  MapPin, Users, Layers, ShieldCheck, ImageIcon, X,
} from "lucide-react";

const inputCls = "w-full px-4 py-2.5 rounded-xl bg-white/[0.05] border border-white/[0.10] text-white/90 font-body text-sm placeholder:text-white/25 focus:outline-none focus:border-emerald-400/40 transition-all";

function Err({ msg }: { msg: string | null }) {
  if (!msg) return null;
  return (
    <div className="flex items-start gap-3 p-3 rounded-xl bg-red-500/10 border border-red-400/25">
      <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
      <p className="font-body text-sm text-red-300">{msg}</p>
    </div>
  );
}

// ─── Branding (logo + banner upload) ─────────────────────────────────────────
function Branding() {
  const [media, setMedia] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/employer/company/media");
      const { media } = await res.json();
      setMedia(media ?? []);
    } catch (e) { setError(String(e)); } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  async function upload(file: File, type: string) {
    setUploading(type); setError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("media_type", type);
      const res = await fetch("/api/employer/company/media", { method: "POST", body: fd });
      if (!res.ok) { const { error: e } = await res.json(); throw new Error(e); }
      await load();
    } catch (e) { setError(String(e)); } finally { setUploading(null); }
  }

  async function remove(id: string) {
    setError(null);
    try {
      const res = await fetch(`/api/employer/company/media/${id}`, { method: "DELETE" });
      if (!res.ok) { const { error: e } = await res.json(); throw new Error(e); }
      await load();
    } catch (e) { setError(String(e)); }
  }

  if (loading) return <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 text-emerald-400 animate-spin" /></div>;

  const logo   = media.find(m => m.media_type === "logo");
  const banner = media.find(m => m.media_type === "banner");
  const gallery = media.filter(m => m.media_type === "gallery");

  const slot = (label: string, type: string, current: Record<string, unknown> | undefined) => (
    <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.07]">
      <div className="flex items-center justify-between mb-3">
        <p className="font-body text-sm font-semibold text-white/75">{label}</p>
        {current && (
          <button onClick={() => remove(current.id as string)} className="text-red-400/60 hover:text-red-400 transition-colors">
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
      {current ? (
        <div className="flex items-center gap-2 text-emerald-400 font-body text-xs"><CheckCircle2 className="w-4 h-4" /> Uploaded</div>
      ) : (
        <label className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white/[0.04] border border-dashed border-white/[0.15] text-white/45 font-body text-sm cursor-pointer hover:bg-white/[0.06] transition-all">
          {uploading === type ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
          {uploading === type ? "Uploading…" : "Upload image"}
          <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) upload(f, type); }} />
        </label>
      )}
    </div>
  );

  return (
    <div className="space-y-4">
      <Err msg={error} />
      <p className="font-body text-sm text-white/45">Upload your company logo and banner. JPG, PNG, or WebP up to 5 MB.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {slot("Company Logo", "logo", logo)}
        {slot("Banner Image", "banner", banner)}
      </div>
      {/* Gallery */}
      <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.07]">
        <div className="flex items-center justify-between mb-3">
          <p className="font-body text-sm font-semibold text-white/75 flex items-center gap-2"><ImageIcon className="w-4 h-4 text-emerald-400/70" /> Gallery</p>
          <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-400/25 text-emerald-400 font-body text-xs font-semibold cursor-pointer hover:bg-emerald-500/20 transition-all">
            {uploading === "gallery" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />} Add
            <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) upload(f, "gallery"); }} />
          </label>
        </div>
        {gallery.length === 0 ? (
          <p className="text-white/30 font-body text-xs text-center py-3">No gallery images yet</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {gallery.map(g => (
              <div key={g.id as string} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08]">
                <ImageIcon className="w-3.5 h-3.5 text-white/40" />
                <button onClick={() => remove(g.id as string)} className="text-red-400/50 hover:text-red-400"><X className="w-3.5 h-3.5" /></button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Offices ─────────────────────────────────────────────────────────────────
function Offices() {
  const [items, setItems] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({ country_code: "SG" });
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try { const res = await fetch("/api/employer/company/offices"); const { offices } = await res.json(); setItems(offices ?? []); }
    catch (e) { setError(String(e)); } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  async function add() {
    if (!form.label || !form.city) { setError("Label and city are required"); return; }
    setBusy(true); setError(null);
    try {
      const res = await fetch("/api/employer/company/offices", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      if (!res.ok) { const { error: e } = await res.json(); throw new Error(e); }
      setForm({ country_code: "SG" }); setAdding(false); await load();
    } catch (e) { setError(String(e)); } finally { setBusy(false); }
  }
  async function del(id: string) {
    try { await fetch(`/api/employer/company/offices/${id}`, { method: "DELETE" }); await load(); }
    catch (e) { setError(String(e)); }
  }

  if (loading) return <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 text-emerald-400 animate-spin" /></div>;

  return (
    <div className="space-y-4">
      <Err msg={error} />
      <div className="space-y-2">
        {items.map(o => (
          <div key={o.id as string} className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.03] border border-white/[0.07]">
            <div className="flex items-center gap-3 min-w-0">
              <MapPin className="w-4 h-4 text-emerald-400/70 flex-shrink-0" />
              <div className="min-w-0">
                <p className="font-body text-sm text-white/80 font-semibold truncate">{o.label as string}{o.is_hq ? " · HQ" : ""}</p>
                <p className="font-body text-xs text-white/40 truncate">{o.city as string}, {o.country_code as string}</p>
              </div>
            </div>
            <button onClick={() => del(o.id as string)} className="text-red-400/50 hover:text-red-400 transition-colors"><Trash2 className="w-4 h-4" /></button>
          </div>
        ))}
        {items.length === 0 && <p className="text-white/30 font-body text-sm text-center py-3">No offices added yet</p>}
      </div>

      {adding ? (
        <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] space-y-3">
          <input className={inputCls} placeholder="Label (e.g. Singapore HQ)" value={form.label ?? ""} onChange={e => setForm(f => ({ ...f, label: e.target.value }))} />
          <div className="grid grid-cols-2 gap-3">
            <input className={inputCls} placeholder="City" value={form.city ?? ""} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} />
            <input className={inputCls} placeholder="Country code (e.g. SG)" value={form.country_code ?? ""} onChange={e => setForm(f => ({ ...f, country_code: e.target.value }))} />
          </div>
          <label className="flex items-center gap-2 font-body text-sm text-white/60">
            <input type="checkbox" checked={form.is_hq === "true"} onChange={e => setForm(f => ({ ...f, is_hq: e.target.checked ? "true" : "" }))} /> This is the HQ
          </label>
          <div className="flex gap-2">
            <button onClick={() => { setAdding(false); setForm({ country_code: "SG" }); }} className="flex-1 px-4 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white/50 font-body text-sm font-semibold">Cancel</button>
            <button onClick={add} disabled={busy} className="flex-1 px-4 py-2 rounded-xl bg-emerald-500/15 border border-emerald-400/30 text-emerald-400 font-body text-sm font-semibold disabled:opacity-50">{busy ? "Adding…" : "Add Office"}</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setAdding(true)} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-400/25 text-emerald-400 font-body text-sm font-semibold hover:bg-emerald-500/20 transition-all">
          <Plus className="w-4 h-4" /> Add Office
        </button>
      )}
    </div>
  );
}

// ─── Departments ─────────────────────────────────────────────────────────────
function Departments() {
  const [items, setItems] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try { const res = await fetch("/api/employer/company/departments"); const { departments } = await res.json(); setItems(departments ?? []); }
    catch (e) { setError(String(e)); } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  async function add() {
    if (!name.trim()) return;
    setBusy(true); setError(null);
    try {
      const res = await fetch("/api/employer/company/departments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name }) });
      if (!res.ok) { const { error: e } = await res.json(); throw new Error(e); }
      setName(""); await load();
    } catch (e) { setError(String(e)); } finally { setBusy(false); }
  }
  async function del(id: string) { await fetch(`/api/employer/company/departments/${id}`, { method: "DELETE" }); await load(); }

  if (loading) return <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 text-emerald-400 animate-spin" /></div>;

  return (
    <div className="space-y-4">
      <Err msg={error} />
      <div className="flex flex-wrap gap-2">
        {items.map(d => (
          <div key={d.id as string} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08]">
            <Layers className="w-3.5 h-3.5 text-emerald-400/70" />
            <span className="font-body text-sm text-white/70">{d.name as string}</span>
            <button onClick={() => del(d.id as string)} className="text-red-400/50 hover:text-red-400"><X className="w-3.5 h-3.5" /></button>
          </div>
        ))}
        {items.length === 0 && <p className="text-white/30 font-body text-sm py-2">No departments yet</p>}
      </div>
      <div className="flex gap-2">
        <input className={inputCls} placeholder="e.g. Engineering" value={name} onChange={e => setName(e.target.value)} onKeyDown={e => { if (e.key === "Enter") add(); }} />
        <button onClick={add} disabled={busy} className="px-4 py-2.5 rounded-xl bg-emerald-500/15 border border-emerald-400/30 text-emerald-400 font-body text-sm font-semibold disabled:opacity-50 flex-shrink-0">{busy ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add"}</button>
      </div>
    </div>
  );
}

// ─── Team (recruiters) ───────────────────────────────────────────────────────
function Team() {
  const [items, setItems] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("recruiter");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try { const res = await fetch("/api/employer/company/recruiters"); const { recruiters } = await res.json(); setItems(recruiters ?? []); }
    catch (e) { setError(String(e)); } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  async function add() {
    if (!email.trim()) return;
    setBusy(true); setError(null);
    try {
      const res = await fetch("/api/employer/company/recruiters", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, role }) });
      if (!res.ok) { const { error: e } = await res.json(); throw new Error(e); }
      setEmail(""); await load();
    } catch (e) { setError(String(e)); } finally { setBusy(false); }
  }
  async function del(id: string) { await fetch(`/api/employer/company/recruiters/${id}`, { method: "DELETE" }); await load(); }

  if (loading) return <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 text-emerald-400 animate-spin" /></div>;

  return (
    <div className="space-y-4">
      <Err msg={error} />
      <div className="space-y-2">
        {items.map(r => {
          const u = Array.isArray(r.user) ? r.user[0] : r.user as Record<string, unknown> | null;
          const isOwner = r.role === "owner";
          return (
            <div key={r.id as string} className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.03] border border-white/[0.07]">
              <div className="flex items-center gap-3 min-w-0">
                <Users className="w-4 h-4 text-emerald-400/70 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="font-body text-sm text-white/80 font-semibold truncate">{(u?.full_name as string) ?? (u?.email as string) ?? "—"}</p>
                  <p className="font-body text-xs text-white/40 truncate">{u?.email as string} · {r.role as string}</p>
                </div>
              </div>
              {!isOwner && <button onClick={() => del(r.id as string)} className="text-red-400/50 hover:text-red-400 transition-colors"><Trash2 className="w-4 h-4" /></button>}
            </div>
          );
        })}
        {items.length === 0 && <p className="text-white/30 font-body text-sm text-center py-3">No recruiters yet — you are the owner.</p>}
      </div>
      <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] space-y-3">
        <p className="font-body text-xs text-white/45">Add a recruiter by their PathPort account email.</p>
        <input className={inputCls} placeholder="recruiter@company.com" value={email} onChange={e => setEmail(e.target.value)} />
        <div className="flex gap-2">
          <select className={inputCls} value={role} onChange={e => setRole(e.target.value)}>
            <option value="admin">Admin</option>
            <option value="recruiter">Recruiter</option>
            <option value="viewer">Viewer</option>
          </select>
          <button onClick={add} disabled={busy} className="px-5 py-2.5 rounded-xl bg-emerald-500/15 border border-emerald-400/30 text-emerald-400 font-body text-sm font-semibold disabled:opacity-50 flex-shrink-0">{busy ? <Loader2 className="w-4 h-4 animate-spin" /> : "Invite"}</button>
        </div>
      </div>
    </div>
  );
}

// ─── Verification ────────────────────────────────────────────────────────────
function Verification() {
  const [docs, setDocs] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [docType, setDocType] = useState("registration_cert");

  const load = useCallback(async () => {
    setLoading(true);
    try { const res = await fetch("/api/employer/company/verification"); const { docs } = await res.json(); setDocs(docs ?? []); }
    catch (e) { setError(String(e)); } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  async function upload(file: File) {
    setUploading(true); setError(null);
    try {
      const fd = new FormData(); fd.append("file", file); fd.append("doc_type", docType);
      const res = await fetch("/api/employer/company/verification", { method: "POST", body: fd });
      if (!res.ok) { const { error: e } = await res.json(); throw new Error(e); }
      await load();
    } catch (e) { setError(String(e)); } finally { setUploading(false); }
  }

  if (loading) return <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 text-emerald-400 animate-spin" /></div>;

  const statusColor: Record<string, string> = { pending: "text-gold-400", approved: "text-emerald-400", rejected: "text-red-400/70" };

  return (
    <div className="space-y-4">
      <Err msg={error} />
      <p className="font-body text-sm text-white/45 flex items-center gap-2">
        <ShieldCheck className="w-4 h-4 text-emerald-400/70" /> Upload registration documents for admin verification. PDF up to 10 MB.
      </p>
      <div className="space-y-2">
        {docs.map(d => (
          <div key={d.id as string} className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.03] border border-white/[0.07]">
            <div className="min-w-0">
              <p className="font-body text-sm text-white/80 font-semibold truncate">{d.file_name as string}</p>
              <p className="font-body text-xs text-white/40">{(d.doc_type as string).replace(/_/g, " ")}</p>
            </div>
            <span className={`font-body text-xs font-semibold ${statusColor[d.status as string] ?? "text-white/40"}`}>{(d.status as string).toUpperCase()}</span>
          </div>
        ))}
        {docs.length === 0 && <p className="text-white/30 font-body text-sm text-center py-3">No documents uploaded yet</p>}
      </div>
      <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] space-y-3">
        <select className={inputCls} value={docType} onChange={e => setDocType(e.target.value)}>
          <option value="registration_cert">Business Registration Certificate</option>
          <option value="acra">ACRA Bizfile</option>
          <option value="tax_doc">Tax Document</option>
          <option value="gov_letter">Government Letter</option>
          <option value="other">Other</option>
        </select>
        <label className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white/[0.04] border border-dashed border-white/[0.15] text-white/45 font-body text-sm cursor-pointer hover:bg-white/[0.06] transition-all">
          {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
          {uploading ? "Uploading…" : "Upload PDF"}
          <input type="file" accept="application/pdf" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) upload(f); }} />
        </label>
      </div>
    </div>
  );
}

export default function CompanyManagement({ section }: { section: string }) {
  switch (section) {
    case "branding":     return <Branding />;
    case "offices":      return <Offices />;
    case "team":         return <Team />;
    case "departments":  return <Departments />;
    case "verification": return <Verification />;
    default:             return null;
  }
}
