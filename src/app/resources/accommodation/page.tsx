import type { Metadata } from "next";
import MarketingShell from "@/components/marketing/MarketingShell";
import PageHero from "@/components/marketing/PageHero";
import Breadcrumbs from "@/components/marketing/Breadcrumbs";
import JsonLd from "@/components/marketing/JsonLd";
import { breadcrumbJsonLd } from "@/lib/jsonld";

export const metadata: Metadata = {
  title: "Accommodation Guide for Indian Students in Singapore | PathPort",
  description: "Where to live in Singapore as an Indian student — HDB rentals, hostels, student housing, typical monthly costs, and tips for finding a room near your college.",
  alternates: { canonical: "/resources/accommodation" },
};

const TYPES = [
  { type: "HDB room rental", cost: "SGD 600 – 1,000 / month", pros: "Most common, flexible lease terms, good transport links, feel of local life", cons: "Shared kitchen and bathroom, rules vary by landlord, no on-campus proximity" },
  { type: "Private hostel / student house", cost: "SGD 500 – 900 / month", pros: "Other students nearby, utilities typically included, some offer meals", cons: "More rules, limited privacy, quality varies significantly" },
  { type: "Serviced apartment", cost: "SGD 1,200 – 2,500 / month", pros: "Hotel-style amenities, fully furnished, utilities included, flexible stays", cons: "Significantly more expensive, intended for shorter stays" },
  { type: "Condo room rental", cost: "SGD 900 – 1,500 / month", pros: "Pool, gym, security, fully furnished", cons: "Higher cost, sometimes minimum lease 6–12 months" },
];

const AREAS = [
  { area: "Little India (Tekka / Mustafa area)", notes: "Large Indian community. Access to Indian food, groceries, temples, and remittance services. Convenient MRT (NE7/DT26). Popular first-choice for Indian students." },
  { area: "Geylang / Aljunied", notes: "Affordable rentals. Good MRT access. Mix of cultures. Generally safe for students aware of their surroundings." },
  { area: "Jurong East / Boon Lay", notes: "Western Singapore. Home to several private colleges. More affordable than central areas. Good MRT connectivity." },
  { area: "Woodlands / Sembawang", notes: "Northern Singapore. Quiet, affordable. Close to the Malaysia border. Less central but well-served by MRT." },
  { area: "Bugis / Beach Road", notes: "Central location. Higher cost but extremely convenient. Walking distance to Orchard and Marina Bay." },
];

export default function AccommodationPage() {
  return (
    <MarketingShell maxWidth="narrow">
      <JsonLd data={breadcrumbJsonLd([{ name: "Resources", url: "/resources" }, { name: "Accommodation", url: "/resources/accommodation" }])} />
      <Breadcrumbs trail={[{ name: "Resources", url: "/resources" }, { name: "Accommodation", url: "/resources/accommodation" }]} />

      <PageHero
        eyebrow="Accommodation"
        title="Where to live in Singapore."
        subtitle="Accommodation is typically your biggest monthly expense in Singapore. This guide covers your options, typical costs, and how to find a room that works for your budget and college location."
      />

      <section className="mb-10 p-5 rounded-2xl bg-gold-400/[0.06] border border-gold-400/20">
        <p className="text-white/75 font-body text-sm leading-relaxed"><strong className="text-white">Important:</strong> PathPort does not arrange accommodation. This guide is for planning purposes only. Verify all costs and conditions directly with landlords or housing providers before committing.</p>
      </section>

      <section className="mb-10">
        <h2 className="font-display text-2xl text-white mb-5">Accommodation types and costs</h2>
        <div className="space-y-3">
          {TYPES.map(t => (
            <div key={t.type} className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.07]">
              <div className="flex items-start justify-between gap-3 mb-2">
                <p className="font-body font-semibold text-white/90 text-sm">{t.type}</p>
                <span className="text-gold-400/80 font-body text-sm font-semibold flex-shrink-0">{t.cost}</span>
              </div>
              <p className="text-white/55 font-body text-xs leading-relaxed mb-1"><span className="text-white/35">Pros: </span>{t.pros}</p>
              <p className="text-white/55 font-body text-xs leading-relaxed"><span className="text-white/35">Cons: </span>{t.cons}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-10">
        <h2 className="font-display text-2xl text-white mb-5">Popular areas for Indian students</h2>
        <div className="space-y-3">
          {AREAS.map(a => (
            <div key={a.area} className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
              <p className="font-body font-semibold text-white/85 text-sm mb-1">{a.area}</p>
              <p className="text-white/50 font-body text-sm leading-relaxed">{a.notes}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-10">
        <h2 className="font-display text-2xl text-white mb-4">Tips for finding a room</h2>
        <div className="rounded-2xl bg-white/[0.03] border border-white/[0.07] overflow-hidden">
          {[
            "Search on PropertyGuru, 99.co, or Facebook Groups (e.g., 'Indian students Singapore housing').",
            "Always view the room (in person or via video call) before paying any deposit.",
            "Get your tenancy agreement in writing — even for month-to-month rentals.",
            "Utilities (electricity, water, WiFi) may or may not be included — confirm before signing.",
            "Proximity to an MRT station matters more than proximity to the college — Singapore's MRT is fast and reliable.",
            "Ask your college if they have a list of recommended housing providers or student-friendly landlords.",
            "Budget for a deposit of 1–2 months rent upfront plus first month's rent on move-in day.",
          ].map((tip, i) => (
            <div key={i} className={`flex items-start gap-3 p-4 ${i > 0 ? "border-t border-white/[0.05]" : ""}`}>
              <span className="text-gold-400 text-xs mt-0.5 flex-shrink-0">→</span>
              <p className="text-white/60 font-body text-sm leading-relaxed">{tip}</p>
            </div>
          ))}
        </div>
      </section>
    </MarketingShell>
  );
}
