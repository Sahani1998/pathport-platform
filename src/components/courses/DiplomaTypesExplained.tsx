import Link from "next/link";
import Reveal from "@/components/ui/Reveal";
import { BookOpen, Award, GraduationCap, Star, ArrowRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";

/**
 * DiplomaTypesExplained — soft-blue band, 4 detailed cards.
 *
 * Each level (Diploma / Advanced Diploma / Higher Diploma / Specialist Diploma)
 * gets a depth treatment: what it is, who it's for, typical duration with
 * disclaimer, typical subjects, and what's next. The homepage DiplomaCategories
 * uses a tighter layout — this is the full explanation page.
 */

interface DiplomaExplainer {
  Icon: LucideIcon;
  level: string;
  badge: string;
  what: string;
  who: string;
  duration: string;
  subjects: readonly string[];
  next: string;
  filter: string; // ?level= value for the directory filter
}

const TYPES: DiplomaExplainer[] = [
  {
    Icon: BookOpen,
    level: "Diploma",
    badge: "Foundation",
    what: "Entry-level qualification recognised across Singapore and most ASEAN employers. Practical, industry-focused curriculum built around what employers actually hire for.",
    who: "Students completing 10th or 12th standard (CBSE, ICSE, State Board) who want a structured, faster route into industry than a 3–4 year degree programme.",
    duration: "12–18 months typical",
    subjects: ["Business Administration", "Information Technology", "Hospitality Management", "Engineering Technology", "Mass Communication", "Early Childhood Education"],
    next: "Progress to Advanced Diploma, enter the workforce, or apply for university advanced standing.",
    filter: "diploma",
  },
  {
    Icon: Award,
    level: "Advanced Diploma",
    badge: "Intermediate",
    what: "Builds directly on a Diploma qualification with deeper subject mastery, specialisation, and management skills. The natural next step for diploma graduates.",
    who: "Students who hold a Diploma or equivalent qualification and want to deepen their expertise before entering a degree or senior role.",
    duration: "12–18 months typical",
    subjects: ["Advanced Business Management", "Advanced IT & Networking", "Digital Marketing", "Supply Chain Management", "Financial Services", "Advanced Hospitality Operations"],
    next: "Stack into a Higher Diploma, enter the workforce in a more senior role, or apply for degree entry.",
    filter: "advanced_diploma",
  },
  {
    Icon: GraduationCap,
    level: "Higher Diploma",
    badge: "Near-Degree",
    what: "The most advanced diploma tier — comparable in academic depth to the first year of a Bachelor's degree. Many universities accept Higher Diploma graduates with advanced standing.",
    who: "Students aiming for a degree but who prefer to spread the cost and time, or who want a strong professional qualification on its own.",
    duration: "18–24 months typical",
    subjects: ["Business with Finance", "Computing & Software Engineering", "International Hospitality Management", "Design & Visual Communication", "Healthcare Management", "Psychology & Counselling"],
    next: "Direct entry into Year 2 or Year 3 of a Bachelor's programme in Singapore, the UK, Australia, or Canada (university-dependent).",
    filter: "advanced_diploma",
  },
  {
    Icon: Star,
    level: "Specialist Diploma",
    badge: "Specialisation",
    what: "Applied, industry-aligned qualifications built for a specific role or technology. Often shorter and frequently designed for working professionals as well as fresh graduates.",
    who: "Diploma or degree holders looking to upskill in a focused domain, plus working professionals seeking certification without committing to a full degree.",
    duration: "6–12 months typical",
    subjects: ["Cybersecurity Operations", "Digital Business Transformation", "Culinary Arts & F&B Management", "Real Estate & Property Management", "Human Resource Leadership", "Project Management"],
    next: "Directly into a specialised role, or stack with other diplomas for a broader skill portfolio.",
    filter: "graduate_diploma",
  },
];

export default function DiplomaTypesExplained() {
  return (
    <section id="diploma-types" className="relative public-section-blue">
      <div className="layout-shell section-airy">
        <Reveal className="text-center mb-12">
          <p className="eyebrow text-gold-700 mb-4">
            Diploma Types Explained
          </p>
          <h2 className="display-3 text-navy-900 mb-4 max-w-2xl mx-auto">
            Four diploma tiers, four different stories.
          </h2>
          <p className="prose-lg text-navy-800/60 max-w-2xl mx-auto">
            Singapore&rsquo;s private college diploma ladder is built so you can enter at the level that fits your background — and stack qualifications over time.
          </p>
        </Reveal>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {TYPES.map(({ Icon, level, badge, what, who, duration, subjects, next, filter }, i) => (
            <Reveal key={level} delay={i * 80} className="h-full">
              <div className="h-full p-7 rounded-2.5xl public-card public-card-hover">
                {/* Header */}
                <div className="flex items-center gap-4 mb-5">
                  <div className="w-12 h-12 rounded-2xl bg-pathBlue-500/10 border border-pathBlue-500/25 text-pathBlue-700 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5" strokeWidth={1.75} />
                  </div>
                  <div>
                    <h3 className="font-display text-2xl text-navy-900 leading-tight">{level}</h3>
                    <p className="font-body text-pathBlue-700 text-xs font-semibold tracking-wide uppercase mt-0.5">{badge}</p>
                  </div>
                </div>

                {/* What it is */}
                <p className="text-navy-800/65 font-body text-sm leading-relaxed mb-5">{what}</p>

                {/* Two-up grid: Who / Duration */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
                  <div className="p-3 rounded-xl bg-navy-900/[0.03] border border-navy-900/10">
                    <p className="font-body text-navy-800/50 text-[10px] font-semibold uppercase tracking-wider mb-1">Who it&rsquo;s for</p>
                    <p className="font-body text-navy-800/75 text-xs leading-relaxed">{who}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-gold-400/[0.10] border border-gold-400/25">
                    <p className="font-body text-gold-700 text-[10px] font-semibold uppercase tracking-wider mb-1">Typical duration</p>
                    <p className="font-body text-navy-900 text-sm font-bold leading-snug">{duration}</p>
                    <p className="font-body text-navy-800/55 text-[10px] mt-1 italic">Varies by institution.</p>
                  </div>
                </div>

                {/* Typical subjects */}
                <p className="font-body text-navy-800/50 text-[10px] font-semibold uppercase tracking-wider mb-2">Typical subject areas</p>
                <div className="flex flex-wrap gap-1.5 mb-5">
                  {subjects.map(s => (
                    <span key={s} className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-navy-900/5 text-navy-800/65 border border-navy-900/10 font-body text-xs font-medium leading-none">
                      {s}
                    </span>
                  ))}
                </div>

                {/* What's next */}
                <div className="p-3 rounded-xl bg-pathBlue-500/[0.06] border border-pathBlue-500/15 mb-5">
                  <p className="font-body text-pathBlue-700 text-[10px] font-semibold uppercase tracking-wider mb-1">What&rsquo;s next</p>
                  <p className="font-body text-navy-800/75 text-xs leading-relaxed">{next}</p>
                </div>

                {/* CTA */}
                <Link
                  href={`/courses?level=${filter}`}
                  className="inline-flex items-center gap-1.5 text-pathBlue-700 hover:text-pathBlue-600 font-body text-sm font-semibold transition-colors"
                >
                  Browse {level.toLowerCase()} programmes
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
