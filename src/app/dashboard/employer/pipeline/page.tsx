import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin-client";
import { redirect } from "next/navigation";
import { loadStudentProfiles } from "@/lib/student-profiles";
import Link from "next/link";
import { Users, ChevronRight } from "lucide-react";

export const dynamic = "force-dynamic";

const STATUS_COLOR: Record<string, string> = {
  applied:             "text-white/55",
  shortlisted:         "text-pathBlue-400",
  interview_scheduled: "text-gold-400",
  interview_completed: "text-gold-400",
  offer_extended:      "text-emerald-400",
  offer_accepted:      "text-emerald-400",
  hired:               "text-emerald-400",
  rejected:            "text-red-400/60",
  withdrawn:           "text-white/25",
  offer_declined:      "text-orange-400",
};

export default async function EmployerPipelinePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "employer") redirect("/dashboard");

  const db = createAdminClient();

  const { data: postingIds } = await db
    .from("postings")
    .select("id")
    .eq("employer_id", user.id);

  const ids = (postingIds ?? []).map((p: Record<string,unknown>) => p.id as string);

  const { data: candidacies } = ids.length > 0
    ? await db
        .from("candidacies")
        .select(`
          id, status, applied_at, student_id,
          postings(id, title)
        `)
        .in("posting_id", ids)
        .order("applied_at", { ascending: false })
    : { data: [] };

  // candidacies.student_id → auth.users (no FK to profiles) — batch-load profiles
  const profileMap = await loadStudentProfiles(db, (candidacies ?? []).map((c: Record<string,unknown>) => c.student_id as string));
  const rows = (candidacies ?? []).map((c: Record<string,unknown>) => ({ ...c, student: profileMap.get(c.student_id as string) ?? null }));

  const stages = [
    { key: "applied",             label: "Applied"              },
    { key: "shortlisted",         label: "Shortlisted"          },
    { key: "interview_scheduled", label: "Interview Scheduled"  },
    { key: "interview_completed", label: "Interview Completed"  },
    { key: "offer_extended",      label: "Offer Extended"       },
    { key: "offer_accepted",      label: "Offer Accepted"       },
    { key: "hired",               label: "Hired"                },
  ];

  const grouped: Record<string, typeof rows> = {};
  for (const s of stages) grouped[s.key] = [];
  for (const r of rows) {
    const s = (r as Record<string,unknown>).status as string;
    if (s in grouped) grouped[s].push(r);
  }

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <h2 className="font-display text-3xl text-white mb-1">Candidate Pipeline</h2>
        <p className="text-white/40 font-body text-sm">All candidates across your postings — {rows.length} total</p>
      </div>

      {rows.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white/[0.03] border border-white/[0.07] rounded-2xl">
          <Users className="w-10 h-10 text-white/20 mb-3" />
          <p className="font-display text-xl text-white/40 mb-1">No candidates yet</p>
          <p className="text-white/30 font-body text-sm">Publish a posting to start receiving applications.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {stages.map(stage => {
            const group = grouped[stage.key];
            if (!group || group.length === 0) return null;
            return (
              <div key={stage.key} className="bg-white/[0.04] border border-white/[0.08] rounded-2xl overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.07]">
                  <div className="flex items-center gap-3">
                    <h3 className={`font-display text-lg ${STATUS_COLOR[stage.key] ?? "text-white/70"}`}>{stage.label}</h3>
                    <span className="text-white/30 font-body text-sm">({group.length})</span>
                  </div>
                </div>
                <div className="divide-y divide-white/[0.05]">
                  {group.map((row: Record<string,unknown>) => {
                    const student = row.student as Record<string,unknown> | null;
                    const posting = Array.isArray(row.postings) ? row.postings[0] : row.postings as Record<string,unknown> | null;
                    return (
                      <Link
                        key={row.id as string}
                        href={`/dashboard/employer/postings/${posting?.id ?? ""}`}
                        className="flex items-center justify-between gap-4 px-6 py-4 hover:bg-white/[0.02] transition-colors group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center flex-shrink-0 text-white font-display font-bold text-sm">
                            {(String(student?.full_name ?? "").trim()[0] ?? "U").toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="font-body font-semibold text-sm text-white/85 truncate">{student?.full_name as string ?? "—"}</p>
                            <p className="font-body text-xs text-white/40 truncate">{posting?.title as string ?? "—"}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <p className="text-white/30 font-body text-xs">
                            {new Date(row.applied_at as string).toLocaleDateString("en-SG",{day:"numeric",month:"short"})}
                          </p>
                          <ChevronRight className="w-3.5 h-3.5 text-white/20 group-hover:text-white/45 transition-colors" />
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
