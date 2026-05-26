import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import StatCard from "@/components/dashboard/StatCard";
import { GraduationCap, FileText, BookOpen, BarChart2 } from "lucide-react";

export default async function InstitutionDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("role, full_name").eq("id", user.id).single();
  if (profile?.role !== "institution") redirect("/dashboard");

  return (
    <div className="space-y-8 max-w-6xl">
      <div>
        <h2 className="font-display text-3xl text-white mb-1">Institution Dashboard</h2>
        <p className="text-white/45 font-body text-sm">
          Manage your college listings, applications, and student intake.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Enrolled Students"   value="—" icon={GraduationCap} gold />
        <StatCard label="Pending Applications" value="—" icon={FileText}          />
        <StatCard label="Active Courses"       value="—" icon={BookOpen}           />
        <StatCard label="Reports Generated"    value="—" icon={BarChart2}          />
      </div>

      <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-8 text-center">
        <GraduationCap className="w-12 h-12 text-gold-400/40 mx-auto mb-3" />
        <h3 className="font-display text-2xl text-white mb-2">Institution Setup</h3>
        <p className="text-white/45 font-body text-sm max-w-md mx-auto">
          Contact the PathPort admin team to configure your institution profile, course listings, and student intake settings.
        </p>
        <p className="text-gold-400 font-body text-sm mt-3 font-semibold">
          pathpportsg@gmail.com · +65 8377 6492
        </p>
      </div>
    </div>
  );
}
