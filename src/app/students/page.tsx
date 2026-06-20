// /students — student-focused landing page (Sprint 30 redo PR-I).
// Full-bleed photo hero with overlaid callback form → light editorial body
// (how-it-works, services, 6+6 pathway, IPA story split, arrival services) →
// dark CTA bookend. Uses the shared editorial type/layout tokens and PhotoBand
// rest beats between content sections.

import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import StudentsHeroImmersive from "@/components/students/StudentsHeroImmersive";
import StudyEarnGraduate from "@/components/sections/StudyEarnGraduate";
import GoldButton from "@/components/ui/GoldButton";
import PhotoBand from "@/components/ui/PhotoBand";
import Reveal from "@/components/ui/Reveal";
import {
  ArrowRight, FileCheck, MapPin, Plane, Shield, Clock, BookOpen,
  CheckCircle2, Smartphone, Bell, Wifi, CreditCard, KeyRound, Heart,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Students | PathPort — Study in Singapore from India",
  description:
    "Register as a student, explore Singapore diploma programmes, track your offer letter and IPA, and get full arrival support — all through PathPort.",
};

// ─── Quick steps ──────────────────────────────────────────────────────────────
const QUICK_STEPS = [
  { step: "01", icon: "📋", title: "Register Free",    desc: "Fill your interest form. Advisor calls within 24 hours." },
  { step: "02", icon: "📩", title: "Get Offer Letter", desc: "We submit your application. Offer letter in 24 hours."    },
  { step: "03", icon: "🪪", title: "Track Student Pass", desc: "Your college submits the Student Pass / IPA to ICA. PathPort tracks status." },
  { step: "04", icon: "🇸🇬", title: "Arrive & Study",  desc: "Airport pickup, accommodation, orientation — sorted."    },
];

// ─── Student services ─────────────────────────────────────────────────────────
const STUDENT_SERVICES = [
  { icon: FileCheck, title: "Application Support",     desc: "We prepare and submit your college application — documents, forms, and follow-up handled by your advisor.",       badge: "Free" },
  { icon: Clock,      title: "24-Hour Offer Letter",    desc: "Conditional offer letters from Singapore private colleges typically issued within 24 hours of application.",        badge: "Fast" },
  { icon: Shield,     title: "IPA Tracking",            desc: "Your college submits the In-Principle Approval (IPA) to ICA. PathPort tracks status in real time and notifies you.", badge: "Tracked" },
  { icon: BookOpen,   title: "Course Guidance",         desc: "Compare Diploma, Advanced Diploma, Higher Diploma, and Specialist Diploma options across Singapore colleges.",       badge: "Expert" },
  { icon: MapPin,     title: "Arrival Concierge",       desc: "Airport pickup, SIM card, student accommodation, bank account, and orientation — all arranged before you land.",     badge: "End-to-end" },
  { icon: Smartphone, title: "Student Dashboard",       desc: "Track your application status, documents, IPA letter, and intake date from your personalised PathPort dashboard.",   badge: "Live" },
];

// ─── IPA process steps ────────────────────────────────────────────────────────
const IPA_STEPS = [
  { title: "Offer Letter Issued",       desc: "College issues conditional offer letter within 24 hours of application." },
  { title: "IPA Submitted by College",  desc: "Your enrolled college submits your Student Pass / IPA application to ICA Singapore. PathPort tracks the status and keeps you updated." },
  { title: "IPA Letter Received",       desc: "ICA issues the In-Principle Approval (IPA) letter — your entry permit to Singapore." },
  { title: "Fly to Singapore",          desc: "Use your IPA letter to enter Singapore. Valid for a single entry within a specified period." },
  { title: "Student Pass Collected",    desc: "Collect your official Student Pass from ICA upon arrival in Singapore." },
];

// ─── Arrival services ──────────────────────────────────────────────────────────
const ARRIVAL_SERVICES = [
  { Icon: Plane,      title: "Airport Pickup",         desc: "A PathPort representative meets you at Changi and walks you through everything from baggage to your first taxi." },
  { Icon: KeyRound,   title: "Student Accommodation",  desc: "Hostels and student-friendly HDB rentals booked ahead of time. Move-in ready when you land." },
  { Icon: Wifi,       title: "SIM Card & Connectivity", desc: "Local SIM activated on arrival so you can call home and use Maps from minute one." },
  { Icon: CreditCard, title: "Bank Account Setup",     desc: "Walk-through of Singapore bank account opening on a Student Pass with the right paperwork." },
  { Icon: Heart,      title: "Health Insurance",       desc: "Help with the mandatory medical insurance setup most colleges require before semester start." },
  { Icon: Bell,       title: "Orientation Briefing",   desc: "Practical onboarding — MRT, food, key apps, study spots, and how to settle in fast." },
];

export default function StudentsPage() {
  return (
    <>
      <Navbar />
      <main>

        {/* 1 · Full-bleed photo hero + overlaid callback form */}
        <StudentsHeroImmersive />

        {/* Transition photo band — students on campus */}
        <PhotoBand
          src="https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=1800&q=75"
          alt="International students walking together on a Singapore campus"
          caption="Real students. Real campuses."
          height="md"
        />

        {/* 2 · How it works — 4 steps */}
        <section className="public-section-white">
          <div className="layout-shell section-airy">
            <Reveal className="text-center mb-12">
              <p className="eyebrow text-gold-700 mb-4">How It Works</p>
              <h2 className="display-3 text-navy-900 mb-4">
                From India to Singapore in 4 steps.
              </h2>
              <p className="prose-lg text-navy-800/60 max-w-xl mx-auto">
                PathPort guides every step — registration, offer letter, IPA, and arrival.
              </p>
            </Reveal>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {QUICK_STEPS.map((s, i) => (
                <Reveal key={s.step} delay={i * 80} className="h-full">
                  <div className="relative h-full">
                    {i < QUICK_STEPS.length - 1 && (
                      <div aria-hidden className="hidden lg:block absolute top-9 left-full w-full h-px bg-gradient-to-r from-gold-500/40 to-transparent z-0" />
                    )}
                    <div className="p-6 rounded-2.5xl public-card public-card-hover h-full relative z-10">
                      <div className="text-3xl mb-4">{s.icon}</div>
                      <span className="font-body text-gold-700 text-xs font-bold tracking-widest">{s.step}</span>
                      <h3 className="font-display text-xl text-navy-900 mt-1 mb-2">{s.title}</h3>
                      <p className="text-navy-800/60 font-body text-sm leading-relaxed">{s.desc}</p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* 3 · Student services grid */}
        <section className="public-section-blue">
          <div className="layout-shell section-airy">
            <Reveal className="text-center mb-12">
              <p className="eyebrow text-gold-700 mb-4">Student Services</p>
              <h2 className="display-3 text-navy-900 mb-4">
                Everything you need — one platform.
              </h2>
              <p className="prose-lg text-navy-800/60 max-w-xl mx-auto">
                PathPort covers your entire journey from application to arrival and beyond.
              </p>
            </Reveal>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {STUDENT_SERVICES.map(({ icon: Icon, title, desc, badge }, i) => (
                <Reveal key={title} delay={i * 60} className="h-full">
                  <div className={`p-7 rounded-2.5xl public-card public-card-hover h-full ${i === 2 ? "ring-1 ring-gold-400/45" : ""}`}>
                    <div className="flex items-start justify-between mb-4">
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${i === 2 ? "bg-gradient-to-br from-gold-500 to-gold-600 shadow-gold-sm" : "bg-pathBlue-500/10 border border-pathBlue-500/25 text-pathBlue-700"}`}>
                        <Icon className={`w-5 h-5 ${i === 2 ? "text-white" : ""}`} strokeWidth={1.75} />
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full font-body text-xs font-semibold tracking-wide leading-none border ${
                        i === 2
                          ? "bg-gold-400/15 text-gold-700 border-gold-400/40"
                          : "bg-pathBlue-500/10 text-pathBlue-700 border-pathBlue-500/25"
                      }`}>
                        {badge}
                      </span>
                    </div>
                    <h3 className="font-body font-semibold text-navy-900 text-base mb-2">{title}</h3>
                    <p className="text-navy-800/60 font-body text-sm leading-relaxed">{desc}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* 4 · 6+6 Pathway */}
        <StudyEarnGraduate />

        {/* Photo band — graduation rest beat */}
        <PhotoBand
          src="https://images.unsplash.com/photo-1571260899304-425eee4c7efc?auto=format&fit=crop&w=1800&q=75"
          alt="Diploma graduate holding a certificate at a Singapore graduation ceremony"
          caption="Graduation day"
          height="md"
          captionPosition="right"
        />

        {/* 5 · IPA Tracking — editorial story split (photo + step list) */}
        <section className="public-section-white">
          <div className="layout-shell section-airy">
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.1fr] gap-12 lg:gap-16 items-center">

              {/* Photo */}
              <Reveal className="relative order-last lg:order-first">
                <div className="relative aspect-[4/5] rounded-3xl overflow-hidden shadow-[0_30px_70px_-25px_rgba(10,17,34,0.35)]">
                  <Image
                    src="https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=1400&q=80"
                    alt="A student boarding a flight to Singapore with their IPA letter approved"
                    fill
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    className="object-cover"
                    unoptimized
                  />
                  <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-navy-900/15 via-transparent to-transparent" />
                </div>
                {/* Floating caption chip */}
                <div className="absolute -bottom-5 left-6 sm:-left-6 bg-white rounded-2xl px-5 py-3 shadow-[0_12px_30px_-10px_rgba(10,17,34,0.25)] border border-gold-200/60">
                  <p className="font-body text-navy-800/55 text-[10px] uppercase tracking-[0.15em] font-semibold">Status, in real time</p>
                  <p className="font-display text-base text-navy-900 leading-tight mt-0.5">No chasing. No guessing.</p>
                </div>
              </Reveal>

              {/* Content */}
              <Reveal delay={120}>
                <p className="eyebrow text-gold-700 mb-5">IPA Tracking</p>
                <h2 className="display-3 text-navy-900 mb-6">
                  Your Student Pass,{" "}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold-600 to-gold-500">
                    tracked live.
                  </span>
                </h2>
                <p className="prose-lg text-navy-800/65 mb-8">
                  The IPA (In-Principle Approval) letter is your official permission to enter Singapore as a student. PathPort tracks every stage and notifies you immediately — no chasing, no uncertainty.
                </p>

                <div className="space-y-3 mb-8">
                  {IPA_STEPS.map((step, i) => (
                    <div
                      key={step.title}
                      className={`flex items-start gap-4 p-4 rounded-2xl border transition-all ${
                        i === 2
                          ? "bg-gold-400/[0.10] border-gold-400/35"
                          : "bg-white border-slate-200"
                      }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-body font-bold text-xs border ${
                          i === 2
                            ? "bg-gold-500 border-gold-400 text-white"
                            : "bg-pathBlue-500/10 border-pathBlue-500/25 text-pathBlue-700"
                        }`}
                      >
                        {i < 2 ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : i + 1}
                      </div>
                      <div>
                        <p className={`font-body font-semibold text-sm mb-0.5 ${i === 2 ? "text-gold-700" : "text-navy-900"}`}>{step.title}</p>
                        <p className="text-navy-800/60 font-body text-xs leading-relaxed">{step.desc}</p>
                      </div>
                      {i === 2 && (
                        <span className="ml-auto flex-shrink-0 text-[10px] font-semibold tracking-wider text-gold-700 bg-gold-400/15 border border-gold-400/40 rounded-full px-2.5 py-1 self-start">
                          ACTIVE
                        </span>
                      )}
                    </div>
                  ))}
                </div>

                <Link href="/signup?role=student">
                  <GoldButton variant="solid-gold" size="md">Start My Application</GoldButton>
                </Link>
              </Reveal>
            </div>
          </div>
        </section>

        {/* 6 · Arrival Services */}
        <section className="public-section-blue">
          <div className="layout-shell section-airy">
            <Reveal className="text-center mb-12">
              <p className="eyebrow text-gold-700 mb-4">Arrival Services</p>
              <h2 className="display-3 text-navy-900 mb-4">
                Sorted before you land.
              </h2>
              <p className="prose-lg text-navy-800/60 max-w-xl mx-auto">
                PathPort&rsquo;s arrival concierge handles the practical first-week essentials so you can focus on settling in.
              </p>
            </Reveal>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {ARRIVAL_SERVICES.map(({ Icon, title, desc }, i) => (
                <Reveal key={title} delay={i * 60} className="h-full">
                  <div className="h-full p-6 rounded-2.5xl public-card public-card-hover">
                    <div className="w-11 h-11 rounded-xl bg-pathBlue-500/10 border border-pathBlue-500/25 text-pathBlue-700 flex items-center justify-center mb-4">
                      <Icon className="w-5 h-5" strokeWidth={1.75} />
                    </div>
                    <h3 className="font-body font-semibold text-navy-900 text-base mb-2 leading-snug">{title}</h3>
                    <p className="text-navy-800/60 font-body text-sm leading-relaxed">{desc}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* 7 · Final CTA — dark bookend */}
        <section className="relative overflow-hidden bg-[#06142E]">
          <div aria-hidden className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-gold-400/[0.06] blur-[140px] pointer-events-none" />
          <div className="relative layout-shell section-medium text-center">
            <h2 className="display-2 text-white mb-5">
              Ready to{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold-400 to-gold-300">
                apply?
              </span>
            </h2>
            <p className="lead text-white/55 mb-10 max-w-xl mx-auto">
              Registration is free. Your advisor will call within 24 hours. Courses from <strong className="text-gold-400">SGD 4,000/year</strong>.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/signup?role=student">
                <GoldButton variant="solid-gold" size="lg" className="group">
                  Register as Student — Free
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </GoldButton>
              </Link>
              <a href="https://wa.me/6583776492" target="_blank" rel="noopener noreferrer">
                <GoldButton variant="outline-gold" size="lg">💬 WhatsApp +65 8377 6492</GoldButton>
              </a>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
