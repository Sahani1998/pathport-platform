"use client";

import { useState } from "react";
import { Loader2, AlertCircle } from "lucide-react";
import type { ApplicationStage } from "@/types/timeline";
import { STAGE_META } from "@/types/timeline";
import { ALLOWED_TRANSITIONS } from "@/lib/application-workflow";

// Curated subset of stages surfaced for quick inline updates from the
// institution applications list. The final option list is intersected with
// ALLOWED_TRANSITIONS for the current stage so the dropdown can never offer a
// jump the /stage route would reject (e.g. offer_letter_accepted →
// documents_uploaded). Full stage management lives on the detail page.
const QUICK_STAGES: ApplicationStage[] = [
  "application_submitted",
  "documents_pending",
  "documents_under_review",
  "offer_letter_ready",
  "ipa_processing",
  "approved",
  "rejected",
];

interface StatusUpdateSelectProps {
  applicationId: string;
  currentStage:  ApplicationStage;
  onUpdated?:    (newStage: ApplicationStage) => void;
}

export default function StatusUpdateSelect({
  applicationId,
  currentStage,
  onUpdated,
}: StatusUpdateSelectProps) {
  const [stage,   setStage]   = useState<ApplicationStage>(currentStage);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const handleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStage = e.target.value as ApplicationStage;
    setError(null);
    setLoading(true);

    const controller = new AbortController();
    const timeoutId  = setTimeout(() => controller.abort(), 12_000);

    try {
      const res = await fetch(`/api/applications/${applicationId}/stage`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ stage: newStage }),
        signal:  controller.signal,
      });

      clearTimeout(timeoutId);
      const json = await res.json() as { error?: string };

      if (!res.ok) {
        setError(json.error ?? `Server error (${res.status})`);
        return;
      }

      setStage(newStage);
      onUpdated?.(newStage);

    } catch (err: unknown) {
      clearTimeout(timeoutId);
      const isTimeout = err instanceof Error && err.name === "AbortError";
      setError(isTimeout ? "Request timed out. Please try again." : err instanceof Error ? err.message : "Network error");
    } finally {
      setLoading(false);
    }
  };

  // Current stage is always selectable (so the control reflects reality); the
  // remaining options are the curated quick stages that are ALSO valid
  // transitions from the current stage. This mirrors the backend's
  // canTransition() gate, so the UI never offers an invalid jump.
  const validNext    = new Set<ApplicationStage>(ALLOWED_TRANSITIONS[currentStage] ?? []);
  const stageOptions = STAGE_META.filter(
    s => s.value === currentStage || (QUICK_STAGES.includes(s.value) && validNext.has(s.value)),
  );

  const meta = stageOptions.find(s => s.value === stage)
    ?? STAGE_META.find(s => s.value === stage);

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-2">
        {loading && <Loader2 className="w-3.5 h-3.5 animate-spin text-white/30 flex-shrink-0" />}
        <select
          value={stage}
          onChange={handleChange}
          disabled={loading}
          className={`px-3 py-1.5 rounded-xl border font-body text-xs font-semibold appearance-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-gold-400/30 transition-all disabled:opacity-50 [color-scheme:dark] ${meta?.color ?? ""}`}
        >
          {stageOptions.map(s => (
            <option key={s.value} value={s.value} style={{ backgroundColor: "#0a1024", color: "#fff" }}>
              {s.label}
            </option>
          ))}
        </select>
      </div>
      {error && (
        <div className="flex items-start gap-1.5 max-w-[200px]">
          <AlertCircle className="w-3 h-3 text-red-400 flex-shrink-0 mt-0.5" />
          <span className="text-red-400 font-body text-[10px] leading-snug">{error}</span>
        </div>
      )}
    </div>
  );
}
