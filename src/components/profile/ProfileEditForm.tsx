"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save, ArrowLeft, CheckCircle2 } from "lucide-react";

interface Props {
  initialValues: { full_name: string; phone: string; country: string };
}

const COUNTRIES = [
  "India", "Bangladesh", "Nepal", "Sri Lanka", "Philippines",
  "Indonesia", "Vietnam", "Myanmar", "Pakistan", "Other",
];

export default function ProfileEditForm({ initialValues }: Props) {
  const router = useRouter();
  const [values,  setValues]  = useState(initialValues);
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const set = (field: keyof typeof values) => (
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setValues(v => ({ ...v, [field]: e.target.value }))
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!res.ok) {
        const data = await res.json() as { error?: string };
        throw new Error(data.error ?? "Failed to save");
      }
      setSuccess(true);
      setTimeout(() => router.push("/dashboard/student/profile"), 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="rounded-2xl bg-white/[0.04] border border-white/[0.08] p-6 space-y-5">

        {/* Full name */}
        <div>
          <label className="block text-white/50 font-body text-xs uppercase tracking-wider mb-2">
            Full Name *
          </label>
          <input
            type="text"
            value={values.full_name}
            onChange={set("full_name")}
            required minLength={2} maxLength={100}
            placeholder="Your full legal name"
            className="w-full px-4 py-3 rounded-xl bg-white/[0.06] border border-white/[0.1] text-white placeholder-white/25 font-body text-sm focus:outline-none focus:border-gold-400/50 transition-colors"
          />
        </div>

        {/* Phone */}
        <div>
          <label className="block text-white/50 font-body text-xs uppercase tracking-wider mb-2">
            Phone Number
          </label>
          <input
            type="tel"
            value={values.phone}
            onChange={set("phone")}
            placeholder="+91 98765 43210"
            className="w-full px-4 py-3 rounded-xl bg-white/[0.06] border border-white/[0.1] text-white placeholder-white/25 font-body text-sm focus:outline-none focus:border-gold-400/50 transition-colors"
          />
        </div>

        {/* Country */}
        <div>
          <label className="block text-white/50 font-body text-xs uppercase tracking-wider mb-2">
            Country
          </label>
          <select
            value={values.country}
            onChange={set("country")}
            className="w-full px-4 py-3 rounded-xl bg-navy-950 border border-white/[0.1] text-white font-body text-sm focus:outline-none focus:border-gold-400/50 transition-colors"
          >
            <option value="">Select country</option>
            {COUNTRIES.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <p className="text-red-400 font-body text-sm px-1">{error}</p>
      )}
      {success && (
        <div className="flex items-center gap-2 text-emerald-400 font-body text-sm px-1">
          <CheckCircle2 className="w-4 h-4" /> Saved! Redirecting…
        </div>
      )}

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => router.push("/dashboard/student/profile")}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/[0.1] text-white/60 font-body text-sm hover:text-white/80 hover:border-white/20 transition-all"
        >
          <ArrowLeft className="w-4 h-4" /> Cancel
        </button>
        <button
          type="submit"
          disabled={saving || success}
          className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gold-400/15 border border-gold-400/30 text-gold-400 font-body text-sm font-semibold hover:bg-gold-400/25 transition-all disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {saving ? "Saving…" : success ? "Saved!" : "Save Changes"}
        </button>
      </div>
    </form>
  );
}
