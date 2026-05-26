"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import GoldButton from "@/components/ui/GoldButton";
import { Eye, EyeOff, Loader2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const INPUT = cn(
  "w-full bg-white/[0.06] border border-white/[0.10] rounded-xl px-4 py-3.5",
  "font-body text-sm text-white placeholder-white/25",
  "focus:outline-none focus:border-gold-400/60 focus:ring-1 focus:ring-gold-400/20",
  "transition-all duration-200"
);

/**
 * Admin-only login form.
 * - Checks profile.role === "admin" after signInWithPassword.
 * - Signs out and shows error if role is not admin.
 * - Uses router.push + router.refresh for the redirect.
 * - Always clears loading on any error path.
 */
export default function AdminLoginForm() {
  const router   = useRouter();
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

    try {

      // ── 1. Authenticate with Supabase ──────────────────────────────────
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email:    email.trim().toLowerCase(),
        password,
      });

      if (authError) {
        setError(authError.message);
        setLoading(false);
        return;
      }

      // ── 2. Fetch profile role ──────────────────────────────────────────
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", data.user.id)
        .single();

      if (profileError || !profile) {
        await supabase.auth.signOut();
        setError("Could not verify account. Please try again.");
        setLoading(false);
        return;
      }

      // ── 3. Admin role check ────────────────────────────────────────────
      if (profile.role !== "admin") {
        await supabase.auth.signOut();
        setError("You do not have admin access.");
        setLoading(false);
        return;
      }

      // ── 4. Redirect to admin dashboard ─────────────────────────────────
      // router.push navigates client-side; router.refresh flushes the
      // server-component cache so the dashboard sees the live session.
      router.push("/dashboard/admin");
      router.refresh();
      // Loading stays true — component unmounts on successful navigation.
      // If navigation never happens the button stays disabled, which is
      // preferable to flickering back to the ready state.

    } catch {
      setError("Sign in failed. Please check your credentials and try again.");
      setLoading(false);
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
      {/* Error banner */}
      {error && (
        <div
          role="alert"
          className="flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 font-body text-sm"
        >
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      {/* Email */}
      <div>
        <label htmlFor="admin-email" className="block text-white/55 font-body text-sm mb-1.5 tracking-wide">
          Email Address
        </label>
        <input
          id="admin-email"
          type="email"
          required
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="admin@pathport.sg"
          className={INPUT}
          autoComplete="email"
          autoFocus
        />
      </div>

      {/* Password */}
      <div>
        <label htmlFor="admin-password" className="block text-white/55 font-body text-sm mb-1.5 tracking-wide">
          Password
        </label>
        <div className="relative">
          <input
            id="admin-password"
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
            {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <GoldButton
        type="submit"
        variant="solid-gold"
        size="lg"
        disabled={loading}
        className="w-full"
      >
        {loading
          ? <><Loader2 className="w-5 h-5 animate-spin" /> Signing in…</>
          : "Sign In"
        }
      </GoldButton>
    </form>
  );
}
