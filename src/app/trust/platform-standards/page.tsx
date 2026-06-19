import type { Metadata } from "next";
import { Star } from "lucide-react";
import MarketingShell from "@/components/marketing/MarketingShell";
import PageHero from "@/components/marketing/PageHero";
import Breadcrumbs from "@/components/marketing/Breadcrumbs";
import JsonLd from "@/components/marketing/JsonLd";
import { breadcrumbJsonLd } from "@/lib/jsonld";

export const metadata: Metadata = {
  title: "Platform Standards | PathPort Trust Center",
  description: "The operational standards PathPort holds itself to — content accuracy, uptime, response times, and service quality commitments.",
  alternates: { canonical: "/trust/platform-standards" },
};

const STANDARDS = [
  {
    area: "Content accuracy",
    commitment: "Course fees, college details, and programme information on PathPort are reviewed when colleges notify us of changes. Any inaccuracy reported by a student or institution will be investigated within 2 business days and corrected if confirmed.",
  },
  {
    area: "Platform availability",
    commitment: "PathPort targets 99.5% monthly uptime for student-facing and institution-facing services. Planned maintenance is communicated via in-app notification at least 24 hours in advance.",
  },
  {
    area: "Student support response time",
    commitment: "WhatsApp queries receive a first response within 4 business hours during Singapore business hours (9am–6pm SGT, Monday–Friday). Email queries receive a response within 1 business day.",
  },
  {
    area: "Notification delivery",
    commitment: "Critical notifications (offer letter issued, IPA update, payment verified) are delivered in-app in real time and by email within 5 minutes of the triggering event.",
  },
  {
    area: "Document access speed",
    commitment: "Documents in your dashboard (offer letters, IPAs, receipts) should be downloadable within 2 seconds of clicking. If a document is unavailable, PathPort will restore access within 4 business hours of a report.",
  },
  {
    area: "Security patching",
    commitment: "Critical security vulnerabilities in the PathPort platform are patched within 24 hours of discovery. High-severity vulnerabilities are patched within 7 days. PathPort monitors OWASP advisories and dependency vulnerabilities continuously.",
  },
  {
    area: "Data backups",
    commitment: "PathPort's database (Supabase) is backed up daily with point-in-time recovery available. Document storage is replicated across availability zones. Recovery time objective (RTO) is 4 hours; recovery point objective (RPO) is 24 hours.",
  },
  {
    area: "Accuracy of IPA status",
    commitment: "IPA status displayed in student dashboards reflects information provided by the college. PathPort does not fabricate or estimate IPA status. If the college has not updated IPA status within 7 business days of a student's enquiry, PathPort will follow up with the institution.",
  },
];

export default function PlatformStandardsPage() {
  return (
    <MarketingShell>
      <JsonLd data={breadcrumbJsonLd([{ name: "Trust Center", url: "/trust" }, { name: "Platform Standards", url: "/trust/platform-standards" }])} />
      <Breadcrumbs trail={[{ name: "Trust Center", url: "/trust" }, { name: "Platform Standards", url: "/trust/platform-standards" }]} />

      <PageHero
        eyebrow="Platform Standards"
        title="What PathPort holds itself to."
        subtitle="These are the operational commitments PathPort makes — on content accuracy, availability, response times, security, and data reliability. We publish them so you can hold us accountable."
      />

      <section className="mb-12">
        <div className="space-y-3">
          {STANDARDS.map(s => (
            <div key={s.area} className="flex items-start gap-4 p-5 rounded-2xl bg-white/[0.03] border border-white/[0.07]">
              <Star className="w-4 h-4 text-gold-400 flex-shrink-0 mt-1" />
              <div>
                <p className="font-body font-semibold text-white/90 text-sm mb-1.5">{s.area}</p>
                <p className="text-white/55 font-body text-sm leading-relaxed">{s.commitment}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-6">
        <h3 className="font-display text-xl text-white mb-2">Report a platform standard failure</h3>
        <p className="text-white/55 font-body text-sm mb-4">If PathPort has failed to meet any standard listed on this page, we want to know. Contact us via WhatsApp or email. Include the date, what happened, and what you expected to happen.</p>
        <div className="flex flex-wrap gap-3">
          <a href="https://wa.me/6583776492" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gold-400/10 border border-gold-400/30 text-gold-400 font-body text-sm font-semibold hover:bg-gold-400/20 transition-all">
            WhatsApp +65 8377 6492
          </a>
          <a href="mailto:pathportsg@gmail.com?subject=Platform%20standard%20concern" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.05] border border-white/[0.10] text-white/70 font-body text-sm font-semibold hover:border-gold-400/30 hover:text-gold-300 transition-all">
            pathportsg@gmail.com
          </a>
        </div>
      </section>
    </MarketingShell>
  );
}
