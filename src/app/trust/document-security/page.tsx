import type { Metadata } from "next";
import { Lock, Server, Eye, Shield } from "lucide-react";
import MarketingShell from "@/components/marketing/MarketingShell";
import PageHero from "@/components/marketing/PageHero";
import Breadcrumbs from "@/components/marketing/Breadcrumbs";
import JsonLd from "@/components/marketing/JsonLd";
import { breadcrumbJsonLd } from "@/lib/jsonld";

export const metadata: Metadata = {
  title: "Document Security | PathPort Trust Center",
  description: "How PathPort stores, encrypts, and controls access to your passport, academic transcripts, and IPA documents. Private storage, access logs, and PDPA-aligned retention.",
  alternates: { canonical: "/trust/document-security" },
};

const CONTROLS = [
  { icon: <Lock className="w-4 h-4" />, title: "Private encrypted storage", body: "All documents are stored in private buckets — not publicly accessible URLs. Retrieval requires a time-limited signed link generated server-side. A direct URL to your passport copy cannot be guessed or scraped by anyone outside the system." },
  { icon: <Server className="w-4 h-4" />, title: "Encryption at rest and in transit", body: "Documents are encrypted at rest using AES-256 on Supabase infrastructure hosted in Singapore (AWS ap-southeast-1). All data in transit is encrypted via TLS 1.2+. Unencrypted document transfers do not occur at any stage." },
  { icon: <Eye className="w-4 h-4" />, title: "Role-based access control", body: "Only your enrolled college and PathPort administrators with a logged, verifiable reason can retrieve your documents. Student-facing download links are generated per-request and expire after 60 minutes. Colleges cannot access documents for applications they did not originate." },
  { icon: <Shield className="w-4 h-4" />, title: "Row-level security (RLS)", body: "PathPort's database enforces row-level security at the database layer — not just the application layer. This means even if an application bug occurred, database queries from one college or student cannot return rows belonging to another." },
];

const DOCUMENT_TYPES = [
  { doc: "Passport copy", stored: "Yes — private bucket, per-student prefix", access: "Your enrolled college + PathPort admin", retention: "7 years (statutory requirement)" },
  { doc: "Academic transcripts & mark sheets", stored: "Yes — private bucket", access: "Your enrolled college + PathPort admin", retention: "7 years" },
  { doc: "Offer letter (from college)", stored: "Yes — scoped to college + application", access: "Student + enrolled college + PathPort admin", retention: "7 years" },
  { doc: "IPA / Student Pass document", stored: "Yes — scoped to college + application", access: "Student + enrolled college + PathPort admin", retention: "7 years" },
  { doc: "Payment proof / receipt", stored: "Yes — private bucket", access: "Student + enrolled college + PathPort admin", retention: "7 years" },
  { doc: "Bank statement / financial proof", stored: "Yes — private bucket", access: "Enrolled college + PathPort admin only", retention: "7 years" },
];

export default function DocumentSecurityPage() {
  return (
    <MarketingShell maxWidth="wide">
      <JsonLd data={breadcrumbJsonLd([{ name: "Trust Center", url: "/trust" }, { name: "Document Security", url: "/trust/document-security" }])} />
      <Breadcrumbs trail={[{ name: "Trust Center", url: "/trust" }, { name: "Document Security", url: "/trust/document-security" }]} />

      <PageHero
        eyebrow="Document Security"
        title="Your documents are locked by design."
        subtitle="Passport copies, transcripts, and IPA documents are among the most sensitive files you will ever share. Here is exactly how PathPort protects them."
      />

      <section className="mb-12">
        <h2 className="font-display text-2xl text-white mb-5">Security controls</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {CONTROLS.map(c => (
            <div key={c.title} className="flex items-start gap-4 p-5 rounded-2xl bg-white/[0.03] border border-white/[0.07]">
              <div className="w-9 h-9 rounded-xl bg-gold-400/10 border border-gold-400/25 text-gold-400 flex items-center justify-center flex-shrink-0">{c.icon}</div>
              <div>
                <p className="font-body font-semibold text-white/90 text-base mb-1.5">{c.title}</p>
                <p className="text-white/55 font-body text-sm leading-relaxed">{c.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-12">
        <h2 className="font-display text-2xl text-white mb-5">Document storage reference</h2>
        <div className="rounded-2xl bg-white/[0.03] border border-white/[0.07] overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead>
              <tr className="border-b border-white/[0.07]">
                <th className="text-left text-white/35 font-body text-xs uppercase tracking-widest p-4">Document</th>
                <th className="text-left text-white/35 font-body text-xs uppercase tracking-widest p-4">Stored</th>
                <th className="text-left text-white/35 font-body text-xs uppercase tracking-widest p-4">Who can access</th>
                <th className="text-left text-white/35 font-body text-xs uppercase tracking-widest p-4">Retention</th>
              </tr>
            </thead>
            <tbody>
              {DOCUMENT_TYPES.map((d, i) => (
                <tr key={d.doc} className={i > 0 ? "border-t border-white/[0.05]" : ""}>
                  <td className="text-white/75 font-body text-sm p-4">{d.doc}</td>
                  <td className="text-white/55 font-body text-sm p-4">{d.stored}</td>
                  <td className="text-white/55 font-body text-sm p-4">{d.access}</td>
                  <td className="text-white/55 font-body text-sm p-4">{d.retention}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-6">
        <h3 className="font-display text-xl text-white mb-3">To report a security concern</h3>
        <p className="text-white/55 font-body text-sm mb-1">Email <a href="mailto:pathportsg@gmail.com?subject=Security%20concern" className="text-gold-400 hover:underline">pathportsg@gmail.com</a> with the subject line &quot;Security concern&quot;. Include as much detail as possible. PathPort acknowledges all security reports within 24 hours.</p>
      </section>
    </MarketingShell>
  );
}
