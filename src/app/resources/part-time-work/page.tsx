import type { Metadata } from "next";
import { AlertTriangle } from "lucide-react";
import MarketingShell from "@/components/marketing/MarketingShell";
import PageHero from "@/components/marketing/PageHero";
import Breadcrumbs from "@/components/marketing/Breadcrumbs";
import JsonLd from "@/components/marketing/JsonLd";
import { breadcrumbJsonLd, faqJsonLd } from "@/lib/jsonld";

export const metadata: Metadata = {
  title: "Part-Time Work for Students in Singapore | PathPort",
  description: "Can you work part-time on a Singapore Student Pass? MOM rules, permitted hours, restricted activities, and what Indian students need to know.",
  alternates: { canonical: "/resources/part-time-work" },
};

const FAQS = [
  { question: "Can I work part-time while studying on a Student Pass?", answer: "Student Pass holders may work up to 16 hours per week during term time if their institution is on the Student Pass Part-Time Work Authorisation (SPPWA) framework. This is not automatic — your college must be eligible and must endorse your authorisation. Check with your college's student services team." },
  { question: "What jobs can I do part-time?", answer: "Common part-time jobs for students include retail, F&B (food and beverage service), data entry, tutoring, event staffing, and customer service. Your work must be with an employer who is registered in Singapore and pays you through legal channels (CPF contributions are not required for short-term student work, but check your contract)." },
  { question: "Can I work during holidays?", answer: "During official school vacation periods, Student Pass holders may work full-time hours. Confirm with your college what counts as an official vacation period under your programme." },
  { question: "What happens if I work illegally?", answer: "Working without authorisation on a Student Pass is a serious offence in Singapore. Penalties include cancellation of your Student Pass, deportation, and a ban from entering Singapore. Your college may also face penalties. PathPort strongly advises against unauthorised work." },
];

export default function PartTimeWorkPage() {
  return (
    <MarketingShell maxWidth="narrow">
      <JsonLd data={[
        breadcrumbJsonLd([{ name: "Resources", url: "/resources" }, { name: "Part-Time Work", url: "/resources/part-time-work" }]),
        faqJsonLd(FAQS),
      ]} />
      <Breadcrumbs trail={[{ name: "Resources", url: "/resources" }, { name: "Part-Time Work", url: "/resources/part-time-work" }]} />

      <PageHero
        eyebrow="Part-Time Work"
        title="Working part-time on a Student Pass."
        subtitle="Singapore allows eligible Student Pass holders to work part-time during term. The rules are strict and the consequences of non-compliance are serious. Here is what you need to know."
      />

      <section className="mb-8 p-5 rounded-2xl bg-white/[0.05] border border-white/[0.12]">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-gold-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-body font-semibold text-white/90 text-sm mb-1">Verify with your college first</p>
            <p className="text-white/60 font-body text-sm leading-relaxed">Part-time work authorisation depends on your specific institution and programme. Not all Student Pass holders are automatically eligible. This guide is for general information only. Always confirm the rules that apply to your specific situation with your college and MOM (Ministry of Manpower).</p>
          </div>
        </div>
      </section>

      <section className="mb-10">
        <h2 className="font-display text-2xl text-white mb-4">Part-time work rules summary</h2>
        <div className="rounded-2xl bg-white/[0.03] border border-white/[0.07] overflow-hidden">
          {[
            { rule: "Maximum hours during term", detail: "16 hours per week (if SPPWA eligible)" },
            { rule: "Hours during official vacations", detail: "Unlimited (must be official college vacation)" },
            { rule: "Eligibility requirement", detail: "College must be on SPPWA framework; individual endorsement required" },
            { rule: "Permitted work types", detail: "Most jobs excluding entertainment, security, some healthcare roles" },
            { rule: "Employer requirement", detail: "Employer must be a Singapore-registered entity" },
            { rule: "Unauthorised work penalty", detail: "Student Pass cancellation + deportation + future entry ban" },
          ].map((row, i) => (
            <div key={row.rule} className={`flex flex-col md:flex-row gap-2 md:gap-6 p-4 ${i > 0 ? "border-t border-white/[0.05]" : ""}`}>
              <span className="text-white/65 font-body text-sm md:w-60 flex-shrink-0">{row.rule}</span>
              <span className="text-white/85 font-body font-semibold text-sm">{row.detail}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-10">
        <h2 className="font-display text-2xl text-white mb-4">Frequently asked questions</h2>
        <div className="space-y-3">
          {FAQS.map(faq => (
            <details key={faq.question} className="group rounded-2xl bg-white/[0.03] border border-white/[0.07] overflow-hidden">
              <summary className="flex items-center justify-between p-5 cursor-pointer text-white/85 font-body font-semibold text-sm list-none">
                {faq.question}
                <span className="text-gold-400 group-open:rotate-45 transition-transform">+</span>
              </summary>
              <div className="px-5 pb-5">
                <p className="text-white/55 font-body text-sm leading-relaxed">{faq.answer}</p>
              </div>
            </details>
          ))}
        </div>
      </section>

      <section className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-5">
        <p className="font-body font-semibold text-white/85 text-sm mb-2">Official MOM guidance</p>
        <p className="text-white/55 font-body text-sm leading-relaxed">The authoritative source on Student Pass work rules is Singapore&apos;s Ministry of Manpower (MOM). PathPort recommends checking mom.gov.sg for the most current rules before accepting any part-time employment.</p>
      </section>
    </MarketingShell>
  );
}
