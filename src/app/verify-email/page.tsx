"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Mail, CheckCircle2, RefreshCw, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function VerifyEmailPage() {
  const [sending, setSending] = useState(false);
  const [sent,    setSent]    = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const resend = async () => {
    setSending(true);
    setError(null);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) throw new Error("No authenticated user found");

      const { error: resendError } = await supabase.auth.resend({
        type: "signup",
        email: user.email,
      });
      if (resendError) throw resendError;
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to resend");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-navy-950 px-4">
      <div className="max-w-md w-full text-center space-y-6">

        {/* Icon */}
        <div className="w-16 h-16 rounded-2xl bg-gold-400/10 border border-gold-400/25 flex items-center justify-center mx-auto">
          <Mail className="w-8 h-8 text-gold-400" />
        </div>

        {/* Heading */}
        <div>
          <h1 className="font-display text-3xl text-white mb-2">Verify your email</h1>
          <p className="text-white/50 font-body text-sm leading-relaxed">
            We sent a verification link to your email address.<br />
            Click it to activate your PathPort account.
          </p>
        </div>

        {/* Feedback */}
        {sent ? (
          <div className="flex items-center gap-2 justify-center p-4 rounded-xl bg-emerald-500/10 border border-emerald-400/20 text-emerald-400 font-body text-sm">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            Verification email sent — check your inbox.
          </div>
        ) : (
          <>
            {error && (
              <p className="text-red-400 font-body text-sm">{error}</p>
            )}
            <button
              onClick={resend}
              disabled={sending}
              className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gold-400/10 border border-gold-400/25 text-gold-400 font-body text-sm font-semibold hover:bg-gold-400/20 transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${sending ? "animate-spin" : ""}`} />
              {sending ? "Sending…" : "Resend verification email"}
            </button>
          </>
        )}

        {/* Already verified link */}
        <p className="text-white/30 font-body text-xs">
          Already verified?{" "}
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1 text-pathBlue-400 hover:text-pathBlue-300 transition-colors"
          >
            Go to dashboard <ArrowRight className="w-3 h-3" />
          </Link>
        </p>
      </div>
    </div>
  );
}
