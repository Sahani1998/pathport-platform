import type { Metadata } from "next";
import Link from "next/link";
import { FileText, Calendar, Download } from "lucide-react";
import MarketingShell from "@/components/marketing/MarketingShell";
import PageHero from "@/components/marketing/PageHero";
import Breadcrumbs from "@/components/marketing/Breadcrumbs";
import JsonLd from "@/components/marketing/JsonLd";
import { breadcrumbJsonLd } from "@/lib/jsonld";
import { getAllReports } from "@/lib/insights";

export const metadata: Metadata = {
  title: "PathPort Insights — Singapore Education Reports",
  description: "Research reports and data insights from PathPort — Singapore education trends, course demand, student market analysis, internship trends, and graduate outcomes.",
  alternates: { canonical: "/insights" },
  openGraph: { title: "PathPort Insights", description: "Singapore education research and market data for students, institutions, and partners." },
};

export default function InsightsPage() {
  const reports = getAllReports();

  return (
    <MarketingShell>
      <JsonLd data={breadcrumbJsonLd([{ name: "Insights", url: "/insights" }])} />
      <Breadcrumbs trail={[{ name: "Insights", url: "/insights" }]} />

      <PageHero
        eyebrow="PathPort Insights"
        title="Data and research on Singapore education."
        subtitle="PathPort publishes periodic reports on Singapore private college education — course demand, student flow trends, internship market data, and graduate outcomes. Research designed to be useful to students, institutions, and education policymakers."
      />

      {reports.length > 0 ? (
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
          {reports.map(report => (
            <Link key={report.slug} href={`/insights/${report.slug}`} className="group flex flex-col p-6 rounded-2xl bg-white/[0.04] border border-white/[0.08] hover:border-gold-400/30 hover:bg-gold-400/[0.03] transition-all">
              <div className="w-11 h-11 rounded-xl bg-gold-400/10 border border-gold-400/25 text-gold-400 flex items-center justify-center mb-4">
                <FileText className="w-5 h-5" />
              </div>
              <span className="text-gold-400/70 font-body text-xs mb-2">{report.category}</span>
              <h2 className="font-display text-xl text-white mb-2 group-hover:text-gold-300 transition-colors leading-snug">{report.title}</h2>
              <p className="text-white/50 font-body text-sm leading-relaxed flex-1 mb-4">{report.excerpt}</p>
              <div className="flex items-center justify-between text-white/25 font-body text-xs">
                <span className="flex items-center gap-1.5"><Calendar className="w-3 h-3" /> {report.publishedAt}</span>
                {report.hasPdf && <span className="flex items-center gap-1.5 text-gold-400/50"><Download className="w-3 h-3" /> PDF available</span>}
              </div>
            </Link>
          ))}
        </section>
      ) : (
        <section className="text-center py-20 mb-12">
          <div className="w-16 h-16 rounded-2xl bg-white/[0.04] border border-white/[0.08] text-white/25 flex items-center justify-center mx-auto mb-5">
            <FileText className="w-7 h-7" />
          </div>
          <p className="font-display text-2xl text-white mb-2">First report coming soon.</p>
          <p className="text-white/45 font-body text-sm max-w-md mx-auto">PathPort&apos;s first Insights report — on Indian student demand trends for Singapore private college programmes — will be published later in 2026.</p>
        </section>
      )}

      <section className="mb-12">
        <h2 className="font-display text-2xl text-white mb-5">Planned reports</h2>
        <div className="rounded-2xl bg-white/[0.03] border border-white/[0.07] overflow-hidden">
          {[
            { title: "Singapore Education Trends 2026", status: "In preparation", date: "Q3 2026" },
            { title: "Indian Student Demand Report — Singapore Diplomas", status: "In preparation", date: "Q3 2026" },
            { title: "Course Demand by Sector: Hospitality, IT, Business", status: "Planned", date: "Q4 2026" },
            { title: "Internship Market Report — Singapore Private College Graduates", status: "Planned", date: "Q4 2026" },
            { title: "Graduate Outcomes Survey 2026", status: "Planned", date: "Q1 2027" },
            { title: "Student Pass Processing Trends — India to Singapore", status: "Planned", date: "Q1 2027" },
          ].map((r, i) => (
            <div key={r.title} className={`flex flex-col md:flex-row gap-2 md:gap-6 p-4 ${i > 0 ? "border-t border-white/[0.05]" : ""}`}>
              <span className="text-white/70 font-body text-sm flex-1">{r.title}</span>
              <span className={`font-body text-xs flex-shrink-0 ${r.status === "In preparation" ? "text-gold-400/70" : "text-white/35"}`}>{r.status}</span>
              <span className="text-white/25 font-body text-xs flex-shrink-0 md:w-20 text-right">{r.date}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-6">
        <h3 className="font-display text-xl text-white mb-2">Request data or commission a report</h3>
        <p className="text-white/55 font-body text-sm mb-4">Institutions, researchers, and journalists with specific data needs should contact us. PathPort may be able to share aggregate, anonymised data relevant to Singapore private education.</p>
        <a href="mailto:pathportsg@gmail.com?subject=Insights%20data%20request" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/[0.05] border border-white/[0.10] text-white/70 font-body text-sm font-semibold hover:border-gold-400/30 hover:text-gold-300 transition-all">
          pathportsg@gmail.com →
        </a>
      </section>
    </MarketingShell>
  );
}
