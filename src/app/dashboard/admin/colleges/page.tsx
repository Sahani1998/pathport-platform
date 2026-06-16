import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import CollegeManagementClient from "@/components/admin/CollegeManagementClient";

export const metadata = { title: "Colleges — Admin" };

export default async function AdminCollegesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") redirect("/dashboard");

  const [{ data: colleges }, { data: courseCounts }] = await Promise.all([
    supabase
      .from("colleges")
      .select("id, name, slug, country, city, website, is_active, short_code, created_at")
      .order("name"),
    supabase.from("courses").select("college_id"),
  ]);

  const countByCollege: Record<string, number> = {};
  for (const c of (courseCounts ?? []) as { college_id: string }[]) {
    countByCollege[c.college_id] = (countByCollege[c.college_id] ?? 0) + 1;
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h2 className="font-display text-3xl text-white mb-1">Colleges</h2>
        <p className="text-white/40 font-body text-sm">Manage partner institutions on the PathPort platform</p>
      </div>

      <CollegeManagementClient
        colleges={colleges ?? []}
        courseCounts={countByCollege}
      />
    </div>
  );
}
