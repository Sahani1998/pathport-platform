import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import ApplyButton from "@/components/courses/ApplyButton";
import type { CourseWithCollege } from "@/types/courses";
import {
  ArrowLeft, Building2, Clock, Calendar, Users,
  DollarSign, BookOpen, Globe, CheckCircle2, Info,
} from "lucide-react";

function fmtSGD(n: number) {
  return `S$${n.toLocaleString("en-SG")}`;
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

  const course = data as CourseWithCollege;

  // Check if student has already applied
  const { data: existingApp } = await supabase
    .from("applications")
    .select("id, status")
    .eq("student_id", user.id)
    .eq("course_id", course.id)
    .maybeSingle();

  const hasApplied  = !!existingApp;
  const seatsLeft   = course.seats_total - course.seats_filled;
  const fillPct     = Math.round((course.seats_filled / course.seats_total) * 100);

  return (
    <div className="max-w-5xl space-y-6">

      {/* Back */}
      <Link href="/dashboard/student/courses" className="inline-flex items-center gap-2 text-white/40 hover:text-white/70 font-body text-sm transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to courses
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Main content */}
        <div className="lg:col-span-2 space-y-5">

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
          </div>

          {/* Quick facts */}
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
                    : "TBC"
                },
                { icon: DollarSign, label: "Tuition",     value: fmtSGD(course.tuition_fee)     },
                { icon: DollarSign, label: "App. Fee",     value: fmtSGD(course.application_fee) },
                { icon: Users,      label: "Seats Left",  value: `${Math.max(0, seatsLeft)} / ${course.seats_total}` },
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

            {/* Seat fill bar */}
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

          {/* About college */}
          <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-6">
            <h2 className="font-display text-xl text-white mb-3">About {course.colleges?.name}</h2>
            <p className="text-white/55 font-body text-sm leading-relaxed mb-4">
              {(course.colleges as unknown as Record<string, string>)?.description ??
               "One of Singapore's leading EduTrust-certified private education institutions."}
            </p>
            <div className="flex flex-wrap gap-3">
              {[
                { icon: Globe,     text: `${(course.colleges as unknown as Record<string,string>)?.city ?? "Singapore"}, Singapore` },
                { icon: CheckCircle2, text: "EduTrust Certified"  },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-1.5 text-white/45 font-body text-xs">
                  <Icon className="w-3.5 h-3.5 text-gold-400/60" />
                  {text}
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

        {/* Sidebar */}
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

          {/* Contact */}
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
