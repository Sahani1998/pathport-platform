import type { Metadata } from "next";
import { Mail, Phone, MessageCircle, MapPin } from "lucide-react";
import MarketingShell from "@/components/marketing/MarketingShell";
import PageHero from "@/components/marketing/PageHero";
import Breadcrumbs from "@/components/marketing/Breadcrumbs";

export const metadata: Metadata = {
  title: "Contact PathPort",
  description: "Get in touch with PathPort. Student support, institution enquiries, partner applications, and press contacts.",
  alternates: { canonical: "/contact" },
};

const CHANNELS = [
  { icon: <MessageCircle className="w-5 h-5" />, title: "Students & families", desc: "Questions about a course, an application, or your dashboard? WhatsApp is fastest.",
    cta: { label: "WhatsApp +65 8377 6492", href: "https://wa.me/6583776492" } },
  { icon: <Mail className="w-5 h-5" />,         title: "Institutions",         desc: "Singapore private colleges looking to list courses, manage applications, or upload IPAs.",
    cta: { label: "pathportsg@gmail.com", href: "mailto:pathportsg@gmail.com?subject=Institution%20enquiry" } },
  { icon: <Mail className="w-5 h-5" />,         title: "Partners",             desc: "Recruitment partners and employers interested in joining the PathPort network.",
    cta: { label: "Apply to partner with us", href: "/partner-with-us" } },
  { icon: <Mail className="w-5 h-5" />,         title: "Press & media",        desc: "Interview requests, brand assets, and editorial enquiries.",
    cta: { label: "Visit press page", href: "/press" } },
];

export default function ContactPage() {
  return (
    <MarketingShell>
      <Breadcrumbs trail={[{ name: "Contact", url: "/contact" }]} />

      <PageHero
        eyebrow="Contact"
        title="Talk to a real human."
        subtitle="No chatbots, no ticket numbers. Pick the channel that matches your question and we&apos;ll respond within one business day."
      />

      <section className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
        {CHANNELS.map(c => (
          <div key={c.title} className="p-6 rounded-2xl bg-white/[0.04] border border-white/[0.08]">
            <div className="w-11 h-11 rounded-xl bg-gold-400/10 border border-gold-400/25 text-gold-400 flex items-center justify-center mb-4">{c.icon}</div>
            <h3 className="font-display text-xl text-white mb-2">{c.title}</h3>
            <p className="text-white/55 font-body text-sm leading-relaxed mb-5">{c.desc}</p>
            <a
              href={c.cta.href}
              target={c.cta.href.startsWith("http") ? "_blank" : undefined}
              rel={c.cta.href.startsWith("http") ? "noopener noreferrer" : undefined}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.05] border border-white/[0.10] text-white/75 font-body text-sm font-semibold hover:text-gold-300 hover:border-gold-400/30 transition-all"
            >
              {c.cta.label} →
            </a>
          </div>
        ))}
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.07] flex items-start gap-3">
          <Phone className="w-4 h-4 text-gold-400 flex-shrink-0 mt-1" />
          <div>
            <p className="text-white/35 font-body text-[10px] uppercase tracking-widest mb-1">Call / WhatsApp</p>
            <p className="text-white/80 font-body text-sm">+65 8377 6492</p>
          </div>
        </div>
        <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.07] flex items-start gap-3">
          <Mail className="w-4 h-4 text-gold-400 flex-shrink-0 mt-1" />
          <div>
            <p className="text-white/35 font-body text-[10px] uppercase tracking-widest mb-1">Email</p>
            <p className="text-white/80 font-body text-sm">pathportsg@gmail.com</p>
          </div>
        </div>
        <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.07] flex items-start gap-3">
          <MapPin className="w-4 h-4 text-gold-400 flex-shrink-0 mt-1" />
          <div>
            <p className="text-white/35 font-body text-[10px] uppercase tracking-widest mb-1">Based in</p>
            <p className="text-white/80 font-body text-sm">Singapore</p>
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}
