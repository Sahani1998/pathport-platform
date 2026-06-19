import type { Metadata } from "next";
import MarketingShell from "@/components/marketing/MarketingShell";
import PageHero from "@/components/marketing/PageHero";
import Breadcrumbs from "@/components/marketing/Breadcrumbs";
import JsonLd from "@/components/marketing/JsonLd";
import { breadcrumbJsonLd } from "@/lib/jsonld";

export const metadata: Metadata = {
  title: "Banking in Singapore — Guide for Indian Students | PathPort",
  description: "How to open a Singapore bank account on a Student Pass. Required documents, recommended banks, and tips for sending money between India and Singapore.",
  alternates: { canonical: "/resources/banking" },
};

const BANKS = [
  { name: "DBS / POSB", notes: "Largest Singapore bank. POSB eSavings account is popular with students — low minimum balance, easy online banking, widely accepted PayNow QR. Apply online or in-branch.", minBalance: "SGD 500 (or maintain min transactions)", studentFriendly: "Yes — POSB has specific student account options" },
  { name: "OCBC", notes: "Strong digital banking. OCBC 360 account gives interest bonuses. Some students find OCBC easier to open as a new arrival.", minBalance: "SGD 1,000 (or fee waiver conditions)", studentFriendly: "Moderate" },
  { name: "UOB", notes: "Good branch network. UOB One account. May require more documentation for non-residents.", minBalance: "SGD 1,000", studentFriendly: "Moderate" },
  { name: "Wise (multi-currency)", notes: "Not a Singapore bank but a widely-used platform for students. Excellent for converting SGD to INR and sending money to India. Lower fees than banks for international transfers.", minBalance: "None", studentFriendly: "Excellent for transfers" },
];

export default function BankingPage() {
  return (
    <MarketingShell maxWidth="narrow">
      <JsonLd data={breadcrumbJsonLd([{ name: "Resources", url: "/resources" }, { name: "Banking", url: "/resources/banking" }])} />
      <Breadcrumbs trail={[{ name: "Resources", url: "/resources" }, { name: "Banking", url: "/resources/banking" }]} />

      <PageHero
        eyebrow="Banking"
        title="Managing money in Singapore."
        subtitle="You will need a Singapore bank account to receive your internship salary, pay rent, and make daily purchases. This guide explains how to open one and manage INR-SGD transfers."
      />

      <section className="mb-10 p-5 rounded-2xl bg-gold-400/[0.06] border border-gold-400/20">
        <p className="text-white/75 font-body text-sm leading-relaxed"><strong className="text-white">Open your account early.</strong> Banking in Singapore requires a Student Pass or IPA — you may not be able to open an account with only your passport before your Student Pass is issued. Plan to open an account in your first week after arrival.</p>
      </section>

      <section className="mb-10">
        <h2 className="font-display text-2xl text-white mb-4">Documents you will need</h2>
        <div className="rounded-2xl bg-white/[0.03] border border-white/[0.07] overflow-hidden">
          {[
            "Valid passport",
            "Student Pass or IPA document",
            "Letter of acceptance from your college (some banks require this)",
            "Singapore residential address proof (tenancy agreement or utility bill)",
            "Initial deposit (varies by bank, typically SGD 500–1,000)",
          ].map((doc, i) => (
            <div key={i} className={`flex items-start gap-3 p-4 ${i > 0 ? "border-t border-white/[0.05]" : ""}`}>
              <span className="text-gold-400 text-xs mt-0.5 flex-shrink-0">✓</span>
              <p className="text-white/65 font-body text-sm">{doc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-10">
        <h2 className="font-display text-2xl text-white mb-5">Banks used by students</h2>
        <div className="space-y-3">
          {BANKS.map(b => (
            <div key={b.name} className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.07]">
              <div className="flex items-center justify-between gap-3 mb-2">
                <p className="font-body font-semibold text-white/90 text-sm">{b.name}</p>
                <span className="text-white/35 font-body text-xs">Min balance: {b.minBalance}</span>
              </div>
              <p className="text-white/55 font-body text-sm leading-relaxed mb-1.5">{b.notes}</p>
              <p className="text-white/35 font-body text-xs">Student friendly: {b.studentFriendly}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-10">
        <h2 className="font-display text-2xl text-white mb-4">Sending money between India and Singapore</h2>
        <div className="space-y-2.5">
          {[
            { method: "Bank wire (SWIFT)", cost: "SGD 20–30 fee per transfer + exchange rate margin", speed: "2–5 business days", notes: "Traditional method. Your Indian bank sends SGD to your Singapore account." },
            { method: "Wise (formerly TransferWise)", cost: "0.5–1.5% of transfer amount", speed: "1–2 business days", notes: "Recommended for regular transfers. Much lower fees than banks. Widely used by Indian students in Singapore." },
            { method: "Google Pay / PhonePe to Wise / SG account", cost: "Varies by method", speed: "Same day", notes: "Some students use UPI to fund Wise wallets and transfer to Singapore. Verify current availability." },
            { method: "Cash at airport (avoid)", cost: "High exchange rate margins", speed: "Immediate", notes: "Airport currency exchange rates are typically the worst available. Avoid for large amounts." },
          ].map(m => (
            <div key={m.method} className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
              <p className="font-body font-semibold text-white/85 text-sm mb-1">{m.method}</p>
              <div className="flex flex-wrap gap-3 text-xs mb-1.5">
                <span className="text-white/35">Cost: <span className="text-white/60">{m.cost}</span></span>
                <span className="text-white/35">Speed: <span className="text-white/60">{m.speed}</span></span>
              </div>
              <p className="text-white/45 font-body text-xs leading-relaxed">{m.notes}</p>
            </div>
          ))}
        </div>
      </section>
    </MarketingShell>
  );
}
