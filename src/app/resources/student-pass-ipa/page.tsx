import type { Metadata } from "next";
import MarketingShell from "@/components/marketing/MarketingShell";
import PageHero from "@/components/marketing/PageHero";
import Breadcrumbs from "@/components/marketing/Breadcrumbs";
import JsonLd from "@/components/marketing/JsonLd";
import { breadcrumbJsonLd, faqJsonLd } from "@/lib/jsonld";

export const metadata: Metadata = {
  title: "Singapore Student Pass & IPA Guide for Indian Students | PathPort",
  description: "Complete guide to the Singapore Student Pass (IPA). Who submits it, how long it takes, what the IPA document is, and what to do when it arrives.",
  alternates: { canonical: "/resources/student-pass-ipa" },
};

const FAQS = [
  { question: "Who submits the Student Pass application to ICA?", answer: "Your enrolled college submits the Student Pass / IPA application to ICA Singapore through their official ICA systems. PathPort does not submit to ICA. Only accredited Singapore institutions can do this." },
  { question: "How long does IPA processing take?", answer: "ICA typically processes Student Pass / IPA applications within 4–8 weeks. Processing times vary by nationality, time of year, and application completeness. PathPort tracks your IPA status and notifies you of any updates from your college." },
  { question: "What is an IPA?", answer: "IPA stands for In-Principle Approval. It is the document issued by ICA that confirms Singapore is prepared to issue you a Student Pass. You need the IPA to travel to Singapore and complete your Student Pass enrolment at ICA after arrival." },
  { question: "What happens if my IPA is rejected?", answer: "ICA does not typically provide reasons for rejection. Your college will be notified. PathPort will share the rejection notice with you and help connect you with your college's admissions team to discuss options — this may include reapplication, addressing documentation gaps, or applying to a different programme." },
];

const TIMELINE = [
  { step: "Application submitted to college", notes: "Student submits application on PathPort; college receives it via institution portal" },
  { step: "Offer letter issued", notes: "College reviews and issues offer letter — typically within 3–7 business days" },
  { step: "Student pays first invoice", notes: "Student transfers fees and uploads payment proof on PathPort" },
  { step: "Payment verified", notes: "PathPort verifies payment proof; college receives notification" },
  { step: "College submits IPA to ICA", notes: "College submits Student Pass application through official ICA systems" },
  { step: "ICA processing", notes: "Typically 4–8 weeks — PathPort tracks and notifies of updates" },
  { step: "IPA issued and uploaded", notes: "College receives IPA from ICA, uploads to PathPort dashboard" },
  { step: "Student applies for visa / SG Arrival Card", notes: "Student uses IPA to apply for visa at Singapore embassy or SG Arrival Card online" },
  { step: "Arrival in Singapore", notes: "Present IPA at immigration; college completes Student Pass enrolment" },
];

export default function StudentPassIpaPage() {
  return (
    <MarketingShell maxWidth="narrow">
      <JsonLd data={[
        breadcrumbJsonLd([{ name: "Resources", url: "/resources" }, { name: "Student Pass & IPA", url: "/resources/student-pass-ipa" }]),
        faqJsonLd(FAQS),
      ]} />
      <Breadcrumbs trail={[{ name: "Resources", url: "/resources" }, { name: "Student Pass & IPA", url: "/resources/student-pass-ipa" }]} />

      <PageHero
        eyebrow="Student Pass & IPA"
        title="Understanding the Singapore Student Pass."
        subtitle="The Student Pass is a legal requirement for international students studying in Singapore. This guide explains every step — including the critical fact that your college, not PathPort, submits your application."
      />

      <section className="mb-10 p-5 rounded-2xl bg-gold-400/[0.06] border border-gold-400/20">
        <p className="text-white/75 font-body text-sm leading-relaxed">
          <strong className="text-white">Important:</strong> The IPA / Student Pass application is submitted to ICA Singapore by your enrolled college through their official ICA-accredited systems. PathPort tracks the submission status and notifies you of updates. PathPort does not submit to ICA.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="font-display text-2xl text-white mb-4">What is a Student Pass?</h2>
        <p className="text-white/60 font-body text-sm leading-relaxed mb-4">A Singapore Student Pass is a visa issued by ICA (Immigration and Checkpoints Authority) that permits you to reside in Singapore for the duration of your approved course. You must hold a valid Student Pass at all times while studying. The pass is typically tied to your enrolment at a specific college and is renewed annually.</p>
        <p className="text-white/60 font-body text-sm leading-relaxed">The IPA (In-Principle Approval) is the pre-approval document issued before you arrive. You travel to Singapore with your IPA; once there, your college completes the full Student Pass enrolment at ICA.</p>
      </section>

      <section className="mb-10">
        <h2 className="font-display text-2xl text-white mb-5">IPA process timeline</h2>
        <div className="relative">
          <div aria-hidden className="absolute left-[15px] top-2 bottom-2 w-px bg-gradient-to-b from-gold-400/40 via-white/10 to-transparent" />
          <div className="space-y-4">
            {TIMELINE.map((item, i) => (
              <div key={item.step} className="relative pl-10">
                <div className="absolute left-0 top-1 w-7 h-7 rounded-full bg-navy-900 border-2 border-gold-400/40 flex items-center justify-center">
                  <span className="text-gold-400 font-body text-[9px] font-bold">{i + 1}</span>
                </div>
                <p className="font-body font-semibold text-white/85 text-sm mb-0.5">{item.step}</p>
                <p className="text-white/45 font-body text-xs leading-relaxed">{item.notes}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mb-10">
        <h2 className="font-display text-2xl text-white mb-4">Documents required for IPA</h2>
        <div className="rounded-2xl bg-white/[0.03] border border-white/[0.07] overflow-hidden">
          {[
            { doc: "Valid passport (min. 6 months validity)", supplied: "Student" },
            { doc: "Recent passport photograph (white background)", supplied: "Student" },
            { doc: "Academic transcripts and certificates", supplied: "Student" },
            { doc: "Proof of English proficiency (if required)", supplied: "Student" },
            { doc: "Acceptance letter / offer letter from college", supplied: "College" },
            { doc: "Completed student application form", supplied: "College submits to ICA" },
          ].map((row, i) => (
            <div key={row.doc} className={`flex flex-col md:flex-row gap-2 md:gap-6 p-4 ${i > 0 ? "border-t border-white/[0.05]" : ""}`}>
              <span className="text-white/65 font-body text-sm flex-1">{row.doc}</span>
              <span className="text-white/35 font-body text-xs">{row.supplied}</span>
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
    </MarketingShell>
  );
}
