import type { Metadata } from "next";
import { Building2, CheckCircle, AlertTriangle } from "lucide-react";
import MarketingShell from "@/components/marketing/MarketingShell";
import PageHero from "@/components/marketing/PageHero";
import Breadcrumbs from "@/components/marketing/Breadcrumbs";
import JsonLd from "@/components/marketing/JsonLd";
import { breadcrumbJsonLd } from "@/lib/jsonld";

export const metadata: Metadata = {
  title: "Institution Verification | PathPort Trust Center",
  description: "How PathPort verifies, onboards, and monitors every Singapore private college listed on the platform. EduTrust and CPE registration requirements explained.",
  alternates: { canonical: "/trust/institution-verification" },
};

const CRITERIA = [
  { check: "CPE registration", detail: "Every institution must be registered with the Committee for Private Education (CPE) under Singapore's EduTrust certification scheme. PathPort verifies CPE registration before listing." },
  { check: "Student Pass eligibility", detail: "The institution must be eligible to submit Student Pass / IPA applications to ICA on behalf of their enrolled students. PathPort confirms this with each institution before listing." },
  { check: "Diploma programme validity", detail: "Courses listed on PathPort must lead to a recognised diploma, advanced diploma, higher diploma, or specialist diploma. Short certificate programmes are not listed." },
  { check: "Fee schedule accuracy", detail: "Institutions must provide a verified fee schedule. PathPort cross-references fees shown on course pages against the institution's official invoices to ensure accuracy." },
  { check: "Institutional contact verification", detail: "PathPort verifies a named admissions contact at each institution before onboarding. Anonymous institution accounts are not permitted." },
  { check: "Signed institutional agreement", detail: "Each institution signs a PathPort Platform Agreement before gaining access to the institution portal. The agreement defines responsibilities, timelines, and conduct standards." },
];

const ONGOING = [
  "Application response times are monitored. Institutions not responding within 5 business days of an application are flagged for review.",
  "Offer letter and IPA upload timelines are tracked. Systematic delays result in a formal review process.",
  "Student complaints naming a specific institution are logged and reviewed quarterly.",
  "CPE registration status is checked annually. Any lapse in CPE registration results in suspension from PathPort pending resolution.",
  "Institutions that request PathPort to misrepresent fees, timelines, or IPA status are removed from the platform.",
];

export default function InstitutionVerificationPage() {
  return (
    <MarketingShell>
      <JsonLd data={breadcrumbJsonLd([{ name: "Trust Center", url: "/trust" }, { name: "Institution Verification", url: "/trust/institution-verification" }])} />
      <Breadcrumbs trail={[{ name: "Trust Center", url: "/trust" }, { name: "Institution Verification", url: "/trust/institution-verification" }]} />

      <PageHero
        eyebrow="Institution Verification"
        title="Every college on PathPort is verified."
        subtitle="PathPort does not list every Singapore private college — only those that meet our registration, eligibility, and conduct criteria. Here is what we check and how we monitor ongoing compliance."
      />

      <section className="mb-10 p-5 rounded-2xl bg-white/[0.03] border border-white/[0.07] flex items-start gap-3">
        <Building2 className="w-5 h-5 text-gold-400 flex-shrink-0 mt-0.5" />
        <p className="text-white/65 font-body text-sm leading-relaxed">
          All PathPort-listed institutions are registered private education institutions (PEIs) operating under Singapore&apos;s CPE EduTrust framework. EduTrust is administered by the Committee for Private Education, a council of SkillsFuture Singapore. More at <span className="text-gold-400">cpe.gov.sg</span>.
        </p>
      </section>

      <section className="mb-12">
        <h2 className="font-display text-2xl text-white mb-5 flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-gold-400" /> Onboarding criteria
        </h2>
        <div className="space-y-3">
          {CRITERIA.map(c => (
            <div key={c.check} className="flex items-start gap-4 p-5 rounded-2xl bg-white/[0.03] border border-white/[0.07]">
              <CheckCircle className="w-4 h-4 text-gold-400 flex-shrink-0 mt-1" />
              <div>
                <p className="font-body font-semibold text-white/90 text-sm mb-1">{c.check}</p>
                <p className="text-white/55 font-body text-sm leading-relaxed">{c.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-12">
        <h2 className="font-display text-2xl text-white mb-5 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-gold-400" /> Ongoing monitoring
        </h2>
        <div className="rounded-2xl bg-white/[0.03] border border-white/[0.07] overflow-hidden">
          {ONGOING.map((item, i) => (
            <div key={i} className={`flex items-start gap-3 p-4 ${i > 0 ? "border-t border-white/[0.05]" : ""}`}>
              <span className="text-gold-400 font-body text-xs font-bold mt-0.5 flex-shrink-0">·</span>
              <p className="text-white/60 font-body text-sm leading-relaxed">{item}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-6">
        <h3 className="font-display text-xl text-white mb-2">Report a concern about a listed institution</h3>
        <p className="text-white/55 font-body text-sm mb-4">If you have information suggesting a PathPort-listed institution is operating improperly, contact us. All reports are reviewed confidentially.</p>
        <a href="mailto:pathportsg@gmail.com?subject=Institution%20concern" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.05] border border-white/[0.10] text-white/70 font-body text-sm font-semibold hover:border-gold-400/30 hover:text-gold-300 transition-all">
          pathportsg@gmail.com →
        </a>
      </section>
    </MarketingShell>
  );
}
