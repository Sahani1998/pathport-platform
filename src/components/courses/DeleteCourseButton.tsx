"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Trash2, Loader2 } from "lucide-react";

interface DeleteCourseButtonProps {
  courseId:    string;
  courseTitle: string;
}

export default function DeleteCourseButton({ courseId, courseTitle }: DeleteCourseButtonProps) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState<string | null>(null);

  const handleDelete = async () => {
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      console.log("[InstitutionPortal] deleting course:", courseId);

      const { error: deleteError } = await supabase
        .from("courses")
        .delete()
        .eq("id", courseId);

      if (deleteError) {
        console.error("[InstitutionPortal] delete error:", deleteError.message);
        setError(deleteError.message);
        setConfirming(false);
        return;
      }

      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[InstitutionPortal] unexpected:", msg);
      setError(msg);
      setConfirming(false);
    } finally {
      setLoading(false);
    }
  };

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <span className="font-body text-xs text-white/50">Delete &ldquo;{courseTitle.slice(0, 24)}…&rdquo;?</span>
        <button
          onClick={handleDelete}
          disabled={loading}
          className="px-3 py-1.5 rounded-lg bg-red-500/15 border border-red-400/30 text-red-400 font-body text-xs font-semibold hover:bg-red-500/25 transition-all disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Yes, delete"}
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="px-3 py-1.5 rounded-lg bg-white/[0.05] border border-white/[0.09] text-white/45 font-body text-xs hover:border-white/20 transition-all"
        >
          Cancel
        </button>
        {error && <span className="text-red-400 font-body text-xs">{error}</span>}
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="p-2 rounded-xl text-white/30 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-400/20 transition-all"
      title="Delete course"
    >
      <Trash2 className="w-4 h-4" />
    </button>
  );
}
