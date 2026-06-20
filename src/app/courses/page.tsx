// Public courses directory — light theme (Sprint 30.1 PR-D).
// Hero + diploma types explained + career outcomes + duration guide +
// directory grid (with all existing filters/compare/pagination) + FAQ + CTA.
// Filters: search (title+description), category, level, college, fee range, duration, compare.
// Pagination: 12 per page. Compare: URL-param based, up to 3 courses.

import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { createAdminClient } from "@/lib/supabase/admin-client";
import { COURSE_CATEGORIES } from "@/types/courses";
import {
  BookOpen, Building2, Clock, DollarSign, Calendar, Search, ChevronRight, BarChart3, X,
} from "lucide-react";
import CoursesHero from "@/components/courses/CoursesHero";
import DiplomaTypesExplained from "@/components/courses/DiplomaTypesExplained";
import CareerOutcomes from "@/components/courses/CareerOutcomes";
import DurationGuide from "@/components/courses/DurationGuide";
import CoursesFAQ from "@/components/courses/CoursesFAQ";

export const revalidate = 300;

const PAGE_SIZE = 12;

export const metadata: Metadata = {
  title:       "Singapore Diploma Courses | PathPort",
  description: "Browse Singapore private college diploma, advanced diploma, and higher diploma courses. Filter by subject, level, and college. Apply through PathPort.",
  alternates:  { canonical: "/courses" },
  openGraph: {
    title:       "Singapore Diploma Courses | PathPort",
    description: "Browse and apply for Singapore diploma programmes at top private colleges.",
    type:        "website",
  },
};

const LEVELS = [
  { value: "diploma",          label: "Diploma" },
  { value: "advanced_diploma", label: "Advanced Diploma" },
  { value: "graduate_diploma", label: "Graduate Diploma" },
  { value: "certificate",      label: "Certificate" },
];

const DURATIONS = [
  { value: "12", label: "12 months" },
  { value: "18", label: "18 months" },
  { value: "24", label: "24 months" },
  { value: "36", label: "36 months" },
];

function fmtSGD(n: number) {
  return `S$${n.toLocaleString("en-SG")}`;
}

interface PageProps {
  searchParams: Promise<{
    q?: string; category?: string; level?: string; college?: string;
    minFee?: string; maxFee?: string; duration?: string;
    page?: string; compare?: string;
  }>;
}

export default async function CoursesPage({ searchParams }: PageProps) {
  const {
    q, category, level, college: collegeFilter,
    minFee, maxFee, duration,
    page: pageParam, compare: compareParam,
  } = await searchParams;

  const page   = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);
  const offset = (page - 1) * PAGE_SIZE;
  const search = q?.trim() ?? "";

  const compareList = (compareParam ?? "").split(",").map(s => s.trim()).filter(Boolean).slice(0, 3);

  const adminDb = createAdminClient();

  const { data: colleges } = await adminDb
    .from("colleges")
    .select("id, name, slug")
    .eq("is_published", true)
    .eq("is_active",    true)
    .order("name");

  let query = adminDb
    .from("courses")
    .select(`
      id, title, slug, category, level, duration_months, tuition_fee, status,
      intake_date, seats_total, seats_filled, internship_available, thumbnail_url,
      colleges (id, name, slug)
    `, { count: "exact" })
    .eq("is_published", true)
    .neq("status",      "draft")
    .order("status")
    .order("title");

  if (search)        query = query.or(`title.ilike.%${search}%,category.ilike.%${search}%,description.ilike.%${search}%`);
  if (category)      query = query.eq("category",  category);
  if (level)         query = query.eq("level",      level);
  if (collegeFilter) query = query.eq("college_id", collegeFilter);
  if (duration)      query = query.eq("duration_months", parseInt(duration, 10));

  const minFeeNum = minFee ? parseFloat(minFee) : null;
  const maxFeeNum = maxFee ? parseFloat(maxFee) : null;
  if (minFeeNum !== null && !isNaN(minFeeNum)) query = query.gte("tuition_fee", minFeeNum);
  if (maxFeeNum !== null && !isNaN(maxFeeNum)) query = query.lte("tuition_fee", maxFeeNum);

  const { data: courses, count } = await query.range(offset, offset + PAGE_SIZE - 1);

  const total      = count ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  const hasActiveFilters = !!(search || category || level || collegeFilter || minFee || maxFee || duration);

  function pageHref(p: number, overrides: Record<string, string | undefined> = {}) {
    const params = new URLSearchParams();
    const merged = {
      q: search || undefined, category, level, college: collegeFilter,
      minFee, maxFee, duration,
      compare: compareList.length > 0 ? compareList.join(",") : undefined,
      ...overrides,
    };
    if (merged.q)        params.set("q",        merged.q);
    if (merged.category) params.set("category", merged.category);
    if (merged.level)    params.set("level",    merged.level);
    if (merged.college)  params.set("college",  merged.college);
    if (merged.minFee)   params.set("minFee",   merged.minFee);
    if (merged.maxFee)   params.set("maxFee",   merged.maxFee);
    if (merged.duration) params.set("duration", merged.duration);
    if (merged.compare)  params.set("compare",  merged.compare);
    if (p > 1)           params.set("page",     String(p));
    const qs = params.toString();
    return `/courses${qs ? `?${qs}` : ""}`;
  }

  function compareHref(slug: string) {
    const isIn = compareList.includes(slug);
    const next = isIn
      ? compareList.filter(s => s !== slug)
      : [...compareList, slug].slice(0, 3);
    return pageHref(page, { compare: next.join(",") || undefined });
  }

  const courseList = (courses ?? []) as unknown as Array<{
    id: string; title: string; slug: string; category: string; level: string;
    duration_months: number; tuition_fee: number; status: string;
    intake_date: string | null; seats_total: number; seats_filled: number;
    internship_available: boolean | null; thumbnail_url: string | null;
    colleges: { id: string; name: string; slug: string } | null;
  }>;

  // Light theme classes for form inputs / selects
  const INPUT_LIGHT  = "w-full pl-11 pr-4 py-3 rounded-xl bg-white border border-slate-200 text-navy-900 placeholder-navy-800/35 font-body text-sm focus:outline-none focus:border-pathBlue-500/60 focus:ring-2 focus:ring-pathBlue-500/15 transition-all";
  const SELECT_LIGHT = "px-3 py-2 rounded-xl bg-white border border-slate-200 text-navy-900 font-body text-xs focus:outline-none focus:border-pathBlue-500/60 transition-all appearance-none cursor-pointer [&>option]:bg-white [&>option]:text-navy-900";
  const NUMBER_LIGHT = "w-24 px-3 py-2 rounded-xl bg-white border border-slate-200 text-navy-900 placeholder-navy-800/35 font-body text-xs focus:outline-none focus:border-pathBlue-500/60 transition-all";

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type":    "ItemList",
            name:       "Singapore Diploma Courses on PathPort",
            url:        "https://pathport.sg/courses",
            numberOfItems: total,
            itemListElement: courseList.map((c, i) => ({
              "@type":    "ListItem",
              position:   offset + i + 1,
              name:       c.title,
              url:        `https://pathport.sg/courses/${c.slug}`,
            })),
          }),
        }}
      />

      <main className="bg-white pt-[68px]">

        {/* 1 · Hero */}
        <CoursesHero search={search} />

        {/* 2 · Diploma Types Explained */}
        <DiplomaTypesExplained />

        {/* 3 · Career Outcomes */}
        <CareerOutcomes />

        {/* 4 · Duration Guide */}
        <DurationGuide />

        {/* 5 · Directory — light cards */}
        <section id="directory" className="relative public-section-white py-20">
          <div className="max-w-7xl mx-auto px-5 md:px-10">

            <div className="text-center mb-10">
              <p className="text-pathBlue-700 font-body text-xs font-semibold tracking-[0.22em] uppercase mb-3">
                The Directory
              </p>
              <h2 className="font-display text-3xl md:text-4xl text-navy-900 leading-[1.1] mb-3">
                {total} programme{total !== 1 ? "s" : ""} ready to apply to.
              </h2>
              <p className="text-navy-800/60 font-body text-base max-w-xl mx-auto">
                Filter by subject, level, college, and budget — or compare up to three side by side.
              </p>
            </div>

            {/* Filter panel — soft-blue tinted card */}
            <form method="GET" action="/courses" className="max-w-4xl mx-auto mb-8 p-5 rounded-2.5xl bg-pathBlue-500/[0.04] border border-pathBlue-500/15 space-y-3">
              {compareList.length > 0 && (
                <input type="hidden" name="compare" value={compareList.join(",")} />
              )}

              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-800/40 pointer-events-none" />
                <input
                  type="search"
                  name="q"
                  defaultValue={search}
                  placeholder="Search courses, subjects, or descriptions…"
                  className={INPUT_LIGHT}
                />
              </div>

              <div className="flex flex-wrap gap-2 justify-center">
                <select name="category" defaultValue={category ?? ""} className={SELECT_LIGHT}>
                  <option value="">All Categories</option>
                  {COURSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <select name="level" defaultValue={level ?? ""} className={SELECT_LIGHT}>
                  <option value="">All Levels</option>
                  {LEVELS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                </select>
                <select name="college" defaultValue={collegeFilter ?? ""} className={SELECT_LIGHT}>
                  <option value="">All Colleges</option>
                  {(colleges ?? []).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <select name="duration" defaultValue={duration ?? ""} className={SELECT_LIGHT}>
                  <option value="">Any Duration</option>
                  {DURATIONS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                </select>
              </div>

              <div className="flex flex-wrap gap-2 justify-center items-center">
                <span className="text-navy-800/55 font-body text-xs">Fee range (S$):</span>
                <input type="number" name="minFee" defaultValue={minFee ?? ""} placeholder="Min" min={0} step={500} className={NUMBER_LIGHT} />
                <span className="text-navy-800/40 font-body text-xs">—</span>
                <input type="number" name="maxFee" defaultValue={maxFee ?? ""} placeholder="Max" min={0} step={500} className={NUMBER_LIGHT} />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-gold-500 to-gold-400 text-navy-900 font-body text-xs font-bold hover:shadow-gold-sm transition-all"
                >
                  Apply filters
                </button>
                {hasActiveFilters && (
                  <Link
                    href={compareList.length > 0 ? `/courses?compare=${compareList.join(",")}` : "/courses"}
                    className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-navy-800/65 font-body text-xs hover:text-navy-900 hover:border-pathBlue-500/40 transition-all"
                  >
                    Clear filters
                  </Link>
                )}
              </div>
            </form>

            <p className="text-navy-800/45 font-body text-sm text-center mb-8">
              Showing {courseList.length} of {total} course{total !== 1 ? "s" : ""}
            </p>

            {/* Compare banner */}
            {compareList.length > 0 && (
              <div className="max-w-3xl mx-auto mb-6 p-4 rounded-2xl bg-gold-400/[0.10] border border-gold-400/30 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <BarChart3 className="w-4 h-4 text-gold-700 flex-shrink-0" />
                  <span className="text-navy-900 font-body text-sm">
                    {compareList.length} course{compareList.length !== 1 ? "s" : ""} selected for comparison
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {compareList.length >= 2 && (
                    <Link
                      href={`/courses/compare?slugs=${compareList.join(",")}`}
                      className="px-4 py-2 rounded-xl bg-gold-500 hover:bg-gold-400 text-navy-900 font-body text-xs font-bold transition-all"
                    >
                      Compare Now →
                    </Link>
                  )}
                  <Link
                    href={pageHref(page, { compare: undefined })}
                    className="p-2 rounded-xl bg-white border border-slate-200 text-navy-800/55 hover:text-navy-900 transition-all"
                  >
                    <X className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            )}

            {/* Grid */}
            {courseList.length === 0 ? (
              <div className="flex flex-col items-center py-20 text-navy-800/35">
                <BookOpen className="w-12 h-12 mb-4" />
                <p className="font-display text-2xl text-navy-800/50 mb-1">No courses found</p>
                <Link href="/courses" className="mt-3 text-pathBlue-700 font-body text-sm hover:text-pathBlue-600 transition-colors">
                  Clear filters
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-10">
                {courseList.map(course => {
                  const seatsLeft  = course.seats_total - course.seats_filled;
                  const isCompared = compareList.includes(course.slug);
                  return (
                    <div key={course.id} className="relative group">
                      {/* Compare toggle */}
                      <Link
                        href={compareHref(course.slug)}
                        className={`absolute top-3 right-3 z-10 flex items-center gap-1 px-2 py-1 rounded-lg border font-body text-[10px] font-semibold transition-all ${
                          isCompared
                            ? "bg-gold-400/20 border-gold-400/45 text-gold-700"
                            : "bg-white border-slate-200 text-navy-800/55 opacity-0 group-hover:opacity-100"
                        }`}
                        title={isCompared ? "Remove from compare" : "Add to compare"}
                      >
                        <BarChart3 className="w-3 h-3" />
                        {isCompared ? "Added" : "Compare"}
                      </Link>

                      <Link
                        href={`/courses/${course.slug}`}
                        className="block rounded-2.5xl overflow-hidden public-card public-card-hover h-full"
                      >
                        {/* Thumbnail */}
                        {course.thumbnail_url ? (
                          <div className="relative w-full h-36 overflow-hidden">
                            <Image
                              src={course.thumbnail_url}
                              alt={course.title}
                              fill
                              className="object-cover"
                              unoptimized
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-navy-900/20 via-transparent to-transparent" />
                          </div>
                        ) : (
                          <div className="w-full h-36 bg-gradient-to-br from-pathBlue-50 to-white flex items-center justify-center border-b border-slate-200">
                            <BookOpen className="w-8 h-8 text-pathBlue-700/50" />
                          </div>
                        )}

                        <div className="p-5">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-6 h-6 rounded-md bg-pathBlue-500/10 border border-pathBlue-500/20 flex items-center justify-center flex-shrink-0">
                              <Building2 className="w-3 h-3 text-pathBlue-700" />
                            </div>
                            <p className="text-navy-800/55 font-body text-xs truncate">{course.colleges?.name}</p>
                          </div>

                          <h3 className="font-body font-semibold text-navy-900 text-sm leading-snug mb-3 group-hover:text-pathBlue-700 transition-colors line-clamp-2">
                            {course.title}
                          </h3>

                          <div className="flex flex-wrap gap-1.5 mb-3">
                            <span className="px-2 py-0.5 rounded-lg bg-pathBlue-500/10 border border-pathBlue-500/25 text-pathBlue-700 font-body text-[10px] font-semibold">
                              {course.category}
                            </span>
                            <span className="px-2 py-0.5 rounded-lg bg-navy-900/5 border border-navy-900/10 text-navy-800/65 font-body text-[10px]">
                              {course.level.replace(/_/g, " ")}
                            </span>
                            {course.internship_available && (
                              <span className="px-2 py-0.5 rounded-lg bg-emerald-500/10 border border-emerald-400/30 text-emerald-700 font-body text-[10px] font-semibold">
                                + Internship
                              </span>
                            )}
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 text-navy-800/55 font-body text-xs">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" /> {course.duration_months}mo
                              </span>
                              <span className="flex items-center gap-1 text-gold-700 font-bold">
                                <DollarSign className="w-3 h-3" /> {fmtSGD(course.tuition_fee)}
                              </span>
                            </div>
                            <span className={`px-2 py-0.5 rounded-md border font-body text-[10px] font-semibold ${
                              course.status === "open"
                                ? "bg-emerald-500/10 border-emerald-400/30 text-emerald-700"
                                : "bg-navy-900/5 border-navy-900/10 text-navy-800/40"
                            }`}>
                              {course.status === "open" ? `${Math.max(0, seatsLeft)} left` : "Closed"}
                            </span>
                          </div>

                          <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-200">
                            {course.intake_date && (
                              <span className="flex items-center gap-1 text-navy-800/45 font-body text-[10px]">
                                <Calendar className="w-3 h-3" />
                                {new Date(course.intake_date).toLocaleDateString("en-SG", { month: "short", year: "numeric" })}
                              </span>
                            )}
                            <span className="ml-auto flex items-center gap-1 text-pathBlue-700 group-hover:gap-1.5 font-body text-xs font-semibold transition-all">
                              View <ChevronRight className="w-3.5 h-3.5" />
                            </span>
                          </div>
                        </div>
                      </Link>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <nav className="flex items-center justify-center gap-2 mb-4" aria-label="Pagination">
                {page > 1 && (
                  <Link href={pageHref(page - 1)} className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-navy-800/70 hover:text-navy-900 hover:border-pathBlue-500/40 font-body text-sm transition-all">
                    Previous
                  </Link>
                )}
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                  <Link
                    key={p}
                    href={pageHref(p)}
                    aria-current={p === page ? "page" : undefined}
                    className={`w-9 h-9 rounded-xl flex items-center justify-center font-body text-sm transition-all ${
                      p === page
                        ? "bg-pathBlue-700 border border-pathBlue-700 text-white"
                        : "bg-white border border-slate-200 text-navy-800/70 hover:text-navy-900 hover:border-pathBlue-500/40"
                    }`}
                  >
                    {p}
                  </Link>
                ))}
                {page < totalPages && (
                  <Link href={pageHref(page + 1)} className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-navy-800/70 hover:text-navy-900 hover:border-pathBlue-500/40 font-body text-sm transition-all">
                    Next
                  </Link>
                )}
              </nav>
            )}
          </div>
        </section>

        {/* 6 · FAQ */}
        <CoursesFAQ />

        {/* 7 · Final CTA — dark for emphasis */}
        <section className="relative py-24 bg-[#06142E]">
          <div aria-hidden className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-gold-400/[0.06] blur-[140px] pointer-events-none" />
          <div className="relative max-w-3xl mx-auto px-5 md:px-10 text-center">
            <h2 className="font-display text-4xl md:text-5xl text-white mb-5 leading-[1.08]">
              Ready to{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold-400 to-gold-300">
                apply?
              </span>
            </h2>
            <p className="text-white/55 font-body text-lg mb-9 max-w-xl mx-auto leading-relaxed">
              Register free and apply to any Singapore diploma programme — PathPort guides you from application through arrival.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/signup?role=student"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-gold-500 to-gold-400 text-navy-900 font-body font-bold text-base hover:shadow-gold-sm transition-all"
              >
                Register as Student — Free
              </Link>
              <a
                href="https://wa.me/6583776492"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl border-2 border-gold-400/60 text-gold-400 font-body font-bold text-base hover:border-gold-400 hover:bg-gold-400/[0.08] transition-all"
              >
                WhatsApp +65 8377 6492
              </a>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
