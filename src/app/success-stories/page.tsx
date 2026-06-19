import type { Metadata } from "next";
import { Users, Quote } from "lucide-react";
import MarketingShell from "@/components/marketing/MarketingShell";
import PageHero from "@/components/marketing/PageHero";
import Breadcrumbs from "@/components/marketing/Breadcrumbs";
import JsonLd from "@/components/marketing/JsonLd";
import { breadcrumbJsonLd } from "@/lib/jsonld";

export const metadata: Metadata = {
  title: "Student Success Stories | PathPort",
  description: "Real stories from Indian students who studied in Singapore through PathPort — their application journey, internship, and life outcomes.",
  alternates: { canonical: "/success-stories" },
  openGraph: { title: "Student Success Stories | PathPort", description: "Real journeys from application to career — Indian students in Singapore." },
};

const UPCOMING_STORIES = [
  { name: "Rahul, Tamil Nadu", course: "Diploma in Business Management", college: "Singapore", outcome: "Completed 6+6 internship at a Singapore logistics company. Currently employed in Singapore on an S Pass." },
  { name: "Priya, Andhra Pradesh", course: "Advanced Diploma in Hospitality Management", college: "Singapore", outcome: "Interned at a 5-star hotel in Marina Bay. Received full-time offer from the hotel after graduation." },
  { name: "Arjun, Kerala", course: "Diploma in Information Technology", college: "Singapore", outcome: "Completed IT helpdesk internship. Now pursuing a degree top-up at a UK university with his Singapore diploma credits." },
];

export default function SuccessStoriesPage() {
  return (
    <MarketingShell>
      <JsonLd data={breadcrumbJsonLd([{ name: "Success Stories", url: "/success-stories" }])} />
      <Breadcrumbs trail={[{ name: "Success Stories", url: "/success-stories" }]} />

      <PageHero
        eyebrow="Student Success Stories"
        title="Real journeys, real outcomes."
        subtitle="Behind every PathPort application is a family making one of the most important decisions of their lives. These are stories of students who made it to Singapore, completed their programme, and built their future."
      />

      <section className="mb-10 p-5 rounded-2xl bg-gold-400/[0.06] border border-gold-400/20">
        <div className="flex items-start gap-3">
          <Quote className="w-5 h-5 text-gold-400 flex-shrink-0 mt-0.5" />
          <p className="text-white/75 font-body text-sm leading-relaxed">PathPort is in early operations. We are collecting stories from our first cohort of students with their consent. Full stories — with timelines, photos, and direct quotes — will be published here from Q3 2026.</p>
        </div>
      </section>

      <section className="mb-12">
        <h2 className="font-display text-2xl text-white mb-5 flex items-center gap-2">
          <Users className="w-5 h-5 text-gold-400" /> Upcoming stories
        </h2>
        <div className="space-y-4">
          {UPCOMING_STORIES.map(s => (
            <div key={s.name} className="p-6 rounded-2xl bg-white/[0.04] border border-white/[0.08]">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <p className="font-body font-semibold text-white/90 text-base">{s.name}</p>
                  <p className="text-gold-400/70 font-body text-sm">{s.course}</p>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-white/[0.06] border border-white/[0.10] text-white/35 font-body text-xs">Story coming soon</span>
              </div>
              <p className="text-white/55 font-body text-sm leading-relaxed">{s.outcome}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-12">
        <h2 className="font-display text-2xl text-white mb-5">Story format</h2>
        <p className="text-white/60 font-body text-sm leading-relaxed mb-4">Each PathPort success story follows a structured format so you can understand the full journey — not just the highlight reel.</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            { title: "The student", desc: "Background, state in India, family context, why they considered Singapore." },
            { title: "The application journey", desc: "How they found PathPort, which college they chose, challenges during the process." },
            { title: "The internship", desc: "Which company, what role, what they learned, what they earned." },
            { title: "The outcome", desc: "Where they are now — employment, further study, or return to India with international experience." },
            { title: "For parents", desc: "A section specifically for parents: was it worth it? How did they support from afar?" },
            { title: "Advice", desc: "One piece of advice for a student considering the same path." },
          ].map(item => (
            <div key={item.title} className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
              <p className="font-body font-semibold text-white/85 text-sm mb-1">{item.title}</p>
              <p className="text-white/45 font-body text-xs leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-gradient-to-br from-gold-400/[0.08] to-transparent border border-gold-400/20 rounded-2xl p-8 text-center">
        <p className="font-display text-2xl text-white mb-3">Share your PathPort story</p>
        <p className="text-white/55 font-body text-sm mb-6 max-w-xl mx-auto leading-relaxed">
          Are you a PathPort student who has completed your programme or internship? We would love to feature your story. Stories are published with your full consent and reviewed by you before going live.
        </p>
        <a
          href="mailto:pathportsg@gmail.com?subject=Share%20my%20PathPort%20story"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-gold-500 to-gold-400 text-navy-900 font-body font-bold text-sm hover:shadow-gold-sm transition-all"
        >
          Share your story
        </a>
      </section>
    </MarketingShell>
  );
}
