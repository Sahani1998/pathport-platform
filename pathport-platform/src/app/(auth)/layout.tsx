import type { ReactNode } from "react";
import Link from "next/link";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-navy-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background orbs */}
      <div aria-hidden className="absolute top-[20%] left-[10%] w-[400px] h-[400px] rounded-full bg-pathBlue-500/[0.06] blur-[120px] pointer-events-none" />
      <div aria-hidden className="absolute bottom-[15%] right-[10%] w-[350px] h-[350px] rounded-full bg-gold-400/[0.05] blur-[110px] pointer-events-none" />
      <div aria-hidden className="absolute inset-0 bg-[linear-gradient(rgba(59,158,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(59,158,255,0.02)_1px,transparent_1px)] bg-[size:60px_60px] pointer-events-none" />

      {/* Logo */}
      <Link href="/" className="flex items-center gap-2.5 mb-8 group">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pathBlue-500 to-pathBlue-700 flex items-center justify-center shadow-blue-sm group-hover:shadow-blue transition-shadow">
          <span className="font-display font-bold text-white text-base leading-none">PP</span>
        </div>
        <span className="font-display text-[1.7rem] leading-none tracking-tight">
          <span className="text-pathBlue-400">Path</span><span className="text-gold-400">Port</span>
        </span>
      </Link>

      {/* Card */}
      <div className="relative w-full max-w-[520px] bg-gradient-to-br from-white/[0.07] to-white/[0.02] border border-white/[0.10] rounded-2xl shadow-glass backdrop-blur-md p-8 md:p-10">
        {children}
      </div>

      {/* Footer */}
      <p className="mt-8 text-white/25 font-body text-xs text-center">
        © {new Date().getFullYear()} PathPort · India&apos;s Singapore Diploma Platform
      </p>
    </div>
  );
}
