import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { CreditCard, ChevronRight } from "lucide-react";

export const metadata = { title: "Settings — Institution" };

export default async function InstitutionSettingsIndexPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles").select("role, college_id").eq("id", user.id).single();
  if (profile?.role !== "institution" && profile?.role !== "admin") redirect("/dashboard");

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h2 className="font-display text-3xl text-white mb-1">Settings</h2>
        <p className="text-white/40 font-body text-sm">Configure how your institution accepts payments and other defaults</p>
      </div>

      <Link href="/dashboard/institution/settings/payments"
        className="flex items-center justify-between p-5 rounded-2xl bg-white/[0.04] border border-white/[0.08] hover:border-gold-400/25 hover:bg-gold-400/[0.03] transition-all group">
        <div className="flex items-center gap-4">
          <div className="p-2.5 rounded-xl bg-gold-400/10 border border-gold-400/20">
            <CreditCard className="w-5 h-5 text-gold-400" />
          </div>
          <div>
            <p className="font-display text-lg text-white">Payment Settings</p>
            <p className="font-body text-sm text-white/45">Bank transfer + Wise details shown to students at checkout</p>
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-white/25 group-hover:text-gold-400/60 transition-colors" />
      </Link>
    </div>
  );
}
