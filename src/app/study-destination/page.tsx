import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import WhySingapore from "@/components/sections/WhySingapore";
import ArrivalServices from "@/components/sections/ArrivalServices";
import GoldButton from "@/components/ui/GoldButton";
import GlassCard from "@/components/ui/GlassCard";
import Badge from "@/components/ui/Badge";
import SectionHeader from "@/components/ui/SectionHeader";
import { ArrowRight, CheckCircle2 } from "lucide-react";

export const metadata: Metadata = {
  title: "Study Destination | PathPort — India to Singapore",
  description:
    "Explore the India → Singapore diploma pathway. Courses from SGD 4,000/year. Student pass, IPA, arrival services — all supported by PathPort.",
};

// ─── Route cards ──────────────────────────────────────────────────────────────
const ROUTES = [
  {
    from:    "India",
    to:      "Singapore",
    flag:    "🇮🇳",
    toFlag:  "🇸🇬",
    active:  true,
    headline:"Most Active Route",
    stats: [
      "Courses from SGD 4,000 – 8,000/year",
      "4 diploma levels available",
      "24-hour offer letter support",
      "Full arrival concierge",
    ],
  },
  { from: "Sri Lanka",  to: "Singapore", flag: "🇱🇰", toFlag: "🇸🇬", active: false, headline: "Coming Soon" },
  { from: "Nepal",      to: "Singapore", flag: "🇳🇵", toFlag: "🇸🇬", active: false, headline: "Coming Soon" },
  { from: "Bangladesh", to: "Singapore", flag: "🇧🇩", toFlag: "🇸🇬", active: false, headline: "Coming Soon" },
  { from: "Bhutan",     to: "Singapore", flag: "🇧🇹", toFlag: "🇸🇬", active: false, headline: "Coming Soon" },
];

// ─── Diploma levels with fees ─────────────────────────────────────────────────
const DIPLOMA_LEVELS = [
  {
    title:    "Diploma",
    duration: "12–18 months",
    fees:     "SGD 4,000 – 6,000/yr",
    entry:    "10th / 12th Standard",
    icon:     "🎓",
  },
  {
    title:    "Advanced Diploma",
    duration: "12–18 months",
    fees:     "SGD 4,500 – 7,000/yr",
    entry:    "Diploma holder",
    icon:     "📘",
  },
  {
    title:    "Higher Diploma",
    duration: "18–24 months",
    fees:     "SGD 5,500 – 8,000/yr",
    entry:    "Advanced Diploma",
    icon:     "🏅",
  },
  {
    title:    "Specialist Diploma",
    duration: "6–12 months",
    fees:     "SGD 4,000 – 6,500/yr",
    entry:    "Diploma / Degree / Professional",
    icon:     "⭐",
  },
];

// ─── Student Pass / IPA key points ────────────────────────────────────────────
const PASS_POINTS = [
  "Apply through enrolled college after offer letter",
  "PathPort submits and tracks your ICA application",
  "IPA (In-Principle Approval) letter issued by ICA",
  "Use IPA letter to enter Singapore as a student",
  "Collect official Student Pass from ICA on arrival",
  "Valid for full course duration + 1 month grace period",
];

// ─── Singapore visuals ────────────────────────────────────────────────────────
const SG_IMAGES = [
  {
    src:   "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?auto=format&fit=crop&w=900&q=80",
    alt:   "Marina Bay Sands Singapore",
    label: "Marina Bay",
  },
  {
    src:   "https://images.unsplash.com/photo-1570168007204-dfb528c6958f?auto=format&fit=crop&w=900&q=80",
    alt:   "Singapore skyline",
    label: "Singapore CBD",
  },
  {
    src:   "https://images.unsplash.com/photo-1565967511849-76a60a516170?auto=format&fit=crop&w=900&q=80",
    alt:   "Gardens by the Bay Singapore",
    label: "Gardens by the Bay",
  },
];

export default function StudyDestinationPage() {
  return (
    <>
      <Navbar />
      <main className="pt-[68px]">

        {/* ── Hero ─────────────────────────────────────────────────── */}
        <section className="relative py-24 md:py-32 overflow-hidden">
          <div aria-hidden className="absolute inset-0 bg-[linear-gradient(rgba(240,165,0,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(240,165,0,0.025)_1px,transparent_1px)] bg-[size:60px_60px] pointer-events-none" />
          <div aria-hidden className="absolute top-[25%] right-[10%] w-[450px] h-[450px] rounded-full bg-gold-400/[0.06] blur-[130px] pointer-events-none" />

          <div className="max-w-7xl mx-auto px-5 md:px-10 text-center">
            <Badge variant="gold" className="mb-6 text-sm px-4 py-1.5">🌏 Study Destinations</Badge>
            <h1 className="font-display text-5xl sm:text-6xl lg:text-[4rem] text-white leading-[1.05] mb-6">
              Where Will You{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold-400 via-gold-300 to-gold-400">
                Study?
              </span>
            </h1>
            <p className="text-white/52 font-body text-xl leading-relaxed max-w-2xl mx-auto mb-10">
              PathPort connects students from South Asia to Singapore diploma programmes. One strong route active today, more coming soon.
            </p>
          </div>
        </section>

        {/* ── Route Cards ─────────────────────────────────────────────── */}
        <section className="pb-24">
          <div className="max-w-7xl mx-auto px-5 md:px-10">
            <SectionHeader
              eyebrow="Active Routes"
              title="Choose Your Route to Singapore"
              subtitle="India is our primary and most active corridor. Additional South Asian routes launching soon."
            />

            <div className="space-y-4 max-w-3xl mx-auto">
              {/* India → Singapore (featured, large) */}
              {ROUTES.filter(r => r.active).map(route => (
                <GlassCard key={route.from} gold className="p-8 md:p-10 relative overflow-hidden shadow-gold-sm">
                  <div aria-hidden className="absolute -top-16 -right-16 w-60 h-60 rounded-full bg-gold-400/[0.08] blur-[70px] pointer-events-none" />

                  <div className="flex flex-col md:flex-row items-start md:items-center gap-6 mb-6">
                    <div className="flex items-center gap-4">
                      <span className="text-5xl">{route.flag}</span>
                      <div className="flex flex-col items-center gap-1">
                        <ArrowRight className="w-6 h-6 text-gold-400" />
                        <span className="text-gold-400/50 font-body text-[10px]">to</span>
                      </div>
                      <span className="text-5xl">{route.toFlag}</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="font-display text-2xl text-white">{route.from} → {route.to}</h3>
                        <Badge variant="gold">⭐ {route.headline}</Badge>
                      </div>
                      <p className="text-white/45 font-body text-sm">PathPort's primary and strongest student corridor</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-7">
                    {route.stats?.map(stat => (
                      <div key={stat} className="flex items-center gap-2.5 text-white/65 font-body text-sm">
                        <CheckCircle2 className="w-4 h-4 text-gold-400 flex-shrink-0" />
                        {stat}
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <Link href="/signup">
                      <GoldButton variant="solid-gold" size="md" className="group">
                        Register from India
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </GoldButton>
                    </Link>
                    <Link href="/students">
                      <GoldButton variant="outline-gold" size="md">Explore Student Services</GoldButton>
                    </Link>
                  </div>
                </GlassCard>
              ))}

              {/* Coming soon routes (smaller grid) */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
                {ROUTES.filter(r => !r.active).map(route => (
                  <GlassCard key={route.from} className="p-5 text-center opacity-70 hover:opacity-90 transition-opacity">
                    <div className="text-3xl mb-2">{route.flag}</div>
                    <p className="font-body font-semibold text-white/75 text-sm">{route.from}</p>
                    <p className="text-white/30 font-body text-xs mb-2">→ Singapore</p>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-pathBlue-500/15 border border-pathBlue-500/30 text-pathBlue-400 font-body text-[10px] font-semibold tracking-wider">
                      COMING SOON
                    </span>
                  </GlassCard>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Diploma Levels + Fees ───────────────────────────────────── */}
        <section className="py-20 border-t border-white/[0.06]">
          <div className="max-w-7xl mx-auto px-5 md:px-10">
            <SectionHeader
              eyebrow="Diploma Options"
              title="Four Levels. One Platform."
              subtitle="Course fees typically range from SGD 4,000 to SGD 8,000 per year at Singapore private colleges."
            />

            {/* Fee highlight */}
            <div className="max-w-2xl mx-auto mb-10 text-center p-4 rounded-2xl bg-gold-400/[0.07] border border-gold-400/20">
              <p className="text-white/70 font-body text-sm">
                💰 All courses available from{" "}
                <strong className="text-gold-300">SGD 4,000 to SGD 8,000 per year</strong>.
                PathPort advisors help you find the best fit for your budget.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {DIPLOMA_LEVELS.map((level, i) => (
                <GlassCard key={level.title} gold={i === 2} className="p-6">
                  <div className="text-3xl mb-4">{level.icon}</div>
                  <h3 className="font-display text-xl text-white mb-3">{level.title}</h3>
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between text-xs font-body">
                      <span className="text-white/40">Duration</span>
                      <span className="text-white/75">{level.duration}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs font-body">
                      <span className="text-white/40">Entry</span>
                      <span className="text-white/75 text-right max-w-[120px]">{level.entry}</span>
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-gold-400/[0.08] border border-gold-400/20">
                    <p className="text-gold-300 font-body text-xs font-semibold text-center">{level.fees}</p>
                  </div>
                </GlassCard>
              ))}
            </div>
          </div>
        </section>

        {/* ── Why Singapore ─────────────────────────────────────────────── */}
        <WhySingapore />

        {/* ── Student Pass / IPA ────────────────────────────────────────── */}
        <section className="py-20 border-t border-white/[0.06]">
          <div className="max-w-7xl mx-auto px-5 md:px-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <p className="inline-flex items-center gap-3 text-gold-400 font-body text-xs font-semibold tracking-[0.22em] uppercase mb-5">
                  <span className="w-8 h-px bg-gold-400/50 rounded-full" />
                  Student Pass & IPA
                </p>
                <h2 className="font-display text-4xl text-white mb-5 leading-tight">
                  Singapore Student Pass —<br />
                  <span className="text-gold-400">PathPort Handles It</span>
                </h2>
                <p className="text-white/50 font-body text-lg leading-relaxed mb-8">
                  Every international student studying in Singapore requires a Student Pass issued by ICA. The IPA (In-Principle Approval) letter is the first step — PathPort guides and tracks the entire process.
                </p>
                <Link href="/signup">
                  <GoldButton variant="solid-gold" size="md">Start My Application</GoldButton>
                </Link>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {PASS_POINTS.map((point, i) => (
                  <div key={point} className="flex items-center gap-3 p-4 rounded-xl bg-white/[0.03] border border-white/[0.07] hover:border-gold-400/25 transition-colors">
                    <div className="w-7 h-7 rounded-full bg-gold-400/15 border border-gold-400/30 flex items-center justify-center flex-shrink-0 font-body font-bold text-gold-400 text-xs">
                      {i + 1}
                    </div>
                    <p className="text-white/65 font-body text-sm">{point}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Arrival Services ──────────────────────────────────────────── */}
        <ArrivalServices />

        {/* ── Singapore visuals ─────────────────────────────────────────── */}
        <section className="py-20 border-t border-white/[0.06]">
          <div className="max-w-7xl mx-auto px-5 md:px-10">
            <SectionHeader
              eyebrow="Singapore"
              title="Your New Home City"
              subtitle="Safe, English-speaking, multicultural, and just 5 hours from India."
            />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {SG_IMAGES.map(img => (
                <div key={img.src} className="relative rounded-2xl overflow-hidden border border-white/[0.08]" style={{ aspectRatio: "4/3" }}>
                  <img src={img.src} alt={img.alt} loading="lazy" className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-navy-900/70 to-transparent" />
                  <span className="absolute bottom-3 left-4 font-body text-sm font-semibold text-white/90">{img.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA ──────────────────────────────────────────────────────── */}
        <section className="py-28 relative overflow-hidden">
          <div aria-hidden className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-gold-400/[0.06] blur-[140px] pointer-events-none" />
          <div className="relative max-w-3xl mx-auto px-5 md:px-10 text-center">
            <h2 className="font-display text-5xl text-white mb-5">
              Ready to Study in Singapore?
            </h2>
            <p className="text-white/48 font-body text-xl mb-10 leading-relaxed">
              Register free from India. Offer letter in 24 hours. Courses from <strong className="text-gold-400">SGD 4,000/year</strong>.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/signup">
                <GoldButton variant="solid-gold" size="lg" className="group">
                  Register as Student — Free
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </GoldButton>
              </Link>
              <a href="https://wa.me/6583776492" target="_blank" rel="noopener noreferrer">
                <GoldButton variant="outline-gold" size="lg">💬 WhatsApp Us</GoldButton>
              </a>
            </div>
          </div>
        </section>

      </main>
      <Footer />
    </>
  );
}
