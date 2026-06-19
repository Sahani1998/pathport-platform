import type { Metadata } from "next";
import Link from "next/link";
import { GraduationCap, Users, Building2, Handshake, MessageCircle, Search } from "lucide-react";
import MarketingShell from "@/components/marketing/MarketingShell";
import PageHero from "@/components/marketing/PageHero";
import Breadcrumbs from "@/components/marketing/Breadcrumbs";
import JsonLd from "@/components/marketing/JsonLd";
import { breadcrumbJsonLd, faqJsonLd } from "@/lib/jsonld";

export const metadata: Metadata = {
  title: "Help Center | PathPort",
  description: "PathPort Help Center — answers for students, parents, institutions, and partners. FAQ, guides, and direct support contact.",
  alternates: { canonical: "/help" },
  openGraph: { title: "PathPort Help Center", description: "Find answers for students, parents, institutions, and partners." },
};

const SECTIONS = [
  {
    icon: <GraduationCap className="w-5 h-5" />,
    title: "For Students",
    desc: "Application process, documents, Student Pass, dashboard, payments, and IPA tracking.",
    faqs: [
      { q: "How do I apply through PathPort?", a: "Create a PathPort account, browse courses, and submit an application to your chosen college. The college reviews your application and issues an offer letter if successful." },
      { q: "What documents do I need to upload?", a: "Passport copy, academic transcripts and mark sheets, and any English proficiency documents if required. Your college will tell you if anything additional is needed." },
      { q: "How long does the process take?", a: "From application to IPA typically takes 6–12 weeks. Offer letter usually within 3–7 business days; IPA processing by ICA takes 4–8 weeks after submission." },
      { q: "Can I track my IPA status on PathPort?", a: "Yes. Your dashboard shows your IPA status. PathPort notifies you when the status changes — you will also receive an email notification." },
    ],
  },
  {
    icon: <Users className="w-5 h-5" />,
    title: "For Parents",
    desc: "Understanding the process, fees, safety, and how to support your child from India.",
    faqs: [
      { q: "Is Singapore safe for Indian students?", a: "Yes. Singapore is consistently ranked among the world&apos;s safest cities. Crime is low, public transport is excellent, and the Indian community is large and welcoming." },
      { q: "How are fees paid?", a: "Fees are paid by bank transfer to the college&apos;s bank account. PathPort does not collect money. Payment proof is uploaded to PathPort for verification. There are no agent commissions or platform fees." },
      { q: "Can I contact my child&apos;s college through PathPort?", a: "Your child&apos;s application and communication is managed through their PathPort account. For parent-specific queries, contact PathPort support on WhatsApp." },
      { q: "What if my child needs to come home urgently?", a: "PathPort support can help you understand the process. Your child should inform their college, as extended absences may affect their Student Pass status." },
    ],
  },
  {
    icon: <Building2 className="w-5 h-5" />,
    title: "For Institutions",
    desc: "Listing courses, managing applications, uploading IPAs, and institution portal support.",
    faqs: [
      { q: "How do we list our college on PathPort?", a: "Email pathportsg@gmail.com with subject 'Institution enquiry'. PathPort will verify your CPE and EduTrust registration, then onboard your institution to the portal." },
      { q: "Who can access the institution portal?", a: "Authorised admissions and finance staff at your college, scoped to your institution&apos;s data only. PathPort enforces row-level data isolation." },
      { q: "How do we upload an IPA?", a: "Log into the institution portal, navigate to the student&apos;s application, and upload the IPA PDF in the IPA section. The student is notified immediately." },
      { q: "Can we set our own fees on PathPort?", a: "Yes. Your published tuition fees are set by your institution. PathPort does not modify fees. Fees shown on course pages must match the invoices issued to students." },
    ],
  },
  {
    icon: <Handshake className="w-5 h-5" />,
    title: "For Partners",
    desc: "Recruitment partner applications, employer participation, and partnership queries.",
    faqs: [
      { q: "How do we become a recruitment partner?", a: "Apply via the PathPort partner application form at /partner-with-us. PathPort evaluates partner applications for compliance with Singapore education regulations and ethical recruitment standards." },
      { q: "Do recruitment partners receive commission?", a: "PathPort does not facilitate commission payments from students. Partner arrangements are between PathPort and the partner institution — not student-facing." },
      { q: "Can employers participate in the 6+6 internship programme?", a: "Yes. Employers interested in hosting PathPort student interns should contact pathportsg@gmail.com with subject &apos;Employer internship inquiry&apos;." },
    ],
  },
];

const GENERAL_FAQS = [
  { question: "How is PathPort different from an education agent?", answer: "PathPort is a technology platform, not an agent. We charge no student-facing fees or commissions. Our role is to digitise and make transparent the application workflow between students and Singapore private colleges. We do not recommend specific colleges for commission or inflate fees." },
  { question: "Does PathPort submit the Student Pass / IPA to ICA?", answer: "No. IPA / Student Pass applications are submitted to ICA by the enrolled college through ICA&apos;s official institutional systems. PathPort tracks the submission status and notifies students of updates." },
  { question: "What if I am unhappy with PathPort's service?", answer: "Contact us via WhatsApp (+65 8377 6492) or email (pathportsg@gmail.com). For formal complaints, use our complaint resolution process described in the Trust Center." },
  { question: "Is my personal data safe on PathPort?", answer: "Yes. PathPort uses encrypted private storage, row-level database security, and PDPA-compliant data practices. Full details are in the Data Protection and Document Security pages of the Trust Center." },
];

export default function HelpPage() {
  const allFaqs = GENERAL_FAQS.map(f => ({ question: f.question, answer: f.answer }));

  return (
    <MarketingShell maxWidth="wide">
      <JsonLd data={[
        breadcrumbJsonLd([{ name: "Help Center", url: "/help" }]),
        faqJsonLd(allFaqs),
      ]} />
      <Breadcrumbs trail={[{ name: "Help Center", url: "/help" }]} />

      <PageHero
        eyebrow="Help Center"
        title="How can we help?"
        subtitle="Find answers for students, parents, institutions, and partners — or contact us directly on WhatsApp."
      />

      <div className="mb-8 p-4 rounded-2xl bg-white/[0.03] border border-white/[0.07] flex items-center gap-3">
        <Search className="w-4 h-4 text-white/30 flex-shrink-0" />
        <span className="text-white/30 font-body text-sm">Browse sections below or WhatsApp us for instant support → +65 8377 6492</span>
      </div>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
        {SECTIONS.map(section => (
          <div key={section.title} className="rounded-2xl bg-white/[0.03] border border-white/[0.07] overflow-hidden">
            <div className="flex items-center gap-3 p-5 border-b border-white/[0.06]">
              <div className="w-9 h-9 rounded-xl bg-gold-400/10 border border-gold-400/25 text-gold-400 flex items-center justify-center flex-shrink-0">
                {section.icon}
              </div>
              <div>
                <h2 className="font-display text-lg text-white">{section.title}</h2>
                <p className="text-white/40 font-body text-xs">{section.desc}</p>
              </div>
            </div>
            <div className="divide-y divide-white/[0.05]">
              {section.faqs.map(faq => (
                <details key={faq.q} className="group">
                  <summary className="flex items-center justify-between p-4 cursor-pointer text-white/75 font-body text-sm list-none hover:text-white transition-colors">
                    {faq.q}
                    <span className="text-gold-400/60 group-open:rotate-45 transition-transform flex-shrink-0 ml-3">+</span>
                  </summary>
                  <div className="px-4 pb-4">
                    <p className="text-white/50 font-body text-sm leading-relaxed">{faq.a}</p>
                  </div>
                </details>
              ))}
            </div>
          </div>
        ))}
      </section>

      <section className="mb-12">
        <h2 className="font-display text-2xl text-white mb-5">General questions</h2>
        <div className="space-y-3">
          {GENERAL_FAQS.map(faq => (
            <details key={faq.question} className="group rounded-2xl bg-white/[0.03] border border-white/[0.07] overflow-hidden">
              <summary className="flex items-center justify-between p-5 cursor-pointer text-white/85 font-body font-semibold text-sm list-none">
                {faq.question}
                <span className="text-gold-400 group-open:rotate-45 transition-transform flex-shrink-0 ml-3">+</span>
              </summary>
              <div className="px-5 pb-5">
                <p className="text-white/55 font-body text-sm leading-relaxed">{faq.answer}</p>
              </div>
            </details>
          ))}
        </div>
      </section>

      <section className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-6 text-center">
        <MessageCircle className="w-8 h-8 text-gold-400 mx-auto mb-3" />
        <p className="font-display text-xl text-white mb-2">Still need help?</p>
        <p className="text-white/55 font-body text-sm mb-5">A real person responds on WhatsApp within 4 business hours. Email responses within 1 business day.</p>
        <div className="flex flex-wrap gap-3 justify-center">
          <a href="https://wa.me/6583776492" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gold-400/10 border border-gold-400/30 text-gold-400 font-body text-sm font-semibold hover:bg-gold-400/20 transition-all">
            WhatsApp +65 8377 6492
          </a>
          <Link href="/contact" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/[0.05] border border-white/[0.10] text-white/70 font-body text-sm font-semibold hover:border-gold-400/30 hover:text-gold-300 transition-all">
            All contact options →
          </Link>
        </div>
      </section>
    </MarketingShell>
  );
}
