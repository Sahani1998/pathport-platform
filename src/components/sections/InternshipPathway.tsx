import GlassCard from "@/components/ui/GlassCard";
import SectionHeader from "@/components/ui/SectionHeader";
import Badge from "@/components/ui/Badge";
import { BookOpen, Briefcase, TrendingUp, ArrowDown, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = [
  {
    phase: "Phase 1",
    duration: "Months 1 – 6",
    title: "Study in Singapore",
    description:
      "Enroll in your chosen Singapore private college diploma programme. Build academic knowledge, English fluency, and cultural adaptation in one of Asia's most welcoming cities for Indian students.",
    outcomes: [
      "Diploma credits accumulation",
      "Singapore Student Pass (STP)",
      "Access to campus facilities & resources",
      "Indian student community & peer network",
    ],
    icon: BookOpen,
    highlight: false,
  },
  {
    phase: "Phase 2",
    duration: "Months 7 – 12",
    title: "Earn with a Paid Internship",
    description:
      "Secure a 6-month paid internship with PathPort's employer partners in Singapore. Real industry experience, real earnings, and a professional reference that sets your CV apart.",
    outcomes: [
      "S$800 – S$1,500 / month stipend",
      "Industry mentorship & training",
      "Professional reference letter",
      "Build your Singapore professional network",
    ],
    icon: Briefcase,
    highlight: true,
  },
  {
    phase: "Phase 3",
    duration: "After Month 12",
    title: "Advance Your Career or Studies",
    description:
      "With a Singapore qualification and international work experience, you can progress to an Advanced Diploma, Higher Diploma, or pursue degree entry at partner universities with advanced standing.",
    outcomes: [
      "Pathway to Advanced / Higher Diploma",
      "University advanced-standing entry",
      "Singapore PR pathway eligibility",
      "Continued employment options",
    ],
    icon: TrendingUp,
    highlight: false,
  },
];

export default function InternshipPathway() {
  return (
    <section id="pathway" className="relative py-24 overflow-hidden">
      <div aria-hidden className="absolute inset-0 bg-gradient-to-b from-transparent via-navy-800/25 to-transparent pointer-events-none" />

      <div className="max-w-7xl mx-auto px-5 md:px-10">
        <SectionHeader
          eyebrow="6+6 Study + Internship Pathway"
          title="Study 6 Months. Earn 6 Months."
          subtitle="PathPort's signature 6+6 pathway lets Indian students study and earn simultaneously in Singapore — gaining both a qualification and real work experience."
        />

        <div className="max-w-4xl mx-auto space-y-4">
          {STEPS.map((step, i) => {
            const Icon = step.icon;
            return (
              <div key={step.phase}>
                <GlassCard gold={step.highlight} className={cn("p-8 md:p-10 relative overflow-hidden", step.highlight && "shadow-gold-sm")} hover={false}>
                  {step.highlight && (
                    <>
                      <div aria-hidden className="absolute -top-20 -right-20 w-60 h-60 rounded-full bg-gold-400/[0.07] blur-[70px] pointer-events-none" />
                      <div className="absolute top-5 right-5">
                        <Badge variant="gold" className="text-[10px] tracking-[0.15em]">⭐ SIGNATURE FEATURE</Badge>
                      </div>
                    </>
                  )}

                  <div className="flex flex-col md:flex-row gap-7">
                    <div className="flex-shrink-0">
                      <div className={cn(
                        "w-16 h-16 rounded-2xl flex items-center justify-center",
                        step.highlight
                          ? "bg-gradient-to-br from-gold-500 to-gold-600 shadow-gold-sm"
                          : "bg-white/[0.07] border border-white/10"
                      )}>
                        <Icon className={cn("w-8 h-8", step.highlight ? "text-navy-900" : "text-gold-400")} strokeWidth={1.75} />
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-3 flex-wrap">
                        <Badge variant={step.highlight ? "gold" : "navy"}>{step.phase}</Badge>
                        <span className="text-white/38 font-body text-sm">{step.duration}</span>
                      </div>
                      <h3 className="font-display text-2xl text-white mb-3 leading-tight">{step.title}</h3>
                      <p className="text-white/52 font-body leading-relaxed mb-6 max-w-2xl">{step.description}</p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {step.outcomes.map(o => (
                          <div key={o} className="flex items-center gap-2.5 text-white/55 font-body text-sm">
                            <CheckCircle2 className={cn("w-4 h-4 flex-shrink-0", step.highlight ? "text-gold-400" : "text-gold-400/60")} />
                            {o}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </GlassCard>

                {i < STEPS.length - 1 && (
                  <div className="flex justify-center py-1" aria-hidden>
                    <ArrowDown className="w-5 h-5 text-gold-400/35" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
