import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Users } from "lucide-react";

export default async function AdminStudentsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") redirect("/dashboard");

  const { data: students } = await supabase
    .from("profiles")
    .select("id, full_name, email, phone, country, created_at")
    .eq("role", "student")
    .order("created_at", { ascending: false });

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <h2 className="font-display text-3xl text-white mb-1">All Students</h2>
        <p className="text-white/40 font-body text-sm">{students?.length ?? 0} registered student account{(students?.length ?? 0) !== 1 ? "s" : ""}</p>
      </div>

      {!students || students.length === 0 ? (
        <div className="flex flex-col items-center py-16 rounded-2xl bg-white/[0.03] border border-white/[0.07] text-white/25">
          <Users className="w-10 h-10 mb-3" />
          <p className="font-body text-sm">No students registered yet</p>
        </div>
      ) : (
        <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  {["Student", "Country", "Phone", "Joined"].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-white/30 font-body text-xs uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {students.map(s => (
                  <tr key={s.id} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-4">
                      <p className="font-body text-sm text-white/80 font-semibold">{s.full_name ?? "—"}</p>
                      <p className="font-body text-xs text-white/35">{s.email}</p>
                    </td>
                    <td className="px-5 py-4 font-body text-sm text-white/55">{s.country ?? "—"}</td>
                    <td className="px-5 py-4 font-body text-xs text-white/45">{s.phone ?? "—"}</td>
                    <td className="px-5 py-4 font-body text-xs text-white/35 whitespace-nowrap">
                      {new Date(s.created_at as string).toLocaleDateString("en-SG", { day: "numeric", month: "short", year: "2-digit" })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
