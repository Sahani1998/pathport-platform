"use client";

import { useEffect, useState } from "react";
import { useRouter }           from "next/navigation";
import { createClient }        from "@/lib/supabase/client";
import { ROLE_META }           from "@/types/auth";
import type { UserRole }       from "@/types/auth";

type PageState = "loading" | "form" | "expired" | "success" | "error";

const passwordRules = [
  { label: "At least 8 characters",  test: (p: string) => p.length >= 8 },
  { label: "One uppercase letter",   test: (p: string) => /[A-Z]/.test(p) },
  { label: "One lowercase letter",   test: (p: string) => /[a-z]/.test(p) },
  { label: "One number",             test: (p: string) => /\d/.test(p) },
];

function validatePassword(password: string): string | null {
  for (const rule of passwordRules) {
    if (!rule.test(password)) return rule.label;
  }
  return null;
}

export default function ActivateAccountPage() {
  const router = useRouter();
  const supabase = createClient();

  const [pageState,  setPageState]  = useState<PageState>("loading");
  const [password,   setPassword]   = useState("");
  const [confirm,    setConfirm]    = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error,      setError]      = useState<string | null>(null);
  const [resendEmail, setResendEmail] = useState("");
  const [resending,  setResending]  = useState(false);
  const [resendDone, setResendDone] = useState(false);

  // Supabase puts the token in the URL hash after the redirect from the invite link.
  // onAuthStateChange fires with event "PASSWORD_RECOVERY" or "SIGNED_IN" when the
  // hash is consumed. We listen for a session to determine if the link is valid.
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        setPageState("form");
      } else if (event === "PASSWORD_RECOVERY") {
        setPageState("form");
      }
    });

    // Also check if there's already a valid session (e.g. page reload after hash consumed)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setPageState("form");
      } else {
        // Give a moment for the hash to be consumed; if no session arrives, show expired
        const timer = setTimeout(() => {
          setPageState(prev => prev === "loading" ? "expired" : prev);
        }, 3000);
        return () => clearTimeout(timer);
      }
    });

    return () => subscription.unsubscribe();
  }, []);// eslint-disable-line react-hooks/exhaustive-deps

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const validationError = validatePassword(password);
    if (validationError) {
      setError(`Password must contain: ${validationError.toLowerCase()}`);
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) {
      setError(updateError.message);
      setSubmitting(false);
      return;
    }

    // Fetch role to redirect to the right dashboard
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      const role      = (profile?.role as UserRole) ?? "student";
      const roleMeta  = ROLE_META.find(r => r.value === role);
      const redirect  = roleMeta?.dashboardPath ?? "/dashboard/student";
      setPageState("success");
      setTimeout(() => router.push(redirect), 1200);
    } else {
      setPageState("success");
      setTimeout(() => router.push("/login"), 1200);
    }
  }

  async function handleResend(e: React.FormEvent) {
    e.preventDefault();
    if (!resendEmail.trim()) return;
    setResending(true);
    try {
      const res  = await fetch("/api/auth/resend-activation", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email: resendEmail.trim() }),
      });
      if (res.ok) {
        setResendDone(true);
      } else {
        const data = await res.json() as { error?: string };
        setError(data.error ?? "Failed to resend activation email.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setResending(false);
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  if (pageState === "loading") {
    return (
      <div className="min-h-screen bg-pathBlue-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gold-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (pageState === "success") {
    return (
      <div className="min-h-screen bg-pathBlue-950 flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center mx-auto mb-6">
            <svg className="w-7 h-7 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="font-display text-2xl text-white mb-2">Account activated!</h1>
          <p className="text-white/50 font-body text-sm">Redirecting you to your dashboard…</p>
        </div>
      </div>
    );
  }

  if (pageState === "expired") {
    return (
      <div className="min-h-screen bg-pathBlue-950 flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto mb-6">
              <svg className="w-7 h-7 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="font-display text-2xl text-white mb-2">Activation link expired</h1>
            <p className="text-white/50 font-body text-sm">
              This link has expired or already been used. Enter your email below to receive a new one.
            </p>
          </div>

          {resendDone ? (
            <div className="rounded-xl bg-green-500/10 border border-green-500/30 p-4 text-center">
              <p className="text-green-400 font-body text-sm">
                A new activation email has been sent. Please check your inbox.
              </p>
            </div>
          ) : (
            <form onSubmit={handleResend} className="space-y-4">
              {error && (
                <div className="rounded-xl bg-red-500/10 border border-red-500/30 p-3">
                  <p className="text-red-400 font-body text-sm">{error}</p>
                </div>
              )}
              <div>
                <label className="block text-white/50 font-body text-xs mb-1.5 uppercase tracking-wider">
                  Email address
                </label>
                <input
                  type="email"
                  required
                  value={resendEmail}
                  onChange={e => setResendEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-white font-body text-sm placeholder:text-white/25 focus:outline-none focus:border-gold-400/50 transition-colors"
                />
              </div>
              <button
                type="submit"
                disabled={resending}
                className="w-full bg-gold-400 hover:bg-gold-300 disabled:opacity-50 text-pathBlue-950 font-display font-semibold py-3 rounded-xl transition-colors"
              >
                {resending ? "Sending…" : "Send new activation email"}
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  // ── Password form ──────────────────────────────────────────────────────────

  const passwordValid = passwordRules.every(r => r.test(password));

  return (
    <div className="min-h-screen bg-pathBlue-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <span className="font-display text-xl font-bold text-gold-400 tracking-wider">PathPort</span>
          <h1 className="font-display text-2xl text-white mt-4 mb-2">Activate your account</h1>
          <p className="text-white/50 font-body text-sm">Create a password to complete your account setup.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="rounded-xl bg-red-500/10 border border-red-500/30 p-3">
              <p className="text-red-400 font-body text-sm">{error}</p>
            </div>
          )}

          <div>
            <label className="block text-white/50 font-body text-xs mb-1.5 uppercase tracking-wider">
              New password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete="new-password"
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-white font-body text-sm placeholder:text-white/25 focus:outline-none focus:border-gold-400/50 transition-colors"
            />
            {password.length > 0 && (
              <ul className="mt-2 space-y-1">
                {passwordRules.map(rule => (
                  <li key={rule.label} className={`font-body text-xs flex items-center gap-1.5 ${rule.test(password) ? "text-green-400" : "text-white/35"}`}>
                    <span>{rule.test(password) ? "✓" : "·"}</span>
                    {rule.label}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <label className="block text-white/50 font-body text-xs mb-1.5 uppercase tracking-wider">
              Confirm password
            </label>
            <input
              type="password"
              required
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              autoComplete="new-password"
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-white font-body text-sm placeholder:text-white/25 focus:outline-none focus:border-gold-400/50 transition-colors"
            />
            {confirm.length > 0 && password !== confirm && (
              <p className="mt-1 text-red-400 font-body text-xs">Passwords do not match.</p>
            )}
          </div>

          <button
            type="submit"
            disabled={submitting || !passwordValid || password !== confirm}
            className="w-full bg-gold-400 hover:bg-gold-300 disabled:opacity-40 disabled:cursor-not-allowed text-pathBlue-950 font-display font-semibold py-3 rounded-xl transition-colors"
          >
            {submitting ? "Activating…" : "Activate account"}
          </button>
        </form>
      </div>
    </div>
  );
}
