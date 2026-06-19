import type { Metadata } from "next";
import Link from "next/link";
import MarketingShell from "@/components/marketing/MarketingShell";
import PageHero from "@/components/marketing/PageHero";
import Breadcrumbs from "@/components/marketing/Breadcrumbs";
import JsonLd from "@/components/marketing/JsonLd";
import { breadcrumbJsonLd, faqJsonLd } from "@/lib/jsonld";

export const metadata: Metadata = {
  title: "Study in Singapore — Guide for Indian Students | PathPort",
  description: "Why Singapore is a top study destination for Indian students. Diploma programmes, EduTrust colleges, 6+6 internship model, fees, and quality of life.",
  alternates: { canonical: "/resources/study-in-singapore" },
};

const FAQS = [
  { question: "Is Singapore a good study destination for Indian students?", answer: "Yes. Singapore offers English-medium private college diploma programmes that lead to real internship placements, a safe living environment, world-class infrastructure, and proximity to India. Many Indian students complete a 6+6 programme (6 months study + 6 months internship) and go on to careers in Singapore or return to India with internationally recognised credentials." },
  { question: "What is the difference between a diploma and a degree in Singapore?", answer: "Diplomas are shorter (typically 12–18 months for a full programme) and offered by private colleges. They are practical, industry-focused qualifications. Degrees are 3–4 years and offered by universities. For Indian students looking to enter the workforce quickly or pursue a specific vocational field, a Singapore private college diploma is often the more cost-effective and career-relevant choice." },
  { question: "What is EduTrust certification?", answer: "EduTrust is Singapore's quality assurance framework for private education institutions, administered by CPE (Committee for Private Education). All PathPort-listed colleges hold EduTrust certification, which means they meet Singapore government standards for governance, academic quality, financial transparency, and student welfare." },
  { question: "What is the 6+6 internship model?", answer: "The 6+6 programme structure combines 6 months of classroom learning with 6 months of structured internship at a Singapore company. The internship is part of the curriculum, not optional. This gives Indian students real Singapore work experience and often leads to employment offers upon completion." },
];

export default function StudyInSingaporePage() {
  return (
    <MarketingShell maxWidth="narrow">
      <JsonLd data={[
        breadcrumbJsonLd([{ name: "Resources", url: "/resources" }, { name: "Study in Singapore", url: "/resources/study-in-singapore" }]),
        faqJsonLd(FAQS),
      ]} />
      <Breadcrumbs trail={[{ name: "Resources", url: "/resources" }, { name: "Study in Singapore", url: "/resources/study-in-singapore" }]} />

      <PageHero
        eyebrow="Study in Singapore"
        title="Why Indian students choose Singapore."
        subtitle="Singapore offers a unique combination of English-medium education, structured internship programmes, safety, and career access. Here is what you need to know before deciding."
      />

      <section className="mb-10">
        <h2 className="font-display text-2xl text-white mb-4">Why Singapore</h2>
        <div className="space-y-3">
          {[
            { title: "English is the medium of instruction", body: "All courses at PathPort-listed colleges are taught in English. You do not need to learn a new language to study in Singapore — English proficiency tests may be required for admission." },
            { title: "6+6 means real work experience", body: "The 6+6 internship structure is a Singapore private college hallmark. Six months of classroom instruction is followed by six months of structured internship in Singapore — not a mock exercise, but paid work at a real company in your field." },
            { title: "Globally recognised credentials", body: "Singapore diplomas from EduTrust-certified colleges are recognised internationally. Many students use their Singapore diploma to enter the workforce in Singapore, the UAE, Australia, or to pursue further education globally." },
            { title: "Safe, walkable, world-class city", body: "Singapore consistently ranks as one of the world's safest cities. Public transport is excellent. Healthcare standards are very high. For Indian families concerned about their child's safety abroad, Singapore is one of the most reassuring destinations." },
            { title: "Large Indian community", body: "Singapore has a significant Indian diaspora. Little India in Tekka is home to Indian restaurants, grocers, temples, and community organisations. You will not feel isolated." },
            { title: "Proximity to India", body: "Singapore is 4–6 hours from most Indian cities by flight. Direct flights operate from Chennai, Mumbai, Delhi, Bengaluru, Hyderabad, Kolkata, and Kochi. This makes visits home practical and emergency travel manageable." },
          ].map(item => (
            <div key={item.title} className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.07]">
              <p className="font-body font-semibold text-white/90 text-sm mb-1.5">{item.title}</p>
              <p className="text-white/55 font-body text-sm leading-relaxed">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-10">
        <h2 className="font-display text-2xl text-white mb-4">What to study</h2>
        <p className="text-white/60 font-body text-sm leading-relaxed mb-4">PathPort lists diploma, advanced diploma, higher diploma, and specialist diploma programmes across business, hospitality, IT, engineering, healthcare management, and creative disciplines. Use the course directory to compare programmes by subject, duration, fees, and internship structure.</p>
        <Link href="/courses" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gold-400/10 border border-gold-400/30 text-gold-400 font-body text-sm font-semibold hover:bg-gold-400/20 transition-all">
          Browse courses →
        </Link>
      </section>

      <section className="mb-10">
        <h2 className="font-display text-2xl text-white mb-4">Cost of study</h2>
        <p className="text-white/60 font-body text-sm leading-relaxed mb-4">Total cost varies by college and programme. As a rough guide for planning purposes (not a PathPort commitment):</p>
        <div className="rounded-2xl bg-white/[0.03] border border-white/[0.07] overflow-hidden">
          {[
            { item: "Tuition fee (full programme)", cost: "SGD 6,000 – 15,000 / INR 3.7L – 9.4L" },
            { item: "Accommodation (per month)", cost: "SGD 600 – 1,200 / INR 37,000 – 75,000" },
            { item: "Food and transport (per month)", cost: "SGD 400 – 700 / INR 25,000 – 44,000" },
            { item: "Insurance (annual)", cost: "SGD 200 – 400 / INR 12,500 – 25,000" },
            { item: "Student Pass fee (ICA)", cost: "SGD 30 – 60 (one-time)" },
          ].map((row, i) => (
            <div key={row.item} className={`flex flex-col md:flex-row gap-2 md:gap-6 p-4 ${i > 0 ? "border-t border-white/[0.05]" : ""}`}>
              <span className="text-white/65 font-body text-sm md:w-64 flex-shrink-0">{row.item}</span>
              <span className="text-gold-400/80 font-body text-sm">{row.cost}</span>
            </div>
          ))}
        </div>
        <p className="text-white/30 font-body text-xs mt-3">INR figures use approximate SGD/INR rates and are for planning only. Verify current rates before budgeting.</p>
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
