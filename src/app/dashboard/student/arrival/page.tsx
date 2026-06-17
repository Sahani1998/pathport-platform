import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Globe, CheckCircle2, Clock, Plane, GraduationCap, Briefcase, AlertCircle } from "lucide-react";
import type { ApplicationStage } from "@/types/timeline";
import { getStageMeta } from "@/types/timeline";
import ApplicationStageBadge from "@/components/applications/ApplicationStageBadge";

const ARRIVAL_STEPS: {
  title:      string;
  desc:       string;
  activeFrom: ApplicationStage;
  doneFrom:   ApplicationStage;
}[] = [
  {
    title:      "Flight & Visa Assistance",
    desc:       "PathPort handles your student pass documentation and coordinates with ICA.",
    activeFrom: "approved",
    doneFrom:   "arrived_singapore",
  },
  {
    title:      "Airport Pickup",
    desc:       "A PathPort representative will meet you at Changi Airport.",
    activeFrom: "arrival_preparation",
    doneFrom:   "arrived_singapore",
  },
  {
    title:      "Accommodation",
    desc:       "We arrange temporary housing or connect you with student accommodation partners.",
    activeFrom: "arrival_preparation",
    doneFrom:   "arrived_singapore",
  },
  {
    title:      "College Orientation",
    desc:       "Attend your college's orientation programme and meet your classmates.",
    activeFrom: "arrived_singapore",
    doneFrom:   "enrolled",
  },
  {
    title:      "SIM Card & Bank Account",
    desc:       "Get a local SIM and open a bank account — we guide you through both.",
    activeFrom: "arrived_singapore",
    doneFrom:   "enrolled",
  },
  {
    title:      "Internship Onboarding",
    desc:       "After 6 months of study, your internship placement begins.",
    activeFrom: "enrolled",
    doneFrom:   "internship_eligible",
  },
];

// Steps are ordered by their step number in STAGE_META
function stageStep(stage: ApplicationStage): number {
  return getStageMeta(stage).step;
}

export default async function StudentArrivalPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: appRow } = await supabase
    .from("applications")
    .select(`
      id, current_stage,
      courses ( title, colleges ( name ) )
    `)
    .eq("student_id", user.id)
    .not("current_stage", "in", '("rejected","withdrawn")')
    .order("submitted_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  type RawCourse = { title: string; colleges: { name: string } | { name: string }[] | null } | null;
  const rawCourse = appRow ? (Array.isArray(appRow.courses) ? appRow.courses[0] : appRow.courses) as RawCourse : null;
  const rawCollege = rawCourse ? (Array.isArray(rawCourse.colleges) ? rawCourse.colleges[0] : rawCourse.colleges) : null;
  const courseName  = rawCourse?.title ?? null;
  const collegeName = rawCollege?.name ?? null;

  const currentStage = (appRow?.current_stage ?? null) as ApplicationStage | null;
  const currentStep  = currentStage ? stageStep(currentStage) : 0;

  // Stages at or beyond arrival_preparation
  const isArrivalActive = currentStep >= stageStep("arrival_preparation");
  const hasArrived      = currentStep >= stageStep("arrived_singapore");
  const isEnrolled      = currentStep >= stageStep("enrolled");

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="font-display text-3xl text-white mb-1">Arrival Services</h2>
        <p className="text-white/40 font-body text-sm">Your white-glove support when you land in Singapore</p>
      </div>

      {/* Current stage banner */}
      {currentStage ? (
        <div className={`p-5 rounded-2xl border ${
          isEnrolled
            ? "bg-gradient-to-br from-emerald-500/10 to-transparent border-emerald-400/20"
            : isArrivalActive
              ? "bg-gradient-to-br from-gold-500/10 to-transparent border-gold-400/20"
              : "bg-gradient-to-br from-pathBlue-600/15 to-transparent border-pathBlue-500/20"
        }`}>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              {courseName && (
                <p className="font-body text-xs text-white/40 mb-1">
                  {collegeName ? `${collegeName} · ` : ""}{courseName}
                </p>
              )}
              <p className="text-white/70 font-body text-sm">
                {isEnrolled
                  ? "You are enrolled and your Singapore journey is underway!"
                  : hasArrived
                    ? "You've arrived in Singapore! Complete orientation to get enrolled."
                    : isArrivalActive
                      ? "Your arrival is being coordinated. Check below for your next steps."
                      : "Arrival services are activated once your IPA is approved and arrival preparation begins."}
              </p>
            </div>
            <ApplicationStageBadge stage={currentStage} size="sm" />
          </div>
        </div>
      ) : (
        <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.07] flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-white/30 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-body text-sm text-white/65 font-semibold mb-1">No active application</p>
            <p className="font-body text-xs text-white/40">
              Apply to a course to begin your Singapore journey.
            </p>
            <Link href="/dashboard/student/courses" className="inline-flex items-center gap-1.5 mt-3 text-gold-400 font-body text-xs font-semibold hover:text-gold-300 transition-colors">
              Browse courses →
            </Link>
          </div>
        </div>
      )}

      {/* Arrival checklist */}
      <div className="space-y-3">
        {ARRIVAL_STEPS.map((step, i) => {
          const activeStep = stageStep(step.activeFrom);
          const doneStep   = stageStep(step.doneFrom);
          const isDone     = currentStep >= doneStep;
          const isActive   = !isDone && currentStep >= activeStep;
          const isPending  = !isDone && !isActive;

          return (
            <div
              key={i}
              className={`flex items-start gap-4 p-4 rounded-xl border transition-all ${
                isDone
                  ? "bg-emerald-500/[0.06] border-emerald-400/20"
                  : isActive
                    ? "bg-gold-400/[0.06] border-gold-400/20"
                    : "bg-white/[0.03] border-white/[0.07]"
              }`}
            >
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                isDone
                  ? "bg-emerald-500/20 border border-emerald-400/30"
                  : isActive
                    ? "bg-gold-400/15 border border-gold-400/30"
                    : "bg-white/[0.05] border border-white/10"
              }`}>
                {isDone
                  ? <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  : isActive
                    ? <Clock className="w-4 h-4 text-gold-400" />
                    : <span className="font-body text-xs text-white/30 font-bold">{i + 1}</span>}
              </div>
              <div>
                <p className={`font-body text-sm font-semibold ${
                  isDone ? "text-white/80" : isActive ? "text-white/85" : "text-white/45"
                }`}>
                  {step.title}
                  {isDone && <span className="ml-2 text-emerald-400 text-[10px] font-semibold uppercase tracking-wider">Done</span>}
                  {isActive && <span className="ml-2 text-gold-400 text-[10px] font-semibold uppercase tracking-wider">In progress</span>}
                </p>
                <p className={`font-body text-xs mt-0.5 ${
                  isDone ? "text-white/45" : isActive ? "text-white/50" : "text-white/30"
                }`}>
                  {step.desc}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Journey milestones */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: Plane,          label: "Arrived",  done: hasArrived,  stage: "arrived_singapore" as ApplicationStage },
          { icon: GraduationCap,  label: "Enrolled", done: isEnrolled,  stage: "enrolled"          as ApplicationStage },
          { icon: Briefcase,      label: "Internship", done: currentStep >= stageStep("internship_eligible"), stage: "internship_eligible" as ApplicationStage },
        ].map(({ icon: Icon, label, done }) => (
          <div
            key={label}
            className={`flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border text-center ${
              done
                ? "bg-emerald-500/[0.06] border-emerald-400/20"
                : "bg-white/[0.03] border-white/[0.07]"
            }`}
          >
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
              done ? "bg-emerald-500/15 border border-emerald-400/25" : "bg-white/[0.05] border border-white/10"
            }`}>
              <Icon className={`w-4 h-4 ${done ? "text-emerald-400" : "text-white/25"}`} />
            </div>
            <p className={`font-body text-xs font-semibold ${done ? "text-emerald-400" : "text-white/30"}`}>{label}</p>
            {done && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
          </div>
        ))}
      </div>

      {/* Contact */}
      <div className="flex flex-col items-center gap-3 p-6 rounded-2xl bg-white/[0.03] border border-white/[0.07]">
        <Globe className="w-8 h-8 text-gold-400/50" />
        <p className="text-white/50 font-body text-sm text-center">Questions about arriving in Singapore?</p>
        <a
          href="https://wa.me/6583776492"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-400/25 text-emerald-400 font-body text-sm font-semibold hover:bg-emerald-500/20 transition-all"
        >
          💬 WhatsApp your advisor
        </a>
      </div>
    </div>
  );
}
