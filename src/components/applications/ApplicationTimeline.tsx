import { getStageMeta } from "@/types/timeline";
import type { ApplicationStage, ApplicationTimelineEvent } from "@/types/timeline";
import { AlertCircle, MessageSquare, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import JourneyTracker from "@/components/student/JourneyTracker";
import { getActiveMilestone, STUDENT_MILESTONE_COUNT } from "@/lib/student-journey";

interface ApplicationTimelineProps {
  currentStage:   ApplicationStage;
  events?:        ApplicationTimelineEvent[];
  nextAction?:    string | null;
  studentMessage?: string | null;
}

export default function ApplicationTimeline({
  currentStage,
  events       = [],
  nextAction,
  studentMessage,
}: ApplicationTimelineProps) {
  const isRejected  = currentStage === "rejected";
  const isWithdrawn = currentStage === "withdrawn";
  const isOffPath   = isRejected || isWithdrawn;
  const currentMeta = getStageMeta(currentStage);

  // Student-facing milestone (1..10) for the simplified journey.
  const activeMilestone = isOffPath ? 0 : getActiveMilestone(currentStage);

  return (
    <div className="space-y-5">

      {/* Current stage hero */}
      <div className={cn(
        "p-4 rounded-2xl border",
        isRejected  ? "bg-red-500/[0.06] border-red-400/20" :
        isWithdrawn ? "bg-white/[0.03] border-white/[0.07]" :
                      "bg-gold-400/[0.06] border-gold-400/20"
      )}>
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <p className="text-white/40 font-body text-[10px] uppercase tracking-widest mb-1">Current Stage</p>
            <div className="flex items-center gap-2">
              <span className="text-xl">{currentMeta.emoji}</span>
              <p className="font-display text-lg text-white">{currentMeta.label}</p>
            </div>
            <p className="text-white/50 font-body text-xs mt-1">{currentMeta.description}</p>
          </div>
          {!isOffPath && activeMilestone > 0 && (
            <div className="text-right flex-shrink-0">
              <p className="text-white/30 font-body text-[10px]">Step</p>
              <p className="font-display text-2xl text-gold-400">{activeMilestone}<span className="text-white/30 text-sm font-body">/{STUDENT_MILESTONE_COUNT}</span></p>
            </div>
          )}
        </div>

        {/* Student message from institution/admin */}
        {studentMessage && (
          <div className="mt-3 p-3 rounded-xl bg-white/[0.05] border border-white/[0.08] flex items-start gap-2">
            <MessageSquare className="w-3.5 h-3.5 text-gold-400 flex-shrink-0 mt-0.5" />
            <p className="text-white/65 font-body text-xs leading-relaxed">{studentMessage}</p>
          </div>
        )}

        {/* Next action */}
        {nextAction && (
          <div className="mt-3 p-3 rounded-xl bg-gold-400/[0.08] border border-gold-400/25 flex items-start gap-2">
            <ArrowRight className="w-3.5 h-3.5 text-gold-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-gold-400 font-body text-[10px] uppercase tracking-wider font-semibold mb-0.5">Action Required</p>
              <p className="text-gold-300/80 font-body text-xs leading-relaxed">{nextAction}</p>
            </div>
          </div>
        )}
      </div>

      {/* Simplified 10-milestone student journey (replaces the internal
          operational stage strip — internal stages remain unchanged). */}
      {!isOffPath && <JourneyTracker currentStage={currentStage} />}

      {/* Rejected / withdrawn state */}
      {isOffPath && (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-red-500/[0.05] border border-red-400/20">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
          <div>
            <p className="font-body font-semibold text-sm text-red-400">{currentMeta.label}</p>
            <p className="font-body text-xs text-white/40 mt-0.5">{currentMeta.description}</p>
          </div>
        </div>
      )}

      {/* Timeline events log */}
      {events.length > 0 && (
        <div>
          <p className="text-white/35 font-body text-xs uppercase tracking-widest mb-3">Activity Log</p>
          <div className="space-y-2">
            {events.slice(0, 8).map((evt) => {
              const evtMeta = getStageMeta(evt.stage as ApplicationStage);
              return (
                <div key={evt.id} className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                  <span className="text-base flex-shrink-0 mt-0.5">{evtMeta.emoji}</span>
                  <div className="min-w-0">
                    <p className="font-body text-sm text-white/75 font-semibold">{evt.title}</p>
                    {evt.description && (
                      <p className="font-body text-xs text-white/40 mt-0.5 leading-relaxed">{evt.description}</p>
                    )}
                    <p className="font-body text-[10px] text-white/25 mt-1">
                      {new Date(evt.created_at).toLocaleDateString("en-SG", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
