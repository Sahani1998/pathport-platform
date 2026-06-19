import type { Metadata } from "next";
import Link from "next/link";
import {
  ShieldCheck, Wallet, FileText, Phone, Clock, GraduationCap,
  CheckCircle2, ArrowRight, Heart, MessageCircle,
} from "lucide-react";
import MarketingShell from "@/components/marketing/MarketingShell";
import PageHero from "@/components/marketing/PageHero";
import Breadcrumbs from "@/components/marketing/Breadcrumbs";
import JsonLd from "@/components/marketing/JsonLd";
import { breadcrumbJsonLd } from "@/lib/jsonld";

export const metadata: Metadata = {
  title: "For Parents | PathPort Singapore",
  description: "Everything Indian parents need to know before their child studies in Singapore through PathPort — safety, cost, communication, documents, and career outcomes.",
  alternates: { canonical: "/for-parents" },
  openGraph: {
    title: "For Parents | PathPort Singapore",
    description: "Safety, cost, communication, and career outcomes — everything parents need to know before their child studies in Singapore.",
  },
};

const CONCERNS = [
  {
    Icon: ShieldCheck,
    title: "Is Singapore safe for my child?",
    answer: "Singapore consistently ranks among Asia's top two safest cities. There is no curfew, violent crime is extremely rare, and English is universal. Indian students walk freely at night, use public transport without fear, and live in vetted student housing near their campus. PathPort's on-ground team is available throughout your child's stay.",
    points: ["#1 or #2 safest city in Asia every year", "Strict rule-of-law environment", "24-hour public transport", "PathPort representative on-ground"],
  },
  {
    Icon: Wallet,
    title: "What does it actually cost — total?",
    answer: "The complete cost of one year in Singapore (tuition + accommodation + food + transport + insurance) typically ranges from SGD 14,000 to SGD 22,000 — approximately ₹8.5 to ₹13.5 lakh. The 6+6 internship pathway earns students SGD 800–1,500/month, partially offsetting this cost. PathPort shows transparent fees with no hidden charges.",
    points: ["Tuition: SGD 4,000–8,000/year", "Accommodation: SGD 500–900/month", "Food + transport: SGD 400–600/month", "Internship earnings: SGD 800–1,500/month"],
  },
  {
    Icon: Phone,
    title: "How will I stay in touch?",
    answer: "Singapore has one of the world's fastest internet networks. Video calls (WhatsApp, Google Meet, Jio) work flawlessly 24/7. Students receive a SIM card on arrival at Changi Airport arranged by PathPort. Calling rates India–Singapore are near-zero with internet calling. Your child is never more than a call away.",
    points: ["SIM card arranged on arrival day", "Unlimited data plans from SGD 15/month", "Video call quality is excellent", "Indian community groups on WhatsApp"],
  },
  {
    Icon: FileText,
    title: "Who handles the visa and documents?",
    answer: "The Student Pass (visa) application is submitted by the enrolled college directly to ICA Singapore — this is a regulatory requirement. PathPort prepares all supporting documents, tracks the IPA status, and informs you of every update. Parents are kept informed at each stage through WhatsApp updates.",
    points: ["College submits Student Pass to ICA", "PathPort prepares supporting documents", "IPA status tracked and shared with parents", "Pre-departure checklist provided"],
  },
  {
    Icon: Clock,
    title: "What is the complete timeline?",
    answer: "From the day your child submits interest to the day they arrive in Singapore typically takes 6–12 weeks — depending on document readiness and intake dates. The conditional offer letter is issued within 24 hours. Student Pass approval takes 3–8 weeks from college submission.",
    points: ["Interest submitted → Offer letter: 24 hours", "Offer letter → Student Pass: 3–8 weeks", "Student Pass → Arrival: 1–2 weeks", "Total: 6–12 weeks typical"],
  },
  {
    Icon: GraduationCap,
    title: "What are the career outcomes?",
    answer: "Graduates of Singapore private college diploma programmes have multiple pathways: employment in Singapore with work visa, pathway to Advanced or Higher Diploma, degree entry with advanced standing at UK/Australian universities, or return to India with a recognised international qualification. The 6+6 internship adds real work experience to the CV.",
    points: ["Employment in Singapore or India", "Pathway to Advanced/Higher Diploma", "UK/Australia degree entry (advanced standing)", "Singapore PR pathway eligibility"],
  },
];

const JOURNEY_STEPS = [
  { step: "1", label: "Your child submits interest on PathPort", who: "Student + PathPort" },
  { step: "2", label: "PathPort advisor calls within 24 hours", who: "PathPort" },
  { step: "3", label: "College selected, documents prepared", who: "Student + PathPort" },
  { step: "4", label: "Application submitted, offer letter issued (24hrs)", who: "PathPort + College" },
  { step: "5", label: "Student Pass application submitted by college", who: "College + ICA" },
  { step: "6", label: "IPA approved — your child can travel", who: "ICA Singapore" },
  { step: "7", label: "PathPort representative meets them at Changi Airport", who: "PathPort" },
  { step: "8", label: "First class, orientation, and internship placement", who: "Student + PathPort" },
];

export default function ForParentsPage() {
  return (
    <MarketingShell maxWidth="default">
      <JsonLd data={breadcrumbJsonLd([{ name: "For Parents", url: "/for-parents" }])} />
      <Breadcrumbs trail={[{ name: "For Parents", url: "/for-parents" }]} />

      <PageHero
        eyebrow="For Parents"
        title="Everything you need to know before your child goes to Singapore."
        subtitle="We understand this is one of the most important decisions your family will make. Here are the answers to every question parents ask us — honest, complete, and without sales pressure."
      />

      {/* Warm reassurance banner */}
      <div className="mb-12 p-6 md:p-8 rounded-3xl warm-panel">
        <div className="flex items-start gap-4">
          <div className="w-11 h-11 rounded-2xl bg-gold-200/60 border border-gold-500/30 text-gold-700 flex items-center justify-center flex-shrink-0">
            <Heart className="w-5 h-5" />
          </div>
          <div>
            <p className="font-display text-xl text-navy-900 mb-2 leading-snug">
              PathPort was built with parents in mind.
            </p>
            <p className="font-body text-navy-800/75 text-sm leading-relaxed">
              India is a parent-driven culture. We know that when a student applies through PathPort, their parents are making the decision alongside them. Every process we have built — transparent fees, document tracking, on-ground support, WhatsApp communication — is designed to give you the same visibility as if you were in Singapore yourself.
            </p>
          </div>
        </div>
      </div>

      {/* Parent concerns grid */}
      <section className="mb-14">
        <h2 className="font-display text-3xl text-white mb-2">The 6 questions every parent asks</h2>
        <p className="text-white/50 font-body text-sm mb-8">Honest answers — no marketing language.</p>

        <div className="space-y-5">
          {CONCERNS.map(({ Icon, title, answer, points }) => (
            <div key={title} className="bg-white/[0.04] border border-white/[0.08] rounded-2.5xl p-6 md:p-7">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gold-400/10 border border-gold-400/25 flex items-center justify-center text-gold-400 flex-shrink-0">
                  <Icon className="w-5 h-5" strokeWidth={1.75} />
                </div>
                <h3 className="font-display text-xl text-white leading-snug pt-0.5">{title}</h3>
              </div>
              <p className="text-white/60 font-body text-sm leading-relaxed mb-5">{answer}</p>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {points.map(p => (
                  <li key={p} className="flex items-start gap-2 text-white/55 font-body text-sm">
                    <CheckCircle2 className="w-4 h-4 text-gold-400/70 flex-shrink-0 mt-0.5" />
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Parent journey timeline */}
      <section className="mb-14">
        <h2 className="font-display text-3xl text-white mb-2">The timeline — from application to arrival</h2>
        <p className="text-white/50 font-body text-sm mb-8">What happens at each stage, and who is responsible.</p>

        <div className="relative">
          <div aria-hidden className="absolute left-[19px] top-6 bottom-6 w-px bg-gradient-to-b from-gold-400/50 via-gold-400/25 to-transparent hidden md:block" />
          <div className="space-y-3">
            {JOURNEY_STEPS.map(({ step, label, who }) => (
              <div key={step} className="flex items-start gap-4 p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:border-gold-400/20 transition-colors">
                <div className="w-9 h-9 rounded-full bg-gold-400/10 border border-gold-400/25 flex items-center justify-center flex-shrink-0 relative z-10">
                  <span className="font-display font-bold text-gold-400 text-sm">{step}</span>
                </div>
                <div className="flex-1 min-w-0 pt-1">
                  <p className="font-body text-white/80 text-sm leading-snug">{label}</p>
                  <p className="text-white/30 font-body text-xs mt-0.5">{who}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PathPort promise to parents */}
      <section className="mb-14 grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          {
            title: "Transparent fees, always",
            body: "The fee you see on PathPort is the fee on the college invoice. No agent commission, no platform fee, no surprises. Currency conversions use a published rate.",
            href: "/trust/fee-transparency",
            cta: "See fee transparency",
          },
          {
            title: "Documents stay private",
            body: "Your child's passport, transcripts, and personal documents are stored in private encrypted storage. Only the enrolled college can access them — never agents or marketers.",
            href: "/trust/document-security",
            cta: "Document security policy",
          },
          {
            title: "A real human on WhatsApp",
            body: "A named PathPort advisor is assigned from day one. Parents can WhatsApp directly — we respond personally, not through chatbots or ticket systems.",
            href: "https://wa.me/6583776492",
            cta: "Chat with us now",
          },
        ].map(({ title, body, href, cta }) => (
          <Link
            key={title}
            href={href}
            target={href.startsWith("http") ? "_blank" : undefined}
            rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
            className="group block bg-white/[0.04] border border-white/[0.08] rounded-2.5xl p-6 hover:border-gold-400/30 hover:bg-gold-400/[0.03] hover:-translate-y-0.5 hover:shadow-warm transition-all duration-300"
          >
            <h3 className="font-display text-lg text-white mb-2 leading-snug">{title}</h3>
            <p className="text-white/50 font-body text-sm leading-relaxed mb-4 flex-1">{body}</p>
            <span className="inline-flex items-center gap-1.5 text-gold-400/80 font-body text-xs font-semibold group-hover:text-gold-400 transition-colors">
              {cta} <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </span>
          </Link>
        ))}
      </section>

      {/* WhatsApp CTA */}
      <section className="bg-gradient-to-br from-gold-400/[0.08] to-transparent border border-gold-400/20 rounded-2xl p-8 text-center">
        <div className="w-12 h-12 rounded-2xl bg-gold-400/15 border border-gold-400/30 flex items-center justify-center text-gold-400 mx-auto mb-4">
          <MessageCircle className="w-6 h-6" />
        </div>
        <p className="font-display text-2xl text-white mb-3">Speak to a PathPort advisor</p>
        <p className="text-white/55 font-body text-sm mb-6 max-w-lg mx-auto leading-relaxed">
          Have a question not covered here? Our advisors speak to parents every day — in English, Hindi, or Tamil. WhatsApp us directly and we will respond personally within 24 hours.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <a
            href="https://wa.me/6583776492"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-gold-500 to-gold-400 text-navy-900 font-body font-bold text-sm hover:shadow-gold-sm transition-all"
          >
            WhatsApp Us: +65 8377 6492
          </a>
          <Link
            href="/trust"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-white/[0.15] text-white/70 hover:text-white hover:border-white/30 font-body text-sm transition-all"
          >
            Visit Trust Center
          </Link>
        </div>
      </section>
    </MarketingShell>
  );
}
