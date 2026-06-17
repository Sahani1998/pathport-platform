// Public courses directory — no auth required.
// Filters: search, category, level, college.
// Pagination: 12 per page.

import type { Metadata } from "next";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin-client";
import { COURSE_CATEGORIES, type CourseCategory } from "@/types/courses";
import {
  BookOpen, Building2, Clock, DollarSign, Calendar, Search, ChevronRight,
} from "lucide-react";

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

function fmtSGD(n: number) {
  return `S$${n.toLocaleString("en-SG")}`;
}

interface PageProps {
  searchParams: Promise<{ q?: string; category?: string; level?: string; college?: string; page?: string }>;
}

export default async function CoursesPage({ searchParams }: PageProps) {
  const { q, category, level, college: collegeFilter, page: pageParam } = await searchParams;
  const page   = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);
  const offset = (page - 1) * PAGE_SIZE;
  const search = q?.trim() ?? "";

  const adminDb = createAdminClient();

  // Fetch filter options (colleges)
  const { data: colleges } = await adminDb
    .from("colleges")
    .select("id, name, slug")
    .eq("is_published", true)
    .eq("is_active",    true)
    .order("name");

  // Build course query
  let query = adminDb
    .from("courses")
    .select(`
      id, title, slug, category, level, duration_months, tuition_fee, status,
      intake_date, seats_total, seats_filled, internship_available,
      colleges (id, name, slug)
    `, { count: "exact" })
    .eq("is_published", true)
    .neq("status",      "draft")
    .order("status")
    .order("title");

  if (search)        query = query.or(`title.ilike.%${search}%,category.ilike.%${search}%`);
  if (category)      query = query.eq("category", category);
  if (level)         query = query.eq("level",    level);
  if (collegeFilter) query = query.eq("college_id", collegeFilter);

  const { data: courses, count } = await query.range(offset, offset + PAGE_SIZE - 1);

  const total      = count ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  function pageHref(p: number, overrides: Record<string, string | undefined> = {}) {
    const params = new URLSearchParams();
    const merged = { q: search || undefined, category, level, college: collegeFilter, ...overrides };
    if (merged.q)       params.set("q",       merged.q);
    if (merged.category) params.set("category", merged.category);
    if (merged.level)   params.set("level",   merged.level);
    if (merged.college) params.set("college",  merged.college);
    if (p > 1)          params.set("page",    String(p));
    const qs = params.toString();
    return `/courses${qs ? `?${qs}` : ""}`;
  }

  const courseList = (courses ?? []) as unknown as Array<{
    id: string; title: string; slug: string; category: string; level: string;
    duration_months: number; tuition_fee: number; status: string;
    intake_date: string | null; seats_total: number; seats_filled: number;
    internship_available: boolean | null;
    colleges: { id: string; name: string; slug: string } | null;
  }>;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type":    "ItemList",
            name:       "Singapore Diploma Courses on PathPort",
            url:        "https://pathport.in/courses",
            numberOfItems: total,
            itemListElement: courseList.map((c, i) => ({
              "@type":    "ListItem",
              position:   offset + i + 1,
              name:       c.title,
              url:        `https://pathport.in/courses/${c.slug}`,
            })),
          }),
        }}
      />

      <main className="min-h-screen py-24 px-5 md:px-10">
        <div className="max-w-7xl mx-auto">

          {/* Header */}
          <div className="text-center mb-10">
            <p className="text-pathBlue-400 font-body text-xs font-semibold tracking-[0.20em] uppercase mb-3">
              Singapore Diploma Programmes
            </p>
            <h1 className="font-display text-4xl sm:text-5xl text-white mb-4 leading-tight">
              Browse Courses
            </h1>
            <p className="text-white/50 font-body text-lg max-w-2xl mx-auto">
              Explore diploma, advanced diploma, and higher diploma programmes at Singapore private colleges.
            </p>
          </div>

          {/* Search */}
          <form method="GET" action="/courses" className="max-w-2xl mx-auto mb-8">
            <div className="relative mb-3">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
              <input
                type="search"
                name="q"
                defaultValue={search}
                placeholder="Search courses or subjects…"
                className="w-full pl-11 pr-4 py-3 rounded-xl bg-white/[0.05] border border-white/[0.10] text-white placeholder-white/30 font-body text-sm focus:outline-none focus:border-gold-400/50 focus:ring-2 focus:ring-gold-400/10 transition-all"
              />
            </div>
            <div className="flex flex-wrap gap-2 justify-center">
              {/* Category filter */}
              <select
                name="category"
                defaultValue={category ?? ""}
                className="px-3 py-2 rounded-xl bg-white/[0.05] border border-white/[0.09] text-white/70 font-body text-xs focus:outline-none focus:border-gold-400/40 transition-all appearance-none cursor-pointer [&>option]:bg-navy-900"
              >
                <option value="">All Categories</option>
                {COURSE_CATEGORIES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>

              {/* Level filter */}
              <select
                name="level"
                defaultValue={level ?? ""}
                className="px-3 py-2 rounded-xl bg-white/[0.05] border border-white/[0.09] text-white/70 font-body text-xs focus:outline-none focus:border-gold-400/40 transition-all appearance-none cursor-pointer [&>option]:bg-navy-900"
              >
                <option value="">All Levels</option>
                {LEVELS.map(l => (
                  <option key={l.value} value={l.value}>{l.label}</option>
                ))}
              </select>

              {/* College filter */}
              <select
                name="college"
                defaultValue={collegeFilter ?? ""}
                className="px-3 py-2 rounded-xl bg-white/[0.05] border border-white/[0.09] text-white/70 font-body text-xs focus:outline-none focus:border-gold-400/40 transition-all appearance-none cursor-pointer [&>option]:bg-navy-900"
              >
                <option value="">All Colleges</option>
                {(colleges ?? []).map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>

              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-gold-400/15 border border-gold-400/30 text-gold-400 font-body text-xs font-semibold hover:bg-gold-400/25 transition-all"
              >
                Search
              </button>
              {(search || category || level || collegeFilter) && (
                <Link
                  href="/courses"
                  className="px-4 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white/45 font-body text-xs hover:text-white/70 transition-all"
                >
                  Clear filters
                </Link>
              )}
            </div>
          </form>

          {/* Results count */}
          <p className="text-white/35 font-body text-sm text-center mb-8">
            {total} course{total !== 1 ? "s" : ""} available
          </p>

          {/* Grid */}
          {courseList.length === 0 ? (
            <div className="flex flex-col items-center py-20 text-white/25">
              <BookOpen className="w-12 h-12 mb-4" />
              <p className="font-display text-2xl text-white/40 mb-1">No courses found</p>
              <Link href="/courses" className="mt-3 text-pathBlue-400 font-body text-sm hover:text-pathBlue-300 transition-colors">
                Clear filters
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-10">
              {courseList.map(course => {
                const seatsLeft = course.seats_total - course.seats_filled;
                return (
                  <Link
                    key={course.id}
                    href={`/courses/${course.slug}`}
                    className="group block bg-white/[0.04] border border-white/[0.08] rounded-2xl p-5 hover:border-gold-400/30 hover:bg-gold-400/[0.03] transition-all"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-7 h-7 rounded-lg bg-pathBlue-500/15 border border-pathBlue-500/20 flex items-center justify-center flex-shrink-0">
                        <Building2 className="w-3.5 h-3.5 text-pathBlue-400" />
                      </div>
                      <p className="text-white/35 font-body text-xs truncate">{course.colleges?.name}</p>
                    </div>

                    <h2 className="font-body font-semibold text-white/85 text-sm leading-snug mb-3 group-hover:text-white transition-colors line-clamp-2">
                      {course.title}
                    </h2>

                    <div className="flex flex-wrap gap-1.5 mb-3">
                      <span className="px-2 py-0.5 rounded-lg bg-pathBlue-500/10 border border-pathBlue-500/20 text-pathBlue-400 font-body text-[10px] font-semibold">
                        {course.category}
                      </span>
                      <span className="px-2 py-0.5 rounded-lg bg-white/[0.05] border border-white/[0.09] text-white/45 font-body text-[10px]">
                        {course.level.replace(/_/g, " ")}
                      </span>
                      {course.internship_available && (
                        <span className="px-2 py-0.5 rounded-lg bg-emerald-500/10 border border-emerald-400/20 text-emerald-400 font-body text-[10px] font-semibold">
                          + Internship
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 text-white/35 font-body text-xs">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {course.duration_months}mo
                        </span>
                        <span className="flex items-center gap-1 text-gold-400 font-bold">
                          <DollarSign className="w-3 h-3" /> {fmtSGD(course.tuition_fee)}
                        </span>
                      </div>
                      <span className={`px-2 py-0.5 rounded-md border font-body text-[10px] font-semibold ${
                        course.status === "open"
                          ? "bg-emerald-500/10 border-emerald-400/25 text-emerald-400"
                          : "bg-white/[0.04] border-white/[0.08] text-white/25"
                      }`}>
                        {course.status === "open" ? `${Math.max(0, seatsLeft)} left` : "Closed"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/[0.05]">
                      {course.intake_date && (
                        <span className="flex items-center gap-1 text-white/30 font-body text-[10px]">
                          <Calendar className="w-3 h-3" />
                          {new Date(course.intake_date).toLocaleDateString("en-SG", { month: "short", year: "numeric" })}
                        </span>
                      )}
                      <span className="ml-auto flex items-center gap-1 text-gold-400/70 group-hover:text-gold-400 font-body text-xs font-semibold transition-colors">
                        View <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <nav className="flex items-center justify-center gap-2 mb-10" aria-label="Pagination">
              {page > 1 && (
                <Link href={pageHref(page - 1)} className="px-4 py-2 rounded-xl bg-white/[0.05] border border-white/[0.09] text-white/60 hover:text-white hover:border-white/20 font-body text-sm transition-all">
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
                      ? "bg-gold-400/20 border border-gold-400/40 text-gold-300"
                      : "bg-white/[0.04] border border-white/[0.08] text-white/50 hover:text-white hover:border-white/20"
                  }`}
                >
                  {p}
                </Link>
              ))}
              {page < totalPages && (
                <Link href={pageHref(page + 1)} className="px-4 py-2 rounded-xl bg-white/[0.05] border border-white/[0.09] text-white/60 hover:text-white hover:border-white/20 font-body text-sm transition-all">
                  Next
                </Link>
              )}
            </nav>
          )}

          {/* Apply CTA */}
          <div className="text-center p-8 rounded-2xl bg-pathBlue-500/[0.06] border border-pathBlue-500/20">
            <p className="font-display text-2xl text-white mb-2">Ready to Apply?</p>
            <p className="text-white/50 font-body text-sm mb-5">
              Register free and apply to any programme — PathPort guides you from application to arrival.
            </p>
            <Link
              href="/signup?role=student"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-gold-500 to-gold-400 text-navy-900 font-body font-bold text-sm hover:shadow-gold-sm transition-all"
            >
              Register as Student
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
