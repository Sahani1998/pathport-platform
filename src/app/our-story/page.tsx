import type { Metadata } from "next";
import MarketingShell from "@/components/marketing/MarketingShell";
import PageHero from "@/components/marketing/PageHero";
import Breadcrumbs from "@/components/marketing/Breadcrumbs";

export const metadata: Metadata = {
  title: "Our Story",
  description: "How PathPort was built — from a recurring family frustration about Singapore admissions into a Singapore-based, India-focused diploma platform.",
  alternates: { canonical: "/our-story" },
};

const CHAPTERS = [
  {
    eyebrow: "The problem",
    title:   "Singapore admissions felt like a black box",
    body:    "Year after year, Indian families paid agents thousands of rupees, sent passport scans over WhatsApp, and were left guessing about offer letters, payment status, and Student Pass timing. The information was out there — but spread across emails, agent voice notes, and ICA portals only the college could access.",
  },
  {
    eyebrow: "The discovery",
    title:   "Colleges wanted a cleaner pipeline too",
    body:    "Conversations with admissions teams at Singapore private colleges revealed the other side. Colleges wanted complete, well-documented applications and a clear channel to update students. The student experience and the institution experience were both broken — by the same gap.",
  },
  {
    eyebrow: "Building PathPort",
    title:   "One dashboard, one source of truth",
    body:    "PathPort started as a single application pipeline: a student dashboard, an institution dashboard, an admin layer, and shared timeline events that both sides could see. Document review, offer letters, invoicing, and IPA status tracking all sit inside one workflow — no WhatsApp guesswork.",
  },
  {
    eyebrow: "Today",
    title:   "A trusted ecosystem for Singapore diplomas",
    body:    "PathPort now connects students to private college diploma, advanced diploma, higher diploma, and specialist diploma programmes. Tuition fees are visible upfront. Offer letters typically arrive within 24 hours. Your enrolled college submits the Student Pass / IPA to ICA — PathPort tracks every stage and writes back to your dashboard.",
  },
  {
    eyebrow: "Future roadmap",
    title:   "From India-Singapore to Asia-wide",
    body:    "We&apos;re expanding to serve Sri Lanka, Nepal, Bangladesh, and Bhutan students applying to Singapore. Our long-term plan includes employer internship matching, scholarship discovery, and post-graduation career placement — all on the same trusted dashboard.",
  },
];

export default function OurStoryPage() {
  return (
    <MarketingShell maxWidth="narrow">
      <Breadcrumbs trail={[{ name: "About", url: "/about" }, { name: "Our Story", url: "/our-story" }]} />

      <PageHero
        eyebrow="Our Story"
        title="Why PathPort exists, in five chapters."
        subtitle="The short version: international education is one of the biggest decisions a family makes, and it shouldn&apos;t feel like a black box."
      />

      <div className="space-y-10">
        {CHAPTERS.map((c, i) => (
          <article key={c.title} className="relative pl-8">
            <div className="absolute left-0 top-1 w-6 h-6 rounded-full bg-gold-400/10 border border-gold-400/30 flex items-center justify-center">
              <span className="font-body text-[11px] font-bold text-gold-400">{i + 1}</span>
            </div>
            <p className="text-gold-400/70 font-body text-[11px] font-semibold uppercase tracking-widest mb-2">{c.eyebrow}</p>
            <h2 className="font-display text-2xl text-white mb-3 leading-snug">{c.title}</h2>
            <p className="text-white/60 font-body text-base leading-relaxed">{c.body}</p>
          </article>
        ))}
      </div>
    </MarketingShell>
  );
}
