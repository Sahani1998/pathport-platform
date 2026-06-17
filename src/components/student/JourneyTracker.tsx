// PathPort — Student Journey Tracker (Student portal only)
//
// Renders the simplified 10-milestone journey defined in @/lib/student-journey.
// It maps the internal application stage to a single student milestone and
// shows completed / current / upcoming states. It never touches internal
// stages, payments, or workflow logic — purely presentational.
//
//   completed → green + check
//   current   → blue + highlighted (pulse)
//   upcoming  → grey

import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ApplicationStage } from "@/types/timeline";
import {
  buildJourney,
  getActiveMilestone,
  isOffPathStage,
  STUDENT_MILESTONE_COUNT,
} from "@/lib/student-journey";

interface JourneyTrackerProps {
  currentStage: ApplicationStage;
  className?:   string;
}

export default function JourneyTracker({ currentStage, className }: JourneyTrackerProps) {
  // Off-path (rejected / withdrawn) has no journey — callers render their own
  // rejection/withdrawal state.
  if (isOffPathStage(currentStage)) return null;

  const milestones = buildJourney(currentStage);
  const activeStep = getActiveMilestone(currentStage);

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between">
        <p className="text-white/40 font-body text-[10px] uppercase tracking-widest">Your Journey</p>
        {activeStep > 0 && (
          <p className="font-body text-xs font-semibold text-pathBlue-400">
            Step {activeStep} of {STUDENT_MILESTONE_COUNT}
          </p>
        )}
      </div>

      <div className="overflow-x-auto pb-2">
        <div className="flex items-start min-w-max gap-0">
          {milestones.map((m, i) => {
            const isLast = i === milestones.length - 1;
            return (
              <div key={m.step} className="flex items-start">
                {/* Milestone node */}
                <div className="flex flex-col items-center w-[76px]">
                  <div className={cn(
                    "w-8 h-8 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all",
                    m.state === "completed" ? "bg-emerald-500 border-emerald-400"
                    : m.state === "current" ? "bg-pathBlue-500 border-pathBlue-300 ring-4 ring-pathBlue-400/25 animate-pulse"
                    : "bg-white/[0.05] border-white/20",
                  )}>
                    {m.state === "completed"
                      ? <CheckCircle2 className="w-4 h-4 text-white" />
                      : <span className={cn(
                          "font-display text-[10px] font-bold",
                          m.state === "current" ? "text-white" : "text-white/40",
                        )}>{m.step}</span>}
                  </div>
                  <p className={cn(
                    "font-body text-[9px] mt-1.5 text-center leading-tight w-[68px]",
                    m.state === "current"   ? "text-pathBlue-400 font-semibold"
                    : m.state === "completed" ? "text-emerald-400/70"
                    : "text-white/25",
                  )}>
                    {m.label}
                  </p>
                </div>

                {/* Connector */}
                {!isLast && (
                  <div className={cn(
                    "h-0.5 w-5 mt-4 flex-shrink-0",
                    m.state === "completed" ? "bg-emerald-500/50" : "bg-white/[0.08]",
                  )} />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
