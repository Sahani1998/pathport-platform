import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ProfileEditForm from "@/components/profile/ProfileEditForm";

export const metadata = { title: "Edit Profile" };

export default async function ProfileEditPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, phone, country")
    .eq("id", user.id)
    .single();

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="font-display text-3xl text-white mb-1">Edit Profile</h2>
        <p className="text-white/40 font-body text-sm">Update your personal details</p>
      </div>
      <ProfileEditForm
        initialValues={{
          full_name: profile?.full_name ?? "",
          phone:     profile?.phone     ?? "",
          country:   profile?.country   ?? "",
        }}
      />
    </div>
  );
}
