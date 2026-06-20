// Resource Center — light public theme (Sprint 30.1 PR-E).
// Scoped light wrapper: this page does NOT use MarketingShell so the change
// here doesn't cascade to /resources/* sub-pages, /trust, /about, etc. Those
// stay dark for now and can be migrated in a separate sprint.

import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import PhotoBand from "@/components/ui/PhotoBand";
import Reveal from "@/components/ui/Reveal";
import JsonLd from "@/components/marketing/JsonLd";
import Breadcrumbs from "@/components/marketing/Breadcrumbs";
import { breadcrumbJsonLd } from "@/lib/jsonld";
import {
  BookOpen, CreditCard, Home, Banknote, Shield, Briefcase, GraduationCap,
  TrendingUp, Heart, Plane, ArrowRight, MessageCircle,
} from "lucide-react";

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
  { Icon: BookOpen,      title: "Study in Singapore",      desc: "Why Singapore is a top destination for Indian students, diploma vs degree, EduTrust colleges, and the 6+6 internship model.",                       href: "/resources/study-in-singapore",   articles: 8 },
  { Icon: CreditCard,    title: "Student Pass & IPA",      desc: "Complete guide to the Singapore Student Pass — who needs it, how the IPA process works, timelines, and what happens at immigration.",                  href: "/resources/student-pass-ipa",      articles: 6 },
  { Icon: Home,          title: "Accommodation",            desc: "Where to live in Singapore — hostels, HDB rentals, student housing, typical costs in SGD, and advice for your first month.",                          href: "/resources/accommodation",          articles: 5 },
  { Icon: Banknote,      title: "Banking",                  desc: "Opening a Singapore bank account on a Student Pass, recommended banks, required documents, and managing money between India and Singapore.",         href: "/resources/banking",                articles: 4 },
  { Icon: Shield,        title: "Insurance",                desc: "Insurance requirements for Student Pass holders — medical, personal accident, and travel. What colleges require and what you should buy.",            href: "/resources/insurance",              articles: 4 },
  { Icon: Briefcase,     title: "Part-Time Work",           desc: "Can you work part-time on a Singapore Student Pass? MOM rules, permitted hours, prohibited activities, and income expectations.",                      href: "/resources/part-time-work",         articles: 3 },
  { Icon: GraduationCap, title: "Internships",              desc: "The 6+6 internship programme — what it means, how placement works, typical industries, pay expectations, and how to make the most of it.",            href: "/resources/internships",            articles: 5 },
  { Icon: TrendingUp,    title: "Careers",                  desc: "Career outcomes after a Singapore diploma, common industries hiring Indian graduates, PR pathways, and post-study employment options.",                href: "/resources/careers",                articles: 6 },
  { Icon: Heart,         title: "Student Life",             desc: "Life in Singapore as an Indian student — food, transport, community, MRT, healthcare, cultural adjustment, and staying connected with home.",         href: "/resources/student-life",           articles: 7 },
  { Icon: Plane,         title: "Arrival Preparation",      desc: "Pre-departure checklist, SG Arrival Card, what to pack, airport arrival procedures, first-day essentials, and reporting to your college.",            href: "/resources/arrival-preparation",   articles: 5 },
];

export default function ResourcesPage() {
  return (
    <>
      <Navbar />
      <main className="bg-white pt-[68px]">

        {/* Hero band */}
        <section className="public-section-white border-b border-slate-200">
          <div className="max-w-5xl mx-auto px-5 md:px-10 py-16 md:py-20">
            <JsonLd data={breadcrumbJsonLd([{ name: "Resources", url: "/resources" }])} />
            <div className="mb-8">
              <Breadcrumbs trail={[{ name: "Resources", url: "/resources" }]} />
            </div>

            <Reveal>
              <p className="text-pathBlue-700 font-body text-xs font-semibold tracking-[0.20em] uppercase mb-4">
                Resource Center
              </p>
              <h1 className="font-display text-4xl sm:text-5xl lg:text-[3.4rem] text-navy-900 leading-[1.05] tracking-tight mb-5 max-w-3xl">
                Everything you need to{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold-600 to-gold-500">
                  study in Singapore.
                </span>
              </h1>
              <p className="text-navy-800/65 font-body text-lg leading-relaxed max-w-2xl">
                Practical, accurate guides written for Indian students — from applying for a Student Pass to opening a bank account and finding your first internship.
              </p>
            </Reveal>
          </div>
        </section>

        {/* Photo rest beat — classroom / study */}
        <PhotoBand
          src="https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?auto=format&fit=crop&w=1800&q=75"
          alt="Students collaborating at a Singapore campus library"
          caption="Practical guides — written for Indian students"
          height="sm"
        />

        {/* Categories grid */}
        <section className="public-section-white py-20">
          <div className="max-w-7xl mx-auto px-5 md:px-10">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
              {CATEGORIES.map(({ Icon, title, desc, href, articles }, i) => (
                <Reveal key={title} delay={(i % 3) * 60} className="h-full">
                  <Link
                    href={href}
                    className="group flex flex-col h-full p-6 rounded-2.5xl public-card public-card-hover"
                  >
                    <div className="w-11 h-11 rounded-xl bg-gold-400/15 border border-gold-400/30 text-gold-600 flex items-center justify-center mb-4">
                      <Icon className="w-5 h-5" strokeWidth={1.75} />
                    </div>
                    <h2 className="font-display text-lg text-navy-900 mb-2 group-hover:text-pathBlue-700 transition-colors leading-snug">{title}</h2>
                    <p className="text-navy-800/60 font-body text-sm leading-relaxed flex-1">{desc}</p>
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-200">
                      <p className="text-navy-800/45 font-body text-xs">{articles} guides</p>
                      <span className="inline-flex items-center gap-1 text-pathBlue-700 font-body text-xs font-semibold group-hover:gap-1.5 transition-all">
                        Read <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </Link>
                </Reveal>
              ))}
            </div>

            {/* WhatsApp ask box */}
            <Reveal>
              <div className="rounded-2.5xl bg-pathBlue-500/[0.05] border border-pathBlue-500/15 p-6 md:p-8 flex flex-col md:flex-row md:items-center gap-5">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 flex items-center justify-center flex-shrink-0">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <p className="font-display text-xl text-navy-900 mb-1.5 leading-snug">Can&rsquo;t find what you need?</p>
                  <p className="text-navy-800/65 font-body text-sm leading-relaxed">
                    Ask PathPort on WhatsApp. We answer questions about Singapore education, Student Pass, and student life every day. If your question would help others, we&rsquo;ll turn it into a resource guide.
                  </p>
                </div>
                <a
                  href="https://wa.me/6583776492"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-shrink-0 inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 font-body text-sm font-bold hover:bg-emerald-500/20 transition-all"
                >
                  WhatsApp +65 8377 6492
                </a>
              </div>
            </Reveal>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
