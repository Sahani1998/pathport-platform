"use client";

import { useState, type FormEvent, type ChangeEvent } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import GoldButton from "@/components/ui/GoldButton";
import { Eye, EyeOff, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { COURSE_OPTIONS, INTAKE_OPTIONS, SUPPORTED_COUNTRIES } from "@/data/form-constants";

// ─── Styles ───────────────────────────────────────────────────────────────────

const INPUT = cn(
  "w-full bg-white/[0.06] border border-white/[0.10] rounded-xl px-4 py-3.5",
  "font-body text-sm text-white placeholder-white/25",
  "focus:outline-none focus:border-gold-400/60 focus:ring-1 focus:ring-gold-400/20",
  "transition-all duration-200 [color-scheme:dark] [&>option]:bg-[#0D1530] [&>option]:text-white"
);
const OPTION_STYLE = { backgroundColor: "#0a1024", color: "#fff" } as const;
const LABEL = "block text-white/55 font-body text-sm mb-1.5 tracking-wide";

// ─── Password strength indicator ─────────────────────────────────────────────

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: "8+ characters",   pass: password.length >= 8     },
    { label: "Uppercase letter", pass: /[A-Z]/.test(password)  },
    { label: "Number",           pass: /[0-9]/.test(password)  },
  ];
  if (!password) return null;
  return (
    <div className="flex gap-3 mt-2 flex-wrap">
      {checks.map(c => (
        <span
          key={c.label}
          className={cn(
            "flex items-center gap-1 font-body text-xs",
            c.pass ? "text-emerald-400" : "text-white/30"
          )}
        >
          <CheckCircle2 className="w-3 h-3" />
          {c.label}
        </span>
      ))}
    </div>
  );
}

// ─── Form state ───────────────────────────────────────────────────────────────

interface StudentSignupData {
  fullName:        string;
  email:           string;
  password:        string;
  confirmPassword: string;
  phone:           string;
  country:         string;
  courseInterest:  string;
  intendedIntake:  string;
}

const INITIAL: StudentSignupData = {
  fullName:        "",
  email:           "",
  password:        "",
  confirmPassword: "",
  phone:           "",
  country:         "India",
  courseInterest:  "",
  intendedIntake:  "",
};

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Public student-only signup form.
 * Role is hardcoded to "student" — not shown to the user.
 * Institution / Employer / Partner accounts are approved manually by admin.
 */
export default function SignupForm({ redirectAfterSignup }: { redirectAfterSignup?: string }) {
  const supabase = createClient();

  const [form,    setForm]    = useState<StudentSignupData>(INITIAL);
  const [showPw,  setShowPw]  = useState(false);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const onChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e: FormEvent) => {
    // Must be synchronous and first — prevents any native GET fallback
    e.preventDefault();
    e.stopPropagation();

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

    try {
      const { error: authError } = await supabase.auth.signUp({
        email:    form.email.trim().toLowerCase(),
        password: form.password,
        options: {
          data: {
            full_name:       form.fullName.trim(),
            role:            "student",          // always student — never exposed
            phone:           form.phone.trim(),
            country:         form.country,
            course_interest: form.courseInterest,
            intended_intake: form.intendedIntake,
          },
        },
      });

      if (authError) {
        setError(authError.message);
        return;
      }

      const dest = (redirectAfterSignup && redirectAfterSignup.startsWith("/"))
        ? redirectAfterSignup
        : "/dashboard/student";
      window.location.href = dest;
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
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
        <div className="flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 font-body text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      {/* Full Name + Email */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="su-name" className={LABEL}>
            Full Name <span className="text-gold-400">*</span>
          </label>
          <input
            id="su-name" name="fullName" type="text" required
            value={form.fullName} onChange={onChange}
            placeholder="e.g. Rahul Sharma"
            className={INPUT} autoComplete="name" autoFocus
          />
        </div>
        <div>
          <label htmlFor="su-email" className={LABEL}>
            Email Address <span className="text-gold-400">*</span>
          </label>
          <input
            id="su-email" name="email" type="email" required
            value={form.email} onChange={onChange}
            placeholder="you@email.com"
            className={INPUT} autoComplete="email"
          />
        </div>
      </div>

      {/* Password */}
      <div>
        <label htmlFor="su-pw" className={LABEL}>
          Password <span className="text-gold-400">*</span>
        </label>
        <div className="relative">
          <input
            id="su-pw" name="password"
            type={showPw ? "text" : "password"} required
            value={form.password} onChange={onChange}
            placeholder="Create a strong password"
            className={cn(INPUT, "pr-12")}
            autoComplete="new-password"
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
        <PasswordStrength password={form.password} />
      </div>

      {/* Confirm Password */}
      <div>
        <label htmlFor="su-cpw" className={LABEL}>
          Confirm Password <span className="text-gold-400">*</span>
        </label>
        <input
          id="su-cpw" name="confirmPassword" type="password" required
          value={form.confirmPassword} onChange={onChange}
          placeholder="Repeat your password"
          className={INPUT} autoComplete="new-password"
        />
      </div>

      {/* WhatsApp + Country */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="su-phone" className={LABEL}>WhatsApp / Phone</label>
          <input
            id="su-phone" name="phone" type="tel"
            value={form.phone} onChange={onChange}
            placeholder="+91 98765 43210"
            className={INPUT} autoComplete="tel"
          />
        </div>
        <div>
          <label htmlFor="su-country" className={LABEL}>Country</label>
          <select
            id="su-country" name="country"
            value={form.country} onChange={onChange}
            className={cn(INPUT, "appearance-none cursor-pointer")}
          >
            {SUPPORTED_COUNTRIES.map(({ value, label }) => (
              <option key={value} value={value} style={OPTION_STYLE}>{label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Intended Course + Intake */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="su-course" className={LABEL}>Intended Course</label>
          <select
            id="su-course" name="courseInterest"
            value={form.courseInterest} onChange={onChange}
            className={cn(INPUT, "appearance-none cursor-pointer")}
          >
            <option value="" style={OPTION_STYLE}>Select a course</option>
            {COURSE_OPTIONS.map(c => (
              <option key={c} value={c} style={OPTION_STYLE}>{c}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="su-intake" className={LABEL}>Intended Intake</label>
          <select
            id="su-intake" name="intendedIntake"
            value={form.intendedIntake} onChange={onChange}
            className={cn(INPUT, "appearance-none cursor-pointer")}
          >
            <option value="" style={OPTION_STYLE}>Select intake</option>
            {INTAKE_OPTIONS.map(i => (
              <option key={i} value={i} style={OPTION_STYLE}>{i}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Submit */}
      <GoldButton
        type="submit"
        variant="solid-gold"
        size="lg"
        disabled={loading}
        className="w-full"
      >
        {loading ? (
          <><Loader2 className="w-5 h-5 animate-spin" /> Creating account…</>
        ) : (
          "Create Student Account — Free"
        )}
      </GoldButton>

      {/* Sign in link */}
      <p className="text-center text-white/38 font-body text-sm">
        Already have an account?{" "}
        <Link href="/login" className="text-gold-400 hover:text-gold-300 font-medium transition-colors">
          Sign in
        </Link>
      </p>

      {/* Partner note */}
      <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.07] text-center">
        <p className="text-white/35 font-body text-xs leading-relaxed">
          Institution, Recruitment Partner, or Employer?{" "}
          <Link href="/partner-with-us" className="text-gold-400/80 hover:text-gold-400 underline underline-offset-2 transition-colors">
            Apply to partner with PathPort →
          </Link>
        </p>
      </div>

      {/* Terms */}
      <p className="text-center text-white/45 font-body text-xs">
        By registering you agree to our{" "}
        <Link href="#" className="text-white/40 hover:text-white/60 underline underline-offset-2">Terms</Link>
        {" "}and{" "}
        <Link href="#" className="text-white/40 hover:text-white/60 underline underline-offset-2">Privacy Policy</Link>.
      </p>
    </form>
  );
}
