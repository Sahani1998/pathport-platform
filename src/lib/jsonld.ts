// JSON-LD structured data generators for SEO authority.
// Used by marketing pages, blog posts, FAQ sections, and breadcrumbs.

const SITE_URL = "https://pathport.sg";
const SITE_NAME = "PathPort";

export const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: SITE_NAME,
  url: SITE_URL,
  logo: `${SITE_URL}/logo.png`,
  description: "India's dedicated platform for Singapore private college diploma, advanced diploma, higher diploma, and specialist diploma programmes.",
  contactPoint: {
    "@type": "ContactPoint",
    telephone: "+65-8377-6492",
    contactType: "customer service",
    email: "pathportsg@gmail.com",
    areaServed: ["IN", "SG"],
    availableLanguage: ["English", "Hindi"],
  },
  address: {
    "@type": "PostalAddress",
    addressCountry: "SG",
  },
  sameAs: [],
};

export const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: SITE_NAME,
  url: SITE_URL,
  potentialAction: {
    "@type": "SearchAction",
    target: `${SITE_URL}/courses?q={search_term_string}`,
    "query-input": "required name=search_term_string",
  },
};

export interface BreadcrumbItem {
  name: string;
  url:  string;
}

export function breadcrumbJsonLd(items: BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: item.url.startsWith("http") ? item.url : `${SITE_URL}${item.url}`,
    })),
  };
}

export interface ArticleSchemaInput {
  title:        string;
  description:  string;
  slug:         string;
  publishedAt:  string;
  updatedAt?:   string;
  authorName?:  string;
  imageUrl?:    string;
  section?:     string;
}

export function articleJsonLd(a: ArticleSchemaInput) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: a.title,
    description: a.description,
    image: a.imageUrl ? [a.imageUrl] : undefined,
    datePublished: a.publishedAt,
    dateModified: a.updatedAt ?? a.publishedAt,
    author: {
      "@type": "Person",
      name: a.authorName ?? "PathPort Editorial",
    },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      logo: { "@type": "ImageObject", url: `${SITE_URL}/logo.png` },
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": `${SITE_URL}/blog/${a.slug}` },
    articleSection: a.section,
  };
}

export interface FAQItem {
  question: string;
  answer:   string;
}

export function faqJsonLd(items: FAQItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map(q => ({
      "@type": "Question",
      name: q.question,
      acceptedAnswer: { "@type": "Answer", text: q.answer },
    })),
  };
}

export function reportJsonLd(r: { title: string; description: string; slug: string; publishedAt: string; imageUrl?: string }) {
  return {
    "@context": "https://schema.org",
    "@type": "Report",
    name: r.title,
    description: r.description,
    datePublished: r.publishedAt,
    image: r.imageUrl,
    url: `${SITE_URL}/insights/${r.slug}`,
    publisher: { "@type": "Organization", name: SITE_NAME },
  };
}
