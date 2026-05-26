import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import StatCard from "@/components/dashboard/StatCard";
import { Users, ClipboardList, BarChart2, Briefcase } from "lucide-react";

export default async function EmployerDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "employer") redirect("/dashboard");

  return (
    <div className="space-y-8 max-w-6xl">
      <div>
        <h2 className="font-display text-3xl text-white mb-1">Employer Dashboard</h2>
        <p className="text-white/45 font-body text-sm">
          Find talented diploma interns and manage your 6+6 pathway hires.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Intern Requests"   value="—" icon={ClipboardList} gold />
        <StatCard label="Current Interns"   value="—" icon={Users}             />
        <StatCard label="Past Hires"        value="—" icon={Briefcase}         />
        <StatCard label="Reports"           value="—" icon={BarChart2}         />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gold-400/[0.06] border border-gold-400/20 rounded-2xl p-7">
          <h3 className="font-display text-xl text-white mb-2">The 6+6 Pathway</h3>
          <p className="text-white/55 font-body text-sm leading-relaxed mb-4">
            Hire pre-trained Singapore diploma students for a 6-month paid internship at <strong className="text-white/80">S$800 – S$1,500 / month</strong>. PathPort handles all placement logistics.
          </p>
          <p className="text-gold-400 font-body text-sm font-semibold">
            Contact us to post an intern request →
          </p>
        </div>

        <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-7">
          <h3 className="font-display text-xl text-white mb-2">Get Started</h3>
          <p className="text-white/55 font-body text-sm leading-relaxed mb-4">
            Our employer relations team will contact you within 24 hours to understand your hiring needs and match you with the right candidates.
          </p>
          <p className="text-white/55 font-body text-sm">
            📧 <span className="text-gold-400">pathpportsg@gmail.com</span><br />
            📞 <span className="text-gold-400">+65 8377 6492</span>
          </p>
        </div>
      </div>
    </div>
  );
}
