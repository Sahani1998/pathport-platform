import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import MfaSetup from "@/components/auth/MfaSetup";

export const metadata = { title: "Two-Factor Authentication — PathPort Institution" };

export default async function InstitutionMfaPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login/institution");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "institution") redirect("/dashboard");

  return (
    <div className="max-w-2xl mx-auto py-10 px-4">
      <h1 className="text-2xl font-semibold text-gray-900 mb-8">Security Settings</h1>
      <MfaSetup />
    </div>
  );
}
