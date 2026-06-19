import Link from "next/link";
import Reveal from "@/components/ui/Reveal";
import { ShieldCheck, MessageCircle, Plane, ArrowRight } from "lucide-react";

/**
 * SingaporeTeaser — short "life in Singapore" teaser for the homepage.
 * The full guides (student life, cost of living, study guide) live under
 * /resources. This is the homepage taster with a clear "explore more" link.
 */
const HIGHLIGHTS = [
  {
    Icon: ShieldCheck,
    stat: "#1",
    title: "Safest city in Asia",
    desc: "Students walk home at night and use public transport at any hour. Real peace of mind for parents.",
  },
  {
    Icon: MessageCircle,
    stat: "100%",
    title: "English medium",
    desc: "All education, work, and daily life run in English. No language barrier from day one.",
  },
  {
    Icon: Plane,
    stat: "5 hrs",
    title: "From India",
    desc: "A short direct flight, a large Indian community, and familiar food everywhere you go.",
  },
];

export default function SingaporeTeaser() {
  return (
    <section id="singapore" className="relative py-20 overflow-hidden">
      <div aria-hidden className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/[0.07] to-transparent" />
      <div aria-hidden className="absolute top-1/3 right-0 w-[450px] h-[450px] rounded-full bg-pathBlue-500/[0.05] blur-[130px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-5 md:px-10">
        <Reveal className="text-center mb-12">
          <p className="inline-flex items-center gap-3 text-gold-400 font-body text-xs font-semibold tracking-[0.22em] uppercase mb-4">
            <span className="w-8 h-px bg-gold-400/50 rounded-full" />
            Life in Singapore
            <span className="w-8 h-px bg-gold-400/50 rounded-full" />
          </p>
          <h2 className="font-display text-4xl md:text-5xl text-white mb-4 leading-[1.08]">
            A city that feels like{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold-400 to-gold-300">
              a second home.
            </span>
          </h2>
          <p className="text-white/50 font-body text-lg max-w-2xl mx-auto leading-relaxed">
            Before you study, know where you&apos;re going. Here&apos;s why Indian students settle in fast.
          </p>
        </Reveal>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          {HIGHLIGHTS.map(({ Icon, stat, title, desc }, i) => (
            <Reveal key={title} delay={i * 80} className="h-full">
              <div className="h-full p-6 rounded-2.5xl bg-white/[0.04] border border-white/[0.08] hover:border-gold-400/30 hover:bg-white/[0.05] transition-colors duration-300">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-11 h-11 rounded-xl bg-gold-400/10 border border-gold-400/25 flex items-center justify-center text-gold-400 flex-shrink-0">
                    <Icon className="w-5 h-5" strokeWidth={1.75} />
                  </div>
                  <span className="font-display text-3xl text-gold-400 font-bold leading-none">{stat}</span>
                </div>
                <h3 className="font-body font-semibold text-white text-base mb-2 leading-snug">{title}</h3>
                <p className="text-white/48 font-body text-sm leading-relaxed">{desc}</p>
              </div>
            </Reveal>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-5">
          <Link
            href="/resources/student-life"
            className="inline-flex items-center gap-2 text-gold-400 hover:text-gold-300 font-body text-sm font-semibold transition-colors"
          >
            Explore student life in Singapore
            <ArrowRight className="w-4 h-4" />
          </Link>
          <span className="hidden sm:block w-px h-4 bg-white/15" aria-hidden />
          <Link
            href="/resources/study-in-singapore"
            className="inline-flex items-center gap-2 text-white/55 hover:text-white/80 font-body text-sm font-semibold transition-colors"
          >
            Why study in Singapore
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
