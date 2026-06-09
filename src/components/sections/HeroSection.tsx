"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import GoldButton from "@/components/ui/GoldButton";
import { ArrowRight, CheckCircle2, AlertCircle, Loader2, Check } from "lucide-react";
import { INDIAN_STATES, COURSE_OPTIONS } from "@/data/form-constants";
import { cn } from "@/lib/utils";

const STATS = [
  { value: "5+",    label: "Institute Network"  },
  { value: "100+",  label: "Student Inquiries"  },
  { value: "4",     label: "Diploma Pathways"   },
  { value: "24hrs", label: "Offer Letter"        },
];

const TRUST_BADGES = [
  "Application Tracking",
  "Offer Letter Support",
  "Internship Pathways",
  "Arrival Services",
];

const INPUT = cn(
  "w-full bg-navy-900/60 border border-white/[0.12] rounded-xl px-4 py-3",
  "font-body text-sm text-white placeholder-white/30",
  "focus:outline-none focus:border-gold-400/70 focus:ring-2 focus:ring-gold-400/15 focus:bg-navy-900/80",
  "hover:border-white/[0.18]",
  "transition-all duration-200 [&>option]:bg-navy-900 [&>option]:text-white"
);

export default function HeroSection() {
  const [form, setForm] = useState({ fullName: "", phone: "", email: "", state: "", city: "", course: "" });
  const [submitted, setSubmitted] = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState<string | null>(null);

  const onChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setError(null);
    setLoading(true);

    try {
      const supabase = createClient();
      console.log("[InquirySubmit] hero form — inserting into public.student_inquiries");

      const { error: insertError } = await supabase
        .from("student_inquiries")
        .insert({
          full_name:       form.fullName.trim(),
          email:           form.email.trim().toLowerCase(),
          whatsapp_number: form.phone.trim()  || null,
          country:         "India",
          indian_state:    form.state         || null,
          city:            form.city.trim()   || null,
          course_interest: form.course        || null,
          status:          "new",
        });

      console.log("[InquirySubmit] hero form result — error:", insertError?.message ?? "none");

      if (insertError) {
        console.error("[InquirySubmit] hero insert error:", insertError.code, insertError.message);
        setError("Something went wrong. Please WhatsApp us at +65 8377 6492.");
        return;
      }

      setSubmitted(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[InquirySubmit] hero form exception:", msg);
      setError("Something went wrong. Please WhatsApp us at +65 8377 6492.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden pt-[68px]">
      {/* Singapore skyline — kept very subtle for depth without distraction */}
      <div aria-hidden className="absolute inset-0 pointer-events-none">
        <img
          src="https://images.unsplash.com/photo-1525625293386-3f8f99389edd?auto=format&fit=crop&w=1800&q=60"
          alt=""
          className="absolute bottom-0 left-0 w-full h-[55%] object-cover object-top opacity-[0.05]"
        />
        <div className="absolute bottom-0 left-0 w-full h-[55%] bg-gradient-to-t from-[#06142E] via-[#06142E]/85 to-transparent" />
      </div>

      {/* Grid pattern — reduced to ~8% opacity per spec */}
      <div aria-hidden className="absolute inset-0 bg-grid-subtle bg-[size:60px_60px] opacity-[0.08] pointer-events-none" />

      {/* Radial glow accents — premium SaaS depth */}
      <div aria-hidden className="absolute top-[20%] left-[8%] w-[520px] h-[520px] rounded-full bg-pathBlue-500/[0.10] blur-[140px] pointer-events-none" />
      <div aria-hidden className="absolute bottom-[15%] right-[8%] w-[420px] h-[420px] rounded-full bg-gold-400/[0.06] blur-[120px] pointer-events-none" />
      <div aria-hidden className="absolute top-[10%] right-[20%] w-[300px] h-[300px] rounded-full bg-pathBlue-700/[0.18] blur-[100px] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-5 md:px-10 py-16 md:py-20 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] xl:grid-cols-[1fr_460px] gap-12 xl:gap-16 items-center">

          {/* ── LEFT: Hero Text ─────────────────────────────────────── */}
          <div>
            {/* Eyebrow badge */}
            <div className="inline-flex items-center gap-2 bg-pathBlue-500/10 border border-pathBlue-500/25 rounded-full px-4 py-2 mb-8">
              <span className="text-lg">🚀</span>
              <span className="text-pathBlue-300 font-body text-sm font-medium tracking-wider">
                India → Singapore Diploma Platform
              </span>
            </div>

            {/* Headline with subtle glow behind */}
            <div className="relative mb-6">
              <div aria-hidden className="absolute -inset-x-8 -inset-y-4 bg-gradient-to-r from-pathBlue-500/[0.10] via-transparent to-gold-400/[0.08] blur-3xl pointer-events-none" />
              <h1 className="relative font-display text-5xl sm:text-6xl lg:text-[3.8rem] xl:text-[4.2rem] text-white leading-[1.05] tracking-tight">
                Study{" "}
                <span className="relative inline-block">
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-pathBlue-400 to-pathBlue-300">+</span>
                </span>{" "}
                Earn in{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold-400 via-gold-300 to-gold-400">
                  Singapore
                </span>
              </h1>
            </div>

            {/* Subheadline */}
            <p className="text-white/55 font-body text-lg leading-relaxed mb-7 max-w-xl">
              Apply to Singapore <strong className="text-white/85">diploma, advanced diploma, higher diploma,</strong> and <strong className="text-white/85">specialist diploma</strong> programmes from India — with <strong className="text-white/85">application tracking</strong>, <strong className="text-white/85">24-hour offer letter support</strong>, <strong className="text-white/85">internship pathways</strong>, and full arrival services. Courses start from <strong className="text-gold-400">SGD 4,000 to 8,000</strong> per year.
            </p>

            {/* Trust badges — premium pill row */}
            <div className="flex flex-wrap gap-2 mb-10">
              {TRUST_BADGES.map(label => (
                <span
                  key={label}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.10] backdrop-blur-sm text-white/75 font-body text-xs font-medium hover:border-gold-400/35 hover:text-white/95 hover:bg-white/[0.06] transition-all duration-200"
                >
                  <Check className="w-3.5 h-3.5 text-gold-400 flex-shrink-0" strokeWidth={2.5} />
                  {label}
                </span>
              ))}
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3 mb-12">
              <Link href="/dashboard/student/courses">
                <GoldButton variant="solid-gold" size="lg" className="group">
                  Explore Courses
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" />
                </GoldButton>
              </Link>
              <Link href="/students">
                <GoldButton variant="outline-gold" size="lg">
                  How It Works
                </GoldButton>
              </Link>
            </div>

            {/* Stats — premium cards with lift + glow on hover */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {STATS.map(({ value, label }) => (
                <div
                  key={label}
                  className="group relative bg-white/[0.04] border border-white/[0.08] rounded-xl p-4 backdrop-blur-sm transition-all duration-300 hover:border-gold-400/35 hover:bg-white/[0.06] hover:-translate-y-0.5 hover:shadow-[0_8px_24px_-8px_rgba(240,165,0,0.25)]"
                >
                  <div className="font-display text-2xl text-gold-400 font-bold mb-1 group-hover:scale-[1.02] transition-transform">{value}</div>
                  <div className="font-body text-white/50 text-xs">{label}</div>
                </div>
              ))}
            </div>

            {/* Student photo — aspirational human element, fills vertical space below stats */}
            <div className="relative mt-6 rounded-2xl overflow-hidden h-44 hidden lg:block">
              <img
                src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=900&q=75"
                alt=""
                loading="lazy"
                className="absolute inset-0 w-full h-full object-cover object-[center_35%]"
              />
              {/* Left + right edge blends into page background */}
              <div aria-hidden className="absolute inset-0 bg-gradient-to-r from-[#06142E] via-transparent to-[#06142E]/70 pointer-events-none" />
              {/* Top + bottom fades */}
              <div aria-hidden className="absolute inset-0 bg-gradient-to-b from-[#06142E]/65 via-transparent to-[#06142E] pointer-events-none" />
              {/* Navy brand tint — ties to dark background */}
              <div aria-hidden className="absolute inset-0 bg-pathBlue-900/20 pointer-events-none" />
              {/* Caption badge */}
              <div className="absolute bottom-4 left-5">
                <span className="inline-flex items-center gap-2 bg-black/50 backdrop-blur-sm border border-white/[0.10] rounded-full px-3 py-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-gold-400 flex-shrink-0" />
                  <span className="text-white/65 font-body text-xs tracking-wide">India → Singapore diploma students</span>
                </span>
              </div>
            </div>
          </div>

          {/* ── RIGHT: Quick Form + Dashboard Widget ────────────────── */}
          <div className="relative flex flex-col gap-4">

            {/* Blue glow behind the entire right column — makes the form pop */}
            <div aria-hidden className="absolute -inset-6 bg-gradient-to-br from-pathBlue-500/[0.18] via-pathBlue-700/[0.10] to-transparent blur-3xl pointer-events-none -z-10" />

            {/* Quick Interest Form — glassmorphism, stronger border, soft shadow */}
            <div className="relative bg-gradient-to-br from-white/[0.08] via-navy-800/70 to-navy-900/85 border border-white/[0.14] rounded-2xl p-6 backdrop-blur-xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.08)] hover:border-white/[0.18] hover:shadow-[0_24px_72px_-15px_rgba(30,78,216,0.35),inset_0_1px_0_rgba(255,255,255,0.10)] transition-all duration-300">
              <p className="text-gold-400 font-body text-xs font-semibold tracking-[0.18em] uppercase mb-2">
                APPLY INTEREST FORM
              </p>
              <h2 className="font-display text-[1.55rem] text-white mb-1.5 leading-snug">
                Start Your Singapore Journey
              </h2>
              <p className="text-white/55 font-body text-sm mb-5 leading-relaxed">
                Students from India can submit their interest and receive <strong className="text-white/80">course recommendations</strong>, guidance, and <strong className="text-white/80">fast offer letter assistance</strong>.
              </p>

              {submitted ? (
                <div className="text-center py-6">
                  <CheckCircle2 className="w-12 h-12 text-gold-400 mx-auto mb-3" />
                  <p className="font-display text-xl text-white">Interest Received!</p>
                  <p className="text-white/50 font-body text-sm mt-1">Thank you. A PathPort advisor will contact you within 24 hours.</p>
                </div>
              ) : (
                <form onSubmit={onSubmit} method="POST" action="#" className="space-y-3">

                  {/* Error banner */}
                  {error && (
                    <div className="flex items-start gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 font-body text-xs">
                      <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                      {error}
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-3">
                    <input required name="fullName" type="text" value={form.fullName} onChange={onChange}
                      placeholder="Full Name" className={INPUT} autoComplete="name" />
                    <input required name="phone" type="tel" value={form.phone} onChange={onChange}
                      placeholder="Phone Number" className={INPUT} autoComplete="tel" />
                  </div>
                  <input required name="email" type="email" value={form.email} onChange={onChange}
                    placeholder="Email Address" className={INPUT} autoComplete="email" />
                  <div className="grid grid-cols-2 gap-3">
                    <select required name="state" value={form.state} onChange={onChange}
                      className={cn(INPUT, "appearance-none cursor-pointer")}>
                      <option value="">Select State</option>
                      {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <input name="city" type="text" value={form.city} onChange={onChange}
                      placeholder="City" className={INPUT} />
                  </div>
                  <select name="course" value={form.course} onChange={onChange}
                    className={cn(INPUT, "appearance-none cursor-pointer")}>
                    <option value="">Interested Course</option>
                    {COURSE_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <GoldButton type="submit" variant="solid-gold" size="md" disabled={loading} className="w-full rounded-xl mt-1">
                    {loading
                      ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting…</>
                      : "Submit Interest"
                    }
                  </GoldButton>
                  <p className="text-center text-white/28 font-body text-[11px]">
                    Offer letter support • Singapore guidance • Internship pathways
                  </p>
                </form>
              )}
            </div>

            {/* PathPort AI Dashboard Preview Widget — premium card */}
            <div className="relative bg-gradient-to-br from-white/[0.06] via-navy-800/65 to-navy-900/80 border border-white/[0.12] rounded-2xl p-5 backdrop-blur-xl shadow-[0_16px_48px_-12px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.06)]">
              <div className="flex items-start justify-between mb-5">
                <div>
                  <p className="text-pathBlue-400 font-body text-[11px] font-semibold tracking-[0.20em] uppercase mb-1">PATHPORT AI</p>
                  <h3 className="font-display text-lg text-white leading-tight">Singapore Student Dashboard</h3>
                </div>
                <span className="inline-flex items-center gap-1.5 bg-emerald-500/[0.12] border border-emerald-500/30 rounded-full px-2.5 py-1 text-emerald-400 font-body text-[11px] font-semibold tracking-wide">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                {[
                  { label: "Student Satisfaction", value: "95%",     color: "text-gold-400"     },
                  { label: "Application Status",   value: "Tracking",color: "text-pathBlue-400" },
                  { label: "Advisor Response",      value: "24hrs",   color: "text-emerald-400"  },
                  { label: "Career Path",           value: "Ready",   color: "text-white"        },
                ].map(({ label, value, color }) => (
                  <div key={label} className="bg-navy-900/50 border border-white/[0.08] rounded-xl p-3.5 hover:border-white/[0.14] hover:bg-navy-900/70 transition-colors">
                    <p className="text-white/45 font-body text-[11px] mb-1.5 tracking-wide">{label}</p>
                    <p className={cn("font-display text-xl font-bold", color)}>{value}</p>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}
