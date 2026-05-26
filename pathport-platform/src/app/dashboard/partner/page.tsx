import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import StatCard from "@/components/dashboard/StatCard";
import { Users, Briefcase, BarChart2, Award } from "lucide-react";

export default async function PartnerDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "recruitment_partner") redirect("/dashboard");

  return (
    <div className="space-y-8 max-w-6xl">
      <div>
        <h2 className="font-display text-3xl text-white mb-1">Recruitment Partner Dashboard</h2>
        <p className="text-white/45 font-body text-sm">
          Source candidates, track placements, and grow your Singapore network.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Active Candidates"  value="—" icon={Users}     gold />
        <StatCard label="Placements Made"    value="—" icon={Briefcase}      />
        <StatCard label="Partner Rating"     value="—" icon={Award}          />
        <StatCard label="Monthly Reports"    value="—" icon={BarChart2}      />
      </div>

      <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-8 text-center">
        <Award className="w-12 h-12 text-gold-400/40 mx-auto mb-3" />
        <h3 className="font-display text-2xl text-white mb-2">Partner Onboarding</h3>
        <p className="text-white/45 font-body text-sm max-w-md mx-auto">
          Welcome to PathPort&apos;s recruitment partner programme. Our team will reach out within 24 hours to onboard you and share candidate profiles.
        </p>
        <p className="text-gold-400 font-body text-sm mt-3 font-semibold">
          pathpportsg@gmail.com · +65 8377 6492
        </p>
      </div>
    </div>
  );
}
