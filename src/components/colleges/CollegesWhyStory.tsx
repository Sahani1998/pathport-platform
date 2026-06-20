import Image from "next/image";
import Link from "next/link";
import Reveal from "@/components/ui/Reveal";
import { ArrowRight, ShieldCheck, Languages, Briefcase } from "lucide-react";

/**
 * CollegesWhyStory — image-left editorial story split replacing the previous
 * WhyStudyInSingapore 4-card grid on /colleges. Three inline reason pull-outs
 * sit under the prose instead of a separate icon-card row.
 */

const REASONS = [
  { Icon: ShieldCheck, label: "Safest city in Asia",  body: "Low crime, walkable, reliable transport at any hour." },
  { Icon: Languages,    label: "100% English medium",   body: "Classes, work, daily life — all in English." },
  { Icon: Briefcase,    label: "6+6 internship model", body: "Many programmes pair study with paid work experience." },
];

export default function CollegesWhyStory() {
  return (
    <section className="relative public-section-blue overflow-hidden">
      <div className="layout-shell section-airy">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.1fr] gap-10 lg:gap-16 xl:gap-20 items-center">

          {/* Photo */}
          <Reveal className="relative">
            <div className="relative aspect-[4/5] rounded-3xl overflow-hidden shadow-[0_30px_70px_-25px_rgba(10,17,34,0.35)]">
              <Image
                src="https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=1400&q=80"
                alt="Hawker centre — a typical daily meal scene for Singapore students"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
                unoptimized
              />
            </div>
            <div className="absolute -bottom-5 left-6 sm:-left-6 bg-white rounded-2xl px-5 py-3 shadow-[0_12px_30px_-10px_rgba(10,17,34,0.25)] border border-pathBlue-500/20">
              <p className="font-body text-navy-800/55 text-[10px] uppercase tracking-[0.15em] font-semibold">Why Indian families pick Singapore</p>
              <p className="font-display text-base text-navy-900 leading-tight mt-0.5">A familiar, safe, English city</p>
            </div>
          </Reveal>

          {/* Prose + reasons */}
          <Reveal delay={120}>
            <p className="eyebrow text-gold-700 mb-5">Why Singapore</p>
            <h2 className="display-3 text-navy-900 mb-6">
              The destination Indian families pick when they want{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold-600 to-gold-500">
                close, safe, and real.
              </span>
            </h2>
            <p className="prose-lg text-navy-800/70 mb-8">
              Singapore is a short flight from India, fully English-medium, world-class for student safety, and home to one of Asia&rsquo;s largest Indian diasporas. For most families, the cultural distance is much smaller than the geographic distance suggests.
            </p>

            <ul className="space-y-5 mb-9">
              {REASONS.map(({ Icon, label, body }) => (
                <li key={label} className="flex gap-4">
                  <div className="w-11 h-11 rounded-xl bg-pathBlue-500/10 border border-pathBlue-500/25 text-pathBlue-700 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5" strokeWidth={1.75} />
                  </div>
                  <div>
                    <p className="font-display text-lg text-navy-900 leading-snug">{label}</p>
                    <p className="font-body text-navy-800/60 text-sm leading-relaxed mt-0.5">{body}</p>
                  </div>
                </li>
              ))}
            </ul>

            <Link
              href="/resources/study-in-singapore"
              className="inline-flex items-center gap-2 text-pathBlue-700 hover:text-pathBlue-600 font-body text-base font-semibold transition-colors"
            >
              Read the full Singapore study guide
              <ArrowRight className="w-4 h-4" />
            </Link>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
