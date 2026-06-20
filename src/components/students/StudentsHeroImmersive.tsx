"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import GoldButton from "@/components/ui/GoldButton";
import { ArrowRight, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { INDIAN_STATES, COURSE_OPTIONS } from "@/data/form-constants";
import { cn } from "@/lib/utils";

/**
 * StudentsHeroImmersive — full-bleed photography hero for /students with an
 * overlaid "Register your interest" callback form. Mirrors the homepage
 * HeroImmersive pattern for visual continuity, with student-journey copy.
 *
 * Conversion path: the compact form is overlaid on desktop and drops below the
 * headline on mobile. Submits to `student_inquiries` via the user-scoped client.
 */

const TRUST_BADGES = [
  "24-hour offer letter",
  "Live IPA tracking",
  "Full arrival support",
];

const INPUT = cn(
  "w-full bg-white border border-slate-200 rounded-xl px-4 py-3",
  "font-body text-sm text-navy-900 placeholder-navy-800/35",
  "focus:outline-none focus:border-pathBlue-500/60 focus:ring-2 focus:ring-pathBlue-500/15",
  "hover:border-slate-300 transition-all duration-200",
  "[&>option]:bg-white [&>option]:text-navy-900",
);

export default function StudentsHeroImmersive() {
  const [form, setForm] = useState({ fullName: "", phone: "", email: "", state: "", course: "" });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState<string | null>(null);

  const onChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setError(null);
    setLoading(true);
    try {
      const supabase = createClient();
      const { error: insertError } = await supabase
        .from("student_inquiries")
        .insert({
          full_name:       form.fullName.trim(),
          email:           form.email.trim().toLowerCase(),
          whatsapp_number: form.phone.trim() || null,
          country:         "India",
          indian_state:    form.state || null,
          course_interest: form.course || null,
          status:          "new",
        });
      if (insertError) {
        setError("Something went wrong. Please WhatsApp us at +65 8377 6492.");
        return;
      }
      setSubmitted(true);
    } catch {
      setError("Something went wrong. Please WhatsApp us at +65 8377 6492.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="relative w-full min-h-[88vh] lg:min-h-[92vh] overflow-hidden bg-[#06142E]">
      {/* Full-bleed photo */}
      <div aria-hidden className="absolute inset-0">
        <Image
          src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=2400&q=80"
          alt=""
          fill
          sizes="100vw"
          priority
          className="object-cover object-[center_35%]"
          unoptimized
        />
        <div className="absolute inset-0 bg-gradient-to-b from-navy-900/85 via-navy-900/55 to-navy-900/80" />
        <div className="absolute inset-0 bg-gradient-to-r from-navy-900/70 via-transparent to-navy-900/30" />
      </div>

      <div className="relative layout-shell pt-[120px] pb-20 lg:pt-[140px] lg:pb-28 min-h-[88vh] lg:min-h-[92vh] flex items-center">
        <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_minmax(360px,1fr)] gap-10 xl:gap-16 items-center w-full">

          {/* LEFT — Headline + lead + CTAs */}
          <div className="text-white max-w-3xl">
            <span className="inline-flex items-center gap-2 bg-white/[0.08] border border-white/[0.18] backdrop-blur-sm rounded-full px-4 py-1.5 mb-8 text-xs font-body font-semibold tracking-[0.18em] text-white/85 uppercase">
              <span aria-hidden className="w-1.5 h-1.5 rounded-full bg-gold-400" />
              For Indian Students — Singapore Diploma Platform
            </span>

            <h1 className="display-1 text-white mb-7">
              Your journey to{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold-400 via-gold-300 to-gold-400">
                Singapore
              </span>{" "}
              starts here.
            </h1>

            <p className="lead text-white/75 mb-10 max-w-2xl">
              Register free. Get your Singapore college offer letter in 24 hours. Track your IPA live. Land with full arrival support — and a real advisor on WhatsApp the whole way.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 mb-10">
              <Link href="/signup?role=student">
                <GoldButton variant="solid-gold" size="lg" className="group">
                  Register as Student — Free
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </GoldButton>
              </Link>
              <Link href="/login">
                <GoldButton variant="outline-gold" size="lg">
                  Student Login
                </GoldButton>
              </Link>
            </div>

            <ul className="flex flex-wrap gap-x-6 gap-y-2 text-white/55 font-body text-sm" role="list">
              {TRUST_BADGES.map(b => (
                <li key={b} className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" strokeWidth={2.25} />
                  {b}
                </li>
              ))}
            </ul>
          </div>

          {/* RIGHT — Compact callback form (white card overlay) */}
          <div id="apply" className="w-full max-w-md mx-auto lg:mx-0 lg:ml-auto scroll-mt-24">
            <div className="bg-white rounded-2.5xl shadow-[0_24px_60px_-20px_rgba(0,0,0,0.45)] p-6 md:p-7 border border-white/30">
              <p className="eyebrow text-pathBlue-700 mb-2">Register your interest</p>
              <p className="font-display text-2xl text-navy-900 leading-tight mb-1.5">
                Talk to an advisor — free.
              </p>
              <p className="font-body text-navy-800/60 text-sm leading-relaxed mb-5">
                We&rsquo;ll call within 24 hours to guide you through courses, fees, and the application process.
              </p>

              {submitted ? (
                <div className="text-center py-6">
                  <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                  <p className="font-display text-xl text-navy-900">Thank you.</p>
                  <p className="font-body text-navy-800/60 text-sm mt-1">A PathPort advisor will contact you within 24 hours.</p>
                </div>
              ) : (
                <form onSubmit={onSubmit} className="space-y-3">
                  {error && (
                    <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 font-body text-xs">
                      <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                      {error}
                    </div>
                  )}
                  <input required name="fullName" type="text"  value={form.fullName} onChange={onChange} placeholder="Full name" autoComplete="name" className={INPUT} />
                  <div className="grid grid-cols-2 gap-2">
                    <input required name="phone" type="tel" value={form.phone} onChange={onChange} placeholder="Phone" autoComplete="tel" className={INPUT} />
                    <input required name="email" type="email" value={form.email} onChange={onChange} placeholder="Email" autoComplete="email" className={INPUT} />
                  </div>
                  <select required name="state" value={form.state} onChange={onChange} className={cn(INPUT, "appearance-none cursor-pointer")}>
                    <option value="">Indian state</option>
                    {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <select name="course" value={form.course} onChange={onChange} className={cn(INPUT, "appearance-none cursor-pointer")}>
                    <option value="">Interested course (optional)</option>
                    {COURSE_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-gold-500 to-gold-400 text-navy-900 font-body font-bold text-sm hover:shadow-gold-sm transition-all disabled:opacity-60"
                  >
                    {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting…</> : "Get my callback"}
                  </button>
                  <p className="text-center text-navy-800/45 font-body text-[11px]">
                    Free · No commitment · 24-hour reply
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
