import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import ApplyButton from "@/components/courses/ApplyButton";
import type { CourseWithCollege } from "@/types/courses";
import {
  ArrowLeft, Building2, Clock, Calendar, Users,
  DollarSign, BookOpen, Globe, CheckCircle2, Info,
  Play, Download, Briefcase, TrendingUp, Award,
} from "lucide-react";

function fmtSGD(n: number) {
  return `S$${n.toLocaleString("en-SG")}`;
}

// Convert a YouTube / Vimeo URL to its embed URL
function toEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url);
    // YouTube
    if (u.hostname.includes("youtube.com")) {
      const v = u.searchParams.get("v");
      return v ? `https://www.youtube.com/embed/${v}` : null;
    }
    if (u.hostname === "youtu.be") {
      return `https://www.youtube.com/embed${u.pathname}`;
    }
    // Vimeo
    if (u.hostname.includes("vimeo.com")) {
      const id = u.pathname.replace("/", "");
      return `https://player.vimeo.com/video/${id}`;
    }
    return null;
  } catch {
    return null;
  }
}

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug }  = await params;
  const supabase  = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  console.log("[Courses] loading detail for slug:", slug);

  const { data, error } = await supabase
    .from("courses")
    .select(`*, colleges (id, name, slug, logo_url, website, description, city, country)`)
    .eq("slug", slug)
    .single();

  if (error || !data) {
    console.error("[Courses] course not found:", slug, error?.message);
    notFound();
  }

  const course    = data as CourseWithCollege;
  const college   = course.colleges as unknown as Record<string, string>;

  const { data: existingApp } = await supabase
    .from("applications")
    .select("id, status")
    .eq("student_id", user.id)
    .eq("course_id", course.id)
    .maybeSingle();

  const hasApplied = !!existingApp;
  const seatsLeft  = course.seats_total - course.seats_filled;
  const fillPct    = Math.round((course.seats_filled / course.seats_total) * 100);

  // Optional section visibility flags
  const hasThumbnail     = !!course.thumbnail_url;
  const hasVideo         = !!course.video_url;
  const hasBrochure      = !!course.brochure_url;
  const hasGallery       = Array.isArray(course.gallery_images) && course.gallery_images.length > 0;
  const hasCareerOutcomes= Array.isArray(course.career_outcomes) && course.career_outcomes.length > 0;
  const hasIndustries    = Array.isArray(course.industries)      && course.industries.length > 0;
  const hasInternship    = course.internship_available === true;
  const hasPathway       = !!course.pathway_description;
  const hasJobOutlook    = !!course.job_outlook_description;
  const hasCareerSection = hasCareerOutcomes || hasIndustries || hasInternship || hasPathway || hasJobOutlook;

  const embedUrl = hasVideo ? toEmbedUrl(course.video_url ?? "") : null;

  return (
    <div className="max-w-5xl space-y-6">

      {/* Back */}
      <Link href="/dashboard/student/courses" className="inline-flex items-center gap-2 text-white/40 hover:text-white/70 font-body text-sm transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to courses
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Main column ─────────────────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-5">

          {/* Thumbnail — only if exists */}
          {hasThumbnail && (
            <div className="relative w-full h-48 rounded-2xl overflow-hidden border border-white/[0.08]">
              <Image
                src={course.thumbnail_url!}
                alt={course.title}
                fill
                className="object-cover"
                unoptimized
              />
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
                <Link href={course.colleges?.website ?? "#"} target="_blank" className="text-white/40 font-body text-sm hover:text-pathBlue-400 transition-colors">
                  {course.colleges?.name}
                </Link>
                <h1 className="font-display text-3xl text-white mt-0.5 leading-tight">{course.title}</h1>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              <span className="px-3 py-1 rounded-full bg-pathBlue-500/15 border border-pathBlue-500/25 text-pathBlue-400 font-body text-xs font-semibold">
                {course.category}
              </span>
              <span className="px-3 py-1 rounded-full bg-white/[0.06] border border-white/[0.10] text-white/55 font-body text-xs">
                {course.level.replace(/_/g, " ")}
              </span>
              <span className="px-3 py-1 rounded-full bg-white/[0.06] border border-white/[0.10] text-white/55 font-body text-xs">
                {course.study_mode.replace("_", "-")}
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
              <p className="text-white/60 font-body text-sm leading-relaxed">{course.description}</p>
            )}

            {/* Brochure download — only if exists */}
            {hasBrochure && (
              <a
                href={course.brochure_url!}
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
                { icon: Clock,     label: "Duration",    value: `${course.duration_months} months` },
                { icon: BookOpen,  label: "Mode",        value: course.study_mode.replace("_", "-") },
                {
                  icon: Calendar,
                  label: "Intake",
                  value: course.intake_date
                    ? new Date(course.intake_date).toLocaleDateString("en-SG", { day: "numeric", month: "long", year: "numeric" })
                    : "TBC",
                },
                { icon: DollarSign, label: "Tuition",    value: fmtSGD(course.tuition_fee)     },
                { icon: DollarSign, label: "App. Fee",   value: fmtSGD(course.application_fee) },
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
                <p className="text-white/55 font-body text-xs">{course.seats_filled} / {course.seats_total}</p>
              </div>
              <div className="h-2 bg-white/[0.07] rounded-full">
                <div
                  className={`h-full rounded-full transition-all ${fillPct > 80 ? "bg-orange-500" : "bg-pathBlue-500"}`}
                  style={{ width: `${Math.min(100, fillPct)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Video — only if exists */}
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
                  href={course.video_url!}
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

          {/* Gallery — only if exists */}
          {hasGallery && (
            <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-6">
              <h2 className="font-display text-xl text-white mb-4">Campus Gallery</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {(course.gallery_images ?? []).map((src, i) => (
                  <a key={i} href={src} target="_blank" rel="noopener noreferrer">
                    <div className="relative aspect-video rounded-xl overflow-hidden bg-navy-950 border border-white/[0.06] hover:border-gold-400/30 transition-colors">
                      <Image src={src} alt={`Gallery ${i + 1}`} fill className="object-cover" unoptimized />
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Career outcomes — only if any data exists */}
          {hasCareerSection && (
            <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-6 space-y-5">
              <h2 className="font-display text-xl text-white flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-gold-400/70" /> Career Outcomes
              </h2>

              {/* Career roles */}
              {hasCareerOutcomes && (
                <div>
                  <p className="text-white/40 font-body text-xs uppercase tracking-widest mb-3">Roles You Can Pursue</p>
                  <div className="flex flex-wrap gap-2">
                    {(course.career_outcomes ?? []).map((role, i) => (
                      <span key={i} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-pathBlue-500/10 border border-pathBlue-500/20 text-pathBlue-300 font-body text-xs">
                        <Award className="w-3 h-3 flex-shrink-0" /> {role}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Industries */}
              {hasIndustries && (
                <div>
                  <p className="text-white/40 font-body text-xs uppercase tracking-widest mb-3">Industries</p>
                  <div className="flex flex-wrap gap-2">
                    {(course.industries ?? []).map((ind, i) => (
                      <span key={i} className="px-3 py-1 rounded-full bg-white/[0.05] border border-white/[0.09] text-white/55 font-body text-xs">
                        {ind}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Internship info */}
              {hasInternship && (
                <div className="p-4 rounded-xl bg-emerald-500/[0.06] border border-emerald-400/20">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <p className="text-emerald-400 font-body text-sm font-semibold">Internship Included</p>
                  </div>
                  <div className="flex flex-wrap gap-4">
                    {course.internship_duration_months && (
                      <p className="text-white/55 font-body text-xs">
                        Duration: <span className="text-white/80 font-semibold">{course.internship_duration_months} months</span>
                      </p>
                    )}
                    {course.estimated_internship_allowance && (
                      <p className="text-white/55 font-body text-xs">
                        Est. allowance: <span className="text-emerald-400 font-semibold">{fmtSGD(course.estimated_internship_allowance)}/mo</span>
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Pathway */}
              {hasPathway && (
                <div>
                  <p className="text-white/40 font-body text-xs uppercase tracking-widest mb-2">Study Pathway</p>
                  <p className="text-white/60 font-body text-sm leading-relaxed">{course.pathway_description}</p>
                </div>
              )}

              {/* Job outlook */}
              {hasJobOutlook && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-4 h-4 text-gold-400/70" />
                    <p className="text-white/40 font-body text-xs uppercase tracking-widest">Job Outlook</p>
                  </div>
                  <p className="text-white/60 font-body text-sm leading-relaxed">{course.job_outlook_description}</p>
                </div>
              )}
            </div>
          )}

          {/* About college */}
          <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-6">
            <h2 className="font-display text-xl text-white mb-3">About {course.colleges?.name}</h2>
            <p className="text-white/55 font-body text-sm leading-relaxed mb-4">
              {college?.description ?? "One of Singapore's leading EduTrust-certified private education institutions."}
            </p>
            <div className="flex flex-wrap gap-3">
              {[
                { icon: Globe,        text: `${college?.city ?? "Singapore"}, Singapore` },
                { icon: CheckCircle2, text: "EduTrust Certified" },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-1.5 text-white/45 font-body text-xs">
                  <Icon className="w-3.5 h-3.5 text-gold-400/60" /> {text}
                </div>
              ))}
            </div>
            {course.colleges?.website && (
              <Link href={course.colleges.website} target="_blank" className="inline-flex items-center gap-1.5 mt-3 text-pathBlue-400 hover:text-pathBlue-300 font-body text-xs transition-colors">
                Visit college website →
              </Link>
            )}
          </div>
        </div>

        {/* ── Sidebar ──────────────────────────────────────────────────────── */}
        <div className="space-y-4">

          {/* Apply card */}
          <div className="bg-gradient-to-br from-gold-500/[0.07] to-transparent border border-gold-400/20 rounded-2xl p-5">
            <h3 className="font-display text-xl text-white mb-1">Apply to this Programme</h3>
            <p className="text-white/40 font-body text-xs mb-4">
              PathPort handles your application, documents, and offer letter process.
            </p>

            <div className="space-y-2 mb-5">
              <div className="flex justify-between">
                <span className="text-white/45 font-body text-sm">Tuition Fee</span>
                <span className="text-gold-400 font-body font-bold text-sm">{fmtSGD(course.tuition_fee)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/45 font-body text-sm">Application Fee</span>
                <span className="text-white/65 font-body text-sm">{fmtSGD(course.application_fee)}</span>
              </div>
              <div className="h-px bg-white/[0.08] my-2" />
              <div className="flex justify-between">
                <span className="text-white/45 font-body text-sm">Intake</span>
                <span className="text-white/65 font-body text-sm">
                  {course.intake_date
                    ? new Date(course.intake_date).toLocaleDateString("en-SG", { month: "short", year: "numeric" })
                    : "TBC"}
                </span>
              </div>
              {hasInternship && course.estimated_internship_allowance && (
                <>
                  <div className="h-px bg-white/[0.08] my-2" />
                  <div className="flex justify-between">
                    <span className="text-white/45 font-body text-sm">Internship Allowance</span>
                    <span className="text-emerald-400 font-body text-sm font-semibold">{fmtSGD(course.estimated_internship_allowance)}/mo</span>
                  </div>
                </>
              )}
            </div>

            <ApplyButton
              courseId={course.id}
              courseTitle={course.title}
              hasApplied={hasApplied}
              seatsLeft={seatsLeft}
              className="w-full"
            />

            <div className="mt-4 p-3 rounded-xl bg-white/[0.04] border border-white/[0.07] flex items-start gap-2">
              <Info className="w-3.5 h-3.5 text-white/30 flex-shrink-0 mt-0.5" />
              <p className="text-white/35 font-body text-[11px] leading-relaxed">
                PathPort will guide you through document preparation, submission, and offer letter within 24 hours.
              </p>
            </div>
          </div>

          {/* Brochure — sidebar shortcut if exists */}
          {hasBrochure && (
            <a
              href={course.brochure_url!}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.04] border border-white/[0.08] hover:border-pathBlue-500/30 hover:bg-pathBlue-500/[0.04] group transition-all"
            >
              <div className="flex items-center gap-3">
                <Download className="w-4 h-4 text-pathBlue-400" />
                <span className="font-body text-sm text-white/65 group-hover:text-white/85">Download Brochure</span>
              </div>
              <ArrowLeft className="w-4 h-4 text-white/25 rotate-[135deg] group-hover:text-pathBlue-400 transition-colors" />
            </a>
          )}

          {/* WhatsApp */}
          <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-5">
            <h3 className="font-display text-lg text-white mb-3">Questions?</h3>
            <p className="text-white/45 font-body text-xs mb-3">Talk to a PathPort advisor for personalised guidance on this programme.</p>
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
  );
}
