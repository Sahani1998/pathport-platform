import Link from "next/link";
import { BookOpen, Briefcase, GraduationCap, TrendingUp, ArrowRight, type LucideIcon } from "lucide-react";

interface Phase {
  number: string;
  label: string;
  duration: string;
  title: string;
  desc: string;
  outcomes: readonly string[];
  Icon: LucideIcon;
  accent: string;
  border: string;
  iconBg: string;
  numberColor: string;
  highlight?: boolean;
}

const PHASES: Phase[] = [
  {
    number: "01",
    label: "Study",
    duration: "Months 1–6",
    title: "Enrol in your Singapore diploma",
    desc: "Attend class at your chosen private college. Build academic credits, English fluency, and a Singapore professional network from day one.",
    outcomes: ["Diploma credits", "Singapore Student Pass", "Campus facilities", "Indian student network"],
    Icon: BookOpen,
    accent: "from-pathBlue-500/20 to-pathBlue-700/10",
    border: "border-pathBlue-500/30",
    iconBg: "bg-pathBlue-500/15 border-pathBlue-500/30 text-pathBlue-300",
    numberColor: "text-pathBlue-400",
  },
  {
    number: "02",
    label: "Earn",
    duration: "Months 7–12",
    title: "Paid internship with Singapore employers",
    desc: "PathPort's 6+6 pathway places you with Singapore employers for 6 months of real work experience — with a paid stipend and professional reference.",
    outcomes: ["S$800–S$1,500/month stipend", "Industry mentorship", "Professional reference", "Singapore work experience"],
    Icon: Briefcase,
    accent: "from-gold-500/20 to-gold-700/10",
    border: "border-gold-400/40",
    iconBg: "bg-gradient-to-br from-gold-500 to-gold-600 border-gold-400 text-navy-900",
    numberColor: "text-gold-400",
    highlight: true,
  },
  {
    number: "03",
    label: "Graduate",
    duration: "Month 12+",
    title: "Receive your Singapore qualification",
    desc: "Graduate with a Singapore diploma recognised across Asia and ASEAN. Your CPE-registered college issues your certificate.",
    outcomes: ["CPE-registered diploma", "Singapore transcript", "Alumni network", "Advanced entry eligibility"],
    Icon: GraduationCap,
    accent: "from-emerald-500/15 to-emerald-700/8",
    border: "border-emerald-500/25",
    iconBg: "bg-emerald-500/15 border-emerald-500/30 text-emerald-400",
    numberColor: "text-emerald-400",
  },
  {
    number: "04",
    label: "Career",
    duration: "After graduation",
    title: "Multiple pathways open to you",
    desc: "With a Singapore qualification and international work experience, you can pursue employment, further study, or pathway to Singapore PR — or return to India with a significant advantage.",
    outcomes: ["Singapore employment", "Advanced/Higher Diploma", "Degree advanced standing", "Singapore PR pathway"],
    Icon: TrendingUp,
    accent: "from-white/[0.04] to-transparent",
    border: "border-white/[0.10]",
    iconBg: "bg-white/[0.08] border-white/[0.12] text-white/70",
    numberColor: "text-white/50",
  },
];

export default function StudyEarnGraduate() {
  return (
    <section id="pathway" className="relative py-24 overflow-hidden">
      <div aria-hidden className="absolute inset-0 bg-gradient-to-b from-transparent via-navy-800/25 to-transparent pointer-events-none" />
      <div aria-hidden className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/[0.07] to-transparent" />
      <div aria-hidden className="absolute top-1/2 left-0 w-[400px] h-[400px] rounded-full bg-gold-400/[0.04] blur-[120px] pointer-events-none -translate-y-1/2" />

      <div className="max-w-7xl mx-auto px-5 md:px-10">

        {/* Header */}
        <div className="text-center mb-16">
          <p className="inline-flex items-center gap-3 text-gold-400 font-body text-xs font-semibold tracking-[0.22em] uppercase mb-5">
            <span className="w-8 h-px bg-gold-400/50 rounded-full" />
            6+6 Pathway
            <span className="w-8 h-px bg-gold-400/50 rounded-full" />
          </p>
          <h2 className="font-display text-4xl md:text-5xl text-white mb-5 leading-[1.08]">
            Study. Earn.{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold-400 via-gold-300 to-gold-400">
              Graduate. Career.
            </span>
          </h2>
          <p className="text-white/50 font-body text-lg max-w-2xl mx-auto leading-relaxed">
            PathPort&apos;s signature 6+6 pathway gives Indian students both a Singapore qualification and 6 months of real paid work experience — in one year.
          </p>
        </div>

        {/* 4-phase grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-12">
          {PHASES.map(({ number, label, duration, title, desc, outcomes, Icon, accent, border, iconBg, numberColor, highlight }) => (
            <div
              key={number}
              className={`relative rounded-2.5xl border bg-gradient-to-br ${accent} ${border} p-6 flex flex-col ${highlight ? "shadow-gold-sm" : ""}`}
            >
              {highlight && (
                <div aria-hidden className="absolute -top-px left-6 right-6 h-px bg-gradient-to-r from-transparent via-gold-400/60 to-transparent" />
              )}

              {/* Phase number + icon */}
              <div className="flex items-start justify-between mb-5">
                <div className={`w-11 h-11 rounded-xl border flex items-center justify-center flex-shrink-0 ${iconBg}`}>
                  <Icon className="w-5 h-5" strokeWidth={1.75} />
                </div>
                <span className={`font-display font-bold text-3xl leading-none ${numberColor} opacity-40`}>{number}</span>
              </div>

              {/* Label + duration */}
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className={`font-body font-bold text-xs uppercase tracking-wider ${numberColor}`}>{label}</span>
                <span className="text-white/28 font-body text-[10px]">· {duration}</span>
              </div>

              {/* Title */}
              <h3 className="font-display text-lg text-white mb-2 leading-snug">{title}</h3>

              {/* Description */}
              <p className="text-white/50 font-body text-sm leading-relaxed mb-5 flex-1">{desc}</p>

              {/* Outcomes */}
              <ul className="space-y-1.5">
                {outcomes.map(o => (
                  <li key={o} className="flex items-center gap-2 text-white/45 font-body text-xs">
                    <span className={`w-1 h-1 rounded-full flex-shrink-0 ${numberColor.replace("text-", "bg-")}`} />
                    {o}
                  </li>
                ))}
              </ul>

              {highlight && (
                <div className="mt-4 pt-4 border-t border-gold-400/20">
                  <span className="inline-flex items-center gap-1.5 text-gold-400 font-body text-[10px] font-semibold tracking-[0.15em] uppercase">
                    ⭐ Signature Feature
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Bottom note + CTA */}
        <div className="text-center p-6 rounded-2xl bg-pathBlue-500/[0.06] border border-pathBlue-500/20">
          <p className="text-white/60 font-body text-base mb-4">
            All diploma types are compatible with the 6+6 Study + Paid Internship Pathway.
            <span className="text-gold-400 font-semibold"> One year. Two outcomes.</span>
          </p>
          <Link
            href="/students"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-gold-500 to-gold-400 text-navy-900 font-body font-bold text-sm hover:shadow-gold-sm transition-all"
          >
            How the pathway works <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
