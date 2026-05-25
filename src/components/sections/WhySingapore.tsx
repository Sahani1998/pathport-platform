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

        {/* Singapore landmark banner */}
        <div className="relative rounded-2xl overflow-hidden mb-10 border border-white/[0.08]" style={{ height: "220px" }}>
          <img
            src="https://images.unsplash.com/photo-1570168007204-dfb528c6958f?auto=format&fit=crop&w=1600&q=75"
            alt="Singapore city skyline - Marina Bay and financial district"
            loading="lazy"
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-navy-900/85 via-navy-900/40 to-navy-900/20" />
          <div className="absolute inset-0 flex items-center px-8 md:px-12">
            <div>
              <p className="text-gold-400 font-body text-xs font-semibold tracking-[0.2em] uppercase mb-2">🇸🇬 Singapore</p>
              <h3 className="font-display text-3xl md:text-4xl text-white leading-tight mb-1">
                Asia&apos;s Most Student-Friendly City
              </h3>
              <p className="text-white/60 font-body text-sm">Safe · English-medium · 5 hours from India</p>
            </div>
          </div>
        </div>

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
        <div className="mt-8 p-5 rounded-2xl bg-white/[0.03] border border-white/[0.07] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center justify-center gap-3">
            <span className="text-white/45 font-body text-sm">Also supporting:</span>
            {["🇱🇰 Sri Lanka", "🇳🇵 Nepal", "🇧🇩 Bangladesh", "🇧🇹 Bhutan"].map((country) => (
              <span
                key={country}
                className="inline-flex items-center px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-white/45 font-body text-sm"
              >
                {country}
                <span className="ml-2 text-[10px] text-pathBlue-400/70 font-semibold">COMING SOON</span>
              </span>
            ))}
          </div>
          <div className="flex-shrink-0 text-center sm:text-right">
            <p className="font-display text-2xl text-gold-400 font-bold">95%</p>
            <p className="text-white/45 font-body text-xs">Student Satisfaction</p>
          </div>
        </div>
      </div>
    </section>
  );
}
