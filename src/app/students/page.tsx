// /students — student-focused landing page. Light public theme (Sprint 30.1 PR-E)
// for the body, with a dark hero + interest-form intro for visual emphasis on
// the conversion path. Final CTA stays dark to bookend the page.
//
// Imports the homepage's StudyEarnGraduate (already light) for the 6+6 pathway.
// Uses the new reusable PhotoBand for rest beats between content sections.

import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import StudyEarnGraduate from "@/components/sections/StudyEarnGraduate";
import StudentInterestForm from "@/components/sections/StudentInterestForm";
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

// ─── Arrival services (light, inlined — replaces the dark ArrivalServices section) ──
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

      {/* Dark hero + interest form intro — bookends the page on the dark
         conversion path, matching the homepage Hero pattern. */}
      <section className="relative pt-[68px] bg-[#06142E]">
        <div className="relative py-24 md:py-32 overflow-hidden">
          <div aria-hidden className="absolute inset-0 bg-[linear-gradient(rgba(59,158,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(59,158,255,0.03)_1px,transparent_1px)] bg-[size:60px_60px] pointer-events-none" />
          <div aria-hidden className="absolute top-[20%] left-[10%] w-[500px] h-[500px] rounded-full bg-pathBlue-500/[0.10] blur-[130px] pointer-events-none" />
          <div aria-hidden className="absolute bottom-[10%] right-[5%] w-[400px] h-[400px] rounded-full bg-gold-400/[0.06] blur-[110px] pointer-events-none" />

          <div className="max-w-7xl mx-auto px-5 md:px-10">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 bg-pathBlue-500/10 border border-pathBlue-500/25 rounded-full px-4 py-2 mb-8">
                <span className="w-2 h-2 rounded-full bg-pathBlue-400 animate-pulse" />
                <span className="text-pathBlue-300 font-body text-sm font-medium tracking-wider">
                  🎓 For Indian Students — Singapore Diploma Platform
                </span>
              </div>

              <h1 className="font-display text-5xl sm:text-6xl lg:text-[4rem] text-white leading-[1.05] mb-6">
                Your Journey to{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold-400 via-gold-300 to-gold-400">
                  Singapore
                </span>{" "}
                Starts Here
              </h1>

              <p className="text-white/55 font-body text-xl leading-relaxed mb-10 max-w-2xl">
                Register free. Get your Singapore college <strong className="text-white/85">offer letter in 24 hours</strong>. Track your{" "}
                <strong className="text-white/85">IPA</strong>. Land in Singapore with{" "}
                <strong className="text-white/85">full arrival support</strong>.
              </p>

              <div className="flex flex-col sm:flex-row gap-3">
                <a href="#apply">
                  <GoldButton variant="solid-gold" size="lg" className="group">
                    Start Your Singapore Journey
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </GoldButton>
                </a>
                <Link href="/login">
                  <GoldButton variant="outline-gold" size="lg">
                    Student Login
                  </GoldButton>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Interest form — kept dark to flow from the hero */}
        <section className="py-16 border-t border-white/[0.06]" id="apply">
          <div className="max-w-7xl mx-auto px-5 md:px-10">
            <div className="max-w-2xl mx-auto text-center mb-10">
              <span className="inline-block px-3 py-1 rounded-full bg-gold-400/10 border border-gold-400/25 text-gold-400 font-body text-xs font-semibold uppercase tracking-wider mb-4">
                Free — No Commitment
              </span>
              <h2 className="font-display text-3xl sm:text-4xl text-white mb-3">
                Register Your Interest
              </h2>
              <p className="text-white/55 font-body text-base">
                Fill this form and a PathPort advisor will call you within 24 hours to guide you through courses, fees, and the application process.
              </p>
            </div>
            <StudentInterestForm />
          </div>
        </section>
      </section>

      {/* Transition photo band — students on campus */}
      <PhotoBand
        src="https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=1800&q=75"
        alt="International students walking together on a Singapore campus"
        caption="Real students. Real campuses."
        height="md"
      />

      {/* Light body — sections below render on white */}

        {/* How it works — 4 steps */}
        <section className="public-section-white py-20">
          <div className="max-w-7xl mx-auto px-5 md:px-10">
            <Reveal className="text-center mb-12">
              <p className="text-gold-700 font-body text-xs font-semibold tracking-[0.22em] uppercase mb-4">
                How It Works
              </p>
              <h2 className="font-display text-3xl md:text-4xl text-navy-900 leading-[1.1] mb-3">
                From India to Singapore in 4 steps.
              </h2>
              <p className="text-navy-800/60 font-body text-base max-w-xl mx-auto">
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

        {/* Student services grid */}
        <section className="public-section-blue py-20">
          <div className="max-w-7xl mx-auto px-5 md:px-10">
            <Reveal className="text-center mb-12">
              <p className="text-gold-700 font-body text-xs font-semibold tracking-[0.22em] uppercase mb-4">
                Student Services
              </p>
              <h2 className="font-display text-3xl md:text-4xl text-navy-900 leading-[1.1] mb-3">
                Everything you need — one platform.
              </h2>
              <p className="text-navy-800/60 font-body text-base max-w-xl mx-auto">
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

        {/* 6+6 Pathway — already light from Sprint 30 PR-B */}
        <StudyEarnGraduate />

        {/* Photo band — graduation rest beat */}
        <PhotoBand
          src="https://images.unsplash.com/photo-1571260899304-425eee4c7efc?auto=format&fit=crop&w=1800&q=75"
          alt="Diploma graduate holding a certificate at a Singapore graduation ceremony"
          caption="Graduation day"
          height="md"
          captionPosition="right"
        />

        {/* IPA Tracking section */}
        <section className="public-section-white py-20">
          <div className="max-w-7xl mx-auto px-5 md:px-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <p className="inline-flex items-center gap-3 text-gold-700 font-body text-xs font-semibold tracking-[0.22em] uppercase mb-5">
                  <span className="w-8 h-px bg-gold-700/50 rounded-full" />
                  IPA Tracking
                </p>
                <h2 className="font-display text-4xl md:text-5xl text-navy-900 mb-5 leading-[1.08]">
                  Your Student Pass,{" "}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold-600 to-gold-500">
                    tracked live.
                  </span>
                </h2>
                <p className="text-navy-800/65 font-body text-lg leading-relaxed mb-8">
                  The IPA (In-Principle Approval) letter is your official permission to enter Singapore as a student. PathPort tracks every stage and notifies you immediately — no chasing, no uncertainty.
                </p>
                <Link href="/signup">
                  <GoldButton variant="solid-gold" size="md">Start My Application</GoldButton>
                </Link>
              </div>

              <div className="space-y-3">
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
            </div>
          </div>
        </section>

        {/* Arrival Services — light, inlined (replaces dark ArrivalServices section) */}
        <section className="public-section-blue py-20">
          <div className="max-w-7xl mx-auto px-5 md:px-10">
            <Reveal className="text-center mb-12">
              <p className="text-gold-700 font-body text-xs font-semibold tracking-[0.22em] uppercase mb-4">
                Arrival Services
              </p>
              <h2 className="font-display text-3xl md:text-4xl text-navy-900 leading-[1.1] mb-3">
                Sorted before you land.
              </h2>
              <p className="text-navy-800/60 font-body text-base max-w-xl mx-auto">
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

        {/* Final CTA — dark for emphasis (matches homepage / colleges / courses pattern) */}
        <section className="py-24 relative overflow-hidden bg-[#06142E]">
          <div aria-hidden className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-gold-400/[0.06] blur-[140px] pointer-events-none" />
          <div className="relative max-w-3xl mx-auto px-5 md:px-10 text-center">
            <h2 className="font-display text-5xl text-white mb-5 leading-[1.08]">
              Ready to{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold-400 to-gold-300">
                apply?
              </span>
            </h2>
            <p className="text-white/55 font-body text-xl mb-10 leading-relaxed">
              Registration is free. Your advisor will call within 24 hours. Courses from <strong className="text-gold-400">SGD 4,000/year</strong>.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/signup">
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
