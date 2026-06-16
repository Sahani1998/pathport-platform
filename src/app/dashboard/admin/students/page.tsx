import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Users, Search, ChevronLeft, ChevronRight } from "lucide-react";

const PER_PAGE = 20;

export default async function AdminStudentsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const params   = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") redirect("/dashboard");

  const q    = (params.q ?? "").trim().slice(0, 120);
  const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1);

  // ── Paginated student list with optional name/email search ────────────────
  let query = supabase
    .from("profiles")
    .select("id, full_name, email, phone, country, created_at", { count: "exact" })
    .eq("role", "student")
    .order("created_at", { ascending: false });

  if (q) {
    const ilike = `%${q.replace(/[%_]/g, "")}%`;
    query = query.or(`full_name.ilike.${ilike},email.ilike.${ilike}`);
  }

  const from = (page - 1) * PER_PAGE;
  const { data: students, error, count } = await query.range(from, from + PER_PAGE - 1);

  if (error) console.error("[AdminStudents] query error:", error.code, error.message);

  const total      = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));

  const buildHref = (overrides: { page?: number; q?: string }) => {
    const sp = new URLSearchParams();
    const query = overrides.q ?? q;
    const p     = overrides.page ?? 1;
    if (query) sp.set("q", query);
    if (p > 1) sp.set("page", String(p));
    const s = sp.toString();
    return s ? `?${s}` : "?";
  };

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <h2 className="font-display text-3xl text-white mb-1">All Students</h2>
        <p className="text-white/40 font-body text-sm">
          {total} registered student account{total !== 1 ? "s" : ""}{q ? ` matching “${q}”` : ""}
        </p>
      </div>

      {/* Search */}
      <form method="GET" className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="Search by name or email…"
            className="w-full bg-white/[0.05] border border-white/[0.09] rounded-xl pl-10 pr-4 py-2.5 font-body text-sm text-white placeholder-white/25 focus:outline-none focus:border-gold-400/40"
          />
        </div>
        <button
          type="submit"
          className="px-4 py-2.5 rounded-xl bg-gold-400/10 border border-gold-400/25 text-gold-400 font-body text-sm font-semibold hover:bg-gold-400/20 transition-all"
        >
          Search
        </button>
        {q && (
          <Link
            href={buildHref({ q: "" })}
            className="px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white/45 font-body text-sm hover:border-white/20 hover:text-white/70 transition-all"
          >
            Clear
          </Link>
        )}
      </form>

      {!students || students.length === 0 ? (
        <div className="flex flex-col items-center py-16 rounded-2xl bg-white/[0.03] border border-white/[0.07] text-white/25">
          <Users className="w-10 h-10 mb-3" />
          <p className="font-body text-sm">
            {q ? `No students match “${q}”` : "No students registered yet"}
          </p>
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

          {/* Pagination */}
          <div className="px-5 py-3 border-t border-white/[0.06] flex items-center justify-between gap-2 flex-wrap">
            <p className="text-white/25 font-body text-xs">
              Showing {from + 1}–{Math.min(from + students.length, total)} of {total} student{total !== 1 ? "s" : ""}
            </p>
            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                {page > 1 ? (
                  <Link
                    href={buildHref({ page: page - 1 })}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/[0.05] border border-white/[0.09] text-white/55 font-body text-xs hover:border-gold-400/30 hover:text-gold-400 transition-all"
                  >
                    <ChevronLeft className="w-3 h-3" /> Prev
                  </Link>
                ) : (
                  <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/[0.05] text-white/20 font-body text-xs">
                    <ChevronLeft className="w-3 h-3" /> Prev
                  </span>
                )}
                <span className="text-white/35 font-body text-xs">Page {page} of {totalPages}</span>
                {page < totalPages ? (
                  <Link
                    href={buildHref({ page: page + 1 })}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/[0.05] border border-white/[0.09] text-white/55 font-body text-xs hover:border-gold-400/30 hover:text-gold-400 transition-all"
                  >
                    Next <ChevronRight className="w-3 h-3" />
                  </Link>
                ) : (
                  <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/[0.05] text-white/20 font-body text-xs">
                    Next <ChevronRight className="w-3 h-3" />
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
