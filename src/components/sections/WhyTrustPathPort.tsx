import Link from "next/link";
import { ShieldCheck, MessageCircle, BadgeCheck, Wallet, ArrowRight } from "lucide-react";

/**
 * WhyTrustPathPort — warm/cream "rest" section that breaks up the dark scroll
 * with a softer, parent-friendly tone. Uses PathPort gold/cream palette,
 * preserves brand identity. Placed strategically between dark sections.
 */
const POINTS = [
  {
    icon:  <BadgeCheck className="w-5 h-5" />,
    title: "Every college is verified.",
    body:  "CPE registration, Student Pass eligibility, fee accuracy, and contact verification — checked before any college goes live on PathPort.",
    href:  "/trust/institution-verification",
    cta:   "How verification works",
  },
  {
    icon:  <Wallet className="w-5 h-5" />,
    title: "The price you see is the price you pay.",
    body:  "No platform fee. No agent commission. Fees shown match the invoice issued by the college. Currency converted at a published, transparent rate.",
    href:  "/trust/fee-transparency",
    cta:   "Fee transparency",
  },
  {
    icon:  <ShieldCheck className="w-5 h-5" />,
    title: "Your documents stay private.",
    body:  "Passport copies and transcripts are stored in private encrypted storage. Only your enrolled college can retrieve them — never agents, never marketers.",
    href:  "/trust/document-security",
    cta:   "Document security",
  },
  {
    icon:  <MessageCircle className="w-5 h-5" />,
    title: "Real humans on WhatsApp.",
    body:  "No chatbots, no ticket numbers. A PathPort advisor responds personally — within 24 hours during the application phase, within one business day for general queries.",
    href:  "https://wa.me/6583776492",
    cta:   "Chat with us",
  },
];

export default function WhyTrustPathPort() {
  return (
    <section className="relative py-24 cream-band">
      <div className="max-w-6xl mx-auto px-5 md:px-10">

        {/* Header — dark type on cream */}
        <div className="text-center mb-14">
          <p className="inline-flex items-center gap-3 text-gold-700 font-body text-xs font-semibold tracking-[0.22em] uppercase mb-5">
            <span className="w-8 h-px bg-gold-700/50 rounded-full" />
            Why families trust PathPort
            <span className="w-8 h-px bg-gold-700/50 rounded-full" />
          </p>
          <h2 className="font-display text-4xl md:text-[2.6rem] text-navy-900 leading-[1.08] tracking-tight mb-5 max-w-3xl mx-auto">
            One promise behind every application.
          </h2>
          <p className="font-body text-navy-800/65 text-base md:text-lg leading-relaxed max-w-2xl mx-auto">
            PathPort works because the four things parents worry about most — verification, money, documents, and human support — are not optional features. They&apos;re the platform.
          </p>
        </div>

        {/* Trust cards — light cards with subtle gold accent */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
          {POINTS.map(p => (
            <Link
              key={p.title}
              href={p.href}
              target={p.href.startsWith("http") ? "_blank" : undefined}
              rel={p.href.startsWith("http") ? "noopener noreferrer" : undefined}
              className="group flex items-start gap-4 p-6 md:p-7 rounded-2.5xl warm-panel-card hover:shadow-warm-lg hover:-translate-y-0.5 transition-all duration-300"
            >
              <div className="w-11 h-11 rounded-2xl bg-gold-100 border border-gold-300/50 text-gold-700 flex items-center justify-center flex-shrink-0">
                {p.icon}
              </div>
              <div className="flex-1">
                <h3 className="font-display text-xl text-navy-900 mb-1.5 leading-snug">{p.title}</h3>
                <p className="font-body text-navy-800/65 text-sm leading-relaxed mb-3">{p.body}</p>
                <span className="inline-flex items-center gap-1.5 text-gold-700 font-body text-xs font-semibold group-hover:text-gold-800 transition-colors">
                  {p.cta}
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </div>
            </Link>
          ))}
        </div>

        {/* Footer links */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-5 mt-10">
          <Link
            href="/trust"
            className="inline-flex items-center gap-2 text-navy-900/70 hover:text-navy-900 font-body text-sm font-semibold transition-colors"
          >
            See PathPort&apos;s full Trust Center
            <ArrowRight className="w-4 h-4" />
          </Link>
          <span className="hidden sm:block w-px h-4 bg-navy-900/20" aria-hidden />
          <Link
            href="/for-parents"
            className="inline-flex items-center gap-2 text-gold-700 hover:text-gold-800 font-body text-sm font-semibold transition-colors"
          >
            Parent guide — everything families need to know
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
