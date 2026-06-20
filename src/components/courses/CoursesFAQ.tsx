import { faqJsonLd, type FAQItem } from "@/lib/jsonld";

/**
 * CoursesFAQ — light section with concise, honest answers about Singapore
 * diploma programmes. Emits FAQPage JSON-LD for SEO. No marketing fluff —
 * facts and pointers to depth.
 */
export const COURSES_FAQS: FAQItem[] = [
  {
    question: "What is the difference between a Diploma and an Advanced Diploma?",
    answer: "A Diploma is the foundation-level qualification, typically 12–18 months. An Advanced Diploma builds directly on a Diploma — it requires a Diploma (or equivalent) as a prerequisite and adds specialised, intermediate-level training. Many students complete a Diploma first, work or intern for a year, and then return for an Advanced Diploma.",
  },
  {
    question: "How is a Higher Diploma different from a degree?",
    answer: "A Higher Diploma is the most advanced tier of Singapore's private college diploma ladder, and is often considered comparable in academic depth to the first year of a Bachelor's degree. It is awarded by a private college, not a university. Many universities in Singapore, the UK, Australia, and Canada accept Higher Diploma graduates into Year 2 or Year 3 of a degree programme (advanced standing). Acceptance is decided on a case-by-case basis by each university.",
  },
  {
    question: "What is a Specialist Diploma?",
    answer: "A Specialist Diploma is a focused, applied qualification designed for a specific industry role or technology. They are usually shorter (6–12 months) and often built for working professionals as well as fresh diploma or degree holders. Examples include Cybersecurity Operations, Digital Business Transformation, Culinary Arts, and Project Management.",
  },
  {
    question: "How much do Singapore diploma programmes cost?",
    answer: "Tuition fees at Singapore private colleges typically range from SGD 4,000 to SGD 8,000 per academic year, varying by institution, programme, and level. PathPort displays the actual published fee for each programme on its detail page. Living costs in Singapore add another SGD 800–1,200 per month.",
  },
  {
    question: "How long do diploma programmes actually take?",
    answer: "Diploma programmes typically run 12–18 months full-time; Advanced Diplomas are 12–18 months; Higher Diplomas are 18–24 months; Specialist Diplomas are 6–12 months. Actual duration varies by institution, intake schedule, and whether the programme includes an internship. Always check the duration listed on the specific course page.",
  },
  {
    question: "Do all programmes include an internship?",
    answer: "No. Internship integration varies by college and programme. Some programmes (especially in Business, Hospitality, and IT) follow Singapore's 6+6 model — six months of classroom learning followed by six months of paid internship. Others offer optional internships, and some are purely classroom-based. Each PathPort programme listing shows whether an internship is included.",
  },
  {
    question: "Can I switch to a different programme after I start?",
    answer: "Programme transfers are possible at most Singapore private colleges, subject to availability of seats and credit-recognition policies. Talk to your PathPort advisor before paying any fees if you're uncertain — switching after enrolment can affect your Student Pass and fee schedule.",
  },
  {
    question: "How do I know which programme is right for me?",
    answer: "Three honest checks: (1) does the curriculum match a career you can name, (2) does the duration and fee structure fit your budget, and (3) is the college EduTrust-certified. Beyond that, talk to a PathPort advisor — we'll walk you through the actual programme content, intake dates, and what graduates from each programme tend to do next. Free, no commitment.",
  },
];

export default function CoursesFAQ() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd(COURSES_FAQS)) }}
      />
      <section className="relative public-section-white">
        <div className="layout-prose section-airy px-5 sm:px-8">
          <div className="text-center mb-12">
            <p className="eyebrow text-pathBlue-700 mb-5">FAQs</p>
            <h2 className="display-3 text-navy-900">
              Frequently asked questions.
            </h2>
          </div>

          <div className="space-y-3">
            {COURSES_FAQS.map(({ question, answer }) => (
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
