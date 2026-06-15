import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import PaymentSettingsForm from "@/components/payments/PaymentSettingsForm";
import type { CollegePaymentSettings } from "@/types/payment";

export const metadata = { title: "College Payment Settings — Admin" };
export const dynamic  = "force-dynamic";

export default async function AdminCollegePaymentSettingsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: collegeId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") redirect("/dashboard");

  const [{ data: college }, { data: settings }] = await Promise.all([
    supabase.from("colleges").select("id, name").eq("id", collegeId).single(),
    supabase.from("college_payment_settings").select("*").eq("college_id", collegeId).maybeSingle(),
  ]);

  if (!college) notFound();

  return (
    <div className="max-w-3xl">
      <Link href="/dashboard/admin/colleges"
        className="inline-flex items-center gap-1.5 text-white/40 hover:text-white/70 font-body text-xs mb-4 transition-colors">
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Colleges
      </Link>

      <PaymentSettingsForm
        collegeId={collegeId}
        collegeName={college.name}
        initial={settings as CollegePaymentSettings | null}
        isAdminView
      />
    </div>
  );
}
