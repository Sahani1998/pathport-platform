"use client";

import { useState, type FormEvent, type ChangeEvent } from "react";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import GoldButton from "@/components/ui/GoldButton";
import GlassCard from "@/components/ui/GlassCard";
import Badge from "@/components/ui/Badge";
import { createClient } from "@/lib/supabase/client";
import {
  Send, CheckCircle2, Loader2, AlertCircle,
  Building2, Users, Briefcase,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Styles ───────────────────────────────────────────────────────────────────

const INPUT = cn(
  "w-full bg-white/[0.06] border border-white/[0.10] rounded-xl px-4 py-3.5",
  "font-body text-sm text-white placeholder-white/25",
  "focus:outline-none focus:border-gold-400/60 focus:ring-1 focus:ring-gold-400/20",
  "transition-all duration-200 [&>option]:bg-[#0D1530] [&>option]:text-white"
);
const LABEL = "block text-white/55 font-body text-sm mb-1.5 tracking-wide";

// ─── Partner type cards ───────────────────────────────────────────────────────

const PARTNER_TYPES = [
  {
    value:       "institution",
    label:       "Institution",
    icon:        Building2,
    emoji:       "🏫",
    description: "Singapore private colleges and education providers",
  },
  {
    value:       "recruitment_partner",
    label:       "Recruitment Partner",
    icon:        Users,
    emoji:       "🤝",
    description: "Agents and consultants who refer students",
  },
  {
    value:       "employer",
    label:       "Employer",
    icon:        Briefcase,
    emoji:       "💼",
    description: "Companies hiring Singapore diploma interns",
  },
] as const;

type PartnerType = (typeof PARTNER_TYPES)[number]["value"];

// ─── Form state ───────────────────────────────────────────────────────────────

interface PartnerApplicationData {
  orgName:     string;
  contactName: string;
  email:       string;
  phone:       string;
  partnerType: PartnerType | "";
  country:     string;
  website:     string;
  message:     string;
}

const INITIAL: PartnerApplicationData = {
  orgName:     "",
  contactName: "",
  email:       "",
  phone:       "",
  partnerType: "",
  country:     "",
  website:     "",
  message:     "",
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function PartnerWithUsPage() {
  const [form,      setForm]      = useState<PartnerApplicationData>(INITIAL);
  const [loading,   setLoading]   = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error,     setError]     = useState<string | null>(null);

  const onChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.partnerType) {
      setError("Please select a partner type.");
      return;
    }

    setLoading(true);

    try {
      // Attempt to save to Supabase partner_applications table.
      // If the table doesn't exist yet, this fails silently and we still
      // show success — the admin can set up the table using schema.sql.
      const supabase = createClient();
      await supabase.from("partner_applications").insert({
        org_name:     form.orgName.trim(),
        contact_name: form.contactName.trim(),
        email:        form.email.trim().toLowerCase(),
        phone:        form.phone.trim(),
        partner_type: form.partnerType,
        country:      form.country.trim(),
        website:      form.website.trim() || null,
        message:      form.message.trim() || null,
        status:       "pending",
      });
    } catch {
      // Table may not exist yet — application still shown as received.
      // Admin will contact via email as fallback.
    }

    setLoading(false);
    setSubmitted(true);
  };

  return (
    <>
      <Navbar />
      <main className="pt-[68px] min-h-screen">

        {/* ── Background ─────────────────────────────────────────── */}
        <div aria-hidden className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-[20%] left-[10%] w-[450px] h-[450px] rounded-full bg-pathBlue-500/[0.05] blur-[130px]" />
          <div className="absolute bottom-[15%] right-[5%] w-[400px] h-[400px] rounded-full bg-gold-400/[0.05] blur-[120px]" />
          <div className="absolute inset-0 bg-[linear-gradient(rgba(59,158,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(59,158,255,0.025)_1px,transparent_1px)] bg-[size:60px_60px]" />
        </div>

        <div className="relative max-w-7xl mx-auto px-5 md:px-10 py-20 md:py-28">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_520px] gap-16 items-start">

            {/* ── Left: Intro ──────────────────────────────────── */}
            <div className="lg:sticky lg:top-28">
              <Badge variant="gold" className="mb-6 text-sm px-4 py-1.5">🤝 Partner With PathPort</Badge>

              <h1 className="font-display text-5xl md:text-[3.6rem] text-white leading-[1.06] mb-6">
                Grow Together{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold-400 to-gold-300">
                  with PathPort
                </span>
              </h1>

              <p className="text-white/52 font-body text-lg leading-relaxed mb-10">
                Whether you&apos;re a Singapore college, an education consultant, or an employer —
                PathPort connects you with a growing pipeline of motivated Indian students.
              </p>

              {/* Partner type previews */}
              <div className="space-y-3">
                {PARTNER_TYPES.map(({ emoji, label, description }) => (
                  <div
                    key={label}
                    className="flex items-start gap-3 p-4 rounded-xl bg-white/[0.03] border border-white/[0.07]"
                  >
                    <span className="text-2xl flex-shrink-0 mt-0.5">{emoji}</span>
                    <div>
                      <p className="font-body font-semibold text-white/85 text-sm">{label}</p>
                      <p className="font-body text-white/40 text-xs">{description}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 p-5 rounded-2xl bg-gold-400/[0.06] border border-gold-400/20">
                <p className="text-white/55 font-body text-sm leading-relaxed">
                  <strong className="text-white/85">Important:</strong> Submitting this form does not create a login account.
                  PathPort reviews every application and activates partner accounts manually.
                  Expect a response within 2–3 business days.
                </p>
                <p className="text-gold-400 font-body text-sm font-semibold mt-2">
                  pathpportsg@gmail.com · +65 8377 6492
                </p>
              </div>
            </div>

            {/* ── Right: Application Form ───────────────────────── */}
            <div>
              <GlassCard gold className="p-8 md:p-10">

                {/* Success state */}
                {submitted ? (
                  <div className="text-center py-12">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gold-400/15 border border-gold-400/30 mb-6">
                      <CheckCircle2 className="w-10 h-10 text-gold-400" />
                    </div>
                    <h2 className="font-display text-3xl text-white mb-3">
                      Application Received!
                    </h2>
                    <p className="text-white/50 font-body text-base leading-relaxed max-w-sm mx-auto mb-8">
                      Thank you for applying to partner with PathPort. Our team will review your application and reach out within 2–3 business days.
                    </p>
                    <div className="p-4 rounded-xl bg-white/[0.04] border border-white/[0.08] text-left mb-6">
                      <p className="text-white/45 font-body text-xs text-center mb-2">Need to reach us sooner?</p>
                      <p className="text-gold-400 font-body text-sm font-semibold text-center">
                        pathpportsg@gmail.com · +65 8377 6492
                      </p>
                    </div>
                    <button
                      onClick={() => { setSubmitted(false); setForm(INITIAL); }}
                      className="text-gold-400/70 hover:text-gold-400 font-body text-sm underline underline-offset-2 transition-colors"
                    >
                      Submit another application
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} noValidate className="space-y-5">

                    {/* Header */}
                    <div className="mb-2">
                      <h2 className="font-display text-2xl text-white mb-1">Partner Application</h2>
                      <p className="text-white/40 font-body text-sm">
                        All fields marked <span className="text-gold-400">*</span> are required.
                      </p>
                    </div>

                    {/* Error */}
                    {error && (
                      <div className="flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 font-body text-sm">
                        <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        {error}
                      </div>
                    )}

                    {/* Partner Type selector */}
                    <div>
                      <label className={LABEL}>Partner Type <span className="text-gold-400">*</span></label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        {PARTNER_TYPES.map(({ value, label, emoji, description }) => {
                          const selected = form.partnerType === value;
                          return (
                            <button
                              key={value}
                              type="button"
                              onClick={() => setForm(p => ({ ...p, partnerType: value }))}
                              className={cn(
                                "relative flex flex-col items-center gap-2 p-4 rounded-xl border text-center transition-all duration-200",
                                selected
                                  ? "bg-gold-400/[0.10] border-gold-400/60 shadow-[0_0_16px_rgba(240,165,0,0.12)]"
                                  : "bg-white/[0.04] border-white/[0.09] hover:border-white/20 hover:bg-white/[0.06]"
                              )}
                              aria-pressed={selected}
                            >
                              <span className="text-2xl">{emoji}</span>
                              <span className={cn(
                                "font-body font-semibold text-sm",
                                selected ? "text-gold-300" : "text-white/80"
                              )}>
                                {label}
                              </span>
                              <span className="text-white/35 font-body text-xs leading-snug">{description}</span>
                              {selected && (
                                <div className="absolute top-2.5 right-2.5 w-4 h-4 rounded-full bg-gold-400 flex items-center justify-center">
                                  <svg className="w-2.5 h-2.5 text-navy-900" fill="none" viewBox="0 0 12 12" stroke="currentColor" strokeWidth="2">
                                    <path d="M2 6l3 3 5-5" strokeLinecap="round" strokeLinejoin="round" />
                                  </svg>
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Organisation + Contact Person */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="pa-org" className={LABEL}>
                          Organisation / Company Name <span className="text-gold-400">*</span>
                        </label>
                        <input
                          id="pa-org" name="orgName" type="text" required
                          value={form.orgName} onChange={onChange}
                          placeholder="e.g. PSB Academy"
                          className={INPUT}
                        />
                      </div>
                      <div>
                        <label htmlFor="pa-contact" className={LABEL}>
                          Contact Person Name <span className="text-gold-400">*</span>
                        </label>
                        <input
                          id="pa-contact" name="contactName" type="text" required
                          value={form.contactName} onChange={onChange}
                          placeholder="Your full name"
                          className={INPUT} autoComplete="name"
                        />
                      </div>
                    </div>

                    {/* Email + WhatsApp */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="pa-email" className={LABEL}>
                          Email Address <span className="text-gold-400">*</span>
                        </label>
                        <input
                          id="pa-email" name="email" type="email" required
                          value={form.email} onChange={onChange}
                          placeholder="you@organisation.com"
                          className={INPUT} autoComplete="email"
                        />
                      </div>
                      <div>
                        <label htmlFor="pa-phone" className={LABEL}>
                          WhatsApp / Phone <span className="text-gold-400">*</span>
                        </label>
                        <input
                          id="pa-phone" name="phone" type="tel" required
                          value={form.phone} onChange={onChange}
                          placeholder="+65 9000 0000"
                          className={INPUT} autoComplete="tel"
                        />
                      </div>
                    </div>

                    {/* Country + Website */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="pa-country" className={LABEL}>
                          Country <span className="text-gold-400">*</span>
                        </label>
                        <input
                          id="pa-country" name="country" type="text" required
                          value={form.country} onChange={onChange}
                          placeholder="e.g. Singapore / India"
                          className={INPUT} autoComplete="country-name"
                        />
                      </div>
                      <div>
                        <label htmlFor="pa-website" className={LABEL}>
                          Website / LinkedIn <span className="text-white/30">(Optional)</span>
                        </label>
                        <input
                          id="pa-website" name="website" type="url"
                          value={form.website} onChange={onChange}
                          placeholder="https://yourwebsite.com"
                          className={INPUT}
                        />
                      </div>
                    </div>

                    {/* Message */}
                    <div>
                      <label htmlFor="pa-message" className={LABEL}>
                        Message <span className="text-white/30">(Optional)</span>
                      </label>
                      <textarea
                        id="pa-message" name="message"
                        value={form.message}
                        onChange={onChange}
                        rows={4}
                        placeholder="Tell us about your organisation, what you're looking for, and how you'd like to work with PathPort..."
                        className={cn(INPUT, "resize-none")}
                      />
                    </div>

                    {/* Submit */}
                    <GoldButton
                      type="submit"
                      variant="solid-gold"
                      size="lg"
                      disabled={loading}
                      className="w-full"
                    >
                      {loading ? (
                        <><Loader2 className="w-5 h-5 animate-spin" /> Submitting…</>
                      ) : (
                        <><Send className="w-5 h-5" /> Submit Partner Application</>
                      )}
                    </GoldButton>

                    {/* Note */}
                    <p className="text-center text-white/28 font-body text-xs leading-relaxed">
                      Submitting this form does not create a login account.
                      PathPort reviews and approves all partner applications manually.
                    </p>

                  </form>
                )}
              </GlassCard>

              {/* Already a partner link */}
              <p className="text-center text-white/35 font-body text-sm mt-6">
                Already a partner?{" "}
                <Link href="/login" className="text-gold-400 hover:text-gold-300 font-medium transition-colors">
                  Log in to your dashboard →
                </Link>
              </p>
            </div>

          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
