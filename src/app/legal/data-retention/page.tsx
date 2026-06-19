import type { Metadata } from "next";
import MarketingShell from "@/components/marketing/MarketingShell";
import PageHero from "@/components/marketing/PageHero";
import Breadcrumbs from "@/components/marketing/Breadcrumbs";
import JsonLd from "@/components/marketing/JsonLd";
import { breadcrumbJsonLd } from "@/lib/jsonld";

export const metadata: Metadata = {
  title: "Data Retention Policy | PathPort",
  description: "How long PathPort keeps each type of data — session cookies, application records, invoices, documents, and audit logs. Based on Singapore statutory requirements.",
  alternates: { canonical: "/legal/data-retention" },
};

const SCHEDULE = [
  { category: "Account profile", data: "Name, email, phone, nationality, date of birth", retention: "Duration of account + 1 year after closure", basis: "Service delivery" },
  { category: "Application records", data: "Application forms, status history, timeline events", retention: "7 years from application date", basis: "Singapore statutory requirement" },
  { category: "Offer letters", data: "College-issued offer letter PDFs", retention: "7 years from issue date", basis: "Singapore statutory requirement" },
  { category: "IPA / Student Pass documents", data: "ICA-issued IPA PDFs, submission records", retention: "7 years from issue date", basis: "Immigration & Checkpoints Authority records" },
  { category: "Invoices and payment records", data: "Invoice amounts, payment proofs, receipts", retention: "7 years from transaction date", basis: "IRAS (Inland Revenue Authority of Singapore) requirement" },
  { category: "Uploaded documents", data: "Passport copies, transcripts, bank statements", retention: "7 years from last application", basis: "Statutory and admissions compliance" },
  { category: "Audit logs", data: "Admin actions, document access, status changes", retention: "3 years", basis: "Internal governance" },
  { category: "Technical server logs", data: "IP addresses, request logs, error logs", retention: "90 days", basis: "Security and fraud prevention" },
  { category: "Authentication sessions", data: "Session tokens, login events", retention: "Session duration (browser close) or 30 days (remember me)", basis: "Security" },
  { category: "Cookie consent records", data: "Timestamp and category selections for consent", retention: "3 years", basis: "PDPA compliance evidence" },
  { category: "Marketing preferences", data: "Email marketing opt-in/out status", retention: "Until withdrawn, then deleted within 30 days", basis: "PDPA consent" },
  { category: "Deleted account data", data: "Data associated with a closed account", retention: "Statutory minimums above apply; personal profile erased within 30 days of account closure request", basis: "PDPA and statutory requirements" },
];

export default function DataRetentionPage() {
  return (
    <MarketingShell maxWidth="wide">
      <JsonLd data={breadcrumbJsonLd([{ name: "Legal Center", url: "/legal" }, { name: "Data Retention Policy", url: "/legal/data-retention" }])} />
      <Breadcrumbs trail={[{ name: "Legal Center", url: "/legal" }, { name: "Data Retention Policy", url: "/legal/data-retention" }]} />

      <PageHero
        eyebrow="Data Retention Policy"
        title="How long PathPort keeps your data."
        subtitle="PathPort retains data for the shortest period consistent with its purpose and Singapore's statutory requirements. This schedule shows every data category, retention period, and the legal basis."
      />

      <div className="text-white/35 font-body text-xs mb-8">Effective date: 19 June 2026 · Governed by Singapore PDPA 2012 and applicable Singapore statutes</div>

      <section className="mb-10">
        <p className="text-white/60 font-body text-sm leading-relaxed mb-6">Singapore law requires specific data to be retained for defined periods — particularly financial records (7 years under IRAS requirements) and records supporting immigration applications. PathPort cannot delete this data earlier on request, even where a student requests full account deletion. We will always be transparent about which data must be retained and why.</p>

        <div className="rounded-2xl bg-white/[0.03] border border-white/[0.07] overflow-x-auto">
          <table className="w-full min-w-[720px]">
            <thead>
              <tr className="border-b border-white/[0.07]">
                <th className="text-left text-white/35 font-body text-xs uppercase tracking-widest p-4 w-40">Category</th>
                <th className="text-left text-white/35 font-body text-xs uppercase tracking-widest p-4">Data included</th>
                <th className="text-left text-white/35 font-body text-xs uppercase tracking-widest p-4 w-48">Retention period</th>
                <th className="text-left text-white/35 font-body text-xs uppercase tracking-widest p-4 w-48">Legal basis</th>
              </tr>
            </thead>
            <tbody>
              {SCHEDULE.map((row, i) => (
                <tr key={row.category} className={i > 0 ? "border-t border-white/[0.05]" : ""}>
                  <td className="text-white/85 font-body font-semibold text-sm p-4">{row.category}</td>
                  <td className="text-white/55 font-body text-sm p-4">{row.data}</td>
                  <td className="text-gold-400/75 font-body text-sm p-4">{row.retention}</td>
                  <td className="text-white/40 font-body text-xs p-4">{row.basis}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="font-display text-xl text-white mb-3">Requesting deletion</h2>
        <p className="text-white/60 font-body text-sm leading-relaxed">You may request deletion of your PathPort account and associated data at any time by emailing <a href="mailto:pathportsg@gmail.com?subject=Account%20deletion%20request" className="text-gold-400 hover:underline">pathportsg@gmail.com</a> with the subject &quot;Account deletion request&quot;. PathPort will delete your personal profile within 30 days. Data subject to statutory retention (7-year records) will be retained in de-identified form where technically possible, or retained in full where de-identification is not technically feasible.</p>
      </section>
    </MarketingShell>
  );
}
