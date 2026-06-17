// Public course comparison page — no auth required.
// URL: /courses/compare?slugs=slug-a,slug-b,slug-c
// Compares up to 3 published courses side by side.

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin-client";
import {
  ArrowLeft, Clock, DollarSign, Calendar, Users,
  CheckCircle2, XCircle, BookOpen, Building2,
} from "lucide-react";

export const revalidate = 300;

export const metadata: Metadata = {
  title:       "Compare Courses | PathPort",
  description: "Compare Singapore diploma programmes side by side — fees, duration, intake dates, and more.",
  robots:      { index: false },
};

function fmtSGD(n: number) {
  return `S$${n.toLocaleString("en-SG")}`;
}

function levelLabel(l: string) {
  return l.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}

interface PageProps {
  searchParams: Promise<{ slugs?: string }>;
}

export default async function CompareCoursesPage({ searchParams }: PageProps) {
  const { slugs: slugsParam } = await searchParams;
  const slugs = (slugsParam ?? "").split(",").map(s => s.trim()).filter(Boolean).slice(0, 3);

  if (slugs.length < 2) {
    return (
      <main className="min-h-screen py-24 px-5 md:px-10">
        <div className="max-w-3xl mx-auto text-center">
          <Link href="/courses" className="inline-flex items-center gap-2 text-white/35 hover:text-white/65 font-body text-sm transition-colors mb-8">
            <ArrowLeft className="w-4 h-4" /> Back to courses
          </Link>
          <BookOpen className="w-12 h-12 text-white/15 mx-auto mb-4" />
          <h1 className="font-display text-3xl text-white mb-3">Select at least 2 courses to compare</h1>
          <p className="text-white/40 font-body text-sm mb-6">
            Use the &quot;Compare&quot; button on course cards to select up to 3 courses, then click &quot;Compare Now&quot;.
          </p>
          <Link
            href="/courses"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gold-400/15 border border-gold-400/30 text-gold-400 font-body font-semibold text-sm hover:bg-gold-400/25 transition-all"
          >
            Browse Courses
          </Link>
        </div>
      </main>
    );
  }

  const adminDb = createAdminClient();

  // Fetch all requested courses in one query
  const { data: rawCourses } = await adminDb
    .from("courses")
    .select(`
      id, title, slug, category, level, duration_months, tuition_fee, application_fee,
      status, intake_date, seats_total, seats_filled, study_mode,
      internship_available, internship_duration_months, estimated_internship_allowance,
      career_outcomes, industries,
      colleges (id, name, slug, city, country, website)
    `)
    .in("slug", slugs)
    .eq("is_published", true)
    .neq("status", "draft");

  if (!rawCourses || rawCourses.length < 2) notFound();

  // Preserve the requested order
  const courses = slugs
    .map(s => rawCourses.find(c => c.slug === s))
    .filter(Boolean) as typeof rawCourses;

  type CollegeRow = { id: string; name: string; slug: string; city: string; country: string; website: string | null } | null;

  const typed = courses as unknown as Array<{
    id: string; title: string; slug: string; category: string; level: string;
    duration_months: number; tuition_fee: number; application_fee: number;
    status: string; intake_date: string | null; seats_total: number; seats_filled: number;
    study_mode: string; internship_available: boolean | null;
    internship_duration_months: number | null; estimated_internship_allowance: number | null;
    career_outcomes: string[] | null; industries: string[] | null;
    colleges: CollegeRow;
  }>;

  const colCount = typed.length;
  const colClass = colCount === 2 ? "grid-cols-2" : "grid-cols-3";

  function Row({ label, children }: { label: string; children: React.ReactNode }) {
    return (
      <div className={`grid ${colCount === 2 ? "grid-cols-[160px_1fr_1fr]" : "grid-cols-[160px_1fr_1fr_1fr]"} gap-0 border-b border-white/[0.06]`}>
        <div className="py-4 px-4 text-white/40 font-body text-xs uppercase tracking-wider flex items-center">{label}</div>
        {children}
      </div>
    );
  }

  function Cell({ children, highlight }: { children: React.ReactNode; highlight?: boolean }) {
    return (
      <div className={`py-4 px-4 font-body text-sm flex items-center ${highlight ? "text-gold-300 font-semibold" : "text-white/75"}`}>
        {children}
      </div>
    );
  }

  // Find best value per metric (for highlighting)
  const minFee      = Math.min(...typed.map(c => c.tuition_fee));
  const minDuration = Math.min(...typed.map(c => c.duration_months));
  const maxSeats    = Math.max(...typed.map(c => c.seats_total - c.seats_filled));

  return (
    <main className="min-h-screen py-24 px-5 md:px-10">
      <div className="max-w-6xl mx-auto">

        <Link
          href="/courses"
          className="inline-flex items-center gap-2 text-white/35 hover:text-white/65 font-body text-sm transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" /> Back to courses
        </Link>

        <h1 className="font-display text-3xl sm:text-4xl text-white mb-8">
          Compare Courses
        </h1>

        <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl overflow-hidden">

          {/* Header row — course titles */}
          <div className={`grid ${colCount === 2 ? "grid-cols-[160px_1fr_1fr]" : "grid-cols-[160px_1fr_1fr_1fr]"} bg-white/[0.04] border-b border-white/[0.09]`}>
            <div className="p-4" />
            {typed.map(c => (
              <div key={c.id} className="p-4 border-l border-white/[0.06]">
                <Link
                  href={`/colleges/${c.colleges?.slug ?? ""}`}
                  className="flex items-center gap-1.5 text-white/35 font-body text-xs hover:text-pathBlue-400 transition-colors mb-1"
                >
                  <Building2 className="w-3 h-3" /> {c.colleges?.name}
                </Link>
                <Link
                  href={`/courses/${c.slug}`}
                  className="font-body font-semibold text-white/90 text-sm leading-snug hover:text-white transition-colors"
                >
                  {c.title}
                </Link>
                <div className="mt-2 flex flex-wrap gap-1">
                  <span className="px-2 py-0.5 rounded-full bg-pathBlue-500/10 border border-pathBlue-500/20 text-pathBlue-400 font-body text-[10px] font-semibold">
                    {c.category}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full border font-body text-[10px] font-semibold ${
                    c.status === "open"
                      ? "bg-emerald-500/10 border-emerald-400/25 text-emerald-400"
                      : "bg-white/[0.04] border-white/[0.08] text-white/30"
                  }`}>
                    {c.status === "open" ? "Open" : "Closed"}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Programme details */}
          <Row label="Qualification">
            {typed.map(c => <Cell key={c.id}>{levelLabel(c.level)}</Cell>)}
          </Row>

          <Row label="Duration">
            {typed.map(c => (
              <Cell key={c.id} highlight={c.duration_months === minDuration}>
                <Clock className="w-3.5 h-3.5 mr-1.5 flex-shrink-0 text-white/30" />
                {c.duration_months} months
              </Cell>
            ))}
          </Row>

          <Row label="Study Mode">
            {typed.map(c => <Cell key={c.id}>{c.study_mode.replace("_", "-")}</Cell>)}
          </Row>

          <Row label="Tuition Fee">
            {typed.map(c => (
              <Cell key={c.id} highlight={c.tuition_fee === minFee}>
                <DollarSign className="w-3.5 h-3.5 mr-1 flex-shrink-0 text-white/30" />
                {fmtSGD(c.tuition_fee)}/yr
              </Cell>
            ))}
          </Row>

          <Row label="Application Fee">
            {typed.map(c => <Cell key={c.id}>{fmtSGD(c.application_fee)}</Cell>)}
          </Row>

          <Row label="Intake">
            {typed.map(c => (
              <Cell key={c.id}>
                <Calendar className="w-3.5 h-3.5 mr-1.5 flex-shrink-0 text-white/30" />
                {c.intake_date
                  ? new Date(c.intake_date).toLocaleDateString("en-SG", { month: "short", year: "numeric" })
                  : "TBC"}
              </Cell>
            ))}
          </Row>

          <Row label="Seats Left">
            {typed.map(c => {
              const left = Math.max(0, c.seats_total - c.seats_filled);
              return (
                <Cell key={c.id} highlight={left === maxSeats && left > 0}>
                  <Users className="w-3.5 h-3.5 mr-1.5 flex-shrink-0 text-white/30" />
                  {left} / {c.seats_total}
                </Cell>
              );
            })}
          </Row>

          <Row label="Internship">
            {typed.map(c => (
              <Cell key={c.id}>
                {c.internship_available ? (
                  <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {c.internship_duration_months ? `${c.internship_duration_months}mo` : "Included"}
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-white/25">
                    <XCircle className="w-3.5 h-3.5" /> No
                  </span>
                )}
              </Cell>
            ))}
          </Row>

          <Row label="College">
            {typed.map(c => (
              <Cell key={c.id}>
                <div>
                  <p className="text-white/75 font-semibold text-xs">{c.colleges?.name}</p>
                  <p className="text-white/30 text-[10px]">{c.colleges?.city}, {c.colleges?.country}</p>
                </div>
              </Cell>
            ))}
          </Row>

          {/* Apply row */}
          <div className={`grid ${colCount === 2 ? "grid-cols-[160px_1fr_1fr]" : "grid-cols-[160px_1fr_1fr_1fr]"} bg-white/[0.03] border-t border-white/[0.09]`}>
            <div className="p-4 text-white/40 font-body text-xs uppercase tracking-wider flex items-center">Apply</div>
            {typed.map(c => (
              <div key={c.id} className="p-4 border-l border-white/[0.06] space-y-2">
                <Link
                  href={`/signup?role=student&redirect=/dashboard/student/courses/${c.slug}`}
                  className="w-full flex items-center justify-center py-2.5 rounded-xl bg-gradient-to-r from-gold-500 to-gold-400 text-navy-900 font-body font-bold text-xs hover:shadow-gold-sm transition-all"
                >
                  Apply Now
                </Link>
                <Link
                  href={`/courses/${c.slug}`}
                  className="w-full flex items-center justify-center py-2 rounded-xl border border-white/[0.10] text-white/50 hover:text-white/75 font-body text-xs transition-all"
                >
                  View Details
                </Link>
              </div>
            ))}
          </div>
        </div>

        <p className="mt-4 text-center text-white/25 font-body text-xs">
          Highlighted values indicate the best option in each category.
        </p>
      </div>
    </main>
  );
}
