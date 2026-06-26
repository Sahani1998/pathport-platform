import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin-client";
import { Building2, BookOpen, Globe, ChevronRight } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

interface College {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  country: string;
  city: string;
  description: string | null;
  website: string | null;
  is_active: boolean;
  courses: Course[];
}

interface Course {
  id: string;
  title: string;
  category: string;
  level: string;
  duration_months: number;
  tuition_fee: number;
  application_fee: number;
  status: string;
  study_mode: string;
  intake_date: string | null;
  seats_total: number;
  seats_filled: number;
}

export default async function PartnerInstitutionsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "recruitment_partner") redirect("/dashboard");

  const db = createAdminClient();
  const { data: collegesRaw } = await db
    .from("colleges")
    .select(`
      id, name, slug, logo_url, country, city, description, website, is_active,
      courses ( id, title, category, level, duration_months, tuition_fee, application_fee, status, study_mode, intake_date, seats_total, seats_filled )
    `)
    .eq("is_active", true)
    .order("name", { ascending: true });

  const colleges: College[] = (collegesRaw ?? []).map((c: Record<string,unknown>) => ({
    id:          c.id as string,
    name:        c.name as string,
    slug:        c.slug as string,
    logo_url:    c.logo_url as string | null,
    country:     c.country as string,
    city:        c.city as string,
    description: c.description as string | null,
    website:     c.website as string | null,
    is_active:   c.is_active as boolean,
    courses: ((c.courses as Record<string,unknown>[]) ?? []).map(cr => ({
      id:              cr.id as string,
      title:           cr.title as string,
      category:        cr.category as string,
      level:           cr.level as string,
      duration_months: cr.duration_months as number,
      tuition_fee:     cr.tuition_fee as number,
      application_fee: cr.application_fee as number,
      status:          cr.status as string,
      study_mode:      cr.study_mode as string,
      intake_date:     cr.intake_date as string | null,
      seats_total:     cr.seats_total as number,
      seats_filled:    cr.seats_filled as number,
    })),
  }));

  const fmtSGD = (n: number) =>
    n.toLocaleString("en-SG", { style: "currency", currency: "SGD", maximumFractionDigits: 0 });

  const levelLabel: Record<string, string> = {
    diploma:          "Diploma",
    advanced_diploma: "Advanced Diploma",
    graduate_diploma: "Graduate Diploma",
    certificate:      "Certificate",
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div>
        <h2 className="font-display text-3xl text-white mb-1 flex items-center gap-3">
          <Building2 className="w-7 h-7 text-gold-400" />
          Partner Institutions
        </h2>
        <p className="text-white/45 font-body text-sm">
          {colleges.length} Singapore institutions and their available programmes
        </p>
      </div>

      {/* Colleges */}
      <div className="space-y-6">
        {colleges.map(college => {
          const openCourses = college.courses.filter(c => c.status === "open");
          return (
            <div key={college.id} className="bg-white/[0.04] border border-white/[0.08] rounded-2xl overflow-hidden">
              {/* College header */}
              <div className="px-6 py-5 border-b border-white/[0.07] flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-white/[0.08] border border-white/10 flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-5 h-5 text-white/40" />
                  </div>
                  <div>
                    <h3 className="font-display text-xl text-white mb-0.5">{college.name}</h3>
                    <p className="text-white/40 font-body text-sm">{college.city}, {college.country}</p>
                    {college.description && (
                      <p className="text-white/35 font-body text-xs mt-1.5 line-clamp-2 max-w-lg">{college.description}</p>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  <span className="px-2.5 py-1 rounded-full bg-gold-400/10 border border-gold-400/20 text-gold-400 font-body text-xs font-semibold">
                    {openCourses.length} open course{openCourses.length !== 1 ? "s" : ""}
                  </span>
                  {college.website && (
                    <a
                      href={college.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-pathBlue-400 hover:text-pathBlue-300 font-body text-xs transition-colors"
                    >
                      <Globe className="w-3 h-3" /> Website
                    </a>
                  )}
                </div>
              </div>

              {/* Courses */}
              {openCourses.length === 0 ? (
                <div className="px-6 py-4 text-white/30 font-body text-sm">No open programmes at this time.</div>
              ) : (
                <div className="divide-y divide-white/[0.05]">
                  {openCourses.map(course => {
                    const seatsLeft = course.seats_total - course.seats_filled;
                    const seatsColor = seatsLeft <= 5 ? "text-red-400" : seatsLeft <= 10 ? "text-gold-400" : "text-emerald-400";
                    return (
                      <div key={course.id} className="px-6 py-4 flex flex-wrap items-start justify-between gap-3 hover:bg-white/[0.02] transition-colors">
                        <div className="flex items-start gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-pathBlue-500/15 border border-pathBlue-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <BookOpen className="w-3.5 h-3.5 text-pathBlue-400" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-body font-semibold text-sm text-white/85">{course.title}</p>
                            <div className="flex flex-wrap items-center gap-2 mt-1">
                              <span className="text-white/40 font-body text-xs">{levelLabel[course.level] ?? course.level}</span>
                              <span className="text-white/20">·</span>
                              <span className="text-white/40 font-body text-xs">{course.duration_months} months</span>
                              <span className="text-white/20">·</span>
                              <span className="text-white/40 font-body text-xs capitalize">{course.study_mode.replace("_", " ")}</span>
                            </div>
                            {course.intake_date && (
                              <p className="text-white/30 font-body text-xs mt-0.5">
                                Next intake: {new Date(course.intake_date).toLocaleDateString("en-SG", { day: "numeric", month: "long", year: "numeric" })}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1 flex-shrink-0">
                          <p className="font-display text-lg text-white font-bold">{fmtSGD(course.tuition_fee)}</p>
                          <p className="text-white/35 font-body text-xs">tuition fee</p>
                          <p className={`font-body text-xs font-semibold ${seatsColor}`}>
                            {seatsLeft} seat{seatsLeft !== 1 ? "s" : ""} left
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
