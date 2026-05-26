import GlassCard from "@/components/ui/GlassCard";
import SectionHeader from "@/components/ui/SectionHeader";
import GoldButton from "@/components/ui/GoldButton";
import {
  Zap, FileCheck, Phone, ShieldCheck, RefreshCw, HeadphonesIcon
} from "lucide-react";

const FEATURES = [
  {
    Icon: Zap,
    title: "24-Hour Turnaround",
    description: "PathPort submits your application directly to the college. Conditional offer letters are typically issued within 24 hours — no waiting, no uncertainty.",
    highlight: true,
  },
  {
    Icon: FileCheck,
    title: "Document Preparation",
    description: "Our team prepares and checks all required documents — academic transcripts, ID copies, SOP — before submission to avoid rejection or delays.",
  },
  {
    Icon: Phone,
    title: "Direct College Liaison",
    description: "PathPort helps you navigate the admissions process at Singapore private colleges — tracking your application and keeping you informed from submission through to offer.",
  },
  {
    Icon: ShieldCheck,
    title: "Conditional Offer Security",
    description: "Receive a conditional offer letter immediately upon acceptance — locking in your place and allowing you to begin your Student Pass application.",
  },
  {
    Icon: RefreshCw,
    title: "Application Tracking",
    description: "Log in to your PathPort dashboard to track your application status in real time. No more chasing emails or wondering what's happening.",
  },
  {
    Icon: HeadphonesIcon,
    title: "Dedicated Student Advisor",
    description: "A personal PathPort advisor is assigned to every student — answering questions, guiding the process, and available on WhatsApp.",
  },
];

export default function OfferLetterSupport() {
  return (
    <section id="offer-letter" className="relative py-24 overflow-hidden">
      <div aria-hidden className="absolute inset-0 bg-gradient-to-b from-transparent via-gold-400/[0.025] to-transparent pointer-events-none" />
      <div aria-hidden className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-gold-400/[0.04] blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-5 md:px-10">
        {/* Header */}
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-16">
            <div>
              <p className="inline-flex items-center gap-3 text-gold-400 font-body text-xs font-semibold tracking-[0.22em] uppercase mb-5">
                <span className="w-8 h-px bg-gold-400/50 rounded-full" />
                24-Hour Offer Letter Support
              </p>
              <h2 className="font-display text-4xl md:text-5xl text-white leading-[1.08] mb-5">
                Apply Today.{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold-400 to-gold-300">
                  Offer Letter Tomorrow.
                </span>
              </h2>
              <p className="text-white/50 font-body text-lg leading-relaxed mb-8">
                PathPort handles your entire Singapore college application — from <strong className="text-white/80">document preparation</strong> to <strong className="text-white/80">offer letter</strong> — so you can focus on what matters: preparing for your new life in Singapore.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <GoldButton variant="solid-gold" size="md">Apply Now — It&apos;s Free</GoldButton>
                <GoldButton variant="ghost" size="md">📞 +65 8377 6492</GoldButton>
              </div>
            </div>

            {/* Offer letter mockup */}
            <div className="relative">
              <GlassCard gold className="p-7 shadow-gold-sm">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-gold-500 to-gold-600 flex items-center justify-center">
                    <FileCheck className="w-5 h-5 text-navy-900" />
                  </div>
                  <div>
                    <p className="text-white font-body font-semibold text-sm">Conditional Offer Letter</p>
                    <p className="text-white/40 font-body text-xs">Issued within 24 hours</p>
                  </div>
                  <span className="ml-auto inline-flex items-center gap-1.5 bg-emerald-500/15 border border-emerald-500/30 rounded-full px-2.5 py-1 text-emerald-400 font-body text-xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Issued
                  </span>
                </div>

                <div className="space-y-3 mb-5">
                  {[
                    { label: "Student",  value: "Rahul Sharma"              },
                    { label: "College",  value: "PSB Academy, Singapore"    },
                    { label: "Course",   value: "Diploma in Business Admin" },
                    { label: "Intake",   value: "October 2026"              },
                    { label: "Duration", value: "18 Months"                 },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex justify-between font-body text-sm border-b border-white/[0.06] pb-2.5">
                      <span className="text-white/40">{label}</span>
                      <span className="text-white/85 font-medium">{value}</span>
                    </div>
                  ))}
                </div>

                <div className="bg-gold-400/[0.08] border border-gold-400/25 rounded-xl p-3.5 text-center">
                  <p className="text-gold-300 font-body text-sm font-semibold">
                    ✅ Conditional Offer Accepted
                  </p>
                  <p className="text-white/40 font-body text-xs mt-0.5">
                    Issued 14 hours after application
                  </p>
                </div>
              </GlassCard>

              {/* Floating badge */}
              <div className="absolute -top-4 -right-4 bg-gold-500 text-navy-900 font-body font-bold text-sm px-4 py-2 rounded-full shadow-gold-sm rotate-3">
                ⚡ 24hrs
              </div>
            </div>
          </div>
        </div>

        {/* Feature grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map(({ Icon, title, description, highlight }) => (
            <GlassCard key={title} gold={highlight} className="p-6 group">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 ${
                highlight
                  ? "bg-gradient-to-br from-gold-500 to-gold-600 shadow-gold-sm"
                  : "bg-white/[0.07] border border-white/10"
              }`}>
                <Icon className={`w-5 h-5 ${highlight ? "text-navy-900" : "text-gold-400"}`} strokeWidth={1.75} />
              </div>
              <h3 className="font-body font-semibold text-white text-base mb-2">{title}</h3>
              <p className="text-white/48 font-body text-sm leading-relaxed">{description}</p>
            </GlassCard>
          ))}
        </div>
      </div>
    </section>
  );
}
