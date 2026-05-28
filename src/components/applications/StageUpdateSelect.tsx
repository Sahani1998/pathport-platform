"use client";

import { useState } from "react";
import { STAGE_META } from "@/types/timeline";
import type { ApplicationStage } from "@/types/timeline";
import { Loader2, ChevronDown, Save } from "lucide-react";

interface StageUpdateSelectProps {
  applicationId:  string;
  currentStage:   ApplicationStage;
  onUpdated?:     (newStage: ApplicationStage) => void;
  compact?:       boolean;   // true = just the select, no message fields
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

  const INPUT = "w-full bg-white/[0.06] border border-white/[0.10] rounded-xl px-3 py-2 font-body text-sm text-white placeholder-white/25 focus:outline-none focus:border-gold-400/60 transition-all resize-none";

  const handleSave = async () => {
    setLoading(true);
    setError(null);
    setSaved(false);

    // Hard 12-second timeout — prevents infinite spinner
    const controller = new AbortController();
    const timeoutId  = setTimeout(() => controller.abort(), 12_000);

    console.log("[Timeline] update clicked — applicationId:", applicationId, "→", stage);

    try {
      console.log("[Timeline] calling API /api/applications/" + applicationId + "/stage");

      const res = await fetch(`/api/applications/${applicationId}/stage`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          stage,
          student_message: studentMessage.trim() || null,
          internal_notes:  internalNotes.trim()  || null,
          next_action:     nextAction.trim()      || null,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      console.log("[Timeline] API response — status:", res.status);

      const json = await res.json() as { error?: string };

      if (!res.ok) {
        console.error("[Timeline] API error:", json.error);
        setError(json.error ?? `Server error (${res.status})`);
        return;
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      onUpdated?.(stage);

    } catch (err: unknown) {
      clearTimeout(timeoutId);
      const isTimeout = err instanceof Error && err.name === "AbortError";
      const msg       = isTimeout
        ? "Request timed out. Please try again."
        : err instanceof Error ? err.message : "Network error";
      console.error("[Timeline] caught error:", msg);
      setError(msg);
    } finally {
      setLoading(false);
      console.log("[Timeline] finally — loading cleared");
    }
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <div className="relative">
          <select
            value={stage}
            onChange={e => setStage(e.target.value as ApplicationStage)}
            className="bg-white/[0.06] border border-white/[0.10] rounded-xl pl-3 pr-8 py-1.5 font-body text-xs text-white appearance-none cursor-pointer focus:outline-none focus:border-gold-400/50 transition-all [&>option]:bg-navy-800"
          >
            {STAGE_META.map(s => (
              <option key={s.value} value={s.value}>{s.emoji} {s.label}</option>
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

  return (
    <div className="space-y-4 p-5 bg-white/[0.03] border border-white/[0.07] rounded-2xl">
      <h3 className="font-display text-lg text-white">Update Application Stage</h3>

      {/* Stage select */}
      <div>
        <label className="text-white/45 font-body text-xs uppercase tracking-wider mb-1.5 block">New Stage</label>
        <div className="relative">
          <select
            value={stage}
            onChange={e => setStage(e.target.value as ApplicationStage)}
            className={INPUT + " [&>option]:bg-navy-800"}
          >
            {STAGE_META.map(s => (
              <option key={s.value} value={s.value}>{s.emoji} {s.label}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
        </div>
      </div>

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

      {error && (
        <p className="text-red-400 font-body text-sm px-1">{error}</p>
      )}

      <button
        onClick={handleSave}
        disabled={loading}
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
