import type { Metadata } from "next";
import LoginForm from "@/components/auth/LoginForm";

export const metadata: Metadata = {
  title: "Sign In | PathPort",
  description: "Sign in to your PathPort account.",
};

interface PageProps {
  searchParams: Promise<Record<string, string>>;
}

export default async function LoginPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const successMessage = params.message === "password-updated"
    ? "Password updated successfully. Sign in with your new password."
    : undefined;
  const redirectAfterLogin = params.redirect || undefined;

  return (
    <>
      <div className="text-center mb-8">
        <h1 className="font-display text-3xl text-white mb-2">Welcome Back</h1>
        <p className="text-white/45 font-body text-sm">
          Sign in to access your PathPort dashboard.
        </p>
      </div>
      <LoginForm successMessage={successMessage} redirectAfterLogin={redirectAfterLogin} />
    </>
  );
}
