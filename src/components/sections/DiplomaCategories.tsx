import SectionHeader from "@/components/ui/SectionHeader";
import GoldButton from "@/components/ui/GoldButton";
import Reveal from "@/components/ui/Reveal";
import { diplomaTypes } from "@/data/diploma-types";
import { Clock, GraduationCap, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export default function DiplomaCategories() {
  return (
    <section id="diplomas" className="relative py-24 public-section-white">
      <div className="max-w-7xl mx-auto px-5 md:px-10">
        <SectionHeader
          dark
          eyebrow="Diploma Categories"
          title="Four Pathways to Your Singapore Qualification"
          subtitle="Choose the right level for your background and career goals. All programmes are available at Singapore's leading private colleges."
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-12">
          {diplomaTypes.map((type, i) => (
            <Reveal key={type.id} delay={i * 80} className="h-full">
              <div
                className={cn(
                  "p-8 group relative overflow-hidden h-full rounded-2.5xl public-card public-card-hover",
                  i === 2 && "ring-1 ring-gold-400/40"
                )}
              >
                {i === 2 && (
                  <div aria-hidden className="absolute top-0 right-0 w-40 h-40 rounded-full bg-gold-400/[0.10] blur-[50px] pointer-events-none" />
                )}

                <div className="flex items-start gap-4 mb-5">
                  {/* Level icon */}
                  <div
                    className={cn(
                      "w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 text-2xl",
                      i === 2
                        ? "bg-gradient-to-br from-gold-500 to-gold-600 shadow-gold-sm"
                        : "bg-navy-900/5 border border-navy-900/10"
                    )}
                    role="img" aria-label={type.title}
                  >
                    {type.icon}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="font-display text-[1.4rem] text-navy-900 leading-tight">{type.title}</h3>
                      <span className={cn(
                        "inline-flex items-center px-2.5 py-0.5 rounded-full font-body text-xs font-semibold tracking-wide leading-none border",
                        i === 2
                          ? "bg-gold-400/15 text-gold-700 border-gold-400/40"
                          : "bg-pathBlue-500/10 text-pathBlue-700 border-pathBlue-500/25"
                      )}>
                        {type.subtitle}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-navy-800/50 font-body text-xs">
                      <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>{type.duration}</span>
                    </div>
                  </div>
                </div>

                <p className="text-navy-800/65 font-body text-sm leading-relaxed mb-4">
                  {type.description}
                </p>

                {/* Fee range */}
                <div className="flex items-center gap-2 p-3 rounded-xl bg-gold-400/[0.10] border border-gold-400/30 mb-4">
                  <span className="text-gold-600 text-base" aria-hidden>💰</span>
                  <p className="font-body text-sm">
                    <span className="text-navy-800/65">Course fees from </span>
                    <span className="text-gold-700 font-bold">{type.feeRange}</span>
                  </p>
                </div>

                {/* Eligibility */}
                <div className="flex items-start gap-2 p-3 rounded-xl bg-navy-900/[0.03] border border-navy-900/10 mb-4">
                  <GraduationCap className="w-4 h-4 text-gold-600/70 flex-shrink-0 mt-0.5" />
                  <p className="text-navy-800/60 font-body text-xs leading-relaxed">
                    <span className="text-navy-900 font-semibold">Eligibility:</span> {type.eligibility}
                  </p>
                </div>

                {/* Subject examples */}
                <div className="flex flex-wrap gap-1.5 mb-5">
                  {type.subjects.map(s => (
                    <span key={s} className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-navy-900/5 text-navy-800/60 border border-navy-900/10 font-body text-xs font-semibold leading-none">
                      {s}
                    </span>
                  ))}
                </div>

                {/* CTA */}
                <div className="flex items-center gap-1 text-pathBlue-700 font-body text-sm font-medium group-hover:gap-2 transition-all duration-200">
                  <span>View Available Courses</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            </Reveal>
          ))}
        </div>

        {/* 6+6 pathway teaser */}
        <div className="text-center p-6 rounded-2xl bg-pathBlue-500/[0.06] border border-pathBlue-500/20">
          <p className="text-navy-800/65 font-body text-base">
            💡 <span className="text-navy-900">All diploma types are compatible with the</span>{" "}
            <span className="text-gold-700 font-semibold">6+6 Study + Paid Internship Pathway</span>
            <span className="text-navy-900"> — study 6 months, earn 6 months.</span>
          </p>
          <GoldButton variant="solid-gold" size="sm" className="mt-4">
            Learn About 6+6
          </GoldButton>
        </div>
      </div>
    </section>
  );
}
