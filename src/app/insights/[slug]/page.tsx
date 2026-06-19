import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Calendar, Download } from "lucide-react";
import MarketingShell from "@/components/marketing/MarketingShell";
import Breadcrumbs from "@/components/marketing/Breadcrumbs";
import JsonLd from "@/components/marketing/JsonLd";
import { breadcrumbJsonLd, reportJsonLd } from "@/lib/jsonld";
import { getAllReports, getReportBySlug } from "@/lib/insights";

interface Props {
  params: { slug: string };
}

export function generateStaticParams() {
  return getAllReports().map(r => ({ slug: r.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const report = getReportBySlug(params.slug);
  if (!report) return { title: "Report not found" };
  return {
    title: `${report.title} | PathPort Insights`,
    description: report.excerpt,
    alternates: { canonical: `/insights/${report.slug}` },
  };
}

export default function InsightReportPage({ params }: Props) {
  const report = getReportBySlug(params.slug);
  if (!report) notFound();

  return (
    <MarketingShell maxWidth="narrow">
      <JsonLd data={[
        breadcrumbJsonLd([{ name: "Insights", url: "/insights" }, { name: report.title, url: `/insights/${report.slug}` }]),
        reportJsonLd({ title: report.title, description: report.excerpt, slug: report.slug, publishedAt: report.publishedAt }),
      ]} />
      <Breadcrumbs trail={[{ name: "Insights", url: "/insights" }, { name: report.title, url: `/insights/${report.slug}` }]} />

      <article>
        <header className="mb-10">
          <span className="inline-block px-2.5 py-1 rounded-full bg-gold-400/10 border border-gold-400/25 text-gold-400 font-body text-xs font-semibold mb-4">{report.category}</span>
          <h1 className="font-display text-3xl md:text-4xl text-white mb-4 leading-tight">{report.title}</h1>
          <p className="text-white/55 font-body text-lg leading-relaxed mb-6">{report.excerpt}</p>
          <div className="flex flex-wrap items-center gap-4 text-white/35 font-body text-sm border-t border-white/[0.07] pt-4">
            <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" /> {report.publishedAt}</span>
            <span>By {report.author}</span>
            {report.hasPdf && report.pdfUrl && (
              <a href={report.pdfUrl} className="flex items-center gap-1.5 text-gold-400 hover:underline">
                <Download className="w-4 h-4" /> Download PDF
              </a>
            )}
          </div>
        </header>

        <div className="prose prose-invert prose-sm max-w-none mb-12 [&>p]:text-white/65 [&>p]:font-body [&>p]:leading-relaxed [&>p]:mb-4 [&>h2]:font-display [&>h2]:text-white [&>h2]:text-2xl [&>h2]:mt-8 [&>h2]:mb-4">
          <p>Report content is being prepared. Check back for the full publication.</p>
        </div>

        <footer className="border-t border-white/[0.07] pt-6">
          <Link href="/insights" className="flex items-center gap-2 text-white/50 hover:text-white/80 font-body text-sm transition-colors">
            <ArrowLeft className="w-4 h-4" /> All reports
          </Link>
        </footer>
      </article>
    </MarketingShell>
  );
}
