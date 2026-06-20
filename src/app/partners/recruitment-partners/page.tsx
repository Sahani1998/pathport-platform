// /partners/recruitment-partners — light public theme (Sprint 30.1 PR-F).
// Dark hero + dark CTA bookend a light body. B2B partner audience.

import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import GoldButton from "@/components/ui/GoldButton";
import Reveal from "@/components/ui/Reveal";
import { ArrowRight, CheckCircle2, Users, DollarSign, FileText, BarChart2 } from "lucide-react";

export const metadata: Metadata = {
  title: "Recruitment Partners | PathPort Partners",
  description: "Join PathPort as a Recruitment Partner. Refer Indian students to Singapore diploma programmes, track applications, and earn commissions.",
};

const BENEFITS = [
  { Icon: Users,      title: "Student Referrals",     desc: "Refer Indian students to Singapore diploma programmes directly through your Partner Dashboard." },
  { Icon: FileText,   title: "Document Upload",       desc: "Upload student documents on behalf of your candidates. Track every application from your dashboard." },
  { Icon: BarChart2,  title: "Application Tracking",  desc: "Monitor the real-time status of every student you've referred — offer letter, IPA, arrival, and enrolment." },
  { Icon: DollarSign, title: "Commission Tracking",   desc: "View your commission earnings, pending payouts, and performance history in one transparent dashboard." },
];

const HOW_IT_WORKS = [
  { step: "1", title: "Apply to Partner", desc: "Submit your consultant profile and area of operation for PathPort review and approval." },
  { step: "2", title: "Get Approved",      desc: "PathPort reviews and approves your partnership. You receive dashboard access and your referral code." },
  { step: "3", title: "Refer & Earn",      desc: "Refer qualified students, track their applications, and earn commission on every successful enrolment." },
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
      <main>

        {/* Dark hero */}
        <section className="relative w-full min-h-[72vh] overflow-hidden bg-[#06142E]">
          <div aria-hidden className="absolute inset-0">
            <Image
              src="https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=2400&q=80"
              alt=""
              fill
              sizes="100vw"
              priority
              className="object-cover object-center"
              unoptimized
            />
            <div className="absolute inset-0 bg-gradient-to-b from-navy-900/85 via-navy-900/65 to-navy-900/90" />
            <div className="absolute inset-0 bg-gradient-to-r from-navy-900/70 via-transparent to-transparent" />
          </div>

          <div className="relative layout-shell pt-[120px] pb-20 lg:pt-[140px] lg:pb-28 min-h-[72vh] flex items-center">
            <div className="max-w-3xl">
              <span className="inline-flex items-center px-3 py-1 rounded-full bg-gold-400/15 border border-gold-400/30 text-gold-300 font-body text-xs font-semibold tracking-wide mb-6">
                🤝 For Recruitment Partners
              </span>
              <h1 className="display-2 text-white mb-6">
                Become a PathPort{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold-400 to-gold-300">
                  Recruitment Partner
                </span>
              </h1>
              <p className="lead text-white/75 mb-10 max-w-2xl">
                Refer Indian students to Singapore diploma programmes, track every application in real time, and earn transparent commissions — all managed through your dedicated Partner Dashboard.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link href="/login?role=partner">
                  <GoldButton variant="solid-gold" size="lg">Recruitment Partner Login</GoldButton>
                </Link>
                <Link href="/partner-with-us?type=partner">
                  <GoldButton variant="outline-gold" size="lg" className="group">
                    Apply to Partner With Us
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </GoldButton>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Benefits — white */}
        <section className="public-section-white">
          <div className="layout-shell section-airy">
            <Reveal className="text-center mb-12">
              <p className="eyebrow text-gold-700 mb-4">Why Partner</p>
              <h2 className="display-3 text-navy-900">What recruitment partners get.</h2>
            </Reveal>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {BENEFITS.map(({ Icon, title, desc }, i) => (
                <Reveal key={title} delay={i * 70} className="h-full">
                  <div className={`p-6 rounded-2.5xl public-card public-card-hover h-full ${i === 3 ? "ring-1 ring-gold-400/45" : ""}`}>
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 ${i === 3 ? "bg-gradient-to-br from-gold-500 to-gold-600 shadow-gold-sm text-white" : "bg-pathBlue-500/10 border border-pathBlue-500/25 text-pathBlue-700"}`}>
                      <Icon className="w-5 h-5" strokeWidth={1.75} />
                    </div>
                    <h3 className="font-body font-semibold text-navy-900 text-base mb-2">{title}</h3>
                    <p className="text-navy-800/60 font-body text-sm leading-relaxed">{desc}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* How it works — soft-blue */}
        <section className="public-section-blue">
          <div className="layout-shell section-airy">
            <Reveal className="text-center mb-12">
              <p className="eyebrow text-gold-700 mb-4">Process</p>
              <h2 className="display-3 text-navy-900">How the partnership works.</h2>
            </Reveal>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-4xl mx-auto">
              {HOW_IT_WORKS.map(({ step, title, desc }, i) => (
                <Reveal key={step} delay={i * 80} className="h-full">
                  <div className="relative h-full">
                    {i < 2 && <div aria-hidden className="hidden md:block absolute top-9 left-full w-full h-px bg-gradient-to-r from-gold-500/40 to-transparent" />}
                    <div className="p-7 rounded-2.5xl public-card public-card-hover h-full text-center relative z-10">
                      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-gold-500 to-gold-600 flex items-center justify-center mx-auto mb-5 font-display font-bold text-white text-xl shadow-gold-sm">
                        {step}
                      </div>
                      <h3 className="font-display text-xl text-navy-900 mb-2">{title}</h3>
                      <p className="text-navy-800/60 font-body text-sm leading-relaxed">{desc}</p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* Features list — cream rest beat */}
        <section className="cream-band">
          <div className="layout-prose px-5 sm:px-8 section-airy">
            <div className="text-center mb-10">
              <p className="eyebrow text-gold-700 mb-4">Platform Features</p>
              <h2 className="display-3 text-navy-900">Your Partner Dashboard includes.</h2>
            </div>
            <div className="warm-panel-card rounded-3xl p-7 md:p-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {FEATURES.map(f => (
                  <div key={f} className="flex items-center gap-2.5 text-navy-800/75 font-body text-sm">
                    <CheckCircle2 className="w-4 h-4 text-gold-700 flex-shrink-0" />
                    {f}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Dark CTA bookend */}
        <section className="py-24 relative overflow-hidden bg-[#06142E]">
          <div aria-hidden className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-gold-400/[0.06] blur-[130px] pointer-events-none" />
          <div className="relative layout-shell section-medium text-center">
            <h2 className="display-2 text-white mb-4">Already a recruitment partner?</h2>
            <p className="lead text-white/75 mb-8">Log in to refer students, upload documents, and track your commissions.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/login?role=partner">
                <GoldButton variant="solid-gold" size="lg">Recruitment Partner Login</GoldButton>
              </Link>
              <Link href="/partner-with-us?type=partner">
                <GoldButton variant="outline-gold" size="lg">Apply to Partner With Us</GoldButton>
              </Link>
            </div>
            <p className="text-white/40 font-body text-sm mt-6">
              All recruitment partnerships are approved manually by the PathPort team.<br />
              Contact: <span className="text-gold-400">pathportsg@gmail.com</span>
            </p>
          </div>
        </section>

      </main>
      <Footer />
    </>
  );
}
