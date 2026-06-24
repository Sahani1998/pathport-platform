// Public course detail page — no auth required.
// Mirrors the authenticated student course detail but with public Apply CTA.
// Apply → /signup?role=student&redirect=... for unauthenticated visitors.

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import SafeImage from "@/components/ui/SafeImage";
import { createAdminClient } from "@/lib/supabase/admin-client";
import {
  ArrowLeft, Building2, Clock, Calendar, Users,
  DollarSign, BookOpen, Globe, CheckCircle2, Info,
  Play, Download, Briefcase, TrendingUp, Award,
} from "lucide-react";

export const revalidate = 300;

function fmtSGD(n: number) {
  return `S$${n.toLocaleString("en-SG")}`;
}

function toEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtube.com")) {
      const v = u.searchParams.get("v");
      return v ? `https://www.youtube.com/embed/${v}` : null;
    }
    if (u.hostname === "youtu.be") {
      return `https://www.youtube.com/embed${u.pathname}`;
    }
    if (u.hostname.includes("vimeo.com")) {
      return `https://player.vimeo.com/video/${u.pathname.replace("/", "")}`;
    }
    return null;
  } catch { return null; }
}

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const adminDb  = createAdminClient();
  const { data } = await adminDb
    .from("courses")
    .select("title, description, colleges(name)")
    .eq("slug",         slug)
    .eq("is_published", true)
    .maybeSingle();

  if (!data) return { title: "Course Not Found | PathPort" };
  const college = (data.colleges as unknown as { name: string } | null)?.name ?? "Singapore";

  return {
    title:       `${data.title} at ${college} | PathPort`,
    description: data.description ?? `${data.title} — Singapore diploma programme at ${college}. Apply through PathPort.`,
    alternates:  { canonical: `/courses/${slug}` },
    openGraph: {
      title:       `${data.title} | PathPort`,
      description: data.description ?? `Diploma programme at ${college}, Singapore.`,
      type:        "website",
    },
  };
}

export default async function PublicCourseDetailPage({ params }: PageProps) {
  const { slug }  = await params;
  const adminDb   = createAdminClient();

  const { data, error } = await adminDb
    .from("courses")
    .select(`
      *,
      colleges (id, name, slug, logo_url, website, description, city, country)
    `)
    .eq("slug",         slug)
    .eq("is_published", true)
    .maybeSingle();

  if (error || !data) notFound();

  // Fetch gallery images from the normalised table (Sprint 32)
  const { data: galleryRows } = await adminDb
    .from("course_gallery")
    .select("id, public_url, alt_text, sort_order")
    .eq("course_id", data.id)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  const galleryImages = galleryRows ?? [];

  const course  = data as typeof data & Record<string, unknown>;
  const college = (course.colleges as Record<string, string> | null);

  const seatsLeft  = (course.seats_total as number) - (course.seats_filled as number);
  const fillPct    = Math.round(((course.seats_filled as number) / (course.seats_total as number)) * 100);

  const hasThumbnail      = !!course.thumbnail_url;
  const hasVideo          = !!course.video_url;
  const hasBrochure       = !!course.brochure_url;
  const hasGallery        = galleryImages.length > 0;
  const hasCareerOutcomes = Array.isArray(course.career_outcomes) && (course.career_outcomes as unknown[]).length > 0;
  const hasIndustries     = Array.isArray(course.industries) && (course.industries as unknown[]).length > 0;
  const hasInternship     = course.internship_available === true;
  const hasPathway        = !!course.pathway_description;
  const hasJobOutlook     = !!course.job_outlook_description;
  const hasCareerSection  = hasCareerOutcomes || hasIndustries || hasInternship || hasPathway || hasJobOutlook;
  const embedUrl          = hasVideo ? toEmbedUrl(course.video_url as string) : null;

  const jsonLd = {
    "@context":   "https://schema.org",
    "@type":      "Course",
    name:         course.title,
    description:  course.description ?? undefined,
    url:          `https://pathport.sg/courses/${slug}`,
    provider: {
      "@type":       "EducationalOrganization",
      name:          college?.name,
      url:           college?.website ?? undefined,
      address: {
        "@type":         "PostalAddress",
        addressLocality: college?.city ?? "Singapore",
        addressCountry:  college?.country ?? "Singapore",
      },
    },
    offers: {
      "@type":         "Offer",
      price:            String(course.tuition_fee),
      priceCurrency:    "SGD",
      availability:     course.status === "open"
        ? "https://schema.org/InStock"
        : "https://schema.org/SoldOut",
    },
    timeToComplete: `P${course.duration_months}M`,
    hasCourseInstance: {
      "@type":         "CourseInstance",
      courseMode:      course.study_mode === "full_time" ? "full-time" : "part-time",
      courseWorkload:  `${course.duration_months} months`,
      startDate:       course.intake_date ?? undefined,
      location: {
        "@type":           "Place",
        name:              college?.name,
        address: {
          "@type":         "PostalAddress",
          addressLocality: college?.city ?? "Singapore",
          addressCountry:  "SG",
        },
      },
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <main className="min-h-screen py-24 px-5 md:px-10">
        <div className="max-w-5xl mx-auto space-y-6">

          {/* Back */}
          <Link href="/courses" className="inline-flex items-center gap-2 text-white/40 hover:text-white/70 font-body text-sm transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to courses
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* ── Main column ─────────────────────────────────────────────────── */}
            <div className="lg:col-span-2 space-y-5 order-last lg:order-first">

              {/* Thumbnail */}
              {hasThumbnail && (
                <div className="relative w-full h-48 rounded-2xl overflow-hidden border border-white/[0.08]">
                  <SafeImage src={course.thumbnail_url as string} alt={course.title as string} fill className="object-cover" placeholderClassName="bg-navy-900/40" />
                  <div className="absolute inset-0 bg-gradient-to-t from-navy-950/80 via-transparent to-transparent" />
                </div>
              )}

              {/* Header card */}
              <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-6">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-pathBlue-500/15 border border-pathBlue-500/20 flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-6 h-6 text-pathBlue-400" />
                  </div>
                  <div>
                    <Link
                      href={`/colleges/${college?.slug ?? ""}`}
                      className="text-white/40 font-body text-sm hover:text-pathBlue-400 transition-colors"
                    >
                      {college?.name}
                    </Link>
                    <h1 className="font-display text-3xl text-white mt-0.5 leading-tight">
                      {course.title as string}
                    </h1>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="px-3 py-1 rounded-full bg-pathBlue-500/15 border border-pathBlue-500/25 text-pathBlue-400 font-body text-xs font-semibold">
                    {course.category as string}
                  </span>
                  <span className="px-3 py-1 rounded-full bg-white/[0.06] border border-white/[0.10] text-white/55 font-body text-xs">
                    {(course.level as string).replace(/_/g, " ")}
                  </span>
                  <span className="px-3 py-1 rounded-full bg-white/[0.06] border border-white/[0.10] text-white/55 font-body text-xs">
                    {(course.study_mode as string).replace("_", "-")}
                  </span>
                  {hasInternship && (
                    <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-400/25 text-emerald-400 font-body text-xs font-semibold">
                      Internship Included
                    </span>
                  )}
                  <span className={`px-3 py-1 rounded-full border font-body text-xs font-semibold ${
                    course.status === "open"
                      ? "bg-emerald-500/10 border-emerald-400/25 text-emerald-400"
                      : "bg-white/[0.05] border-white/[0.09] text-white/35"
                  }`}>
                    {course.status === "open" ? "Open" : "Closed"}
                  </span>
                </div>

                {course.description && (
                  <p className="text-white/60 font-body text-sm leading-relaxed">{course.description as string}</p>
                )}

                {hasBrochure && (
                  <a
                    href={course.brochure_url as string}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-xl bg-pathBlue-500/10 border border-pathBlue-500/25 text-pathBlue-400 font-body text-xs font-semibold hover:bg-pathBlue-500/20 transition-all"
                  >
                    <Download className="w-3.5 h-3.5" /> Download Brochure (PDF)
                  </a>
                )}
              </div>

              {/* Programme details */}
              <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-6">
                <h2 className="font-display text-xl text-white mb-4">Programme Details</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {[
                    { icon: Clock,      label: "Duration",    value: `${course.duration_months} months` },
                    { icon: BookOpen,   label: "Mode",        value: (course.study_mode as string).replace("_", "-") },
                    {
                      icon: Calendar,  label: "Intake",
                      value: course.intake_date
                        ? new Date(course.intake_date as string).toLocaleDateString("en-SG", { day: "numeric", month: "long", year: "numeric" })
                        : "TBC",
                    },
                    { icon: DollarSign, label: "Tuition",    value: fmtSGD(course.tuition_fee as number) },
                    { icon: DollarSign, label: "App. Fee",   value: fmtSGD(course.application_fee as number) },
                    { icon: Users,      label: "Seats Left", value: `${Math.max(0, seatsLeft)} / ${course.seats_total}` },
                  ].map(({ icon: Icon, label, value }) => (
                    <div key={label} className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-white/[0.05] border border-white/[0.09] flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Icon className="w-3.5 h-3.5 text-gold-400" />
                      </div>
                      <div>
                        <p className="text-white/35 font-body text-[10px] uppercase tracking-wider">{label}</p>
                        <p className="text-white/80 font-body text-sm font-semibold">{value}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-white/35 font-body text-xs">Seats filled</p>
                    <p className="text-white/55 font-body text-xs">{course.seats_filled as number} / {course.seats_total as number}</p>
                  </div>
                  <div className="h-2 bg-white/[0.07] rounded-full">
                    <div
                      className={`h-full rounded-full transition-all ${fillPct > 80 ? "bg-orange-500" : "bg-pathBlue-500"}`}
                      style={{ width: `${Math.min(100, fillPct)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Video */}
              {hasVideo && (
                <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-6">
                  <h2 className="font-display text-xl text-white mb-4 flex items-center gap-2">
                    <Play className="w-5 h-5 text-pathBlue-400" /> Programme Introduction
                  </h2>
                  {embedUrl ? (
                    <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-navy-950">
                      <iframe
                        src={embedUrl}
                        title="Course introduction video"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="absolute inset-0 w-full h-full"
                      />
                    </div>
                  ) : (
                    <a
                      href={course.video_url as string}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-4 rounded-xl bg-pathBlue-500/10 border border-pathBlue-500/20 text-pathBlue-400 hover:bg-pathBlue-500/20 transition-all"
                    >
                      <Play className="w-5 h-5 flex-shrink-0" />
                      <span className="font-body text-sm font-semibold">Watch Introduction Video →</span>
                    </a>
                  )}
                </div>
              )}

              {/* Gallery */}
              {hasGallery && (
                <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-6">
                  <h2 className="font-display text-xl text-white mb-4">Campus Gallery</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {galleryImages.map((img, i) => (
                      <a key={img.id} href={img.public_url} target="_blank" rel="noopener noreferrer">
                        <div className="relative aspect-video rounded-xl overflow-hidden bg-navy-950 border border-white/[0.06] hover:border-gold-400/30 transition-colors">
                          <SafeImage
                            src={img.public_url}
                            alt={img.alt_text ?? `Gallery ${i + 1}`}
                            fill
                            className="object-cover"
                          />
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Career outcomes */}
              {hasCareerSection && (
                <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-6 space-y-5">
                  <h2 className="font-display text-xl text-white flex items-center gap-2">
                    <Briefcase className="w-5 h-5 text-gold-400/70" /> Career Outcomes
                  </h2>
                  {hasCareerOutcomes && (
                    <div>
                      <p className="text-white/40 font-body text-xs uppercase tracking-widest mb-3">Roles You Can Pursue</p>
                      <div className="flex flex-wrap gap-2">
                        {(course.career_outcomes as string[]).map((role, i) => (
                          <span key={i} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-pathBlue-500/10 border border-pathBlue-500/20 text-pathBlue-300 font-body text-xs">
                            <Award className="w-3 h-3 flex-shrink-0" /> {role}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {hasIndustries && (
                    <div>
                      <p className="text-white/40 font-body text-xs uppercase tracking-widest mb-3">Industries</p>
                      <div className="flex flex-wrap gap-2">
                        {(course.industries as string[]).map((ind, i) => (
                          <span key={i} className="px-3 py-1 rounded-full bg-white/[0.05] border border-white/[0.09] text-white/55 font-body text-xs">{ind}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {hasInternship && (
                    <div className="p-4 rounded-xl bg-emerald-500/[0.06] border border-emerald-400/20">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <p className="text-emerald-400 font-body text-sm font-semibold">Internship Included</p>
                      </div>
                      <div className="flex flex-wrap gap-4">
                        {course.internship_duration_months && (
                          <p className="text-white/55 font-body text-xs">
                            Duration: <span className="text-white/80 font-semibold">{course.internship_duration_months as number} months</span>
                          </p>
                        )}
                        {course.estimated_internship_allowance && (
                          <p className="text-white/55 font-body text-xs">
                            Est. allowance: <span className="text-emerald-400 font-semibold">{fmtSGD(course.estimated_internship_allowance as number)}/mo</span>
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                  {hasPathway && (
                    <div>
                      <p className="text-white/40 font-body text-xs uppercase tracking-widest mb-2">Study Pathway</p>
                      <p className="text-white/60 font-body text-sm leading-relaxed">{course.pathway_description as string}</p>
                    </div>
                  )}
                  {hasJobOutlook && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="w-4 h-4 text-gold-400/70" />
                        <p className="text-white/40 font-body text-xs uppercase tracking-widest">Job Outlook</p>
                      </div>
                      <p className="text-white/60 font-body text-sm leading-relaxed">{course.job_outlook_description as string}</p>
                    </div>
                  )}
                </div>
              )}

              {/* About college */}
              <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-6">
                <h2 className="font-display text-xl text-white mb-3">About {college?.name}</h2>
                {college?.description && (
                  <p className="text-white/55 font-body text-sm leading-relaxed mb-4">
                    {college.description}
                  </p>
                )}
                <div className="flex flex-wrap gap-3 mb-3">
                  {[
                    { icon: Globe,        text: `${college?.city ?? "Singapore"}, Singapore` },
                    { icon: CheckCircle2, text: "EduTrust Certified" },
                  ].map(({ icon: Icon, text }) => (
                    <div key={text} className="flex items-center gap-1.5 text-white/45 font-body text-xs">
                      <Icon className="w-3.5 h-3.5 text-gold-400/60" /> {text}
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  <Link
                    href={`/colleges/${college?.slug ?? ""}`}
                    className="text-pathBlue-400 hover:text-pathBlue-300 font-body text-xs transition-colors"
                  >
                    View all programmes at {college?.name} →
                  </Link>
                  {college?.website && (
                    <a href={college.website} target="_blank" rel="noopener noreferrer"
                      className="text-white/35 hover:text-white/60 font-body text-xs transition-colors">
                      Official website →
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* ── Sidebar ──────────────────────────────────────────────────────── */}
            <div className="space-y-4 order-first lg:order-last">

              {/* Apply card */}
              <div className="bg-gradient-to-br from-gold-500/[0.07] to-transparent border border-gold-400/20 rounded-2xl p-5">
                <h3 className="font-display text-xl text-white mb-1">Apply to this Programme</h3>
                <p className="text-white/40 font-body text-xs mb-4">
                  PathPort handles your application, documents, and offer letter — usually within 24 hours.
                </p>

                <div className="space-y-2 mb-5">
                  <div className="flex justify-between">
                    <span className="text-white/45 font-body text-sm">Tuition Fee</span>
                    <span className="text-gold-400 font-body font-bold text-sm">{fmtSGD(course.tuition_fee as number)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/45 font-body text-sm">Application Fee</span>
                    <span className="text-white/65 font-body text-sm">{fmtSGD(course.application_fee as number)}</span>
                  </div>
                  <div className="h-px bg-white/[0.08] my-2" />
                  <div className="flex justify-between">
                    <span className="text-white/45 font-body text-sm">Intake</span>
                    <span className="text-white/65 font-body text-sm">
                      {course.intake_date
                        ? new Date(course.intake_date as string).toLocaleDateString("en-SG", { month: "short", year: "numeric" })
                        : "TBC"}
                    </span>
                  </div>
                </div>

                <Link
                  href={`/signup?role=student&redirect=/dashboard/student/courses/${course.slug}`}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-gold-500 to-gold-400 text-navy-900 font-body font-bold text-sm hover:shadow-gold-sm transition-all"
                >
                  Apply Now
                </Link>

                <Link
                  href={`/login?redirect=/dashboard/student/courses/${course.slug}`}
                  className="w-full flex items-center justify-center gap-2 mt-2 px-4 py-2.5 rounded-xl border border-white/[0.12] text-white/60 hover:text-white hover:border-white/25 font-body text-sm transition-all"
                >
                  Already have an account? Login
                </Link>

                <div className="mt-4 p-3 rounded-xl bg-white/[0.04] border border-white/[0.07] flex items-start gap-2">
                  <Info className="w-3.5 h-3.5 text-white/30 flex-shrink-0 mt-0.5" />
                  <p className="text-white/35 font-body text-[11px] leading-relaxed">
                    Free to apply. PathPort advisors guide you through every step from documents to arrival.
                  </p>
                </div>
              </div>

              {/* Brochure */}
              {hasBrochure && (
                <a
                  href={course.brochure_url as string}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.04] border border-white/[0.08] hover:border-pathBlue-500/30 group transition-all"
                >
                  <div className="flex items-center gap-3">
                    <Download className="w-4 h-4 text-pathBlue-400" />
                    <span className="font-body text-sm text-white/65 group-hover:text-white/85">Download Brochure</span>
                  </div>
                </a>
              )}

              {/* WhatsApp */}
              <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-5">
                <h3 className="font-display text-lg text-white mb-3">Questions?</h3>
                <p className="text-white/45 font-body text-xs mb-3">Talk to a PathPort advisor for personalised guidance.</p>
                <a
                  href="https://wa.me/6583776492"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-400/25 text-emerald-400 font-body text-sm font-semibold hover:bg-emerald-500/20 transition-all"
                >
                  💬 WhatsApp +65 8377 6492
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
