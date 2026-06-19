export interface Report {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  publishedAt: string;
  hasPdf: boolean;
  pdfUrl?: string;
  author: string;
}

const REPORTS: Report[] = [];

export function getAllReports(): Report[] {
  return REPORTS;
}

export function getReportBySlug(slug: string): Report | undefined {
  return REPORTS.find(r => r.slug === slug);
}
