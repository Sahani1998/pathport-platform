"use client";

import { useState } from "react";
import Link from "next/link";

interface Props {
  token:     string | null;
  emailHint: string | null;
}

type Phase = "ready" | "submitting" | "done" | "error";

export default function UnsubscribeClient({ token, emailHint }: Props) {
  const [phase,   setPhase]   = useState<Phase>(token ? "ready" : "error");
  const [message, setMessage] = useState<string | null>(
    token
      ? null
      : "This unsubscribe link is missing required information. If you continue to receive emails, reply STOP to any PathPort email and we'll remove you manually.",
  );

  async function handleUnsubscribe() {
    if (!token) return;
    setPhase("submitting");
    setMessage(null);
    try {
      const res = await fetch("/api/unsubscribe", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ token }),
      });
      const data = await res.json().catch(() => ({})) as { error?: string; email?: string };
      if (!res.ok) {
        setPhase("error");
        setMessage(data.error ?? "Could not process unsubscribe.");
        return;
      }
      setPhase("done");
      setMessage(`You have been unsubscribed${data.email ? ` (${data.email})` : ""}. You will no longer receive marketing emails from PathPort.`);
    } catch {
      setPhase("error");
      setMessage("Network error. Please try again.");
    }
  }

  if (phase === "done") {
    return (
      <>
        <p className="text-white/70 font-body text-sm leading-relaxed mb-6">{message}</p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.05] border border-white/[0.10] text-white/75 font-body text-sm font-semibold hover:text-gold-300 hover:border-gold-400/30 transition-all"
        >
          Back to PathPort →
        </Link>
      </>
    );
  }

  if (phase === "error") {
    return (
      <>
        <p className="text-red-300 font-body text-sm leading-relaxed mb-6">{message}</p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.05] border border-white/[0.10] text-white/75 font-body text-sm font-semibold hover:text-gold-300 hover:border-gold-400/30 transition-all"
        >
          Back to PathPort →
        </Link>
      </>
    );
  }

  return (
    <>
      <p className="text-white/70 font-body text-sm leading-relaxed mb-2">
        Please confirm you would like to stop receiving emails{emailHint ? ` at ${emailHint}` : ""} from PathPort.
      </p>
      <p className="text-white/45 font-body text-xs leading-relaxed mb-6">
        Transactional emails (application updates, payment confirmations, IPA notifications) will continue so we can serve your active applications. To delete your account entirely, contact support.
      </p>
      <button
        onClick={handleUnsubscribe}
        disabled={phase === "submitting"}
        className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gold-400 text-[#0D1530] font-body text-sm font-semibold hover:bg-gold-300 disabled:opacity-50 transition-all"
      >
        {phase === "submitting" ? "Unsubscribing…" : "Confirm Unsubscribe"}
      </button>
    </>
  );
}
