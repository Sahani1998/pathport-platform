import Link from "next/link";
import Reveal from "@/components/ui/Reveal";
import { ArrowRight, Search, FileCheck, BadgeCheck, Shield, Luggage, Plane, Home, GraduationCap, type LucideIcon } from "lucide-react";

/**
 * JourneyVisualTimeline — horizontal 8-step journey, photography-anchored.
 *
 * Replaces the previous 4-card "JourneySummary" grid with a true horizontal
 * timeline: 8 icon dots threaded onto a connector line, each with a step
 * number, a short title, and a one-line description. Mobile collapses to a
 * vertical version. Below the strip sits one featured beat — a side-by-side
 * "what step 5 looks like" image+caption pair — to break the diagrammatic
 * feel and remind visitors this is a real human journey, not a UI flow.
 */

interface Step {
  Icon: LucideIcon;
  step: string;
  title: string;
  desc: string;
}

const STEPS: Step[] = [
  { Icon: Search,        step: "01", title: "Discover",  desc: "Browse colleges and shortlist programmes that fit your background." },
  { Icon: FileCheck,     step: "02", title: "Apply",     desc: "PathPort prepares and submits your application — fee-free." },
  { Icon: BadgeCheck,    step: "03", title: "Offer",     desc: "Conditional offer letter from your chosen college — within 24 hours." },
  { Icon: Shield,        step: "04", title: "Pass",      desc: "Your college submits the Student Pass / IPA to ICA Singapore." },
  { Icon: Luggage,       step: "05", title: "Pack",      desc: "Pre-departure briefing — documents, packing list, what to expect." },
  { Icon: Plane,         step: "06", title: "Arrive",    desc: "A PathPort representative meets you at Changi Airport." },
  { Icon: Home,          step: "07", title: "Settle",    desc: "Accommodation, SIM, bank account, orientation — all handled." },
  { Icon: GraduationCap, step: "08", title: "Study + Earn", desc: "Diploma classes begin. The 6+6 paid internship is six months away." },
];

export default function JourneyVisualTimeline() {
  return (
    <section className="relative public-section-white overflow-hidden">
      <div className="layout-shell section-medium">

        <Reveal className="max-w-3xl mb-16">
          <p className="eyebrow text-gold-700 mb-4">The Journey</p>
          <h2 className="display-2 text-navy-900 mb-5">
            From your first search to your{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold-600 to-gold-500">
              first day of class.
            </span>
          </h2>
          <p className="prose-lg text-navy-800/65">
            Eight steps, fully guided. No agents in the middle, no chasing emails, no surprise fees.
          </p>
        </Reveal>

        {/* Desktop horizontal timeline */}
        <div className="hidden lg:block relative">
          {/* Connector line */}
          <div
            aria-hidden
            className="absolute top-9 left-[5%] right-[5%] h-px"
            style={{
              background: "linear-gradient(to right, rgba(30,78,216,0.2) 0%, rgba(201,168,76,0.5) 50%, rgba(30,78,216,0.2) 100%)",
            }}
          />
          <ol className="relative grid grid-cols-8 gap-3">
            {STEPS.map(({ Icon, step, title, desc }, i) => (
              <Reveal key={step} delay={i * 50}>
                <li className="text-center">
                  <div className="relative mx-auto w-[72px] h-[72px] mb-5">
                    <div className="absolute inset-0 rounded-full bg-white border-2 border-pathBlue-500/30 shadow-[0_8px_24px_-8px_rgba(30,78,216,0.25)]" />
                    <div className="relative w-full h-full rounded-full flex items-center justify-center bg-gradient-to-br from-pathBlue-50 to-white text-pathBlue-700">
                      <Icon className="w-7 h-7" strokeWidth={1.75} />
                    </div>
                  </div>
                  <p className="eyebrow text-gold-700 mb-1.5">{step}</p>
                  <p className="font-display text-lg text-navy-900 leading-tight mb-2">{title}</p>
                  <p className="font-body text-navy-800/55 text-xs leading-relaxed px-1">{desc}</p>
                </li>
              </Reveal>
            ))}
          </ol>
        </div>

        {/* Mobile / tablet vertical timeline */}
        <div className="lg:hidden relative pl-6">
          <div
            aria-hidden
            className="absolute top-3 bottom-3 left-[14px] w-px"
            style={{
              background: "linear-gradient(to bottom, rgba(30,78,216,0.2) 0%, rgba(201,168,76,0.5) 50%, rgba(30,78,216,0.2) 100%)",
            }}
          />
          <ol className="space-y-6">
            {STEPS.map(({ Icon, step, title, desc }, i) => (
              <Reveal key={step} delay={i * 40}>
                <li className="relative">
                  <div className="absolute -left-6 top-0 w-7 h-7 rounded-full bg-white border-2 border-pathBlue-500/30 flex items-center justify-center text-pathBlue-700">
                    <Icon className="w-3.5 h-3.5" strokeWidth={2} />
                  </div>
                  <p className="eyebrow text-gold-700 mb-1">{step}</p>
                  <p className="font-display text-xl text-navy-900 leading-tight mb-1.5">{title}</p>
                  <p className="font-body text-navy-800/60 text-sm leading-relaxed">{desc}</p>
                </li>
              </Reveal>
            ))}
          </ol>
        </div>

        <div className="mt-14 flex justify-center">
          <Link
            href="/students"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white border border-slate-200 hover:border-pathBlue-500/40 text-pathBlue-700 font-body text-sm font-semibold transition-colors"
          >
            See the full student journey
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
