import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AdminOfferLettersClient from "@/components/admin/AdminOfferLettersClient";

export const metadata = { title: "Offer Letters — Admin" };

export default async function AdminOfferLettersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") redirect("/dashboard");

  // Fetch all offer letters with related context
  const [{ data: letterRows }, { data: colleges }] = await Promise.all([
    supabase
      .from("offer_letters")
      .select(`
        id, application_id, uploaded_by, file_path, file_name,
        file_size, version, notes, expiry_date, created_at, updated_at,
        applications (
          id, student_id, current_stage,
          courses (id, title, college_id, colleges (id, name)),
          profiles!applications_student_id_fkey (id, full_name, email)
        ),
        profiles!offer_letters_uploaded_by_fkey (full_name)
      `)
      .order("created_at", { ascending: false }),

    supabase
      .from("colleges")
      .select("id, name")
      .order("name"),
  ]);

  // Audit log — fetch recent offer-letter uploads
  const { data: auditRows } = await supabase
    .from("application_audit_log")
    .select("id, application_id, actor_id, actor_role, action, metadata, created_at, profiles!application_audit_log_actor_id_fkey(full_name)")
    .eq("action", "offer_letter_uploaded")
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div className="max-w-6xl space-y-6">
      <div>
        <h2 className="font-display text-3xl text-white mb-1">Offer Letters</h2>
        <p className="text-white/40 font-body text-sm">
          Search, filter, download, and audit all issued offer letters
        </p>
      </div>
      <AdminOfferLettersClient
        letterRows={letterRows ?? []}
        colleges={colleges ?? []}
        auditRows={auditRows ?? []}
      />
    </div>
  );
}
