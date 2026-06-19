import type { Metadata } from "next";
import { MessageSquare } from "lucide-react";
import MarketingShell from "@/components/marketing/MarketingShell";
import PageHero from "@/components/marketing/PageHero";
import Breadcrumbs from "@/components/marketing/Breadcrumbs";
import JsonLd from "@/components/marketing/JsonLd";
import { breadcrumbJsonLd } from "@/lib/jsonld";

export const metadata: Metadata = {
  title: "Complaint Resolution | PathPort Trust Center",
  description: "How to raise a complaint with PathPort, our response SLAs, escalation paths, and external bodies you can approach if unsatisfied.",
  alternates: { canonical: "/trust/complaint-resolution" },
};

const SLA = [
  { stage: "Acknowledgement", timeline: "Within 1 business day of receiving complaint" },
  { stage: "Initial response with investigation update", timeline: "Within 3 business days" },
  { stage: "Resolution or escalation notice", timeline: "Within 10 business days" },
  { stage: "Final response", timeline: "Within 21 business days (complex cases)" },
];

const ESCALATION = [
  { body: "CPE (Committee for Private Education)", scope: "Complaints about EduTrust-certified private colleges — refund disputes, course delivery failures, misleading enrolment practices.", url: "cpe.gov.sg" },
  { body: "PDPC (Personal Data Protection Commission)", scope: "Complaints about misuse of your personal data, failure to respond to PDPA access or correction requests, or data breaches.", url: "pdpc.gov.sg" },
  { body: "Singapore Mediation Centre", scope: "Disputes that cannot be resolved through direct negotiation. PathPort's Terms of Service specify Singapore Mediation Centre as the first step before litigation.", url: "mediation.com.sg" },
  { body: "CASE (Consumers Association of Singapore)", scope: "General consumer disputes where a financial loss has occurred and the parties cannot agree on a resolution.", url: "case.org.sg" },
];

export default function ComplaintResolutionPage() {
  return (
    <MarketingShell>
      <JsonLd data={breadcrumbJsonLd([{ name: "Trust Center", url: "/trust" }, { name: "Complaint Resolution", url: "/trust/complaint-resolution" }])} />
      <Breadcrumbs trail={[{ name: "Trust Center", url: "/trust" }, { name: "Complaint Resolution", url: "/trust/complaint-resolution" }]} />

      <PageHero
        eyebrow="Complaint Resolution"
        title="We take every complaint seriously."
        subtitle="If PathPort has not met its commitments to you, we want to know. This page explains how to raise a complaint, what to expect, and where to go if you are not satisfied with our response."
      />

      <section className="mb-12">
        <h2 className="font-display text-2xl text-white mb-5 flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-gold-400" /> How to raise a complaint
        </h2>
        <div className="space-y-3">
          {[
            { n: "1", title: "Contact PathPort directly", body: "Email pathportsg@gmail.com with the subject line 'Formal Complaint' and include: your full name, application ID or invoice number, a clear description of the issue, what you have already tried, and what outcome you expect." },
            { n: "2", title: "Receive acknowledgement", body: "PathPort will acknowledge your complaint within one business day. You will receive a reference number and the name of the team member handling your case." },
            { n: "3", title: "Investigation", body: "PathPort will investigate the complaint. This may involve reviewing your application timeline, contacting the college, reviewing uploaded documents, or examining platform logs." },
            { n: "4", title: "Resolution", body: "PathPort will propose a resolution — a correction, a refund facilitation, a platform update, or a formal explanation of why your complaint could not be upheld. If you accept the resolution, the complaint is closed." },
            { n: "5", title: "Escalation", body: "If you are not satisfied with PathPort's resolution, you may escalate to external bodies (listed below). PathPort will cooperate fully with any investigation by a regulatory body." },
          ].map(step => (
            <div key={step.n} className="flex items-start gap-4 p-5 rounded-2xl bg-white/[0.03] border border-white/[0.07]">
              <span className="w-8 h-8 rounded-full bg-gold-400/10 border border-gold-400/25 text-gold-400 font-body text-xs font-bold flex items-center justify-center flex-shrink-0">{step.n}</span>
              <div>
                <p className="font-body font-semibold text-white/90 text-sm mb-1">{step.title}</p>
                <p className="text-white/55 font-body text-sm leading-relaxed">{step.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-12">
        <h2 className="font-display text-2xl text-white mb-5">Response timelines</h2>
        <div className="rounded-2xl bg-white/[0.03] border border-white/[0.07] overflow-hidden">
          {SLA.map((s, i) => (
            <div key={s.stage} className={`flex flex-col md:flex-row gap-2 md:gap-6 p-4 ${i > 0 ? "border-t border-white/[0.05]" : ""}`}>
              <span className="text-white/75 font-body text-sm md:w-64 flex-shrink-0">{s.stage}</span>
              <span className="text-gold-400/80 font-body text-sm">{s.timeline}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-12">
        <h2 className="font-display text-2xl text-white mb-5">External escalation bodies</h2>
        <div className="space-y-3">
          {ESCALATION.map(e => (
            <div key={e.body} className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.07]">
              <div className="flex items-center gap-2 mb-1.5">
                <p className="font-body font-semibold text-white/90 text-sm">{e.body}</p>
                <span className="text-gold-400/70 font-body text-xs">{e.url}</span>
              </div>
              <p className="text-white/50 font-body text-sm leading-relaxed">{e.scope}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-6">
        <h3 className="font-display text-xl text-white mb-2">Submit a complaint now</h3>
        <p className="text-white/55 font-body text-sm mb-4">Email us with the subject line &quot;Formal Complaint&quot;. Include your application ID and a clear description of the issue.</p>
        <a href="mailto:pathportsg@gmail.com?subject=Formal%20Complaint" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gold-400/10 border border-gold-400/30 text-gold-400 font-body text-sm font-semibold hover:bg-gold-400/20 transition-all">
          pathportsg@gmail.com
        </a>
      </section>
    </MarketingShell>
  );
}
