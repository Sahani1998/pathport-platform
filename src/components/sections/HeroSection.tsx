"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import GoldButton from "@/components/ui/GoldButton";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { INDIAN_STATES, COURSE_OPTIONS } from "@/data/form-constants";
import { cn } from "@/lib/utils";

const STATS = [
  { value: "250+",   label: "Institutions"  },
  { value: "15+",    label: "Countries"     },
  { value: "4",      label: "Diploma Types" },
  { value: "24hrs",  label: "Offer Letter"  },
];

const INPUT = cn(
  "w-full bg-navy-800/70 border border-white/[0.10] rounded-xl px-4 py-3",
  "font-body text-sm text-white placeholder-white/30",
  "focus:outline-none focus:border-gold-400/60 focus:ring-1 focus:ring-gold-400/20",
  "transition-all duration-200 [&>option]:bg-navy-800 [&>option]:text-white"
);

export default function HeroSection() {
  const [form, setForm] = useState({ fullName: "", phone: "", email: "", state: "", city: "", course: "" });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const onChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await new Promise<void>(r => setTimeout(r, 1400));
    setLoading(false);
    setSubmitted(true);
  };

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden pt-[68px]">
      {/* Background */}
      <div aria-hidden className="absolute inset-0 bg-grid-subtle bg-[size:60px_60px] opacity-70 pointer-events-none" />
      <div aria-hidden className="absolute top-[30%] left-[5%] w-[500px] h-[500px] rounded-full bg-pathBlue-500/[0.05] blur-[130px] animate-float pointer-events-none" />
      <div aria-hidden className="absolute bottom-[10%] right-[5%] w-[400px] h-[400px] rounded-full bg-gold-400/[0.05] blur-[110px] animate-float pointer-events-none" style={{ animationDelay: "3s" }} />

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

            {/* Headline */}
            <h1 className="font-display text-5xl sm:text-6xl lg:text-[3.8rem] xl:text-[4.2rem] text-white leading-[1.05] mb-6">
              Study{" "}
              <span className="relative inline-block">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-pathBlue-400 to-pathBlue-300">+</span>
              </span>{" "}
              Earn in{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold-400 via-gold-300 to-gold-400">
                Singapore
              </span>
            </h1>

            {/* Subheadline */}
            <p className="text-white/52 font-body text-lg leading-relaxed mb-10 max-w-xl">
              Apply to Singapore diploma, advanced diploma, higher diploma, and specialist diploma
              programmes from India — with application tracking, 24-hour offer letter support,
              internship pathways, and full arrival services.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3 mb-12">
              <GoldButton variant="solid-gold" size="lg" className="group">
                Explore Opportunities
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" />
              </GoldButton>
              <GoldButton variant="outline-gold" size="lg">
                Partner With Us
              </GoldButton>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {STATS.map(({ value, label }) => (
                <div key={label} className="bg-white/[0.04] border border-white/[0.07] rounded-xl p-4 hover:border-gold-400/25 transition-colors">
                  <div className="font-display text-2xl text-gold-400 font-bold mb-1">{value}</div>
                  <div className="font-body text-white/45 text-xs">{label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* ── RIGHT: Quick Form + Dashboard Widget ────────────────── */}
          <div className="flex flex-col gap-4">

            {/* Quick Interest Form */}
            <div className="bg-navy-800/80 border border-white/[0.10] rounded-2xl p-6 backdrop-blur-md shadow-glass">
              <p className="text-gold-400 font-body text-xs font-semibold tracking-[0.18em] uppercase mb-2">
                APPLY INTEREST FORM
              </p>
              <h2 className="font-display text-[1.55rem] text-white mb-1.5 leading-snug">
                Start Your Singapore Journey
              </h2>
              <p className="text-white/45 font-body text-sm mb-5 leading-relaxed">
                Students from India can submit their interest and receive course recommendations, guidance, and fast offer letter assistance.
              </p>

              {submitted ? (
                <div className="text-center py-6">
                  <CheckCircle2 className="w-12 h-12 text-gold-400 mx-auto mb-3" />
                  <p className="font-display text-xl text-white">Interest Received!</p>
                  <p className="text-white/50 font-body text-sm mt-1">We&apos;ll call you within 24 hours.</p>
                </div>
              ) : (
                <form onSubmit={onSubmit} className="space-y-3">
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
                    {loading ? "Submitting…" : "Submit Interest"}
                  </GoldButton>
                  <p className="text-center text-white/28 font-body text-[11px]">
                    Offer letter support • Singapore guidance • Internship pathways
                  </p>
                </form>
              )}
            </div>

            {/* PathPort AI Dashboard Preview Widget */}
            <div className="bg-navy-800/70 border border-white/[0.09] rounded-2xl p-5 backdrop-blur-md shadow-card">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-pathBlue-400 font-body text-xs font-semibold tracking-[0.16em] uppercase">PATHPORT AI</p>
                  <h3 className="font-display text-lg text-white leading-snug">Singapore Student Dashboard</h3>
                </div>
                <span className="inline-flex items-center gap-1.5 bg-emerald-500/15 border border-emerald-500/30 rounded-full px-3 py-1 text-emerald-400 font-body text-xs font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "University Match",   value: "92%",      color: "text-pathBlue-400" },
                  { label: "Application Status", value: "Tracking", color: "text-gold-400"     },
                  { label: "Scholarship Fit",    value: "High",     color: "text-emerald-400"  },
                  { label: "Career Path",        value: "Ready",    color: "text-white"        },
                ].map(({ label, value, color }) => (
                  <div key={label} className="bg-navy-700/60 border border-white/[0.07] rounded-xl p-3.5">
                    <p className="text-white/40 font-body text-xs mb-1.5">{label}</p>
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
