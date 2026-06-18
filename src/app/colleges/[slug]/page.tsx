// Public college detail page — no auth required.
// Shows college branding header, about section, programmes list, gallery, and apply CTA.

import type { Metadata } from "next";
import { notFound }      from "next/navigation";
import Link              from "next/link";
import { createAdminClient } from "@/lib/supabase/admin-client";
import Image             from "next/image";
import {
  ArrowLeft, Globe, Building2, BookOpen, Clock,
  ChevronRight, DollarSign, Calendar, CheckCircle2,
} from "lucide-react";
import type { InstitutionMedia } from "@/types/institution-media";
import { MEDIA_CATEGORIES } from "@/types/institution-media";

export const revalidate = 300;

function fmtSGD(n: number) {
  return `S$${n.toLocaleString("en-SG")}`;
}

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const adminDb  = createAdminClient();
  const { data } = await adminDb
    .from("colleges")
    .select("name, description, short_description, tagline, cover_image_url, logo_url")
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();

  if (!data) return { title: "College Not Found | PathPort" };

  const desc = data.short_description ?? data.description ??
    `Study at ${data.name} — Singapore diploma and advanced diploma programmes. Apply through PathPort.`;

  return {
    title:       `${data.name} | PathPort Singapore`,
    description: desc,
    alternates:  { canonical: `/colleges/${slug}` },
    openGraph: {
      title:       `${data.name} | PathPort`,
      description: desc,
      type:        "website",
      images:      data.cover_image_url ? [{ url: data.cover_image_url, width: 1200, height: 675 }] : undefined,
    },
  };
}

export default async function CollegeDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const adminDb  = createAdminClient();

  const { data: college } = await adminDb
    .from("colleges")
    .select(`
      id, name, slug, description, website, city, country, logo_url,
      cover_image_url, tagline, brand_colour_primary, brand_colour_secondary,
      short_description, mission, vision, introduction
    `)
    .eq("slug",         slug)
    .eq("is_published", true)
    .eq("is_active",    true)
    .maybeSingle();

  if (!college) notFound();

  const [{ data: filteredCourses }, { data: galleryRows }] = await Promise.all([
    adminDb
      .from("courses")
      .select("id, title, slug, category, level, duration_months, tuition_fee, status, intake_date, seats_total, seats_filled, internship_available")
      .eq("college_id",   college.id)
      .eq("is_published", true)
      .neq("status",      "draft")
      .order("status")
      .order("title"),

    adminDb
      .from("institution_media")
      .select("id, public_url, alt_text, title, caption, category")
      .eq("college_id", college.id)
      .eq("media_type",  "gallery_image")
      .eq("status",      "published")
      .order("sort_order")
      .order("published_at", { ascending: false })
      .limit(24),
  ]);

  const courseList = filteredCourses ?? [];
  const gallery    = (galleryRows ?? []) as Pick<InstitutionMedia, "id" | "public_url" | "alt_text" | "title" | "caption" | "category">[];

  // Group gallery by category
  const galleryByCategory = MEDIA_CATEGORIES.reduce<Record<string, typeof gallery>>((acc, cat) => {
    acc[cat.value] = gallery.filter(g => g.category === cat.value);
    return acc;
  }, { other: gallery.filter(g => !g.category) });
  const hasGallery = gallery.length > 0;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type":    "EducationalOrganization",
    name:       college.name,
    url:        college.website ?? `https://pathport.in/colleges/${slug}`,
    logo:       college.logo_url ?? undefined,
    image:      college.cover_image_url ?? undefined,
    address: {
      "@type":           "PostalAddress",
      addressLocality:   college.city,
      addressCountry:    college.country,
    },
    description: college.description ?? undefined,
    hasOfferCatalog: courseList.length > 0 ? {
      "@type": "OfferCatalog",
      name:    `${college.name} Programmes`,
      itemListElement: courseList.map((c, i) => ({
        "@type":    "ListItem",
        position:   i + 1,
        name:       c.title,
        url:        `https://pathport.in/courses/${c.slug}`,
      })),
    } : undefined,
  };

  const primaryColour = college.brand_colour_primary ?? null;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <main className="min-h-screen py-24 px-5 md:px-10">
        <div className="max-w-5xl mx-auto">

          {/* Back */}
          <Link
            href="/colleges"
            className="inline-flex items-center gap-2 text-white/35 hover:text-white/65 font-body text-sm transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" /> All Colleges
          </Link>

          {/* Cover image hero */}
          {college.cover_image_url && (
            <div className="relative w-full h-48 md:h-64 rounded-2xl overflow-hidden mb-6 border border-white/[0.08]">
              <Image
                src={college.cover_image_url}
                alt={`${college.name} campus`}
                fill
                className="object-cover"
                unoptimized
                priority
              />
              {/* Gradient overlay for text legibility */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
            </div>
          )}

          {/* College header */}
          <div
            className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-6 mb-6"
            style={primaryColour ? { borderColor: `${primaryColour}22` } : undefined}
          >
            <div className="flex items-start gap-5">
              <div
                className="w-16 h-16 rounded-2xl border border-white/[0.08] flex items-center justify-center flex-shrink-0 overflow-hidden"
                style={{ background: primaryColour ? `linear-gradient(135deg, ${primaryColour}33, ${primaryColour}11)` : undefined }}
              >
                {college.logo_url ? (
                  <Image
                    src={college.logo_url}
                    alt={`${college.name} logo`}
                    width={64} height={64}
                    className="object-contain w-full h-full"
                    unoptimized
                  />
                ) : (
                  <span
                    className="font-display font-bold text-xl leading-none"
                    style={{ color: primaryColour ?? undefined }}
                  >
                    {college.name.slice(0, 2).toUpperCase()}
                  </span>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <h1 className="font-display text-3xl text-white mb-1 leading-tight">{college.name}</h1>
                {college.tagline && (
                  <p className="font-body text-sm text-white/55 italic mb-2">{college.tagline}</p>
                )}
                <div className="flex flex-wrap items-center gap-3 mb-3">
                  <span className="flex items-center gap-1.5 text-white/40 font-body text-xs">
                    <Building2 className="w-3.5 h-3.5" /> {college.city}, {college.country}
                  </span>
                  <span className="flex items-center gap-1.5 text-emerald-400/80 font-body text-xs font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5" /> EduTrust Certified
                  </span>
                </div>
                {(college.short_description ?? college.description) && (
                  <p className="text-white/55 font-body text-sm leading-relaxed">
                    {college.short_description ?? college.description}
                  </p>
                )}
                {college.website && (
                  <a
                    href={college.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 mt-3 text-pathBlue-400 hover:text-pathBlue-300 font-body text-xs transition-colors"
                  >
                    <Globe className="w-3.5 h-3.5" /> Official Website
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* About — introduction, mission, vision */}
          {(college.introduction || college.mission || college.vision) && (
            <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-6 mb-6 space-y-5">
              <h2 className="font-display text-xl text-white">About {college.name}</h2>

              {college.introduction && (
                <p className="text-white/60 font-body text-sm leading-relaxed">{college.introduction}</p>
              )}

              {(college.mission || college.vision) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  {college.mission && (
                    <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                      <p className="text-white/30 font-body text-[10px] uppercase tracking-wider mb-1.5">Our Mission</p>
                      <p className="text-white/65 font-body text-sm leading-relaxed">{college.mission}</p>
                    </div>
                  )}
                  {college.vision && (
                    <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                      <p className="text-white/30 font-body text-[10px] uppercase tracking-wider mb-1.5">Our Vision</p>
                      <p className="text-white/65 font-body text-sm leading-relaxed">{college.vision}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Courses */}
          <div className="mb-8">
            <h2 className="font-display text-2xl text-white mb-5">
              Programmes at {college.name}
              <span className="ml-3 text-white/30 font-body text-base font-normal">
                {courseList.length} programme{courseList.length !== 1 ? "s" : ""}
              </span>
            </h2>

            {courseList.length === 0 ? (
              <div className="flex flex-col items-center py-16 text-white/25">
                <BookOpen className="w-10 h-10 mb-3" />
                <p className="font-body text-sm">No programmes listed yet for this college</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {courseList.map(course => {
                  const seatsLeft = course.seats_total - course.seats_filled;
                  return (
                    <Link
                      key={course.id}
                      href={`/courses/${course.slug}`}
                      className="group block bg-white/[0.04] border border-white/[0.08] rounded-2xl p-5 hover:border-gold-400/30 hover:bg-gold-400/[0.03] transition-all"
                    >
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div>
                          <span className="inline-block px-2.5 py-0.5 rounded-lg bg-pathBlue-500/10 border border-pathBlue-500/20 text-pathBlue-400 font-body text-[11px] font-semibold mb-2">
                            {course.category}
                          </span>
                          <h3 className="font-body font-semibold text-white/85 text-sm leading-snug group-hover:text-white transition-colors">
                            {course.title}
                          </h3>
                        </div>
                        <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-gold-400/60 flex-shrink-0 mt-1 transition-colors" />
                      </div>

                      <div className="flex flex-wrap gap-3 text-white/35 font-body text-xs">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {course.duration_months} months
                        </span>
                        <span className="flex items-center gap-1">
                          <DollarSign className="w-3 h-3" /> {fmtSGD(course.tuition_fee)}/yr
                        </span>
                        {course.intake_date && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(course.intake_date).toLocaleDateString("en-SG", { month: "short", year: "numeric" })}
                          </span>
                        )}
                        {course.internship_available && (
                          <span className="text-emerald-400/80 font-semibold">+ Internship</span>
                        )}
                      </div>

                      <div className="mt-3 flex items-center justify-between">
                        <span className={`px-2 py-0.5 rounded-md border font-body text-[10px] font-semibold ${
                          course.status === "open"
                            ? "bg-emerald-500/10 border-emerald-400/25 text-emerald-400"
                            : "bg-white/[0.04] border-white/[0.08] text-white/30"
                        }`}>
                          {course.status === "open"
                            ? `${Math.max(0, seatsLeft)} seats left`
                            : "Closed"
                          }
                        </span>
                        <span className="text-gold-400/70 group-hover:text-gold-400 font-body text-xs font-semibold transition-colors">
                          Apply Now →
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Campus Gallery */}
          {hasGallery && (
            <div className="mb-8">
              <h2 className="font-display text-2xl text-white mb-5">Campus Gallery</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {gallery.map(img => (
                  <div key={img.id} className="group relative aspect-video rounded-xl overflow-hidden border border-white/[0.08]">
                    <Image
                      src={img.public_url}
                      alt={img.alt_text ?? img.title ?? `${college.name} campus photo`}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      unoptimized
                    />
                    {(img.title || img.caption) && (
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                        <p className="text-white font-body text-[11px] leading-snug">{img.title ?? img.caption}</p>
                      </div>
                    )}
                    {img.category && (
                      <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-md bg-black/50 border border-white/10 text-white/70 font-body text-[9px]">
                        {MEDIA_CATEGORIES.find(c => c.value === img.category)?.label ?? img.category}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Apply CTA */}
          <div
            className="text-center p-8 rounded-2xl border"
            style={{
              background: primaryColour
                ? `linear-gradient(135deg, ${primaryColour}10, transparent)`
                : "linear-gradient(135deg, rgba(var(--color-gold-500)/0.07), transparent)",
              borderColor: primaryColour ? `${primaryColour}33` : "rgba(var(--color-gold-400)/0.2)",
            }}
          >
            <p className="font-display text-2xl text-white mb-2">Apply to {college.name}</p>
            <p className="text-white/45 font-body text-sm mb-5 max-w-md mx-auto">
              PathPort handles your application, documents, and offer letter process — usually within 24 hours.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href={`/signup?role=student&redirect=/colleges/${slug}`}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-gold-500 to-gold-400 text-navy-900 font-body font-bold text-sm hover:shadow-gold-sm transition-all"
              >
                Register &amp; Apply
              </Link>
              <Link
                href={`/login?redirect=/colleges/${slug}`}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-white/[0.15] text-white/70 hover:text-white hover:border-white/30 font-body text-sm transition-all"
              >
                Already have an account? Login
              </Link>
            </div>
          </div>

        </div>
      </main>
    </>
  );
}
