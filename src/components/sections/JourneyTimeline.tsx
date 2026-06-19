import Reveal from "@/components/ui/Reveal";
import { journeySteps } from "@/data/journey-steps";
import { cn } from "@/lib/utils";

export default function JourneyTimeline() {
  return (
    <section id="journey" className="relative py-24 overflow-hidden">
      <div aria-hidden className="absolute inset-0 bg-gradient-to-b from-transparent via-navy-800/25 to-transparent pointer-events-none" />
      <div aria-hidden className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/[0.07] to-transparent" />
      <div aria-hidden className="absolute top-1/2 right-0 w-[450px] h-[450px] rounded-full bg-pathBlue-500/[0.04] blur-[130px] -translate-y-1/2 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-5 md:px-10">

        {/* Section header */}
        <Reveal className="text-center mb-14">
          <p className="inline-flex items-center gap-3 text-gold-400 font-body text-xs font-semibold tracking-[0.22em] uppercase mb-5">
            <span className="w-8 h-px bg-gold-400/50 rounded-full" />
            Your Journey
            <span className="w-8 h-px bg-gold-400/50 rounded-full" />
          </p>
          <h2 className="font-display text-4xl md:text-5xl text-white mb-5 leading-[1.08]">
            India to Singapore{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold-400 via-gold-300 to-gold-400">
              in 8 Steps
            </span>
          </h2>
          <p className="text-white/50 font-body text-lg max-w-2xl mx-auto leading-relaxed">
            From your first enquiry to your first day of class — PathPort guides every step of your journey.
          </p>
        </Reveal>

        {/* Timeline */}
        <div className="relative max-w-5xl mx-auto">
          {/* Vertical connector — desktop only */}
          <div
            aria-hidden
            className="absolute left-[27px] top-10 bottom-10 w-px hidden md:block"
            style={{
              background:
                "linear-gradient(to bottom, rgba(59,158,255,0.35) 0%, rgba(201,168,76,0.45) 50%, rgba(59,158,255,0.15) 100%)",
            }}
          />

          <div className="space-y-3">
            {journeySteps.map((step, i) => (
              <Reveal key={step.step} delay={i * 55} threshold={0.08}>
                <div
                  className={cn(
                    "flex items-start gap-5 p-5 rounded-2xl transition-colors duration-300",
                    "border border-white/[0.07] bg-white/[0.03] backdrop-blur-sm",
                    "hover:border-gold-400/30 hover:bg-white/[0.05]",
                    step.highlight && "border-gold-400/30 bg-gold-400/[0.04]"
                  )}
                >
                  {/* Step number circle */}
                  <div
                    className={cn(
                      "flex-shrink-0 w-[54px] h-[54px] rounded-full border-2 flex items-center justify-center",
                      "font-display font-bold text-lg relative z-10 transition-transform duration-300",
                      step.highlight
                        ? "bg-gradient-to-br from-gold-500 to-gold-600 border-gold-400 text-navy-900 shadow-[0_0_18px_rgba(201,168,76,0.38)]"
                        : i < 3
                          ? "bg-pathBlue-500/15 border-pathBlue-500/40 text-pathBlue-400"
                          : "bg-white/[0.06] border-white/15 text-white/60"
                    )}
                  >
                    {step.step}
                  </div>

                  {/* Content */}
                  <div className="flex-1 pt-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1.5 flex-wrap">
                      <span className="text-xl" role="img" aria-label={step.title}>
                        {step.icon}
                      </span>
                      <h3
                        className={cn(
                          "font-body font-semibold text-base",
                          step.highlight ? "text-gold-300" : "text-white/90"
                        )}
                      >
                        {step.title}
                      </h3>
                      {step.highlight && (
                        <span className="text-[10px] font-semibold tracking-wider text-gold-400 bg-gold-400/15 border border-gold-400/30 rounded-full px-2.5 py-0.5">
                          KEY MILESTONE
                        </span>
                      )}
                    </div>
                    <p className="text-white/48 font-body text-sm leading-relaxed">
                      {step.description}
                    </p>
                  </div>

                  {/* Step counter — desktop */}
                  <div className="flex-shrink-0 hidden sm:block pt-1">
                    <span className="text-white/20 font-body text-xs">
                      Step {step.step} of {journeySteps.length}
                    </span>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>

        {/* Footer note */}
        <Reveal delay={180} className="text-center mt-10">
          <p className="text-white/35 font-body text-sm">
            🇮🇳 PathPort is currently focused on students from India · 🇱🇰 🇳🇵 🇧🇩 🇧🇹 Sri Lanka, Nepal, Bangladesh & Bhutan coming soon
          </p>
        </Reveal>
      </div>
    </section>
  );
}
