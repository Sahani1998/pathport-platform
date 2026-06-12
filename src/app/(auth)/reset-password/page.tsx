"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  const router   = useRouter();
  const supabase = createClient();

  const [pageState, setPageState] = useState<PageState>("checking");
  const [password,  setPassword]  = useState("");
  const [confirm,   setConfirm]   = useState("");
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState<string | null>(null);

  // The recovery link goes through /auth/callback which exchanges the code and
  // sets a session cookie before redirecting here. PKCE/hash flows may instead
  // deliver the token in the URL fragment, which the browser client consumes
  // and surfaces via onAuthStateChange. Accept either; without a session the
  // link is invalid or expired.
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session && (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN" || event === "INITIAL_SESSION")) {
        setPageState(prev => (prev === "checking" ? "ready" : prev));
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setPageState(prev => (prev === "checking" ? "ready" : prev));
      } else {
        // Allow a moment for a hash token to be consumed before declaring invalid
        setTimeout(() => {
          setPageState(prev => (prev === "checking" ? "invalid" : prev));
        }, 2500);
      }
    });

    return () => subscription.unsubscribe();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    const failedRule = passwordRules.find(r => !r.test(password));
    if (failedRule) { setError(`Password needs: ${failedRule.label.toLowerCase()}.`); return; }
    if (password !== confirm) { setError("Passwords do not match."); return; }

    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }

    setPageState("done");
    // End the recovery session so the user signs in with the new password
    await supabase.auth.signOut();
    setTimeout(() => router.push("/login"), 1500);
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
          {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Updating…</> : "Update Password"}
        </GoldButton>
      </form>
    </>
  );
}
