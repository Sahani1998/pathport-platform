"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { CheckCircle2, Loader2, Send, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ApplyButtonProps {
  courseId:    string;
  courseTitle: string;
  hasApplied:  boolean;
  seatsLeft:   number;
  className?:  string;
}

// Wraps a promise with a hard timeout — rejects if it takes longer than ms.
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Request timed out after ${ms / 1000}s`)), ms);
    promise.then(
      (val) => { clearTimeout(timer); resolve(val); },
      (err) => { clearTimeout(timer); reject(err); }
    );
  });
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
    // FIRST LINE — confirms handler is running and latest code is deployed
    console.log("[Applications] button clicked — courseId:", courseId);

    setError(null);
    setLoading(true);

    try {
      const supabase = createClient();

      // ── Step 1: verify auth ────────────────────────────────────────────
      const { data: authData, error: authError } = await withTimeout(
        supabase.auth.getUser(),
        12_000
      );
      const user = authData?.user ?? null;
      console.log("[Applications] auth check — user:", user?.id ?? "null", "| error:", authError?.message ?? "none");

      if (authError || !user) {
        setError("You must be signed in to apply.");
        return;
      }

      // ── Step 2: duplicate check ────────────────────────────────────────
      const { data: existing, error: checkError } = await withTimeout(
        supabase
          .from("applications")
          .select("id, status")
          .eq("student_id", user.id)
          .eq("course_id", courseId)
          .maybeSingle(),
        12_000
      );
      console.log("[Applications] duplicate check — existing:", existing?.id ?? "none", "| error:", checkError?.message ?? "none");

      if (existing) {
        console.log("[Applications] already applied — showing Applied state");
        setApplied(true);
        return;
      }

      // ── Step 3: insert ─────────────────────────────────────────────────
      const { data: inserted, error: insertError } = await withTimeout(
        supabase
          .from("applications")
          .insert({ student_id: user.id, course_id: courseId, status: "submitted" })
          .select("id")
          .single(),
        12_000
      );
      console.log("[Applications] insert result — id:", inserted?.id ?? "null", "| code:", insertError?.code ?? "none", "| msg:", insertError?.message ?? "none");

      if (insertError) {
        if (insertError.code === "23505") {
          setApplied(true);
          return;
        }
        setError(`Could not submit: ${insertError.message}`);
        return;
      }

      // ── Success ────────────────────────────────────────────────────────
      console.log("[Applications] success — application submitted");
      setApplied(true);
      router.refresh();

    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[Applications] caught error:", msg);
      setError(msg);
    } finally {
      // Guaranteed to run — clears Submitting… state no matter what
      setLoading(false);
      console.log("[Applications] finally — loading cleared");
    }
  };

  // ── Applied state ──────────────────────────────────────────────────────────
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

  // ── Default button ─────────────────────────────────────────────────────────
  return (
    <div className={cn("space-y-2", className)}>
      {/*
        type="button" is explicit to prevent any parent <form> from treating
        this as a submit button and triggering a page navigation instead of
        the onClick handler.
      */}
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
