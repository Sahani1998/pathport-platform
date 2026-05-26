import type { Metadata } from "next";
import LoginForm from "@/components/auth/LoginForm";

export const metadata: Metadata = {
  title: "Sign In | PathPort",
  description: "Sign in to your PathPort account.",
};

export default function LoginPage() {
  return (
    <>
      <div className="text-center mb-8">
        <h1 className="font-display text-3xl text-white mb-2">Welcome Back</h1>
        <p className="text-white/45 font-body text-sm">
          Sign in to access your PathPort dashboard.
        </p>
      </div>
      <LoginForm />
    </>
  );
}
