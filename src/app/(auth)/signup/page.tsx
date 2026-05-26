import type { Metadata } from "next";
import SignupForm from "@/components/auth/SignupForm";

export const metadata: Metadata = {
  title: "Create Account | PathPort",
  description: "Create your free PathPort account and start your Singapore journey.",
};

export default function SignupPage() {
  return (
    <>
      <div className="text-center mb-8">
        <h1 className="font-display text-3xl text-white mb-2">Create Your Account</h1>
        <p className="text-white/45 font-body text-sm">
          Join PathPort — Singapore&apos;s India diploma platform. Free to register.
        </p>
      </div>
      <SignupForm />
    </>
  );
}
