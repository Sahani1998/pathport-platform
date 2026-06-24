"use client";

import Link from "next/link";
import { Mail, Phone, Instagram, Facebook, Linkedin, Youtube, Music2 } from "lucide-react";
import { whatsappHref } from "@/lib/site-settings";
import { useSiteSettings } from "@/lib/use-site-settings";

// Lucide has no X / TikTok glyph yet — Music2 stands in for TikTok; for X we
// render an inline SVG so the bird-killer wordmark stays consistent across browsers.
const XIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

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
  const settings = useSiteSettings();
  const waHref = whatsappHref(settings.whatsapp_number);
  const mailtoNewsletter = `mailto:${settings.contact_email}?subject=Newsletter%20subscription`;
  const mailtoContact    = `mailto:${settings.contact_email}`;
  const mailtoDpo        = `mailto:${settings.contact_email}?subject=PDPA%20request`;

  // Social rows — render in this fixed order, but only those with a non-empty URL.
  const socials: { label: string; href: string; Icon: React.ElementType }[] = [
    { label: "Instagram", href: settings.social_instagram, Icon: Instagram },
    { label: "Facebook",  href: settings.social_facebook,  Icon: Facebook  },
    { label: "LinkedIn",  href: settings.social_linkedin,  Icon: Linkedin  },
    { label: "YouTube",   href: settings.social_youtube,   Icon: Youtube   },
    { label: "X",         href: settings.social_x,         Icon: XIcon     },
    { label: "TikTok",    href: settings.social_tiktok,    Icon: Music2    },
  ].filter(s => s.href.trim().length > 0);

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
            <p className="text-white/70 font-body text-sm leading-relaxed mb-4">
              India&apos;s dedicated platform for Singapore private college diploma programmes. Transparent fees. Real tracking. Genuine support.
            </p>
            <div className="inline-flex items-center gap-2 bg-pathBlue-500/10 border border-pathBlue-500/20 rounded-full px-3 py-1.5 mb-5">
              <span className="text-sm">🇮🇳</span>
              <span className="text-pathBlue-300 font-body text-xs font-medium">Primary Market: India</span>
            </div>

            {socials.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                {socials.map(({ label, href, Icon }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-white/70 hover:text-gold-400 bg-white/[0.04] border border-white/[0.09] hover:border-gold-400/30 transition-colors"
                  >
                    <Icon className="w-4 h-4" />
                  </a>
                ))}
              </div>
            )}
          </div>

          <div className="max-w-xs">
            <p className="font-body font-semibold text-white/90 text-sm mb-2">Get PathPort updates</p>
            <p className="text-white/60 font-body text-xs mb-3">New college listings, resource guides, and platform updates for Indian students.</p>
            <a href={mailtoNewsletter}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gold-400/10 border border-gold-400/25 text-gold-400 font-body text-sm font-semibold hover:bg-gold-400/20 transition-all">
              Subscribe by email
            </a>
          </div>
        </div>

        {/* 6-column link grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-8 mb-12">
          {Object.entries(FOOTER_COLS).map(([section, links]) => (
            <div key={section}>
              <p className="text-white/75 font-body text-[10px] uppercase tracking-widest font-semibold mb-3">{section}</p>
              <ul className="space-y-2">
                {links.map(link => (
                  <li key={link.label}>
                    <Link href={link.href} className="text-white/80 hover:text-gold-400 font-body text-sm transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Contact strip */}
        <div className="flex flex-wrap gap-5 mb-8 p-4 rounded-2xl bg-white/[0.03] border border-white/[0.09]">
          <a href={mailtoContact} className="flex items-center gap-2 text-white/85 hover:text-gold-400 font-body text-sm transition-colors">
            <Mail className="w-3.5 h-3.5 text-gold-400" /> {settings.contact_email}
          </a>
          <a href={waHref} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 text-white/85 hover:text-gold-400 font-body text-sm transition-colors">
            <Phone className="w-3.5 h-3.5 text-gold-400" /> {settings.whatsapp_display} (WhatsApp)
          </a>
          <span className="text-white/75 font-body text-sm">🇸🇬 Based in Singapore</span>
        </div>

        {/* Expansion */}
        <div className="flex flex-wrap items-center gap-3 mb-10 p-4 rounded-xl bg-pathBlue-500/[0.05] border border-pathBlue-500/15">
          <span className="text-white/65 font-body text-xs uppercase tracking-wider font-semibold">Expanding soon to:</span>
          {["🇱🇰 Sri Lanka", "🇳🇵 Nepal", "🇧🇩 Bangladesh", "🇧🇹 Bhutan"].map(c => (
            <span key={c} className="text-white/75 font-body text-xs px-2.5 py-1 rounded-full border border-white/[0.10] bg-white/[0.04]">{c}</span>
          ))}
        </div>

        {/* Compliance strip — Singapore company registration + DPO */}
        <div className="mb-6 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] flex flex-wrap gap-x-5 gap-y-1.5">
          <span className="text-white/60 font-body text-[10px]">PathPort · Incorporated in Singapore</span>
          <span className="text-white/35 font-body text-[10px] hidden sm:inline">·</span>
          <span className="text-white/60 font-body text-[10px]">PDPA compliant · Personal Data Protection Act 2012</span>
          <span className="text-white/35 font-body text-[10px] hidden sm:inline">·</span>
          <span className="text-white/60 font-body text-[10px]">
            Data Protection Officer:{" "}
            <a href={mailtoDpo} className="text-white/75 hover:text-gold-400 transition-colors underline underline-offset-2">
              {settings.contact_email}
            </a>
          </span>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-6 border-t border-white/[0.06]">
          <p className="text-white/65 font-body text-xs">
            © {new Date().getFullYear()} PathPort · Singapore&apos;s India Diploma Platform · All rights reserved.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link href="/privacy"       className="text-white/75 hover:text-gold-400 font-body text-xs transition-colors">Privacy Policy</Link>
            <Link href="/terms"         className="text-white/75 hover:text-gold-400 font-body text-xs transition-colors">Terms of Service</Link>
            <Link href="/legal/cookies" className="text-white/75 hover:text-gold-400 font-body text-xs transition-colors">Cookie Policy</Link>
            <Link href="/trust"         className="text-white/75 hover:text-gold-400 font-body text-xs transition-colors">Trust Center</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
