"use client";

import { useState, useMemo } from "react";
import { STAGE_META, TIMELINE_STAGES } from "@/types/timeline";
import type { ApplicationStage } from "@/types/timeline";
import { ALLOWED_TRANSITIONS } from "@/lib/application-workflow";
import { Loader2, ChevronDown, Save, AlertTriangle, Info } from "lucide-react";

interface StageUpdateSelectProps {
  applicationId: string;
  currentStage:  ApplicationStage;
  onUpdated?:    (newStage: ApplicationStage) => void;
  compact?:      boolean;
}

const HAPPY_PATH: ApplicationStage[] = TIMELINE_STAGES.map(s => s.value);
const PAYMENT_GATES: ApplicationStage[] = ["fee_payment_pending", "tuition_fee_payment_pending"];

function getStep(stage: ApplicationStage): number {
  return STAGE_META.find(s => s.value === stage)?.step ?? -1;
}

type JumpType = "same" | "direct" | "forward_skip" | "backward" | "off_path";

function classifySelection(from: ApplicationStage, to: ApplicationStage): JumpType {
  if (from === to) return "same";
  if (to === "rejected" || to === "withdrawn") return "off_path";
  const fromStep = getStep(from);
  const toStep   = getStep(to);
  if (toStep < fromStep) return "backward";
  if ((ALLOWED_TRANSITIONS[from] ?? []).includes(to)) return "direct";
  return "forward_skip";
}

function getSkippedStages(from: ApplicationStage, to: ApplicationStage): ApplicationStage[] {
  const fromIdx = HAPPY_PATH.indexOf(from);
  const toIdx   = HAPPY_PATH.indexOf(to);
  if (fromIdx < 0 || toIdx <= fromIdx + 1) return [];
  return HAPPY_PATH.slice(fromIdx + 1, toIdx);
}

export default function StageUpdateSelect({
  applicationId,
  currentStage,
  onUpdated,
  compact = false,
}: StageUpdateSelectProps) {
  const [stage,          setStage]          = useState<ApplicationStage>(currentStage);
  const [studentMessage, setStudentMessage] = useState("");
  const [internalNotes,  setInternalNotes]  = useState("");
  const [nextAction,     setNextAction]     = useState("");
  const [loading,        setLoading]        = useState(false);
  const [error,          setError]          = useState<string | null>(null);
  const [saved,          setSaved]          = useState(false);
  const [advancedMode,   setAdvancedMode]   = useState(false);
  const [confirmed,      setConfirmed]      = useState(false);

  const INPUT        = "w-full bg-white/[0.06] border border-white/[0.10] rounded-xl px-3 py-2 font-body text-sm text-white placeholder-white/25 focus:outline-none focus:border-gold-400/60 transition-all resize-none [color-scheme:dark]";
  const OPTION_STYLE = { backgroundColor: "#0a1024", color: "#fff" } as const;

  const currentStep = getStep(currentStage);
  const allowedSet  = useMemo(() => new Set<ApplicationStage>(ALLOWED_TRANSITIONS[currentStage] ?? []), [currentStage]);

  // Normal mode options: current + allowed transitions
  const normalOptions = useMemo(
    () => STAGE_META.filter(s => s.value === currentStage || allowedSet.has(s.value)),
    [currentStage, allowedSet],
  );

  // Advanced mode option groups
  const forwardDirect = useMemo(
    () => HAPPY_PATH.filter(s => allowedSet.has(s) && getStep(s) > currentStep),
    [allowedSet, currentStep],
  );
  const forwardSkip = useMemo(
    () => HAPPY_PATH.filter(s => !allowedSet.has(s) && getStep(s) > currentStep),
    [allowedSet, currentStep],
  );
  const backward = useMemo(
    () => HAPPY_PATH.filter(s => allowedSet.has(s) && getStep(s) < currentStep),
    [allowedSet, currentStep],
  );
  const offPath = useMemo(
    () => (["rejected", "withdrawn"] as ApplicationStage[]).filter(s => allowedSet.has(s)),
    [allowedSet],
  );

  const hasAdvancedOptions = forwardSkip.length > 0;

  // Jump analysis for currently selected stage
  const jumpType     = classifySelection(currentStage, stage);
  const skippedStages = useMemo(
    () => (jumpType === "forward_skip" ? getSkippedStages(currentStage, stage) : []),
    [jumpType, currentStage, stage],
  );
  const hasPaymentGate   = skippedStages.some(s => PAYMENT_GATES.includes(s));
  const needsConfirmation = (jumpType === "forward_skip" || jumpType === "backward") && stage !== currentStage;
  const saveDisabled      = loading || stage === currentStage || (needsConfirmation && !confirmed);

  const handleStageChange = (newStage: ApplicationStage) => {
    setStage(newStage);
    setConfirmed(false);
    setError(null);
  };

  const handleToggleAdvanced = () => {
    setAdvancedMode(prev => !prev);
    setStage(currentStage);
    setConfirmed(false);
    setError(null);
  };

  const handleSave = async () => {
    setLoading(true);
    setError(null);
    setSaved(false);

    const controller = new AbortController();
    const timeoutId  = setTimeout(() => controller.abort(), 12_000);

    try {
      const res = await fetch(`/api/applications/${applicationId}/stage`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          stage,
          student_message:    studentMessage.trim() || null,
          internal_notes:     internalNotes.trim()  || null,
          next_action:        nextAction.trim()      || null,
          skip_intermediates: jumpType === "forward_skip",
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const json = await res.json() as { error?: string };

      if (!res.ok) {
        setError(json.error ?? `Server error (${res.status})`);
        return;
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      onUpdated?.(stage);
    } catch (err: unknown) {
      clearTimeout(timeoutId);
      const isTimeout = err instanceof Error && err.name === "AbortError";
      setError(
        isTimeout
          ? "Request timed out. Please try again."
          : err instanceof Error ? err.message : "Network error",
      );
    } finally {
      setLoading(false);
    }
  };

  // ── Compact mode (admin table inline) ────────────────────────────────────────
  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <div className="relative">
          <select
            value={stage}
            onChange={e => setStage(e.target.value as ApplicationStage)}
            className="bg-white/[0.06] border border-white/[0.10] rounded-xl pl-3 pr-8 py-1.5 font-body text-xs text-white appearance-none cursor-pointer focus:outline-none focus:border-gold-400/50 transition-all [color-scheme:dark] [&>option]:bg-navy-800"
          >
            {normalOptions.map(s => (
              <option key={s.value} value={s.value} style={OPTION_STYLE}>{s.emoji} {s.label}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30 pointer-events-none" />
        </div>
        <button
          onClick={handleSave}
          disabled={loading || stage === currentStage}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gold-400/15 border border-gold-400/30 text-gold-400 font-body text-xs font-semibold hover:bg-gold-400/25 transition-all disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : saved ? "Saved ✓" : <><Save className="w-3.5 h-3.5" /> Save</>}
        </button>
        {error && <p className="text-red-400 font-body text-xs">{error}</p>}
      </div>
    );
  }

  // ── Full mode (institution application detail) ────────────────────────────────
  const stageLabelFor = (s: ApplicationStage) => {
    const meta = STAGE_META.find(m => m.value === s);
    return meta ? `${meta.emoji} ${meta.label}` : s;
  };

  const currentMeta = STAGE_META.find(s => s.value === currentStage);

  return (
    <div className="space-y-4 p-5 bg-white/[0.03] border border-white/[0.07] rounded-2xl">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-lg text-white">Update Application Stage</h3>
        {hasAdvancedOptions && (
          <button
            type="button"
            onClick={handleToggleAdvanced}
            className={`font-body text-xs px-2.5 py-1 rounded-lg border transition-all ${
              advancedMode
                ? "bg-amber-400/15 border-amber-400/35 text-amber-300"
                : "border-white/[0.10] text-white/40 hover:text-white/60 hover:border-white/20"
            }`}
          >
            {advancedMode ? "⏩ Advanced" : "Advanced"}
          </button>
        )}
      </div>

      {/* Stage select */}
      <div>
        <label className="text-white/45 font-body text-xs uppercase tracking-wider mb-1.5 block">New Stage</label>
        <div className="relative">
          <select
            value={stage}
            onChange={e => handleStageChange(e.target.value as ApplicationStage)}
            className={INPUT + " [&>option]:bg-navy-800"}
          >
            {!advancedMode ? (
              normalOptions.map(s => (
                <option key={s.value} value={s.value} style={OPTION_STYLE}>{s.emoji} {s.label}</option>
              ))
            ) : (
              <>
                <option value={currentStage} style={OPTION_STYLE}>
                  {currentMeta?.emoji} {currentMeta?.label} (current)
                </option>

                {forwardDirect.length > 0 && (
                  <optgroup label="Direct Next">
                    {forwardDirect.map(s => (
                      <option key={s} value={s} style={OPTION_STYLE}>{stageLabelFor(s)}</option>
                    ))}
                  </optgroup>
                )}

                {forwardSkip.length > 0 && (
                  <optgroup label="Skip Forward">
                    {forwardSkip.map(s => (
                      <option key={s} value={s} style={OPTION_STYLE}>{stageLabelFor(s)}</option>
                    ))}
                  </optgroup>
                )}

                {backward.length > 0 && (
                  <optgroup label="Move Back">
                    {backward.map(s => (
                      <option key={s} value={s} style={OPTION_STYLE}>{stageLabelFor(s)}</option>
                    ))}
                  </optgroup>
                )}

                {offPath.length > 0 && (
                  <optgroup label="Off-Path">
                    {offPath.map(s => (
                      <option key={s} value={s} style={OPTION_STYLE}>{stageLabelFor(s)}</option>
                    ))}
                  </optgroup>
                )}
              </>
            )}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
        </div>
      </div>

      {/* Forward skip confirmation */}
      {jumpType === "forward_skip" && stage !== currentStage && (
        <div className="rounded-xl border border-amber-400/25 bg-amber-400/[0.05] p-4 space-y-3">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-body text-sm font-semibold text-amber-300">
                Forward jump — skipping {skippedStages.length} stage{skippedStages.length !== 1 ? "s" : ""}
              </p>
              <p className="font-body text-xs text-white/50 mt-0.5">
                PathPort will auto-record these stages in the timeline:
              </p>
            </div>
          </div>
          <ul className="ml-6 space-y-1">
            {skippedStages.map(s => {
              const meta = STAGE_META.find(m => m.value === s);
              return (
                <li key={s} className="font-body text-xs text-white/65 flex items-center gap-1.5">
                  <span>{meta?.emoji}</span>
                  {meta?.label}
                  {PAYMENT_GATES.includes(s) && (
                    <span className="text-orange-400 font-semibold ml-1">· Payment Gate</span>
                  )}
                </li>
              );
            })}
          </ul>
          {hasPaymentGate && (
            <div className="flex items-start gap-2 pt-2 border-t border-amber-400/20">
              <AlertTriangle className="w-3.5 h-3.5 text-orange-400 flex-shrink-0 mt-0.5" />
              <p className="font-body text-xs text-orange-300">
                This jump passes over a payment gate. Only proceed if payment was verified through another channel.
              </p>
            </div>
          )}
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={e => setConfirmed(e.target.checked)}
              className="rounded border-white/20 bg-white/10 accent-gold-400"
            />
            <span className="font-body text-xs text-white/70">
              I confirm this advance and understand the stages above will be auto-recorded
            </span>
          </label>
        </div>
      )}

      {/* Backward confirmation */}
      {jumpType === "backward" && stage !== currentStage && (
        <div className="rounded-xl border border-white/[0.12] bg-white/[0.03] p-4 space-y-3">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-white/50 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-body text-sm font-semibold text-white/75">Backward move</p>
              <p className="font-body text-xs text-white/45 mt-0.5">
                This returns the application to an earlier stage. The student will be notified.
              </p>
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={e => setConfirmed(e.target.checked)}
              className="rounded border-white/20 bg-white/10 accent-gold-400"
            />
            <span className="font-body text-xs text-white/70">I confirm this backward move is intentional</span>
          </label>
        </div>
      )}

      {/* Student message */}
      <div>
        <label className="text-white/45 font-body text-xs uppercase tracking-wider mb-1.5 block">
          Student Message <span className="text-white/25 normal-case">— visible to student</span>
        </label>
        <textarea
          value={studentMessage}
          onChange={e => setStudentMessage(e.target.value)}
          rows={3}
          placeholder="e.g. Please upload your latest bank statement. We need the last 3 months."
          className={INPUT}
        />
      </div>

      {/* Next action */}
      <div>
        <label className="text-white/45 font-body text-xs uppercase tracking-wider mb-1.5 block">
          Next Action <span className="text-white/25 normal-case">— shown as action card to student</span>
        </label>
        <input
          type="text"
          value={nextAction}
          onChange={e => setNextAction(e.target.value)}
          placeholder="e.g. Upload your passport and financial statement"
          className={INPUT}
        />
      </div>

      {/* Internal notes */}
      <div>
        <label className="text-white/45 font-body text-xs uppercase tracking-wider mb-1.5 block">
          Internal Notes <span className="text-white/25 normal-case">— not visible to student</span>
        </label>
        <textarea
          value={internalNotes}
          onChange={e => setInternalNotes(e.target.value)}
          rows={2}
          placeholder="Internal tracking notes…"
          className={INPUT}
        />
      </div>

      {error && <p className="text-red-400 font-body text-sm px-1">{error}</p>}

      <button
        onClick={handleSave}
        disabled={saveDisabled}
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gold-400/15 border border-gold-400/30 text-gold-400 font-body text-sm font-semibold hover:bg-gold-400/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading
          ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
          : saved
            ? "✓ Saved"
            : <><Save className="w-4 h-4" /> Save Update</>
        }
      </button>
    </div>
  );
}
