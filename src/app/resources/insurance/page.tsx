import type { Metadata } from "next";
import MarketingShell from "@/components/marketing/MarketingShell";
import PageHero from "@/components/marketing/PageHero";
import Breadcrumbs from "@/components/marketing/Breadcrumbs";
import JsonLd from "@/components/marketing/JsonLd";
import { breadcrumbJsonLd } from "@/lib/jsonld";

export const metadata: Metadata = {
  title: "Insurance for Indian Students in Singapore | PathPort",
  description: "What insurance you need as a Student Pass holder in Singapore — medical, personal accident, and travel insurance. What colleges require and what you should buy.",
  alternates: { canonical: "/resources/insurance" },
};

export default function InsurancePage() {
  return (
    <MarketingShell maxWidth="narrow">
      <JsonLd data={breadcrumbJsonLd([{ name: "Resources", url: "/resources" }, { name: "Insurance", url: "/resources/insurance" }])} />
      <Breadcrumbs trail={[{ name: "Resources", url: "/resources" }, { name: "Insurance", url: "/resources/insurance" }]} />

      <PageHero
        eyebrow="Insurance"
        title="Insurance you need in Singapore."
        subtitle="Singapore healthcare is world-class — and expensive for uninsured visitors. As a Student Pass holder, some insurance is compulsory. This guide explains what you need and what it typically costs."
      />

      <section className="mb-10 p-5 rounded-2xl bg-gold-400/[0.06] border border-gold-400/20">
        <p className="text-white/75 font-body text-sm leading-relaxed"><strong className="text-white">EduTrust requirement:</strong> CPE requires all EduTrust-certified colleges to ensure students have personal accident and medical insurance before enrolment. Your college may arrange this on your behalf (and include it in your invoice) or require you to arrange it yourself. Confirm with your college before arrival.</p>
      </section>

      <section className="mb-10">
        <h2 className="font-display text-2xl text-white mb-5">Types of insurance</h2>
        <div className="space-y-4">
          {[
            {
              type: "Personal accident insurance",
              required: "Compulsory (EduTrust)",
              cost: "SGD 50 – 150 / year",
              covers: "Accidental death, permanent disability, medical expenses from accidents.",
              notes: "Most colleges arrange this and include it in your enrolment fees. Confirm with your college.",
            },
            {
              type: "Medical / hospitalisation insurance",
              required: "Highly recommended",
              cost: "SGD 150 – 400 / year",
              covers: "Hospitalisation, surgery, outpatient treatment, emergency care.",
              notes: "Singapore public hospital treatment as a non-resident is very expensive without coverage. A single night in a ward can cost SGD 300–700+.",
            },
            {
              type: "Travel insurance (to and from Singapore)",
              required: "Strongly recommended",
              cost: "SGD 30 – 80 / trip",
              covers: "Flight delays, lost baggage, trip cancellation, emergency medical evacuation.",
              notes: "Buy before each trip home. Many Indian students use HDFC Ergo, Bajaj Allianz, or international plans.",
            },
          ].map(item => (
            <div key={item.type} className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.07]">
              <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
                <p className="font-body font-semibold text-white/90 text-sm">{item.type}</p>
                <div className="flex gap-2">
                  <span className={`px-2 py-0.5 rounded-full font-body text-[10px] font-semibold ${item.required === "Compulsory (EduTrust)" ? "bg-gold-400/10 text-gold-400 border border-gold-400/25" : "bg-white/[0.06] text-white/50 border border-white/[0.10]"}`}>{item.required}</span>
                  <span className="text-white/40 font-body text-xs">{item.cost}</span>
                </div>
              </div>
              <p className="text-white/55 font-body text-sm leading-relaxed mb-2"><span className="text-white/30">Covers: </span>{item.covers}</p>
              <p className="text-white/40 font-body text-xs leading-relaxed">{item.notes}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-10">
        <h2 className="font-display text-2xl text-white mb-4">Healthcare in Singapore</h2>
        <p className="text-white/60 font-body text-sm leading-relaxed mb-4">Singapore has an excellent public healthcare system. As a Student Pass holder, you can access:</p>
        <div className="rounded-2xl bg-white/[0.03] border border-white/[0.07] overflow-hidden">
          {[
            { service: "GP clinics (general practitioner)", cost: "SGD 20 – 60 per consultation", notes: "For minor illnesses, prescriptions, medical certificates" },
            { service: "Polyclinics (public)", cost: "SGD 14 – 60 per visit", notes: "Government-subsidised clinics across Singapore — good value for non-emergency care" },
            { service: "Restructured hospitals (public)", cost: "SGD 50 – 700+ per day", notes: "Tan Tock Seng, National University Hospital, Singapore General Hospital — world-class care" },
            { service: "Private hospitals", cost: "SGD 500 – 5,000+ per day", notes: "Mount Elizabeth, Gleneagles, Raffles Hospital — international standard, significantly more expensive" },
          ].map((row, i) => (
            <div key={row.service} className={`p-4 ${i > 0 ? "border-t border-white/[0.05]" : ""}`}>
              <div className="flex flex-wrap gap-3 justify-between mb-1">
                <span className="text-white/75 font-body text-sm font-semibold">{row.service}</span>
                <span className="text-gold-400/70 font-body text-sm">{row.cost}</span>
              </div>
              <p className="text-white/40 font-body text-xs">{row.notes}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-5">
        <p className="font-body font-semibold text-white/85 text-sm mb-2">Confirm insurance with your college before arrival</p>
        <p className="text-white/55 font-body text-sm leading-relaxed">Ask your college admissions team which insurance is included in your enrolment fees and which you must arrange separately. PathPort can help you direct this question to your college via the application dashboard.</p>
      </section>
    </MarketingShell>
  );
}
