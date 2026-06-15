"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Building2, Globe, Pencil, Power, Trash2, X, Save, Loader2, BookOpen, ArrowRight, CreditCard, Hash } from "lucide-react";

interface College {
  id: string;
  name: string;
  slug: string;
  country: string;
  city: string;
  website: string | null;
  is_active: boolean;
  short_code: string | null;
  created_at: string;
}

interface Props {
  colleges: College[];
  courseCounts: Record<string, number>;
}

type FormValues = { name: string; slug: string; city: string; country: string; website: string; short_code: string };
const EMPTY: FormValues = { name: "", slug: "", city: "Singapore", country: "Singapore", website: "", short_code: "" };

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export default function CollegeManagementClient({ colleges: initial, courseCounts }: Props) {
  const router = useRouter();
  const [colleges,  setColleges]  = useState(initial);
  const [showForm,  setShowForm]  = useState(false);
  const [editId,    setEditId]    = useState<string | null>(null);
  const [form,      setForm]      = useState<FormValues>(EMPTY);
  const [saving,    setSaving]    = useState(false);
  const [error,     setError]     = useState<string | null>(null);
  const [busyId,    setBusyId]    = useState<string | null>(null);

  const setField = (field: keyof FormValues) => (
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm(f => {
        const next = { ...f, [field]: e.target.value };
        if (field === "name" && !editId) next.slug = slugify(e.target.value);
        return next;
      });
    }
  );

  const openAdd = () => { setForm(EMPTY); setEditId(null); setError(null); setShowForm(true); };
  const openEdit = (c: College) => {
    setForm({
      name: c.name, slug: c.slug, city: c.city, country: c.country,
      website: c.website ?? "", short_code: c.short_code ?? "",
    });
    setEditId(c.id);
    setError(null);
    setShowForm(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const url    = editId ? `/api/colleges/${editId}` : "/api/colleges";
      const method = editId ? "PATCH" : "POST";
      const payload: Record<string, unknown> = { ...form, website: form.website || null };
      const trimmedCode = form.short_code.trim().toUpperCase();
      if (trimmedCode === "") {
        // Allow clearing short_code on edit; omit on create (server will derive).
        if (editId) payload.short_code = null; else delete payload.short_code;
      } else {
        if (!/^[A-Z]{2,6}$/.test(trimmedCode)) {
          throw new Error("Short code must be 2–6 uppercase letters (e.g. DIM, MDIS)");
        }
        payload.short_code = trimmedCode;
      }
      const res  = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json() as College & { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Failed to save");

      if (editId) {
        setColleges(cs => cs.map(c => c.id === editId ? data : c));
      } else {
        setColleges(cs => [...cs, data]);
      }
      setShowForm(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (college: College) => {
    setBusyId(college.id);
    try {
      const res = await fetch(`/api/colleges/${college.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !college.is_active }),
      });
      const data = await res.json() as College & { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Failed to update");
      setColleges(cs => cs.map(c => c.id === college.id ? data : c));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update");
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (college: College) => {
    const count = courseCounts[college.id] ?? 0;
    if (count > 0) {
      alert(`Cannot delete "${college.name}" — it has ${count} course${count !== 1 ? "s" : ""}. Remove all courses first.`);
      return;
    }
    if (!confirm(`Delete "${college.name}"? This cannot be undone.`)) return;
    setBusyId(college.id);
    try {
      const res = await fetch(`/api/colleges/${college.id}`, { method: "DELETE" });
      const data = await res.json() as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Failed to delete");
      setColleges(cs => cs.filter(c => c.id !== college.id));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-4">

      {/* Add college button */}
      <div className="flex justify-end">
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gold-400/15 border border-gold-400/30 text-gold-400 font-body text-sm font-semibold hover:bg-gold-400/25 transition-all"
        >
          <Plus className="w-4 h-4" /> Add College
        </button>
      </div>

      {/* Add/Edit form */}
      {showForm && (
        <form onSubmit={handleSave} className="p-5 rounded-2xl bg-white/[0.05] border border-gold-400/20 space-y-4">
          <div className="flex items-center justify-between mb-1">
            <p className="font-body text-sm font-semibold text-white/80">{editId ? "Edit College" : "New College"}</p>
            <button type="button" onClick={() => setShowForm(false)} className="text-white/30 hover:text-white/60 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { label: "College Name *", field: "name" as const, placeholder: "e.g. PSB Academy" },
              { label: "Slug *",         field: "slug" as const, placeholder: "e.g. psb-academy" },
              { label: "City",           field: "city" as const, placeholder: "Singapore" },
              { label: "Country",        field: "country" as const, placeholder: "Singapore" },
            ].map(({ label, field, placeholder }) => (
              <div key={field}>
                <label className="block text-white/40 font-body text-[10px] uppercase tracking-wider mb-1.5">{label}</label>
                <input
                  value={form[field]}
                  onChange={setField(field)}
                  required={field === "name" || field === "slug"}
                  placeholder={placeholder}
                  className="w-full px-3 py-2.5 rounded-xl bg-white/[0.06] border border-white/[0.1] text-white placeholder-white/20 font-body text-sm focus:outline-none focus:border-gold-400/50 transition-colors"
                />
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-white/40 font-body text-[10px] uppercase tracking-wider mb-1.5">Website</label>
              <input
                type="url"
                value={form.website}
                onChange={setField("website")}
                placeholder="https://www.college.edu.sg"
                className="w-full px-3 py-2.5 rounded-xl bg-white/[0.06] border border-white/[0.1] text-white placeholder-white/20 font-body text-sm focus:outline-none focus:border-gold-400/50 transition-colors"
              />
            </div>
            <div>
              <label className="block text-white/40 font-body text-[10px] uppercase tracking-wider mb-1.5">Short Code</label>
              <input
                value={form.short_code}
                onChange={(e) => setForm(f => ({ ...f, short_code: e.target.value.toUpperCase() }))}
                placeholder="DIM"
                maxLength={6}
                pattern="[A-Z]{2,6}"
                title="2–6 uppercase letters"
                className="w-full px-3 py-2.5 rounded-xl bg-white/[0.06] border border-white/[0.1] text-white placeholder-white/20 font-body text-sm font-mono focus:outline-none focus:border-gold-400/50 transition-colors"
              />
              <p className="mt-1 text-white/30 font-body text-[10px]">Used in invoice numbers: <span className="font-mono text-white/45">{(form.short_code || "XXX").trim().toUpperCase()}-INV-2026-0001</span></p>
            </div>
          </div>

          {error && <p className="text-red-400 font-body text-xs">{error}</p>}

          <div className="flex items-center gap-2 pt-1">
            <button type="button" onClick={() => setShowForm(false)}
              className="px-4 py-2 rounded-xl border border-white/[0.1] text-white/50 font-body text-sm hover:text-white/70 transition-all">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gold-400/15 border border-gold-400/30 text-gold-400 font-body text-sm font-semibold hover:bg-gold-400/25 transition-all disabled:opacity-50">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      )}

      {/* College cards */}
      {colleges.length === 0 ? (
        <div className="flex flex-col items-center py-16 rounded-2xl bg-white/[0.03] border border-white/[0.07] text-white/25">
          <Building2 className="w-10 h-10 mb-3" />
          <p className="font-body text-sm">No colleges yet — add the first one above</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {colleges.map(c => (
            <div key={c.id} className={`p-5 rounded-2xl border space-y-3 ${c.is_active ? "bg-white/[0.04] border-white/[0.08]" : "bg-white/[0.02] border-white/[0.05] opacity-70"}`}>
              <div className="flex items-start justify-between gap-3">
                <p className="font-body font-semibold text-sm text-white/85 leading-snug">{c.name}</p>
                <span className={`flex-shrink-0 px-2 py-0.5 rounded-full border font-body text-[10px] font-semibold ${
                  c.is_active
                    ? "bg-emerald-500/10 border-emerald-400/30 text-emerald-400"
                    : "bg-white/[0.05] border-white/10 text-white/30"
                }`}>
                  {c.is_active ? "Active" : "Inactive"}
                </span>
              </div>

              <div className="flex items-center gap-3 flex-wrap text-white/35 font-body text-xs">
                <span className="flex items-center gap-1.5">
                  <Building2 className="w-3 h-3 flex-shrink-0" />
                  {c.city}, {c.country}
                </span>
                {c.short_code && (
                  <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-white/[0.05] border border-white/[0.08] font-mono text-[10px] text-white/55">
                    <Hash className="w-2.5 h-2.5" /> {c.short_code}
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between">
                <Link
                  href={`/dashboard/admin/courses?college=${c.id}`}
                  className="flex items-center gap-1.5 text-gold-400/80 hover:text-gold-300 font-body text-xs transition-colors"
                >
                  <BookOpen className="w-3 h-3" />
                  {courseCounts[c.id] ?? 0} course{(courseCounts[c.id] ?? 0) !== 1 ? "s" : ""}
                  <ArrowRight className="w-3 h-3" />
                </Link>
                {c.website && (
                  <a href={c.website} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1 text-pathBlue-400 font-body text-xs hover:text-pathBlue-300 transition-colors">
                    <Globe className="w-3 h-3" /> Website
                  </a>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-1 border-t border-white/[0.06] flex-wrap">
                <button
                  onClick={() => openEdit(c)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-white/[0.1] text-white/45 font-body text-xs hover:text-white/70 hover:border-white/20 transition-all"
                >
                  <Pencil className="w-3 h-3" /> Edit
                </button>
                <Link
                  href={`/dashboard/admin/colleges/${c.id}/payment-settings`}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-white/[0.1] text-white/45 font-body text-xs hover:text-gold-400 hover:border-gold-400/25 transition-all"
                >
                  <CreditCard className="w-3 h-3" /> Payments
                </Link>
                <button
                  onClick={() => toggleActive(c)}
                  disabled={busyId === c.id}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border font-body text-xs transition-all disabled:opacity-50 ${
                    c.is_active
                      ? "border-white/[0.1] text-white/45 hover:text-amber-400 hover:border-amber-400/25"
                      : "border-emerald-400/20 text-emerald-400/60 hover:text-emerald-400"
                  }`}
                >
                  {busyId === c.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Power className="w-3 h-3" />}
                  {c.is_active ? "Deactivate" : "Activate"}
                </button>
                <button
                  onClick={() => handleDelete(c)}
                  disabled={busyId === c.id}
                  className="ml-auto flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-white/[0.08] text-white/20 font-body text-xs hover:border-red-400/20 hover:text-red-400/50 transition-all disabled:opacity-50"
                >
                  <Trash2 className="w-3 h-3" /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
