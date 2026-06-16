import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Briefcase, Clock } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function EmployerDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "employer") redirect("/dashboard");

  const companyName = profile?.full_name ?? "Your Company";

  return (
    <div className="space-y-7 max-w-3xl">

      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600/10 via-navy-900/80 to-navy-950 border border-white/[0.08] p-6 md:p-8">
        <div aria-hidden className="absolute -top-8 -right-8 w-56 h-56 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <p className="relative text-emerald-400/70 font-body text-xs font-semibold tracking-widest uppercase mb-1">Employer Portal</p>
        <h2 className="relative font-display text-4xl text-white mb-1">{companyName}</h2>
        <p className="relative text-white/45 font-body text-sm">Singapore · 6+6 Pathway Partner</p>
      </div>

      {/* Portal under preparation */}
      <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-8 flex flex-col items-center text-center gap-4">
        <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
          <Clock className="w-6 h-6 text-emerald-400" />
        </div>
        <div>
          <h3 className="font-display text-2xl text-white mb-2">Employer Portal Coming Soon</h3>
          <p className="text-white/50 font-body text-sm leading-relaxed max-w-md">
            The employer portal — intern requests, active placements, and hire history —
            is currently being built. You will be notified when it&apos;s ready.
          </p>
        </div>
        <div className="flex items-center gap-2 text-white/30 font-body text-xs">
          <Briefcase className="w-3.5 h-3.5" />
          <span>For urgent matters, contact your PathPort account manager.</span>
        </div>
      </div>

    </div>
  );
}
