"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import GoldButton from "@/components/ui/GoldButton";
import { Loader2, CheckCircle2, AlertCircle, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

const INPUT = cn(
  "w-full bg-white/[0.06] border border-white/[0.10] rounded-xl px-4 py-3.5",
  "font-body text-sm text-white placeholder-white/25",
  "focus:outline-none focus:border-gold-400/60 focus:ring-1 focus:ring-gold-400/20",
  "transition-all duration-200"
);

const passwordRules = [
  { label: "At least 8 characters", test: (p: string) => p.length >= 8 },
  { label: "One uppercase letter",  test: (p: string) => /[A-Z]/.test(p) },
  { label: "One lowercase letter",  test: (p: string) => /[a-z]/.test(p) },
  { label: "One number",            test: (p: string) => /\d/.test(p) },
];

type PageState = "checking" | "ready" | "invalid" | "done";

export default function ResetPasswordPage() {
  const supabase = createClient();

  const [pageState, setPageState] = useState<PageState>("checking");
  const [password,  setPassword]  = useState("");
  const [confirm,   setConfirm]   = useState("");
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    // Log that we arrived at the reset page so we can verify the redirect_to was correct
    if (typeof window !== "undefined") {
      const hasHash = window.location.hash.includes("access_token") || window.location.hash.includes("type=recovery");
      const hasCode = new URLSearchParams(window.location.search).has("code");
      if (hasHash || hasCode) {
        console.log("[ResetPassword] PASSWORD_RESET_REDIRECT detected:", hasHash ? "hash-token" : "pkce-code");
      } else {
        console.log("[ResetPassword] PASSWORD_RESET_REDIRECT: no token in URL — checking existing session");
      }
    }

    // onAuthStateChange fires when the Supabase client processes the hash token
    // or a PKCE code exchange completes. PASSWORD_RECOVERY is the definitive event
    // for reset links; also accept SIGNED_IN / INITIAL_SESSION (PKCE path).
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (cancelled) return;
      if (session && (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN" || event === "INITIAL_SESSION")) {
        console.log("[ResetPassword] PASSWORD_RECOVERY_SESSION_FOUND via event:", event);
        setPageState(prev => (prev === "checking" ? "ready" : prev));
      }
    });

    // Poll getSession every 500ms for up to 5 seconds as a safety net for cases
    // where onAuthStateChange fires before the listener was registered, or in
    // environments where the hash exchange resolves before this effect runs.
    let elapsed = 0;
    const POLL_MS  = 500;
    const MAX_WAIT = 5000;

    const checkSession = async () => {
      if (cancelled) return;
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        console.log("[ResetPassword] PASSWORD_RECOVERY_SESSION_FOUND via getSession after", elapsed, "ms");
        if (!cancelled) setPageState(prev => (prev === "checking" ? "ready" : prev));
        return;
      }
      elapsed += POLL_MS;
      if (elapsed >= MAX_WAIT) {
        if (!cancelled) setPageState(prev => (prev === "checking" ? "invalid" : prev));
      } else {
        setTimeout(checkSession, POLL_MS);
      }
    };

    checkSession();

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    const failedRule = passwordRules.find(r => !r.test(password));
    if (failedRule) { setError(`Password needs: ${failedRule.label.toLowerCase()}.`); return; }
    if (password !== confirm) { setError("Passwords do not match."); return; }

    setLoading(true);
    console.log("[ResetPassword] PASSWORD_UPDATE_START");

    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      console.log("[ResetPassword] PASSWORD_UPDATE_RESULT:", updateError ? "error" : "success");

      if (updateError) {
        console.error("[ResetPassword] PASSWORD_UPDATE_ERROR:", updateError.message);
        setError(updateError.message);
        return;
      }

      setPageState("done");

      // Sign out with a 3-second timeout so a hanging signOut never blocks the redirect
      console.log("[ResetPassword] PASSWORD_SIGNOUT_START");
      try {
        await Promise.race([
          supabase.auth.signOut(),
          new Promise<void>(resolve => setTimeout(resolve, 3000)),
        ]);
        console.log("[ResetPassword] PASSWORD_SIGNOUT_DONE");
      } catch {
        console.warn("[ResetPassword] PASSWORD_SIGNOUT_DONE (ignored error)");
      }

      // Hard redirect — bypasses Next.js router which can conflict with a cleared session
      console.log("[ResetPassword] PASSWORD_REDIRECT_START");
      window.location.href = "/login?message=password-updated";

    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unexpected error. Please try again.";
      console.error("[ResetPassword] PASSWORD_UPDATE_ERROR:", msg);
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (pageState === "checking") {
    return (
      <div className="flex flex-col items-center py-10">
        <Loader2 className="w-8 h-8 text-gold-400 animate-spin mb-4" />
        <p className="text-white/45 font-body text-sm">Verifying your reset link…</p>
      </div>
    );
  }

  if (pageState === "invalid") {
    return (
      <div className="text-center py-6">
        <AlertCircle className="w-14 h-14 text-red-400 mx-auto mb-4" />
        <h3 className="font-display text-2xl text-white mb-2">Link Expired or Invalid</h3>
        <p className="text-white/50 font-body text-sm mb-6 max-w-xs mx-auto">
          This password reset link has expired or has already been used. Request a new one below.
        </p>
        <Link href="/forgot-password">
          <GoldButton variant="solid-gold" size="lg" className="w-full">
            Request New Reset Link
          </GoldButton>
        </Link>
        <Link href="/login" className="mt-4 flex items-center justify-center gap-2 text-white/40 hover:text-white/70 font-body text-sm transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Sign In
        </Link>
      </div>
    );
  }

  if (pageState === "done") {
    return (
      <div className="text-center py-6">
        <CheckCircle2 className="w-14 h-14 text-gold-400 mx-auto mb-4" />
        <h3 className="font-display text-2xl text-white mb-2">Password Updated</h3>
        <p className="text-white/50 font-body text-sm">
          Redirecting you to sign in with your new password…
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="text-center mb-8">
        <h1 className="font-display text-3xl text-white mb-2">Set New Password</h1>
        <p className="text-white/45 font-body text-sm">
          Choose a new password for your account.
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        {error && (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 font-body text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        <div>
          <label htmlFor="rp-password" className="block text-white/55 font-body text-sm mb-1.5 tracking-wide">
            New Password
          </label>
          <input id="rp-password" type="password" required value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="••••••••" className={INPUT}
            autoComplete="new-password" autoFocus />
          {password.length > 0 && (
            <ul className="mt-2 space-y-1">
              {passwordRules.map(rule => (
                <li key={rule.label} className={`font-body text-xs flex items-center gap-1.5 ${rule.test(password) ? "text-emerald-400" : "text-white/35"}`}>
                  <span>{rule.test(password) ? "✓" : "·"}</span>
                  {rule.label}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <label htmlFor="rp-confirm" className="block text-white/55 font-body text-sm mb-1.5 tracking-wide">
            Confirm Password
          </label>
          <input id="rp-confirm" type="password" required value={confirm}
            onChange={e => setConfirm(e.target.value)}
            placeholder="••••••••" className={INPUT}
            autoComplete="new-password" />
          {confirm.length > 0 && password !== confirm && (
            <p className="mt-1 text-red-400 font-body text-xs">Passwords do not match.</p>
          )}
        </div>

        <GoldButton type="submit" variant="solid-gold" size="lg" disabled={loading} className="w-full">
          {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Updating…</> : "Save Password"}
        </GoldButton>
      </form>
    </>
  );
}
