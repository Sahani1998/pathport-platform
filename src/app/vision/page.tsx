import type { Metadata } from "next";
import MarketingShell from "@/components/marketing/MarketingShell";
import PageHero from "@/components/marketing/PageHero";
import Breadcrumbs from "@/components/marketing/Breadcrumbs";

export const metadata: Metadata = {
  title: "Our Vision",
  description: "PathPort&apos;s vision is to become the trusted student success platform for Asia — connecting students from India, Sri Lanka, Nepal, Bangladesh, and Bhutan to Singapore.",
  alternates: { canonical: "/vision" },
};

const HORIZONS = [
  {
    year: "Today",
    title: "India to Singapore",
    body:  "PathPort is the dedicated platform for Indian students applying to Singapore private college diplomas. Application, offer letter, fee payment, IPA tracking, and arrival services live in one dashboard.",
  },
  {
    year: "Next 12 months",
    title: "Trust ecosystem",
    body:  "Trust Center, Resource Center, Blog, and Insights — content that builds long-term confidence with students, parents, institutions, and regulators. PathPort becomes the place families go for credible Singapore education information.",
  },
  {
    year: "Next 24 months",
    title: "Regional expansion",
    body:  "Sri Lanka, Nepal, Bangladesh, and Bhutan to Singapore. The platform&apos;s core remains the same — only the source country changes. Same colleges, same diploma programmes, same trusted workflow.",
  },
  {
    year: "Beyond",
    title: "Full student lifecycle",
    body:  "Internship matching, scholarship discovery, post-graduation career placement, alumni networks. The trusted student success platform for Asia — measured by long-term outcomes, not enrolment counts.",
  },
];

export default function VisionPage() {
  return (
    <MarketingShell>
      <Breadcrumbs trail={[{ name: "About", url: "/about" }, { name: "Vision", url: "/vision" }]} />

      <PageHero
        eyebrow="Vision"
        title="The trusted student success platform for Asia."
        subtitle="Where PathPort is today, where it&apos;s going, and what students should expect from us as we grow."
      />

      <div className="relative">
        <div aria-hidden className="absolute left-[15px] top-2 bottom-2 w-px bg-gradient-to-b from-gold-400/40 via-white/10 to-transparent" />

        <div className="space-y-8">
          {HORIZONS.map((h) => (
            <div key={h.year} className="relative pl-12">
              <div className="absolute left-0 top-1 w-8 h-8 rounded-full bg-navy-900 border-2 border-gold-400/40 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-gold-400" />
              </div>
              <p className="text-gold-400 font-body text-xs font-bold uppercase tracking-widest mb-1.5">{h.year}</p>
              <h2 className="font-display text-2xl text-white mb-2 leading-snug">{h.title}</h2>
              <p className="text-white/55 font-body text-base leading-relaxed">{h.body}</p>
            </div>
          ))}
        </div>
      </div>
    </MarketingShell>
  );
}
