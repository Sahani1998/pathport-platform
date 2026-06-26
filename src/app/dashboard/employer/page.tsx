import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin-client";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Briefcase, Building2, Users, CheckCircle2,
  Clock, ChevronRight, PlusCircle, BarChart2,
} from "lucide-react";

export const dynamic = "force-dynamic";

const CANDIDACY_STATUS_COLOR: Record<string, string> = {
  applied:             "text-white/50",
  shortlisted:         "text-pathBlue-400",
  interview_scheduled: "text-gold-400",
  interview_completed: "text-gold-400",
  offer_extended:      "text-emerald-400",
  offer_accepted:      "text-emerald-400",
  hired:               "text-emerald-400",
  rejected:            "text-red-400/70",
  withdrawn:           "text-white/30",
  offer_declined:      "text-orange-400",
};

export default async function EmployerDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name, email")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "employer") redirect("/dashboard");

  const db = createAdminClient();

  const [
    { data: company },
    { data: postingsRaw, count: totalPostings },
    { data: recentCandidacies },
  ] = await Promise.all([
    db.from("employer_companies").select("company_name, logo_url, industry, is_verified").eq("employer_id", user.id).maybeSingle(),
    db.from("internship_postings").select("id, title, status, openings, created_at", { count: "exact" }).eq("employer_id", user.id).order("created_at", { ascending: false }),
    db.from("internship_candidacies")
      .select(`
        id, status, applied_at,
        student:profiles!internship_candidacies_student_id_fkey(full_name, email),
        internship_postings(title)
      `)
      .in("posting_id",
        (await db.from("internship_postings").select("id").eq("employer_id", user.id)).data?.map((p: Record<string,unknown>) => p.id as string) ?? []
      )
      .order("applied_at", { ascending: false })
      .limit(6),
  ]);

  const postings = postingsRaw ?? [];
  const openPostings = postings.filter((p: Record<string,unknown>) => p.status === "open").length;
  const candidacies  = recentCandidacies ?? [];
  const totalApplicants = candidacies.length;
  const shortlisted = candidacies.filter((c: Record<string,unknown>) =>
    ["shortlisted","interview_scheduled","interview_completed","offer_extended","offer_accepted","hired"].includes(c.status as string)
  ).length;

  const companyName = company?.company_name ?? profile?.full_name ?? "Your Company";
  const hasCompanyProfile = !!company;

  return (
    <div className="space-y-7 max-w-6xl">

      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600/10 via-navy-900/80 to-navy-950 border border-white/[0.08] p-6 md:p-8">
        <div aria-hidden className="absolute -top-8 -right-8 w-56 h-56 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative flex items-center gap-3 mb-1">
          <Building2 className="w-4 h-4 text-emerald-400" />
          <p className="text-emerald-400/70 font-body text-xs font-semibold tracking-widest uppercase">Employer Portal</p>
          {company?.is_verified && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-400/30 text-emerald-400 font-body text-[10px] font-semibold">
              <CheckCircle2 className="w-3 h-3" /> Verified
            </span>
          )}
        </div>
        <h2 className="relative font-display text-4xl text-white mb-1">{companyName}</h2>
        {company?.industry && <p className="relative text-white/45 font-body text-sm">{company.industry} · Singapore</p>}
        {!company?.industry && <p className="relative text-white/45 font-body text-sm">Singapore · 6+6 Pathway Partner</p>}
      </div>

      {/* Setup nudge */}
      {!hasCompanyProfile && (
        <div className="p-5 rounded-2xl bg-gold-400/[0.06] border border-gold-400/25 flex items-start gap-4">
          <Building2 className="w-5 h-5 text-gold-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="font-body text-sm font-semibold text-white/85 mb-1">Complete your company profile</p>
            <p className="font-body text-xs text-white/50">Add your company details so students can see who they&apos;re applying to.</p>
          </div>
          <Link
            href="/dashboard/employer/company"
            className="flex-shrink-0 px-4 py-2 rounded-xl bg-gold-400/15 border border-gold-400/30 text-gold-400 font-body text-sm font-semibold hover:bg-gold-400/25 transition-all"
          >
            Set up →
          </Link>
        </div>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Open Postings",    value: String(openPostings),        icon: Briefcase,    gold: true,  href: "/dashboard/employer/postings" },
          { label: "Total Postings",   value: String(totalPostings ?? 0),  icon: BarChart2,    gold: false, href: "/dashboard/employer/postings" },
          { label: "Total Applicants", value: String(totalApplicants),     icon: Users,        gold: false, href: "/dashboard/employer/pipeline" },
          { label: "Shortlisted",      value: String(shortlisted),         icon: CheckCircle2, gold: false, href: "/dashboard/employer/pipeline" },
        ].map(({ label, value, icon: Icon, gold, href }) => (
          <Link key={label} href={href}>
            <div className={`relative rounded-2xl border p-5 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer ${
              gold ? "bg-emerald-500/[0.07] border-emerald-400/30" : "bg-white/[0.04] border-white/[0.08]"
            }`}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${
                gold ? "bg-gradient-to-br from-emerald-500 to-emerald-600" : "bg-white/[0.08] border border-white/10"
              }`}>
                <Icon className={`w-5 h-5 ${gold ? "text-white" : "text-emerald-400"}`} strokeWidth={1.75} />
              </div>
              <div className="font-display text-2xl text-white font-bold leading-none mb-1">{value}</div>
              <p className="text-white/45 font-body text-sm">{label}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Recent applicants */}
        <div className="lg:col-span-2 bg-white/[0.04] border border-white/[0.08] rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.07]">
            <h3 className="font-display text-xl text-white">Recent Applicants</h3>
            <Link href="/dashboard/employer/pipeline" className="text-emerald-400 hover:text-emerald-300 font-body text-xs font-semibold flex items-center gap-1 transition-colors">
              View all <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {candidacies.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-6">
              <Users className="w-10 h-10 text-white/20 mb-3" />
              <p className="font-display text-xl text-white/40 mb-1">No applicants yet</p>
              <p className="text-white/30 font-body text-sm text-center">Publish a job posting to start receiving applications from eligible students.</p>
              <Link
                href="/dashboard/employer/postings/new"
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-400/25 text-emerald-400 font-body text-sm font-semibold hover:bg-emerald-500/20 transition-all"
              >
                <PlusCircle className="w-4 h-4" /> Create Posting
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-white/[0.05]">
              {candidacies.map((row: Record<string,unknown>) => {
                const student = row.student as Record<string,unknown> | null;
                const posting = Array.isArray(row.internship_postings) ? row.internship_postings[0] : row.internship_postings as Record<string,unknown> | null;
                const status  = row.status as string;
                const color   = CANDIDACY_STATUS_COLOR[status] ?? "text-white/50";
                return (
                  <div key={row.id as string} className="px-6 py-4 flex items-center justify-between gap-4 hover:bg-white/[0.02] transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center flex-shrink-0 text-white font-display font-bold text-sm">
                        {String(student?.full_name ?? "U")[0].toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="font-body font-semibold text-sm text-white/85 truncate">{student?.full_name as string ?? "—"}</p>
                        <p className="font-body text-xs text-white/40 truncate mt-0.5">{posting?.title as string ?? "—"}</p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className={`font-body text-xs font-semibold ${color}`}>
                        {status.replace(/_/g, " ").replace(/\b\w/g, (l: string) => l.toUpperCase())}
                      </p>
                      <p className="text-white/25 font-body text-[10px] mt-0.5">
                        {new Date(row.applied_at as string).toLocaleDateString("en-SG", { day: "numeric", month: "short" })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-4">

          {/* Posting summary */}
          <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-lg text-white">Postings</h3>
              <Link href="/dashboard/employer/postings" className="text-emerald-400 hover:text-emerald-300 font-body text-xs font-semibold transition-colors">
                Manage →
              </Link>
            </div>
            {postings.length === 0 ? (
              <p className="text-white/30 font-body text-sm text-center py-2">No postings yet</p>
            ) : (
              <div className="space-y-2">
                {postings.slice(0, 4).map((p: Record<string,unknown>) => {
                  const statusColor: Record<string,string> = {
                    open:   "text-emerald-400", draft: "text-white/35",
                    paused: "text-gold-400",    closed: "text-red-400/60", filled: "text-pathBlue-400",
                  };
                  return (
                    <Link key={p.id as string} href={`/dashboard/employer/postings/${p.id}`}>
                      <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.05] transition-colors">
                        <p className="font-body text-sm text-white/80 font-semibold truncate">{p.title as string}</p>
                        <p className={`font-body text-[11px] font-semibold mt-0.5 ${statusColor[p.status as string] ?? "text-white/40"}`}>
                          {(p.status as string).toUpperCase()} · {p.openings as number} {Number(p.openings) === 1 ? "opening" : "openings"}
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
            <Link
              href="/dashboard/employer/postings/new"
              className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-400/25 text-emerald-400 font-body text-sm font-semibold hover:bg-emerald-500/20 transition-all"
            >
              <PlusCircle className="w-4 h-4" /> New Posting
            </Link>
          </div>

          {/* Quick links */}
          <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-5">
            <h3 className="font-display text-lg text-white mb-3">Quick Links</h3>
            <div className="space-y-1.5">
              {[
                { icon: Briefcase, label: "Manage Postings",  href: "/dashboard/employer/postings"  },
                { icon: Users,     label: "View Pipeline",    href: "/dashboard/employer/pipeline"  },
                { icon: Building2, label: "Company Profile",  href: "/dashboard/employer/company"   },
              ].map(({ icon: Icon, label, href }) => (
                <Link key={href} href={href} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/[0.05] transition-colors group">
                  <Icon className="w-4 h-4 text-emerald-400/70 flex-shrink-0" />
                  <span className="font-body text-sm text-white/60 group-hover:text-white/85 transition-colors">{label}</span>
                  <ChevronRight className="w-3.5 h-3.5 text-white/20 group-hover:text-white/40 ml-auto transition-colors" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
