import GlassCard from "@/components/ui/GlassCard";
import SectionHeader from "@/components/ui/SectionHeader";
import { whySingaporeReasons } from "@/data/why-singapore";

export default function WhySingapore() {
  return (
    <section id="about" className="relative py-24 overflow-hidden">
      <div aria-hidden className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/[0.07] to-transparent" />
      <div aria-hidden className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/[0.07] to-transparent" />

      {/* Background tint */}
      <div aria-hidden className="absolute inset-0 bg-gradient-to-b from-transparent via-navy-800/30 to-transparent pointer-events-none" />

      <div className="max-w-7xl mx-auto px-5 md:px-10">
        <SectionHeader
          eyebrow="Why Singapore"
          title="Why Indian Students Choose Singapore"
          subtitle="From its proximity to India to its world-class education infrastructure — Singapore is the smart choice for diploma education and career launch."
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {whySingaporeReasons.map((reason, i) => (
            <GlassCard key={reason.id} className="p-6 group" gold={i === 3}>
              <div
                className="text-3xl mb-4 group-hover:scale-110 transition-transform duration-300 w-fit"
                role="img" aria-label={reason.title}
              >
                {reason.icon}
              </div>
              <h3 className="font-body font-semibold text-white text-base mb-2 leading-snug">
                {reason.title}
              </h3>
              <p className="text-white/48 font-body text-sm leading-relaxed">
                {reason.description}
              </p>
            </GlassCard>
          ))}
        </div>

        {/* Secondary markets note */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-3 text-center">
          <span className="text-white/35 font-body text-sm">Also supporting:</span>
          {["🇱🇰 Sri Lanka", "🇳🇵 Nepal", "🇧🇩 Bangladesh", "🇧🇹 Bhutan"].map((country) => (
            <span
              key={country}
              className="inline-flex items-center px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-white/40 font-body text-sm"
            >
              {country}
              <span className="ml-2 text-[10px] text-pathBlue-400/70 font-semibold">COMING SOON</span>
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
