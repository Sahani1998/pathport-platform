import Image from "next/image";
import Link from "next/link";
import Reveal from "@/components/ui/Reveal";
import { ArrowRight, BookOpen, Briefcase, GraduationCap, TrendingUp, type LucideIcon } from "lucide-react";

/**
 * StudyEarnStory — image-right editorial split for PathPort's signature
 * 6+6 pathway. Replaces the previous 4-card grid (StudyEarnGraduate) with
 * a single composition: photo right, headline + 4-phase pill row left.
 *
 * Phase pills are honest descriptors, not promises — each one ends at a
 * realistic outcome, not a guaranteed offer.
 */

interface Phase {
  Icon: LucideIcon;
  label: string;
  detail: string;
}

const PHASES: Phase[] = [
  { Icon: BookOpen,      label: "Study",    detail: "Months 1–6 · classroom" },
  { Icon: Briefcase,     label: "Earn",     detail: "Months 7–12 · paid internship" },
  { Icon: GraduationCap, label: "Graduate", detail: "Singapore-recognised diploma" },
  { Icon: TrendingUp,    label: "Career",   detail: "Work, further study, or PR pathway" },
];

export default function StudyEarnStory() {
  return (
    <section className="relative public-section-white overflow-hidden">
      <div className="layout-shell section-airy">
        <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-10 lg:gap-16 xl:gap-20 items-center">

          {/* Content */}
          <Reveal>
            <p className="eyebrow text-gold-700 mb-5">The 6+6 Pathway</p>
            <h2 className="display-2 text-navy-900 mb-6">
              Study six months.{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold-600 to-gold-500">
                Earn six months.
              </span>{" "}
              Graduate in one year.
            </h2>
            <p className="prose-lg text-navy-800/70 mb-6">
              PathPort&rsquo;s signature programme structure pairs six months of classroom diploma study with a six-month paid internship at a Singapore employer partner. Real experience, real earnings, real references — alongside the qualification.
            </p>
            <p className="prose-lg text-navy-800/70 mb-9">
              The internship is part of the curriculum, not optional and not a freelance hunt. Stipends typically sit in the S$800–S$1,500 / month range, varying by employer and role.
            </p>

            {/* Phase pill row */}
            <div className="grid grid-cols-2 gap-3 mb-9 max-w-xl">
              {PHASES.map(({ Icon, label, detail }, i) => (
                <div
                  key={label}
                  className={`flex items-start gap-3 p-4 rounded-2xl border ${
                    i === 1
                      ? "bg-gold-400/[0.10] border-gold-400/35"
                      : "bg-pathBlue-500/[0.05] border-pathBlue-500/15"
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      i === 1
                        ? "bg-gradient-to-br from-gold-500 to-gold-600 text-white"
                        : "bg-white border border-pathBlue-500/25 text-pathBlue-700"
                    }`}
                  >
                    <Icon className="w-4 h-4" strokeWidth={1.75} />
                  </div>
                  <div>
                    <p className={`font-body font-bold text-sm leading-tight ${i === 1 ? "text-gold-700" : "text-navy-900"}`}>{label}</p>
                    <p className="font-body text-navy-800/55 text-xs leading-snug mt-0.5">{detail}</p>
                  </div>
                </div>
              ))}
            </div>

            <Link
              href="/students"
              className="inline-flex items-center gap-2 text-pathBlue-700 hover:text-pathBlue-600 font-body text-base font-semibold transition-colors"
            >
              See how the 6+6 pathway works
              <ArrowRight className="w-4 h-4" />
            </Link>
          </Reveal>

          {/* Photo */}
          <Reveal delay={120} className="relative">
            <div className="relative aspect-[4/5] rounded-3xl overflow-hidden shadow-[0_30px_70px_-25px_rgba(10,17,34,0.35)]">
              <Image
                src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1400&q=80"
                alt="Singapore students working at laptops together — the kind of collaborative environment internships and study programmes operate in"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
                unoptimized
              />
            </div>
            {/* Floating callout */}
            <div className="absolute -bottom-5 right-6 sm:-right-6 bg-white rounded-2xl px-5 py-3 shadow-[0_12px_30px_-10px_rgba(10,17,34,0.25)] border border-pathBlue-500/20">
              <p className="font-body text-navy-800/55 text-[10px] uppercase tracking-[0.15em] font-semibold">Typical stipend</p>
              <p className="font-display text-base text-navy-900 leading-tight mt-0.5">S$800–S$1,500 / month</p>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
