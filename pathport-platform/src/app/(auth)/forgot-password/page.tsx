"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import GoldButton from "@/components/ui/GoldButton";
import { ArrowLeft, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const INPUT = cn(
  "w-full bg-white/[0.06] border border-white/[0.10] rounded-xl px-4 py-3.5",
  "font-body text-sm text-white placeholder-white/25",
  "focus:outline-none focus:border-gold-400/60 focus:ring-1 focus:ring-gold-400/20",
  "transition-all duration-200"
);

export default function ForgotPasswordPage() {
  const supabase = createClient();
  const [email,   setEmail]   = useState("");
  const [loading, setLoading] = useState(false);
  const [sent,    setSent]    = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      email.trim(),
      { redirectTo: `${window.location.origin}/auth/callback?next=/reset-password` }
    );

    setLoading(false);
    if (resetError) { setError(resetError.message); return; }
    setSent(true);
  };

  return (
    <>
      <div className="text-center mb-8">
        <h1 className="font-display text-3xl text-white mb-2">Reset Password</h1>
        <p className="text-white/45 font-body text-sm">
          Enter your email and we&apos;ll send a reset link.
        </p>
      </div>

      {sent ? (
        <div className="text-center py-6">
          <CheckCircle2 className="w-14 h-14 text-gold-400 mx-auto mb-4" />
          <h3 className="font-display text-2xl text-white mb-2">Check Your Email</h3>
          <p className="text-white/50 font-body text-sm mb-6 max-w-xs mx-auto">
            We sent a password reset link to <strong className="text-white/80">{email}</strong>.
            Check your inbox (and spam folder).
          </p>
          <Link href="/login" className="text-gold-400 hover:text-gold-300 font-body text-sm font-medium transition-colors">
            Back to Sign In
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          {error && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 font-body text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <div>
            <label htmlFor="fp-email" className="block text-white/55 font-body text-sm mb-1.5 tracking-wide">
              Email Address
            </label>
            <input id="fp-email" type="email" required value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@email.com" className={INPUT}
              autoComplete="email" autoFocus />
          </div>

          <GoldButton type="submit" variant="solid-gold" size="lg" disabled={loading} className="w-full">
            {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Sending…</> : "Send Reset Link"}
          </GoldButton>

          <Link href="/login" className="flex items-center justify-center gap-2 text-white/40 hover:text-white/70 font-body text-sm transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Sign In
          </Link>
        </form>
      )}
    </>
  );
}
