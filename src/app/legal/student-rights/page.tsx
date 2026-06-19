import type { Metadata } from "next";
import { Users } from "lucide-react";
import MarketingShell from "@/components/marketing/MarketingShell";
import PageHero from "@/components/marketing/PageHero";
import Breadcrumbs from "@/components/marketing/Breadcrumbs";
import JsonLd from "@/components/marketing/JsonLd";
import { breadcrumbJsonLd } from "@/lib/jsonld";

export const metadata: Metadata = {
  title: "Student Rights Policy | PathPort",
  description: "Your rights as a PathPort student — application rights, document rights, communication rights, complaint rights, and what to do if your rights are not respected.",
  alternates: { canonical: "/legal/student-rights" },
};

const RIGHTS = [
  {
    area: "Application rights",
    items: [
      "You have the right to receive a clear, written decision on your application — offer, rejection, or waitlist — within a reasonable timeframe.",
      "You have the right to know which PathPort-listed college has received your application and when.",
      "You have the right to withdraw your application at any stage before accepting an offer, with no penalty from PathPort.",
      "You have the right to apply to multiple colleges simultaneously on PathPort.",
    ],
  },
  {
    area: "Document rights",
    items: [
      "You have the right to download your own offer letter and IPA document at any time from your dashboard.",
      "You have the right to know who has accessed your uploaded documents (on formal request to PathPort).",
      "You have the right to request that documents you uploaded be reviewed for accuracy before submission to a college.",
      "You have the right to be informed if your documents are used for any purpose beyond your application.",
    ],
  },
  {
    area: "Fee and payment rights",
    items: [
      "You have the right to a clear, itemised invoice before any payment is due.",
      "You have the right to verify that the fee on your invoice matches the published fee on the PathPort course page.",
      "You have the right to a payment receipt for every payment uploaded and verified.",
      "You have the right to request the refund policy applicable to your course before accepting an offer.",
    ],
  },
  {
    area: "Communication rights",
    items: [
      "You have the right to receive all significant application updates (offer, payment confirmation, IPA status) by both in-app notification and email.",
      "You have the right to respond to college communications through PathPort rather than directly providing your personal contact details to a college.",
      "You have the right to contact PathPort support at any time via WhatsApp (+65 8377 6492) or email.",
    ],
  },
  {
    area: "Complaint rights",
    items: [
      "You have the right to lodge a formal complaint with PathPort about any aspect of the service.",
      "You have the right to a response within 10 business days for most complaints.",
      "You have the right to escalate to CPE (for college-related complaints), PDPC (for data complaints), or Singapore Mediation Centre if PathPort does not resolve your complaint satisfactorily.",
      "PathPort will not retaliate against you for raising a complaint.",
    ],
  },
  {
    area: "Data rights (PDPA)",
    items: [
      "You have the right to access all personal data PathPort holds about you — request via email within 30-day response.",
      "You have the right to correct inaccurate personal data.",
      "You have the right to withdraw consent for non-essential data processing at any time.",
      "You have the right to request account deletion — subject to statutory retention obligations for financial and immigration records.",
    ],
  },
];

export default function StudentRightsPage() {
  return (
    <MarketingShell>
      <JsonLd data={breadcrumbJsonLd([{ name: "Legal Center", url: "/legal" }, { name: "Student Rights Policy", url: "/legal/student-rights" }])} />
      <Breadcrumbs trail={[{ name: "Legal Center", url: "/legal" }, { name: "Student Rights Policy", url: "/legal/student-rights" }]} />

      <PageHero
        eyebrow="Student Rights Policy"
        title="Your rights on PathPort."
        subtitle="This policy defines the specific rights you have as a student using PathPort — beyond the general protections of Singapore law. These rights are unconditional and apply from the moment you create an account."
      />

      <div className="text-white/35 font-body text-xs mb-8">Effective date: 19 June 2026</div>

      <section className="mb-12 space-y-6">
        {RIGHTS.map(section => (
          <div key={section.area}>
            <h2 className="font-display text-xl text-white mb-4 flex items-center gap-2">
              <Users className="w-4 h-4 text-gold-400" /> {section.area}
            </h2>
            <div className="space-y-2.5">
              {section.items.map(item => (
                <div key={item} className="flex items-start gap-3 p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                  <span className="text-gold-400 text-xs mt-0.5 flex-shrink-0">→</span>
                  <p className="text-white/65 font-body text-sm leading-relaxed">{item}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>

      <section className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-6">
        <h3 className="font-display text-xl text-white mb-2">If your rights are not respected</h3>
        <p className="text-white/55 font-body text-sm mb-4">Contact PathPort directly first. If you are not satisfied with the response, you may escalate to the appropriate regulatory body. PathPort will cooperate fully and never penalise a student for asserting their rights.</p>
        <div className="flex flex-wrap gap-3">
          <a href="https://wa.me/6583776492" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gold-400/10 border border-gold-400/30 text-gold-400 font-body text-sm font-semibold hover:bg-gold-400/20 transition-all">
            WhatsApp +65 8377 6492
          </a>
          <a href="mailto:pathportsg@gmail.com?subject=Student%20rights%20concern" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.05] border border-white/[0.10] text-white/70 font-body text-sm font-semibold hover:border-gold-400/30 hover:text-gold-300 transition-all">
            pathportsg@gmail.com
          </a>
        </div>
      </section>
    </MarketingShell>
  );
}
