"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { XCircle, AlertTriangle, Loader2 } from "lucide-react";

interface Props {
  applicationId: string;
  courseName: string;
}

export default function WithdrawButton({ applicationId, courseName }: Props) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState<string | null>(null);

  const handleWithdraw = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/applications/${applicationId}/withdraw`, {
        method: "POST",
      });
      if (!res.ok) {
        const data = await res.json() as { error?: string };
        throw new Error(data.error ?? "Failed to withdraw");
      }
      router.refresh();
      setConfirming(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to withdraw");
    } finally {
      setLoading(false);
    }
  };

  if (confirming) {
    return (
      <div className="flex flex-col gap-3 p-4 rounded-xl bg-red-500/[0.07] border border-red-400/20">
        <div className="flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-white/80 font-body text-xs font-semibold mb-0.5">Withdraw application?</p>
            <p className="text-white/45 font-body text-xs">
              This will cancel your application for <span className="text-white/65">{courseName}</span>. This cannot be undone.
            </p>
          </div>
        </div>
        {error && <p className="text-red-400 font-body text-xs">{error}</p>}
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setConfirming(false); setError(null); }}
            disabled={loading}
            className="px-3 py-1.5 rounded-lg border border-white/[0.12] text-white/50 font-body text-xs hover:text-white/70 hover:border-white/20 transition-all"
          >
            Keep application
          </button>
          <button
            onClick={handleWithdraw}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/15 border border-red-400/25 text-red-400 font-body text-xs font-semibold hover:bg-red-500/25 transition-all disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <XCircle className="w-3 h-3" />}
            {loading ? "Withdrawing…" : "Yes, withdraw"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/[0.08] text-white/30 font-body text-xs hover:border-red-400/25 hover:text-red-400/70 transition-all"
    >
      <XCircle className="w-3 h-3" />
      Withdraw
    </button>
  );
}
