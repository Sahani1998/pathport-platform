"use client";

import { useState } from "react";
import { Loader2, AlertCircle } from "lucide-react";
import type { ApplicationStatus } from "@/types/courses";
import { APPLICATION_STATUSES } from "@/types/courses";

interface StatusUpdateSelectProps {
  applicationId: string;
  currentStatus: ApplicationStatus;
  onUpdated?:    (newStatus: ApplicationStatus) => void;
}

export default function StatusUpdateSelect({
  applicationId,
  currentStatus,
  onUpdated,
}: StatusUpdateSelectProps) {
  const [status,  setStatus]  = useState<ApplicationStatus>(currentStatus);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const handleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value as ApplicationStatus;
    setError(null);
    setLoading(true);

    // AbortController gives a hard 12-second timeout and a clear error message
    const controller = new AbortController();
    const timeoutId  = setTimeout(() => controller.abort(), 12_000);

    console.log("[Timeline] update clicked — applicationId:", applicationId, "→", newStatus);

    try {
      console.log("[Timeline] calling API /api/applications/" + applicationId + "/status");

      const res = await fetch(`/api/applications/${applicationId}/status`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ status: newStatus }),
        signal:  controller.signal,
      });

      clearTimeout(timeoutId);
      console.log("[Timeline] API response — status:", res.status);

      const json = await res.json() as { error?: string };

      if (!res.ok) {
        console.error("[Timeline] API error:", json.error);
        setError(json.error ?? `Server error (${res.status})`);
        return;
      }

      setStatus(newStatus);
      onUpdated?.(newStatus);

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

  const meta = APPLICATION_STATUSES.find(s => s.value === status);

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-2">
        {loading && <Loader2 className="w-3.5 h-3.5 animate-spin text-white/30 flex-shrink-0" />}
        <select
          value={status}
          onChange={handleChange}
          disabled={loading}
          className={`px-3 py-1.5 rounded-xl border font-body text-xs font-semibold appearance-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-gold-400/30 transition-all disabled:opacity-50 [color-scheme:dark] ${meta?.color ?? ""}`}
        >
          {APPLICATION_STATUSES.map(s => (
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
