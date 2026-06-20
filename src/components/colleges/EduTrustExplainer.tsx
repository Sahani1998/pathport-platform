import Link from "next/link";
import { BadgeCheck, ArrowRight, ShieldCheck, FileText, Users } from "lucide-react";

/**
 * EduTrustExplainer — cream "rest" section explaining what EduTrust
 * certification means and why it matters for parents. Honest framing —
 * no exaggerated claims, links to /trust for verification details.
 */
const STANDARDS = [
  {
    Icon: ShieldCheck,
    label: "Quality governance",
    body: "Board, curriculum, and faculty quality reviewed against CPE benchmarks.",
  },
  {
    Icon: Users,
    label: "Student welfare",
    body: "Fee protection scheme, dispute resolution, and clear refund policies.",
  },
  {
    Icon: FileText,
    label: "Financial soundness",
    body: "Audited finances and operational stability — your fees are protected.",
  },
];

export default function EduTrustExplainer() {
  return (
    <section className="relative cream-band">
      <div className="max-w-6xl mx-auto px-5 md:px-10 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.1fr] gap-12 items-center">

          {/* Left — heading */}
          <div>
            <p className="inline-flex items-center gap-3 text-gold-700 font-body text-xs font-semibold tracking-[0.22em] uppercase mb-5">
              <span className="w-8 h-px bg-gold-700/50 rounded-full" />
              EduTrust Certification
            </p>
            <h2 className="font-display text-3xl md:text-4xl text-navy-900 leading-[1.1] mb-5">
              What “EduTrust certified” actually means for your family.
            </h2>
            <p className="text-navy-800/70 font-body text-base leading-relaxed mb-7">
              EduTrust is Singapore&rsquo;s government-backed certification scheme for private education institutions. To earn it, a college must meet rigorous standards across academic quality, financial soundness, and student welfare — and renew its certification on a regular cycle.
            </p>
            <p className="text-navy-800/70 font-body text-base leading-relaxed mb-7">
              <span className="text-navy-900 font-semibold">Every college on PathPort is EduTrust certified.</span> We don&rsquo;t list institutions that aren&rsquo;t — that&rsquo;s the line we don&rsquo;t cross, regardless of partnership pressure.
            </p>
            <Link
              href="/trust/institution-verification"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gold-500/95 hover:bg-gold-500 text-navy-900 font-body text-sm font-bold transition-all"
            >
              How verification works
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Right — standards card */}
          <div className="warm-panel-card rounded-3xl p-6 md:p-7">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-11 h-11 rounded-xl bg-gold-200/60 border border-gold-500/30 text-gold-700 flex items-center justify-center flex-shrink-0">
                <BadgeCheck className="w-5 h-5" />
              </div>
              <div>
                <p className="text-navy-800/60 font-body text-xs">Backed by CPE Singapore</p>
                <p className="font-display text-lg text-navy-900 leading-tight">Three things EduTrust audits</p>
              </div>
            </div>

            <ul className="space-y-3">
              {STANDARDS.map(({ Icon, label, body }) => (
                <li key={label} className="flex items-start gap-3 p-3 rounded-xl bg-white/70 border border-gold-500/15">
                  <div className="w-8 h-8 rounded-lg bg-gold-100 border border-gold-500/25 text-gold-700 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-4 h-4" strokeWidth={2} />
                  </div>
                  <div>
                    <p className="font-body font-semibold text-navy-900 text-sm leading-snug">{label}</p>
                    <p className="font-body text-navy-800/65 text-xs leading-relaxed mt-0.5">{body}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
