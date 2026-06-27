"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PlusCircle, AlertCircle, Loader2 } from "lucide-react";

type PostingForm = {
  title:                 string;
  department:            string;
  description:           string;
  requirements:          string;
  location:              string;
  work_type:             string;
  monthly_allowance_sgd: string;
  duration_months:       string;
  openings:              string;
  skills_required:       string;
  start_date:            string;
  application_deadline:  string;
};

const EMPTY: PostingForm = {
  title: "", department: "", description: "", requirements: "",
  location: "Singapore", work_type: "onsite",
  monthly_allowance_sgd: "", duration_months: "6", openings: "1",
  skills_required: "", start_date: "", application_deadline: "",
};

export default function NewPostingPage() {
  const router = useRouter();
  const [form, setForm]     = useState<PostingForm>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState<string | null>(null);

  const field = (key: keyof PostingForm) => ({
    value: form[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm(f => ({ ...f, [key]: e.target.value })),
  });

  async function handleSubmit(e: React.FormEvent, publish: boolean) {
    e.preventDefault();
    if (!form.title.trim()) { setError("Title is required"); return; }
    if (!form.monthly_allowance_sgd) { setError("Monthly allowance is required"); return; }
    setSaving(true); setError(null);
    try {
      const payload = {
        ...form,
        monthly_allowance_sgd: parseFloat(form.monthly_allowance_sgd),
        duration_months:       parseInt(form.duration_months, 10),
        openings:              parseInt(form.openings, 10),
        skills_required:       form.skills_required.split(",").map(s => s.trim()).filter(Boolean),
        status:                publish ? "open" : "draft",
        start_date:            form.start_date || null,
        application_deadline:  form.application_deadline || null,
      };
      const res = await fetch("/api/employer/postings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) { const { error: e } = await res.json(); throw new Error(e); }
      const { posting } = await res.json();
      router.push(`/dashboard/employer/postings/${posting.id}`);
    } catch (e) {
      setError(String(e));
      setSaving(false);
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="font-display text-3xl text-white mb-1">New Posting</h2>
        <p className="text-white/40 font-body text-sm">Create an internship posting for eligible PathPort students</p>
      </div>

      {error && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-400/25">
          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
          <p className="font-body text-sm text-red-300">{error}</p>
        </div>
      )}

      <form className="space-y-5">
        <div>
          <label className="block font-body text-xs text-white/50 uppercase tracking-wider mb-2">Job Title *</label>
          <input {...field("title")} required placeholder="e.g. Business Development Intern" className="w-full px-4 py-3 rounded-xl bg-white/[0.05] border border-white/[0.10] text-white/90 font-body text-sm placeholder:text-white/25 focus:outline-none focus:border-emerald-400/50 transition-all" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block font-body text-xs text-white/50 uppercase tracking-wider mb-2">Department</label>
            <input {...field("department")} placeholder="e.g. Sales, IT, Operations" className="w-full px-4 py-3 rounded-xl bg-white/[0.05] border border-white/[0.10] text-white/90 font-body text-sm placeholder:text-white/25 focus:outline-none focus:border-emerald-400/50 transition-all" />
          </div>
          <div>
            <label className="block font-body text-xs text-white/50 uppercase tracking-wider mb-2">Work Type</label>
            <select {...field("work_type")} className="w-full px-4 py-3 rounded-xl bg-white/[0.05] border border-white/[0.10] text-white/90 font-body text-sm focus:outline-none focus:border-emerald-400/50 transition-all">
              <option value="onsite">On-site</option>
              <option value="hybrid">Hybrid</option>
              <option value="remote">Remote</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block font-body text-xs text-white/50 uppercase tracking-wider mb-2">Location</label>
          <input {...field("location")} placeholder="Singapore" className="w-full px-4 py-3 rounded-xl bg-white/[0.05] border border-white/[0.10] text-white/90 font-body text-sm placeholder:text-white/25 focus:outline-none focus:border-emerald-400/50 transition-all" />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block font-body text-xs text-white/50 uppercase tracking-wider mb-2">Monthly Allowance (S$) *</label>
            <input {...field("monthly_allowance_sgd")} type="number" min="0" placeholder="1000" className="w-full px-4 py-3 rounded-xl bg-white/[0.05] border border-white/[0.10] text-white/90 font-body text-sm placeholder:text-white/25 focus:outline-none focus:border-emerald-400/50 transition-all" />
          </div>
          <div>
            <label className="block font-body text-xs text-white/50 uppercase tracking-wider mb-2">Duration (months)</label>
            <input {...field("duration_months")} type="number" min="1" max="24" placeholder="6" className="w-full px-4 py-3 rounded-xl bg-white/[0.05] border border-white/[0.10] text-white/90 font-body text-sm placeholder:text-white/25 focus:outline-none focus:border-emerald-400/50 transition-all" />
          </div>
          <div>
            <label className="block font-body text-xs text-white/50 uppercase tracking-wider mb-2">Openings</label>
            <input {...field("openings")} type="number" min="1" placeholder="1" className="w-full px-4 py-3 rounded-xl bg-white/[0.05] border border-white/[0.10] text-white/90 font-body text-sm placeholder:text-white/25 focus:outline-none focus:border-emerald-400/50 transition-all" />
          </div>
        </div>

        <div>
          <label className="block font-body text-xs text-white/50 uppercase tracking-wider mb-2">About the Role</label>
          <textarea {...field("description")} rows={4} placeholder="Describe the internship role, responsibilities, and what the intern will work on..." className="w-full px-4 py-3 rounded-xl bg-white/[0.05] border border-white/[0.10] text-white/90 font-body text-sm placeholder:text-white/25 focus:outline-none focus:border-emerald-400/50 transition-all resize-none" />
        </div>

        <div>
          <label className="block font-body text-xs text-white/50 uppercase tracking-wider mb-2">Requirements</label>
          <textarea {...field("requirements")} rows={3} placeholder="What skills, qualifications, or qualities are you looking for?" className="w-full px-4 py-3 rounded-xl bg-white/[0.05] border border-white/[0.10] text-white/90 font-body text-sm placeholder:text-white/25 focus:outline-none focus:border-emerald-400/50 transition-all resize-none" />
        </div>

        <div>
          <label className="block font-body text-xs text-white/50 uppercase tracking-wider mb-2">Skills (comma-separated)</label>
          <input {...field("skills_required")} placeholder="e.g. Microsoft Excel, Communication, Customer Service" className="w-full px-4 py-3 rounded-xl bg-white/[0.05] border border-white/[0.10] text-white/90 font-body text-sm placeholder:text-white/25 focus:outline-none focus:border-emerald-400/50 transition-all" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block font-body text-xs text-white/50 uppercase tracking-wider mb-2">Start Date</label>
            <input {...field("start_date")} type="date" className="w-full px-4 py-3 rounded-xl bg-white/[0.05] border border-white/[0.10] text-white/90 font-body text-sm focus:outline-none focus:border-emerald-400/50 transition-all" />
          </div>
          <div>
            <label className="block font-body text-xs text-white/50 uppercase tracking-wider mb-2">Application Deadline</label>
            <input {...field("application_deadline")} type="date" className="w-full px-4 py-3 rounded-xl bg-white/[0.05] border border-white/[0.10] text-white/90 font-body text-sm focus:outline-none focus:border-emerald-400/50 transition-all" />
          </div>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={e => handleSubmit(e, false)}
            disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white/[0.05] border border-white/[0.10] text-white/60 font-body text-sm font-semibold hover:bg-white/[0.08] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Save as Draft
          </button>
          <button
            type="button"
            onClick={e => handleSubmit(e, true)}
            disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-emerald-500/15 border border-emerald-400/30 text-emerald-400 font-body text-sm font-semibold hover:bg-emerald-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlusCircle className="w-4 h-4" />}
            Publish Now
          </button>
        </div>
      </form>
    </div>
  );
}
