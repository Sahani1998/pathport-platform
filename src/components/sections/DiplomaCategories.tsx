import GlassCard from "@/components/ui/GlassCard";
import SectionHeader from "@/components/ui/SectionHeader";
import Badge from "@/components/ui/Badge";
import GoldButton from "@/components/ui/GoldButton";
import Reveal from "@/components/ui/Reveal";
import { diplomaTypes } from "@/data/diploma-types";
import { Clock, GraduationCap, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export default function DiplomaCategories() {
  return (
    <section id="diplomas" className="relative py-24">
      <div className="max-w-7xl mx-auto px-5 md:px-10">
        <SectionHeader
          eyebrow="Diploma Categories"
          title="Four Pathways to Your Singapore Qualification"
          subtitle="Choose the right level for your background and career goals. All programmes are available at Singapore's leading private colleges."
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-12">
          {diplomaTypes.map((type, i) => (
            <Reveal key={type.id} delay={i * 80} className="h-full">
            <GlassCard
              gold={i === 2}
              className={cn("p-8 group relative overflow-hidden h-full", i === 2 && "shadow-gold-sm")}
            >
              {i === 2 && (
                <div aria-hidden className="absolute top-0 right-0 w-40 h-40 rounded-full bg-gold-400/[0.06] blur-[50px] pointer-events-none" />
              )}

              <div className="flex items-start gap-4 mb-5">
                {/* Level icon */}
                <div
                  className={cn(
                    "w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 text-2xl",
                    i === 2
                      ? "bg-gradient-to-br from-gold-500 to-gold-600 shadow-gold-sm"
                      : "bg-white/[0.07] border border-white/10"
                  )}
                  role="img" aria-label={type.title}
                >
                  {type.icon}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="font-display text-[1.4rem] text-white leading-tight">{type.title}</h3>
                    <Badge variant={i === 2 ? "gold" : "navy"}>{type.subtitle}</Badge>
                  </div>
                  <div className="flex items-center gap-1.5 text-white/40 font-body text-xs">
                    <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>{type.duration}</span>
                  </div>
                </div>
              </div>

              <p className="text-white/52 font-body text-sm leading-relaxed mb-4">
                {type.description}
              </p>

              {/* Fee range */}
              <div className="flex items-center gap-2 p-3 rounded-xl bg-gold-400/[0.07] border border-gold-400/20 mb-4">
                <span className="text-gold-400 text-base" aria-hidden>💰</span>
                <p className="font-body text-sm">
                  <span className="text-white/55">Course fees from </span>
                  <span className="text-gold-300 font-bold">{type.feeRange}</span>
                </p>
              </div>

              {/* Eligibility */}
              <div className="flex items-start gap-2 p-3 rounded-xl bg-white/[0.04] border border-white/[0.07] mb-4">
                <GraduationCap className="w-4 h-4 text-gold-400/70 flex-shrink-0 mt-0.5" />
                <p className="text-white/50 font-body text-xs leading-relaxed">
                  <span className="text-white/70 font-semibold">Eligibility:</span> {type.eligibility}
                </p>
              </div>

              {/* Subject examples */}
              <div className="flex flex-wrap gap-1.5 mb-5">
                {type.subjects.map(s => (
                  <Badge key={s} variant="muted">{s}</Badge>
                ))}
              </div>

              {/* CTA */}
              <div className="flex items-center gap-1 text-gold-400 font-body text-sm font-medium group-hover:gap-2 transition-all duration-200">
                <span>View Available Courses</span>
                <ChevronRight className="w-4 h-4" />
              </div>
            </GlassCard>
            </Reveal>
          ))}
        </div>

        {/* 6+6 pathway teaser */}
        <div className="text-center p-6 rounded-2xl bg-pathBlue-500/[0.06] border border-pathBlue-500/20">
          <p className="text-white/60 font-body text-base">
            💡 <span className="text-white/85">All diploma types are compatible with the</span>{" "}
            <span className="text-gold-400 font-semibold">6+6 Study + Paid Internship Pathway</span>
            <span className="text-white/85"> — study 6 months, earn 6 months.</span>
          </p>
          <GoldButton variant="outline-gold" size="sm" className="mt-4">
            Learn About 6+6
          </GoldButton>
        </div>
      </div>
    </section>
  );
}
