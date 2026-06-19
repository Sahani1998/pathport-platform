import type { Metadata } from "next";
import { Mail, FileText, Image as ImageIcon, Globe } from "lucide-react";
import MarketingShell from "@/components/marketing/MarketingShell";
import PageHero from "@/components/marketing/PageHero";
import Breadcrumbs from "@/components/marketing/Breadcrumbs";

export const metadata: Metadata = {
  title: "Press & Media",
  description: "Press resources for PathPort — company facts, brand assets, executive contacts, and media enquiries.",
  alternates: { canonical: "/press" },
};

const FACTS = [
  { label: "Founded",       value: "2026" },
  { label: "Headquarters",  value: "Singapore" },
  { label: "Primary market", value: "India → Singapore" },
  { label: "Future markets", value: "Sri Lanka, Nepal, Bangladesh, Bhutan" },
  { label: "Focus",         value: "Private college diploma, advanced diploma, higher diploma, specialist diploma" },
  { label: "Distinguishing claim", value: "Student Pass / IPA submission is handled by the enrolled college; PathPort provides tracking, document organisation, and student support" },
];

const RESOURCES = [
  { icon: <FileText className="w-4 h-4" />, title: "Company one-pager",     desc: "Short description, founder names, target market, and platform capabilities. Available on request." },
  { icon: <ImageIcon className="w-4 h-4" />, title: "Brand assets",         desc: "Logo files in SVG and PNG, brand colour codes (navy + gold), and usage guidelines. Available on request." },
  { icon: <Globe className="w-4 h-4" />,    title: "Executive interviews", desc: "Founders are available for interviews on Indian students studying in Singapore, the 6+6 internship model, and education-tech for Asia." },
];

export default function PressPage() {
  return (
    <MarketingShell maxWidth="narrow">
      <Breadcrumbs trail={[{ name: "About", url: "/about" }, { name: "Press", url: "/press" }]} />

      <PageHero
        eyebrow="Press & Media"
        title="Covering education-tech for Asia? Let&apos;s talk."
        subtitle="PathPort is a Singapore-based platform dedicated to Indian students applying to Singapore private college diploma programmes. Below is everything most journalists need; if you can&apos;t find it here, email us."
      />

      <section className="mb-10">
        <h2 className="font-display text-2xl text-white mb-5">Quick facts</h2>
        <div className="rounded-2xl bg-white/[0.03] border border-white/[0.07] overflow-hidden">
          {FACTS.map((f, i) => (
            <div key={f.label} className={`flex flex-col md:flex-row gap-2 md:gap-6 p-4 md:p-5 ${i > 0 ? "border-t border-white/[0.05]" : ""}`}>
              <span className="text-white/35 font-body text-xs uppercase tracking-widest md:w-44 flex-shrink-0">{f.label}</span>
              <span className="text-white/75 font-body text-sm leading-relaxed">{f.value}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-10">
        <h2 className="font-display text-2xl text-white mb-5">Resources</h2>
        <div className="space-y-3">
          {RESOURCES.map(r => (
            <div key={r.title} className="flex items-start gap-4 p-5 rounded-2xl bg-white/[0.03] border border-white/[0.07]">
              <div className="w-9 h-9 rounded-xl bg-gold-400/10 border border-gold-400/25 text-gold-400 flex items-center justify-center flex-shrink-0">{r.icon}</div>
              <div>
                <p className="font-body font-semibold text-white/85 text-base mb-1">{r.title}</p>
                <p className="text-white/50 font-body text-sm leading-relaxed">{r.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-6">
        <p className="font-display text-xl text-white mb-2">Media enquiries</p>
        <p className="text-white/55 font-body text-sm mb-5">For interviews, quotes, or asset requests, email us. We aim to respond within one business day.</p>
        <a
          href="mailto:pathportsg@gmail.com?subject=Press%20enquiry"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gold-400/10 border border-gold-400/30 text-gold-400 font-body text-sm font-semibold hover:bg-gold-400/20 transition-all"
        >
          <Mail className="w-4 h-4" /> pathportsg@gmail.com
        </a>
      </section>
    </MarketingShell>
  );
}
