// /partners/institutions — light public theme (Sprint 30.1 PR-F).
// Dark hero + dark CTA bookend a light body. B2B partner audience.

import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import GoldButton from "@/components/ui/GoldButton";
import Reveal from "@/components/ui/Reveal";
import { ArrowRight, CheckCircle2, Upload, FileText, Users, BarChart2 } from "lucide-react";

export const metadata: Metadata = {
  title: "Institutions | PathPort Partners",
  description: "Partner with PathPort as a Singapore private college or institution. List courses, manage applications, upload LOAs, and receive pre-screened students from India.",
};

const BENEFITS = [
  { Icon: Users,     title: "Pre-Screened Students",   desc: "Receive applications from qualified, verified Indian students who are serious about Singapore education." },
  { Icon: FileText,  title: "Application Management",  desc: "Manage all student applications, documents, and statuses through your Institution Dashboard." },
  { Icon: Upload,    title: "LOA & IPA Upload",        desc: "Upload Letter of Acceptance and IPA documents directly to the platform. Students are notified instantly." },
  { Icon: BarChart2, title: "Intake Analytics",        desc: "Track enquiries, application conversion rates, and student intake numbers by course and term." },
];

const HOW_IT_WORKS = [
  { step: "1", title: "Apply to Partner", desc: "Submit your institution's details and accreditation information for PathPort review." },
  { step: "2", title: "Get Listed",        desc: "Once approved, your institution and courses are listed on the PathPort platform for Indian students to discover." },
  { step: "3", title: "Receive Students",  desc: "PathPort sends pre-screened student applications directly to your Institution Dashboard for review and offer." },
];

const FEATURES = [
  "Course listing on PathPort platform",
  "Student application inbox",
  "LOA document upload portal",
  "IPA status update system",
  "Student profile & document access",
  "Intake calendar management",
  "Application conversion reports",
  "Dedicated PathPort relationship manager",
];

export default function InstitutionsPage() {
  return (
    <>
      <Navbar />
      <main>

        {/* Dark hero */}
        <section className="relative py-24 overflow-hidden pt-[92px] bg-[#06142E]">
          <div aria-hidden className="absolute top-[20%] right-[10%] w-[400px] h-[400px] rounded-full bg-pathBlue-500/[0.10] blur-[120px] pointer-events-none" />
          <div aria-hidden className="absolute bottom-[10%] left-[5%] w-[350px] h-[350px] rounded-full bg-gold-400/[0.06] blur-[110px] pointer-events-none" />

          <div className="max-w-7xl mx-auto px-5 md:px-10 relative">
            <div className="max-w-3xl">
              <span className="inline-flex items-center px-3 py-1 rounded-full bg-pathBlue-500/10 border border-pathBlue-500/30 text-pathBlue-300 font-body text-xs font-semibold tracking-wide mb-6">
                🏫 For Institutions
              </span>
              <h1 className="font-display text-5xl md:text-[3.8rem] text-white leading-[1.06] mb-6">
                Partner with PathPort{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold-400 to-gold-300">
                  as an Institution
                </span>
              </h1>
              <p className="text-white/55 font-body text-xl leading-relaxed mb-10 max-w-2xl">
                List your Singapore private college courses on PathPort and receive a steady stream of pre-screened, application-ready students from India — fully supported through to enrolment.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link href="/login?role=institution">
                  <GoldButton variant="solid-gold" size="lg">Institution Login</GoldButton>
                </Link>
                <Link href="/partner-with-us?type=institution">
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
        <section className="public-section-white py-20">
          <div className="max-w-7xl mx-auto px-5 md:px-10">
            <Reveal className="text-center mb-12">
              <p className="text-gold-700 font-body text-xs font-semibold tracking-[0.22em] uppercase mb-4">Why Partner</p>
              <h2 className="font-display text-3xl md:text-4xl text-navy-900 leading-[1.1]">What PathPort provides to institutions.</h2>
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

        {/* How it works — soft-blue */}
        <section className="public-section-blue py-20">
          <div className="max-w-7xl mx-auto px-5 md:px-10">
            <Reveal className="text-center mb-12">
              <p className="text-gold-700 font-body text-xs font-semibold tracking-[0.22em] uppercase mb-4">Process</p>
              <h2 className="font-display text-3xl md:text-4xl text-navy-900 leading-[1.1]">How institution partnership works.</h2>
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
        <section className="cream-band py-20">
          <div className="max-w-3xl mx-auto px-5 md:px-10">
            <div className="text-center mb-10">
              <p className="text-gold-700 font-body text-xs font-semibold tracking-[0.22em] uppercase mb-4">Platform Features</p>
              <h2 className="font-display text-3xl md:text-4xl text-navy-900 leading-[1.1]">Everything in the Institution Dashboard.</h2>
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
          <div className="relative max-w-3xl mx-auto px-5 md:px-10 text-center">
            <h2 className="font-display text-4xl text-white mb-4">Already a partner institution?</h2>
            <p className="text-white/55 font-body text-lg mb-8">Log in to manage your applications, upload LOAs, and track student intake.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/login?role=institution">
                <GoldButton variant="solid-gold" size="lg">Institution Login</GoldButton>
              </Link>
              <Link href="/partner-with-us?type=institution">
                <GoldButton variant="outline-gold" size="lg">Apply to Partner With Us</GoldButton>
              </Link>
            </div>
            <p className="text-white/40 font-body text-sm mt-6">
              New institution partnerships are approved manually by the PathPort team.<br />
              Contact: <span className="text-gold-400">pathportsg@gmail.com</span>
            </p>
          </div>
        </section>

      </main>
      <Footer />
    </>
  );
}
