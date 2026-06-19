import type { Metadata } from "next";
import { BookOpen, GraduationCap, Plane, Shield } from "lucide-react";
import MarketingShell from "@/components/marketing/MarketingShell";
import PageHero from "@/components/marketing/PageHero";
import Breadcrumbs from "@/components/marketing/Breadcrumbs";
import InfoCard from "@/components/marketing/InfoCard";
import JsonLd from "@/components/marketing/JsonLd";
import { organizationJsonLd } from "@/lib/jsonld";

export const metadata: Metadata = {
  title: "About PathPort",
  description: "PathPort is the dedicated platform connecting Indian students to Singapore private college diploma programmes — with transparent fees, 24-hour offer letters, and end-to-end arrival support.",
  alternates: { canonical: "/about" },
  openGraph: {
    title: "About PathPort | Singapore Diploma Platform for Indian Students",
    description: "How PathPort helps Indian students study in Singapore — transparent process, real-time tracking, college-coordinated Student Pass / IPA submission.",
    url: "/about",
    type: "website",
  },
};

const PILLARS = [
  { icon: <BookOpen className="w-5 h-5" />, title: "Programme discovery", desc: "Compare diploma, advanced diploma, higher diploma, and specialist diploma programmes across vetted private colleges — by fees, intake date, and internship pathway." },
  { icon: <GraduationCap className="w-5 h-5" />, title: "Application & offer letters", desc: "We package your documents to the partner college's requirements and most students receive a conditional offer letter within 24 hours." },
  { icon: <Shield className="w-5 h-5" />, title: "Student Pass / IPA tracking", desc: "Your enrolled college submits the Student Pass / IPA application to ICA Singapore from their official systems. PathPort tracks every stage and notifies you." },
  { icon: <Plane className="w-5 h-5" />, title: "Arrival concierge", desc: "Changi pickup, accommodation, SIM, bank account, and orientation — coordinated before you land so your first week in Singapore is calm." },
];

export default function AboutPage() {
  return (
    <MarketingShell>
      <JsonLd data={organizationJsonLd} />
      <Breadcrumbs trail={[{ name: "About", url: "/about" }]} />

      <PageHero
        eyebrow="About"
        title="Singapore diplomas, made transparent for Indian students."
        subtitle="PathPort is the dedicated platform connecting Indian students to Singapore private college diploma programmes. We handle the application paperwork, surface real fee structures, and keep you informed at every stage — from interest form to internship eligibility."
      />

      <section className="space-y-6 mb-16">
        <h2 className="font-display text-2xl text-white">Why PathPort exists</h2>
        <div className="space-y-4 text-white/65 font-body text-base leading-relaxed">
          <p>For Indian students, applying to Singapore has historically meant fragmented agents, opaque fees, slow communication, and no single source of truth on application status. PathPort exists to fix that.</p>
          <p>We are a Singapore-based platform with an India-first focus. Every workflow on PathPort is built around the questions Indian families actually ask: what does a diploma cost in INR, when is the next intake, how long does the IPA take, and what does &ldquo;arrival support&rdquo; really include.</p>
          <p>Our role is to be the trusted intermediary — the student and family see one dashboard, the college sees a complete application, and nothing falls between the gaps.</p>
        </div>
      </section>

      <section className="mb-16">
        <h2 className="font-display text-2xl text-white mb-6">How PathPort works</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {PILLARS.map(p => (
            <InfoCard key={p.title} icon={p.icon} title={p.title} description={p.desc} />
          ))}
        </div>
      </section>

      <section className="mb-16">
        <h2 className="font-display text-2xl text-white mb-4">Why Singapore</h2>
        <div className="space-y-4 text-white/65 font-body text-base leading-relaxed">
          <p>Singapore is a five-hour flight from major Indian cities, ranks among the world&apos;s safest cities, teaches entirely in English, and has a globally recognised diploma system that opens doors to UK, Australian, and Canadian universities for advanced-standing entry.</p>
          <p>Private college diplomas typically cost a fraction of UK or Australian degrees, and the 6+6 model — six months of study followed by six months of paid internship — lets students earn while they learn.</p>
        </div>
      </section>

      <section>
        <h2 className="font-display text-2xl text-white mb-4">Our vision</h2>
        <p className="text-white/65 font-body text-base leading-relaxed">
          We&apos;re building the trusted student success platform for Asia — starting with India to Singapore, expanding to Sri Lanka, Nepal, Bangladesh, and Bhutan, and reaching every student who deserves a transparent path to an international education.
        </p>
      </section>
    </MarketingShell>
  );
}
