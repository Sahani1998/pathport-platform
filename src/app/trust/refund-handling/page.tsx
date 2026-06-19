import type { Metadata } from "next";
import MarketingShell from "@/components/marketing/MarketingShell";
import PageHero from "@/components/marketing/PageHero";
import Breadcrumbs from "@/components/marketing/Breadcrumbs";
import JsonLd from "@/components/marketing/JsonLd";
import { breadcrumbJsonLd } from "@/lib/jsonld";

export const metadata: Metadata = {
  title: "Refund Handling | PathPort Trust Center",
  description: "PathPort's refund policy — when refunds apply, how to request one, and what to do after a Student Pass rejection or course cancellation.",
  alternates: { canonical: "/trust/refund-handling" },
};

const SCENARIOS = [
  {
    scenario: "ICA rejects your Student Pass / IPA application",
    who: "College",
    outcome: "Refund eligibility is determined by the college's refund policy. Singapore's CPE requires EduTrust-certified institutions to publish a standard student contract that specifies refund conditions for visa refusal. PathPort will provide a copy of the relevant clause if requested.",
  },
  {
    scenario: "College cancels a course after you have paid",
    who: "College",
    outcome: "A full refund of tuition paid is required under CPE EduTrust conditions. PathPort will facilitate the refund request and follow up with the college on your behalf if a refund is not issued within 30 days.",
  },
  {
    scenario: "You withdraw before the course start date",
    who: "Student",
    outcome: "Refund amounts depend on the college's standard student contract and the notice period given. PathPort will share the relevant clause from your contract. Most EduTrust contracts specify a refund of 50–90% if withdrawal is 30+ days before start.",
  },
  {
    scenario: "You withdraw after the course has started",
    who: "Student",
    outcome: "Refunds after course commencement are unlikely under most EduTrust contracts. PathPort will share the relevant clause but cannot override the college's published policy.",
  },
  {
    scenario: "You were charged an incorrect amount",
    who: "PathPort",
    outcome: "If PathPort determines that an invoice amount does not match the published fee and no course-specific adjustment was communicated, PathPort will raise the discrepancy with the college immediately and facilitate a correction or refund of the overcharged amount.",
  },
];

export default function RefundHandlingPage() {
  return (
    <MarketingShell>
      <JsonLd data={breadcrumbJsonLd([{ name: "Trust Center", url: "/trust" }, { name: "Refund Handling", url: "/trust/refund-handling" }])} />
      <Breadcrumbs trail={[{ name: "Trust Center", url: "/trust" }, { name: "Refund Handling", url: "/trust/refund-handling" }]} />

      <PageHero
        eyebrow="Refund Handling"
        title="What happens when you need a refund."
        subtitle="PathPort does not process payments — so PathPort does not issue refunds. Refunds come from the college. PathPort&apos;s role is to facilitate, document, and follow up on your behalf."
      />

      <section className="mb-10 p-5 rounded-2xl bg-gold-400/[0.06] border border-gold-400/20">
        <p className="text-white/75 font-body text-sm leading-relaxed">
          <strong className="text-white">Important:</strong> All Singapore private colleges listed on PathPort must be EduTrust certified by CPE. EduTrust certification requires colleges to use a standard student contract that includes defined refund clauses. PathPort requires each institution to provide PathPort with a copy of their standard student contract before listing.
        </p>
      </section>

      <section className="mb-12">
        <h2 className="font-display text-2xl text-white mb-5">Refund scenarios</h2>
        <div className="space-y-3">
          {SCENARIOS.map(s => (
            <div key={s.scenario} className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.07]">
              <div className="flex items-center gap-2 mb-2">
                <p className="font-body font-semibold text-white/90 text-sm">{s.scenario}</p>
                <span className="px-2 py-0.5 rounded-full bg-white/[0.06] border border-white/[0.10] text-white/40 font-body text-[10px] uppercase tracking-widest flex-shrink-0">Responsibility: {s.who}</span>
              </div>
              <p className="text-white/55 font-body text-sm leading-relaxed">{s.outcome}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-12">
        <h2 className="font-display text-2xl text-white mb-5">How to request a refund</h2>
        <div className="space-y-3">
          {[
            { n: "1", text: "Contact PathPort via WhatsApp (+65 8377 6492) or email (pathportsg@gmail.com) with your name, application ID, and the reason for the refund request." },
            { n: "2", text: "PathPort will retrieve your signed student contract from the institution and identify the applicable refund clause." },
            { n: "3", text: "PathPort will contact the college on your behalf and log the refund request in your application timeline." },
            { n: "4", text: "The college is expected to respond within 10 business days. If no response is received, PathPort will escalate and document the delay." },
            { n: "5", text: "Refunds are paid by the college to the bank account you specify. PathPort does not transfer money — we facilitate and document the process." },
          ].map(step => (
            <div key={step.n} className="flex items-start gap-4 p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
              <span className="w-7 h-7 rounded-full bg-gold-400/10 border border-gold-400/25 text-gold-400 font-body text-xs font-bold flex items-center justify-center flex-shrink-0">{step.n}</span>
              <p className="text-white/60 font-body text-sm leading-relaxed">{step.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-6">
        <h3 className="font-display text-xl text-white mb-2">CPE Consumer Alert</h3>
        <p className="text-white/55 font-body text-sm leading-relaxed">Singapore&apos;s CPE operates a consumer alert list for problematic private education institutions. If you believe a PathPort-listed college has refused a valid refund, PathPort will assist you in filing a complaint with CPE. Contact us at pathportsg@gmail.com.</p>
      </section>
    </MarketingShell>
  );
}
