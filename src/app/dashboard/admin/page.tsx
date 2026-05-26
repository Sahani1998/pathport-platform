import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import StatCard from "@/components/dashboard/StatCard";
import { Users, FileText, Building2, Award, TrendingUp, AlertCircle } from "lucide-react";

export default async function AdminDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") redirect("/dashboard");

  // Fetch real counts
  const [{ count: totalStudents }, { count: totalProfiles }] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "student"),
    supabase.from("profiles").select("*", { count: "exact", head: true }),
  ]);

  return (
    <div className="space-y-8 max-w-6xl">
      <div>
        <h2 className="font-display text-3xl text-white mb-1">Admin Dashboard</h2>
        <p className="text-white/45 font-body text-sm">Platform overview and management.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Students"     value={totalStudents ?? 0} icon={Users}     gold />
        <StatCard label="Total Users"        value={totalProfiles ?? 0} icon={TrendingUp}     />
        <StatCard label="Active Colleges"    value="—"                  icon={Building2}      />
        <StatCard label="Open Applications"  value="—"                  icon={FileText}       />
      </div>

      {/* Recent activity placeholder */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-6">
          <h3 className="font-display text-xl text-white mb-4">Recent Registrations</h3>
          <div className="flex flex-col items-center justify-center py-8 text-white/25">
            <Users className="w-10 h-10 mb-3" />
            <p className="font-body text-sm">No recent registrations yet.</p>
          </div>
        </div>

        <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-6">
          <h3 className="font-display text-xl text-white mb-4">Pending Actions</h3>
          <div className="flex items-center gap-3 p-4 rounded-xl bg-gold-400/[0.07] border border-gold-400/25">
            <AlertCircle className="w-5 h-5 text-gold-400 flex-shrink-0" />
            <p className="text-white/65 font-body text-sm">
              Set up your Supabase tables and RLS policies to see live data here.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
