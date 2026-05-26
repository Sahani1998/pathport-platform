"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import GoldButton from "@/components/ui/GoldButton";
import SectionHeader from "@/components/ui/SectionHeader";
import GlassCard from "@/components/ui/GlassCard";
import type { StudentInterestFormData } from "@/types";
import {
  INDIAN_STATES, SUPPORTED_COUNTRIES, COURSE_OPTIONS,
  INTAKE_OPTIONS, BUDGET_RANGES,
} from "@/data/form-constants";
import { createClient } from "@/lib/supabase/client";
import { Send, CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const INITIAL: StudentInterestFormData = {
  fullName: "", whatsapp: "", email: "", country: "India",
  indianState: "", city: "", courseInterest: "", intendedIntake: "", budgetRange: "",
};

const LABEL = "block font-body text-white/55 text-sm mb-1.5 tracking-wide";
const INPUT = cn(
  "w-full bg-white/[0.06] border border-white/[0.10] rounded-xl px-4 py-3.5",
  "font-body text-sm text-white placeholder-white/25",
  "focus:outline-none focus:border-gold-400/60 focus:ring-1 focus:ring-gold-400/20",
  "transition-all duration-200 [&>option]:bg-[#0D1530] [&>option]:text-white"
);

export default function StudentInterestForm() {
  const [form,      setForm]      = useState<StudentInterestFormData>(INITIAL);
  const [loading,   setLoading]   = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error,     setError]     = useState<string | null>(null);
  const showStateField = form.country === "India";

  const onChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const supabase = createClient();
      console.log("[InquirySubmit] interest form — inserting into public.student_inquiries");

      const { error: insertError } = await supabase
        .from("student_inquiries")
        .insert({
          full_name:       form.fullName.trim(),
          email:           form.email.trim().toLowerCase(),
          whatsapp_number: form.whatsapp.trim()    || null,
          country:         form.country,
          indian_state:    form.country === "India" ? (form.indianState || null) : null,
          city:            form.city.trim()          || null,
          course_interest: form.courseInterest       || null,
          intended_intake: form.intendedIntake       || null,
          budget_range:    form.budgetRange          || null,
          status:          "new",
        });

      console.log("[InquirySubmit] interest form result — error:", insertError?.message ?? "none");

      if (insertError) {
        console.error("[InquirySubmit] interest insert error:", insertError.code, insertError.message);
        setError("Something went wrong. Please try again or WhatsApp us at +65 8377 6492.");
        return;
      }

      setSubmitted(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[InquirySubmit] interest form exception:", msg);
      setError("Something went wrong. Please try again or WhatsApp us at +65 8377 6492.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="interest-form" className="relative py-24 overflow-hidden">
      <div aria-hidden className="absolute inset-0 bg-gradient-to-b from-transparent via-gold-400/[0.025] to-transparent pointer-events-none" />

      <div className="max-w-7xl mx-auto px-5 md:px-10">
        <SectionHeader
          eyebrow="Register Your Interest"
          title="Apply for Singapore — Completely Free"
          subtitle="Fill in your details below. A PathPort advisor will call you within 24 hours with personalised college and course recommendations."
        />

        <div className="max-w-3xl mx-auto">
          <GlassCard gold className="p-8 md:p-12">
            {submitted ? (
              <div className="text-center py-14">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gold-400/15 border border-gold-400/30 mb-6">
                  <CheckCircle2 className="w-10 h-10 text-gold-400" />
                </div>
                <h3 className="font-display text-3xl text-white mb-3">Application Received!</h3>
                <p className="text-white/50 font-body text-lg max-w-sm mx-auto">
                  Thank you. A PathPort advisor will contact you within 24 hours.
                </p>
                <button
                  onClick={() => { setSubmitted(false); setForm(INITIAL); }}
                  className="mt-8 text-gold-400 hover:text-gold-300 font-body text-sm underline underline-offset-2 transition-colors"
                >
                  Submit another enquiry
                </button>
              </div>
            ) : (
              <form onSubmit={onSubmit} noValidate className="space-y-5">

                {/* Error banner */}
                {error && (
                  <div className="flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 font-body text-sm">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    {error}
                  </div>
                )}

                {/* Row 1 — Full Name + WhatsApp */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label htmlFor="fullName" className={LABEL}>Full Name <span className="text-gold-400">*</span></label>
                    <input id="fullName" name="fullName" type="text" required
                      value={form.fullName} onChange={onChange}
                      placeholder="e.g. Rahul Sharma"
                      className={INPUT} autoComplete="name" />
                  </div>
                  <div>
                    <label htmlFor="whatsapp" className={LABEL}>WhatsApp Number <span className="text-gold-400">*</span></label>
                    <input id="whatsapp" name="whatsapp" type="tel" required
                      value={form.whatsapp} onChange={onChange}
                      placeholder="+91 98765 43210"
                      className={INPUT} autoComplete="tel" />
                  </div>
                </div>

                {/* Row 2 — Email + Country */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label htmlFor="email" className={LABEL}>Email Address <span className="text-gold-400">*</span></label>
                    <input id="email" name="email" type="email" required
                      value={form.email} onChange={onChange}
                      placeholder="you@email.com"
                      className={INPUT} autoComplete="email" />
                  </div>
                  <div>
                    <label htmlFor="country" className={LABEL}>Country <span className="text-gold-400">*</span></label>
                    <select id="country" name="country" required
                      value={form.country} onChange={onChange}
                      className={cn(INPUT, "appearance-none cursor-pointer")}>
                      {SUPPORTED_COUNTRIES.map(({ value, label, primary }) => (
                        <option key={value} value={value}>
                          {label}{!primary ? " (Coming Soon)" : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Row 3 — Indian State (conditional) + City */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {showStateField && (
                    <div>
                      <label htmlFor="indianState" className={LABEL}>Indian State <span className="text-gold-400">*</span></label>
                      <select id="indianState" name="indianState"
                        required={showStateField}
                        value={form.indianState} onChange={onChange}
                        className={cn(INPUT, "appearance-none cursor-pointer")}>
                        <option value="">Select your state</option>
                        {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  )}
                  <div className={!showStateField ? "sm:col-span-2" : ""}>
                    <label htmlFor="city" className={LABEL}>City <span className="text-gold-400">*</span></label>
                    <input id="city" name="city" type="text" required
                      value={form.city} onChange={onChange}
                      placeholder="e.g. Mumbai"
                      className={INPUT} autoComplete="address-level2" />
                  </div>
                </div>

                {/* Row 4 — Course Interest + Intended Intake */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label htmlFor="courseInterest" className={LABEL}>Course Interest <span className="text-gold-400">*</span></label>
                    <select id="courseInterest" name="courseInterest" required
                      value={form.courseInterest} onChange={onChange}
                      className={cn(INPUT, "appearance-none cursor-pointer")}>
                      <option value="">Select a course</option>
                      {COURSE_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="intendedIntake" className={LABEL}>Intended Intake <span className="text-gold-400">*</span></label>
                    <select id="intendedIntake" name="intendedIntake" required
                      value={form.intendedIntake} onChange={onChange}
                      className={cn(INPUT, "appearance-none cursor-pointer")}>
                      <option value="">Select intake</option>
                      {INTAKE_OPTIONS.map(i => <option key={i} value={i}>{i}</option>)}
                    </select>
                  </div>
                </div>

                {/* Row 5 — Budget Range */}
                <div>
                  <label htmlFor="budgetRange" className={LABEL}>Budget Range (tuition fees) <span className="text-white/30">(Optional)</span></label>
                  <select id="budgetRange" name="budgetRange"
                    value={form.budgetRange} onChange={onChange}
                    className={cn(INPUT, "appearance-none cursor-pointer")}>
                    <option value="">Select budget range</option>
                    {BUDGET_RANGES.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>

                <GoldButton type="submit" variant="solid-gold" size="lg" disabled={loading} className="w-full">
                  {loading ? (
                    <><Loader2 className="w-5 h-5 animate-spin" /> Submitting…</>
                  ) : (
                    <><Send className="w-5 h-5" /> Submit My Interest — It&apos;s Free</>
                  )}
                </GoldButton>

                <p className="text-center text-white/35 font-body text-xs leading-relaxed">
                  We respect your privacy. Your details are never shared or sold. No spam, ever.<br />
                  Questions? WhatsApp us: <span className="text-gold-400">+65 8377 6492</span>
                </p>
              </form>
            )}
          </GlassCard>
        </div>
      </div>
    </section>
  );
}
