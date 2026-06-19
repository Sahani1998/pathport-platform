import type { MetadataRoute } from "next";
import { createAdminClient } from "@/lib/supabase/admin-client";

export const dynamic = "force-dynamic";

const BASE_URL = "https://pathport.sg";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const adminDb = createAdminClient();

  const [{ data: colleges }, { data: courses }] = await Promise.all([
    adminDb
      .from("colleges")
      .select("slug, created_at")
      .eq("is_published", true)
      .eq("is_active",    true),
    adminDb
      .from("courses")
      .select("slug, created_at")
      .eq("is_published", true)
      .neq("status",      "draft"),
  ]);

  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL,                  lastModified: new Date(), changeFrequency: "weekly",  priority: 1.0 },
    { url: `${BASE_URL}/colleges`,    lastModified: new Date(), changeFrequency: "daily",   priority: 0.9 },
    { url: `${BASE_URL}/courses`,     lastModified: new Date(), changeFrequency: "daily",   priority: 0.9 },
    { url: `${BASE_URL}/students`,    lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/study-destination`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
    // Company
    { url: `${BASE_URL}/about`,       lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/our-story`,   lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE_URL}/mission`,     lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE_URL}/vision`,      lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE_URL}/careers`,     lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE_URL}/press`,       lastModified: new Date(), changeFrequency: "monthly", priority: 0.4 },
    { url: `${BASE_URL}/contact`,     lastModified: new Date(), changeFrequency: "yearly",  priority: 0.6 },
    // Trust Center
    { url: `${BASE_URL}/trust`,                       lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/trust/how-it-works`,          lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/trust/student-protection`,    lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE_URL}/trust/document-security`,     lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE_URL}/trust/data-protection`,       lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE_URL}/trust/institution-verification`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE_URL}/trust/fee-transparency`,      lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/trust/payment-verification`,  lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE_URL}/trust/refund-handling`,       lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE_URL}/trust/complaint-resolution`,  lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE_URL}/trust/platform-standards`,    lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    // Legal Center
    { url: `${BASE_URL}/legal`,                    lastModified: new Date(), changeFrequency: "yearly",  priority: 0.5 },
    { url: `${BASE_URL}/privacy`,                  lastModified: new Date(), changeFrequency: "yearly",  priority: 0.4 },
    { url: `${BASE_URL}/terms`,                    lastModified: new Date(), changeFrequency: "yearly",  priority: 0.4 },
    { url: `${BASE_URL}/legal/cookies`,            lastModified: new Date(), changeFrequency: "yearly",  priority: 0.3 },
    { url: `${BASE_URL}/legal/data-retention`,     lastModified: new Date(), changeFrequency: "yearly",  priority: 0.3 },
    { url: `${BASE_URL}/legal/acceptable-use`,     lastModified: new Date(), changeFrequency: "yearly",  priority: 0.3 },
    { url: `${BASE_URL}/legal/student-rights`,     lastModified: new Date(), changeFrequency: "yearly",  priority: 0.4 },
    // Resources
    { url: `${BASE_URL}/resources`,                        lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE_URL}/resources/study-in-singapore`,     lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE_URL}/resources/student-pass-ipa`,       lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE_URL}/resources/accommodation`,          lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/resources/banking`,                lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/resources/insurance`,              lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/resources/part-time-work`,         lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/resources/internships`,            lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE_URL}/resources/careers`,                lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/resources/student-life`,           lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/resources/arrival-preparation`,    lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    // Content
    { url: `${BASE_URL}/blog`,             lastModified: new Date(), changeFrequency: "weekly",  priority: 0.8 },
    { url: `${BASE_URL}/insights`,         lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/success-stories`,  lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/help`,             lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    // Partners
    { url: `${BASE_URL}/partners/institutions`,          lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE_URL}/partners/recruitment-partners`,  lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE_URL}/partners/employers`,             lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
  ];

  const collegePages: MetadataRoute.Sitemap = (colleges ?? []).map(c => ({
    url:             `${BASE_URL}/colleges/${c.slug}`,
    lastModified:    new Date(c.created_at),
    changeFrequency: "weekly",
    priority:        0.8,
  }));

  const coursePages: MetadataRoute.Sitemap = (courses ?? []).map(c => ({
    url:             `${BASE_URL}/courses/${c.slug}`,
    lastModified:    new Date(c.created_at),
    changeFrequency: "weekly",
    priority:        0.8,
  }));

  return [...staticPages, ...collegePages, ...coursePages];
}
