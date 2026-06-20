// Resource Center — editorial layout (Sprint 30 redo PR-I).
// Full-bleed photo hero → larger editorial category cards → photo rest beat →
// WhatsApp ask box. Scoped light wrapper: this page does NOT use MarketingShell
// so the change here doesn't cascade to /resources/* sub-pages.

import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import PhotoBand from "@/components/ui/PhotoBand";
import Reveal from "@/components/ui/Reveal";
import Breadcrumbs from "@/components/marketing/Breadcrumbs";
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
      <main>

        {/* 1 · Full-bleed photo hero */}
        <section className="relative w-full min-h-[68vh] overflow-hidden bg-[#06142E]">
          <div aria-hidden className="absolute inset-0">
            <Image
              src="https://images.unsplash.com/photo-1497486751825-1233686d5d80?auto=format&fit=crop&w=2400&q=80"
              alt=""
              fill
              sizes="100vw"
              priority
              className="object-cover object-center"
              unoptimized
            />
            <div className="absolute inset-0 bg-gradient-to-b from-navy-900/85 via-navy-900/65 to-navy-900/90" />
            <div className="absolute inset-0 bg-gradient-to-r from-navy-900/70 via-transparent to-transparent" />
          </div>

          <div className="relative layout-shell pt-[120px] pb-20 lg:pt-[140px] lg:pb-28 min-h-[68vh] flex items-center">
            <div className="max-w-3xl">
              <Breadcrumbs trail={[{ name: "Resources", url: "/resources" }]} />

              <p className="eyebrow text-gold-400 mb-5">Resource Center</p>
              <h1 className="display-2 text-white mb-6">
                Everything you need to{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold-400 via-gold-300 to-gold-400">
                  study in Singapore.
                </span>
              </h1>
              <p className="lead text-white/75 max-w-2xl">
                Practical, accurate guides written for Indian students — from applying for a Student Pass to opening a bank account and finding your first internship.
              </p>
            </div>
          </div>
        </section>

        {/* 2 · Categories grid — larger editorial cards */}
        <section className="public-section-white">
          <div className="layout-shell section-airy">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-12">
              {CATEGORIES.map(({ Icon, title, desc, href, articles }, i) => (
                <Reveal key={title} delay={(i % 3) * 60} className="h-full">
                  <Link
                    href={href}
                    className="group flex flex-col h-full p-7 rounded-2.5xl public-card public-card-hover"
                  >
                    <div className="w-12 h-12 rounded-xl bg-gold-400/15 border border-gold-400/30 text-gold-600 flex items-center justify-center mb-5">
                      <Icon className="w-5 h-5" strokeWidth={1.75} />
                    </div>
                    <h2 className="font-display text-xl text-navy-900 mb-2.5 group-hover:text-pathBlue-700 transition-colors leading-snug">{title}</h2>
                    <p className="text-navy-800/60 font-body text-sm leading-relaxed flex-1">{desc}</p>
                    <div className="flex items-center justify-between mt-5 pt-5 border-t border-slate-200">
                      <p className="text-navy-800/45 font-body text-xs">{articles} guides</p>
                      <span className="inline-flex items-center gap-1 text-pathBlue-700 font-body text-xs font-semibold group-hover:gap-1.5 transition-all">
                        Read <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </Link>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* 3 · Photo rest beat */}
        <PhotoBand
          src="https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?auto=format&fit=crop&w=1800&q=75"
          alt="Students collaborating at a Singapore campus library"
          caption="Practical guides — written for Indian students"
          height="md"
        />

        {/* 4 · WhatsApp ask box */}
        <section className="public-section-white">
          <div className="layout-shell section-medium">
            <Reveal>
              <div className="rounded-2.5xl bg-pathBlue-500/[0.05] border border-pathBlue-500/15 p-7 md:p-10 flex flex-col md:flex-row md:items-center gap-5">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 flex items-center justify-center flex-shrink-0">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <p className="font-display text-2xl text-navy-900 mb-1.5 leading-snug">Can&rsquo;t find what you need?</p>
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
