import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import StatCard from "@/components/dashboard/StatCard";
import { FileText, Briefcase, GraduationCap, Clock, ArrowRight } from "lucide-react";
import GoldButton from "@/components/ui/GoldButton";
import Link from "next/link";

export default async function StudentDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  // Guard — only students
  if (profile?.role !== "student") redirect("/dashboard");

  const firstName = profile?.full_name?.split(" ")[0] ?? "Student";

  return (
    <div className="space-y-8 max-w-6xl">

      {/* Welcome */}
      <div>
        <h2 className="font-display text-3xl text-white mb-1">
          Welcome back, <span className="text-gold-400">{firstName}</span> 👋
        </h2>
        <p className="text-white/45 font-body text-sm">
          Here&apos;s a snapshot of your Singapore journey.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Applications Sent"  value="0"  icon={FileText}      gold  />
        <StatCard label="Offer Letters"       value="0"  icon={GraduationCap}       />
        <StatCard label="Internships Applied" value="0"  icon={Briefcase}           />
        <StatCard label="Days to Next Intake" value="—"  icon={Clock}               />
      </div>

      {/* Two-column content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Next steps */}
        <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-6">
          <h3 className="font-display text-xl text-white mb-4">Your Next Steps</h3>
          <ol className="space-y-4">
            {[
              { step: "1", title: "Complete your profile",        done: !!profile?.phone                    },
              { step: "2", title: "Browse diploma programmes",    done: false                               },
              { step: "3", title: "Submit college application",   done: false                               },
              { step: "4", title: "Receive offer letter",         done: false                               },
              { step: "5", title: "Apply for Student Pass (ICA)", done: false                               },
            ].map(({ step, title, done }) => (
              <li key={step} className="flex items-center gap-3">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 font-body font-bold text-xs border ${
                  done
                    ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400"
                    : "bg-white/[0.05] border-white/15 text-white/40"
                }`}>
                  {done ? "✓" : step}
                </div>
                <span className={`font-body text-sm ${done ? "text-white/40 line-through" : "text-white/75"}`}>
                  {title}
                </span>
              </li>
            ))}
          </ol>
        </div>

        {/* Quick actions */}
        <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-6">
          <h3 className="font-display text-xl text-white mb-4">Quick Actions</h3>
          <div className="space-y-3">
            {[
              { label: "Browse Singapore Colleges",  href: "/dashboard/student/courses",     icon: GraduationCap },
              { label: "View Internship Listings",   href: "/dashboard/student/internships", icon: Briefcase     },
              { label: "Upload Documents",           href: "/dashboard/student/documents",   icon: FileText      },
              { label: "Track My Application",       href: "/dashboard/student/applications",icon: Clock         },
            ].map(({ label, href, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center justify-between gap-3 p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.07] hover:border-gold-400/30 hover:bg-gold-400/[0.04] transition-all group"
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4 text-gold-400/70 flex-shrink-0" />
                  <span className="font-body text-sm text-white/70 group-hover:text-white/90">{label}</span>
                </div>
                <ArrowRight className="w-4 h-4 text-white/20 group-hover:text-gold-400/60 group-hover:translate-x-0.5 transition-all" />
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Advisor CTA */}
      <div className="p-6 rounded-2xl bg-gold-400/[0.06] border border-gold-400/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <p className="font-display text-xl text-white mb-1">Need help? Talk to your PathPort Advisor</p>
          <p className="text-white/45 font-body text-sm">Free consultation · WhatsApp response within 24 hours</p>
        </div>
        <GoldButton variant="solid-gold" size="md" className="flex-shrink-0">
          📞 +65 8377 6492
        </GoldButton>
      </div>
    </div>
  );
}
