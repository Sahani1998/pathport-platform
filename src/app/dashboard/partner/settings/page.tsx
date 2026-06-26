import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import SettingsClient from "./SettingsClient";
import type { Profile } from "@/types/auth";

export const dynamic = "force-dynamic";

export default async function PartnerSettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles").select("*").eq("id", user.id).single();
  if (profile?.role !== "recruitment_partner") redirect("/dashboard");

  return <SettingsClient profile={profile as Profile} />;
}
