import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin-client";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Briefcase, PlusCircle, Users, ChevronRight, Circle } from "lucide-react";

export const dynamic = "force-dynamic";

const STATUS_META: Record<string, { label: string; color: string; dot: string }> = {
  draft:  { label: "Draft",  color: "text-white/40",      dot: "bg-white/25"     },
  open:   { label: "Open",   color: "text-emerald-400",   dot: "bg-emerald-400"  },
  paused: { label: "Paused", color: "text-gold-400",      dot: "bg-gold-400"     },
  closed: { label: "Closed", color: "text-red-400/70",    dot: "bg-red-400/70"   },
  filled: { label: "Filled", color: "text-pathBlue-400",  dot: "bg-pathBlue-400" },
};

export default async function EmployerPostingsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const sp = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "employer") redirect("/dashboard");

  const filterStatus = sp.status ?? "";
  const db = createAdminClient();

  let query = db
    .from("internship_postings")
    .select(`
      id, title, department, work_type, location,
      monthly_allowance_sgd, duration_months, openings, status, created_at
    `)
    .eq("employer_id", user.id)
    .order("created_at", { ascending: false });

  if (filterStatus) query = query.eq("status", filterStatus);

  const { data: postings } = await query;

  // Candidacy counts per posting
  const postingIds = (postings ?? []).map((p: Record<string,unknown>) => p.id as string);
  const { data: countRows } = postingIds.length > 0
    ? await db
        .from("internship_candidacies")
        .select("posting_id, status")
        .in("posting_id", postingIds)
    : { data: [] };

  const countMap: Record<string, number> = {};
  for (const r of countRows ?? []) {
    const pid = (r as Record<string,unknown>).posting_id as string;
    countMap[pid] = (countMap[pid] ?? 0) + 1;
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-3xl text-white mb-1">Postings</h2>
          <p className="text-white/40 font-body text-sm">Manage your internship listings</p>
        </div>
        <Link
          href="/dashboard/employer/postings/new"
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500/15 border border-emerald-400/30 text-emerald-400 font-body text-sm font-semibold hover:bg-emerald-500/25 transition-all"
        >
          <PlusCircle className="w-4 h-4" /> New Posting
        </Link>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-2 flex-wrap">
        {[{ label: "All", value: "" }, ...Object.entries(STATUS_META).map(([v, m]) => ({ label: m.label, value: v }))].map(({ label, value }) => (
          <Link
            key={value}
            href={value ? `?status=${value}` : "?"}
            className={`px-3 py-1.5 rounded-lg font-body text-xs font-semibold transition-all ${
              filterStatus === value
                ? "bg-emerald-500/15 border border-emerald-400/30 text-emerald-400"
                : "bg-white/[0.04] border border-white/[0.08] text-white/45 hover:text-white/70"
            }`}
          >
            {label}
          </Link>
        ))}
      </div>

      {/* Postings list */}
      {(postings ?? []).length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white/[0.03] border border-white/[0.07] rounded-2xl">
          <Briefcase className="w-10 h-10 text-white/20 mb-3" />
          <p className="font-display text-xl text-white/40 mb-1">No postings yet</p>
          <p className="text-white/30 font-body text-sm mb-4">
            {filterStatus ? `No ${filterStatus} postings.` : "Create your first internship posting to start hiring."}
          </p>
          {!filterStatus && (
            <Link
              href="/dashboard/employer/postings/new"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-400/25 text-emerald-400 font-body text-sm font-semibold hover:bg-emerald-500/20 transition-all"
            >
              <PlusCircle className="w-4 h-4" /> Create Your First Posting
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {(postings ?? []).map((posting: Record<string,unknown>) => {
            const meta = STATUS_META[posting.status as string] ?? STATUS_META.draft;
            const applicantCount = countMap[posting.id as string] ?? 0;
            return (
              <Link key={posting.id as string} href={`/dashboard/employer/postings/${posting.id}`}>
                <div className="flex items-center justify-between gap-4 p-5 rounded-2xl bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.06] hover:border-white/[0.12] transition-all group">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-400/20 flex items-center justify-center flex-shrink-0">
                      <Briefcase className="w-5 h-5 text-emerald-400" strokeWidth={1.75} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-body font-semibold text-white/85 truncate">{posting.title as string}</p>
                        <span className={`inline-flex items-center gap-1 font-body text-[11px] font-semibold ${meta.color}`}>
                          <Circle className={`w-1.5 h-1.5 fill-current ${meta.dot}`} />
                          {meta.label}
                        </span>
                      </div>
                      <p className="font-body text-xs text-white/40 mt-0.5 truncate">
                        {posting.department ? `${posting.department} · ` : ""}
                        {posting.location as string} · {posting.work_type as string} ·{" "}
                        S${Number(posting.monthly_allowance_sgd).toLocaleString("en-SG")}/mo ·{" "}
                        {posting.duration_months as number}m · {posting.openings as number}{" "}
                        {Number(posting.openings) === 1 ? "opening" : "openings"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 flex-shrink-0">
                    <div className="text-right">
                      <div className="flex items-center gap-1.5 text-white/60">
                        <Users className="w-3.5 h-3.5" />
                        <span className="font-body text-sm font-semibold">{applicantCount}</span>
                      </div>
                      <p className="font-body text-[10px] text-white/30 mt-0.5">applicant{applicantCount !== 1 ? "s" : ""}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-white/25 group-hover:text-white/50 transition-colors" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
