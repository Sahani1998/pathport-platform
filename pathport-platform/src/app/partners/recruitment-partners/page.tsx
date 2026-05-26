import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import GoldButton from "@/components/ui/GoldButton";
import GlassCard from "@/components/ui/GlassCard";
import SectionHeader from "@/components/ui/SectionHeader";
import Badge from "@/components/ui/Badge";
import { ArrowRight, CheckCircle2, Users, DollarSign, FileText, BarChart2 } from "lucide-react";

export const metadata: Metadata = {
  title: "Recruitment Partners | PathPort Partners",
  description: "Join PathPort as a Recruitment Partner. Refer Indian students to Singapore diploma programmes, track applications, and earn commissions.",
};

const BENEFITS = [
  {
    icon: Users,
    title: "Student Referrals",
    desc: "Refer Indian students to Singapore diploma programmes directly through your Partner Dashboard.",
  },
  {
    icon: FileText,
    title: "Document Upload",
    desc: "Upload student documents on behalf of your candidates. Track every application from your dashboard.",
  },
  {
    icon: BarChart2,
    title: "Application Tracking",
    desc: "Monitor the real-time status of every student you've referred — offer letter, IPA, arrival, and enrolment.",
  },
  {
    icon: DollarSign,
    title: "Commission Tracking",
    desc: "View your commission earnings, pending payouts, and performance history in one transparent dashboard.",
  },
];

const HOW_IT_WORKS = [
  { step: "1", title: "Apply to Partner",  desc: "Submit your consultant profile and area of operation for PathPort review and approval." },
  { step: "2", title: "Get Approved",       desc: "PathPort reviews and approves your partnership. You receive dashboard access and your referral code." },
  { step: "3", title: "Refer & Earn",       desc: "Refer qualified students, track their applications, and earn commission on every successful enrolment." },
];

const FEATURES = [
  "Dedicated Recruitment Partner Dashboard",
  "Student referral submission portal",
  "Document upload on behalf of students",
  "Real-time application status tracking",
  "Offer letter and IPA notifications",
  "Commission earnings tracker",
  "Monthly payout reports",
  "Dedicated PathPort partner support",
];

export default function RecruitmentPartnersPage() {
  return (
    <>
      <Navbar />
      <main className="pt-[68px]">

        {/* ── Hero ─────────────────────────────────────────────────── */}
        <section className="relative py-24 overflow-hidden">
          <div aria-hidden className="absolute top-[20%] left-[10%] w-[400px] h-[400px] rounded-full bg-gold-400/[0.06] blur-[120px] pointer-events-none" />
          <div aria-hidden className="absolute bottom-[10%] right-[5%] w-[350px] h-[350px] rounded-full bg-pathBlue-500/[0.05] blur-[110px] pointer-events-none" />

          <div className="max-w-7xl mx-auto px-5 md:px-10">
            <div className="max-w-3xl">
              <Badge variant="gold" className="mb-6 text-sm px-4 py-1.5">🤝 For Recruitment Partners</Badge>
              <h1 className="font-display text-5xl md:text-[3.8rem] text-white leading-[1.06] mb-6">
                Become a PathPort{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold-400 to-gold-300">
                  Recruitment Partner
                </span>
              </h1>
              <p className="text-white/52 font-body text-xl leading-relaxed mb-10 max-w-2xl">
                Refer Indian students to Singapore diploma programmes, track every application in real time, and earn transparent commissions — all managed through your dedicated Partner Dashboard.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link href="/login">
                  <GoldButton variant="solid-gold" size="lg">Recruitment Partner Login</GoldButton>
                </Link>
                <a href="mailto:pathpportsg@gmail.com?subject=Recruitment Partner Application">
                  <GoldButton variant="outline-gold" size="lg" className="group">
                    Apply to Partner With Us
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </GoldButton>
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* ── Benefits ─────────────────────────────────────────────── */}
        <section className="py-20 border-t border-white/[0.06]">
          <div className="max-w-7xl mx-auto px-5 md:px-10">
            <SectionHeader eyebrow="Why Partner" title="What Recruitment Partners Get" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {BENEFITS.map(({ icon: Icon, title, desc }, i) => (
                <GlassCard key={title} gold={i === 3} className="p-6">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 ${i === 3 ? "bg-gradient-to-br from-gold-500 to-gold-600 shadow-gold-sm" : "bg-white/[0.07] border border-white/10"}`}>
                    <Icon className={`w-5 h-5 ${i === 3 ? "text-navy-900" : "text-gold-400"}`} strokeWidth={1.75} />
                  </div>
                  <h3 className="font-body font-semibold text-white text-base mb-2">{title}</h3>
                  <p className="text-white/48 font-body text-sm leading-relaxed">{desc}</p>
                </GlassCard>
              ))}
            </div>
          </div>
        </section>

        {/* ── How it works ─────────────────────────────────────────── */}
        <section className="py-20 bg-gradient-to-b from-transparent via-navy-800/25 to-transparent">
          <div className="max-w-7xl mx-auto px-5 md:px-10">
            <SectionHeader eyebrow="Process" title="How the Partnership Works" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-4xl mx-auto">
              {HOW_IT_WORKS.map(({ step, title, desc }, i) => (
                <div key={step} className="relative">
                  {i < 2 && <div aria-hidden className="hidden md:block absolute top-8 left-full w-full h-px bg-gradient-to-r from-gold-400/30 to-transparent" />}
                  <GlassCard className="p-7 text-center relative z-10">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-gold-500 to-gold-600 flex items-center justify-center mx-auto mb-5 font-display font-bold text-navy-900 text-xl shadow-gold-sm">
                      {step}
                    </div>
                    <h3 className="font-display text-xl text-white mb-2">{title}</h3>
                    <p className="text-white/48 font-body text-sm leading-relaxed">{desc}</p>
                  </GlassCard>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Features list ─────────────────────────────────────────── */}
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-5 md:px-10">
            <div className="max-w-3xl mx-auto">
              <SectionHeader eyebrow="Platform Features" title="Your Partner Dashboard Includes" />
              <GlassCard gold className="p-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {FEATURES.map(f => (
                    <div key={f} className="flex items-center gap-2.5 text-white/65 font-body text-sm">
                      <CheckCircle2 className="w-4 h-4 text-gold-400 flex-shrink-0" />
                      {f}
                    </div>
                  ))}
                </div>
              </GlassCard>
            </div>
          </div>
        </section>

        {/* ── CTA ──────────────────────────────────────────────────── */}
        <section className="py-24 relative overflow-hidden">
          <div aria-hidden className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-gold-400/[0.06] blur-[130px] pointer-events-none" />
          <div className="relative max-w-3xl mx-auto px-5 md:px-10 text-center">
            <h2 className="font-display text-4xl text-white mb-4">Already a Recruitment Partner?</h2>
            <p className="text-white/45 font-body text-lg mb-8">Log in to refer students, upload documents, and track your commissions.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/login">
                <GoldButton variant="solid-gold" size="lg">Recruitment Partner Login</GoldButton>
              </Link>
              <a href="mailto:pathpportsg@gmail.com?subject=New Recruitment Partner Application">
                <GoldButton variant="outline-gold" size="lg">Apply to Partner With Us</GoldButton>
              </a>
            </div>
            <p className="text-white/28 font-body text-sm mt-6">
              All recruitment partnerships are approved manually by the PathPort team.<br />
              Contact: <span className="text-gold-400">pathpportsg@gmail.com</span>
            </p>
          </div>
        </section>

      </main>
      <Footer />
    </>
  );
}
