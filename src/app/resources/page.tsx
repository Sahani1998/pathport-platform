import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen, CreditCard, Home, Banknote, Shield, Briefcase, GraduationCap, TrendingUp, Heart, Plane } from "lucide-react";
import MarketingShell from "@/components/marketing/MarketingShell";
import PageHero from "@/components/marketing/PageHero";
import Breadcrumbs from "@/components/marketing/Breadcrumbs";
import JsonLd from "@/components/marketing/JsonLd";
import { breadcrumbJsonLd } from "@/lib/jsonld";

export const metadata: Metadata = {
  title: "Resource Center | PathPort",
  description: "Practical guides for Indian students studying in Singapore — Student Pass, accommodation, banking, insurance, internships, part-time work, and arrival preparation.",
  alternates: { canonical: "/resources" },
  openGraph: {
    title: "Resource Center | PathPort",
    description: "Everything an Indian student needs to know before and after arriving in Singapore.",
  },
};

const CATEGORIES = [
  {
    icon: <BookOpen className="w-5 h-5" />,
    title: "Study in Singapore",
    desc: "Why Singapore is a top destination for Indian students, diploma vs degree, EduTrust colleges, and the 6+6 internship model.",
    href: "/resources/study-in-singapore",
    articles: 8,
  },
  {
    icon: <CreditCard className="w-5 h-5" />,
    title: "Student Pass & IPA",
    desc: "Complete guide to the Singapore Student Pass — who needs it, how the IPA process works, timelines, and what happens at immigration.",
    href: "/resources/student-pass-ipa",
    articles: 6,
  },
  {
    icon: <Home className="w-5 h-5" />,
    title: "Accommodation",
    desc: "Where to live in Singapore — hostels, HDB rentals, student housing, typical costs in SGD, and advice for your first month.",
    href: "/resources/accommodation",
    articles: 5,
  },
  {
    icon: <Banknote className="w-5 h-5" />,
    title: "Banking",
    desc: "Opening a Singapore bank account on a Student Pass, recommended banks, required documents, and managing money between India and Singapore.",
    href: "/resources/banking",
    articles: 4,
  },
  {
    icon: <Shield className="w-5 h-5" />,
    title: "Insurance",
    desc: "Insurance requirements for Student Pass holders — medical, personal accident, and travel. What colleges require and what you should buy.",
    href: "/resources/insurance",
    articles: 4,
  },
  {
    icon: <Briefcase className="w-5 h-5" />,
    title: "Part-Time Work",
    desc: "Can you work part-time on a Singapore Student Pass? MOM rules, permitted hours, prohibited activities, and income expectations.",
    href: "/resources/part-time-work",
    articles: 3,
  },
  {
    icon: <GraduationCap className="w-5 h-5" />,
    title: "Internships",
    desc: "The 6+6 internship programme — what it means, how placement works, typical industries, pay expectations, and how to make the most of it.",
    href: "/resources/internships",
    articles: 5,
  },
  {
    icon: <TrendingUp className="w-5 h-5" />,
    title: "Careers",
    desc: "Career outcomes after a Singapore diploma, common industries hiring Indian graduates, PR pathways, and post-study employment options.",
    href: "/resources/careers",
    articles: 6,
  },
  {
    icon: <Heart className="w-5 h-5" />,
    title: "Student Life",
    desc: "Life in Singapore as an Indian student — food, transport, community, MRT, healthcare, cultural adjustment, and staying connected with home.",
    href: "/resources/student-life",
    articles: 7,
  },
  {
    icon: <Plane className="w-5 h-5" />,
    title: "Arrival Preparation",
    desc: "Pre-departure checklist, SG Arrival Card, what to pack, airport arrival procedures, first-day essentials, and reporting to your college.",
    href: "/resources/arrival-preparation",
    articles: 5,
  },
];

export default function ResourcesPage() {
  return (
    <MarketingShell maxWidth="wide">
      <JsonLd data={breadcrumbJsonLd([{ name: "Resources", url: "/resources" }])} />
      <Breadcrumbs trail={[{ name: "Resources", url: "/resources" }]} />

      <PageHero
        eyebrow="Resource Center"
        title="Everything you need to study in Singapore."
        subtitle="Practical, accurate guides written for Indian students — from applying for a Student Pass to opening a bank account and finding your first internship."
      />

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
        {CATEGORIES.map(cat => (
          <Link
            key={cat.title}
            href={cat.href}
            className="group flex flex-col p-6 rounded-2xl bg-white/[0.04] border border-white/[0.08] hover:border-gold-400/30 hover:bg-gold-400/[0.03] transition-all"
          >
            <div className="w-11 h-11 rounded-xl bg-gold-400/10 border border-gold-400/25 text-gold-400 flex items-center justify-center mb-4">
              {cat.icon}
            </div>
            <h2 className="font-display text-lg text-white mb-2 group-hover:text-gold-300 transition-colors">{cat.title}</h2>
            <p className="text-white/50 font-body text-sm leading-relaxed flex-1">{cat.desc}</p>
            <p className="text-white/25 font-body text-xs mt-3">{cat.articles} guides</p>
          </Link>
        ))}
      </section>

      <section className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-6">
        <p className="font-display text-xl text-white mb-2">Can&apos;t find what you need?</p>
        <p className="text-white/55 font-body text-sm mb-4">Ask PathPort on WhatsApp. We answer questions about Singapore education, Student Pass, and student life every day. If your question would help others, we&apos;ll turn it into a resource guide.</p>
        <a href="https://wa.me/6583776492" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gold-400/10 border border-gold-400/30 text-gold-400 font-body text-sm font-semibold hover:bg-gold-400/20 transition-all">
          WhatsApp +65 8377 6492
        </a>
      </section>
    </MarketingShell>
  );
}
