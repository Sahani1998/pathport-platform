import type { Metadata } from "next";
import Link from "next/link";
import AdminLoginForm from "@/components/auth/AdminLoginForm";

// No index, no follow — keeps this page out of search results
export const metadata: Metadata = {
  title: "Admin Access | PathPort",
  robots: { index: false, follow: false },
};

export default function AdminLoginPage() {
  return (
    <div className="min-h-screen bg-navy-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Subtle background */}
      <div aria-hidden className="absolute top-[20%] left-[15%] w-[350px] h-[350px] rounded-full bg-pathBlue-500/[0.04] blur-[120px] pointer-events-none" />
      <div aria-hidden className="absolute bottom-[20%] right-[15%] w-[300px] h-[300px] rounded-full bg-gold-400/[0.04] blur-[100px] pointer-events-none" />

      {/* Logo */}
      <Link href="/" className="flex items-center gap-2.5 mb-8 group">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pathBlue-500 to-pathBlue-700 flex items-center justify-center shadow-blue-sm">
          <span className="font-display font-bold text-white text-base leading-none">PP</span>
        </div>
        <span className="font-display text-[1.7rem] leading-none tracking-tight">
          <span className="text-pathBlue-400">Path</span><span className="text-gold-400">Port</span>
        </span>
      </Link>

      {/* Card */}
      <div className="relative w-full max-w-md bg-gradient-to-br from-white/[0.07] to-white/[0.02] border border-white/[0.10] rounded-2xl shadow-glass backdrop-blur-md p-8">
        {/* Admin badge — subtle, not prominent */}
        <div className="flex items-center justify-center gap-2 mb-6 p-2.5 rounded-xl bg-navy-800/60 border border-white/[0.07]">
          <span className="w-1.5 h-1.5 rounded-full bg-gold-400" />
          <span className="text-white/40 font-body text-xs tracking-widest uppercase">Restricted Access</span>
        </div>

        <div className="text-center mb-7">
          <h1 className="font-display text-2xl text-white mb-1.5">Admin Sign In</h1>
          <p className="text-white/38 font-body text-sm">
            This page is not publicly listed. Admin access only.
          </p>
        </div>

        <AdminLoginForm />
      </div>

      <p className="mt-6 text-white/18 font-body text-xs text-center">
        If you reached this page by mistake,{" "}
        <Link href="/" className="text-white/30 hover:text-white/50 underline underline-offset-2">
          return to PathPort
        </Link>
      </p>
    </div>
  );
}
