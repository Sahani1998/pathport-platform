"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { CheckCircle2, Loader2, Send } from "lucide-react";
import { cn } from "@/lib/utils";

interface ApplyButtonProps {
  courseId:     string;
  courseTitle:  string;
  hasApplied:   boolean;  // server-side pre-check
  seatsLeft:    number;
  className?:   string;
}

export default function ApplyButton({
  courseId,
  courseTitle,
  hasApplied: initialApplied,
  seatsLeft,
  className,
}: ApplyButtonProps) {
  const router                        = useRouter();
  const [applied,  setApplied]        = useState(initialApplied);
  const [loading,  setLoading]        = useState(false);
  const [error,    setError]          = useState<string | null>(null);

  const handleApply = async () => {
    setError(null);
    setLoading(true);

    try {
      const supabase = createClient();
      console.log("[Applications] submitting application for course:", courseId);

      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        setError("You must be signed in to apply.");
        return;
      }

      const { error: insertError } = await supabase
        .from("applications")
        .insert({ student_id: user.id, course_id: courseId, status: "submitted" });

      if (insertError) {
        if (insertError.code === "23505") {
          // unique constraint — already applied
          setApplied(true);
          return;
        }
        console.error("[Applications] insert error:", insertError.code, insertError.message);
        setError("Application failed. Please try again.");
        return;
      }

      console.log("[Applications] application submitted successfully");
      setApplied(true);
      router.refresh(); // refresh server components to reflect new application
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[Applications] unexpected error:", msg);
      setError("Unexpected error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (applied) {
    return (
      <div className={cn("flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-500/10 border border-emerald-400/30 text-emerald-400 font-body font-semibold text-sm", className)}>
        <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
        Applied — Track in My Applications
      </div>
    );
  }

  if (seatsLeft <= 0) {
    return (
      <div className={cn("flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white/[0.05] border border-white/[0.09] text-white/35 font-body text-sm", className)}>
        No seats available
      </div>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      <button
        onClick={handleApply}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-gold-500 to-gold-400 text-navy-900 font-body font-bold text-sm hover:from-gold-400 hover:to-gold-300 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> Submitting…</>
        ) : (
          <><Send className="w-4 h-4" /> Apply Now</>
        )}
      </button>
      {error && (
        <p className="text-red-400 font-body text-xs text-center">{error}</p>
      )}
    </div>
  );
}
