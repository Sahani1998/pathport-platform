// JSON-LD structured data generators for SEO authority.
// Used by marketing pages, blog posts, FAQ sections, and breadcrumbs.

import { CONTACT_DEFAULTS, type SiteSettings } from "@/lib/site-settings";

const SITE_URL = "https://pathport.sg";
const SITE_NAME = "PathPort";

interface OrganizationJsonLdInput {
  whatsapp_display?: string;
  contact_email?: string;
  social_instagram?: string;
  social_facebook?: string;
  social_linkedin?: string;
}

/**
 * Build the Organization JSON-LD object. Pass current site_settings; falls
 * back to CONTACT_DEFAULTS for any missing field. The telephone field uses
 * the dashed display format (Google prefers E.164 but tolerates this form).
 */
export function buildOrganizationJsonLd(input: OrganizationJsonLdInput | SiteSettings = {}) {
  const display = input.whatsapp_display ?? CONTACT_DEFAULTS.whatsapp_display;
  const email   = input.contact_email    ?? CONTACT_DEFAULTS.contact_email;
  const sameAs  = [
    input.social_instagram,
    input.social_facebook,
    input.social_linkedin,
  ].filter((s): s is string => typeof s === "string" && s.length > 0);

  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/logo.png`,
    description: "India's dedicated platform for Singapore private college diploma, advanced diploma, higher diploma, and specialist diploma programmes.",
    contactPoint: {
      "@type": "ContactPoint",
      // Normalise "+65 8377 6492" → "+65-8377-6492" for schema.org telephone.
      telephone: display.replace(/\s+/g, "-"),
      contactType: "customer service",
      email,
      areaServed: ["IN", "SG"],
      availableLanguage: ["English", "Hindi"],
    },
    address: {
      "@type": "PostalAddress",
      addressCountry: "SG",
    },
    sameAs,
  };
}

/**
 * Default Organization JSON-LD using CONTACT_DEFAULTS. Retained as an export
 * for any caller that doesn't have settings to pass in — but new callers
 * should prefer buildOrganizationJsonLd(settings) so admin edits propagate.
 */
export const organizationJsonLd = buildOrganizationJsonLd();

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
