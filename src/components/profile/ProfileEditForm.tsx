"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  User, Plane, Phone as PhoneIcon, GraduationCap, Save, ArrowLeft,
  CheckCircle2, Plus, Trash2, Loader2,
} from "lucide-react";
import type { StudentEducation } from "@/types/auth";

const COUNTRIES = [
  "India", "Bangladesh", "Nepal", "Sri Lanka", "Philippines",
  "Indonesia", "Vietnam", "Myanmar", "Pakistan", "Singapore", "Other",
];

const RELATIONSHIPS = ["Parent", "Sibling", "Spouse", "Guardian", "Friend", "Other"];

const QUALIFICATIONS = [
  "Class 10 / SSC",
  "Class 12 / HSC",
  "Diploma",
  "Bachelor's Degree",
  "Master's Degree",
  "PhD",
  "Other",
];

interface PersonalValues {
  full_name: string;
  phone: string;
  country: string;
  date_of_birth: string;
  nationality: string;
}

interface PassportValues {
  passport_number: string;
  passport_country: string;
  passport_expiry: string;
}

interface EmergencyValues {
  emergency_contact_name: string;
  emergency_contact_phone: string;
  emergency_contact_relationship: string;
}

interface Props {
  personal:  PersonalValues;
  passport:  PassportValues;
  emergency: EmergencyValues;
  education: StudentEducation[];
}

// ─── Shared input components ──────────────────────────────────────────────────

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-white/50 font-body text-xs uppercase tracking-wider mb-2">
        {label}{required && " *"}
      </label>
      {children}
    </div>
  );
}

const inputCls    = "w-full px-4 py-3 rounded-xl bg-white/[0.06] border border-white/[0.1] text-white placeholder-white/25 font-body text-sm focus:outline-none focus:border-gold-400/50 transition-colors";
const selectCls   = "w-full px-4 py-3 rounded-xl bg-navy-950 border border-white/[0.1] text-white font-body text-sm focus:outline-none focus:border-gold-400/50 transition-colors [color-scheme:dark]";
const OPTION_STYLE = { backgroundColor: "#0a1024", color: "#fff" } as const;

// ─── Section card ─────────────────────────────────────────────────────────────

function Section({
  icon: Icon, title, description, children,
}: {
  icon: typeof User;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-white/[0.04] border border-white/[0.08] p-6 space-y-5">
      <div className="flex items-start gap-3 pb-3 border-b border-white/[0.06]">
        <div className="w-9 h-9 rounded-xl bg-gold-400/10 border border-gold-400/25 flex items-center justify-center flex-shrink-0">
          <Icon className="w-4 h-4 text-gold-400" />
        </div>
        <div>
          <h3 className="font-display text-lg text-white">{title}</h3>
          <p className="text-white/40 font-body text-xs">{description}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

// ─── Main form ────────────────────────────────────────────────────────────────

export default function ProfileEditForm({ personal, passport, emergency, education }: Props) {
  const router = useRouter();

  const [pers,  setPers]  = useState<PersonalValues>(personal);
  const [pass,  setPass]  = useState<PassportValues>(passport);
  const [emerg, setEmerg] = useState<EmergencyValues>(emergency);
  const [edu,   setEdu]   = useState<StudentEducation[]>(education);

  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...pers, ...pass, ...emerg }),
      });
      if (!res.ok) {
        const data = await res.json() as { error?: string };
        throw new Error(data.error ?? "Failed to save");
      }
      setSuccess(true);
      router.refresh();
      setTimeout(() => router.push("/dashboard/student/profile"), 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">

      {/* Personal */}
      <Section icon={User} title="Personal Information" description="Your basic details">
        <Field label="Full Name" required>
          <input value={pers.full_name} onChange={e => setPers(v => ({ ...v, full_name: e.target.value }))}
            required minLength={2} maxLength={100} placeholder="Your full legal name" className={inputCls} />
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Phone">
            <input type="tel" value={pers.phone} onChange={e => setPers(v => ({ ...v, phone: e.target.value }))}
              placeholder="+91 98765 43210" className={inputCls} />
          </Field>
          <Field label="Date of Birth">
            <input type="date" value={pers.date_of_birth} onChange={e => setPers(v => ({ ...v, date_of_birth: e.target.value }))}
              className={inputCls} />
          </Field>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Country of Residence">
            <select value={pers.country} onChange={e => setPers(v => ({ ...v, country: e.target.value }))}
              className={selectCls}>
              <option value="" style={OPTION_STYLE}>Select country</option>
              {COUNTRIES.map(c => <option key={c} value={c} style={OPTION_STYLE}>{c}</option>)}
            </select>
          </Field>
          <Field label="Nationality">
            <select value={pers.nationality} onChange={e => setPers(v => ({ ...v, nationality: e.target.value }))}
              className={selectCls}>
              <option value="" style={OPTION_STYLE}>Select nationality</option>
              {COUNTRIES.map(c => <option key={c} value={c} style={OPTION_STYLE}>{c}</option>)}
            </select>
          </Field>
        </div>
      </Section>

      {/* Passport */}
      <Section icon={Plane} title="Passport Information" description="Required for Singapore student pass application">
        <Field label="Passport Number">
          <input value={pass.passport_number}
            onChange={e => setPass(v => ({ ...v, passport_number: e.target.value.toUpperCase() }))}
            placeholder="A12345678"
            pattern="[A-Z0-9]{5,20}"
            className={inputCls} />
        </Field>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Issuing Country">
            <select value={pass.passport_country} onChange={e => setPass(v => ({ ...v, passport_country: e.target.value }))}
              className={selectCls}>
              <option value="" style={OPTION_STYLE}>Select country</option>
              {COUNTRIES.map(c => <option key={c} value={c} style={OPTION_STYLE}>{c}</option>)}
            </select>
          </Field>
          <Field label="Expiry Date">
            <input type="date" value={pass.passport_expiry} onChange={e => setPass(v => ({ ...v, passport_expiry: e.target.value }))}
              min={new Date().toISOString().slice(0, 10)} className={inputCls} />
          </Field>
        </div>
      </Section>

      {/* Emergency contact */}
      <Section icon={PhoneIcon} title="Emergency Contact" description="Who to call if there's an issue">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Contact Name">
            <input value={emerg.emergency_contact_name}
              onChange={e => setEmerg(v => ({ ...v, emergency_contact_name: e.target.value }))}
              placeholder="Full name" className={inputCls} />
          </Field>
          <Field label="Relationship">
            <select value={emerg.emergency_contact_relationship}
              onChange={e => setEmerg(v => ({ ...v, emergency_contact_relationship: e.target.value }))}
              className={selectCls}>
              <option value="" style={OPTION_STYLE}>Select</option>
              {RELATIONSHIPS.map(r => <option key={r} value={r} style={OPTION_STYLE}>{r}</option>)}
            </select>
          </Field>
        </div>
        <Field label="Phone Number">
          <input type="tel" value={emerg.emergency_contact_phone}
            onChange={e => setEmerg(v => ({ ...v, emergency_contact_phone: e.target.value }))}
            placeholder="+91 98765 43210" className={inputCls} />
        </Field>
      </Section>

      {/* Education history */}
      <Section icon={GraduationCap} title="Education History" description="Add your educational qualifications">
        <EducationList items={edu} onChange={setEdu} />
      </Section>

      {/* Feedback */}
      {error && <p className="text-red-400 font-body text-sm px-1">{error}</p>}
      {success && (
        <div className="flex items-center gap-2 text-emerald-400 font-body text-sm px-1">
          <CheckCircle2 className="w-4 h-4" /> Saved successfully — redirecting…
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3 sticky bottom-0 bg-navy-950/95 backdrop-blur-sm py-3 -mx-6 px-6 border-t border-white/[0.06]">
        <button type="button" onClick={() => router.push("/dashboard/student/profile")}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/[0.1] text-white/60 font-body text-sm hover:text-white/80 hover:border-white/20 transition-all">
          <ArrowLeft className="w-4 h-4" /> Cancel
        </button>
        <button type="submit" disabled={saving || success}
          className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gold-400/15 border border-gold-400/30 text-gold-400 font-body text-sm font-semibold hover:bg-gold-400/25 transition-all disabled:opacity-50">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? "Saving…" : success ? "Saved!" : "Save Profile"}
        </button>
      </div>
    </form>
  );
}

// ─── Education list (separate state — saves immediately on add/remove) ────────

interface EduFormValues {
  institution_name: string;
  qualification: string;
  field_of_study: string;
  start_year: string;
  end_year: string;
  grade: string;
  is_current: boolean;
}
const EMPTY_EDU: EduFormValues = {
  institution_name: "", qualification: "", field_of_study: "",
  start_year: "", end_year: "", grade: "", is_current: false,
};

function EducationList({ items, onChange }: { items: StudentEducation[]; onChange: (items: StudentEducation[]) => void }) {
  const [adding, setAdding] = useState(false);
  const [form,   setForm]   = useState<EduFormValues>(EMPTY_EDU);
  const [busy,   setBusy]   = useState(false);
  const [err,    setErr]    = useState<string | null>(null);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/profile/education", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          institution_name: form.institution_name,
          qualification:    form.qualification,
          field_of_study:   form.field_of_study || null,
          grade:            form.grade          || null,
          start_year:       form.start_year ? Number(form.start_year) : null,
          end_year:         form.end_year   ? Number(form.end_year)   : null,
          is_current:       form.is_current,
        }),
      });
      const data = await res.json() as StudentEducation & { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Failed to add");
      onChange([...items, data]);
      setForm(EMPTY_EDU);
      setAdding(false);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to add");
    } finally {
      setBusy(false);
    }
  };

  const handleRemove = async (id: string) => {
    if (!confirm("Remove this education entry?")) return;
    try {
      const res = await fetch(`/api/profile/education/${id}`, { method: "DELETE" });
      const data = await res.json() as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Failed to delete");
      onChange(items.filter(i => i.id !== id));
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to delete");
    }
  };

  return (
    <div className="space-y-3">
      {items.length === 0 && !adding && (
        <p className="text-white/30 font-body text-sm py-3 text-center">No education entries yet</p>
      )}

      {items.map(item => (
        <div key={item.id} className="flex items-start justify-between gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
          <div className="flex-1 min-w-0">
            <p className="text-white/85 font-body font-semibold text-sm">{item.institution_name}</p>
            <p className="text-white/45 font-body text-xs mt-0.5">
              {item.qualification}{item.field_of_study ? ` · ${item.field_of_study}` : ""}
            </p>
            <p className="text-white/30 font-body text-xs mt-0.5">
              {item.start_year ?? "?"} – {item.is_current ? "Present" : item.end_year ?? "?"}
              {item.grade && ` · ${item.grade}`}
            </p>
          </div>
          <button type="button" onClick={() => handleRemove(item.id)}
            className="p-1.5 rounded-lg text-white/25 hover:text-red-400 hover:bg-red-500/10 transition-all">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}

      {adding ? (
        <div onKeyDown={e => e.key === "Enter" && handleAdd(e)} className="p-4 rounded-xl bg-gold-400/[0.06] border border-gold-400/20 space-y-3">
          <Field label="Institution" required>
            <input value={form.institution_name}
              onChange={e => setForm(f => ({ ...f, institution_name: e.target.value }))}
              placeholder="e.g. Delhi Public School" className={inputCls} required />
          </Field>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Qualification" required>
              <select value={form.qualification}
                onChange={e => setForm(f => ({ ...f, qualification: e.target.value }))}
                className={selectCls} required>
                <option value="" style={OPTION_STYLE}>Select</option>
                {QUALIFICATIONS.map(q => <option key={q} value={q} style={OPTION_STYLE}>{q}</option>)}
              </select>
            </Field>
            <Field label="Field of Study">
              <input value={form.field_of_study}
                onChange={e => setForm(f => ({ ...f, field_of_study: e.target.value }))}
                placeholder="e.g. Science" className={inputCls} />
            </Field>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Start Year">
              <input type="number" value={form.start_year}
                onChange={e => setForm(f => ({ ...f, start_year: e.target.value }))}
                min={1950} max={new Date().getFullYear() + 1}
                placeholder="2018" className={inputCls} />
            </Field>
            <Field label="End Year">
              <input type="number" value={form.end_year} disabled={form.is_current}
                onChange={e => setForm(f => ({ ...f, end_year: e.target.value }))}
                min={1950} max={new Date().getFullYear() + 10}
                placeholder="2022" className={`${inputCls} disabled:opacity-40`} />
            </Field>
            <Field label="Grade">
              <input value={form.grade}
                onChange={e => setForm(f => ({ ...f, grade: e.target.value }))}
                placeholder="85% / A+" className={inputCls} />
            </Field>
          </div>
          <label className="flex items-center gap-2 text-white/60 font-body text-xs">
            <input type="checkbox" checked={form.is_current}
              onChange={e => setForm(f => ({ ...f, is_current: e.target.checked }))}
              className="w-3.5 h-3.5 rounded border-white/20 bg-white/5 text-gold-400 focus:ring-gold-400" />
            Currently studying here
          </label>

          {err && <p className="text-red-400 font-body text-xs">{err}</p>}

          <div className="flex items-center gap-2 pt-1">
            <button type="button" onClick={() => { setAdding(false); setErr(null); }}
              className="px-3 py-1.5 rounded-lg border border-white/[0.1] text-white/50 font-body text-xs hover:text-white/70 transition-all">
              Cancel
            </button>
            <button type="button" onClick={handleAdd} disabled={busy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gold-400/15 border border-gold-400/30 text-gold-400 font-body text-xs font-semibold hover:bg-gold-400/25 transition-all disabled:opacity-50">
              {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
              {busy ? "Adding…" : "Add Entry"}
            </button>
          </div>
        </div>
      ) : (
        <button type="button" onClick={() => setAdding(true)}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-white/[0.12] text-white/40 font-body text-sm hover:border-gold-400/30 hover:text-gold-400 transition-all">
          <Plus className="w-4 h-4" /> Add education entry
        </button>
      )}
    </div>
  );
}
