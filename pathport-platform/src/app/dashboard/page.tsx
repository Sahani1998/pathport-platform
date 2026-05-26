import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { UserRole } from "@/types/auth";
import { ROLE_META } from "@/types/auth";

/**
 * /dashboard → reads the user's role from their profile,
 * then redirects to the correct role-specific dashboard.
 */
export default async function DashboardIndexPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const role      = (profile?.role ?? "student") as UserRole;
  const roleMeta  = ROLE_META.find(r => r.value === role);
  const destPath  = roleMeta?.dashboardPath ?? "/dashboard/student";

  redirect(destPath);
}
