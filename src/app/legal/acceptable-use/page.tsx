import type { Metadata } from "next";
import { CheckCircle, X } from "lucide-react";
import MarketingShell from "@/components/marketing/MarketingShell";
import PageHero from "@/components/marketing/PageHero";
import Breadcrumbs from "@/components/marketing/Breadcrumbs";
import JsonLd from "@/components/marketing/JsonLd";
import { breadcrumbJsonLd } from "@/lib/jsonld";

export const metadata: Metadata = {
  title: "Acceptable Use Policy | PathPort",
  description: "What you may and may not do on PathPort — prohibited conduct, document integrity, account sharing, and consequences for violations.",
  alternates: { canonical: "/legal/acceptable-use" },
};

const PERMITTED = [
  "Browse and compare Singapore private college diploma programmes.",
  "Submit genuine applications with accurate personal and educational information.",
  "Upload authentic, unaltered copies of documents (passport, transcripts, certificates).",
  "Communicate with PathPort support about your application.",
  "Download your own offer letters, IPA documents, and invoices.",
  "Share feedback about PathPort or a listed institution.",
];

const PROHIBITED = [
  { act: "Submitting false or altered documents", consequence: "Immediate account suspension, reporting to the institution and, where required, to relevant authorities including ICA Singapore." },
  { act: "Creating multiple accounts", consequence: "Duplicate accounts are merged or the newer account is closed. Applications submitted under a secondary account may be invalidated." },
  { act: "Sharing your PathPort login credentials with another person", consequence: "Account suspension. You are responsible for all activity under your account." },
  { act: "Attempting to access another student's or institution's data", consequence: "Immediate permanent account ban and reporting to relevant cybersecurity authorities under Singapore's Computer Misuse Act." },
  { act: "Impersonating a college, recruiter, or PathPort staff member", consequence: "Immediate permanent account ban and potential civil or criminal action." },
  { act: "Using PathPort to facilitate fraud, money laundering, or illegal immigration", consequence: "Immediate account closure and full cooperation with law enforcement." },
  { act: "Scraping or automated querying of PathPort without permission", consequence: "IP blocking and potential legal action under Singapore's Computer Misuse Act." },
  { act: "Uploading malicious files, scripts, or executable code", consequence: "Immediate account suspension and security investigation." },
  { act: "Harassing or threatening PathPort staff, college staff, or other users", consequence: "Account suspension and reporting to relevant authorities." },
];

export default function AcceptableUsePage() {
  return (
    <MarketingShell maxWidth="narrow">
      <JsonLd data={breadcrumbJsonLd([{ name: "Legal Center", url: "/legal" }, { name: "Acceptable Use Policy", url: "/legal/acceptable-use" }])} />
      <Breadcrumbs trail={[{ name: "Legal Center", url: "/legal" }, { name: "Acceptable Use Policy", url: "/legal/acceptable-use" }]} />

      <PageHero
        eyebrow="Acceptable Use Policy"
        title="How PathPort may and may not be used."
        subtitle="This policy applies to all students, parents, institutions, and partners who access the PathPort platform. It supplements the Terms of Service."
      />

      <div className="text-white/35 font-body text-xs mb-8">Effective date: 19 June 2026 · Governed by Singapore law</div>

      <section className="mb-10">
        <h2 className="font-display text-xl text-white mb-4 flex items-center gap-2"><CheckCircle className="w-4 h-4 text-gold-400" /> Permitted uses</h2>
        <div className="space-y-2">
          {PERMITTED.map(item => (
            <div key={item} className="flex items-start gap-3 p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
              <CheckCircle className="w-3.5 h-3.5 text-gold-400 flex-shrink-0 mt-0.5" />
              <p className="text-white/65 font-body text-sm leading-relaxed">{item}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-10">
        <h2 className="font-display text-xl text-white mb-4 flex items-center gap-2"><X className="w-4 h-4 text-red-400" /> Prohibited conduct and consequences</h2>
        <div className="space-y-3">
          {PROHIBITED.map(item => (
            <div key={item.act} className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.07]">
              <p className="font-body font-semibold text-white/90 text-sm mb-1.5 flex items-center gap-2">
                <X className="w-3.5 h-3.5 text-red-400/70 flex-shrink-0" /> {item.act}
              </p>
              <p className="text-white/50 font-body text-sm leading-relaxed ml-5">{item.consequence}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-8">
        <h2 className="font-display text-xl text-white mb-3">Document integrity</h2>
        <p className="text-white/60 font-body text-sm leading-relaxed">Submitting fraudulent, altered, or counterfeit documents is a serious offence under Singapore law and may constitute fraud or forgery under the Penal Code. PathPort takes document integrity very seriously. Suspected document fraud is reported to the relevant institution and, where appropriate, to ICA Singapore and the Singapore Police Force.</p>
      </section>

      <section className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-6">
        <h3 className="font-display text-xl text-white mb-2">Report a violation</h3>
        <p className="text-white/55 font-body text-sm mb-4">If you are aware of a violation of this policy by another user or by a PathPort-listed institution, contact us. All reports are treated confidentially.</p>
        <a href="mailto:pathportsg@gmail.com?subject=AUP%20violation%20report" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.05] border border-white/[0.10] text-white/70 font-body text-sm font-semibold hover:border-gold-400/30 hover:text-gold-300 transition-all">
          pathportsg@gmail.com →
        </a>
      </section>
    </MarketingShell>
  );
}
