import { TIMELINE_STAGES, getStageMeta } from "@/types/timeline";
import type { ApplicationStage, ApplicationTimelineEvent } from "@/types/timeline";
import { CheckCircle2, Circle, AlertCircle, MessageSquare, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

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

  const currentStep = isOffPath ? -1 : (TIMELINE_STAGES.find(s => s.value === currentStage)?.step ?? 1);

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
          {!isOffPath && (
            <div className="text-right flex-shrink-0">
              <p className="text-white/30 font-body text-[10px]">Step</p>
              <p className="font-display text-2xl text-gold-400">{currentStep}<span className="text-white/30 text-sm font-body">/{TIMELINE_STAGES.length}</span></p>
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

      {/* Visual stage progress */}
      {!isOffPath && (
        <div className="overflow-x-auto pb-2">
          <div className="flex items-start min-w-max gap-0">
            {TIMELINE_STAGES.map((stage, i) => {
              const isComplete = currentStep > stage.step;
              const isCurrent  = currentStep === stage.step;
              const isLast     = i === TIMELINE_STAGES.length - 1;

              return (
                <div key={stage.value} className="flex items-start">
                  {/* Stage node */}
                  <div className="flex flex-col items-center w-[72px]">
                    <div className={cn(
                      "w-8 h-8 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all",
                      isComplete ? "bg-emerald-500 border-emerald-400"
                      : isCurrent ? "bg-gold-500 border-gold-300 ring-4 ring-gold-400/20 animate-pulse"
                      : "bg-white/[0.04] border-white/20"
                    )}>
                      {isComplete
                        ? <CheckCircle2 className="w-4 h-4 text-white" />
                        : <span className="font-display text-[10px] font-bold text-white/60">{stage.step}</span>
                      }
                    </div>
                    <p className={cn(
                      "font-body text-[9px] mt-1.5 text-center leading-tight w-[64px]",
                      isCurrent  ? "text-gold-400 font-semibold"
                      : isComplete ? "text-emerald-400/60"
                      : "text-white/20"
                    )}>
                      {stage.label}
                    </p>
                  </div>

                  {/* Connector */}
                  {!isLast && (
                    <div className={cn(
                      "h-0.5 w-4 mt-4 flex-shrink-0",
                      isComplete ? "bg-emerald-500/50" : "bg-white/[0.08]"
                    )} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

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
