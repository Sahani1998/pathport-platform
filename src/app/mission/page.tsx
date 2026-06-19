import type { Metadata } from "next";
import { Eye, Layers, TrendingUp } from "lucide-react";
import MarketingShell from "@/components/marketing/MarketingShell";
import PageHero from "@/components/marketing/PageHero";
import Breadcrumbs from "@/components/marketing/Breadcrumbs";
import InfoCard from "@/components/marketing/InfoCard";
import JsonLd from "@/components/marketing/JsonLd";
import { breadcrumbJsonLd } from "@/lib/jsonld";

export const metadata: Metadata = {
  title: "Our Mission",
  description: "PathPort&apos;s mission is to make studying in Singapore transparent, remove unnecessary complexity, and improve student outcomes across India and Asia.",
  alternates: { canonical: "/mission" },
};

const PILLARS = [
  {
    icon: <Eye className="w-5 h-5" />,
    title: "Make Singapore admissions transparent",
    desc:  "Real tuition fees in INR and SGD. Live application status. Clear timelines for offer letters and IPA. No hidden agent commissions. Students and parents see exactly where their application stands at every step.",
  },
  {
    icon: <Layers className="w-5 h-5" />,
    title: "Remove unnecessary complexity",
    desc:  "One dashboard for students, one for institutions, one for admins. Every document, invoice, and notification flows through PathPort instead of fragmented email threads and WhatsApp screenshots. We replace process opacity with workflow clarity.",
  },
  {
    icon: <TrendingUp className="w-5 h-5" />,
    title: "Improve student outcomes",
    desc:  "We measure ourselves by whether students complete their diploma, secure their 6+6 internship, and progress in their career. The platform is judged not by enrolments but by what happens to students after they arrive.",
  },
];

export default function MissionPage() {
  return (
    <MarketingShell>
      <JsonLd data={breadcrumbJsonLd([{ name: "About", url: "/about" }, { name: "Mission", url: "/mission" }])} />
      <Breadcrumbs trail={[{ name: "About", url: "/about" }, { name: "Mission", url: "/mission" }]} />

      <PageHero
        eyebrow="Mission"
        title="Make studying in Singapore transparent."
        subtitle="Three commitments shape every decision we make — what we build, what we don&apos;t build, and how we treat the families who trust PathPort with one of the most important decisions of their lives."
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-16">
        {PILLARS.map(p => (
          <InfoCard key={p.title} icon={p.icon} title={p.title} description={p.desc} />
        ))}
      </div>

      <section className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-6">
        <h2 className="font-display text-xl text-white mb-4">What this means in practice</h2>
        <ul className="space-y-3 text-white/60 font-body text-sm leading-relaxed">
          <li>• Fees on every course page are the fees on the invoice. We don&apos;t add platform markups.</li>
          <li>• Application status updates come from the actual college&apos;s actions — not made-up timelines.</li>
          <li>• Your data is shared only with the college you apply to, and only as needed to process your application.</li>
          <li>• If something goes wrong, you get a real human on WhatsApp — not a chatbot.</li>
          <li>• We say what PathPort does and does not do, clearly, on every page. Notably: PathPort does not submit Student Pass / IPA to ICA. Your enrolled college does that from their official systems.</li>
        </ul>
      </section>
    </MarketingShell>
  );
}
