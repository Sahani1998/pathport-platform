import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin-client";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Users, Search } from "lucide-react";

export const dynamic = "force-dynamic";

const STATUS_COLOR: Record<string, string> = {
  applied:              "text-white/55",
  under_review:         "text-pathBlue-400",
  shortlisted:          "text-pathBlue-400",
  interview_scheduled:  "text-gold-400",
  interview_completed:  "text-gold-400",
  offer_extended:       "text-emerald-400",
  offer_accepted:       "text-emerald-400",
  hired:                "text-emerald-400",
  started_internship:   "text-emerald-400",
  completed_internship: "text-gold-400",
  rejected:             "text-red-400/60",
  withdrawn:            "text-white/25",
  offer_declined:       "text-orange-400",
  cancelled:            "text-white/25",
};

const fmt = (s: string) => s.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());

export default async function EmployerCandidatesPage({
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

  const q = (sp.q ?? "").trim().toLowerCase();
  const statusFilter = (sp.status ?? "").trim();

  const db = createAdminClient();
  const { data: postingIds } = await db.from("postings").select("id").eq("employer_id", user.id);
  const ids = (postingIds ?? []).map(p => p.id as string);

  const { data: rowsRaw } = ids.length > 0
    ? await db
        .from("candidacies")
        .select(`
          id, status, applied_at,
          student:profiles!student_id(full_name, email, country),
          postings(id, title)
        `)
        .in("posting_id", ids)
        .order("applied_at", { ascending: false })
    : { data: [] };

  let rows = (rowsRaw ?? []).map(r => {
    const rec = r as Record<string, unknown>;
    const student = Array.isArray(rec.student) ? rec.student[0] : rec.student as Record<string, unknown> | null;
    const posting = Array.isArray(rec.postings) ? rec.postings[0] : rec.postings as Record<string, unknown> | null;
    return {
      id:        rec.id as string,
      status:    rec.status as string,
      applied_at: rec.applied_at as string,
      fullName:  (student?.full_name as string) ?? "—",
      email:     (student?.email as string) ?? "—",
      country:   (student?.country as string) ?? "—",
      postingId: (posting?.id as string) ?? "",
      postingTitle: (posting?.title as string) ?? "—",
    };
  });

  if (q) rows = rows.filter(r => r.fullName.toLowerCase().includes(q) || r.email.toLowerCase().includes(q) || r.postingTitle.toLowerCase().includes(q));
  if (statusFilter) rows = rows.filter(r => r.status === statusFilter);

  const statuses = Array.from(new Set((rowsRaw ?? []).map(r => (r as Record<string, unknown>).status as string)));

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <h2 className="font-display text-3xl text-white mb-1">Candidates</h2>
        <p className="text-white/40 font-body text-sm">All candidates across your postings — {rows.length} shown</p>
      </div>

      {/* Search + filter (URL-based) */}
      <form className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
          <input name="q" defaultValue={sp.q ?? ""} placeholder="Search name, email, posting…"
            className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-white/[0.05] border border-white/[0.10] text-white/90 font-body text-sm placeholder:text-white/25 focus:outline-none focus:border-emerald-400/40 transition-all" />
        </div>
        <select name="status" defaultValue={statusFilter}
          className="px-3 py-2.5 rounded-xl bg-white/[0.05] border border-white/[0.10] text-white/70 font-body text-sm focus:outline-none focus:border-emerald-400/40 transition-all">
          <option value="">All statuses</option>
          {statuses.map(s => <option key={s} value={s}>{fmt(s)}</option>)}
        </select>
        <button type="submit" className="px-5 py-2.5 rounded-xl bg-emerald-500/15 border border-emerald-400/30 text-emerald-400 font-body text-sm font-semibold hover:bg-emerald-500/25 transition-all">Filter</button>
      </form>

      {rows.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white/[0.03] border border-white/[0.07] rounded-2xl">
          <Users className="w-10 h-10 text-white/20 mb-3" />
          <p className="font-display text-xl text-white/40">No candidates found</p>
          <p className="text-white/30 font-body text-sm mt-1">{q || statusFilter ? "Try adjusting your filters." : "Applications will appear here."}</p>
        </div>
      ) : (
        <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl overflow-hidden divide-y divide-white/[0.05]">
          {rows.map(r => (
            <Link key={r.id} href={`/dashboard/employer/postings/${r.postingId}`}
              className="flex items-center justify-between gap-4 px-6 py-4 hover:bg-white/[0.02] transition-colors">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center flex-shrink-0 text-white font-display font-bold text-sm">
                  {r.fullName[0]?.toUpperCase() ?? "U"}
                </div>
                <div className="min-w-0">
                  <p className="font-body font-semibold text-sm text-white/85 truncate">{r.fullName}</p>
                  <p className="font-body text-xs text-white/40 truncate">{r.email} · {r.postingTitle}</p>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <p className={`font-body text-xs font-semibold ${STATUS_COLOR[r.status] ?? "text-white/50"}`}>{fmt(r.status)}</p>
                <p className="text-white/25 font-body text-[10px] mt-0.5">{new Date(r.applied_at).toLocaleDateString("en-SG", { day: "numeric", month: "short" })}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
