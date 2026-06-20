import Link from "next/link";
import { ArrowRight, Building2, GraduationCap, MapPin } from "lucide-react";

/**
 * PrivateCollegeGuide — short explainer on what Singapore private colleges
 * actually are, how they relate to MoE/CPE, and what students can expect.
 * Plain language, no marketing-speak. Links out to /resources for depth.
 */
export default function PrivateCollegeGuide() {
  return (
    <section className="relative public-section-white">
      <div className="max-w-7xl mx-auto px-5 md:px-10 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-12 items-start">

          {/* Left — heading + intro */}
          <div className="lg:sticky lg:top-24">
            <p className="text-pathBlue-700 font-body text-xs font-semibold tracking-[0.22em] uppercase mb-4">
              Private College Guide
            </p>
            <h2 className="font-display text-3xl md:text-4xl text-navy-900 leading-[1.1] mb-5">
              How Singapore private colleges actually work.
            </h2>
            <p className="text-navy-800/65 font-body text-base leading-relaxed mb-6">
              Singapore&apos;s private education sector is regulated by the{" "}
              <span className="text-navy-900 font-semibold">Committee for Private Education (CPE)</span>
              {" "}under SkillsFuture Singapore. Private colleges are independent institutions — not universities — and they specialise in industry-focused diploma and advanced diploma programmes that take a fraction of the time and cost of a full degree.
            </p>
            <Link
              href="/resources/study-in-singapore"
              className="inline-flex items-center gap-2 text-pathBlue-700 hover:text-pathBlue-600 font-body text-sm font-semibold transition-colors"
            >
              Read the full study-in-Singapore guide
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Right — points */}
          <div className="space-y-4">
            {[
              {
                Icon: Building2,
                title: "Independent, CPE-registered institutions",
                body: "Every PathPort-listed college is registered with CPE and audited regularly. None operate without CPE approval — that’s a non-negotiable for student welfare and recognition.",
              },
              {
                Icon: GraduationCap,
                title: "Diplomas, not degrees — by design",
                body: "Private colleges focus on diploma, advanced diploma, higher diploma, and specialist diploma programmes. They’re shorter (12–24 months typical), more practical, and built around industry partnerships.",
              },
              {
                Icon: MapPin,
                title: "Singapore-recognised, ASEAN-respected",
                body: "Qualifications from CPE-registered colleges are recognised across Singapore and most ASEAN employers. They can also lead to advanced standing entry at degree programmes in Singapore, UK, and Australia.",
              },
            ].map(({ Icon, title, body }) => (
              <div key={title} className="p-6 rounded-2.5xl public-card">
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 rounded-xl bg-gold-400/15 border border-gold-400/30 text-gold-600 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5" strokeWidth={1.75} />
                  </div>
                  <div>
                    <h3 className="font-body font-semibold text-navy-900 text-base mb-1.5 leading-snug">{title}</h3>
                    <p className="text-navy-800/60 font-body text-sm leading-relaxed">{body}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
