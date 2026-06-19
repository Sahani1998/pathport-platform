import Link from "next/link";
import Reveal from "@/components/ui/Reveal";
import { BookOpen, CreditCard, Briefcase, ArrowRight } from "lucide-react";

/**
 * ResourceTeaser — links the homepage out to the deeper Resource Center.
 * Keeps the homepage short while ensuring the detailed guides get internal
 * link equity. Light public theme (white section, navy text).
 */
const RESOURCES = [
  {
    Icon: BookOpen,
    title: "Study in Singapore",
    desc: "Diploma vs degree, EduTrust colleges, fees, and the 6+6 internship model explained.",
    href: "/resources/study-in-singapore",
  },
  {
    Icon: CreditCard,
    title: "Student Pass & IPA",
    desc: "How the Student Pass and In-Principle Approval work, and what documents you need.",
    href: "/resources/student-pass-ipa",
  },
  {
    Icon: Briefcase,
    title: "Internships & Careers",
    desc: "The paid internship pathway, work options, and where a Singapore diploma can take you.",
    href: "/resources/internships",
  },
];

export default function ResourceTeaser() {
  return (
    <section id="resources" className="relative py-20 public-section-white">
      <div className="max-w-7xl mx-auto px-5 md:px-10">
        <Reveal className="text-center mb-12">
          <p className="inline-flex items-center gap-3 text-gold-700 font-body text-xs font-semibold tracking-[0.22em] uppercase mb-4">
            <span className="w-8 h-px bg-gold-600/40 rounded-full" />
            Resource Center
            <span className="w-8 h-px bg-gold-600/40 rounded-full" />
          </p>
          <h2 className="font-display text-4xl md:text-5xl text-navy-900 mb-4 leading-[1.08]">
            Everything you need to{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold-600 to-gold-500">
              plan with confidence.
            </span>
          </h2>
          <p className="text-navy-800/60 font-body text-lg max-w-2xl mx-auto leading-relaxed">
            Practical, India-specific guides written for students and parents — free to read.
          </p>
        </Reveal>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
          {RESOURCES.map(({ Icon, title, desc, href }, i) => (
            <Reveal key={title} delay={i * 80} className="h-full">
              <Link
                href={href}
                className="group flex flex-col h-full p-6 rounded-2.5xl public-card public-card-hover"
              >
                <div className="w-11 h-11 rounded-xl bg-gold-400/15 border border-gold-400/30 flex items-center justify-center text-gold-600 mb-4">
                  <Icon className="w-5 h-5" strokeWidth={1.75} />
                </div>
                <h3 className="font-body font-semibold text-navy-900 text-base mb-2 leading-snug">{title}</h3>
                <p className="text-navy-800/55 font-body text-sm leading-relaxed mb-4 flex-1">{desc}</p>
                <span className="inline-flex items-center gap-1.5 text-pathBlue-700 font-body text-xs font-semibold group-hover:gap-2.5 transition-all">
                  Read guide
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </Link>
            </Reveal>
          ))}
        </div>

        <div className="text-center">
          <Link
            href="/resources"
            className="inline-flex items-center gap-2 text-pathBlue-700 hover:text-pathBlue-600 font-body text-sm font-semibold transition-colors"
          >
            Browse all resources
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
