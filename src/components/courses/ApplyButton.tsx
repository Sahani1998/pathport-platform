"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, Send, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ApplyButtonProps {
  courseId:    string;
  courseTitle: string;
  hasApplied:  boolean;
  seatsLeft:   number;
  className?:  string;
}

export default function ApplyButton({
  courseId,
  courseTitle,
  hasApplied: initialApplied,
  seatsLeft,
  className,
}: ApplyButtonProps) {
  const router = useRouter();
  const [applied,  setApplied]  = useState(initialApplied);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);

  const handleApply = async () => {
    // First line — confirms handler fires and latest code is deployed
    console.log("[Applications] button clicked — courseId:", courseId);

    setError(null);
    setLoading(true);

    try {
      // Call the server API route instead of Supabase directly.
      // The server route uses createClient() which reads cookies reliably,
      // avoiding the browser-client auth hang.
      console.log("[Applications] calling /api/applications/apply");

      const response = await fetch("/api/applications/apply", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ courseId }),
      });

      console.log("[Applications] fetch response — status:", response.status);

      const json = await response.json() as {
        success?:       boolean;
        alreadyApplied?: boolean;
        applicationId?: string;
        error?:         string;
      };

      console.log("[Applications] response body:", JSON.stringify(json));

      if (!response.ok) {
        // Server returned 4xx / 5xx with an error message
        setError(json.error ?? `Server error (${response.status})`);
        return;
      }

      if (json.alreadyApplied || json.success) {
        console.log("[Applications] success — showing Applied state");
        setApplied(true);
        router.refresh();
        return;
      }

      // Unexpected response shape
      setError("Unexpected response from server. Please try again.");

    } catch (err: unknown) {
      // Network error, JSON parse error, etc.
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[Applications] fetch error:", msg);
      setError(`Network error: ${msg}`);
    } finally {
      setLoading(false);
      console.log("[Applications] finally — loading cleared");
    }
  };

  // ── Applied ────────────────────────────────────────────────────────────────
  if (applied) {
    return (
      <div className={cn(
        "flex items-center gap-2 px-5 py-3 rounded-xl",
        "bg-emerald-500/10 border border-emerald-400/30",
        "text-emerald-400 font-body font-semibold text-sm",
        className
      )}>
        <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
        Applied — Track in My Applications
      </div>
    );
  }

  // ── No seats ───────────────────────────────────────────────────────────────
  if (seatsLeft <= 0) {
    return (
      <div className={cn(
        "flex items-center justify-center gap-2 px-5 py-3 rounded-xl",
        "bg-white/[0.05] border border-white/[0.09] text-white/35 font-body text-sm",
        className
      )}>
        No seats available
      </div>
    );
  }

  // ── Default ────────────────────────────────────────────────────────────────
  return (
    <div className={cn("space-y-2", className)}>
      <button
        type="button"
        onClick={handleApply}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-gold-500 to-gold-400 text-navy-900 font-body font-bold text-sm hover:from-gold-400 hover:to-gold-300 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {loading
          ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting…</>
          : <><Send className="w-4 h-4" /> Apply Now</>
        }
      </button>

      {error && (
        <div className="flex items-start gap-2 p-3 rounded-xl bg-red-500/10 border border-red-400/25">
          <AlertCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-red-400 font-body text-xs">{error}</p>
        </div>
      )}
    </div>
  );
}
