import Link from "next/link";
import Reveal from "@/components/ui/Reveal";
import { ClipboardList, FileCheck, Plane, GraduationCap, ArrowRight } from "lucide-react";

/**
 * JourneySummary — concise 4-step "how it works" row for the homepage.
 * The full 8-step timeline lives on /students. This is the teaser version.
 */
const STEPS = [
  {
    Icon: ClipboardList,
    step: "01",
    title: "Register Interest",
    desc: "Submit the free form. A PathPort advisor calls you within 24 hours.",
  },
  {
    Icon: FileCheck,
    step: "02",
    title: "Offer Letter in 24hrs",
    desc: "We prepare your application and secure a conditional offer — fast.",
  },
  {
    Icon: Plane,
    step: "03",
    title: "Student Pass & Arrival",
    desc: "Your college submits the Student Pass / IPA. We handle airport pickup and setup.",
  },
  {
    Icon: GraduationCap,
    step: "04",
    title: "Study + Earn",
    desc: "Start your diploma and enter the 6+6 pathway — study and earn in one year.",
  },
];

export default function JourneySummary() {
  return (
    <section id="how-it-works" className="relative py-20 overflow-hidden">
      <div aria-hidden className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/[0.07] to-transparent" />

      <div className="max-w-7xl mx-auto px-5 md:px-10">
        <Reveal className="text-center mb-12">
          <p className="inline-flex items-center gap-3 text-gold-400 font-body text-xs font-semibold tracking-[0.22em] uppercase mb-4">
            <span className="w-8 h-px bg-gold-400/50 rounded-full" />
            How It Works
            <span className="w-8 h-px bg-gold-400/50 rounded-full" />
          </p>
          <h2 className="font-display text-4xl md:text-5xl text-white mb-4 leading-[1.08]">
            India to Singapore in{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold-400 to-gold-300">
              4 simple steps
            </span>
          </h2>
          <p className="text-white/50 font-body text-lg max-w-2xl mx-auto leading-relaxed">
            PathPort guides every step — from your first enquiry to your first day of class.
          </p>
        </Reveal>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {STEPS.map(({ Icon, step, title, desc }, i) => (
            <Reveal key={step} delay={i * 80} className="h-full">
              <div className="relative h-full p-6 rounded-2.5xl bg-white/[0.04] border border-white/[0.08] hover:border-gold-400/30 hover:bg-white/[0.05] transition-colors duration-300">
                {i < STEPS.length - 1 && (
                  <div aria-hidden className="hidden lg:block absolute top-9 -right-2 w-4 h-px bg-gold-400/30 z-10" />
                )}
                <div className="flex items-center justify-between mb-4">
                  <div className="w-11 h-11 rounded-xl bg-gold-400/10 border border-gold-400/25 flex items-center justify-center text-gold-400">
                    <Icon className="w-5 h-5" strokeWidth={1.75} />
                  </div>
                  <span className="font-display font-bold text-2xl text-gold-400/30 leading-none">{step}</span>
                </div>
                <h3 className="font-body font-semibold text-white text-base mb-2 leading-snug">{title}</h3>
                <p className="text-white/48 font-body text-sm leading-relaxed">{desc}</p>
              </div>
            </Reveal>
          ))}
        </div>

        <div className="text-center">
          <Link
            href="/students"
            className="inline-flex items-center gap-2 text-gold-400 hover:text-gold-300 font-body text-sm font-semibold transition-colors"
          >
            See the full 8-step journey
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
