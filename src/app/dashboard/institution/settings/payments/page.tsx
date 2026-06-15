import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, AlertCircle } from "lucide-react";
import PaymentSettingsForm from "@/components/payments/PaymentSettingsForm";
import type { CollegePaymentSettings } from "@/types/payment";

export const metadata = { title: "Payment Settings — Institution" };
export const dynamic  = "force-dynamic";

export default async function InstitutionPaymentSettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles").select("role, college_id").eq("id", user.id).single();

  if (profile?.role !== "institution" && profile?.role !== "admin") redirect("/dashboard");

  if (!profile?.college_id) {
    return (
      <div className="max-w-2xl">
        <Link href="/dashboard/institution/settings"
          className="inline-flex items-center gap-1.5 text-white/40 hover:text-white/70 font-body text-xs mb-4 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Settings
        </Link>
        <div className="flex items-start gap-3 p-6 rounded-2xl bg-gold-400/[0.07] border border-gold-400/25">
          <AlertCircle className="w-5 h-5 text-gold-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-body font-semibold text-white/80 mb-1">No college linked</p>
            <p className="font-body text-sm text-white/50">Ask a PathPort admin to link your account to a college first.</p>
          </div>
        </div>
      </div>
    );
  }

  const [{ data: college }, { data: settings }] = await Promise.all([
    supabase.from("colleges").select("id, name").eq("id", profile.college_id).single(),
    supabase.from("college_payment_settings").select("*").eq("college_id", profile.college_id).maybeSingle(),
  ]);

  return (
    <div className="max-w-3xl">
      <Link href="/dashboard/institution/settings"
        className="inline-flex items-center gap-1.5 text-white/40 hover:text-white/70 font-body text-xs mb-4 transition-colors">
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Settings
      </Link>

      <PaymentSettingsForm
        collegeId={profile.college_id}
        collegeName={college?.name ?? "Your College"}
        initial={settings as CollegePaymentSettings | null}
      />
    </div>
  );
}
