import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Building2, Globe } from "lucide-react";

export default async function AdminCollegesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") redirect("/dashboard");

  const { data: colleges } = await supabase
    .from("colleges")
    .select("id, name, slug, country, city, website, is_active, created_at")
    .order("name");

  const { data: courseCounts } = await supabase
    .from("courses")
    .select("college_id");

  const countByCollege: Record<string, number> = {};
  for (const c of (courseCounts ?? []) as { college_id: string }[]) {
    countByCollege[c.college_id] = (countByCollege[c.college_id] ?? 0) + 1;
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h2 className="font-display text-3xl text-white mb-1">Colleges</h2>
        <p className="text-white/40 font-body text-sm">All partner institutions on the PathPort platform</p>
      </div>

      <div className="p-4 rounded-2xl bg-gold-400/[0.06] border border-gold-400/20">
        <p className="font-body text-xs text-white/50">
          To add or modify colleges, run SQL in the Supabase dashboard. Full college management UI is planned for a future release.
        </p>
      </div>

      {!colleges || colleges.length === 0 ? (
        <div className="flex flex-col items-center py-16 rounded-2xl bg-white/[0.03] border border-white/[0.07] text-white/25">
          <Building2 className="w-10 h-10 mb-3" />
          <p className="font-body text-sm">No colleges in the database yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {colleges.map(c => (
            <div key={c.id} className="p-5 rounded-2xl bg-white/[0.04] border border-white/[0.08] space-y-3">
              <div className="flex items-start justify-between gap-3">
                <p className="font-body font-semibold text-sm text-white/85 leading-snug">{c.name}</p>
                <span className={`flex-shrink-0 px-2 py-0.5 rounded-full border font-body text-[10px] font-semibold ${
                  c.is_active ? "bg-emerald-500/10 border-emerald-400/30 text-emerald-400" : "bg-white/[0.05] border-white/10 text-white/30"
                }`}>
                  {c.is_active ? "Active" : "Inactive"}
                </span>
              </div>
              <div className="flex items-center gap-3 text-white/35 font-body text-xs">
                <Building2 className="w-3 h-3 flex-shrink-0" />
                <span>{c.city}, {c.country}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-body text-xs text-white/40">{countByCollege[c.id] ?? 0} course{(countByCollege[c.id] ?? 0) !== 1 ? "s" : ""}</span>
                {c.website && (
                  <a href={c.website} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1 text-pathBlue-400 font-body text-xs hover:text-pathBlue-300 transition-colors">
                    <Globe className="w-3 h-3" /> Website
                  </a>
                )}
              </div>
              <p className="font-body text-[10px] text-white/20 font-mono truncate">{c.id}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
