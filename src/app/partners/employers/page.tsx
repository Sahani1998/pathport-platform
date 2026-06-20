// /partners/employers — light public theme (Sprint 30.1 PR-F).
// Dark hero + dark CTA bookend a light body. Includes the 6+6 pathway
// explainer specific to employers.

import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import GoldButton from "@/components/ui/GoldButton";
import Reveal from "@/components/ui/Reveal";
import { ArrowRight, CheckCircle2, Users, Shield, Briefcase, ClipboardList } from "lucide-react";

export const metadata: Metadata = {
  title: "Employers | PathPort Partners",
  description: "Hire verified, internship-ready Singapore diploma students through PathPort's 6+6 pathway. Post internship roles, verify Internship IDs, and manage your intern pipeline.",
};

const BENEFITS = [
  { Icon: Shield,        title: "Verified Students",      desc: "Every PathPort intern has a verified Internship ID — confirming enrolment, course, and eligibility to work in Singapore." },
  { Icon: Users,         title: "Pre-Trained Candidates", desc: "6+6 pathway interns are 6 months into their diploma when they join you — course-relevant knowledge, day one." },
  { Icon: ClipboardList, title: "Easy Job Posting",       desc: "Post your internship roles on PathPort. We match you with the right candidates based on course and skills." },
  { Icon: Briefcase,     title: "Internship Management",  desc: "Track your current interns, update placement status, and manage renewals from your Employer Dashboard." },
];

const HOW_IT_WORKS = [
  { step: "1", title: "Apply to Partner",     desc: "Register your company with PathPort. Employer accounts are approved manually by our team." },
  { step: "2", title: "Post Internship Role", desc: "List your internship requirements — role, duration, stipend, and course preference — on the PathPort platform." },
  { step: "3", title: "Hire & Manage",        desc: "Receive matched candidate profiles, interview, hire, and manage your interns — all tracked in your dashboard." },
];

const FEATURES = [
  "Employer Dashboard with intern pipeline",
  "Internship ID verification system",
  "Job posting and candidate matching",
  "Student profile and CV access",
  "Placement status management",
  "Internship renewal tracking",
  "CPF and payroll guidance",
  "PathPort employer support team",
];

const SIX_SIX_POINTS = [
  { label: "Stipend range",      value: "S$800 – S$1,500 / month" },
  { label: "Duration",           value: "6 months (full-time)" },
  { label: "Student type",       value: "Active Singapore diploma students" },
  { label: "Work authorisation", value: "Covered under Student Pass (16hr/wk max)" },
  { label: "Course relevance",   value: "Matched to your industry and role" },
  { label: "Support",            value: "PathPort liaises on your behalf" },
];

export default function EmployersPage() {
  return (
    <>
      <Navbar />
      <main>

        {/* Dark hero */}
        <section className="relative w-full min-h-[72vh] overflow-hidden bg-[#06142E]">
          <div aria-hidden className="absolute inset-0">
            <Image
              src="https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=2400&q=80"
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
              <span className="inline-flex items-center px-3 py-1 rounded-full bg-pathBlue-500/10 border border-pathBlue-500/30 text-pathBlue-300 font-body text-xs font-semibold tracking-wide mb-6">
                💼 For Employers
              </span>
              <h1 className="display-2 text-white mb-6">
                Hire Diploma Interns{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold-400 to-gold-300">
                  via PathPort
                </span>
              </h1>
              <p className="lead text-white/75 mb-10 max-w-2xl">
                Access verified, internship-ready Singapore diploma students through the 6+6 pathway. Post roles, verify Internship IDs, and manage your intern pipeline from one dashboard.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link href="/login?role=employer">
                  <GoldButton variant="solid-gold" size="lg">Employer Login</GoldButton>
                </Link>
                <Link href="/partner-with-us?type=employer">
                  <GoldButton variant="outline-gold" size="lg" className="group">
                    Apply to Partner With Us
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </GoldButton>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* 6+6 Pathway Explainer — white */}
        <section className="public-section-white">
          <div className="layout-shell section-airy">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <p className="inline-flex items-center gap-3 eyebrow text-gold-700 mb-5">
                  <span className="w-8 h-px bg-gold-700/50 rounded-full" />
                  The 6+6 Pathway
                </p>
                <h2 className="display-3 text-navy-900 mb-5">
                  Study 6 months.{" "}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold-600 to-gold-500">Work 6 months.</span>
                </h2>
                <p className="prose-lg text-navy-800/65 mb-6">
                  PathPort students study their Singapore diploma for 6 months, then join an employer partner for a 6-month paid internship. Employers get motivated, course-trained candidates — students get real industry experience.
                </p>
                <p className="text-navy-800/55 font-body text-sm">
                  All placements are tracked with a unique{" "}
                  <strong className="text-gold-700">Internship ID</strong>{" "}
                  — verifiable through your Employer Dashboard.
                </p>
              </div>

              <div className="warm-panel-card rounded-3xl p-7">
                <h3 className="font-display text-xl text-navy-900 mb-5">6+6 internship at a glance</h3>
                <div className="space-y-3">
                  {SIX_SIX_POINTS.map(({ label, value }) => (
                    <div key={label} className="flex justify-between items-center py-2.5 border-b border-gold-500/15 last:border-0 gap-3">
                      <span className="text-navy-800/55 font-body text-sm">{label}</span>
                      <span className="text-navy-900 font-body text-sm font-medium text-right max-w-[220px]">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Benefits — soft-blue */}
        <section className="public-section-blue">
          <div className="layout-shell section-airy">
            <Reveal className="text-center mb-12">
              <p className="eyebrow text-gold-700 mb-4">Why Partner</p>
              <h2 className="display-3 text-navy-900">What employers get via PathPort.</h2>
            </Reveal>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {BENEFITS.map(({ Icon, title, desc }, i) => (
                <Reveal key={title} delay={i * 70} className="h-full">
                  <div className={`p-6 rounded-2.5xl public-card public-card-hover h-full ${i === 0 ? "ring-1 ring-gold-400/45" : ""}`}>
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 ${i === 0 ? "bg-gradient-to-br from-gold-500 to-gold-600 shadow-gold-sm text-white" : "bg-pathBlue-500/10 border border-pathBlue-500/25 text-pathBlue-700"}`}>
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

        {/* How it works — white */}
        <section className="public-section-white">
          <div className="layout-shell section-airy">
            <Reveal className="text-center mb-12">
              <p className="eyebrow text-gold-700 mb-4">Process</p>
              <h2 className="display-3 text-navy-900">How to hire through PathPort.</h2>
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

        {/* Features — cream rest beat */}
        <section className="cream-band">
          <div className="layout-prose px-5 sm:px-8 section-airy">
            <div className="text-center mb-10">
              <p className="eyebrow text-gold-700 mb-4">Platform Features</p>
              <h2 className="display-3 text-navy-900">Your Employer Dashboard includes.</h2>
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
            <h2 className="display-2 text-white mb-4">Ready to hire PathPort interns?</h2>
            <p className="lead text-white/75 mb-8">
              Contact us to discuss your hiring needs. Employer accounts are set up by the PathPort team.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/login?role=employer">
                <GoldButton variant="solid-gold" size="lg">Employer Login</GoldButton>
              </Link>
              <Link href="/partner-with-us?type=employer">
                <GoldButton variant="outline-gold" size="lg">Apply to Partner With Us</GoldButton>
              </Link>
            </div>
            <p className="text-white/40 font-body text-sm mt-6">
              Employer accounts are approved and onboarded manually by PathPort.<br />
              Contact: <span className="text-gold-400">pathportsg@gmail.com</span> · <span className="text-gold-400">+65 8377 6492</span>
            </p>
          </div>
        </section>

      </main>
      <Footer />
    </>
  );
}
