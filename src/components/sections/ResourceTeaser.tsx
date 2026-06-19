import Link from "next/link";
import Reveal from "@/components/ui/Reveal";
import { BookOpen, CreditCard, Briefcase, ArrowRight } from "lucide-react";

/**
 * ResourceTeaser — links the homepage out to the deeper Resource Center.
 * Keeps the homepage short while ensuring the detailed guides get internal
 * link equity. Three highest-intent categories surfaced here.
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
    <section id="resources" className="relative py-20 overflow-hidden">
      <div aria-hidden className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/[0.07] to-transparent" />

      <div className="max-w-7xl mx-auto px-5 md:px-10">
        <Reveal className="text-center mb-12">
          <p className="inline-flex items-center gap-3 text-gold-400 font-body text-xs font-semibold tracking-[0.22em] uppercase mb-4">
            <span className="w-8 h-px bg-gold-400/50 rounded-full" />
            Resource Center
            <span className="w-8 h-px bg-gold-400/50 rounded-full" />
          </p>
          <h2 className="font-display text-4xl md:text-5xl text-white mb-4 leading-[1.08]">
            Everything you need to{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold-400 to-gold-300">
              plan with confidence.
            </span>
          </h2>
          <p className="text-white/50 font-body text-lg max-w-2xl mx-auto leading-relaxed">
            Practical, India-specific guides written for students and parents — free to read.
          </p>
        </Reveal>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
          {RESOURCES.map(({ Icon, title, desc, href }, i) => (
            <Reveal key={title} delay={i * 80} className="h-full">
              <Link
                href={href}
                className="group flex flex-col h-full p-6 rounded-2.5xl bg-white/[0.04] border border-white/[0.08] hover:border-gold-400/30 hover:bg-white/[0.05] transition-all duration-300 hover:-translate-y-0.5"
              >
                <div className="w-11 h-11 rounded-xl bg-gold-400/10 border border-gold-400/25 flex items-center justify-center text-gold-400 mb-4">
                  <Icon className="w-5 h-5" strokeWidth={1.75} />
                </div>
                <h3 className="font-body font-semibold text-white text-base mb-2 leading-snug">{title}</h3>
                <p className="text-white/48 font-body text-sm leading-relaxed mb-4 flex-1">{desc}</p>
                <span className="inline-flex items-center gap-1.5 text-gold-400 font-body text-xs font-semibold group-hover:gap-2.5 transition-all">
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
            className="inline-flex items-center gap-2 text-gold-400 hover:text-gold-300 font-body text-sm font-semibold transition-colors"
          >
            Browse all resources
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
