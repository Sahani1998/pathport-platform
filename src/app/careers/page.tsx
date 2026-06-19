import type { Metadata } from "next";
import { Mail, Sparkles } from "lucide-react";
import MarketingShell from "@/components/marketing/MarketingShell";
import PageHero from "@/components/marketing/PageHero";
import Breadcrumbs from "@/components/marketing/Breadcrumbs";
import JsonLd from "@/components/marketing/JsonLd";
import { breadcrumbJsonLd } from "@/lib/jsonld";

export const metadata: Metadata = {
  title: "Careers at PathPort",
  description: "Join PathPort. We&apos;re building the trusted student success platform for Asia — student advisors, engineers, content creators, and operations roles open as we grow.",
  alternates: { canonical: "/careers" },
};

const VALUES = [
  { title: "Student-first", body: "Every decision is judged by what it does for student outcomes." },
  { title: "Transparent by default", body: "Fees, timelines, and processes are visible. We say what we do and what we don&apos;t." },
  { title: "Build it once, build it right", body: "We invest in real workflows over short-term shortcuts." },
  { title: "Asia-fluent", body: "We understand the cultural context of Indian families and Singapore institutions." },
];

const AREAS = [
  { area: "Student advisors", desc: "Talk to Indian students daily. Help them choose the right diploma. Coordinate with admissions teams." },
  { area: "Engineering", desc: "Next.js, Supabase, TypeScript. Build for students, institutions, and admins. Production-first, no demo apps." },
  { area: "Content & SEO", desc: "Write the Resource Center, Blog, and Trust Center. Make complex Singapore admissions readable for a 17-year-old in Chennai." },
  { area: "Operations", desc: "Institution onboarding, document workflows, payment reconciliation. The people who make the platform actually work." },
];

export default function CareersPage() {
  return (
    <MarketingShell>
      <JsonLd data={breadcrumbJsonLd([{ name: "About", url: "/about" }, { name: "Careers", url: "/careers" }])} />
      <Breadcrumbs trail={[{ name: "About", url: "/about" }, { name: "Careers", url: "/careers" }]} />

      <PageHero
        eyebrow="Careers"
        title="Help build the trusted student success platform for Asia."
        subtitle="We don&apos;t have open public roles right now, but we&apos;re always interested in people who care deeply about international education and have built things they&apos;re proud of. Introduce yourself — we&apos;ll keep your details on file as roles open."
      />

      <section className="mb-12">
        <h2 className="font-display text-2xl text-white mb-6">What we value</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {VALUES.map(v => (
            <div key={v.title} className="p-5 rounded-2xl bg-white/[0.04] border border-white/[0.08]">
              <p className="font-body font-semibold text-white/90 text-base mb-1.5">{v.title}</p>
              <p className="text-white/55 font-body text-sm leading-relaxed">{v.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-12">
        <h2 className="font-display text-2xl text-white mb-6">Areas we hire into</h2>
        <div className="space-y-3">
          {AREAS.map(a => (
            <div key={a.area} className="flex items-start gap-4 p-5 rounded-2xl bg-white/[0.03] border border-white/[0.07]">
              <Sparkles className="w-4 h-4 text-gold-400 flex-shrink-0 mt-1" />
              <div>
                <p className="font-body font-semibold text-white/85 text-base mb-1">{a.area}</p>
                <p className="text-white/50 font-body text-sm leading-relaxed">{a.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-gradient-to-br from-gold-400/[0.08] to-transparent border border-gold-400/20 rounded-2xl p-8 text-center">
        <p className="font-display text-2xl text-white mb-3">Internships welcome</p>
        <p className="text-white/55 font-body text-sm mb-6 max-w-xl mx-auto leading-relaxed">
          Singapore polytechnic students looking for internships — particularly in engineering, content, and operations — are encouraged to introduce themselves. We mentor seriously and credit work openly.
        </p>
        <a
          href="mailto:pathportsg@gmail.com?subject=Careers%20at%20PathPort"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-gold-500 to-gold-400 text-navy-900 font-body font-bold text-sm hover:shadow-gold-sm transition-all"
        >
          <Mail className="w-4 h-4" /> Introduce yourself
        </a>
      </section>
    </MarketingShell>
  );
}
