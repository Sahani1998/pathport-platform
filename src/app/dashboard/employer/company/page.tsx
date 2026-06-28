"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { Building2, Save, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import CompanyManagement from "./CompanyManagement";

const TABS = [
  { key: "overview",     label: "Overview"     },
  { key: "branding",     label: "Branding"     },
  { key: "offices",      label: "Offices"      },
  { key: "team",         label: "Team"         },
  { key: "departments",  label: "Departments"  },
  { key: "verification", label: "Verification" },
];

type CompanyForm = {
  company_name:  string;
  industry:      string;
  company_size:  string;
  website_url:   string;
  hq_city:       string;
  hq_country:    string;
  description:   string;
  linkedin_url:  string;
};

const EMPTY: CompanyForm = {
  company_name: "", industry: "", company_size: "", website_url: "",
  hq_city: "Singapore", hq_country: "Singapore", description: "", linkedin_url: "",
};

const SIZES = [
  { value: "startup",    label: "Startup (1–50)" },
  { value: "sme",        label: "SME (51–200)" },
  { value: "mid_market", label: "Mid-Market (201–1000)" },
  { value: "enterprise", label: "Enterprise (1000+)" },
];

export default function EmployerCompanyPage() {
  const { profile, loading: authLoading } = useAuth();
  const router = useRouter();
  const [form, setForm]       = useState<CompanyForm>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [saved, setSaved]     = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const [isVerified, setIsVerified] = useState(false);
  const [tab, setTab] = useState("overview");

  const fetchCompany = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/employer/company");
      if (!res.ok) throw new Error(await res.text());
      const { company } = await res.json();
      if (company) {
        setIsVerified(!!company.is_verified);
        setForm({
          company_name: company.company_name ?? "",
          industry:     company.industry     ?? "",
          company_size: company.company_size ?? "",
          website_url:  company.website_url  ?? "",
          hq_city:      company.hq_city      ?? "Singapore",
          hq_country:   company.hq_country   ?? "Singapore",
          description:  company.description  ?? "",
          linkedin_url: company.linkedin_url ?? "",
        });
      }
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { if (!authLoading) fetchCompany(); }, [authLoading, fetchCompany]);

  if (!authLoading && profile?.role !== "employer") { router.replace("/dashboard"); return null; }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form.company_name.trim()) { setError("Company name is required"); return; }
    setSaving(true); setError(null); setSaved(false);
    try {
      const res = await fetch("/api/employer/company", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) { const { error: e } = await res.json(); throw new Error(e); }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      setError(String(e));
    } finally {
      setSaving(false);
    }
  }

  const field = (key: keyof CompanyForm) => ({
    value: form[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm(f => ({ ...f, [key]: e.target.value })),
  });

  if (loading) return (
    <div className="flex items-center justify-center py-24">
      <Loader2 className="w-7 h-7 text-emerald-400 animate-spin" />
    </div>
  );

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-3xl text-white mb-1">Company Profile</h2>
          <p className="text-white/40 font-body text-sm">Information shown to students when they view your postings</p>
        </div>
        {isVerified && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-400/30 text-emerald-400 font-body text-xs font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5" /> Verified
          </span>
        )}
      </div>

      {/* Tab bar */}
      <div className="flex items-center gap-1.5 flex-wrap border-b border-white/[0.07] pb-px">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-3.5 py-2 rounded-t-lg font-body text-sm font-semibold transition-all ${
              tab === t.key
                ? "text-emerald-400 bg-emerald-500/[0.08] border-b-2 border-emerald-400"
                : "text-white/45 hover:text-white/70"
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {error && tab === "overview" && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-400/25">
          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
          <p className="font-body text-sm text-red-300">{error}</p>
        </div>
      )}
      {saved && tab === "overview" && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-400/25">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <p className="font-body text-sm text-emerald-300">Company profile saved.</p>
        </div>
      )}

      {tab !== "overview" && <CompanyManagement section={tab} />}

      {tab === "overview" && (
      <form onSubmit={handleSave} className="space-y-5">

        {/* Company name */}
        <div>
          <label className="block font-body text-xs text-white/50 uppercase tracking-wider mb-2">Company Name *</label>
          <input
            {...field("company_name")}
            required
            placeholder="Acme Pte. Ltd."
            className="w-full px-4 py-3 rounded-xl bg-white/[0.05] border border-white/[0.10] text-white/90 font-body text-sm placeholder:text-white/25 focus:outline-none focus:border-emerald-400/50 focus:bg-white/[0.07] transition-all"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Industry */}
          <div>
            <label className="block font-body text-xs text-white/50 uppercase tracking-wider mb-2">Industry</label>
            <input
              {...field("industry")}
              placeholder="e.g. Technology"
              className="w-full px-4 py-3 rounded-xl bg-white/[0.05] border border-white/[0.10] text-white/90 font-body text-sm placeholder:text-white/25 focus:outline-none focus:border-emerald-400/50 focus:bg-white/[0.07] transition-all"
            />
          </div>
          {/* Company size */}
          <div>
            <label className="block font-body text-xs text-white/50 uppercase tracking-wider mb-2">Company Size</label>
            <select
              {...field("company_size")}
              className="w-full px-4 py-3 rounded-xl bg-white/[0.05] border border-white/[0.10] text-white/90 font-body text-sm focus:outline-none focus:border-emerald-400/50 focus:bg-white/[0.07] transition-all"
            >
              <option value="">Select size</option>
              {SIZES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block font-body text-xs text-white/50 uppercase tracking-wider mb-2">HQ City</label>
            <input
              {...field("hq_city")}
              placeholder="Singapore"
              className="w-full px-4 py-3 rounded-xl bg-white/[0.05] border border-white/[0.10] text-white/90 font-body text-sm placeholder:text-white/25 focus:outline-none focus:border-emerald-400/50 focus:bg-white/[0.07] transition-all"
            />
          </div>
          <div>
            <label className="block font-body text-xs text-white/50 uppercase tracking-wider mb-2">Country</label>
            <input
              {...field("hq_country")}
              placeholder="Singapore"
              className="w-full px-4 py-3 rounded-xl bg-white/[0.05] border border-white/[0.10] text-white/90 font-body text-sm placeholder:text-white/25 focus:outline-none focus:border-emerald-400/50 focus:bg-white/[0.07] transition-all"
            />
          </div>
        </div>

        <div>
          <label className="block font-body text-xs text-white/50 uppercase tracking-wider mb-2">Website</label>
          <input
            {...field("website_url")}
            type="url"
            placeholder="https://yourcompany.com"
            className="w-full px-4 py-3 rounded-xl bg-white/[0.05] border border-white/[0.10] text-white/90 font-body text-sm placeholder:text-white/25 focus:outline-none focus:border-emerald-400/50 focus:bg-white/[0.07] transition-all"
          />
        </div>

        <div>
          <label className="block font-body text-xs text-white/50 uppercase tracking-wider mb-2">LinkedIn Page</label>
          <input
            {...field("linkedin_url")}
            type="url"
            placeholder="https://linkedin.com/company/yourcompany"
            className="w-full px-4 py-3 rounded-xl bg-white/[0.05] border border-white/[0.10] text-white/90 font-body text-sm placeholder:text-white/25 focus:outline-none focus:border-emerald-400/50 focus:bg-white/[0.07] transition-all"
          />
        </div>

        <div>
          <label className="block font-body text-xs text-white/50 uppercase tracking-wider mb-2">About the Company</label>
          <textarea
            {...field("description")}
            rows={4}
            placeholder="Tell students about your company, culture, and what makes you a great place to intern..."
            className="w-full px-4 py-3 rounded-xl bg-white/[0.05] border border-white/[0.10] text-white/90 font-body text-sm placeholder:text-white/25 focus:outline-none focus:border-emerald-400/50 focus:bg-white/[0.07] transition-all resize-none"
          />
        </div>

        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-2 text-white/30 font-body text-xs">
            <Building2 className="w-3.5 h-3.5" />
            <span>Profile is visible to eligible students</span>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-500/15 border border-emerald-400/30 text-emerald-400 font-body text-sm font-semibold hover:bg-emerald-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? "Saving…" : "Save Profile"}
          </button>
        </div>
      </form>
      )}
    </div>
  );
}
