import type { Metadata } from "next";
import MarketingShell from "@/components/marketing/MarketingShell";
import PageHero from "@/components/marketing/PageHero";
import Breadcrumbs from "@/components/marketing/Breadcrumbs";
import JsonLd from "@/components/marketing/JsonLd";
import { breadcrumbJsonLd, faqJsonLd } from "@/lib/jsonld";

export const metadata: Metadata = {
  title: "Internship Guide for Indian Students in Singapore | PathPort",
  description: "The 6+6 internship model explained — how placement works, which industries hire interns, typical pay, and how to maximise your Singapore internship experience.",
  alternates: { canonical: "/resources/internships" },
};

const FAQS = [
  { question: "Is the internship compulsory?", answer: "Yes. The 6+6 programme structure makes the internship a compulsory component of the diploma. It is not optional. Students who do not complete the internship component do not graduate." },
  { question: "Does the college arrange the internship for me?", answer: "Yes. At PathPort-listed colleges, the internship is a managed programme — the college has employer partnerships and places students with host companies. You are not expected to find your own internship, though you may be asked to interview and accept an offer from the company." },
  { question: "Is the internship paid?", answer: "Most Singapore internships under the 6+6 framework are paid. Typical monthly allowances range from SGD 700 to SGD 1,200 depending on industry and role. This is not guaranteed and varies by employer and programme." },
  { question: "Can I choose my internship company?", answer: "Partially. Colleges have a roster of partner employers. You may be able to indicate preferences by industry or role, but final placement decisions depend on employer availability and the college's matching process." },
];

const INDUSTRIES = [
  { sector: "Hospitality & F&B", roles: "Restaurant operations, hotel front office, events coordination, food production" },
  { sector: "Business & Admin", roles: "Office administration, HR support, marketing assistant, customer service" },
  { sector: "IT & Technology", roles: "Web development, helpdesk support, data entry, IT operations" },
  { sector: "Healthcare Support", roles: "Medical clinic assistant, pharmacy support, healthcare administration" },
  { sector: "Logistics & Supply Chain", roles: "Warehouse operations, shipping coordination, procurement support" },
  { sector: "Creative & Media", roles: "Graphic design, social media management, video production, content writing" },
];

export default function InternshipsPage() {
  return (
    <MarketingShell maxWidth="narrow">
      <JsonLd data={[
        breadcrumbJsonLd([{ name: "Resources", url: "/resources" }, { name: "Internships", url: "/resources/internships" }]),
        faqJsonLd(FAQS),
      ]} />
      <Breadcrumbs trail={[{ name: "Resources", url: "/resources" }, { name: "Internships", url: "/resources/internships" }]} />

      <PageHero
        eyebrow="Internships"
        title="The 6+6 internship explained."
        subtitle="The Singapore 6+6 programme gives Indian students six months of real work experience at a Singapore company — not a mock exercise, not unpaid. Here is what to expect."
      />

      <section className="mb-10">
        <h2 className="font-display text-2xl text-white mb-4">How the 6+6 works</h2>
        <div className="relative">
          <div aria-hidden className="absolute left-[15px] top-2 bottom-2 w-px bg-gradient-to-b from-gold-400/40 via-white/10 to-transparent" />
          <div className="space-y-5">
            {[
              { n: "01", title: "Months 1–6: Classroom study", body: "You attend your diploma programme full-time — lectures, assessments, practical modules, and college-administered exams. This is your academic foundation." },
              { n: "02", title: "Months 7–12: Structured internship", body: "The college places you with a Singapore employer. You work full-time (typically 40 hours/week) in a role relevant to your field of study. Most internships are paid. The employer evaluates your performance as part of your diploma assessment." },
              { n: "03", title: "Diploma completion", body: "After successful completion of both components — academic and internship — the college awards your diploma. Some colleges hold a formal graduation ceremony." },
            ].map(s => (
              <div key={s.n} className="relative pl-10">
                <div className="absolute left-0 top-1 w-7 h-7 rounded-full bg-navy-900 border-2 border-gold-400/40 flex items-center justify-center">
                  <span className="text-gold-400 font-body text-[9px] font-bold">{s.n}</span>
                </div>
                <p className="font-body font-semibold text-white/85 text-sm mb-1">{s.title}</p>
                <p className="text-white/55 font-body text-sm leading-relaxed">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mb-10">
        <h2 className="font-display text-2xl text-white mb-4">Industries and roles</h2>
        <div className="space-y-3">
          {INDUSTRIES.map(ind => (
            <div key={ind.sector} className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
              <p className="font-body font-semibold text-white/85 text-sm mb-1">{ind.sector}</p>
              <p className="text-white/50 font-body text-sm leading-relaxed">{ind.roles}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-10">
        <h2 className="font-display text-2xl text-white mb-4">Typical internship allowance</h2>
        <div className="rounded-2xl bg-white/[0.03] border border-white/[0.07] overflow-hidden">
          {[
            { range: "SGD 700 – 900 / month", context: "Entry-level roles in F&B, hospitality, logistics" },
            { range: "SGD 900 – 1,100 / month", context: "Business admin, IT support, healthcare support" },
            { range: "SGD 1,100 – 1,400 / month", context: "Technical IT roles, finance support, some creative roles" },
          ].map((row, i) => (
            <div key={row.range} className={`flex flex-col md:flex-row gap-2 md:gap-6 p-4 ${i > 0 ? "border-t border-white/[0.05]" : ""}`}>
              <span className="text-gold-400/80 font-body font-semibold text-sm md:w-52 flex-shrink-0">{row.range}</span>
              <span className="text-white/55 font-body text-sm">{row.context}</span>
            </div>
          ))}
        </div>
        <p className="text-white/30 font-body text-xs mt-3">These are indicative ranges only. Actual allowances depend on the employer, industry, and individual negotiation. PathPort does not guarantee internship placement or specific allowance amounts.</p>
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
