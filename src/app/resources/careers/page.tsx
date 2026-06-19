import type { Metadata } from "next";
import MarketingShell from "@/components/marketing/MarketingShell";
import PageHero from "@/components/marketing/PageHero";
import Breadcrumbs from "@/components/marketing/Breadcrumbs";
import JsonLd from "@/components/marketing/JsonLd";
import { breadcrumbJsonLd } from "@/lib/jsonld";

export const metadata: Metadata = {
  title: "Career Outcomes After a Singapore Diploma | PathPort",
  description: "What happens after your Singapore diploma? Employment in Singapore, PR pathways, returning to India, and how the 6+6 internship affects your career trajectory.",
  alternates: { canonical: "/resources/careers" },
};

const PATHWAYS = [
  {
    title: "Employment in Singapore",
    body: "Many students who complete the 6+6 programme receive employment offers from their internship host company or from other Singapore employers. To work in Singapore post-graduation, you need an Employment Pass (EP) or S Pass, depending on your salary and qualifications. Your Singapore diploma and local internship experience significantly strengthen EP/S Pass applications.",
  },
  {
    title: "Singapore Permanent Residency (PR)",
    body: "After working in Singapore for 2–5 years on an EP or S Pass, many Indian professionals apply for Permanent Residency. A Singapore diploma combined with professional experience and a clear tax history strengthens a PR application. PR is not automatic — ICA evaluates economic contribution, integration, and duration of stay.",
  },
  {
    title: "Career in India with Singapore credentials",
    body: "Indian employers in hospitality, IT, finance, healthcare management, and logistics increasingly value candidates with international education and real foreign work experience. A Singapore diploma and internship on your CV signals maturity, English fluency, and cross-cultural professional ability.",
  },
  {
    title: "Further education",
    body: "Some students use their Singapore diploma as a pathway to further education — either in Singapore (via advanced diplomas or top-up degrees) or internationally. UK, Australia, and Canadian institutions sometimes accept Singapore private college diplomas with appropriate credits. Check directly with the receiving institution.",
  },
  {
    title: "Entrepreneurship",
    body: "Singapore is one of the world's most business-friendly environments. Some graduates use their Singapore networks and regional understanding to build companies. PathPort cannot advise on business visas, but Singapore's EntrePass and Startup SG programmes are worth researching independently.",
  },
];

const INDUSTRIES = [
  { industry: "Hospitality & Tourism", demand: "High", outlook: "Singapore is a global MICE destination. Hotels, cruise lines, and event companies hire Singapore-trained hospitality graduates." },
  { industry: "IT & Technology", demand: "Very High", outlook: "Singapore's tech sector grows consistently. Entry-level IT support, web development, and data roles are accessible with a diploma + internship background." },
  { industry: "Finance & Banking", demand: "Moderate", outlook: "Singapore is a global financial hub. Operations and admin roles in banks and fintech companies are realistic post-diploma targets." },
  { industry: "Healthcare Support", demand: "High", outlook: "Singapore's ageing population drives demand for healthcare admin, medical assistant, and clinic management roles." },
  { industry: "Logistics & Supply Chain", demand: "High", outlook: "Singapore is a global logistics node. Shipping, freight forwarding, and supply chain coordinator roles are accessible with a diploma." },
  { industry: "Creative & Media", demand: "Moderate", outlook: "Marketing, social media, and design roles in Singapore's growing digital economy. Diploma plus portfolio is the typical entry point." },
];

export default function CareersPage() {
  return (
    <MarketingShell maxWidth="narrow">
      <JsonLd data={breadcrumbJsonLd([{ name: "Resources", url: "/resources" }, { name: "Careers", url: "/resources/careers" }])} />
      <Breadcrumbs trail={[{ name: "Resources", url: "/resources" }, { name: "Careers", url: "/resources/careers" }]} />

      <PageHero
        eyebrow="Careers"
        title="What comes after your Singapore diploma."
        subtitle="A Singapore diploma is a credential — but your internship experience, network, and discipline matter just as much. Here is what realistic career outcomes look like for Indian graduates."
      />

      <section className="mb-10">
        <h2 className="font-display text-2xl text-white mb-5">Career pathways</h2>
        <div className="space-y-3">
          {PATHWAYS.map(p => (
            <div key={p.title} className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.07]">
              <p className="font-body font-semibold text-white/90 text-sm mb-2">{p.title}</p>
              <p className="text-white/55 font-body text-sm leading-relaxed">{p.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-10">
        <h2 className="font-display text-2xl text-white mb-5">Industry demand in Singapore</h2>
        <div className="rounded-2xl bg-white/[0.03] border border-white/[0.07] overflow-hidden">
          {INDUSTRIES.map((ind, i) => (
            <div key={ind.industry} className={`p-5 ${i > 0 ? "border-t border-white/[0.05]" : ""}`}>
              <div className="flex items-center gap-3 mb-2">
                <p className="font-body font-semibold text-white/85 text-sm">{ind.industry}</p>
                <span className={`px-2 py-0.5 rounded-full font-body text-[10px] font-semibold ${ind.demand === "Very High" ? "bg-gold-400/10 text-gold-400 border border-gold-400/25" : ind.demand === "High" ? "bg-white/[0.06] text-white/60 border border-white/[0.12]" : "bg-white/[0.04] text-white/40 border border-white/[0.08]"}`}>{ind.demand}</span>
              </div>
              <p className="text-white/50 font-body text-sm leading-relaxed">{ind.outlook}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-5">
        <p className="font-body font-semibold text-white/85 text-sm mb-2">PathPort does not guarantee employment outcomes</p>
        <p className="text-white/55 font-body text-sm leading-relaxed">Career outcomes depend on individual effort, market conditions, employer decisions, and Singapore government policies. PathPort provides information and guides — not employment guarantees. The 6+6 internship gives you an opportunity; what you do with it is up to you.</p>
      </section>
    </MarketingShell>
  );
}
