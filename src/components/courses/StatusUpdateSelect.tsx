"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";
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

    try {
      const supabase = createClient();
      console.log("[Applications] updating status:", applicationId, "→", newStatus);

      const { error: updateError } = await supabase
        .from("applications")
        .update({ status: newStatus })
        .eq("id", applicationId);

      if (updateError) {
        console.error("[Applications] status update error:", updateError.message);
        setError("Update failed");
        return;
      }

      setStatus(newStatus);
      onUpdated?.(newStatus);
    } catch (err: unknown) {
      console.error("[Applications] unexpected error:", err);
      setError("Error");
    } finally {
      setLoading(false);
    }
  };

  const meta = APPLICATION_STATUSES.find(s => s.value === status);

  return (
    <div className="flex items-center gap-2">
      {loading && <Loader2 className="w-3.5 h-3.5 animate-spin text-white/30 flex-shrink-0" />}
      <select
        value={status}
        onChange={handleChange}
        disabled={loading}
        className={`px-3 py-1.5 rounded-xl border font-body text-xs font-semibold appearance-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-gold-400/30 transition-all disabled:opacity-50 ${meta?.color ?? ""}`}
      >
        {APPLICATION_STATUSES.map(s => (
          <option key={s.value} value={s.value} className="bg-navy-800 text-white">
            {s.label}
          </option>
        ))}
      </select>
      {error && <span className="text-red-400 font-body text-[10px]">{error}</span>}
    </div>
  );
}
