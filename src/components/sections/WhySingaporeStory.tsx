import Image from "next/image";
import Link from "next/link";
import Reveal from "@/components/ui/Reveal";
import { ArrowRight } from "lucide-react";

/**
 * WhySingaporeStory — editorial story split. Photo left, prose right.
 *
 * Replaces the icon-card grid pattern with a single, immersive composition.
 * Three inline stat pull-outs anchor the prose without resorting to card
 * clutter. Cream band gives the section its own visual identity.
 */

const STATS = [
  { value: "#1",    label: "Safest city in Asia" },
  { value: "100%",  label: "English-medium education" },
  { value: "5 hrs", label: "Direct flight from India" },
];

export default function WhySingaporeStory() {
  return (
    <section className="relative cream-band overflow-hidden">
      <div className="layout-shell section-airy">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.1fr] gap-10 lg:gap-16 xl:gap-20 items-center">

          {/* Photo */}
          <Reveal className="relative">
            <div className="relative aspect-[4/5] rounded-3xl overflow-hidden shadow-[0_30px_70px_-25px_rgba(10,17,34,0.35)]">
              <Image
                src="https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=1400&q=80"
                alt="Indian student eating at a Singapore hawker centre — a daily routine for international students"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
                unoptimized
              />
            </div>
            {/* Floating caption chip */}
            <div className="absolute -bottom-5 left-6 sm:-left-6 bg-white rounded-2xl px-5 py-3 shadow-[0_12px_30px_-10px_rgba(10,17,34,0.25)] border border-gold-200/60">
              <p className="font-body text-navy-800/55 text-[10px] uppercase tracking-[0.15em] font-semibold">A day in the life</p>
              <p className="font-display text-base text-navy-900 leading-tight mt-0.5">Singapore, 5 hours from home</p>
            </div>
          </Reveal>

          {/* Prose */}
          <Reveal delay={120}>
            <p className="eyebrow text-gold-700 mb-5">Why Singapore</p>
            <h2 className="display-2 text-navy-900 mb-6">
              A city that feels like a{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold-600 to-gold-500">
                second home.
              </span>
            </h2>
            <p className="prose-lg text-navy-800/70 mb-6">
              Singapore is the rare study destination where the food is familiar, the streets are safe, the language is English, and the flight is short. Indian students typically settle in within a fortnight — not a semester.
            </p>
            <p className="prose-lg text-navy-800/70 mb-9">
              Around 9% of Singapore&rsquo;s population is Indian. Diwali is a national holiday. Temples, biryani, dosa, and Indian grocery stores are everywhere. There is no culture-shock cliff to climb.
            </p>

            {/* Stat pull-outs */}
            <div className="grid grid-cols-3 gap-5 mb-9 max-w-xl">
              {STATS.map(({ value, label }) => (
                <div key={label}>
                  <p className="font-display text-3xl md:text-4xl text-pathBlue-700 font-bold leading-none mb-2">{value}</p>
                  <p className="font-body text-navy-800/55 text-xs leading-snug">{label}</p>
                </div>
              ))}
            </div>

            <Link
              href="/resources/student-life"
              className="inline-flex items-center gap-2 text-pathBlue-700 hover:text-pathBlue-600 font-body text-base font-semibold transition-colors"
            >
              Explore daily life in Singapore
              <ArrowRight className="w-4 h-4" />
            </Link>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
