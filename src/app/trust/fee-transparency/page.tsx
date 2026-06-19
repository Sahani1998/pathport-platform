import type { Metadata } from "next";
import { DollarSign, X, CheckCircle } from "lucide-react";
import MarketingShell from "@/components/marketing/MarketingShell";
import PageHero from "@/components/marketing/PageHero";
import Breadcrumbs from "@/components/marketing/Breadcrumbs";
import JsonLd from "@/components/marketing/JsonLd";
import { breadcrumbJsonLd } from "@/lib/jsonld";

export const metadata: Metadata = {
  title: "Fee Transparency | PathPort Trust Center",
  description: "How PathPort ensures every fee shown is the fee you pay — no agent commissions, no platform markups, no hidden charges.",
  alternates: { canonical: "/trust/fee-transparency" },
};

const DOES = [
  "Show tuition fees in both SGD and INR on every course page.",
  "Display fees that match the invoice issued by the college — no inflation.",
  "Break down what is included (tuition only) vs. what is not (accommodation, insurance, living costs).",
  "Show an estimated total cost of study including typical living expenses, so you can plan accurately.",
  "Update fees when colleges notify PathPort of changes, before the next application cycle.",
];

const DOES_NOT = [
  "Charge a platform fee, processing fee, or facilitation fee on top of college tuition.",
  "Earn commission from colleges based on student enrolments.",
  "Accept payments from students — fees go directly to the college via bank transfer.",
  "Charge for document submission, offer letter downloads, or IPA tracking.",
  "Add currency conversion markups — INR amounts use a published exchange rate that is displayed with the fee.",
];

const FEE_COMPONENTS = [
  { item: "Tuition fee (shown on course page)", included: true, notes: "Set by college, verified by PathPort" },
  { item: "PathPort platform fee", included: false, notes: "PathPort charges no student-facing fees" },
  { item: "Agent commission", included: false, notes: "PathPort does not operate on commission" },
  { item: "Application processing fee", included: false, notes: "Not charged by PathPort" },
  { item: "Accommodation", included: false, notes: "Student arranges separately — PathPort provides guidance" },
  { item: "Student insurance", included: false, notes: "Student arranges separately — PathPort provides guidance" },
  { item: "Living expenses", included: false, notes: "Estimated in SGD on resource pages" },
  { item: "ICA Student Pass fee", included: false, notes: "Paid directly to ICA — approx. SGD 30–60" },
];

export default function FeeTransparencyPage() {
  return (
    <MarketingShell>
      <JsonLd data={breadcrumbJsonLd([{ name: "Trust Center", url: "/trust" }, { name: "Fee Transparency", url: "/trust/fee-transparency" }])} />
      <Breadcrumbs trail={[{ name: "Trust Center", url: "/trust" }, { name: "Fee Transparency", url: "/trust/fee-transparency" }]} />

      <PageHero
        eyebrow="Fee Transparency"
        title="The price you see is the price you pay."
        subtitle="PathPort was built because Indian students were being overcharged by agents who added undisclosed commissions to college fees. We eliminate that completely."
      />

      <section className="mb-10 p-5 rounded-2xl bg-gold-400/[0.06] border border-gold-400/20">
        <p className="text-white/75 font-body text-sm leading-relaxed">
          <DollarSign className="w-4 h-4 text-gold-400 inline mr-1 -mt-0.5" />
          <strong className="text-white">Core commitment:</strong> PathPort earns nothing from your tuition fee. We are not paid per enrolment. The only money that flows in a PathPort transaction is from student to college — not via PathPort&apos;s accounts.
        </p>
      </section>

      <section className="mb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h2 className="font-display text-xl text-white mb-4 flex items-center gap-2"><CheckCircle className="w-4 h-4 text-gold-400" /> What PathPort does</h2>
            <div className="space-y-2.5">
              {DOES.map(item => (
                <div key={item} className="flex items-start gap-2.5 p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                  <CheckCircle className="w-3.5 h-3.5 text-gold-400 flex-shrink-0 mt-0.5" />
                  <p className="text-white/65 font-body text-sm leading-relaxed">{item}</p>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h2 className="font-display text-xl text-white mb-4 flex items-center gap-2"><X className="w-4 h-4 text-red-400" /> What PathPort does not do</h2>
            <div className="space-y-2.5">
              {DOES_NOT.map(item => (
                <div key={item} className="flex items-start gap-2.5 p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                  <X className="w-3.5 h-3.5 text-red-400/60 flex-shrink-0 mt-0.5" />
                  <p className="text-white/65 font-body text-sm leading-relaxed">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mb-12">
        <h2 className="font-display text-2xl text-white mb-5">What is included in PathPort course fees</h2>
        <div className="rounded-2xl bg-white/[0.03] border border-white/[0.07] overflow-x-auto">
          <table className="w-full min-w-[560px]">
            <thead>
              <tr className="border-b border-white/[0.07]">
                <th className="text-left text-white/35 font-body text-xs uppercase tracking-widest p-4">Item</th>
                <th className="text-left text-white/35 font-body text-xs uppercase tracking-widest p-4">Included in quoted fee</th>
                <th className="text-left text-white/35 font-body text-xs uppercase tracking-widest p-4">Notes</th>
              </tr>
            </thead>
            <tbody>
              {FEE_COMPONENTS.map((f, i) => (
                <tr key={f.item} className={i > 0 ? "border-t border-white/[0.05]" : ""}>
                  <td className="text-white/75 font-body text-sm p-4">{f.item}</td>
                  <td className="p-4">
                    {f.included
                      ? <span className="text-gold-400 font-body text-sm font-semibold">Yes</span>
                      : <span className="text-white/35 font-body text-sm">No</span>}
                  </td>
                  <td className="text-white/45 font-body text-sm p-4">{f.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-6">
        <h3 className="font-display text-xl text-white mb-2">Spot a discrepancy between a quoted fee and your invoice?</h3>
        <p className="text-white/55 font-body text-sm mb-4">Contact PathPort immediately via WhatsApp or email. We will review the fee data on the platform and work with the college to correct any discrepancy.</p>
        <a href="https://wa.me/6583776492" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gold-400/10 border border-gold-400/30 text-gold-400 font-body text-sm font-semibold hover:bg-gold-400/20 transition-all">
          WhatsApp us now
        </a>
      </section>
    </MarketingShell>
  );
}
