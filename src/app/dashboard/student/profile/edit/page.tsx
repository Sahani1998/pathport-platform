import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ProfileEditForm from "@/components/profile/ProfileEditForm";
import type { StudentEducation } from "@/types/auth";

export const metadata = { title: "Edit Profile" };

export default async function ProfileEditPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: profile }, { data: education }] = await Promise.all([
    supabase
      .from("profiles")
      .select(`
        full_name, phone, country, date_of_birth, nationality,
        passport_number, passport_country, passport_expiry,
        emergency_contact_name, emergency_contact_phone, emergency_contact_relationship
      `)
      .eq("id", user.id)
      .single(),
    supabase
      .from("student_education")
      .select("*")
      .eq("user_id", user.id)
      .order("end_year", { ascending: false, nullsFirst: false }),
  ]);

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="font-display text-3xl text-white mb-1">Edit Profile</h2>
        <p className="text-white/40 font-body text-sm">
          Complete your profile to speed up your Singapore college applications
        </p>
      </div>

      <ProfileEditForm
        personal={{
          full_name:     profile?.full_name     ?? "",
          phone:         profile?.phone         ?? "",
          country:       profile?.country       ?? "",
          date_of_birth: profile?.date_of_birth ?? "",
          nationality:   profile?.nationality   ?? "",
        }}
        passport={{
          passport_number:  profile?.passport_number  ?? "",
          passport_country: profile?.passport_country ?? "",
          passport_expiry:  profile?.passport_expiry  ?? "",
        }}
        emergency={{
          emergency_contact_name:         profile?.emergency_contact_name         ?? "",
          emergency_contact_phone:        profile?.emergency_contact_phone        ?? "",
          emergency_contact_relationship: profile?.emergency_contact_relationship ?? "",
        }}
        education={(education ?? []) as StudentEducation[]}
      />
    </div>
  );
}
