"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { CheckCircle2, Loader2, Send } from "lucide-react";
import { cn } from "@/lib/utils";

interface ApplyButtonProps {
  courseId:    string;
  courseTitle: string;
  hasApplied:  boolean;   // server-side pre-check passed from page
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
    setError(null);
    setLoading(true);

    try {
      const supabase = createClient();

      // ── Step 1: verify auth ──────────────────────────────────────────────
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      console.log("[Applications] auth check — user:", user?.id ?? "null", "| authError:", authError?.message ?? "none");

      if (authError || !user) {
        setError("You must be signed in to apply.");
        return;
      }

      // ── Step 2: check for existing application (prevents race + 23505) ──
      const { data: existing, error: checkError } = await supabase
        .from("applications")
        .select("id, status")
        .eq("student_id", user.id)
        .eq("course_id", courseId)
        .maybeSingle();

      console.log("[Applications] duplicate check — existing:", existing?.id ?? "none", "| checkError:", checkError?.message ?? "none");

      if (existing) {
        setApplied(true);
        return;
      }

      // ── Step 3: insert ───────────────────────────────────────────────────
      const { data: inserted, error: insertError } = await supabase
        .from("applications")
        .insert({ student_id: user.id, course_id: courseId, status: "submitted" })
        .select("id")
        .single();

      console.log("[Applications] insert result — id:", inserted?.id ?? "null", "| code:", insertError?.code ?? "none", "| msg:", insertError?.message ?? "none");

      if (insertError) {
        if (insertError.code === "23505") {
          // Unique constraint hit despite the pre-check (race condition) — treat as success
          setApplied(true);
          return;
        }
        setError(`Could not submit application: ${insertError.message}`);
        return;
      }

      // ── Step 4: success ──────────────────────────────────────────────────
      setApplied(true);
      router.refresh();

    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[Applications] unexpected error:", msg);
      setError("Unexpected error — please try again or contact support.");
    } finally {
      // Always clears loading regardless of which branch ran
      setLoading(false);
    }
  };

  // ── Applied state ──────────────────────────────────────────────────────────
  if (applied) {
    return (
      <div className={cn(
        "flex items-center gap-2 px-5 py-3 rounded-xl",
        "bg-emerald-500/10 border border-emerald-400/30 text-emerald-400",
        "font-body font-semibold text-sm",
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

  // ── Apply button ───────────────────────────────────────────────────────────
  return (
    <div className={cn("space-y-2", className)}>
      <button
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
        <p className="text-red-400 font-body text-xs text-center px-1">{error}</p>
      )}
    </div>
  );
}
