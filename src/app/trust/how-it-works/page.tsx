import type { Metadata } from "next";
import MarketingShell from "@/components/marketing/MarketingShell";
import PageHero from "@/components/marketing/PageHero";
import Breadcrumbs from "@/components/marketing/Breadcrumbs";
import JsonLd from "@/components/marketing/JsonLd";
import { breadcrumbJsonLd } from "@/lib/jsonld";

export const metadata: Metadata = {
  title: "How PathPort Works | Trust Center",
  description: "A step-by-step walkthrough of the PathPort process — from searching for courses in Singapore to arriving and beginning your diploma.",
  alternates: { canonical: "/trust/how-it-works" },
  openGraph: { title: "How PathPort Works", description: "Every step explained — search, apply, pay, receive IPA, and arrive in Singapore." },
};

const STEPS = [
  {
    n: "01",
    title: "Browse and compare courses",
    role: "Student",
    body: "Use the PathPort course directory to compare Singapore private college diplomas by subject, duration, fees in INR and SGD, and internship structure. All fee information shown is the actual tuition fee — no agent markup, no hidden commission.",
  },
  {
    n: "02",
    title: "Submit your application",
    role: "Student",
    body: "Complete the PathPort application form with your personal details, educational background, and passport information. Upload your documents — transcripts, mark sheets, and passport copy — directly into your secure document vault. PathPort routes your application to the college's admissions team.",
  },
  {
    n: "03",
    title: "College reviews and makes an offer",
    role: "College",
    body: "The college reviews your application through their PathPort institution portal. If they decide to proceed, they issue a conditional offer letter. PathPort notifies you immediately and makes the offer letter available in your dashboard for download.",
  },
  {
    n: "04",
    title: "Accept the offer and pay the first invoice",
    role: "Student",
    body: "Review your offer letter and accept it through PathPort. The college then raises your first tuition invoice via PathPort. You pay by bank transfer and upload your payment proof. PathPort verifies the proof and notifies the college to confirm your seat.",
  },
  {
    n: "05",
    title: "College submits IPA / Student Pass to ICA",
    role: "College",
    body: "Once your payment is confirmed, your enrolled college submits your Student Pass (IPA) application to ICA Singapore through their official ICA systems. PathPort does not submit to ICA — only accredited institutions can do this. PathPort tracks the submission status and notifies you of updates.",
  },
  {
    n: "06",
    title: "IPA issued — prepare to travel",
    role: "Student",
    body: "When ICA issues your IPA (In-Principle Approval), the college uploads it to your PathPort dashboard. PathPort notifies you by email and in-app. You can now apply for your student visa at your nearest Singapore embassy or submit your Singapore Arrival Card (SG Arrival Card) online before departure.",
  },
  {
    n: "07",
    title: "Arrive in Singapore",
    role: "Student",
    body: "Present your IPA at Singapore immigration. Your college will complete your Student Pass enrolment once you arrive. PathPort's arrival services section includes guidance on pre-departure preparation, accommodation options, banking, insurance, and your first week in Singapore.",
  },
  {
    n: "08",
    title: "Begin your diploma and internship",
    role: "Student",
    body: "Your 6+6 programme combines six months of coursework with six months of structured internship. PathPort remains your support channel for document requests, invoice management, and any queries during your studies.",
  },
];

export default function HowItWorksPage() {
  return (
    <MarketingShell>
      <JsonLd data={breadcrumbJsonLd([{ name: "Trust Center", url: "/trust" }, { name: "How PathPort Works", url: "/trust/how-it-works" }])} />
      <Breadcrumbs trail={[{ name: "Trust Center", url: "/trust" }, { name: "How PathPort Works", url: "/trust/how-it-works" }]} />

      <PageHero
        eyebrow="How PathPort Works"
        title="Every step, explained clearly."
        subtitle="From your first search to your first day of class in Singapore — here is exactly what PathPort does, what the college does, and what you are responsible for."
      />

      <div className="relative mb-16">
        <div aria-hidden className="absolute left-[19px] top-2 bottom-2 w-px bg-gradient-to-b from-gold-400/40 via-white/10 to-transparent" />
        <div className="space-y-6">
          {STEPS.map(s => (
            <div key={s.n} className="relative pl-14">
              <div className="absolute left-0 top-1 w-10 h-10 rounded-full bg-navy-900 border-2 border-gold-400/40 flex items-center justify-center">
                <span className="text-gold-400 font-body text-xs font-bold">{s.n}</span>
              </div>
              <div className="flex items-center gap-2 mb-1.5">
                <h2 className="font-display text-xl text-white leading-snug">{s.title}</h2>
                <span className="px-2 py-0.5 rounded-full bg-white/[0.06] border border-white/[0.10] text-white/40 font-body text-[10px] uppercase tracking-widest">{s.role}</span>
              </div>
              <p className="text-white/55 font-body text-base leading-relaxed">{s.body}</p>
            </div>
          ))}
        </div>
      </div>

      <section className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-6">
        <h3 className="font-display text-xl text-white mb-4">What PathPort does not do</h3>
        <ul className="space-y-2.5 text-white/60 font-body text-sm leading-relaxed">
          <li>• PathPort does not submit Student Pass or IPA applications to ICA. Your enrolled college does this.</li>
          <li>• PathPort does not guarantee admission, visa approval, or employment outcomes.</li>
          <li>• PathPort does not hold or process tuition fee payments — payments go directly to the college via bank transfer.</li>
          <li>• PathPort does not add commission or markup to published course fees.</li>
          <li>• PathPort does not share your documents with any party other than your enrolled college and required regulatory bodies.</li>
        </ul>
      </section>
    </MarketingShell>
  );
}
