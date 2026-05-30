"use client";

import { useEffect } from "react";
import { AlertCircle } from "lucide-react";

export default function AdminDashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[AdminDashboard] error:", error.message);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-5">
      <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-400/25 flex items-center justify-center">
        <AlertCircle className="w-7 h-7 text-red-400" />
      </div>
      <div className="text-center">
        <p className="font-display text-2xl text-white mb-2">Admin dashboard error</p>
        <p className="text-white/40 font-body text-sm max-w-xs">
          {error.message || "An unexpected error occurred. Please try again."}
        </p>
      </div>
      <button
        onClick={reset}
        className="px-5 py-2.5 rounded-xl bg-gold-400/10 border border-gold-400/25 text-gold-400 font-body text-sm font-semibold hover:bg-gold-400/20 transition-all"
      >
        Try again
      </button>
    </div>
  );
}
