import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { CreditCard, ChevronRight, Palette, Image as ImageIcon } from "lucide-react";

export const metadata = { title: "Settings — Institution" };

export default async function InstitutionSettingsIndexPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles").select("role, college_id").eq("id", user.id).single();
  if (profile?.role !== "institution" && profile?.role !== "admin") redirect("/dashboard");

  const links = [
    {
      href:     "/dashboard/institution/settings/branding",
      icon:     <Palette className="w-5 h-5 text-pathBlue-400" />,
      iconBg:   "bg-pathBlue-500/10 border-pathBlue-500/20",
      title:    "Branding",
      subtitle: "Logo, cover image, tagline, brand colours, mission & vision",
    },
    {
      href:     "/dashboard/institution/settings/gallery",
      icon:     <ImageIcon className="w-5 h-5 text-emerald-400" />,
      iconBg:   "bg-emerald-500/10 border-emerald-400/20",
      title:    "Campus Gallery",
      subtitle: "Upload and manage campus photos shown on your public page",
    },
    {
      href:     "/dashboard/institution/settings/payments",
      icon:     <CreditCard className="w-5 h-5 text-gold-400" />,
      iconBg:   "bg-gold-400/10 border-gold-400/20",
      title:    "Payment Settings",
      subtitle: "Bank transfer + Wise details shown to students at checkout",
    },
  ];

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h2 className="font-display text-3xl text-white mb-1">Settings</h2>
        <p className="text-white/40 font-body text-sm">Configure your institution profile, media, and payment defaults</p>
      </div>

      <div className="space-y-3">
        {links.map(link => (
          <Link key={link.href} href={link.href}
            className="flex items-center justify-between p-5 rounded-2xl bg-white/[0.04] border border-white/[0.08] hover:border-gold-400/25 hover:bg-gold-400/[0.03] transition-all group">
            <div className="flex items-center gap-4">
              <div className={`p-2.5 rounded-xl border ${link.iconBg}`}>
                {link.icon}
              </div>
              <div>
                <p className="font-display text-lg text-white">{link.title}</p>
                <p className="font-body text-sm text-white/45">{link.subtitle}</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-white/25 group-hover:text-gold-400/60 transition-colors" />
          </Link>
        ))}
      </div>
    </div>
  );
}
