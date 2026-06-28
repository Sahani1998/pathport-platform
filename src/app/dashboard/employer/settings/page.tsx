import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Settings, Building2, Bell, ExternalLink } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function EmployerSettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name, email")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "employer") redirect("/dashboard");

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h2 className="font-display text-3xl text-white mb-1">Settings</h2>
        <p className="text-white/40 font-body text-sm">Manage your employer account</p>
      </div>

      {/* Account info */}
      <div className="p-5 rounded-2xl bg-white/[0.04] border border-white/[0.08] space-y-4">
        <h3 className="font-display text-lg text-white">Account</h3>
        <div className="space-y-3">
          <div>
            <p className="font-body text-xs text-white/35 uppercase tracking-wider mb-1">Name</p>
            <p className="font-body text-sm text-white/75">{profile?.full_name ?? "—"}</p>
          </div>
          <div>
            <p className="font-body text-xs text-white/35 uppercase tracking-wider mb-1">Email</p>
            <p className="font-body text-sm text-white/75">{profile?.email ?? "—"}</p>
          </div>
          <div>
            <p className="font-body text-xs text-white/35 uppercase tracking-wider mb-1">Role</p>
            <p className="font-body text-sm text-white/75">Employer</p>
          </div>
        </div>
      </div>

      {/* Quick links */}
      <div className="p-5 rounded-2xl bg-white/[0.04] border border-white/[0.08] space-y-2">
        <h3 className="font-display text-lg text-white mb-3">Quick Actions</h3>
        {[
          { icon: Building2, label: "Company Profile", href: "/dashboard/employer/company",       desc: "Logo, offices, recruiters, verification" },
          { icon: Bell,      label: "Notifications",   href: "/dashboard/employer/notifications", desc: "View your notification inbox"            },
        ].map(({ icon: Icon, label, href, desc }) => (
          <Link key={label} href={href} className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/[0.04] transition-colors group">
            <div className="w-9 h-9 rounded-xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center flex-shrink-0">
              <Icon className="w-4 h-4 text-emerald-400/70" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-body text-sm text-white/75 font-semibold">{label}</p>
              <p className="font-body text-xs text-white/35 mt-0.5">{desc}</p>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-white/20 group-hover:text-white/40 transition-colors" />
          </Link>
        ))}
      </div>

      {/* Support */}
      <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.07]">
        <div className="flex items-center gap-2 mb-2">
          <Settings className="w-4 h-4 text-white/30" />
          <p className="font-body text-sm text-white/50 font-semibold">Need help?</p>
        </div>
        <p className="font-body text-xs text-white/35 mb-3">
          For account changes, billing, or support, contact your PathPort account manager.
        </p>
        <a
          href="https://wa.me/6583776492"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-400/25 text-emerald-400 font-body text-sm font-semibold hover:bg-emerald-500/20 transition-all"
        >
          💬 Contact Support
        </a>
      </div>
    </div>
  );
}
