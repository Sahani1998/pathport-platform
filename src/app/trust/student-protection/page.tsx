import type { Metadata } from "next";
import { Shield, AlertCircle, Phone } from "lucide-react";
import MarketingShell from "@/components/marketing/MarketingShell";
import PageHero from "@/components/marketing/PageHero";
import Breadcrumbs from "@/components/marketing/Breadcrumbs";
import JsonLd from "@/components/marketing/JsonLd";
import { breadcrumbJsonLd } from "@/lib/jsonld";

export const metadata: Metadata = {
  title: "Student Protection Policy | PathPort Trust Center",
  description: "PathPort's student protection commitments — what we guarantee, what we do when things go wrong, and your rights as a PathPort student.",
  alternates: { canonical: "/trust/student-protection" },
};

const COMMITMENTS = [
  { title: "Honest fee information", body: "Fees shown on every course page are the fees on your invoice. PathPort does not inflate fees, charge platform markups, or earn commission on your tuition. What you see is what you pay." },
  { title: "Real application status", body: "Application status updates in your dashboard reflect actual actions taken by your college — offer issued, payment confirmed, IPA submitted. We do not fabricate progress or show optimistic estimates." },
  { title: "Secure document handling", body: "Your passport copy, transcripts, and financial documents are stored in private encrypted storage. Only your enrolled college and PathPort staff with a verified need can access them." },
  { title: "Human support — no bots", body: "If you have a question, a real person responds on WhatsApp (+65 8377 6492) or email (pathportsg@gmail.com). We do not use automated chatbots for student support." },
  { title: "IPA tracking transparency", body: "PathPort tracks the status of your IPA / Student Pass submission and notifies you of updates. We do not control ICA timelines, but we ensure you are never left without information." },
  { title: "No hidden obligations", body: "PathPort's role as intermediary is documented clearly. We do not lock you into services, charge for additional consultations, or require referral fees. What PathPort does is described on this site — no more." },
];

const PROBLEMS = [
  { scenario: "College does not respond to your application", action: "Contact PathPort via WhatsApp. We will follow up with the institution's admissions team and provide a status update within two business days." },
  { scenario: "You receive incorrect fee information", action: "Raise it via the complaint resolution process. PathPort will review the page, correct any error, and — if you were overcharged — assist you in seeking a correction from the college." },
  { scenario: "Your documents are lost or accessed without authorisation", action: "PathPort will notify you immediately, investigate the breach, and report to PDPC (Singapore's data regulator) within 3 days of discovery if the breach is notifiable." },
  { scenario: "Your IPA application is rejected by ICA", action: "ICA visa decisions are made by ICA, not PathPort. PathPort will share the rejection notice, help you understand the reason, and connect you with your college's admissions team to discuss reapplication options." },
  { scenario: "A college closes or cancels your course", action: "PathPort will notify you, facilitate any refund owed under the college's policy, and help you explore transfer options to other PathPort-listed colleges if relevant." },
];

export default function StudentProtectionPage() {
  return (
    <MarketingShell>
      <JsonLd data={breadcrumbJsonLd([{ name: "Trust Center", url: "/trust" }, { name: "Student Protection Policy", url: "/trust/student-protection" }])} />
      <Breadcrumbs trail={[{ name: "Trust Center", url: "/trust" }, { name: "Student Protection Policy", url: "/trust/student-protection" }]} />

      <PageHero
        eyebrow="Student Protection Policy"
        title="Your rights as a PathPort student."
        subtitle="This policy describes what PathPort commits to, what we do when things go wrong, and how to reach us if you need help."
      />

      <section className="mb-12">
        <h2 className="font-display text-2xl text-white mb-5 flex items-center gap-2">
          <Shield className="w-5 h-5 text-gold-400" /> Our commitments to you
        </h2>
        <div className="space-y-3">
          {COMMITMENTS.map(c => (
            <div key={c.title} className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.07]">
              <p className="font-body font-semibold text-white/90 text-base mb-1.5">{c.title}</p>
              <p className="text-white/55 font-body text-sm leading-relaxed">{c.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-12">
        <h2 className="font-display text-2xl text-white mb-5 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-gold-400" /> When things go wrong
        </h2>
        <div className="rounded-2xl bg-white/[0.03] border border-white/[0.07] overflow-hidden">
          {PROBLEMS.map((p, i) => (
            <div key={p.scenario} className={`p-5 ${i > 0 ? "border-t border-white/[0.05]" : ""}`}>
              <p className="font-body font-semibold text-white/85 text-sm mb-1.5">{p.scenario}</p>
              <p className="text-white/50 font-body text-sm leading-relaxed">{p.action}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-6">
        <h3 className="font-display text-xl text-white mb-2 flex items-center gap-2"><Phone className="w-4 h-4 text-gold-400" /> Contact student support</h3>
        <p className="text-white/55 font-body text-sm mb-4">For urgent matters, WhatsApp is the fastest channel. For formal complaints, use our complaint resolution process.</p>
        <div className="flex flex-wrap gap-3">
          <a href="https://wa.me/6583776492" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gold-400/10 border border-gold-400/30 text-gold-400 font-body text-sm font-semibold hover:bg-gold-400/20 transition-all">
            WhatsApp +65 8377 6492
          </a>
          <a href="mailto:pathportsg@gmail.com" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.05] border border-white/[0.10] text-white/70 font-body text-sm font-semibold hover:border-gold-400/30 hover:text-gold-300 transition-all">
            pathportsg@gmail.com
          </a>
        </div>
      </section>
    </MarketingShell>
  );
}
