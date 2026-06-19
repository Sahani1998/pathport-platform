import Link from "next/link";
import { Mail, Phone } from "lucide-react";

const FOOTER_COLS: Record<string, { label: string; href: string }[]> = {
  About: [
    { label: "About PathPort", href: "/about" },
    { label: "Our Story", href: "/our-story" },
    { label: "Mission", href: "/mission" },
    { label: "Vision", href: "/vision" },
    { label: "Careers", href: "/careers" },
    { label: "Press", href: "/press" },
  ],
  Students: [
    { label: "Browse Courses", href: "/courses" },
    { label: "Colleges", href: "/colleges" },
    { label: "For Parents", href: "/for-parents" },
    { label: "Resource Center", href: "/resources" },
    { label: "Success Stories", href: "/success-stories" },
    { label: "Student Pass & IPA", href: "/resources/student-pass-ipa" },
    { label: "Arrival Guide", href: "/resources/arrival-preparation" },
  ],
  Institutions: [
    { label: "Join PathPort", href: "/partner-with-us" },
    { label: "Institution Portal", href: "/dashboard/institution" },
    { label: "Institution Verification", href: "/trust/institution-verification" },
    { label: "Fee Transparency", href: "/trust/fee-transparency" },
  ],
  Resources: [
    { label: "Blog", href: "/blog" },
    { label: "Insights", href: "/insights" },
    { label: "Study in Singapore", href: "/resources/study-in-singapore" },
    { label: "Accommodation", href: "/resources/accommodation" },
    { label: "Banking", href: "/resources/banking" },
    { label: "Internships", href: "/resources/internships" },
  ],
  Trust: [
    { label: "Trust Center", href: "/trust" },
    { label: "How PathPort Works", href: "/trust/how-it-works" },
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Terms of Service", href: "/terms" },
    { label: "Cookie Policy", href: "/legal/cookies" },
    { label: "Legal Center", href: "/legal" },
  ],
  Support: [
    { label: "Contact", href: "/contact" },
    { label: "Help Center", href: "/help" },
    { label: "Complaint Resolution", href: "/trust/complaint-resolution" },
    { label: "Student Rights", href: "/legal/student-rights" },
    { label: "Why Singapore", href: "/study-destination" },
  ],
};

export default function Footer() {
  return (
    <footer className="relative border-t border-white/[0.07] bg-navy-950/90 backdrop-blur-sm">
      <div aria-hidden className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-px bg-gradient-to-r from-transparent via-gold-400/30 to-transparent" />

      <div className="max-w-7xl mx-auto px-5 md:px-10 pt-14 pb-10">

        {/* Brand + Newsletter row */}
        <div className="flex flex-col lg:flex-row gap-10 justify-between mb-12">
          <div className="max-w-xs">
            <Link href="/" className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-pathBlue-500 to-pathBlue-700 flex items-center justify-center">
                <span className="font-display font-bold text-white text-sm leading-none">PP</span>
              </div>
              <span className="font-display text-[1.5rem] leading-none">
                <span className="text-pathBlue-400">Path</span><span className="text-gold-400">Port</span>
              </span>
            </Link>
            <p className="text-white/45 font-body text-sm leading-relaxed mb-4">
              India&apos;s dedicated platform for Singapore private college diploma programmes. Transparent fees. Real tracking. Genuine support.
            </p>
            <div className="inline-flex items-center gap-2 bg-pathBlue-500/10 border border-pathBlue-500/20 rounded-full px-3 py-1.5 mb-5">
              <span className="text-sm">🇮🇳</span>
              <span className="text-pathBlue-300 font-body text-xs font-medium">Primary Market: India</span>
            </div>
          </div>

          <div className="max-w-xs">
            <p className="font-body font-semibold text-white/75 text-sm mb-2">Get PathPort updates</p>
            <p className="text-white/35 font-body text-xs mb-3">New college listings, resource guides, and platform updates for Indian students.</p>
            <a href="mailto:pathportsg@gmail.com?subject=Newsletter%20subscription"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gold-400/10 border border-gold-400/25 text-gold-400 font-body text-sm font-semibold hover:bg-gold-400/20 transition-all">
              Subscribe by email
            </a>
          </div>
        </div>

        {/* 6-column link grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-8 mb-12">
          {Object.entries(FOOTER_COLS).map(([section, links]) => (
            <div key={section}>
              <p className="text-white/30 font-body text-[10px] uppercase tracking-widest mb-3">{section}</p>
              <ul className="space-y-2">
                {links.map(link => (
                  <li key={link.label}>
                    <Link href={link.href} className="text-white/50 hover:text-white/80 font-body text-sm transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Contact strip */}
        <div className="flex flex-wrap gap-5 mb-8 p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
          <a href="mailto:pathportsg@gmail.com" className="flex items-center gap-2 text-white/50 hover:text-white/80 font-body text-sm transition-colors">
            <Mail className="w-3.5 h-3.5 text-gold-400" /> pathportsg@gmail.com
          </a>
          <a href="https://wa.me/6583776492" target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 text-white/50 hover:text-white/80 font-body text-sm transition-colors">
            <Phone className="w-3.5 h-3.5 text-gold-400" /> +65 8377 6492 (WhatsApp)
          </a>
          <span className="text-white/25 font-body text-sm">🇸🇬 Based in Singapore</span>
        </div>

        {/* Expansion */}
        <div className="flex flex-wrap items-center gap-3 mb-10 p-4 rounded-xl bg-pathBlue-500/[0.05] border border-pathBlue-500/15">
          <span className="text-white/35 font-body text-xs uppercase tracking-wider">Expanding soon to:</span>
          {["🇱🇰 Sri Lanka", "🇳🇵 Nepal", "🇧🇩 Bangladesh", "🇧🇹 Bhutan"].map(c => (
            <span key={c} className="text-white/40 font-body text-xs px-2.5 py-1 rounded-full border border-white/[0.08] bg-white/[0.03]">{c}</span>
          ))}
        </div>

        {/* Compliance strip — Singapore company registration + DPO */}
        <div className="mb-6 p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] flex flex-wrap gap-x-5 gap-y-1.5">
          <span className="text-white/20 font-body text-[10px]">PathPort · Incorporated in Singapore</span>
          <span className="text-white/15 font-body text-[10px] hidden sm:inline">·</span>
          <span className="text-white/20 font-body text-[10px]">PDPA compliant · Personal Data Protection Act 2012</span>
          <span className="text-white/15 font-body text-[10px] hidden sm:inline">·</span>
          <span className="text-white/20 font-body text-[10px]">
            Data Protection Officer:{" "}
            <a href="mailto:pathportsg@gmail.com?subject=PDPA%20request" className="hover:text-white/40 transition-colors underline underline-offset-2">
              pathportsg@gmail.com
            </a>
          </span>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-6 border-t border-white/[0.06]">
          <p className="text-white/25 font-body text-xs">
            © {new Date().getFullYear()} PathPort · Singapore&apos;s India Diploma Platform · All rights reserved.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link href="/privacy"       className="text-white/25 hover:text-white/50 font-body text-xs transition-colors">Privacy Policy</Link>
            <Link href="/terms"         className="text-white/25 hover:text-white/50 font-body text-xs transition-colors">Terms of Service</Link>
            <Link href="/legal/cookies" className="text-white/25 hover:text-white/50 font-body text-xs transition-colors">Cookie Policy</Link>
            <Link href="/trust"         className="text-white/25 hover:text-white/50 font-body text-xs transition-colors">Trust Center</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
