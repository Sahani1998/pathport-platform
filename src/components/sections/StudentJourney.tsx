import SectionHeader from "@/components/ui/SectionHeader";
import { journeySteps } from "@/data/journey-steps";
import { cn } from "@/lib/utils";

export default function StudentJourney() {
  return (
    <section id="journey" className="relative py-24 overflow-hidden">
      <div aria-hidden className="absolute inset-0 bg-gradient-to-b from-transparent via-navy-800/25 to-transparent pointer-events-none" />
      <div aria-hidden className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/[0.07] to-transparent" />

      <div className="max-w-7xl mx-auto px-5 md:px-10">
        <SectionHeader
          eyebrow="Your Journey"
          title="India to Singapore in 8 Steps"
          subtitle="From your first enquiry to your first day of class — PathPort guides every step of your journey."
        />

        {/* Student life image strip */}
        <div className="grid grid-cols-3 gap-3 max-w-3xl mx-auto mb-14">
          {[
            {
              src: "https://images.unsplash.com/photo-1543269865-cbf427effbad?auto=format&fit=crop&w=600&q=80",
              alt: "Happy international students on campus",
            },
            {
              src: "https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?auto=format&fit=crop&w=600&q=80",
              alt: "Students working together in a modern study space",
            },
            {
              src: "https://images.unsplash.com/photo-1571260899304-425eee4c7efc?auto=format&fit=crop&w=600&q=80",
              alt: "Student holding graduation certificate smiling",
            },
          ].map((img, i) => (
            <div
              key={img.src}
              className="relative rounded-xl overflow-hidden border border-white/[0.08]"
              style={{ aspectRatio: "4/3" }}
            >
              <img
                src={img.src}
                alt={img.alt}
                loading="lazy"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-navy-900/60 to-transparent" />
            </div>
          ))}
        </div>

        {/* Journey connector layout */}
        <div className="relative max-w-5xl mx-auto">
          {/* Vertical connector line — desktop */}
          <div
            aria-hidden
            className="absolute left-[27px] top-10 bottom-10 w-px bg-gradient-to-b from-pathBlue-500/40 via-gold-400/40 to-pathBlue-500/20 hidden md:block"
          />

          <div className="space-y-4">
            {journeySteps.map((step, i) => (
              <div
                key={step.step}
                className={cn(
                  "flex items-start gap-5 p-5 rounded-2xl transition-all duration-300",
                  "border border-white/[0.07] bg-white/[0.03] backdrop-blur-sm",
                  "hover:border-gold-400/30 hover:bg-white/[0.05]",
                  step.highlight && "border-gold-400/30 bg-gold-400/[0.04]"
                )}
              >
                {/* Step number circle */}
                <div
                  className={cn(
                    "flex-shrink-0 w-[54px] h-[54px] rounded-full border-2 flex items-center justify-center",
                    "font-display font-bold text-lg relative z-10",
                    step.highlight
                      ? "bg-gradient-to-br from-gold-500 to-gold-600 border-gold-400 text-navy-900 shadow-gold-sm"
                      : i < 3
                        ? "bg-pathBlue-500/15 border-pathBlue-500/40 text-pathBlue-400"
                        : "bg-white/[0.06] border-white/15 text-white/60"
                  )}
                >
                  {step.step}
                </div>

                {/* Content */}
                <div className="flex-1 pt-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1 flex-wrap">
                    <span className="text-xl" role="img" aria-label={step.title}>{step.icon}</span>
                    <h3 className={cn(
                      "font-body font-semibold text-base",
                      step.highlight ? "text-gold-300" : "text-white/90"
                    )}>
                      {step.title}
                    </h3>
                    {step.highlight && (
                      <span className="text-[10px] font-semibold tracking-wider text-gold-400 bg-gold-400/15 border border-gold-400/30 rounded-full px-2.5 py-0.5">
                        KEY MILESTONE
                      </span>
                    )}
                  </div>
                  <p className="text-white/48 font-body text-sm leading-relaxed">{step.description}</p>
                </div>

                {/* Step indicator right side */}
                <div className="flex-shrink-0 text-right hidden sm:block">
                  <span className="text-white/20 font-body text-xs">Step {step.step} of {journeySteps.length}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom note */}
        <p className="text-center text-white/35 font-body text-sm mt-10">
          🇮🇳 PathPort is currently focused on students from India · 🇱🇰 🇳🇵 🇧🇩 🇧🇹 Sri Lanka, Nepal, Bangladesh & Bhutan coming soon
        </p>
      </div>
    </section>
  );
}
