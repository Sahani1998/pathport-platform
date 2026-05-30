import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { UserCircle, Mail, Phone, Globe, Clock } from "lucide-react";

export default async function StudentProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email, phone, country, role, created_at")
    .eq("id", user.id)
    .single();

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="font-display text-3xl text-white mb-1">My Profile</h2>
        <p className="text-white/40 font-body text-sm">View and manage your account details</p>
      </div>

      {/* Avatar + name */}
      <div className="flex items-center gap-5 p-6 rounded-2xl bg-white/[0.04] border border-white/[0.08]">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gold-500 to-gold-600 flex items-center justify-center flex-shrink-0 text-navy-900 font-display font-bold text-2xl">
          {(profile?.full_name ?? user.email ?? "U")[0].toUpperCase()}
        </div>
        <div>
          <p className="font-display text-2xl text-white">{profile?.full_name ?? "—"}</p>
          <p className="text-white/40 font-body text-sm mt-0.5">{profile?.email ?? user.email}</p>
          <span className="inline-flex items-center mt-1.5 px-2.5 py-0.5 rounded-full bg-gold-400/15 border border-gold-400/25 text-gold-400 font-body text-[10px] font-semibold tracking-wider uppercase">
            {profile?.role ?? "student"}
          </span>
        </div>
      </div>

      {/* Details */}
      <div className="rounded-2xl bg-white/[0.04] border border-white/[0.08] divide-y divide-white/[0.06]">
        {[
          { icon: Mail,      label: "Email",    value: profile?.email ?? user.email ?? "—" },
          { icon: Phone,     label: "Phone",    value: profile?.phone ?? "Not set"         },
          { icon: Globe,     label: "Country",  value: profile?.country ?? "Not set"       },
          { icon: Clock,     label: "Member since", value: profile?.created_at ? new Date(profile.created_at).toLocaleDateString("en-SG", { day: "numeric", month: "long", year: "numeric" }) : "—" },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="flex items-center gap-4 px-6 py-4">
            <div className="w-9 h-9 rounded-xl bg-white/[0.05] border border-white/10 flex items-center justify-center flex-shrink-0">
              <Icon className="w-4 h-4 text-gold-400/70" />
            </div>
            <div>
              <p className="text-white/35 font-body text-[10px] uppercase tracking-wider">{label}</p>
              <p className="text-white/80 font-body text-sm font-medium">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Coming soon notice */}
      <div className="flex items-start gap-3 p-4 rounded-2xl bg-pathBlue-500/[0.07] border border-pathBlue-500/20">
        <UserCircle className="w-5 h-5 text-pathBlue-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-body text-sm text-white/70 font-semibold mb-0.5">Profile editing coming soon</p>
          <p className="font-body text-xs text-white/40">
            To update your name, phone, or country, contact your PathPort advisor on WhatsApp.
          </p>
        </div>
      </div>
    </div>
  );
}
