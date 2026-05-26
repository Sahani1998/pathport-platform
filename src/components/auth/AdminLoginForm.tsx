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

      // ── 0. Clear any stale cached session ────────────────────────────────
      // Prevents a previous session's JWT being used for the profile query.
      await supabase.auth.signOut();

      // ── 1. Authenticate ───────────────────────────────────────────────────
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email:    email.trim().toLowerCase(),
        password,
      });

      if (authError) {
        console.error("[AdminLogin] signInWithPassword error:", authError.message);
        setError(authError.message);
        setLoading(false);
        return;
      }

      console.log("[AdminLogin] Auth success. User ID:", data.user.id);
      console.log("[AdminLogin] User email:", data.user.email);

      // ── 2. Fetch profile from public.profiles ─────────────────────────────
      // Select id + role + email so we can confirm which row was returned.
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id, role, email")
        .eq("id", data.user.id)
        .single();

      console.log("[AdminLogin] Profile query result:", profile);
      console.log("[AdminLogin] Profile query error:", profileError);

      if (profileError || !profile) {
        console.error("[AdminLogin] Profile not found or RLS blocked:", profileError?.message);
        await supabase.auth.signOut();
        setError("Could not load your profile. Ensure the profiles table and RLS policies are set up.");
        setLoading(false);
        return;
      }

      // ── 3. Role check — trimmed + lowercase to catch any whitespace/case ─
      const rawRole  = profile.role;
      const normRole = String(rawRole ?? "").trim().toLowerCase();

      console.log("[AdminLogin] Raw role value:", JSON.stringify(rawRole));
      console.log("[AdminLogin] Normalised role:", JSON.stringify(normRole));

      if (normRole !== "admin") {
        console.warn("[AdminLogin] Role mismatch — expected 'admin', got:", JSON.stringify(rawRole));
        await supabase.auth.signOut();
        setError(`You do not have admin access. (role: "${normRole || "empty"}")`);
        setLoading(false);
        return;
      }

      // ── 4. Verify session is committed, then redirect ─────────────────────
      // getSession() reads the cookie written by signInWithPassword.
      // If it returns null, the cookie hasn't been committed yet —
      // the server-side layout would see no user and redirect back to login.
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        console.error("[AdminLogin] Session not readable after sign-in — cookie may not be committed.");
        setError("Session could not be established. Please clear your browser cookies and try again.");
        setLoading(false);
        return;
      }

      console.log("[AdminLogin] Session confirmed. Redirecting to /dashboard/admin");
      router.push("/dashboard/admin");
      router.refresh();
      // Keep loading=true — component unmounts on successful navigation.

    } catch (err) {
      console.error("[AdminLogin] Unexpected error:", err);
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
