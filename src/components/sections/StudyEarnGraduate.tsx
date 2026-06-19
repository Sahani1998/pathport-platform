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
    iconBg: "bg-pathBlue-500/10 border-pathBlue-500/25 text-pathBlue-700",
    numberColor: "text-pathBlue-600",
  },
  {
    number: "02",
    label: "Earn",
    duration: "Months 7–12",
    title: "Paid internship with Singapore employers",
    desc: "PathPort's 6+6 pathway places you with Singapore employers for 6 months of real work experience — with a paid stipend and professional reference.",
    outcomes: ["S$800–S$1,500/month stipend", "Industry mentorship", "Professional reference", "Singapore work experience"],
    Icon: Briefcase,
    iconBg: "bg-gradient-to-br from-gold-500 to-gold-600 border-gold-400 text-white",
    numberColor: "text-gold-600",
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
    iconBg: "bg-emerald-500/10 border-emerald-500/25 text-emerald-700",
    numberColor: "text-emerald-600",
  },
  {
    number: "04",
    label: "Career",
    duration: "After graduation",
    title: "Multiple pathways open to you",
    desc: "With a Singapore qualification and international work experience, you can pursue employment, further study, or pathway to Singapore PR — or return to India with a significant advantage.",
    outcomes: ["Singapore employment", "Advanced/Higher Diploma", "Degree advanced standing", "Singapore PR pathway"],
    Icon: TrendingUp,
    iconBg: "bg-navy-900/5 border-navy-900/10 text-navy-700",
    numberColor: "text-navy-900/60",
  },
];

export default function StudyEarnGraduate() {
  return (
    <section id="pathway" className="relative py-24 public-section-blue">
      <div className="max-w-7xl mx-auto px-5 md:px-10">

        {/* Header */}
        <div className="text-center mb-16">
          <p className="inline-flex items-center gap-3 text-gold-700 font-body text-xs font-semibold tracking-[0.22em] uppercase mb-5">
            <span className="w-8 h-px bg-gold-600/40 rounded-full" />
            6+6 Pathway
            <span className="w-8 h-px bg-gold-600/40 rounded-full" />
          </p>
          <h2 className="font-display text-4xl md:text-5xl text-navy-900 mb-5 leading-[1.08]">
            Study. Earn.{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold-600 to-gold-500">
              Graduate. Career.
            </span>
          </h2>
          <p className="text-navy-800/60 font-body text-lg max-w-2xl mx-auto leading-relaxed">
            PathPort&apos;s signature 6+6 pathway gives Indian students both a Singapore qualification and 6 months of real paid work experience — in one year.
          </p>
        </div>

        {/* 4-phase grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-12">
          {PHASES.map(({ number, label, duration, title, desc, outcomes, Icon, iconBg, numberColor, highlight }) => (
            <div
              key={number}
              className={`relative rounded-2.5xl p-6 flex flex-col public-card public-card-hover ${highlight ? "ring-1 ring-gold-400/45 shadow-gold-sm" : ""}`}
            >
              {highlight && (
                <div aria-hidden className="absolute -top-px left-6 right-6 h-px bg-gradient-to-r from-transparent via-gold-500/60 to-transparent" />
              )}

              {/* Phase number + icon */}
              <div className="flex items-start justify-between mb-5">
                <div className={`w-11 h-11 rounded-xl border flex items-center justify-center flex-shrink-0 ${iconBg}`}>
                  <Icon className="w-5 h-5" strokeWidth={1.75} />
                </div>
                <span className={`font-display font-bold text-3xl leading-none ${numberColor} opacity-30`}>{number}</span>
              </div>

              {/* Label + duration */}
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className={`font-body font-bold text-xs uppercase tracking-wider ${numberColor}`}>{label}</span>
                <span className="text-navy-800/40 font-body text-[10px]">· {duration}</span>
              </div>

              {/* Title */}
              <h3 className="font-display text-lg text-navy-900 mb-2 leading-snug">{title}</h3>

              {/* Description */}
              <p className="text-navy-800/60 font-body text-sm leading-relaxed mb-5 flex-1">{desc}</p>

              {/* Outcomes */}
              <ul className="space-y-1.5">
                {outcomes.map(o => (
                  <li key={o} className="flex items-center gap-2 text-navy-800/55 font-body text-xs">
                    <span className={`w-1 h-1 rounded-full flex-shrink-0 ${numberColor.replace("text-", "bg-")}`} />
                    {o}
                  </li>
                ))}
              </ul>

              {highlight && (
                <div className="mt-4 pt-4 border-t border-gold-400/25">
                  <span className="inline-flex items-center gap-1.5 text-gold-700 font-body text-[10px] font-semibold tracking-[0.15em] uppercase">
                    ⭐ Signature Feature
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Bottom note + CTA */}
        <div className="text-center p-6 rounded-2xl bg-pathBlue-500/[0.06] border border-pathBlue-500/20">
          <p className="text-navy-800/65 font-body text-base mb-4">
            All diploma types are compatible with the 6+6 Study + Paid Internship Pathway.
            <span className="text-gold-700 font-semibold"> One year. Two outcomes.</span>
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
