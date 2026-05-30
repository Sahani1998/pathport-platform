import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Award } from "lucide-react";

export default async function AdminPartnersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") redirect("/dashboard");

  const { data: partners } = await supabase
    .from("partner_applications")
    .select("id, org_name, contact_name, email, partner_type, country, status, created_at")
    .order("created_at", { ascending: false });

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h2 className="font-display text-3xl text-white mb-1">Partners</h2>
        <p className="text-white/40 font-body text-sm">Institutions, recruitment partners, and employers who applied to join PathPort</p>
      </div>

      {!partners || partners.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 rounded-2xl bg-white/[0.03] border border-white/[0.07]">
          <div className="w-16 h-16 rounded-2xl bg-gold-400/[0.08] border border-gold-400/20 flex items-center justify-center mb-4">
            <Award className="w-7 h-7 text-gold-400" />
          </div>
          <p className="font-display text-xl text-white/40 mb-1">No partner applications yet</p>
          <p className="text-white/25 font-body text-sm">Partner applications from the homepage will appear here</p>
        </div>
      ) : (
        <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  {["Organisation", "Type", "Country", "Status", "Applied"].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-white/30 font-body text-xs uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {partners.map(p => (
                  <tr key={p.id} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-4">
                      <p className="font-body text-sm text-white/80 font-semibold">{p.org_name}</p>
                      <p className="font-body text-xs text-white/35">{p.contact_name} · {p.email}</p>
                    </td>
                    <td className="px-5 py-4 font-body text-xs text-white/55 capitalize">{p.partner_type?.replace(/_/g, " ")}</td>
                    <td className="px-5 py-4 font-body text-xs text-white/55">{p.country}</td>
                    <td className="px-5 py-4">
                      <span className={`px-2.5 py-0.5 rounded-full border font-body text-[11px] font-semibold ${
                        p.status === "approved" ? "bg-emerald-500/10 border-emerald-400/30 text-emerald-400" :
                        p.status === "rejected" ? "bg-red-500/10 border-red-400/30 text-red-400" :
                                                  "bg-gold-400/10 border-gold-400/30 text-gold-400"
                      }`}>
                        {p.status ?? "pending"}
                      </span>
                    </td>
                    <td className="px-5 py-4 font-body text-xs text-white/35 whitespace-nowrap">
                      {new Date(p.created_at as string).toLocaleDateString("en-SG", { day: "numeric", month: "short", year: "2-digit" })}
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
