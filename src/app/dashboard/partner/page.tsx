import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Award, Clock } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function PartnerDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "recruitment_partner") redirect("/dashboard");

  const partnerName = profile?.full_name ?? "Partner";

  return (
    <div className="space-y-7 max-w-3xl">

      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gold-500/10 via-navy-900/80 to-navy-950 border border-gold-400/20 p-6 md:p-8">
        <div aria-hidden className="absolute top-0 right-0 w-64 h-48 bg-gold-400/[0.08] rounded-full blur-3xl pointer-events-none" />
        <div className="relative flex items-center gap-3 mb-1">
          <Award className="w-4 h-4 text-gold-400" />
          <p className="text-gold-400 font-body text-xs font-semibold tracking-widest uppercase">Recruitment Partner</p>
        </div>
        <h2 className="relative font-display text-4xl text-white mb-1">{partnerName}</h2>
        <p className="relative text-white/45 font-body text-sm">Partner Portal</p>
      </div>

      {/* Portal under preparation */}
      <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-8 flex flex-col items-center text-center gap-4">
        <div className="w-14 h-14 rounded-full bg-gold-400/10 border border-gold-400/20 flex items-center justify-center">
          <Clock className="w-6 h-6 text-gold-400" />
        </div>
        <div>
          <h3 className="font-display text-2xl text-white mb-2">Partner Portal Coming Soon</h3>
          <p className="text-white/50 font-body text-sm leading-relaxed max-w-md">
            The recruitment partner portal — candidate pipeline, placement tracking, and commission reporting —
            is currently being built. You will be notified when it&apos;s ready.
          </p>
        </div>
        <p className="text-white/30 font-body text-xs">
          For urgent matters, contact your PathPort account manager.
        </p>
      </div>

    </div>
  );
}
