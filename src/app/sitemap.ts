import type { MetadataRoute } from "next";
import { createAdminClient } from "@/lib/supabase/admin-client";

export const dynamic = "force-dynamic";

const BASE_URL = "https://pathport.in";

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
    { url: `${BASE_URL}/partners/institutions`,        lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE_URL}/partners/recruitment-partners`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE_URL}/partners/employers`,            lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
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
