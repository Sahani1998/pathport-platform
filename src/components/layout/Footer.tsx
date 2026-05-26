import Link from "next/link";
import GoldButton from "@/components/ui/GoldButton";
import { Instagram, Linkedin, Twitter, Youtube, Mail, Phone } from "lucide-react";

const LINKS = {
  "Students":   ["Register as Student", "Student Login", "Singapore Diplomas", "6+6 Internship", "Arrival Services"],
  "Destinations": ["India → Singapore", "Study Destination", "Why Singapore", "Diploma Fees", "Student Pass / IPA"],
  "Partners":   ["Institutions", "Recruitment Partners", "Employers", "Apply to Partner With Us"],
  "Company":    ["About PathPort", "Blog", "Careers", "Privacy Policy", "Terms of Service"],
};

const SOCIALS = [
  { Icon: Instagram, href: "#", label: "Instagram" },
  { Icon: Linkedin,  href: "#", label: "LinkedIn"  },
  { Icon: Twitter,   href: "#", label: "Twitter/X" },
  { Icon: Youtube,   href: "#", label: "YouTube"   },
];

export default function Footer() {
  return (
    <footer className="relative border-t border-white/[0.07] bg-navy-950/90 backdrop-blur-sm">
      <div aria-hidden className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-px bg-gradient-to-r from-transparent via-gold-400/30 to-transparent" />

      <div className="max-w-7xl mx-auto px-5 md:px-10 pt-14 pb-10">

        {/* ── Top grid ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-10 mb-12">

          {/* Brand */}
          <div className="col-span-2">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-pathBlue-500 to-pathBlue-700 flex items-center justify-center">
                <span className="font-display font-bold text-white text-sm leading-none">PP</span>
              </div>
              <span className="font-display text-[1.5rem] leading-none">
                <span className="text-pathBlue-400">Path</span><span className="text-gold-400">Port</span>
              </span>
            </div>

            <p className="text-white/55 font-body text-sm leading-relaxed mb-5 max-w-[200px]">
              India&apos;s dedicated Singapore diploma platform — connecting Indian students to private college programmes, internships, and arrival services.
            </p>

            {/* Market badge */}
            <div className="inline-flex items-center gap-2 bg-pathBlue-500/10 border border-pathBlue-500/20 rounded-full px-3 py-1.5 mb-5">
              <span className="text-sm">🇮🇳</span>
              <span className="text-pathBlue-300 font-body text-xs font-medium">Primary Market: India</span>
            </div>

            <div className="flex gap-2.5 flex-wrap">
              {SOCIALS.map(({ Icon, href, label }) => (
                <a key={label} href={href} aria-label={label}
                  className="w-8 h-8 rounded-lg bg-white/[0.05] border border-white/[0.08] flex items-center justify-center text-white/45 hover:text-gold-400 hover:border-gold-400/35 transition-all duration-200">
                  <Icon className="w-3.5 h-3.5" />
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(LINKS).map(([section, links]) => (
            <div key={section} className="col-span-1">
              <h4 className="font-body font-semibold text-white/85 text-xs tracking-[0.18em] uppercase mb-4">{section}</h4>
              <ul className="space-y-2.5">
                {links.map(link => {
                  const HREF_MAP: Record<string, string> = {
                    "Register as Student":        "/signup",
                    "Student Login":              "/login",
                    "Singapore Diplomas":         "/students",
                    "6+6 Internship":             "/students#pathway",
                    "Arrival Services":           "/students#arrival",
                    "India → Singapore":          "/study-destination",
                    "Study Destination":          "/study-destination",
                    "Institutions":               "/partners/institutions",
                    "Recruitment Partners":       "/partners/recruitment-partners",
                    "Employers":                  "/partners/employers",
                    "Apply to Partner With Us":   "/partner-with-us",
                  };
                  return (
                    <li key={link}>
                      <Link href={HREF_MAP[link] ?? "#"} className="font-body text-sm text-white/55 hover:text-gold-300 transition-colors">{link}</Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>

        {/* ── Contact + CTA strip ──────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10 p-5 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gold-400/10 flex items-center justify-center flex-shrink-0">
              <Mail className="w-4 h-4 text-gold-400" />
            </div>
            <div>
              <p className="text-white/50 font-body text-[11px]">Email</p>
              <p className="text-white/80 font-body text-sm">pathpportsg@gmail.com</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gold-400/10 flex items-center justify-center flex-shrink-0">
              <Phone className="w-4 h-4 text-gold-400" />
            </div>
            <div>
              <p className="text-white/50 font-body text-[11px]">WhatsApp / Call</p>
              <p className="text-white/80 font-body text-sm">+65 8377 6492</p>
            </div>
          </div>
        </div>

        {/* ── Future markets ───────────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-3 mb-10 p-4 rounded-xl bg-pathBlue-500/[0.05] border border-pathBlue-500/15">
          <span className="text-white/40 font-body text-xs font-semibold uppercase tracking-wider">Expanding soon to:</span>
          {["🇱🇰 Sri Lanka", "🇳🇵 Nepal", "🇧🇩 Bangladesh", "🇧🇹 Bhutan"].map(c => (
            <span key={c} className="text-white/45 font-body text-xs px-2.5 py-1 rounded-full border border-white/[0.08] bg-white/[0.03]">{c}</span>
          ))}
        </div>

        {/* ── Bottom ───────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-6 border-t border-white/[0.06]">
          <p className="text-white/45 font-body text-sm text-center sm:text-left">
            © {new Date().getFullYear()} PathPort · Singapore&apos;s India Diploma Platform
          </p>
          <div className="flex items-center gap-4">
            <Link href="#" className="text-white/40 hover:text-white/70 font-body text-xs transition-colors">Privacy</Link>
            <Link href="#" className="text-white/40 hover:text-white/70 font-body text-xs transition-colors">Terms</Link>
            <Link href="#" className="text-white/40 hover:text-white/70 font-body text-xs transition-colors">Cookies</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
