import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import InternshipPathway from "@/components/sections/InternshipPathway";
import ArrivalServices from "@/components/sections/ArrivalServices";
import GoldButton from "@/components/ui/GoldButton";
import GlassCard from "@/components/ui/GlassCard";
import Badge from "@/components/ui/Badge";
import SectionHeader from "@/components/ui/SectionHeader";
import {
  ArrowRight, FileCheck, MapPin, Plane, Shield,
  Clock, BookOpen, CheckCircle2, Smartphone,
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
  { step: "03", icon: "🪪", title: "Get Student Pass", desc: "PathPort guides your ICA Student Pass (IPA) process."     },
  { step: "04", icon: "🇸🇬", title: "Arrive & Study",  desc: "Airport pickup, accommodation, orientation — sorted."    },
];

// ─── What PathPort does for students ──────────────────────────────────────────
const STUDENT_SERVICES = [
  {
    icon: FileCheck,
    title: "Application Support",
    desc: "We prepare and submit your college application — documents, forms, and follow-up handled by your advisor.",
    badge: "Free",
  },
  {
    icon: Clock,
    title: "24-Hour Offer Letter",
    desc: "Conditional offer letters from Singapore private colleges typically issued within 24 hours of application.",
    badge: "Fast",
  },
  {
    icon: Shield,
    title: "IPA Tracking",
    desc: "In-Principle Approval (IPA) for your Student Pass tracked in real time. We notify you at every stage.",
    badge: "Tracked",
  },
  {
    icon: BookOpen,
    title: "Course Guidance",
    desc: "Compare Diploma, Advanced Diploma, Higher Diploma, and Specialist Diploma options across Singapore colleges.",
    badge: "Expert",
  },
  {
    icon: MapPin,
    title: "Arrival Concierge",
    desc: "Airport pickup, SIM card, student accommodation, bank account, and orientation — all arranged before you land.",
    badge: "End-to-end",
  },
  {
    icon: Smartphone,
    title: "Student Dashboard",
    desc: "Track your application status, documents, IPA letter, and intake date from your personalised PathPort dashboard.",
    badge: "Live",
  },
];

// ─── IPA process steps ────────────────────────────────────────────────────────
const IPA_STEPS = [
  { title: "Offer Letter Issued",        desc: "College issues conditional offer letter within 24 hours of application."                   },
  { title: "ICA Application Submitted",  desc: "PathPort submits your Student Pass application to ICA Singapore on your behalf."            },
  { title: "IPA Letter Received",        desc: "ICA issues the In-Principle Approval (IPA) letter — your entry permit to Singapore."        },
  { title: "Fly to Singapore",           desc: "Use your IPA letter to enter Singapore. Valid for a single entry within a specified period." },
  { title: "Student Pass Collected",     desc: "Collect your official Student Pass from ICA upon arrival in Singapore."                     },
];

// ─── Student images ───────────────────────────────────────────────────────────
const STUDENT_IMAGES = [
  {
    src: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=800&q=80",
    alt: "International students on campus",
    label: "Campus Life",
  },
  {
    src: "https://images.unsplash.com/photo-1543269865-cbf427effbad?auto=format&fit=crop&w=800&q=80",
    alt: "Students smiling together",
    label: "Student Community",
  },
  {
    src: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=800&q=80",
    alt: "Students collaborating with laptops",
    label: "Study Sessions",
  },
  {
    src: "https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?auto=format&fit=crop&w=800&q=80",
    alt: "Student studying in modern space",
    label: "Modern Campuses",
  },
];

export default function StudentsPage() {
  return (
    <>
      <Navbar />
      <main className="pt-[68px]">

        {/* ── Hero ─────────────────────────────────────────────────── */}
        <section className="relative py-24 md:py-32 overflow-hidden">
          <div aria-hidden className="absolute inset-0 bg-[linear-gradient(rgba(59,158,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(59,158,255,0.03)_1px,transparent_1px)] bg-[size:60px_60px] pointer-events-none" />
          <div aria-hidden className="absolute top-[20%] left-[10%] w-[500px] h-[500px] rounded-full bg-pathBlue-500/[0.06] blur-[130px] pointer-events-none" />
          <div aria-hidden className="absolute bottom-[10%] right-[5%] w-[400px] h-[400px] rounded-full bg-gold-400/[0.05] blur-[110px] pointer-events-none" />

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

              <p className="text-white/52 font-body text-xl leading-relaxed mb-10 max-w-2xl">
                Register free. Get your Singapore college <strong className="text-white/80">offer letter in 24 hours</strong>. Track your{" "}
                <strong className="text-white/80">IPA</strong>. Land in Singapore with{" "}
                <strong className="text-white/80">full arrival support</strong>.
              </p>

              <div className="flex flex-col sm:flex-row gap-3">
                <Link href="/signup">
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
            </div>
          </div>
        </section>

        {/* ── How it works — 4 steps ─────────────────────────────────── */}
        <section className="py-20 border-t border-white/[0.06]">
          <div className="max-w-7xl mx-auto px-5 md:px-10">
            <SectionHeader
              eyebrow="How It Works"
              title="From India to Singapore in 4 Steps"
              subtitle="PathPort guides every step — registration, offer letter, IPA, and arrival."
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {QUICK_STEPS.map((s, i) => (
                <div key={s.step} className="relative">
                  {i < QUICK_STEPS.length - 1 && (
                    <div aria-hidden className="hidden lg:block absolute top-8 left-full w-full h-px bg-gradient-to-r from-gold-400/30 to-transparent z-0" />
                  )}
                  <GlassCard className="p-6 relative z-10">
                    <div className="text-3xl mb-4">{s.icon}</div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-gold-400/50 font-body text-xs font-bold tracking-widest">{s.step}</span>
                    </div>
                    <h3 className="font-display text-xl text-white mb-2">{s.title}</h3>
                    <p className="text-white/48 font-body text-sm leading-relaxed">{s.desc}</p>
                  </GlassCard>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Student services grid ───────────────────────────────────── */}
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-5 md:px-10">
            <SectionHeader
              eyebrow="Student Services"
              title="Everything You Need — One Platform"
              subtitle="PathPort covers your entire journey from application to arrival and beyond."
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {STUDENT_SERVICES.map(({ icon: Icon, title, desc, badge }, i) => (
                <GlassCard key={title} gold={i === 2} className="p-7">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${i === 2 ? "bg-gradient-to-br from-gold-500 to-gold-600 shadow-gold-sm" : "bg-white/[0.07] border border-white/10"}`}>
                      <Icon className={`w-5 h-5 ${i === 2 ? "text-navy-900" : "text-gold-400"}`} strokeWidth={1.75} />
                    </div>
                    <Badge variant={i === 2 ? "gold" : "navy"}>{badge}</Badge>
                  </div>
                  <h3 className="font-body font-semibold text-white text-base mb-2">{title}</h3>
                  <p className="text-white/48 font-body text-sm leading-relaxed">{desc}</p>
                </GlassCard>
              ))}
            </div>
          </div>
        </section>

        {/* ── 6+6 Pathway ─────────────────────────────────────────────── */}
        <InternshipPathway />

        {/* ── IPA Tracking section ────────────────────────────────────── */}
        <section className="py-20 bg-gradient-to-b from-transparent via-navy-800/25 to-transparent">
          <div className="max-w-7xl mx-auto px-5 md:px-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <p className="inline-flex items-center gap-3 text-gold-400 font-body text-xs font-semibold tracking-[0.22em] uppercase mb-5">
                  <span className="w-8 h-px bg-gold-400/50 rounded-full" />
                  IPA Tracking
                </p>
                <h2 className="font-display text-4xl md:text-5xl text-white mb-5 leading-[1.08]">
                  Your Student Pass,{" "}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold-400 to-gold-300">
                    Tracked Live
                  </span>
                </h2>
                <p className="text-white/50 font-body text-lg leading-relaxed mb-8">
                  The IPA (In-Principle Approval) letter is your official permission to enter Singapore as a student. PathPort tracks every stage and notifies you immediately — no chasing, no uncertainty.
                </p>
                <Link href="/signup">
                  <GoldButton variant="solid-gold" size="md">Start My Application</GoldButton>
                </Link>
              </div>

              <div className="space-y-3">
                {IPA_STEPS.map((step, i) => (
                  <div key={step.title} className={`flex items-start gap-4 p-4 rounded-xl border transition-all ${i === 2 ? "bg-gold-400/[0.07] border-gold-400/25" : "bg-white/[0.03] border-white/[0.07]"}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-body font-bold text-xs border ${i === 2 ? "bg-gold-500 border-gold-400 text-navy-900" : "bg-white/[0.07] border-white/15 text-white/55"}`}>
                      {i < 2 ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : i + 1}
                    </div>
                    <div>
                      <p className={`font-body font-semibold text-sm mb-0.5 ${i === 2 ? "text-gold-300" : "text-white/85"}`}>{step.title}</p>
                      <p className="text-white/42 font-body text-xs leading-relaxed">{step.desc}</p>
                    </div>
                    {i === 2 && (
                      <span className="ml-auto flex-shrink-0 text-[10px] font-semibold tracking-wider text-gold-400 bg-gold-400/15 border border-gold-400/30 rounded-full px-2.5 py-1 self-start">
                        ACTIVE
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Arrival Services ─────────────────────────────────────────── */}
        <ArrivalServices />

        {/* ── Student visuals ──────────────────────────────────────────── */}
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-5 md:px-10">
            <SectionHeader
              eyebrow="Student Life"
              title="Life as an Indian Student in Singapore"
              subtitle="A vibrant community, modern campuses, and a city that feels like home — 5 hours from India."
            />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {STUDENT_IMAGES.map((img, i) => (
                <div key={img.src} className={`relative rounded-2xl overflow-hidden border border-white/[0.08] ${i === 0 ? "md:col-span-2 md:row-span-2" : ""}`} style={{ aspectRatio: i === 0 ? "1/1" : "4/3" }}>
                  <img src={img.src} alt={img.alt} loading="lazy" className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-navy-900/70 to-transparent" />
                  <span className="absolute bottom-3 left-4 font-body text-sm font-semibold text-white/90">{img.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Final CTA ────────────────────────────────────────────────── */}
        <section className="py-28 relative overflow-hidden">
          <div aria-hidden className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-gold-400/[0.06] blur-[140px] pointer-events-none" />
          <div className="relative max-w-3xl mx-auto px-5 md:px-10 text-center">
            <h2 className="font-display text-5xl text-white mb-5">Ready to Apply?</h2>
            <p className="text-white/48 font-body text-xl mb-10 leading-relaxed">
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
