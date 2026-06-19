import { ShieldCheck, Train, Users, BookOpen, MessageCircle, Coffee } from "lucide-react";
import type { FC } from "react";

const ASPECTS = [
  {
    title: "Safe City",
    desc: "Singapore consistently ranks among Asia's safest cities. Students walk home at night, use public transport at any hour, and parents have genuine peace of mind from day one.",
    photo: "https://images.unsplash.com/photo-1570168007204-dfb528c6958f?auto=format&fit=crop&w=700&q=75",
    alt: "Singapore city at night — safe, well-lit streets",
    stat: "#1 Safe in Asia",
    Icon: ShieldCheck,
  },
  {
    title: "World-Class MRT",
    desc: "An EZ-Link card covers unlimited bus and MRT travel. Campus, internship, library, shopping — all reachable in under 30 minutes. No car needed.",
    photo: "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?auto=format&fit=crop&w=700&q=75",
    alt: "Singapore MRT and public transport network",
    stat: "S$90/month unlimited",
    Icon: Train,
  },
  {
    title: "Indian Community",
    desc: "Singapore has one of Southeast Asia's largest Indian diaspora communities. Diwali is a public holiday. Temples, Indian grocery shops, biryani, and dosai everywhere.",
    photo: "https://images.unsplash.com/photo-1476611338391-6f395a0ebc7b?auto=format&fit=crop&w=700&q=75",
    alt: "Vibrant multicultural community in Singapore",
    stat: "9% Indian population",
    Icon: Users,
  },
  {
    title: "Study Anytime",
    desc: "World-class NLB libraries, 24-hour campus study rooms, and co-working cafés. Study in air-conditioned comfort at any time. No infrastructure concerns.",
    photo: "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&w=700&q=75",
    alt: "Modern library study space in Singapore",
    stat: "28 NLB libraries",
    Icon: BookOpen,
  },
  {
    title: "Affordable Food",
    desc: "A full hot meal costs S$3–S$5 at hawker centres. Indian cuisine, biryani, roti prata, and South Indian tiffin are available across the island — familiar food every day.",
    photo: "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=700&q=75",
    alt: "Singapore hawker centre with affordable food",
    stat: "S$3 full meal",
    Icon: Coffee,
  },
  {
    title: "English Medium",
    desc: "All education, business communication, and daily life operates in English. No language barrier — you walk into class on Day 1 and understand everything.",
    photo: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=700&q=75",
    alt: "Students studying together in a modern campus",
    stat: "100% English medium",
    Icon: MessageCircle,
  },
] as const;

const PAGE_STATS = [
  { value: "5 hrs", label: "Flight from India" },
  { value: "22°C", label: "Year-round temp" },
  { value: "English", label: "All education" },
  { value: "#1", label: "Safest city, Asia" },
];

const LifeInSingapore: FC = () => (
  <section id="life-in-singapore" className="relative py-24 overflow-hidden">
    <div aria-hidden className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/[0.07] to-transparent" />
    <div aria-hidden className="absolute top-1/3 right-0 w-[500px] h-[500px] rounded-full bg-pathBlue-500/[0.05] blur-[130px] pointer-events-none" />

    <div className="max-w-7xl mx-auto px-5 md:px-10">

      {/* Header */}
      <div className="text-center mb-14">
        <p className="inline-flex items-center gap-3 text-gold-400 font-body text-xs font-semibold tracking-[0.22em] uppercase mb-5">
          <span className="w-8 h-px bg-gold-400/50 rounded-full" />
          Life in Singapore
          <span className="w-8 h-px bg-gold-400/50 rounded-full" />
        </p>
        <h2 className="font-display text-4xl md:text-5xl text-white mb-5 leading-[1.08]">
          Before you study, know{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold-400 to-gold-300">
            where you&apos;re going.
          </span>
        </h2>
        <p className="text-white/50 font-body text-lg max-w-2xl mx-auto leading-relaxed">
          Students choose education. But they buy a lifestyle. Here is what your daily life in Singapore actually looks like — before you apply.
        </p>
      </div>

      {/* Photo grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
        {ASPECTS.map(({ title, desc, photo, alt, stat, Icon }) => (
          <div
            key={title}
            className="group relative rounded-2.5xl overflow-hidden border border-white/[0.08] hover:border-gold-400/30 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_32px_-8px_rgba(0,0,0,0.5)]"
            style={{ aspectRatio: "4/3" }}
          >
            {/* Photo */}
            <img
              src={photo}
              alt={alt}
              loading="lazy"
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-navy-950/92 via-navy-950/40 to-navy-950/10" />
            <div aria-hidden className="absolute inset-0 bg-navy-900/20" />

            {/* Content */}
            <div className="absolute inset-0 flex flex-col justify-end p-5">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-lg bg-gold-400/20 border border-gold-400/30 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-3.5 h-3.5 text-gold-400" strokeWidth={2} />
                </div>
                <span className="font-body font-semibold text-white/90 text-sm">{title}</span>
              </div>
              <p className="text-white/60 font-body text-xs leading-relaxed mb-3 line-clamp-2 group-hover:line-clamp-none transition-all">
                {desc}
              </p>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gold-400/15 border border-gold-400/30 text-gold-300 font-body text-[10px] font-semibold w-fit">
                {stat}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Stat strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {PAGE_STATS.map(({ value, label }) => (
          <div key={label} className="text-center p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
            <p className="font-display text-2xl text-gold-400 font-bold mb-1">{value}</p>
            <p className="text-white/40 font-body text-xs">{label}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default LifeInSingapore;
