import type { Metadata } from "next";
import MarketingShell from "@/components/marketing/MarketingShell";
import PageHero from "@/components/marketing/PageHero";
import Breadcrumbs from "@/components/marketing/Breadcrumbs";
import JsonLd from "@/components/marketing/JsonLd";
import { breadcrumbJsonLd } from "@/lib/jsonld";

export const metadata: Metadata = {
  title: "Payment Verification | PathPort Trust Center",
  description: "How PathPort verifies payment proofs, matches amounts to invoices, and protects students and colleges from payment errors.",
  alternates: { canonical: "/trust/payment-verification" },
};

const STEPS = [
  { n: "01", title: "Invoice is raised by the college", body: "The college issues an invoice through the PathPort institution portal. The invoice amount is fixed — it cannot be modified by PathPort or altered after issue without the college creating a new invoice. The student receives an in-app notification and email." },
  { n: "02", title: "Student pays via bank transfer", body: "The student pays the invoice amount directly to the college's bank account (details on the invoice). PathPort does not hold or process money. The student then uploads their bank transfer receipt or screenshot as payment proof in their PathPort dashboard." },
  { n: "03", title: "PathPort reviews the payment proof", body: "A PathPort administrator reviews the uploaded proof: verifies the transfer amount matches the invoice amount (in SGD), checks the transfer reference or beneficiary name, and confirms the proof appears genuine. Proofs that do not match or appear altered are flagged for further review." },
  { n: "04", title: "Payment is marked as verified", body: "Once verified, PathPort marks the payment as confirmed in the institution portal. The college receives a notification that payment has been verified and can proceed to the next application stage — for example, submitting the IPA to ICA." },
  { n: "05", title: "Overpayment and underpayment handling", body: "If a payment proof shows an amount greater than the invoice, PathPort flags this and contacts the student and college. PathPort will not mark a payment as verified if the proof does not match the invoice amount. Underpayments are rejected with a note to the student to pay the remaining balance." },
];

const PROTECTION = [
  { title: "Concurrent attempt cap", body: "PathPort limits the number of active payment attempts per invoice to 5. This prevents confusion from multiple proof uploads for the same invoice." },
  { title: "Anti-overrun guard", body: "The system checks that the total of all verified payments does not exceed the invoice amount. This prevents double-counting errors." },
  { title: "Payment proof immutability", body: "Once a payment proof is uploaded, the original file is stored in PathPort's secure private storage. It cannot be replaced by the student. If a revised proof is needed, a PathPort administrator must facilitate the update." },
  { title: "No cash or offline payments", body: "PathPort does not accept cash payments or payments outside the bank transfer workflow. Any request to pay in cash, via a third party, or outside PathPort is a red flag and should be reported to PathPort immediately." },
];

export default function PaymentVerificationPage() {
  return (
    <MarketingShell>
      <JsonLd data={breadcrumbJsonLd([{ name: "Trust Center", url: "/trust" }, { name: "Payment Verification", url: "/trust/payment-verification" }])} />
      <Breadcrumbs trail={[{ name: "Trust Center", url: "/trust" }, { name: "Payment Verification", url: "/trust/payment-verification" }]} />

      <PageHero
        eyebrow="Payment Verification"
        title="How payments are verified on PathPort."
        subtitle="PathPort does not process payments — but we verify them. Here is the step-by-step process that protects both students and colleges."
      />

      <section className="mb-12">
        <h2 className="font-display text-2xl text-white mb-6">The payment flow</h2>
        <div className="relative">
          <div aria-hidden className="absolute left-[19px] top-2 bottom-2 w-px bg-gradient-to-b from-gold-400/40 via-white/10 to-transparent" />
          <div className="space-y-5">
            {STEPS.map(s => (
              <div key={s.n} className="relative pl-14">
                <div className="absolute left-0 top-1 w-10 h-10 rounded-full bg-navy-900 border-2 border-gold-400/40 flex items-center justify-center">
                  <span className="text-gold-400 font-body text-xs font-bold">{s.n}</span>
                </div>
                <h3 className="font-display text-lg text-white mb-1.5">{s.title}</h3>
                <p className="text-white/55 font-body text-sm leading-relaxed">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mb-12">
        <h2 className="font-display text-2xl text-white mb-5">Payment protection controls</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {PROTECTION.map(p => (
            <div key={p.title} className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.07]">
              <p className="font-body font-semibold text-white/90 text-sm mb-1.5">{p.title}</p>
              <p className="text-white/55 font-body text-sm leading-relaxed">{p.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-6">
        <h3 className="font-display text-xl text-white mb-2">If you are asked to pay outside PathPort</h3>
        <p className="text-white/55 font-body text-sm leading-relaxed">All legitimate payments for PathPort-listed courses are made by bank transfer to the college&apos;s account, with proof uploaded in PathPort. If anyone — including a college representative — asks you to pay via a different method, contact PathPort immediately before sending any money.</p>
        <a href="https://wa.me/6583776492" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2 mt-4 rounded-xl bg-gold-400/10 border border-gold-400/30 text-gold-400 font-body text-sm font-semibold hover:bg-gold-400/20 transition-all">
          Contact PathPort on WhatsApp
        </a>
      </section>
    </MarketingShell>
  );
}
