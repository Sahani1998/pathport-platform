import type { Metadata } from "next";
import MarketingShell from "@/components/marketing/MarketingShell";
import PageHero from "@/components/marketing/PageHero";
import Breadcrumbs from "@/components/marketing/Breadcrumbs";
import JsonLd from "@/components/marketing/JsonLd";
import { breadcrumbJsonLd } from "@/lib/jsonld";

export const metadata: Metadata = {
  title: "Arrival Preparation Guide for Singapore | PathPort",
  description: "Pre-departure checklist, SG Arrival Card, airport procedures, what to pack, first-day essentials, and reporting to your college after arriving in Singapore.",
  alternates: { canonical: "/resources/arrival-preparation" },
};

const PRE_DEPARTURE = [
  "Confirm your IPA document is downloaded and printed (and saved on your phone).",
  "Book your flight to Singapore Changi Airport (SIN).",
  "Arrange airport pickup or plan your route from Changi Airport to your accommodation.",
  "Confirm your accommodation is ready for move-in on your arrival date.",
  "Complete the Singapore Arrival Card (SG Arrival Card) online within 3 days before departure.",
  "Ensure your passport has at least 6 months of validity remaining.",
  "Carry the college&apos;s acceptance letter and offer letter in your hand luggage.",
  "Carry approximately SGD 200–500 in cash for initial expenses (SIM card, transport, food, EZ-Link).",
  "Have your IPA document and all original academic documents in your hand luggage.",
  "Notify your college of your exact flight number and expected arrival time.",
];

const WHAT_TO_PACK = [
  { category: "Documents (hand luggage ONLY)", items: ["Original passport", "IPA document (printed)", "Acceptance letter from college", "All original academic certificates and transcripts", "Medical history / vaccination records"] },
  { category: "Clothing", items: ["Light, breathable cotton clothing (Singapore is hot and humid year-round)", "1–2 light jackets/hoodies for air-conditioned MRT and classrooms", "Comfortable walking shoes", "Formal shoes for college presentations"] },
  { category: "Electronics", items: ["Laptop (most essential student purchase — buy before travel if possible)", "Universal power adapter or Singapore-standard (Type G, 3-pin) plugs", "Earphones", "Power bank"] },
  { category: "Personal care", items: ["1–2 weeks of any prescription medication (bring original prescription too)", "Familiar toiletries for your first week (most Indian brands available at Mustafa Centre)", "A small first aid kit"] },
];

const ARRIVAL_STEPS = [
  { step: "Land at Changi Airport", detail: "Changi is world-famous for its efficiency. Immigration queues are usually fast. Follow signs to Immigration and Checkpoints." },
  { step: "Present IPA at immigration", detail: "Show your IPA and passport at the immigration counter. The immigration officer will stamp your passport. Do NOT lose this stamp — it is your provisional entry authority until your Student Pass is issued." },
  { step: "Collect your baggage", detail: "Standard baggage claim after immigration clearance." },
  { step: "Get your Singapore SIM card", detail: "SIM cards are available at Changi Airport from Singtel, Starhub, and M1 (all terminals, Arrivals Hall). This is your priority — you need data to navigate, contact your landlord, and stay connected." },
  { step: "Travel to your accommodation", detail: "MRT from Changi Airport (East-West or Thomson-East Coast lines) connects to the city. Alternatively, Grab is available from the taxi/ride-hail area at Arrivals." },
  { step: "Report to your college", detail: "Within the first 1–3 days (college-specific requirement), attend your orientation and report to the college administration with your IPA. The college will then process your Student Pass application with ICA." },
  { step: "Open your bank account", detail: "In your first week, open a Singapore bank account — you will need a local account to receive your internship salary. Bring your passport, IPA, and college acceptance letter." },
];

export default function ArrivalPreparationPage() {
  return (
    <MarketingShell maxWidth="narrow">
      <JsonLd data={breadcrumbJsonLd([{ name: "Resources", url: "/resources" }, { name: "Arrival Preparation", url: "/resources/arrival-preparation" }])} />
      <Breadcrumbs trail={[{ name: "Resources", url: "/resources" }, { name: "Arrival Preparation", url: "/resources/arrival-preparation" }]} />

      <PageHero
        eyebrow="Arrival Preparation"
        title="Your complete guide to arriving in Singapore."
        subtitle="A clear pre-departure checklist and step-by-step arrival guide for Indian students flying to Singapore on an IPA."
      />

      <section className="mb-10">
        <h2 className="font-display text-2xl text-white mb-4">Pre-departure checklist</h2>
        <div className="rounded-2xl bg-white/[0.03] border border-white/[0.07] overflow-hidden">
          {PRE_DEPARTURE.map((item, i) => (
            <div key={i} className={`flex items-start gap-3 p-4 ${i > 0 ? "border-t border-white/[0.05]" : ""}`}>
              <span className="w-5 h-5 rounded-full border border-gold-400/40 text-gold-400 font-body text-xs flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
              <p className="text-white/65 font-body text-sm leading-relaxed">{item}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-10">
        <h2 className="font-display text-2xl text-white mb-4">What to pack</h2>
        <div className="space-y-4">
          {WHAT_TO_PACK.map(cat => (
            <div key={cat.category} className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.07]">
              <p className="font-body font-semibold text-white/85 text-sm mb-3">{cat.category}</p>
              <ul className="space-y-1.5">
                {cat.items.map(item => (
                  <li key={item} className="flex items-start gap-2 text-white/55 font-body text-sm">
                    <span className="text-gold-400 text-xs mt-0.5">→</span> {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-10">
        <h2 className="font-display text-2xl text-white mb-5">Your first day in Singapore</h2>
        <div className="relative">
          <div aria-hidden className="absolute left-[15px] top-2 bottom-2 w-px bg-gradient-to-b from-gold-400/40 via-white/10 to-transparent" />
          <div className="space-y-4">
            {ARRIVAL_STEPS.map((s, i) => (
              <div key={s.step} className="relative pl-10">
                <div className="absolute left-0 top-1 w-7 h-7 rounded-full bg-navy-900 border-2 border-gold-400/40 flex items-center justify-center">
                  <span className="text-gold-400 font-body text-[9px] font-bold">{i + 1}</span>
                </div>
                <p className="font-body font-semibold text-white/85 text-sm mb-0.5">{s.step}</p>
                <p className="text-white/50 font-body text-xs leading-relaxed">{s.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-5">
        <p className="font-body font-semibold text-white/85 text-sm mb-2">Questions before you arrive?</p>
        <p className="text-white/55 font-body text-sm leading-relaxed mb-3">PathPort support is available on WhatsApp. If you have questions about your IPA, what to bring, or what to do after landing, send us a message.</p>
        <a href="https://wa.me/6583776492" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gold-400/10 border border-gold-400/30 text-gold-400 font-body text-sm font-semibold hover:bg-gold-400/20 transition-all">
          WhatsApp +65 8377 6492
        </a>
      </section>
    </MarketingShell>
  );
}
