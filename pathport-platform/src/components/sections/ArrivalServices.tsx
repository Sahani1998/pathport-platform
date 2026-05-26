import GlassCard from "@/components/ui/GlassCard";
import SectionHeader from "@/components/ui/SectionHeader";
import { arrivalServices } from "@/data/arrival-services";
import { CheckCircle2 } from "lucide-react";

export default function ArrivalServices() {
  return (
    <section id="arrival" className="relative py-24 overflow-hidden">
      <div aria-hidden className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/[0.07] to-transparent" />
      <div aria-hidden className="absolute top-1/2 -left-32 w-[350px] h-[350px] rounded-full bg-pathBlue-500/[0.04] blur-[120px] -translate-y-1/2 pointer-events-none" />
      <div aria-hidden className="absolute top-1/2 -right-32 w-[300px] h-[300px] rounded-full bg-gold-400/[0.04] blur-[100px] -translate-y-1/2 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-5 md:px-10">
        <SectionHeader
          eyebrow="Arrival Services"
          title="From India to Singapore — We've Got You Covered"
          subtitle="PathPort's arrival concierge service takes care of everything from Student Pass to airport pickup — so your first week in Singapore is smooth and stress-free."
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {arrivalServices.map((service, i) => (
            <GlassCard key={service.id} gold={i === 0} className="p-7 flex flex-col group">
              <div className="text-4xl mb-5 group-hover:scale-110 transition-transform duration-300 w-fit" role="img" aria-label={service.title}>
                {service.icon}
              </div>
              <h3 className="font-display text-xl text-white mb-2.5 leading-snug">{service.title}</h3>
              <p className="text-white/48 font-body text-sm leading-relaxed mb-5 flex-1">{service.description}</p>
              <ul className="space-y-2.5" role="list">
                {service.features.map(f => (
                  <li key={f} className="flex items-center gap-2.5 text-white/52 font-body text-sm">
                    <CheckCircle2 className="w-4 h-4 text-gold-400/80 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
            </GlassCard>
          ))}
        </div>
      </div>
    </section>
  );
}
