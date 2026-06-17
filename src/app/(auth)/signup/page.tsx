import type { Metadata } from "next";
import SignupForm from "@/components/auth/SignupForm";

export const metadata: Metadata = {
  title: "Register as Student | PathPort",
  description:
    "Create your free PathPort student account and start your Singapore diploma journey. Apply from India — offer letter in 24 hours.",
};

interface PageProps {
  searchParams: Promise<Record<string, string>>;
}

export default async function SignupPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const redirectAfterSignup = params.redirect || undefined;

  return (
    <>
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 bg-gold-400/10 border border-gold-400/25 rounded-full px-3.5 py-1.5 mb-4">
          <span className="text-base">🎓</span>
          <span className="text-gold-300 font-body text-xs font-semibold tracking-widest uppercase">
            Student Registration
          </span>
        </div>
        <h1 className="font-display text-3xl text-white mb-2">Register as Student</h1>
        <p className="text-white/45 font-body text-sm max-w-xs mx-auto leading-relaxed">
          Free to register. Advisor calls within 24 hours.
          Courses from <span className="text-gold-400">SGD 4,000/year</span>.
        </p>
      </div>
      <SignupForm redirectAfterSignup={redirectAfterSignup} />
    </>
  );
}
