import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Briefcase, CheckCircle2, Clock, ArrowRight, AlertCircle, Building2 } from "lucide-react";
import type { ApplicationStage } from "@/types/timeline";
import { getStageMeta } from "@/types/timeline";
import ApplicationStageBadge from "@/components/applications/ApplicationStageBadge";

function stageStep(stage: ApplicationStage): number {
  return getStageMeta(stage).step;
}

const INTERNSHIP_STEPS: {
  title:  string;
  desc:   string;
  doneAt: ApplicationStage;
}[] = [
  { title: "Enrolled",               desc: "Complete enrollment in your programme.",                    doneAt: "enrolled"            },
  { title: "Internship Eligible",    desc: "PathPort confirms your eligibility for internship placement.", doneAt: "internship_eligible" },
  { title: "Internship Preparation", desc: "Your advisor coordinates your internship placement.",        doneAt: "completed"           },
  { title: "Internship Completed",   desc: "Graduate with a diploma and real-world work experience.",    doneAt: "completed"           },
];

export default async function StudentInternshipsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: appRow } = await supabase
    .from("applications")
    .select(`
      id, current_stage,
      courses (
        title, internship_available, internship_duration_months,
        estimated_internship_allowance,
        colleges ( name )
      )
    `)
    .eq("student_id", user.id)
    .not("current_stage", "in", '("rejected","withdrawn")')
    .order("submitted_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  type RawCourse = {
    title: string;
    internship_available: boolean | null;
    internship_duration_months: number | null;
    estimated_internship_allowance: number | null;
    colleges: { name: string } | { name: string }[] | null;
  } | null;

  const rawCourse = appRow
    ? (Array.isArray(appRow.courses) ? appRow.courses[0] : appRow.courses) as RawCourse
    : null;
  const rawCollege  = rawCourse ? (Array.isArray(rawCourse.colleges) ? rawCourse.colleges[0] : rawCourse.colleges) : null;
  const courseName  = rawCourse?.title ?? null;
  const collegeName = rawCollege?.name ?? null;
  const internshipAvailable   = rawCourse?.internship_available ?? null;
  const internshipDuration    = rawCourse?.internship_duration_months ?? 6;
  const internshipAllowance   = rawCourse?.estimated_internship_allowance ?? null;

  const currentStage  = (appRow?.current_stage ?? null) as ApplicationStage | null;
  const currentStep   = currentStage ? stageStep(currentStage) : 0;

  const isEligible  = currentStep >= stageStep("internship_eligible");
  const isEnrolled  = currentStep >= stageStep("enrolled");
  const isCompleted = currentStep >= stageStep("completed");

  function fmtSGD(n: number) {
    return `S$${n.toLocaleString("en-SG")}`;
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="font-display text-3xl text-white mb-1">Internships</h2>
        <p className="text-white/40 font-body text-sm">Paid internship placements in Singapore</p>
      </div>

      {/* Status banner */}
      {currentStage ? (
        <div className={`p-5 rounded-2xl border ${
          isCompleted
            ? "bg-gradient-to-br from-gold-500/10 to-transparent border-gold-400/20"
            : isEligible
              ? "bg-gradient-to-br from-emerald-500/10 to-transparent border-emerald-400/20"
              : isEnrolled
                ? "bg-gradient-to-br from-pathBlue-600/15 to-transparent border-pathBlue-500/20"
                : "bg-white/[0.03] border-white/[0.07]"
        }`}>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              {courseName && (
                <p className="font-body text-xs text-white/40 mb-1.5 flex items-center gap-1.5">
                  <Building2 className="w-3 h-3" />
                  {collegeName ? `${collegeName} · ` : ""}{courseName}
                </p>
              )}
              <p className={`font-body text-sm font-semibold ${
                isCompleted ? "text-gold-400" : isEligible ? "text-emerald-400" : "text-white/75"
              }`}>
                {isCompleted
                  ? "Programme completed — congratulations! 🏁"
                  : isEligible
                    ? "You are eligible for internship placement! 💼"
                    : isEnrolled
                      ? "Internship placement begins after 6 months of study."
                      : "Internships are available after you enroll in your programme."}
              </p>
              {isEligible && !isCompleted && (
                <p className="font-body text-xs text-white/50 mt-1">
                  Your PathPort advisor is matching you with host companies. We&apos;ll contact you shortly.
                </p>
              )}
            </div>
            <ApplicationStageBadge stage={currentStage} size="sm" />
          </div>
        </div>
      ) : (
        <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.07] flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-white/30 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-body text-sm text-white/65 font-semibold mb-1">No active application</p>
            <p className="font-body text-xs text-white/40">Apply to a course that includes internship placement to get started.</p>
            <Link href="/dashboard/student/courses" className="inline-flex items-center gap-1.5 mt-3 text-gold-400 font-body text-xs font-semibold hover:text-gold-300 transition-colors">
              Browse courses <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}

      {/* Programme details (from course) */}
      {internshipAvailable && (
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Monthly allowance",   value: internshipAllowance ? fmtSGD(internshipAllowance) : "S$800 – S$1,500" },
            { label: "Duration",            value: `${internshipDuration} months`                                         },
            { label: "Industries",          value: "IT, Business, Hospitality & more"                                    },
            { label: "Placement support",   value: "Fully managed by PathPort"                                           },
          ].map(({ label, value }) => (
            <div key={label} className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.07]">
              <p className="font-body text-[10px] text-white/35 uppercase tracking-wider mb-1">{label}</p>
              <p className="font-body text-sm font-semibold text-white/80">{value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Pathway steps */}
      <div>
        <p className="font-body text-xs text-white/35 uppercase tracking-wider mb-3">Your Pathway</p>
        <div className="space-y-3">
          {(() => {
            const stepDone     = INTERNSHIP_STEPS.map(s => currentStep >= stageStep(s.doneAt));
            const firstNotDone = stepDone.findIndex(d => !d);

            return INTERNSHIP_STEPS.map((step, i) => {
              const isDone = stepDone[i];
              const isNow  = !isDone && i === firstNotDone;

              return (
              <div
                key={i}
                className={`flex items-start gap-4 p-4 rounded-xl border transition-all ${
                  isDone
                    ? "bg-emerald-500/[0.06] border-emerald-400/20"
                    : isNow
                      ? "bg-gold-400/[0.06] border-gold-400/20"
                      : "bg-white/[0.03] border-white/[0.07]"
                }`}
              >
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  isDone ? "bg-emerald-500/20 border border-emerald-400/30"
                         : isNow ? "bg-gold-400/15 border border-gold-400/30"
                                 : "bg-white/[0.05] border border-white/10"
                }`}>
                  {isDone
                    ? <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    : isNow
                      ? <Clock className="w-4 h-4 text-gold-400" />
                      : <span className="font-body text-xs text-white/30 font-bold">{i + 1}</span>}
                </div>
                <div>
                  <p className={`font-body text-sm font-semibold ${
                    isDone ? "text-white/80" : isNow ? "text-white/85" : "text-white/40"
                  }`}>
                    {step.title}
                    {isDone && <span className="ml-2 text-emerald-400 text-[10px] font-semibold uppercase tracking-wider">Done</span>}
                    {isNow  && <span className="ml-2 text-gold-400 text-[10px] font-semibold uppercase tracking-wider">Now</span>}
                  </p>
                  <p className={`font-body text-xs mt-0.5 ${isDone || isNow ? "text-white/45" : "text-white/25"}`}>{step.desc}</p>
                </div>
              </div>
            );
          });
          })()}
        </div>
      </div>

      {/* CTA — only visible when not yet eligible */}
      {!isEligible && !currentStage && (
        <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.07] text-center space-y-3">
          <Briefcase className="w-8 h-8 text-gold-400/50 mx-auto" />
          <p className="font-body text-sm text-white/60">
            Browse courses that include 6-month paid internship placements.
          </p>
          <Link
            href="/dashboard/student/courses"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gold-400/15 border border-gold-400/30 text-gold-400 font-body text-sm font-semibold hover:bg-gold-400/25 transition-all"
          >
            Browse Courses <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {/* Advisor contact */}
      <div className="flex flex-col items-center gap-3 p-6 rounded-2xl bg-white/[0.03] border border-white/[0.07]">
        <p className="text-white/50 font-body text-sm text-center">
          {isEligible
            ? "Ready to match with an employer? Talk to your advisor."
            : "Questions about internship placements?"}
        </p>
        <a
          href="https://wa.me/6583776492"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-400/25 text-emerald-400 font-body text-sm font-semibold hover:bg-emerald-500/20 transition-all"
        >
          💬 Talk to your advisor
        </a>
      </div>
    </div>
  );
}
