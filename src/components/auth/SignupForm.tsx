"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import GoldButton from "@/components/ui/GoldButton";
import RoleSelector from "@/components/auth/RoleSelector";
import { Eye, EyeOff, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SignupFormData, UserRole } from "@/types/auth";
import { ROLE_META } from "@/types/auth";

const INPUT = cn(
  "w-full bg-white/[0.06] border border-white/[0.10] rounded-xl px-4 py-3.5",
  "font-body text-sm text-white placeholder-white/25",
  "focus:outline-none focus:border-gold-400/60 focus:ring-1 focus:ring-gold-400/20",
  "transition-all duration-200"
);

const LABEL = "block text-white/55 font-body text-sm mb-1.5 tracking-wide";

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: "8+ characters", pass: password.length >= 8 },
    { label: "Uppercase letter", pass: /[A-Z]/.test(password) },
    { label: "Number", pass: /[0-9]/.test(password) },
  ];
  if (!password) return null;
  return (
    <div className="flex gap-3 mt-2">
      {checks.map(c => (
        <span key={c.label} className={cn("flex items-center gap-1 font-body text-xs", c.pass ? "text-emerald-400" : "text-white/30")}>
          <CheckCircle2 className="w-3 h-3" />
          {c.label}
        </span>
      ))}
    </div>
  );
}

export default function SignupForm() {
  const router   = useRouter();
  const supabase = createClient();

  const [form, setForm] = useState<SignupFormData>({
    fullName: "", email: "", password: "", confirmPassword: "",
    role: "student", phone: "", country: "India",
  });
  const [showPw,   setShowPw]   = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);

  const set = (key: keyof SignupFormData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm(p => ({ ...p, [key]: e.target.value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (form.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);

    const { data, error: authError } = await supabase.auth.signUp({
      email:    form.email.trim(),
      password: form.password,
      options:  {
        data: {
          full_name: form.fullName.trim(),
          role:      form.role,
          phone:     form.phone,
          country:   form.country,
        },
      },
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    // Redirect to role-specific dashboard
    const roleMeta = ROLE_META.find(r => r.value === form.role);
    router.push(roleMeta?.dashboardPath ?? "/dashboard");
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      {error && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 font-body text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Name + Email */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="su-name" className={LABEL}>Full Name <span className="text-gold-400">*</span></label>
          <input id="su-name" type="text" required value={form.fullName}
            onChange={set("fullName")} placeholder="Your full name"
            className={INPUT} autoComplete="name" />
        </div>
        <div>
          <label htmlFor="su-email" className={LABEL}>Email <span className="text-gold-400">*</span></label>
          <input id="su-email" type="email" required value={form.email}
            onChange={set("email")} placeholder="you@email.com"
            className={INPUT} autoComplete="email" />
        </div>
      </div>

      {/* Password */}
      <div>
        <label htmlFor="su-pw" className={LABEL}>Password <span className="text-gold-400">*</span></label>
        <div className="relative">
          <input id="su-pw" type={showPw ? "text" : "password"} required
            value={form.password} onChange={set("password")}
            placeholder="Create a strong password"
            className={cn(INPUT, "pr-12")} autoComplete="new-password" />
          <button type="button" onClick={() => setShowPw(v => !v)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/35 hover:text-white/70 transition-colors"
            aria-label={showPw ? "Hide" : "Show"}>
            {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        <PasswordStrength password={form.password} />
      </div>

      {/* Confirm password */}
      <div>
        <label htmlFor="su-cpw" className={LABEL}>Confirm Password <span className="text-gold-400">*</span></label>
        <input id="su-cpw" type="password" required
          value={form.confirmPassword} onChange={set("confirmPassword")}
          placeholder="Repeat your password"
          className={INPUT} autoComplete="new-password" />
      </div>

      {/* Phone + Country */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="su-phone" className={LABEL}>WhatsApp / Phone</label>
          <input id="su-phone" type="tel" value={form.phone ?? ""}
            onChange={set("phone")} placeholder="+91 98765 43210"
            className={INPUT} autoComplete="tel" />
        </div>
        <div>
          <label htmlFor="su-country" className={LABEL}>Country</label>
          <input id="su-country" type="text" value={form.country ?? "India"}
            onChange={set("country")} placeholder="India"
            className={INPUT} autoComplete="country-name" />
        </div>
      </div>

      {/* Role selector */}
      <RoleSelector
        value={form.role}
        onChange={(role: UserRole) => setForm(p => ({ ...p, role }))}
      />

      <GoldButton type="submit" variant="solid-gold" size="lg" disabled={loading} className="w-full">
        {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Creating account…</> : "Create My PathPort Account"}
      </GoldButton>

      <p className="text-center text-white/38 font-body text-sm">
        Already have an account?{" "}
        <Link href="/login" className="text-gold-400 hover:text-gold-300 font-medium transition-colors">
          Sign in
        </Link>
      </p>

      <p className="text-center text-white/22 font-body text-xs">
        By creating an account you agree to our{" "}
        <Link href="#" className="text-white/40 hover:text-white/60 underline underline-offset-2">Terms</Link>
        {" "}and{" "}
        <Link href="#" className="text-white/40 hover:text-white/60 underline underline-offset-2">Privacy Policy</Link>.
      </p>
    </form>
  );
}
