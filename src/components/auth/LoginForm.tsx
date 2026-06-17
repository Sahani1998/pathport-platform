"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import GoldButton from "@/components/ui/GoldButton";
import { Eye, EyeOff, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/types/auth";
import { ROLE_META } from "@/types/auth";

const INPUT = cn(
  "w-full bg-white/[0.06] border border-white/[0.10] rounded-xl px-4 py-3.5",
  "font-body text-sm text-white placeholder-white/25",
  "focus:outline-none focus:border-gold-400/60 focus:ring-1 focus:ring-gold-400/20",
  "transition-all duration-200"
);

export default function LoginForm({ successMessage, redirectAfterLogin }: { successMessage?: string; redirectAfterLogin?: string }) {
  const supabase = createClient();

  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [showPw,   setShowPw]   = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setError(null);
    setLoading(true);

    // Track whether we successfully start a navigation.
    // If true, the page will hard-reload so setLoading(false) is not needed.
    let navigating = false;

    try {
      const normalizedEmail = email.trim().toLowerCase();

      // ── Step 0: Server-side rate limit guard ──────────────────────────────
      const guardRes = await fetch("/api/auth/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalizedEmail }),
      });
      if (guardRes.status === 429) {
        const data = await guardRes.json().catch(() => ({})) as { retryAfterSeconds?: number };
        setError(`Too many login attempts. Try again in ${data.retryAfterSeconds ?? 60}s.`);
        return;
      }

      // ── Step 0b: Clear any stale cached session ──────────────────────────
      // Prevents a previous user's JWT being used for the profile query that
      // comes next. Pair with the server-side /api/auth/signout that runs on
      // sign-out, so a fresh login on the same tab never sees old cookies.
      await supabase.auth.signOut();

      // ── Step 1: Authenticate ──────────────────────────────────────────────
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email:    normalizedEmail,
        password,
      });

      if (authError) {
        setError(authError.message);
        return; // finally clears loading
      }

      // ── Step 2: Fetch role ────────────────────────────────────────────────
      // Note: profile might not exist yet if the DB trigger is slow.
      // Fall back to /dashboard which resolves the role server-side.
      let redirectTo = "/dashboard";

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", data.user.id)
        .single();

      if (profile?.role) {
        const roleMeta = ROLE_META.find(r => r.value === (profile.role as UserRole));
        if (roleMeta) redirectTo = roleMeta.dashboardPath;
      }

      // Honor ?redirect= param — but only allow relative internal paths
      if (redirectAfterLogin && redirectAfterLogin.startsWith("/")) {
        redirectTo = redirectAfterLogin;
      }

      // ── Step 3: Hard navigate ─────────────────────────────────────────────
      // MUST use window.location — not router.push() — so the browser sends
      // the fresh Supabase session cookies in the next HTTP request.
      // router.push() + router.refresh() race on Vercel and stall navigation.
      navigating = true;
      window.location.href = redirectTo;

    } catch {
      setError("Sign in failed. Please check your credentials and try again.");
    } finally {
      // Only clear loading on failure — on success the page will unmount
      if (!navigating) setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      method="POST"
      action="#"
      noValidate
      className="space-y-5"
    >
      {/* Success banner (e.g. password updated) */}
      {successMessage && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-body text-sm">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          {successMessage}
        </div>
      )}

      {/* Error banner */}
      {error && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 font-body text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Email */}
      <div>
        <label htmlFor="login-email" className="block text-white/55 font-body text-sm mb-1.5 tracking-wide">
          Email Address
        </label>
        <input
          id="login-email"
          type="email"
          required
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="you@email.com"
          className={INPUT}
          autoComplete="email"
          autoFocus
        />
      </div>

      {/* Password */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label htmlFor="login-password" className="text-white/55 font-body text-sm tracking-wide">
            Password
          </label>
          <Link href="/forgot-password" className="text-gold-400/80 hover:text-gold-300 font-body text-xs transition-colors">
            Forgot password?
          </Link>
        </div>
        <div className="relative">
          <input
            id="login-password"
            type={showPw ? "text" : "password"}
            required
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Enter your password"
            className={cn(INPUT, "pr-12")}
            autoComplete="current-password"
          />
          <button
            type="button"
            onClick={() => setShowPw(v => !v)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/35 hover:text-white/70 transition-colors"
            aria-label={showPw ? "Hide password" : "Show password"}
          >
            {showPw ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
          </button>
        </div>
      </div>

      <GoldButton type="submit" variant="solid-gold" size="lg" disabled={loading} className="w-full">
        {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Signing in…</> : "Sign In to PathPort"}
      </GoldButton>

      <p className="text-center text-white/38 font-body text-sm">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="text-gold-400 hover:text-gold-300 font-medium transition-colors">
          Create one free
        </Link>
      </p>
    </form>
  );
}
