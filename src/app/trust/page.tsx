import type { Metadata } from "next";
import { Shield, Lock, FileCheck, Building2, DollarSign, CreditCard, RotateCcw, MessageSquare, Star, ArrowRight } from "lucide-react";
import Link from "next/link";
import MarketingShell from "@/components/marketing/MarketingShell";
import PageHero from "@/components/marketing/PageHero";
import Breadcrumbs from "@/components/marketing/Breadcrumbs";
import JsonLd from "@/components/marketing/JsonLd";
import { breadcrumbJsonLd } from "@/lib/jsonld";

export const metadata: Metadata = {
  title: "Trust Center | PathPort",
  description: "How PathPort protects students, secures documents, ensures fee transparency, and maintains platform standards. Everything you need to trust PathPort with your education journey.",
  alternates: { canonical: "/trust" },
  openGraph: {
    title: "Trust Center | PathPort",
    description: "Student protection, document security, fee transparency, and platform standards — all in one place.",
  },
};

const TRUST_PAGES = [
  {
    icon: <ArrowRight className="w-5 h-5" />,
    title: "How PathPort Works",
    desc: "A clear walkthrough of every step — from your first search to arriving in Singapore.",
    href: "/trust/how-it-works",
  },
  {
    icon: <Shield className="w-5 h-5" />,
    title: "Student Protection Policy",
    desc: "Your rights as a PathPort student. What we commit to, and what we do if something goes wrong.",
    href: "/trust/student-protection",
  },
  {
    icon: <Lock className="w-5 h-5" />,
    title: "Document Security",
    desc: "How we store, encrypt, and control access to your passport, transcripts, and IPA documents.",
    href: "/trust/document-security",
  },
  {
    icon: <FileCheck className="w-5 h-5" />,
    title: "Data Protection",
    desc: "PDPA compliance, data minimisation, retention periods, and your rights under Singapore law.",
    href: "/trust/data-protection",
  },
  {
    icon: <Building2 className="w-5 h-5" />,
    title: "Institution Verification",
    desc: "How PathPort screens, onboards, and monitors every college listed on the platform.",
    href: "/trust/institution-verification",
  },
  {
    icon: <DollarSign className="w-5 h-5" />,
    title: "Fee Transparency",
    desc: "Why every fee on PathPort matches the invoice — no hidden markups, no agent commissions.",
    href: "/trust/fee-transparency",
  },
  {
    icon: <CreditCard className="w-5 h-5" />,
    title: "Payment Verification",
    desc: "How payment proofs are verified, how invoices are matched, and what happens when you pay.",
    href: "/trust/payment-verification",
  },
  {
    icon: <RotateCcw className="w-5 h-5" />,
    title: "Refund Handling",
    desc: "Refund conditions, timelines, and the process when a course cancellation or visa refusal occurs.",
    href: "/trust/refund-handling",
  },
  {
    icon: <MessageSquare className="w-5 h-5" />,
    title: "Complaint Resolution",
    desc: "How to raise a concern, our response SLAs, and escalation paths if you are not satisfied.",
    href: "/trust/complaint-resolution",
  },
  {
    icon: <Star className="w-5 h-5" />,
    title: "Platform Standards",
    desc: "The operational standards PathPort holds itself to — content accuracy, uptime, and service quality.",
    href: "/trust/platform-standards",
  },
];

export default function TrustPage() {
  return (
    <MarketingShell>
      <JsonLd data={breadcrumbJsonLd([{ name: "Trust Center", url: "/trust" }])} />
      <Breadcrumbs trail={[{ name: "Trust Center", url: "/trust" }]} />

      <PageHero
        eyebrow="Trust Center"
        title="Know exactly how PathPort works."
        subtitle="We believe trust is built through transparency — not promises. Every process, every policy, and every protection we offer is documented here for students, parents, and institutions."
      />

      <section className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-16">
        {TRUST_PAGES.map(p => (
          <Link
            key={p.title}
            href={p.href}
            className="group flex items-start gap-4 p-6 rounded-2xl bg-white/[0.04] border border-white/[0.08] hover:border-gold-400/30 hover:bg-gold-400/[0.03] transition-all"
          >
            <div className="w-11 h-11 rounded-xl bg-gold-400/10 border border-gold-400/25 text-gold-400 flex items-center justify-center flex-shrink-0">
              {p.icon}
            </div>
            <div>
              <h2 className="font-display text-lg text-white mb-1 group-hover:text-gold-300 transition-colors">{p.title}</h2>
              <p className="text-white/50 font-body text-sm leading-relaxed">{p.desc}</p>
            </div>
          </Link>
        ))}
      </section>

      <section className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-6 text-center">
        <p className="font-display text-xl text-white mb-2">Still have a question?</p>
        <p className="text-white/55 font-body text-sm mb-5">If you cannot find what you need in the Trust Center, our team responds on WhatsApp within one business day.</p>
        <a
          href="https://wa.me/6583776492"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gold-400/10 border border-gold-400/30 text-gold-400 font-body text-sm font-semibold hover:bg-gold-400/20 transition-all"
        >
          WhatsApp +65 8377 6492
        </a>
      </section>
    </MarketingShell>
  );
}
