import type { Metadata } from "next";
import Link from "next/link";
import { FileText, Shield, Cookie, Database, AlertTriangle, Users } from "lucide-react";
import MarketingShell from "@/components/marketing/MarketingShell";
import PageHero from "@/components/marketing/PageHero";
import Breadcrumbs from "@/components/marketing/Breadcrumbs";
import JsonLd from "@/components/marketing/JsonLd";
import { breadcrumbJsonLd } from "@/lib/jsonld";

export const metadata: Metadata = {
  title: "Legal Center | PathPort",
  description: "PathPort's complete legal documentation — Privacy Policy, Terms of Service, Cookie Policy, Data Retention, Acceptable Use, and Student Rights.",
  alternates: { canonical: "/legal" },
  openGraph: { title: "Legal Center | PathPort", description: "All PathPort legal policies in one place — written clearly for students, parents, and institutions." },
};

const POLICIES = [
  {
    icon: <Shield className="w-5 h-5" />,
    title: "Privacy Policy",
    desc: "How PathPort collects, uses, and protects your personal data. PDPA-compliant. Covers all data types from profile info to passport documents.",
    href: "/privacy",
    updated: "19 June 2026",
  },
  {
    icon: <FileText className="w-5 h-5" />,
    title: "Terms of Service",
    desc: "The agreement between PathPort and students, parents, and institutions using the platform. Covers services, fees, obligations, and liability.",
    href: "/terms",
    updated: "19 June 2026",
  },
  {
    icon: <Cookie className="w-5 h-5" />,
    title: "Cookie Policy",
    desc: "What cookies PathPort uses, which are strictly necessary, and how to manage your preferences under Singapore's PDPA.",
    href: "/legal/cookies",
    updated: "19 June 2026",
  },
  {
    icon: <Database className="w-5 h-5" />,
    title: "Data Retention Policy",
    desc: "Exactly how long PathPort keeps each type of data — from session cookies (session only) to application records (7 years under Singapore law).",
    href: "/legal/data-retention",
    updated: "19 June 2026",
  },
  {
    icon: <AlertTriangle className="w-5 h-5" />,
    title: "Acceptable Use Policy",
    desc: "What you may and may not do on the PathPort platform. Covers prohibited content, prohibited conduct, and consequences of violations.",
    href: "/legal/acceptable-use",
    updated: "19 June 2026",
  },
  {
    icon: <Users className="w-5 h-5" />,
    title: "Student Rights Policy",
    desc: "Your specific rights as a student on PathPort — beyond PDPA. Includes application rights, document rights, support rights, and complaint rights.",
    href: "/legal/student-rights",
    updated: "19 June 2026",
  },
];

export default function LegalPage() {
  return (
    <MarketingShell>
      <JsonLd data={breadcrumbJsonLd([{ name: "Legal Center", url: "/legal" }])} />
      <Breadcrumbs trail={[{ name: "Legal Center", url: "/legal" }]} />

      <PageHero
        eyebrow="Legal Center"
        title="Our policies, written clearly."
        subtitle="PathPort is committed to transparency. Every policy is written to be readable — not just legally sufficient. If any section is unclear, contact us and we will explain it."
      />

      <section className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
        {POLICIES.map(p => (
          <Link
            key={p.title}
            href={p.href}
            className="group flex items-start gap-4 p-6 rounded-2xl bg-white/[0.04] border border-white/[0.08] hover:border-gold-400/30 hover:bg-gold-400/[0.03] transition-all"
          >
            <div className="w-11 h-11 rounded-xl bg-gold-400/10 border border-gold-400/25 text-gold-400 flex items-center justify-center flex-shrink-0">
              {p.icon}
            </div>
            <div className="flex-1">
              <h2 className="font-display text-lg text-white mb-1 group-hover:text-gold-300 transition-colors">{p.title}</h2>
              <p className="text-white/50 font-body text-sm leading-relaxed mb-2">{p.desc}</p>
              <p className="text-white/25 font-body text-xs">Last updated: {p.updated}</p>
            </div>
          </Link>
        ))}
      </section>

      <section className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-6">
        <h3 className="font-display text-xl text-white mb-2">Questions about our policies?</h3>
        <p className="text-white/55 font-body text-sm mb-4">If you have a question about any PathPort policy, email us. All policies are governed by Singapore law.</p>
        <a href="mailto:pathportsg@gmail.com?subject=Legal%20query" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/[0.05] border border-white/[0.10] text-white/70 font-body text-sm font-semibold hover:border-gold-400/30 hover:text-gold-300 transition-all">
          pathportsg@gmail.com →
        </a>
      </section>
    </MarketingShell>
  );
}
