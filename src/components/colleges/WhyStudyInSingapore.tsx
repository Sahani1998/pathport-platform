import Reveal from "@/components/ui/Reveal";
import { ShieldCheck, Languages, Briefcase, TrendingUp } from "lucide-react";

/**
 * WhyStudyInSingapore — light soft-blue band. 4 reasons cards.
 * Concise; the full guide lives on /resources/study-in-singapore.
 */
const REASONS = [
  {
    Icon: ShieldCheck,
    title: "One of Asia's safest cities",
    desc: "Low crime, walkable neighbourhoods, and reliable public transport at any hour. Real peace of mind for families back home.",
  },
  {
    Icon: Languages,
    title: "100% English medium",
    desc: "Classes, work, daily life — all in English. No language barrier from day one for Indian students.",
  },
  {
    Icon: Briefcase,
    title: "6+6 internship model",
    desc: "Many programmes pair 6 months of classroom study with a 6-month paid internship — real experience, real earnings.",
  },
  {
    Icon: TrendingUp,
    title: "Career and PR pathways",
    desc: "Singapore diplomas open doors across ASEAN, the Indian job market, and Singapore PR options post-graduation.",
  },
];

export default function WhyStudyInSingapore() {
  return (
    <section className="relative public-section-blue">
      <div className="max-w-7xl mx-auto px-5 md:px-10 py-20">
        <Reveal className="text-center mb-12">
          <p className="text-gold-700 font-body text-xs font-semibold tracking-[0.22em] uppercase mb-4">
            Why Singapore
          </p>
          <h2 className="font-display text-3xl md:text-4xl text-navy-900 leading-[1.1] max-w-2xl mx-auto">
            Why Indian families pick Singapore for higher education.
          </h2>
        </Reveal>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {REASONS.map(({ Icon, title, desc }, i) => (
            <Reveal key={title} delay={i * 80} className="h-full">
              <div className="h-full p-6 rounded-2.5xl public-card public-card-hover">
                <div className="w-11 h-11 rounded-xl bg-pathBlue-500/10 border border-pathBlue-500/25 text-pathBlue-700 flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5" strokeWidth={1.75} />
                </div>
                <h3 className="font-body font-semibold text-navy-900 text-base mb-2 leading-snug">{title}</h3>
                <p className="text-navy-800/60 font-body text-sm leading-relaxed">{desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
