import type { Metadata } from "next";
import Link from "next/link";
import MarketingShell from "@/components/marketing/MarketingShell";
import PageHero from "@/components/marketing/PageHero";
import Breadcrumbs from "@/components/marketing/Breadcrumbs";
import JsonLd from "@/components/marketing/JsonLd";
import { breadcrumbJsonLd } from "@/lib/jsonld";

export const metadata: Metadata = {
  title: "Data Protection | PathPort Trust Center",
  description: "PathPort's PDPA compliance, data minimisation principles, retention schedules, and your rights to access, correct, and withdraw consent.",
  alternates: { canonical: "/trust/data-protection" },
};

const RIGHTS = [
  { right: "Right to access", desc: "You may request a copy of all personal data PathPort holds about you. PathPort will respond within 30 days." },
  { right: "Right to correction", desc: "If any personal data is inaccurate or incomplete, you may request a correction. PathPort will update records and notify any third parties who received the incorrect data." },
  { right: "Right to withdraw consent", desc: "You may withdraw consent for processing at any time. Note: withdrawal may affect your ability to use PathPort services that depend on that data." },
  { right: "Right to data portability", desc: "You may request your personal data in a structured, machine-readable format. PathPort will provide a JSON or CSV export of your profile and application data within 30 days." },
  { right: "Right to erasure (where applicable)", desc: "Where data is no longer necessary for the purpose collected, you may request deletion. Some data (applications, invoices) must be retained for 7 years under Singapore statutory requirements and cannot be deleted on request." },
];

const RETENTION = [
  { category: "Profile and account data", period: "Duration of active account + 1 year after closure" },
  { category: "Application records", period: "7 years from application date (Singapore statutory)" },
  { category: "Invoices and payment records", period: "7 years from transaction date (IRAS requirement)" },
  { category: "Uploaded documents (passport, transcripts)", period: "7 years from last application" },
  { category: "Technical logs (IP, access logs)", period: "90 days" },
  { category: "Marketing preferences", period: "Until withdrawn, then deleted within 30 days" },
  { category: "Cookie data (session only)", period: "Session duration only — no persistent tracking" },
];

const DATA_COLLECTED = [
  { type: "Identity & contact", examples: "Name, email, phone, date of birth, nationality", purpose: "Account creation, application processing, communication" },
  { type: "Passport & immigration", examples: "Passport copy, visa history", purpose: "Application to Singapore private college, IPA facilitation" },
  { type: "Educational records", examples: "Transcripts, mark sheets, certificates", purpose: "Admissions eligibility verification" },
  { type: "Financial records", examples: "Bank statements (not card numbers)", purpose: "Financial capability demonstration to colleges" },
  { type: "Application data", examples: "Course selections, offer letters, IPA status", purpose: "Application processing and tracking" },
  { type: "Technical data", examples: "IP address, browser type, session identifiers", purpose: "Security, fraud prevention, platform analytics" },
];

export default function DataProtectionPage() {
  return (
    <MarketingShell>
      <JsonLd data={breadcrumbJsonLd([{ name: "Trust Center", url: "/trust" }, { name: "Data Protection", url: "/trust/data-protection" }])} />
      <Breadcrumbs trail={[{ name: "Trust Center", url: "/trust" }, { name: "Data Protection", url: "/trust/data-protection" }]} />

      <PageHero
        eyebrow="Data Protection"
        title="Your data, handled responsibly."
        subtitle="PathPort is subject to Singapore's Personal Data Protection Act 2012 (PDPA). This page summarises how we comply, what data we hold, and what rights you have."
      />

      <section className="mb-10 p-6 rounded-2xl bg-gold-400/[0.06] border border-gold-400/20">
        <p className="font-body text-sm text-white/75 leading-relaxed">
          <strong className="text-white">Governing law:</strong> Singapore Personal Data Protection Act 2012 (PDPA). PathPort is incorporated in Singapore. Data is processed by PathPort and stored by Supabase (AWS ap-southeast-1, Singapore region). Full details are in our{" "}
          <Link href="/privacy" className="text-gold-400 hover:underline">Privacy Policy</Link>.
        </p>
      </section>

      <section className="mb-12">
        <h2 className="font-display text-2xl text-white mb-2">What data we collect and why</h2>
        <p className="text-white/55 font-body text-sm mb-5">PathPort collects only data necessary for the services described. We do not sell personal data. We do not share data with third parties for marketing purposes.</p>
        <div className="rounded-2xl bg-white/[0.03] border border-white/[0.07] overflow-hidden">
          {DATA_COLLECTED.map((row, i) => (
            <div key={row.type} className={`grid grid-cols-1 md:grid-cols-3 gap-2 p-4 ${i > 0 ? "border-t border-white/[0.05]" : ""}`}>
              <span className="text-white/85 font-body font-semibold text-sm">{row.type}</span>
              <span className="text-white/55 font-body text-sm">{row.examples}</span>
              <span className="text-white/40 font-body text-sm">{row.purpose}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-12">
        <h2 className="font-display text-2xl text-white mb-5">Your rights under PDPA</h2>
        <div className="space-y-3">
          {RIGHTS.map(r => (
            <div key={r.right} className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.07]">
              <p className="font-body font-semibold text-white/90 text-sm mb-1">{r.right}</p>
              <p className="text-white/55 font-body text-sm leading-relaxed">{r.desc}</p>
            </div>
          ))}
        </div>
        <p className="text-white/40 font-body text-xs mt-4">
          To exercise any right, email{" "}
          <a href="mailto:pathportsg@gmail.com?subject=PDPA%20request" className="text-gold-400 hover:underline">
            pathportsg@gmail.com
          </a>{" "}
          with the subject &quot;PDPA request&quot; and your full name and registered email. PathPort responds within 30 days.
        </p>
      </section>

      <section className="mb-12 p-6 rounded-2xl bg-white/[0.03] border border-white/[0.07]">
        <h2 className="font-display text-2xl text-white mb-2">Data Protection Officer</h2>
        <p className="text-white/55 font-body text-sm leading-relaxed mb-5">
          PathPort has designated a Data Protection Officer (DPO) responsible for ensuring compliance with
          the Personal Data Protection Act 2012 (PDPA). The DPO oversees data protection policies, handles
          access and correction requests, and manages data breach responses.
        </p>
        <div className="space-y-2.5 mb-5">
          <div className="flex flex-col sm:flex-row gap-1 sm:gap-4">
            <span className="text-white/35 font-body text-xs uppercase tracking-widest sm:w-36 flex-shrink-0">Role</span>
            <span className="text-white/70 font-body text-sm">Data Protection Officer</span>
          </div>
          <div className="flex flex-col sm:flex-row gap-1 sm:gap-4">
            <span className="text-white/35 font-body text-xs uppercase tracking-widest sm:w-36 flex-shrink-0">Contact</span>
            <a href="mailto:pathportsg@gmail.com?subject=PDPA%20request" className="text-gold-400 hover:underline font-body text-sm">
              pathportsg@gmail.com
            </a>
          </div>
          <div className="flex flex-col sm:flex-row gap-1 sm:gap-4">
            <span className="text-white/35 font-body text-xs uppercase tracking-widest sm:w-36 flex-shrink-0">Subject line</span>
            <span className="text-white/70 font-body text-sm">&ldquo;PDPA request&rdquo; + your full name and registered email</span>
          </div>
          <div className="flex flex-col sm:flex-row gap-1 sm:gap-4">
            <span className="text-white/35 font-body text-xs uppercase tracking-widest sm:w-36 flex-shrink-0">Response time</span>
            <span className="text-white/70 font-body text-sm">Within 30 days of receiving the request</span>
          </div>
        </div>
        <p className="text-white/35 font-body text-xs">
          For urgent matters, use the subject line &ldquo;Data breach concern&rdquo;. PathPort acknowledges
          all PDPA-related communications within 3 business days.
        </p>
      </section>

      <section className="mb-12">
        <h2 className="font-display text-2xl text-white mb-5">Data retention schedule</h2>
        <div className="rounded-2xl bg-white/[0.03] border border-white/[0.07] overflow-hidden">
          {RETENTION.map((r, i) => (
            <div key={r.category} className={`flex flex-col md:flex-row gap-2 md:gap-6 p-4 ${i > 0 ? "border-t border-white/[0.05]" : ""}`}>
              <span className="text-white/75 font-body text-sm md:w-80 flex-shrink-0">{r.category}</span>
              <span className="text-white/50 font-body text-sm">{r.period}</span>
            </div>
          ))}
        </div>
      </section>
    </MarketingShell>
  );
}
