import { faqJsonLd, type FAQItem } from "@/lib/jsonld";

/**
 * CollegesFAQ — light section with concise, honest answers about Singapore
 * private colleges. Emits FAQPage JSON-LD for SEO. No marketing fluff —
 * facts and links to depth.
 */
export const COLLEGES_FAQS: FAQItem[] = [
  {
    question: "What is a Singapore private college?",
    answer: "A Singapore private college is an independent institution regulated by the Committee for Private Education (CPE) under SkillsFuture Singapore. They specialise in industry-focused diploma and advanced diploma programmes, not full university degrees. CPE registration is mandatory — institutions without it cannot legally enrol international students.",
  },
  {
    question: "Are Singapore private college diplomas recognised in India?",
    answer: "Recognition depends on the specific qualification and employer. Diplomas from EduTrust-certified Singapore colleges are generally well-regarded by Indian employers in IT, hospitality, business, and finance. For onward higher education in India, recognition is decided case-by-case by individual universities and the AIU.",
  },
  {
    question: "What is EduTrust certification?",
    answer: "EduTrust is Singapore's quality assurance framework for private education institutions, administered by CPE. It audits academic governance, financial soundness, and student welfare on a regular cycle. Every college on PathPort holds EduTrust certification — we do not list institutions without it.",
  },
  {
    question: "What is the typical fee range for a diploma?",
    answer: "Tuition fees at Singapore private colleges typically range from SGD 4,000 to SGD 8,000 per academic year, depending on the institution and programme. Living costs in Singapore add another SGD 800–1,200 per month. PathPort advisors can help match your budget to colleges that fit.",
  },
  {
    question: "Can I work part-time while studying on a Student Pass?",
    answer: "Singapore's Ministry of Manpower allows full-time international Student Pass holders enrolled at approved institutions to work up to 16 hours per week during term and full-time during holidays, subject to specific conditions. Always confirm eligibility with your college and check current MOM rules before taking up work.",
  },
  {
    question: "What happens after I graduate from a Singapore diploma?",
    answer: "Three common paths: advanced standing entry into a degree programme (in Singapore, the UK, Australia, or back in India); direct employment in Singapore or returning to India with international credentials; or further specialisation via Advanced Diploma, Higher Diploma, or Specialist Diploma programmes.",
  },
  {
    question: "How long does the application process take?",
    answer: "PathPort typically secures a conditional offer letter within 24 hours of submitting a complete application. The Student Pass / IPA application is then submitted by your enrolled college to ICA Singapore and usually takes 2–4 weeks. Total timeline from registration to arrival is generally 6–10 weeks.",
  },
  {
    question: "Does PathPort charge a fee to students?",
    answer: "No. PathPort does not charge students a placement or registration fee. Our services — application support, document preparation, IPA tracking, and arrival concierge — are free to students. Colleges and partners cover our operating costs.",
  },
];

export default function CollegesFAQ() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd(COLLEGES_FAQS)) }}
      />
      <section className="relative public-section-white">
        <div className="max-w-3xl mx-auto px-5 md:px-10 py-20">
          <div className="text-center mb-12">
            <p className="text-pathBlue-700 font-body text-xs font-semibold tracking-[0.22em] uppercase mb-4">
              FAQs
            </p>
            <h2 className="font-display text-3xl md:text-4xl text-navy-900 leading-[1.1]">
              Frequently asked questions.
            </h2>
          </div>

          <div className="space-y-3">
            {COLLEGES_FAQS.map(({ question, answer }) => (
              <details
                key={question}
                className="group p-5 rounded-2xl bg-white border border-slate-200 hover:border-pathBlue-500/30 transition-colors"
              >
                <summary className="cursor-pointer list-none flex items-start justify-between gap-4">
                  <span className="font-body font-semibold text-navy-900 text-sm md:text-base leading-snug">
                    {question}
                  </span>
                  <span
                    aria-hidden
                    className="flex-shrink-0 w-6 h-6 rounded-full bg-pathBlue-500/10 border border-pathBlue-500/25 text-pathBlue-700 flex items-center justify-center font-body text-base leading-none group-open:rotate-45 transition-transform"
                  >
                    +
                  </span>
                </summary>
                <p className="mt-3 text-navy-800/65 font-body text-sm leading-relaxed">
                  {answer}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
